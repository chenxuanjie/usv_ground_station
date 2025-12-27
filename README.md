这是一个为您量身定制的 `README.md` 文档。它不仅看起来专业，还涵盖了项目结构、功能介绍、协议说明和使用方法。

您可以将以下内容保存为项目根目录下的 `README.md` 文件。

---

# 🚤 USV Control Terminal (无人艇控制终端)

一个基于 Web 技术的现代化无人艇地面站控制系统（GCS）。具有实时状态监控、地图轨迹追踪、远程控制和指令日志分析功能。

## ✨ 项目亮点 (Features)

* **📊 实时状态仪表盘 (HUD)**：实时显示航向（动态罗盘）、经纬度、左右电池电压。
* **🗺️ 集成百度地图**：
* 内置 **WGS84 -> BD09** 坐标纠偏算法，确保 GPS 定位精准投射。
* 实时轨迹绘制与自动跟随功能。
* 支持 HTTPS 安全加载。


* **🎮 多模式控制**：
* 支持键盘 **WASD** 键位进行手动遥控。
* 支持一键切换 手动/自动/巡航 模式。


* **📝 智能日志系统**：
* **用户模式**：仅显示连接状态、模式切换等人类可读的关键信息。
* **开发者模式**：显示原始通信协议数据（如 `R,...`），便于调试底层。


* **🌐 国际化支持 (i18n)**：内置中/英双语切换，一键热更新 UI。
* **🔌 灵活通信**：基于 WebSocket 与后端通信，支持动态配置目标 TCP IP/端口。

## 📂 目录结构 (Directory Structure)

本项目采用模块化设计（无构建工具模式），直接通过浏览器加载。

```text
/
├── index.html              # 项目入口文件 (包含 CDN 引用)
├── README.md               # 项目说明文档
└── js/
    ├── app.js              # 主程序逻辑 (状态管理、WebSocket 通信)
    ├── locales.js          # 国际化语言包 (ZH/EN)
    ├── icons.js            # SVG 图标组件库
    └── components/         # UI 组件库
        ├── Header.js       # 顶部导航栏 (连接控制、IP配置)
        ├── Sidebar.js      # 左侧仪表盘 (HUD、控制面板)
        ├── LogDrawer.js    # 右侧日志抽屉 (开发者工具)
        └── MapComponent.js # 百度地图封装组件 (含坐标转换算法)

```

## 🚀 快速开始 (Quick Start)

### 1. 环境准备

由于使用了 ES6 Modules 和 HTTPS 地图 API，建议使用本地服务器运行，而不是直接双击打开 html 文件。

* **VS Code (推荐)**: 安装 `Live Server` 插件，右键 `index.html` 选择 "Open with Live Server"。
* **Python**:
```bash
python -m http.server 8000

```



### 2. 运行项目

打开浏览器访问 `http://localhost:5500` (或 `http://127.0.0.1:8000`)。

### 3. 连接设备

1. 在顶部输入框确认无人艇后端的 **目标 IP** 和 **端口**（默认 `120.77.0.8:6202`）。
2. 点击 **"连接设备"** 按钮。
3. 连接成功后，仪表盘将开始跳动，地图将自动定位到船只位置。

## ⚙️ 通信协议说明 (Protocol)

前端与后端通过 WebSocket 交互，数据格式如下：

### 1. 接收数据 (RX)

| 标识头 | 格式 | 示例 | 说明 |
| --- | --- | --- | --- |
| **R** | `R,经度,纬度,航向,电量L,电量R` | `R,113.390,23.037,50.0,11.8,12.3` | 核心状态数据 |
| **TCP_STATUS** | `TCP_STATUS,状态` | `TCP_STATUS,ONLINE` | 后端与小艇的连接状态 |
| **LOG** | `LOG,级别,内容` | `LOG,WARN,Battery Low` | 通用系统日志 |

### 2. 发送指令 (TX)

| 标识头 | 格式 | 说明 |
| --- | --- | --- |
| **K** | `K,w,a,s,d,` | 键盘控制 (1=按下, 0=松开) |
| **S** | `S,推流,接收,q,模式,巡航,` | 系统配置下发 (如 `@` 手动, `#` 自动) |
| **CMD** | `CMD,CONNECT,ip,port` | 指挥后端发起 TCP 连接 |

## 🤝 贡献与开发

本项目无需 Node.js 构建环境（如 Webpack/Vite），所有逻辑基于 `React` 和 `Babel Standalone` 运行时编译。

* 修改 UI：直接编辑 `js/components/` 下的对应组件。
* 修改逻辑：编辑 `js/app.js`。

## 📜 许可证

MIT License. Free to use for personal and educational purposes.