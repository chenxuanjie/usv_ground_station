/**
 * USV Server (Stable & CPU Optimized)
 * 编译: g++ usv_server.cpp -o usv_server -pthread -std=c++11
 */

 #include <iostream>
 #include <fstream>
 #include <string>
 #include <vector>
 #include <thread>
 #include <mutex>
 #include <algorithm>
 #include <cstring>
 #include <sys/socket.h>
 #include <arpa/inet.h>
 #include <unistd.h>
 #include <netinet/in.h>
 #include <fcntl.h>
 #include <sys/select.h>
 #include <chrono>
 
 using namespace std;
 
 // === 配置文件 ===
 struct AppConfig {
     string boat_ip = "120.77.0.8";
     int boat_port = 6204;
     int local_web_port = 8080;
 };
 AppConfig g_config;
 const string CONFIG_FILE = "config.ini";
 
 // === 全局状态 ===
 int g_boat_sock = -1;
 int g_web_client_sock = -1;
 bool g_running = true;
 bool g_enable_tcp = false;    
 bool g_tcp_connected = false; 
 mutex g_boat_mutex;
 
 // 频次限制 (1秒冷却)
 auto g_last_action_time = std::chrono::steady_clock::now();
 
 // === 配置读写 ===
 void load_config() {
     ifstream file(CONFIG_FILE);
     if (file.is_open()) {
         string line;
         while (getline(file, line)) {
             if (line.empty() || line[0] == '#') continue;
             auto pos = line.find("=");
             if (pos != string::npos) {
                 string key = line.substr(0, pos);
                 string val = line.substr(pos + 1);
                 key.erase(0, key.find_first_not_of(" \t")); key.erase(key.find_last_not_of(" \t") + 1);
                 val.erase(0, val.find_first_not_of(" \t")); val.erase(val.find_last_not_of(" \t") + 1);
                 if (key == "boat_ip") g_config.boat_ip = val;
                 else if (key == "boat_port") g_config.boat_port = stoi(val);
                 else if (key == "local_web_port") g_config.local_web_port = stoi(val);
             }
         }
     }
 }
 void save_config() {
     ofstream outfile(CONFIG_FILE);
     outfile << "boat_ip=" << g_config.boat_ip << endl;
     outfile << "boat_port=" << g_config.boat_port << endl;
     outfile << "local_web_port=" << g_config.local_web_port << endl;
 }
 
 // === WebSocket Utils ===
 static const string base64_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
 string base64_encode(const unsigned char* bytes_to_encode, unsigned int in_len) {
     string ret;
     int i = 0, j = 0;
     unsigned char char_array_3[3], char_array_4[4];
     while (in_len--) {
         char_array_3[i++] = *(bytes_to_encode++);
         if (i == 3) {
             char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
             char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
             char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
             char_array_4[3] = char_array_3[2] & 0x3f;
             for(i = 0; (i <4) ; i++) ret += base64_chars[char_array_4[i]];
             i = 0;
         }
     }
     if (i) {
         for(j = i; j < 3; j++) char_array_3[j] = '\0';
         char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
         char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
         char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
         for (j = 0; (j < i + 1); j++) ret += base64_chars[char_array_4[j]];
         while((i++ < 3)) ret += '=';
     }
     return ret;
 }
 
 string compute_accept_key(string client_key) {
     string magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
     string src = client_key + magic;
     string cmd = "echo -n \"" + src + "\" | sha1sum | awk '{print $1}'";
     char buffer[128];
     string sha1_hex;
     FILE* pipe = popen(cmd.c_str(), "r");
     if (!pipe) return "";
     while (fgets(buffer, sizeof buffer, pipe) != NULL) sha1_hex += buffer;
     pclose(pipe);
     if (!sha1_hex.empty() && sha1_hex.back() == '\n') sha1_hex.pop_back();
     vector<unsigned char> sha1_bin;
     for(size_t i=0; i<sha1_hex.length(); i+=2) {
         string byteString = sha1_hex.substr(i, 2);
         unsigned char byte = (unsigned char)strtol(byteString.c_str(), NULL, 16);
         sha1_bin.push_back(byte);
     }
     return base64_encode(sha1_bin.data(), sha1_bin.size());
 }
 
 // === Network Logic ===
 
 void send_ws_frame(string msg) {
     if (g_web_client_sock < 0) return;
     vector<unsigned char> frame;
     frame.push_back(0x81); 
     if (msg.length() <= 125) {
         frame.push_back((unsigned char)msg.length());
     } else if (msg.length() <= 65535) {
         frame.push_back(126);
         frame.push_back((msg.length() >> 8) & 0xFF);
         frame.push_back(msg.length() & 0xFF);
     }
     frame.insert(frame.end(), msg.begin(), msg.end());
     send(g_web_client_sock, frame.data(), frame.size(), 0);
 }
 
 // 带超时的连接函数
 int connect_with_timeout(const char* ip, int port, int timeout_sec) {
     int sock = socket(AF_INET, SOCK_STREAM, 0);
     if (sock < 0) return -1;
 
     // 设置非阻塞
     int flags = fcntl(sock, F_GETFL, 0);
     fcntl(sock, F_SETFL, flags | O_NONBLOCK);
 
     struct sockaddr_in addr;
     memset(&addr, 0, sizeof(addr));
     addr.sin_family = AF_INET;
     addr.sin_port = htons(port);
     inet_pton(AF_INET, ip, &addr.sin_addr);
 
     int res = connect(sock, (struct sockaddr*)&addr, sizeof(addr));
     if (res < 0) {
         if (errno == EINPROGRESS) {
             fd_set myset;
             FD_ZERO(&myset);
             FD_SET(sock, &myset);
             struct timeval tv;
             tv.tv_sec = timeout_sec;
             tv.tv_usec = 0;
             if (select(sock + 1, NULL, &myset, NULL, &tv) > 0) {
                 int so_error;
                 socklen_t len = sizeof(so_error);
                 getsockopt(sock, SOL_SOCKET, SO_ERROR, &so_error, &len);
                 if (so_error == 0) {
                     fcntl(sock, F_SETFL, flags); // 恢复阻塞
                     return sock;
                 }
             }
         }
     } else {
         fcntl(sock, F_SETFL, flags);
         return sock;
     }
 
     close(sock);
     return -1;
 }
 
 void serve_html_file(int client_sock) {
     ifstream f("index.html", ios::binary);
     if (f) {
         string content((istreambuf_iterator<char>(f)), istreambuf_iterator<char>());
         string header = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: " + to_string(content.length()) + "\r\n\r\n";
         send(client_sock, header.c_str(), header.length(), 0);
         send(client_sock, content.c_str(), content.length(), 0);
     } else {
         string msg = "HTTP/1.1 404 Not Found\r\n\r\n<h1>404: index.html not found</h1>";
         send(client_sock, msg.c_str(), msg.length(), 0);
     }
 }
 
 // TCP 维护线程 (已修复死循环问题)
 void boat_listener_loop() {
     char buffer[4096];
     while (g_running) {
         // 1. 如果开关未开启
         if (!g_enable_tcp) {
             if (g_boat_sock != -1) {
                 close(g_boat_sock);
                 g_boat_sock = -1;
                 g_tcp_connected = false;
                 send_ws_frame("TCP_STATUS,OFFLINE");
                 cout << "[Boat] Connection closed by user." << endl;
             }
             // 降低空转时的 CPU 占用
             this_thread::sleep_for(chrono::milliseconds(200));
             continue;
         }
 
         // 2. 需要连接但未连接
         if (g_boat_sock < 0) {
             cout << "[Boat] Connecting to " << g_config.boat_ip << ":" << g_config.boat_port << " (Timeout 3s)..." << endl;
             int new_sock = connect_with_timeout(g_config.boat_ip.c_str(), g_config.boat_port, 3);
             
             if (new_sock >= 0) {
                 g_boat_sock = new_sock;
                 g_tcp_connected = true;
                 cout << "[Boat] Connected Successfully!" << endl;
                 send_ws_frame("TCP_STATUS,ONLINE");
             } else {
                 cout << "[Boat] Connection Failed." << endl;
                 send_ws_frame("TCP_STATUS,FAILED");
                 g_enable_tcp = false; // 关键：失败后停止自动重试，防止死循环
                 
                 // 强制冷却，防止前端未收到状态时疯狂重试
                 this_thread::sleep_for(chrono::milliseconds(1000));
             }
             continue; // 重新进入循环检查状态
         }
 
         // 3. 已连接，读取数据
         // recv 默认是阻塞的，但如果连接断开会立即返回
         int len = recv(g_boat_sock, buffer, sizeof(buffer) - 1, 0);
         
         if (len > 0) {
             buffer[len] = '\0';
             send_ws_frame(string(buffer));
         } else {
             // 连接断开 (len == 0 or -1)
             cout << "[Boat] Disconnected unexpectedly." << endl;
             close(g_boat_sock);
             g_boat_sock = -1;
             g_tcp_connected = false;
             g_enable_tcp = false; // 关键：意外断开后停止自动重连，避免“反复横跳”
             send_ws_frame("TCP_STATUS,OFFLINE");
             
             // 冷却时间，防止瞬间 CPU 飙升
             this_thread::sleep_for(chrono::milliseconds(1000)); 
         }
     }
 }
 
 void handle_web_client(int client_sock) {
     char buffer[4096];
     int len = recv(client_sock, buffer, sizeof(buffer), 0);
     if (len <= 0) { close(client_sock); return; }
     
     string req(buffer, len);
     if (req.find("Upgrade: websocket") != string::npos) {
         // WebSocket Handshake
         string key_header = "Sec-WebSocket-Key: ";
         auto pos = req.find(key_header);
         if (pos != string::npos) {
             pos += key_header.length();
             auto end = req.find("\r\n", pos);
             string key = req.substr(pos, end - pos);
             string accept_key = compute_accept_key(key);
             string resp = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept_key + "\r\n\r\n";
             send(client_sock, resp.c_str(), resp.length(), 0);
             
             if(g_web_client_sock != -1) close(g_web_client_sock);
             g_web_client_sock = client_sock;
             
             // 初始状态推送
             string config_msg = "CURRENT_CONFIG," + g_config.boat_ip + "," + to_string(g_config.boat_port);
             send_ws_frame(config_msg);
             if (g_tcp_connected) send_ws_frame("TCP_STATUS,ONLINE");
             else send_ws_frame("TCP_STATUS,OFFLINE");
 
             unsigned char ws_buf[4096];
             while (true) {
                 int n = recv(client_sock, ws_buf, sizeof(ws_buf), 0);
                 if (n <= 0) break;
                 // Parse WS Frame
                 int payload_len = ws_buf[1] & 0x7F;
                 int head_len = 2;
                 if (payload_len == 126) head_len = 4;
                 unsigned char mask[4];
                 memcpy(mask, ws_buf + head_len, 4);
                 head_len += 4;
                 string decoded;
                 for(int i=0; i<payload_len; i++) decoded += (char)(ws_buf[head_len+i] ^ mask[i%4]);
                 
                 if (!decoded.empty()) {
                     // === 指令处理 ===
                     
                     // 检查操作间隔 (1秒)
                     auto now = std::chrono::steady_clock::now();
                     bool is_connect_cmd = (decoded.find("CMD,CONNECT") == 0 || decoded == "CMD,DISCONNECT");
                     
                     if (is_connect_cmd) {
                         auto diff = std::chrono::duration_cast<std::chrono::milliseconds>(now - g_last_action_time).count();
                         if (diff < 1000) {
                             cout << "[Web] Action ignored (Too fast)" << endl;
                             continue; // 忽略过快的点击
                         }
                         g_last_action_time = now;
                     }
 
                     if (decoded.find("CMD,CONNECT") == 0) {
                         string content = decoded.substr(12);
                         size_t comma = content.find(",");
                         if (comma != string::npos) {
                             string new_ip = content.substr(0, comma);
                             string new_port = content.substr(comma + 1);
                             g_config.boat_ip = new_ip;
                             g_config.boat_port = stoi(new_port);
                             save_config();
                             
                             // 重置连接
                             if (g_boat_sock != -1) { close(g_boat_sock); g_boat_sock = -1; }
                             g_enable_tcp = true;
                             cout << "[Web] CMD: Connect to " << new_ip << ":" << new_port << endl;
                         }
                     } 
                     else if (decoded == "CMD,DISCONNECT") {
                         g_enable_tcp = false;
                         cout << "[Web] CMD: Disconnect" << endl;
                     }
                     else if (decoded == "GET_CONFIG") {
                          string msg = "CURRENT_CONFIG," + g_config.boat_ip + "," + to_string(g_config.boat_port);
                          send_ws_frame(msg);
                     }
                     else {
                         // 转发数据
                         lock_guard<mutex> lock(g_boat_mutex);
                         if (g_boat_sock != -1) send(g_boat_sock, decoded.c_str(), decoded.length(), 0);
                     }
                 }
             }
             g_web_client_sock = -1;
             close(client_sock);
         }
     } else if (req.find("GET / HTTP") != string::npos) {
         serve_html_file(client_sock);
         close(client_sock);
     } else {
         close(client_sock);
     }
 }
 
 int main() {
     load_config();
     thread(boat_listener_loop).detach();
     int server_fd = socket(AF_INET, SOCK_STREAM, 0);
     int opt = 1;
     setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
     struct sockaddr_in address;
     address.sin_family = AF_INET;
     address.sin_addr.s_addr = INADDR_ANY;
     address.sin_port = htons(g_config.local_web_port);
     if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) return -1;
     listen(server_fd, 3);
     
     cout << "==========================================" << endl;
     cout << " USV Server (Stable)" << endl;
     cout << " Web UI: http://127.0.0.1:" << g_config.local_web_port << endl;
     cout << "==========================================" << endl;
     
     while (g_running) {
         int client_sock = accept(server_fd, NULL, NULL);
         if (client_sock >= 0) thread(handle_web_client, client_sock).detach();
     }
     return 0;
 }