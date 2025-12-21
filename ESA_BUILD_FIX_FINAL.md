# ESA 构建问题最终解决方案

## 问题描述

构建失败，错误信息：
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../node_modules/dist/node/cli.js' imported from .../node_modules/.bin/vite
```

## 根本原因

在 ESA 环境中，`npx vite` 无法正确解析 vite 模块的路径。`node_modules/.bin/vite` 脚本使用相对路径 `../dist/node/cli.js`，但在某些环境下路径解析失败。

## 解决方案

### 1. 直接使用 vite.js 文件

修改 `frontend/package.json` 的构建脚本，直接使用 vite 的完整路径：

```json
{
  "scripts": {
    "build": "node node_modules/vite/bin/vite.js build"
  }
}
```

### 2. 确保依赖正确安装

在根目录 `package.json` 中，构建前清理并重新安装：

```json
{
  "scripts": {
    "build": "cd frontend && rm -rf node_modules package-lock.json && npm install && npm run build"
  }
}
```

## 已应用的修改

1. ✅ `frontend/package.json`: 使用 `node node_modules/vite/bin/vite.js build`
2. ✅ `package.json`: 构建前清理并重新安装依赖

## 验证

本地测试：
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
node node_modules/vite/bin/vite.js build
```

应该能成功构建。

## ESA 配置

**安装命令：**
```bash
npm install
```

**构建命令：**
```bash
npm run build
```

（根目录的 `package.json` 会自动处理 frontend 目录）

