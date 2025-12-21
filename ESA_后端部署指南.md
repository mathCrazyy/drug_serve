# ESA 前端部署 - 后端连接配置指南

## 🔴 问题说明

ESA 部署的是**前端静态文件**，前端需要连接到**后端 API 服务**。

当前错误："无法连接到服务器" 的原因是：
- ✅ 前端已成功部署到 ESA
- ❌ 后端 API 服务未部署或地址未配置
- ❌ 前端无法访问 `http://localhost:8000`（生产环境无法访问本地地址）

## 📋 解决方案

### 方案 1: 部署后端到 ECS（推荐）

#### 步骤 1: 部署后端服务

1. **购买阿里云 ECS 服务器**
   - 选择合适配置（建议 2核4G 起步）
   - 选择操作系统（Ubuntu 20.04 或 CentOS 7）

2. **在 ECS 上部署后端**
   ```bash
   # SSH 连接到 ECS
   ssh root@your-ecs-ip
   
   # 安装 Python 3.9+
   sudo apt update
   sudo apt install python3.9 python3.9-venv
   
   # 克隆代码
   git clone https://github.com/mathCrazyy/drug_serve.git
   cd drug_serve/backend
   
   # 创建虚拟环境
   python3.9 -m venv venv
   source venv/bin/activate
   
   # 安装依赖
   pip install -r requirements.txt
   
   # 配置环境变量
   cp .env.example .env
   # 编辑 .env，填入豆包 API 配置
   nano .env
   
   # 启动服务（使用 0.0.0.0 允许外部访问）
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

3. **配置防火墙**
   - 在 ECS 安全组中开放 8000 端口
   - 允许 HTTP/HTTPS 访问

4. **使用 Nginx 反向代理（可选但推荐）**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

#### 步骤 2: 在 ESA 配置前端 API 地址

1. **登录 ESA 控制台**
   - 访问：https://esa.console.aliyun.com/
   - 找到应用：`drug_serve`

2. **配置环境变量**
   - 进入应用设置或环境变量配置
   - 添加环境变量：
     ```
     VITE_API_BASE_URL=http://your-ecs-ip:8000
     ```
     或如果使用域名：
     ```
     VITE_API_BASE_URL=http://your-domain.com
     ```

3. **重新构建部署**
   - 保存环境变量后
   - 重新触发构建和部署

### 方案 2: 使用阿里云函数计算（FC）

如果不想管理服务器，可以使用阿里云函数计算：

1. **创建函数**
   - 在函数计算控制台创建 Python 3.9 函数
   - 上传后端代码

2. **配置触发器**
   - 创建 HTTP 触发器
   - 获取函数访问地址

3. **在 ESA 配置**
   - 设置 `VITE_API_BASE_URL` 为函数计算地址

### 方案 3: 使用相对路径（如果前后端同域）

如果后端和前端部署在同一域名下：

1. **修改前端代码**
   ```typescript
   // frontend/src/services/api.ts
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
   ```

2. **配置 Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # 前端静态文件
       location / {
           root /path/to/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # 后端 API
       location /api {
           proxy_pass http://127.0.0.1:8000;
       }
   }
   ```

## 🔧 当前配置检查

### 前端 API 配置

当前前端代码（`frontend/src/services/api.ts`）：
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

**问题**：
- 生产环境没有设置 `VITE_API_BASE_URL`
- 默认使用 `localhost:8000`，但生产环境无法访问

**解决**：
- 在 ESA 控制台配置 `VITE_API_BASE_URL` 环境变量
- 指向实际的后端服务地址

## 📝 快速检查清单

- [ ] 后端服务已部署到公网可访问的服务器
- [ ] 后端服务绑定在 `0.0.0.0:8000`（不是 `127.0.0.1`）
- [ ] 防火墙/安全组已开放 8000 端口
- [ ] 后端服务可以正常访问（测试：`curl http://your-backend-ip:8000/api/drugs`）
- [ ] 在 ESA 控制台配置了 `VITE_API_BASE_URL` 环境变量
- [ ] 重新构建和部署了前端应用

## 🧪 测试后端连接

部署后端后，测试连接：

```bash
# 测试后端健康检查
curl http://your-backend-ip:8000/

# 测试 API 接口
curl http://your-backend-ip:8000/api/drugs

# 应该返回 JSON 数据，而不是连接错误
```

## ⚠️ 重要提示

1. **后端必须部署**
   - ESA 只部署前端静态文件
   - 后端需要单独部署（ECS、FC、容器服务等）

2. **CORS 配置**
   - 确保后端 `main.py` 中的 CORS 配置允许前端域名访问
   - 生产环境应限制具体域名，不要使用 `allow_origins=["*"]`

3. **环境变量**
   - `VITE_API_BASE_URL` 必须在构建时设置
   - 如果构建后修改环境变量，需要重新构建

4. **HTTPS 配置**
   - 生产环境建议使用 HTTPS
   - 需要配置 SSL 证书

## 📚 相关文档

- `DEPLOY.md` - 详细部署指南
- `TROUBLESHOOTING_CONNECTION.md` - 连接问题排查
- `README.md` - 项目说明

---

**总结：需要先部署后端服务，然后在 ESA 配置 `VITE_API_BASE_URL` 环境变量指向后端地址。** 🚀

