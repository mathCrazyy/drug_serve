# ESA 构建问题最终解决方案

## 问题根源

虽然 `npm install` 显示 "up to date"，但 Vite 模块实际上没有正确安装。
错误路径：`node_modules/dist/node/cli.js`（错误）
正确路径：`node_modules/vite/dist/node/cli.js`

## 解决方案

### 方案 1: 强制重新安装依赖（推荐）

在 ESA 控制台配置：

**安装命令：**
```bash
cd frontend && rm -rf node_modules package-lock.json && npm install
```

**构建命令：**
```bash
cd frontend && npm run build
```

### 方案 2: 使用 npx（已更新代码）

代码已更新为使用 `npx vite build`，这样可以确保使用正确安装的 vite。

**安装命令：**
```bash
cd frontend && npm install
```

**构建命令：**
```bash
cd frontend && npm run build
```

### 方案 3: 完整清理重建

**构建命令（一次性）：**
```bash
cd frontend && rm -rf node_modules package-lock.json && npm cache clean --force && npm install && npm run build
```

## 已修复的代码

1. ✅ 构建命令改为使用 `npx vite build`
2. ✅ 根目录 build 脚本添加清理步骤
3. ✅ 添加 frontend/.npmrc 配置

## ESA 推荐配置

**安装命令：**
```bash
cd frontend && rm -rf node_modules package-lock.json && npm install
```

**构建命令：**
```bash
cd frontend && npm run build
```

**输出目录：**
```
frontend/dist
```

**入口文件：**
```
index.html
```

## 验证

构建成功后应该看到：
- `frontend/dist/index.html` 存在
- `frontend/dist/assets/` 目录包含 JS/CSS 文件
- 没有错误信息

