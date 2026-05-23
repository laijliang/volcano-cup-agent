#!/usr/bin/env bash
set -euo pipefail

# 基于脚本位置定位项目根目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR/projects"

echo "==================== Expo Web Preview Build ===================="

# 安装根目录依赖（monorepo workspace）
pnpm install

# 安装 client 依赖
cd client
pnpm install

echo "==================== 依赖安装完成 ===================="
