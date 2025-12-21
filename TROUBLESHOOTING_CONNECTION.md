# 连接问题排查指南

## 问题：无法连接到服务器

如果前端显示"无法连接到服务器，请检查网络连接或确认后端服务是否运行"，请按以下步骤排查：

### 1. 检查后端服务是否运行

```bash
# 检查端口 8000 是否被占用
lsof -i :8000

# 或者
ps aux | grep uvicorn
```

### 2. 检查后端服务绑定的地址

**问题**：如果后端服务绑定在 `127.0.0.1:8000`，只有本机可以访问。

**解决方案**：确保后端服务绑定在 `0.0.0.0:8000`，这样可以从任何网络接口访问。

```bash
# 停止旧服务
pkill -f "uvicorn.*8000"

# 使用正确的配置启动
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. 检查前端 API 配置

**开发环境**：
- 前端通过 Vite 代理访问后端（`vite.config.ts` 中配置）
- 确保 `vite.config.ts` 中的代理配置正确：
  ```typescript
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  }
  ```

**生产环境**：
- 需要设置环境变量 `VITE_API_BASE_URL` 指向实际的后端地址
- 例如：`VITE_API_BASE_URL=https://your-backend-domain.com`

### 4. 测试后端 API

```bash
# 测试后端是否可访问
curl http://localhost:8000/api/drugs

# 应该返回 JSON 数据，而不是连接错误
```

### 5. 检查 CORS 配置

确保后端 `main.py` 中的 CORS 配置允许前端访问：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境可以使用 *，生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6. 常见问题

#### 问题 1：后端服务绑定在 127.0.0.1
**症状**：前端无法连接，但 `curl http://localhost:8000` 可以访问

**解决**：重启后端服务，使用 `--host 0.0.0.0`

#### 问题 2：前端在生产环境，后端在本地
**症状**：前端部署在 ESA 或其他服务器，无法访问 localhost:8000

**解决**：
1. 将后端部署到公网可访问的服务器
2. 在前端环境变量中配置正确的后端地址

#### 问题 3：防火墙阻止连接
**症状**：本地可以访问，但其他设备无法访问

**解决**：检查防火墙设置，允许 8000 端口的入站连接

### 7. 快速修复脚本

```bash
# 停止所有服务
./stop_all.sh

# 使用正确配置启动
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 8. 验证连接

1. **后端健康检查**：
   ```bash
   curl http://localhost:8000/
   ```

2. **API 测试**：
   ```bash
   curl http://localhost:8000/api/drugs
   ```

3. **前端访问**：
   - 打开浏览器开发者工具（F12）
   - 查看 Network 标签
   - 尝试上传图片，查看请求是否成功

## 当前配置检查清单

- [ ] 后端服务正在运行
- [ ] 后端绑定在 `0.0.0.0:8000`（不是 `127.0.0.1`）
- [ ] 前端 API 配置正确（开发环境使用代理，生产环境配置环境变量）
- [ ] CORS 配置允许前端访问
- [ ] 防火墙未阻止 8000 端口
- [ ] 网络连接正常

