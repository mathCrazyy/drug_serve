# 阿里云 ESA (Elastic Serverless App) 部署指南

## 问题解决

### 问题描述
构建失败，错误信息：
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
```

### 原因
ESA 构建系统默认在项目根目录查找 `package.json`，但本项目的前端代码在 `frontend/` 子目录中。

### 解决方案
已在根目录创建 `package.json`，它会自动将构建命令转发到 `frontend/` 目录。

## ESA 配置步骤

### 1. 基本配置

在阿里云 ESA 控制台配置以下参数：

- **代码源**: GitHub 仓库 `mathCrazyy/drug_serve`
- **分支**: `main`
- **构建目录**: 留空（使用根目录）
- **安装命令**: `npm install`（会自动执行 `cd frontend && npm install`）
- **构建命令**: `npm run build`（会自动执行 `cd frontend && npm run build`）

### 2. 环境变量配置

如果需要配置前端环境变量，在 ESA 控制台添加：

```
VITE_API_BASE_URL=https://your-api-domain.com
```

### 3. 输出目录配置

构建完成后，静态文件输出在 `frontend/dist/` 目录。

在 ESA 控制台配置：
- **输出目录**: `frontend/dist`
- **入口文件**: `index.html`

### 4. 自定义构建命令（可选）

如果 ESA 支持自定义构建命令，可以直接使用：

```bash
cd frontend && npm install && npm run build
```

## 验证构建

构建成功后，应该能看到：
- `frontend/dist/` 目录包含构建后的静态文件
- `index.html` 文件存在
- 没有构建错误

## 注意事项

1. **Node.js 版本**: 确保 ESA 使用 Node.js 18+ 版本
2. **构建时间**: 首次构建可能需要较长时间（安装依赖）
3. **环境变量**: 生产环境的 API 地址需要在 ESA 控制台配置
4. **后端服务**: ESA 主要用于部署前端，后端需要单独部署（ECS、容器服务等）

## 故障排查

### 如果构建仍然失败

1. **检查 Node.js 版本**：确保 >= 18.0.0
2. **检查构建日志**：查看完整的错误信息
3. **手动测试**：在本地执行 `npm run build` 验证
4. **检查依赖**：确保 `frontend/package.json` 中的依赖都正确

### 本地测试构建

```bash
# 在项目根目录
npm install
npm run build

# 应该会在 frontend/dist 目录生成构建文件
```

## 相关文件

- `package.json` - 根目录构建配置
- `frontend/package.json` - 前端项目配置
- `frontend/vite.config.ts` - Vite 构建配置

