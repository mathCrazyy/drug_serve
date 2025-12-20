#!/bin/bash

# API 测试脚本

echo "=== 测试后端 API ==="
echo ""

echo "1. 测试根路径:"
curl -s http://localhost:8000/ | python3 -m json.tool
echo ""

echo "2. 测试药品列表:"
curl -s http://localhost:8000/api/drugs | python3 -m json.tool
echo ""

echo "3. 测试即将过期药品:"
curl -s http://localhost:8000/api/drugs/expiring | python3 -m json.tool
echo ""

echo "=== API 文档地址 ==="
echo "http://localhost:8000/docs"
echo ""

echo "=== 前端地址 ==="
echo "http://localhost:5173"
echo ""

