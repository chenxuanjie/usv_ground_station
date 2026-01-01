# ===========================
# Stage 1: Build (编译环境)
# ===========================
FROM ubuntu:22.04 AS builder

# 1. 安装编译工具
RUN apt-get update && apt-get install -y \
    cmake \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# 2. 设置工作目录
WORKDIR /app

# 3. 复制所有源代码到容器
COPY . .

# 确保 config.ini 存在 (如果本地没有 config.ini，则复制 config_default.ini)
# 这样可以防止在 Stage 2 复制时因为文件不存在而报错
RUN if [ ! -f config.ini ]; then cp config_default.ini config.ini; fi

# 4. 执行编译
# 参考您的 build_cmake.sh 逻辑
RUN mkdir -p build && cd build && \
    cmake -DCMAKE_RUNTIME_OUTPUT_DIRECTORY=.. .. && \
    make -j4

# ===========================
# Stage 2: Runtime (运行环境)
# ===========================
FROM ubuntu:22.04

# 设置工作目录
WORKDIR /app

# 1. 从编译阶段复制可执行文件
COPY --from=builder /app/usv_server .

# 2. 复制前端静态资源 (index.html 和 js 文件夹)
# 注意：C++ 代码中是读取相对路径，所以必须保持结构一致
COPY --from=builder /app/index.html .
COPY --from=builder /app/js ./js

# 3. 复制配置文件 (如果有 config_default.ini 也建议复制)
# 如果本地有 config.ini 则复制，否则代码会自动生成
COPY --from=builder /app/config_default.ini .
COPY --from=builder /app/config.ini . 

# 4. 暴露端口 (对应 config.ini 中的 local_web_port)
EXPOSE 8888

# 5. 启动命令
CMD ["./usv_server"]