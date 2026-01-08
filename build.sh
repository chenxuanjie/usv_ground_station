#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# 一键构建脚本（后端 CMake + 前端 JS/React 预编译）
#
# 为什么要加“前端预编译”：
# - 当前项目原本使用浏览器端 Babel（js/lib/babel.js）运行时编译 JSX，
#   首次打开会明显变慢（尤其是移动端/低性能设备）。
# - 预编译后会生成 dist/，浏览器直接加载编译后的 JS，首屏更快、更稳定。
#
# 用法：
# - 默认：同时构建前端(dist/)和后端(usv_server)
# - 仅构建后端：SKIP_WEB_BUILD=1 ./build_cmake.sh
# - 指定并行编译线程：JOBS=8 ./build_cmake.sh
# ============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}"

JOBS="${JOBS:-}"
if [[ -z "${JOBS}" ]]; then
  JOBS="$(command -v nproc >/dev/null 2>&1 && nproc || echo 4)"
fi

echo "==> 项目根目录：${ROOT_DIR}"
echo "==> 并行线程数：${JOBS}"

# ----------------------------------------------------------------------------
# 0) 构建前端（JS/React -> dist/）
# ----------------------------------------------------------------------------
if [[ "${SKIP_WEB_BUILD:-0}" == "1" ]]; then
  echo "ℹ️  已设置 SKIP_WEB_BUILD=1，跳过前端构建。"
else
  if [[ -f "${ROOT_DIR}/package.json" ]]; then
    echo "🌐 [Web] 开始编译前端（输出到 dist/）..."

    # 优先尝试使用项目内的便携 Node（如果存在）
    TOOL_NODE_BIN="$(ls -d "${ROOT_DIR}"/.tools/node-*/bin 2>/dev/null | head -n 1 || true)"
    if [[ -n "${TOOL_NODE_BIN}" ]]; then
      export PATH="${TOOL_NODE_BIN}:${PATH}"
    fi

    if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
      echo "❌ [Web] 未找到 node/npm，无法编译前端。"
      echo "   - 方案 A：安装 Node.js（建议 >= 18）"
      echo "   - 方案 B：准备便携 Node 到 .tools/（例如 .tools/node-20*/bin）"
      echo "   - 方案 C：临时使用 index.dev.html（运行时 Babel，加载更慢）"
      exit 1
    fi

    echo "   node: $(node -v)"
    echo "   npm : $(npm -v)"

    # 使用 lockfile 优先走 npm ci，保证一致性
    if [[ -f "${ROOT_DIR}/package-lock.json" ]]; then
      npm ci
    else
      npm install
    fi

    npm run build:web
    echo "✅ [Web] 前端编译完成：${ROOT_DIR}/dist/"
  else
    echo "ℹ️  [Web] 未找到 package.json，跳过前端构建。"
  fi
fi

# ----------------------------------------------------------------------------
# 1) 构建后端（CMake -> usv_server）
# ----------------------------------------------------------------------------
echo "🔧 [CMake] Configuring..."
mkdir -p "${ROOT_DIR}/build"
cd "${ROOT_DIR}/build"

# 关键参数：-DCMAKE_RUNTIME_OUTPUT_DIRECTORY=..
# 含义：告诉 CMake 把生成的可执行文件放在上一级目录（即项目根目录）
cmake -DCMAKE_RUNTIME_OUTPUT_DIRECTORY=.. ..

echo "🚀 [CMake] Compiling..."
make -j"${JOBS}"

echo "✅ 构建成功！"
echo "📂 可执行文件已生成在项目根目录：${ROOT_DIR}/usv_server"
echo "👉 运行命令：./usv_server"
