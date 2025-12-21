#!/bin/bash

# 启动所有服务的脚本

echo "=== 启动药品识别与提醒系统 ==="
echo ""

# 检查并启动后端
echo "1. 启动后端服务..."
cd backend

if [ ! -d "venv" ]; then
    echo "   创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

if ! pip show fastapi > /dev/null 2>&1; then
    echo "   安装依赖..."
    pip install -r requirements.txt -q
fi

# 检查端口是否被占用
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   后端服务已在运行 (端口 8000)"
else
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
    echo "   后端服务已启动 (PID: $!)"
    echo "   日志: tail -f /tmp/backend.log"
fi

cd ..

# 检查并启动前端
echo ""
echo "2. 启动前端服务..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "   安装依赖..."
    npm install
fi

# 检查端口是否被占用
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "   前端服务已在运行 (端口 5173)"
else
    nohup npm run dev > /tmp/frontend.log 2>&1 &
    echo "   前端服务已启动 (PID: $!)"
    echo "   日志: tail -f /tmp/frontend.log"
fi

cd ..

echo ""
echo "=== 服务地址 ==="
echo "前端: http://localhost:5173"
echo "后端 API: http://127.0.0.1:8000"
echo "API 文档: http://127.0.0.1:8000/docs"
echo ""
echo "=== 停止服务 ==="
echo "运行: ./stop_all.sh"
echo ""

