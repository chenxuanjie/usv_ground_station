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
# 参考您的 build.sh 逻辑
RUN mkdir -p build && cd build && \
    cmake -DCMAKE_RUNTIME_OUTPUT_DIRECTORY=.. .. && \
    make -j4

# ===========================
# Stage 1.5: Web Build (前端预编译)
# ===========================
FROM node:20-bullseye AS web-builder

WORKDIR /app

# 明确声明为“构建环境”，避免某些环境默认 production 导致 devDependencies 被跳过
ENV NODE_ENV=development
ENV npm_config_production=false

# 先复制依赖清单以便利用 Docker 层缓存
COPY package.json package-lock.json babel.config.json ./
# 注意：有些环境会默认设置 NODE_ENV=production，从而导致 npm 跳过 devDependencies，
#      进而出现 “babel: not found”。这里显式包含 dev 依赖，保证能执行 build:web。
# 同时用 “node .../babel.js” 做存在性验证，避免某些环境 bin-links 关闭导致 .bin/ 下没有 babel。
RUN npm ci --include=dev && node ./node_modules/@babel/cli/bin/babel.js --version

# 再复制源码并执行构建（输出 dist/）
COPY js ./js
RUN npm run build:web

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
COPY --from=builder /app/index.dev.html .
COPY --from=builder /app/js ./js
COPY --from=web-builder /app/dist ./dist

# 3. 复制配置文件 (如果有 config_default.ini 也建议复制)
# 如果本地有 config.ini 则复制，否则代码会自动生成
COPY --from=builder /app/config_default.ini .
COPY --from=builder /app/config.ini . 

# 4. 暴露端口 (对应 config.ini 中的 local_web_port)
EXPOSE 8888

# 5. 启动命令
CMD ["./usv_server"]
