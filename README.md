# 🚤 USV Control Terminal (无人艇控制终端)

一个基于 Web 技术与 C++ 后端构建的现代化无人艇地面站控制系统（GCS）。专为无人水面艇（USV）设计，提供实时状态监控、任务规划、远程控制及历史数据分析功能。

## ✨ 项目亮点 (Features)

### 🖥️ 核心交互

* **📊 实时状态仪表盘 (HUD)**：
* 动态罗盘显示航向。
* 实时显示经纬度、左右电池电压（BAT L/R）。
* 状态异常时的视觉警报。


* **🎮 多模式控制**：
* **键盘操控**：支持 WASD 键位进行手动遥控。
* **模式切换**：一键切换 手动 (Manual) / 自动 (Auto) / 巡航 (Loop) 模式。


* **📈 数据分析图表 (New)**：
* **实时波形**：支持电压与航向角同屏显示（自适应单坐标轴）。
* **智能交互**：
* **单击缩放**：进入单次缩放模式，操作完成后自动退出。
* **双击缩放**：锁定缩放模式，便于连续拖拽分析。


* **工具集**：支持暂停/继续、通道独奏（双击图例）、截图保存。
* **完全国际化**：图表界面支持中英双语切换。



### 🗺️ 地图与导航

* **集成百度地图**：
* 内置 **WGS84 <-> BD09** 高精度坐标纠偏算法。
* 支持右键菜单添加航点、测距工具。
* 实时轨迹追踪与航点任务下发。



### ⚙️ 系统架构

* **🌐 国际化 (i18n)**：全界面中/英双语一键热切换。
* **📝 双模日志系统**：
* **用户模式**：仅显示关键系统状态。
* **开发者模式**：实时监控原始通信协议数据（Raw Data），辅助调试。


* **🚀 轻量级架构**：
* 前端：纯 HTML/JS (React UMD)。为加速首屏，已引入可选的 Node/Babel 预编译（输出 `dist/`），运行时无需 Node。
* 后端：C++ 高性能服务器，集成了 HTTP 静态服务与 WebSocket 转发网桥。



## 📂 目录结构 (Directory Structure)

```text
/
├── index.html              # 前端入口 (React 挂载点)
├── index.dev.html          # 开发入口（运行时 Babel，加载更慢）
├── config.ini              # 系统配置文件 (IP/端口)
├── assets/
│   ├── fonts/              # 本地字体资源 (离线可用)
│   └── icons/              # 本地图片/光标等资源
├── CMakeLists.txt          # C++ 项目构建配置
├── build.sh                # 自动化编译脚本（前端预编译 + 后端 CMake）
├── build_cmake.sh          # 兼容入口（转发到 build.sh）
├── package.json            # 前端预编译依赖清单（Babel）
├── babel.config.json       # Babel 配置
├── usv_server.cpp          # C++ 后端源码 (HTTP + WebSocket + TCP Client)
├── js/
│   ├── app.js              # 核心逻辑组装
│   ├── locales.js          # 国际化语言包 (ZH/EN)
│   ├── lib/                # 第三方库 (本地加载)
│   │   └── baidu/           # 百度地图 API/工具库 (本地化)
│   ├── components/         # UI 组件库
│   │   ├── Desktop/        # PC 端组件
│   │   ├── Shared/         # PC/Mobile 共享组件
│   │   └── Mobile/         # 移动端组件
│   └── ...
└── ...

```

## 🔌 离线部署 (Offline)

前端入口 `index.html` 已改为本地加载第三方资源（字体/百度地图工具库等），在无法访问外网时也能正常加载页面静态资源。

注意：百度地图底图瓦片仍会请求 `bdimg.com` 等在线域名；如果需要“完全离线地图”，需要自建瓦片服务或替换地图方案（例如 Leaflet + 本地瓦片/MBTiles）。

## 🚀 快速开始 (Quick Start)

本项目后端采用 C++ 编写，前端由后端直接托管，无需安装 Nginx。
如需“前端预编译”（推荐，用于加快首次加载），需要 Node.js（建议 >= 18），或使用项目内的便携 Node（`.tools/node-*/bin`）。

### 1. 编译（前端 + 后端）

确保您的系统已安装 `g++` 和 `cmake`。

```bash
# 赋予脚本执行权限
chmod +x build.sh

# 运行编译脚本（默认同时预编译前端 dist/ 并编译后端）
./build.sh

```

编译成功后，根目录下会生成 `usv_server` 可执行文件。

可选：
* 仅编译后端：`SKIP_WEB_BUILD=1 ./build.sh`
* 若不构建前端，也可启动后访问 `index.dev.html`（运行时 Babel，加载更慢）

### 2. 配置连接

编辑根目录下的 `config.ini` 文件，设置无人艇的实际 IP 和端口：

```ini
boat_ip=120.77.0.8    # 无人艇 TCP 服务地址
boat_port=6202        # 无人艇 TCP 服务端口
local_web_port=8080   # 本地 Web 服务端口

```

### 3. 启动系统

```bash
./usv_server

```

### 4. 访问控制台

打开浏览器（推荐 Chrome/Edge）访问：
`http://localhost:8080`

*点击顶部导航栏的 **"连接设备"** 按钮，系统将通过 WebSocket 连接后端，并自动转发 TCP 指令至无人艇。*

## ⚙️ 通信协议 (Protocol)

前端与 C++ 后端通过 WebSocket 交互，后端负责将其转换为 TCP 报文透传给无人艇。

| 类型 | 标识头 | 格式示例 | 说明 |
| --- | --- | --- | --- |
| **接收 (RX)** | `R` | `R,113.39,23.03,50.0,11.8,12.3` | `R,经度,纬度,航向,左电,右电` |
| **状态** | `TCP_STATUS` | `TCP_STATUS,ONLINE` | 后端与艇端的连接状态 |
| **控制 (TX)** | `K` | `K,1,0,0,0,` | 键盘控制 (W,A,S,D) |
| **配置 (TX)** | `S` | `S,1,3,q,@,0,` | `S,推流,接收,质量,模式,巡航` |
| **航点 (TX)** | `P` | `P,113.1,23.1,113.2,23.2,` | 航点经纬度序列 |

## 🛠️ 开发指南

* **前端修改**：
  - 使用 `index.html`：修改 `js/` 后需重新执行 `npm run build:web`（或 `./build.sh`）更新 `dist/`。
  - 使用 `index.dev.html`：直接编辑 `js/` 并刷新即可（运行时 Babel，加载更慢）。
* **后端修改**：修改 `.cpp` 文件后，需重新运行 `./build.sh`。

## 📜 许可证

MIT License. Free to use for personal and educational purposes.
