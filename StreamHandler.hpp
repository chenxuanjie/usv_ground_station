#ifndef STREAM_HANDLER_HPP
#define STREAM_HANDLER_HPP

#include <string>
#include <thread>
#include <chrono>
#include <iostream>
#include <sstream>
#include <iomanip> // 用于控制浮点数精度
#include <cmath>

// 根据系统包含 socket 头文件
#ifdef _WIN32
    #include <winsock2.h>
#else
    #include <sys/socket.h>
    #include <unistd.h>
#endif

// [真实数据结构]
// 为了能编译通过，我定义这个简单的结构体。
// 在你的主程序中，你应该已经有类似变量了，可以直接把你的对象转成这个，或者修改这个结构体以匹配你的类。
struct USVStatus {
    double longitude; // WGS84 经度
    double latitude;  // WGS84 纬度
    double course;    // 航向角 (0-360)
};

class StreamHandler {
public:
    /**
     * 处理流式请求
     * @param clientSocket 客户端 Socket
     * @param dataPtr 指向 USVStatus 或你真实数据对象的指针
     */
    static void handleStreamRequest(int clientSocket, void* dataPtr) {
        
        // 发送标准的 SSE HTTP 头
        std::string headers = 
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/event-stream\r\n"
            "Cache-Control: no-cache\r\n"
            "Connection: keep-alive\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "\r\n";
        
        #ifdef _WIN32
            send(clientSocket, headers.c_str(), headers.length(), 0);
        #else
            send(clientSocket, headers.c_str(), headers.length(), MSG_NOSIGNAL);
        #endif

        // 转换数据指针
        USVStatus* status = static_cast<USVStatus*>(dataPtr);
        
        // 标记连接是否活跃
        bool isConnected = true;

        // 持续推送数据的循环
        while (isConnected) {
            std::stringstream ss;
            
            // -------------------------------------------------------
            // [数据生成区] - 这里生成给地图用的 JSON
            // -------------------------------------------------------
            
            if (status != nullptr) {
                // 构造 JSON 格式: {"lng": 113.xxx, "lat": 23.xxx, "course": 90.0}
                // 注意：这里必须发送 WGS84 坐标，前端 CoordinateTransform.js 会自动转为百度坐标
                ss << "data: {";
                ss << "\"lng\": " << std::fixed << std::setprecision(7) << status->longitude << ",";
                ss << "\"lat\": " << std::fixed << std::setprecision(7) << status->latitude << ",";
                ss << "\"course\": " << std::fixed << std::setprecision(2) << status->course;
                ss << "}\n\n";
            } else {
                // 如果没有数据源，发送一个空包保持心跳
                ss << "data: {}\n\n"; 
            }

            std::string msg = ss.str();

            // 发送数据
            #ifdef _WIN32
                int bytesSent = send(clientSocket, msg.c_str(), msg.length(), 0);
            #else
                ssize_t bytesSent = send(clientSocket, msg.c_str(), msg.length(), MSG_NOSIGNAL);
            #endif

            if (bytesSent < 0) {
                std::cout << "[Stream] Client disconnected." << std::endl;
                isConnected = false;
                break;
            }

            // [频率控制] 
            // 100ms 刷新一次 (10Hz)，对于地图显示非常流畅
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
        
        // 连接断开后，由调用者或此处关闭 socket
        // close(clientSocket);
    }
};

#endif // STREAM_HANDLER_HPP