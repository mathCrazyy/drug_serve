# ESA 构建产物配置指南

## 问题

构建成功，但 ESA 无法找到构建产物：
```
Assets directory not set, skipping...
Function file not found, skipping...
Failed to copy build artifacts: Both assets and function js file are not found
```

## 解决方案

### 方案 1: 使用 esa.jsonc 配置文件（推荐）

已在项目根目录创建 `esa.jsonc` 文件，配置如下：

```jsonc
{
  "assets": {
    "directory": "frontend/dist"
  },
  "function": {
    "file": "frontend/dist/index.html"
  }
}
```

### 方案 2: 在 ESA 控制台手动配置

如果 `esa.jsonc` 不生效，请在 ESA 控制台手动配置：

1. **静态资源目录 (Assets Directory)**: `frontend/dist`
2. **入口文件 (Entry File)**: `frontend/dist/index.html`

### 方案 3: 修改构建输出路径

如果 ESA 要求构建产物在特定位置，可以修改 `vite.config.ts`：

```typescript
export default defineConfig({
  build: {
    outDir: '../dist',  // 输出到项目根目录的 dist
  },
})
```

然后在 `esa.jsonc` 中配置：
```jsonc
{
  "assets": {
    "directory": "dist"
  }
}
```

## 验证

构建成功后，检查以下文件是否存在：
- ✅ `frontend/dist/index.html`
- ✅ `frontend/dist/assets/index-*.css`
- ✅ `frontend/dist/assets/index-*.js`

## 当前构建输出

根据构建日志，当前构建产物位置：
- `dist/index.html` (0.46 kB)
- `dist/assets/index-C0IVVCcR.css` (12.52 kB)
- `dist/assets/index-zfn526i9.js` (189.74 kB)

这些文件都在 `frontend/dist/` 目录下。

## 下一步

1. 提交 `esa.jsonc` 文件到 GitHub
2. 在 ESA 控制台重新触发构建
3. 如果仍然失败，尝试在 ESA 控制台手动配置资源目录

