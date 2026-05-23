#!/usr/bin/env bash
set -euo pipefail

# 基于脚本位置定位项目根目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR/projects"

# 显式声明关键环境变量
export PORT=5000
export EXPO_PUBLIC_BACKEND_BASE_URL="http://localhost:9091"

# 清理 5000 端口残留进程（幂等性）
fuser -k 5000/tcp 2>/dev/null || true
sleep 1

echo "==================== 启动 Expo Web Preview ===================="
echo "项目目录: $(pwd)"
echo "端口: $PORT"
echo "后端地址: $EXPO_PUBLIC_BACKEND_BASE_URL"

# 启动 Expo web 预览（--lan 启用局域网访问）
cd client
exec npx expo start --web --port 5000 --lan
