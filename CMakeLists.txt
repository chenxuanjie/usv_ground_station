cmake_minimum_required(VERSION 3.10)

# 项目名称
project(USV_Server)

# 设置 C++ 标准 (推荐 C++11 或更高)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# 查找所有源文件
# 假设你的主程序叫 usv_server.cpp
set(SOURCES 
    usv_server.cpp
)

# 如果你有其他 .cpp 文件（例如 OnlineMap.cpp），请把它们加到上面的列表中
# set(SOURCES usv_server.cpp src/OnlineMap.cpp)

# 生成可执行文件
add_executable(usv_server ${SOURCES})

# 链接库
if(WIN32)
    # Windows 下需要链接 Winsock 库
    target_link_libraries(usv_server ws2_32)
else()
    # Linux 下通常需要 pthread
    target_link_libraries(usv_server pthread)
endif()

# 输出提示
message(STATUS "Build setup for USV_Server complete.")