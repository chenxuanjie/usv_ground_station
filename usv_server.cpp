/**
 * USV All-in-One Server (C++ Backend) - Fixed
 * 功能: 
 * 1. HTTP Server: 托管静态网页 (index.html)
 * 2. WebSocket Server: 与前端实时通信
 * 3. TCP Client: 连接无人艇服务器 (转发数据)
 * 4. Config: 配置文件读写 (config.ini)
 * * 编译: g++ usv_server.cpp -o usv_server -pthread -std=c++11
 * 运行: ./usv_server
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
 #include <sstream>
 #include <map>
 
 using namespace std;
 
 // === 配置文件管理 ===
 struct AppConfig {
     string boat_ip = "120.77.0.8";
     int boat_port = 6202;
     int local_web_port = 8080; // Web服务端口
 };
 
 AppConfig g_config;
 const string CONFIG_FILE = "config.ini";
 
 void load_config() {
     ifstream file(CONFIG_FILE);
     if (file.is_open()) {
         string line;
         while (getline(file, line)) {
             if (line.empty() || line[0] == '#') continue;
             auto delimiterPos = line.find("=");
             if (delimiterPos != string::npos) {
                 string key = line.substr(0, delimiterPos);
                 string value = line.substr(delimiterPos + 1);
                 // 简单的去空格处理
                 key.erase(0, key.find_first_not_of(" \t"));
                 key.erase(key.find_last_not_of(" \t") + 1);
                 value.erase(0, value.find_first_not_of(" \t"));
                 value.erase(value.find_last_not_of(" \t") + 1);
 
                 if (key == "boat_ip") g_config.boat_ip = value;
                 else if (key == "boat_port") g_config.boat_port = stoi(value);
                 else if (key == "local_web_port") g_config.local_web_port = stoi(value);
             }
         }
         cout << "[Config] Loaded from " << CONFIG_FILE << endl;
     } else {
         ofstream outfile(CONFIG_FILE);
         outfile << "boat_ip=" << g_config.boat_ip << endl;
         outfile << "boat_port=" << g_config.boat_port << endl;
         outfile << "local_web_port=" << g_config.local_web_port << endl;
         cout << "[Config] Default config created: " << CONFIG_FILE << endl;
     }
 }
 
 // === 全局状态 ===
 int g_boat_sock = -1;
 int g_web_client_sock = -1; // 简单起见，暂支持单用户控制
 bool g_running = true;
 mutex g_boat_mutex; // 保护 Socket 发送
 
 // === WebSocket 辅助函数 (Base64 & SHA1 简化版) ===
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
             char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6); // 修复括号
             char_array_4[3] = char_array_3[2] & 0x3f;
             for(i = 0; (i <4) ; i++) ret += base64_chars[char_array_4[i]];
             i = 0;
         }
     }
     if (i) {
         for(j = i; j < 3; j++) char_array_3[j] = '\0';
         char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
         char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
         char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6); // 修复括号
         for (j = 0; (j < i + 1); j++) ret += base64_chars[char_array_4[j]];
         while((i++ < 3)) ret += '=';
     }
     return ret;
 }
 
 string compute_accept_key(string client_key) {
     string magic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
     string src = client_key + magic;
     // 调用系统命令计算 sha1，避免引入庞大的库
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
 
 // === HTTP & WebSocket 逻辑 ===
 
 void send_ws_frame(string msg) {
     if (g_web_client_sock < 0) return;
     vector<unsigned char> frame;
     frame.push_back(0x81); // Text frame
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
 
 void serve_html_file(int client_sock) {
     ifstream f("index.html", ios::binary); // 读取同目录下的 index.html
     if (f) {
         string content((istreambuf_iterator<char>(f)), istreambuf_iterator<char>());
         string header = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: " + to_string(content.length()) + "\r\n\r\n";
         send(client_sock, header.c_str(), header.length(), 0);
         send(client_sock, content.c_str(), content.length(), 0);
         cout << "[Web] Served index.html" << endl;
     } else {
         string msg = "HTTP/1.1 404 Not Found\r\n\r\n<h1>404: index.html not found</h1><p>Please place the html file in the same directory.</p>";
         send(client_sock, msg.c_str(), msg.length(), 0);
         cout << "[Web] Error: index.html not found" << endl;
     }
 }
 
 // 无人艇数据监听线程 (仅在连接成功后由主逻辑启动)
void boat_listener_loop() {
    char buffer[4096];
    cout << "[Boat] Listener thread started." << endl;

    while (g_running) {
        if (g_boat_sock < 0) break; // 双重保险

        int len = recv(g_boat_sock, buffer, sizeof(buffer) - 1, 0);
        if (len <= 0) {
            cout << "[Boat] Connection closed by remote or error." << endl;
            close(g_boat_sock);
            g_boat_sock = -1;
            
            // 通知前端已断开
            send_ws_frame("TCP_STATUS,OFFLINE");
            break; // 退出线程
        }
        buffer[len] = '\0';
        send_ws_frame(string(buffer));
    }
    cout << "[Boat] Listener thread stopped." << endl;
}
 
 // 处理新的 Web 连接（HTTP 请求或 WS 升级）
 void handle_web_client(int client_sock) {
     char buffer[4096];
     int len = recv(client_sock, buffer, sizeof(buffer), 0);
     if (len <= 0) { close(client_sock); return; }
     
     string req(buffer, len);
 
     // 1. 判断是否是 WebSocket 升级请求
     if (req.find("Upgrade: websocket") != string::npos) {
         string key_header = "Sec-WebSocket-Key: ";
         auto pos = req.find(key_header);
         if (pos != string::npos) {
             pos += key_header.length();
             auto end = req.find("\r\n", pos);
             string key = req.substr(pos, end - pos);
             string accept_key = compute_accept_key(key);
             
             string resp = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept_key + "\r\n\r\n";
             send(client_sock, resp.c_str(), resp.length(), 0);
             
             // 升级成功，接管 Socket
             if(g_web_client_sock != -1) close(g_web_client_sock); // 踢掉旧连接
             g_web_client_sock = client_sock;
             cout << "[Web] WebSocket Client Connected." << endl;
             
             // 进入 WS 读取循环
             unsigned char ws_buf[4096];

             while (true) {
                 int n = recv(client_sock, ws_buf, sizeof(ws_buf), 0);
                 if (n <= 0) break;
                 
                 // 1. 解析 WS 帧 (Masking handling)
                 int payload_len = ws_buf[1] & 0x7F;
                 int head_len = 2;
                 if (payload_len == 126) head_len = 4;
                 unsigned char mask[4];
                 memcpy(mask, ws_buf + head_len, 4);
                 head_len += 4;
                 
                 // === 必须包含这段解码代码，否则 decoded 未定义 ===
                 string decoded;
                 for(int i=0; i<payload_len; i++) {
                     decoded += (char)(ws_buf[head_len+i] ^ mask[i%4]);
                 }
                 // ===========================================
                 
                 // 2. 逻辑处理核心
                 if (!decoded.empty()) {
                     
                     // --- 情况 A: 收到连接指令 ---
                     if (decoded.find("CMD,CONNECT") == 0) {
                         // 格式: CMD,CONNECT,IP,PORT
                         string ip_str, port_str;
                         size_t p1 = decoded.find(',');
                         size_t p2 = decoded.find(',', p1 + 1);
                         size_t p3 = decoded.find(',', p2 + 1);
                         
                         // 解析参数，如果没传就用默认配置
                         if (p2 != string::npos && p3 != string::npos) {
                             ip_str = decoded.substr(p2 + 1, p3 - p2 - 1);
                             port_str = decoded.substr(p3 + 1);
                         } else {
                             ip_str = g_config.boat_ip;
                             port_str = to_string(g_config.boat_port);
                         }

                         cout << "[Cmd] Connecting to " << ip_str << ":" << port_str << "..." << endl;

                         // 先关闭可能存在的旧连接
                         {
                             lock_guard<mutex> lock(g_boat_mutex);
                             if (g_boat_sock != -1) {
                                 close(g_boat_sock);
                                 g_boat_sock = -1;
                             }
                         }

                         // 发起新连接
                         struct sockaddr_in boat_addr;
                         boat_addr.sin_family = AF_INET;
                         boat_addr.sin_port = htons(stoi(port_str));
                         inet_pton(AF_INET, ip_str.c_str(), &boat_addr.sin_addr);

                         int new_sock = socket(AF_INET, SOCK_STREAM, 0);
                         
                         // 设置3秒超时，防止界面卡死
                         struct timeval timeout;      
                         timeout.tv_sec = 3; timeout.tv_usec = 0;
                         setsockopt(new_sock, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));

                         if (connect(new_sock, (struct sockaddr*)&boat_addr, sizeof(boat_addr)) == 0) {
                             {
                                 lock_guard<mutex> lock(g_boat_mutex);
                                 g_boat_sock = new_sock;
                             }
                             cout << "[Boat] Connect Success!" << endl;
                             send_ws_frame("TCP_STATUS,ONLINE"); // 告诉网页：连接成功
                             
                             // *** 关键：连接成功后，手动启动监听线程 ***
                             thread(boat_listener_loop).detach();
                         } else {
                             perror("[Boat] Connect Failed");
                             close(new_sock);
                             send_ws_frame("TCP_STATUS,FAILED"); // 告诉网页：连接失败
                         }
                     }
                     // --- 情况 B: 收到断开指令 ---
                     else if (decoded.find("CMD,DISCONNECT") == 0) {
                         lock_guard<mutex> lock(g_boat_mutex);
                         if (g_boat_sock != -1) {
                             close(g_boat_sock); // 关闭 Socket 会自动终结 listener 线程
                             g_boat_sock = -1;
                         }
                         send_ws_frame("TCP_STATUS,OFFLINE");
                         cout << "[Cmd] Manually disconnected." << endl;
                     }
                     // --- 情况 C: 普通指令 (转发给无人艇) ---
                     else {
                         cout << "[Web -> Boat] " << decoded << endl;
                         lock_guard<mutex> lock(g_boat_mutex);
                         if (g_boat_sock != -1) send(g_boat_sock, decoded.c_str(), decoded.length(), 0);
                     }
                 }
             }

             
             cout << "[Web] WebSocket Client Disconnected." << endl;
             g_web_client_sock = -1;
             close(client_sock);
         }
     } 
     // 2. 普通 HTTP GET 请求 -> 返回 HTML 文件
     else if (req.find("GET / HTTP") != string::npos) {
         serve_html_file(client_sock);
         close(client_sock); // HTTP 短连接
     } 
     else {
         close(client_sock);
     }
 }
 
 int main() {
     load_config(); // 加载配置
     
 
     // 启动 Web Server 监听
     int server_fd = socket(AF_INET, SOCK_STREAM, 0);
     int opt = 1;
     setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
     struct sockaddr_in address;
     address.sin_family = AF_INET;
     address.sin_addr.s_addr = INADDR_ANY;
     address.sin_port = htons(g_config.local_web_port);
 
     if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
         perror("Web Server Bind failed"); return -1;
     }
     listen(server_fd, 3);
     
     cout << "========================================" << endl;
     cout << " USV Server Started " << endl;
     cout << " Web UI: http://<Your-IP>:" << g_config.local_web_port << endl;
     cout << " Boat Server: " << g_config.boat_ip << ":" << g_config.boat_port << endl;
     cout << " Config saved in: " << CONFIG_FILE << endl;
     cout << "========================================" << endl;
 
     while (g_running) {
         int client_sock = accept(server_fd, NULL, NULL);
         if (client_sock >= 0) {
             thread(handle_web_client, client_sock).detach();
         }
     }
     return 0;
 }