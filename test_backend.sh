#!/bin/bash
# 后端 API 测试脚本

# 使用方法：
# 1. 将下面的 API_URL 替换为你的实际函数计算地址
# 2. 运行: chmod +x test_backend.sh && ./test_backend.sh

API_URL="${API_URL:-http://localhost:8000}"

echo "=========================================="
echo "测试后端 API: $API_URL"
echo "=========================================="
echo ""

echo "1. 测试根路径 (GET /):"
echo "----------------------------------------"
curl -s "$API_URL/" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/"
echo ""
echo ""

echo "2. 测试 API 文档 (GET /docs):"
echo "----------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/docs")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ API 文档可访问 (HTTP $HTTP_CODE)"
    echo "访问: $API_URL/docs"
else
    echo "✗ API 文档不可访问 (HTTP $HTTP_CODE)"
fi
echo ""

echo "3. 测试药品列表 (GET /api/drugs):"
echo "----------------------------------------"
curl -s "$API_URL/api/drugs" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/api/drugs"
echo ""
echo ""

echo "4. 测试 CORS 配置:"
echo "----------------------------------------"
CORS_HEADERS=$(curl -s -I -X OPTIONS "$API_URL/api/drugs" 2>/dev/null | grep -i "access-control")
if [ -n "$CORS_HEADERS" ]; then
    echo "✓ CORS 已配置:"
    echo "$CORS_HEADERS"
else
    echo "⚠ CORS 头信息未找到"
fi
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "如果所有测试都通过，后端应该是正常的。"
echo "将 API_URL 配置到 ESA 的 VITE_API_BASE_URL 环境变量中。"

