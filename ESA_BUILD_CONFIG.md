# ESA 构建配置指南

## 当前问题

构建失败，错误：`Cannot find module '.../node_modules/dist/node/cli.js'`

## 原因

Vite 模块没有正确安装，可能是：
1. `npm install` 没有在 `frontend` 目录执行
2. 依赖安装不完整
3. node_modules 结构异常

## 解决方案

### 方案 1: 使用自定义构建命令（推荐）

在 ESA 控制台配置：

**安装命令：**
```bash
cd frontend && npm install --legacy-peer-deps
```

**构建命令：**
```bash
cd frontend && npm run build
```

### 方案 2: 使用根目录脚本

**安装命令：**
```bash
npm install
```

**构建命令：**
```bash
npm run build
```

（根目录的 package.json 会自动处理 frontend 目录）

### 方案 3: 完整构建命令（如果支持）

**构建命令：**
```bash
cd frontend && rm -rf node_modules package-lock.json && npm install && npm run build
```

## 验证步骤

1. **检查 node_modules**
   - 确保 `frontend/node_modules/vite` 目录存在
   - 确保 `frontend/node_modules/vite/dist/node/cli.js` 文件存在

2. **检查 package-lock.json**
   - 确保 `frontend/package-lock.json` 存在且完整

3. **本地测试**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

## ESA 配置参数

- **代码源**: GitHub - mathCrazyy/drug_serve
- **分支**: main
- **构建目录**: 留空（根目录）
- **安装命令**: `cd frontend && npm install --legacy-peer-deps`
- **构建命令**: `cd frontend && npm run build`
- **输出目录**: `frontend/dist`
- **入口文件**: `index.html`

## 故障排查

如果仍然失败：

1. **检查 Node.js 版本**
   - 确保使用 Node.js 18+（当前 ESA 使用 v22.16.0，应该没问题）

2. **清理并重新安装**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

3. **检查网络**
   - 确保 npm registry 可访问
   - 可能需要配置 npm 镜像

4. **检查磁盘空间**
   - 确保有足够的空间安装依赖

