#!/bin/bash
# 构建阿里云函数计算自定义运行时镜像

set -e

echo "=== 构建阿里云函数计算镜像 ==="

# 镜像名称和标签
IMAGE_NAME="drug-serve-fc"
IMAGE_TAG="latest"
OUTPUT_FILE="drug-serve-fc.tar"

# 进入 backend 目录
cd "$(dirname "$0")"

echo "1. 检查 Docker 是否运行..."
if ! docker info > /dev/null 2>&1; then
    echo "错误: Docker 未运行，请先启动 Docker"
    exit 1
fi

echo "2. 构建 Docker 镜像..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -f Dockerfile .

echo "3. 验证镜像..."
docker images | grep ${IMAGE_NAME}

echo "4. 导出镜像为 tar 文件..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} -o ${OUTPUT_FILE}

# 检查文件大小
FILE_SIZE=$(du -h ${OUTPUT_FILE} | cut -f1)
echo "5. 镜像文件已导出: ${OUTPUT_FILE} (大小: ${FILE_SIZE})"

echo ""
echo "=== 构建完成 ==="
echo "镜像文件: $(pwd)/${OUTPUT_FILE}"
echo ""
echo "下一步操作："
echo "1. 在阿里云函数计算控制台，选择'自定义运行时'"
echo "2. 上传 ${OUTPUT_FILE} 文件"
echo "3. 设置启动命令: ./bootstrap"
echo "4. 配置环境变量（如需要）"
echo ""

