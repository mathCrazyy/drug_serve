#!/bin/bash
# ESA 构建脚本

set -e

echo "清理旧的依赖..."
rm -rf node_modules package-lock.json

echo "安装依赖..."
npm install

echo "开始构建..."
npm run build

echo "构建完成！"

