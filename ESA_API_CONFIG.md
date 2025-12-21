# ESA 前端连接后端 API 配置指南

## 问题

前端能正常访问，但上传图片失败，提示"无法连接到服务器"。

## 原因

前端默认使用 `http://localhost:8000` 作为 API 地址，但后端部署在函数计算，有独立的访问地址。

## 解决方案

### 步骤 1：获取后端 API 地址

1. **如果后端部署在函数计算**：
   - 进入函数计算控制台
   - 找到你的函数
   - 查看函数的 **HTTP 触发器** 或 **访问地址**
   - 地址格式类似：`https://your-function-id.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/your-service/your-function/`

2. **如果后端部署在 ECS 或其他服务**：
   - 使用后端服务的公网 IP 或域名
   - 格式：`http://your-backend-ip:8000` 或 `https://api.your-domain.com`

### 步骤 2：在 ESA 控制台配置环境变量

1. 进入 **ESA 控制台**
2. 找到你的应用（drugserve）
3. 进入 **环境变量** 或 **配置** 页面
4. 添加环境变量：

   **变量名**：`VITE_API_BASE_URL`
   
   **变量值**：你的后端 API 地址
   
   例如：
   ```
   VITE_API_BASE_URL=https://your-function-id.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/your-service/your-function
   ```
   
   或者：
   ```
   VITE_API_BASE_URL=http://your-backend-ip:8000
   ```

### 步骤 3：重新构建和部署

1. 在 ESA 控制台点击 **"重新构建"** 或 **"部署"**
2. 等待构建完成
3. 测试上传功能

## 重要提示

### API 地址格式

- **函数计算 HTTP 触发器**：
  ```
  https://your-function-id.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/your-service/your-function
  ```
  
  注意：不需要在末尾加 `/api`，前端代码会自动添加。

- **ECS 或其他服务器**：
  ```
  http://your-ip:8000
  或
  https://api.your-domain.com
  ```

### CORS 配置

确保后端允许来自 ESA 前端的跨域请求。后端代码中已有 CORS 配置：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    ...
)
```

如果后端部署在函数计算，可能需要：
1. 检查函数计算的 CORS 配置
2. 或者在函数计算控制台配置允许的来源域名

## 验证配置

1. **检查环境变量**：
   - 在 ESA 控制台确认 `VITE_API_BASE_URL` 已配置
   - 重新构建后，环境变量会编译到前端代码中

2. **测试连接**：
   - 打开浏览器开发者工具（F12）
   - 查看 Network 标签
   - 尝试上传图片
   - 查看请求的 URL 是否正确

3. **检查错误**：
   - 如果看到 CORS 错误，检查后端 CORS 配置
   - 如果看到 404 错误，检查 API 地址是否正确
   - 如果看到连接超时，检查后端服务是否正常运行

## 常见问题

### 1. 环境变量配置后仍然失败

**原因**：环境变量需要在构建时配置，不是运行时。

**解决**：
- 确保在 ESA 控制台的 **构建配置** 中设置环境变量
- 重新构建应用
- 不要在前端代码中硬编码 API 地址

### 2. CORS 错误

**错误信息**：`Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy`

**解决**：
- 检查后端 CORS 配置
- 在函数计算控制台配置允许的来源
- 或者在后端代码中添加 ESA 前端的域名

### 3. 404 错误

**错误信息**：`404 Not Found`

**解决**：
- 检查 API 地址是否正确
- 确认后端路由路径（应该是 `/api/drugs/...`）
- 检查函数计算的路径映射配置

## 示例配置

### 函数计算后端

```
VITE_API_BASE_URL=https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/drug-serve/api
```

### ECS 后端

```
VITE_API_BASE_URL=http://47.xxx.xxx.xxx:8000
```

### 自定义域名后端

```
VITE_API_BASE_URL=https://api.your-domain.com
```

## 下一步

配置完成后：
1. 重新构建 ESA 应用
2. 等待部署完成
3. 测试上传图片功能
4. 如果仍有问题，查看浏览器控制台的错误信息

