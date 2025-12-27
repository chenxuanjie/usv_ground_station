#!/bin/bash

# 1. 创建并进入 build 目录 (保持源码干净)
if [ ! -d "build" ]; then
  mkdir build
fi
cd build

# 2. 运行 CMake
# 关键参数：-DCMAKE_RUNTIME_OUTPUT_DIRECTORY=..
# 含义：告诉 CMake 把生成的可执行文件放在上一级目录（即项目根目录）
echo "🔧 Configuring CMake..."
cmake -DCMAKE_RUNTIME_OUTPUT_DIRECTORY=.. ..

# 3. 运行 Make 进行编译
# -j4 表示用 4 个核心编译，速度更快
echo "🚀 Compiling..."
make -j4

# 4. 检查结果
if [ $? -eq 0 ]; then
    echo "✅ 编译成功！"
    echo "📂 可执行文件已生成在项目根目录：usv_server"
    echo "👉 运行命令：./usv_server"
else
    echo "❌ 编译失败"
    exit 1
fi