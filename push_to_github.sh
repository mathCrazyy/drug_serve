#!/bin/bash

# GitHub 推送脚本

echo "正在推送到 GitHub..."
echo ""

cd /Users/chunshengwu/code/1/drug_serve

# 确保远程仓库配置正确（使用环境变量或 Git 凭据管理器）
# 如果设置了 GITHUB_TOKEN 环境变量，使用它；否则使用 Git 凭据管理器
if [ -n "$GITHUB_TOKEN" ]; then
    git remote set-url origin https://mathCrazyy:${GITHUB_TOKEN}@github.com/mathCrazyy/drug_serve.git
else
    # 使用 Git 凭据管理器（推荐方式）
    git remote set-url origin https://github.com/mathCrazyy/drug_serve.git
fi

# 推送代码
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 代码已成功推送到 GitHub!"
    echo "仓库地址: https://github.com/mathCrazyy/drug_serve"
else
    echo ""
    echo "❌ 推送失败，请检查网络连接或 token 权限"
    echo "提示: 可以设置 GITHUB_TOKEN 环境变量，或使用 Git 凭据管理器"
fi

