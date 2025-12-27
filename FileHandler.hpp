#ifndef FILE_HANDLER_HPP
#define FILE_HANDLER_HPP

#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include <vector>

#ifdef _WIN32
    #include <winsock2.h>
#else
    #include <sys/socket.h>
    #include <unistd.h>
#endif

class FileHandler {
public:
    /**
     * 发送文件给客户端
     * @param clientSocket 客户端套接字
     * @param filePath 本地文件路径 (例如 "map_stream.html")
     */
    static void sendFile(int clientSocket, const std::string& filePath) {
        std::ifstream file(filePath, std::ios::binary);
        
        if (!file.is_open()) {
            std::cerr << "Error: Could not open file " << filePath << std::endl;
            send404(clientSocket);
            return;
        }

        // 1. 读取文件内容
        std::vector<char> content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        
        // 2. 确定 Content-Type
        std::string contentType = "text/plain";
        if (filePath.find(".html") != std::string::npos) contentType = "text/html";
        else if (filePath.find(".js") != std::string::npos) contentType = "application/javascript";
        else if (filePath.find(".css") != std::string::npos) contentType = "text/css";

        // 3. 构建 HTTP 响应头
        std::stringstream header;
        header << "HTTP/1.1 200 OK\r\n";
        header << "Content-Type: " << contentType << "; charset=utf-8\r\n";
        header << "Content-Length: " << content.size() << "\r\n";
        header << "Connection: close\r\n";
        header << "\r\n"; // 空行结束头

        std::string headerStr = header.str();

        // 4. 发送头和内容
        #ifdef _WIN32
            send(clientSocket, headerStr.c_str(), headerStr.size(), 0);
            send(clientSocket, content.data(), content.size(), 0);
        #else
            send(clientSocket, headerStr.c_str(), headerStr.size(), MSG_NOSIGNAL);
            send(clientSocket, content.data(), content.size(), MSG_NOSIGNAL);
        #endif
        
        std::cout << "Served file: " << filePath << std::endl;
    }

private:
    static void send404(int clientSocket) {
        std::string msg = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
        #ifdef _WIN32
            send(clientSocket, msg.c_str(), msg.size(), 0);
        #else
            send(clientSocket, msg.c_str(), msg.size(), MSG_NOSIGNAL);
        #endif
    }
};

#endif