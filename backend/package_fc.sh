#!/bin/bash
# 函数计算代码打包脚本（优化版，排除不必要文件）

set -e

echo "=== 开始打包函数计算代码 ==="

# 删除旧的打包文件
rm -f function.zip funtion.zip

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "临时目录: $TEMP_DIR"

# 复制必要文件
echo "复制必要文件..."

# 复制 Python 代码
cp -r app "$TEMP_DIR/"
cp requirements.txt "$TEMP_DIR/"
cp bootstrap "$TEMP_DIR/"

# 设置 bootstrap 执行权限
chmod +x "$TEMP_DIR/bootstrap"

# 检查文件
echo ""
echo "=== 打包内容 ==="
find "$TEMP_DIR" -type f | head -20
echo "..."

# 计算大小
echo ""
echo "=== 文件大小 ==="
du -sh "$TEMP_DIR"
echo ""

# 打包
echo "=== 开始压缩 ==="
cd "$TEMP_DIR"
zip -r function.zip . -q
mv function.zip "$OLDPWD/"

# 清理临时目录
rm -rf "$TEMP_DIR"

# 显示结果
cd "$OLDPWD"
echo "=== 打包完成 ==="
ls -lh function.zip
echo ""
echo "✅ 打包文件: $(pwd)/function.zip"
echo "📦 文件大小: $(du -h function.zip | cut -f1)"

