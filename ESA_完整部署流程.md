# ESA 完整部署流程

## 🎯 部署架构

```
前端（ESA） ←→ 后端（ECS/FC） ←→ 豆包 API
```

- **前端**：部署到阿里云 ESA（静态文件）
- **后端**：部署到阿里云 ECS 或函数计算（API 服务）
- **AI 服务**：豆包 API（已配置）

## 📋 完整部署步骤

### 第一步：部署后端服务

#### 选项 A: 使用 ECS（推荐）

1. **购买 ECS 服务器**
   - 配置：2核4G 起步
   - 系统：Ubuntu 20.04 或 CentOS 7

2. **SSH 连接服务器**
   ```bash
   ssh root@your-ecs-ip
   ```

3. **安装依赖**
   ```bash
   # Ubuntu
   sudo apt update
   sudo apt install python3.9 python3.9-venv git nginx
   
   # CentOS
   sudo yum install python39 python39-pip git nginx
   ```

4. **部署后端代码**
   ```bash
   # 克隆代码
   cd /opt
   git clone https://github.com/mathCrazyy/drug_serve.git
   cd drug_serve/backend
   
   # 创建虚拟环境
   python3.9 -m venv venv
   source venv/bin/activate
   
   # 安装依赖
   pip install -r requirements.txt
   
   # 配置环境变量
   cp .env.example .env
   nano .env  # 编辑，填入豆包 API 配置
   ```

5. **配置环境变量（.env）**
   ```env
   API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
   API_KEY=your-api-key
   MODEL_ID=your-model-id
   DATABASE_URL=sqlite:///./drugs.db
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=10485760
   ```

6. **启动服务**
   ```bash
   # 使用 systemd 管理服务
   sudo nano /etc/systemd/system/drug-serve.service
   ```
   
   内容：
   ```ini
   [Unit]
   Description=Drug Serve Backend
   After=network.target
   
   [Service]
   User=root
   WorkingDirectory=/opt/drug_serve/backend
   Environment="PATH=/opt/drug_serve/backend/venv/bin"
   ExecStart=/opt/drug_serve/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   ```bash
   # 启动服务
   sudo systemctl daemon-reload
   sudo systemctl enable drug-serve
   sudo systemctl start drug-serve
   
   # 检查状态
   sudo systemctl status drug-serve
   ```

7. **配置 Nginx（可选但推荐）**
   ```bash
   sudo nano /etc/nginx/sites-available/drug-serve
   ```
   
   内容：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # 或使用 ECS 公网 IP
       
       location /api {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
       
       location /uploads {
           proxy_pass http://127.0.0.1:8000;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/drug-serve /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **配置防火墙**
   ```bash
   # 开放 80 和 8000 端口
   sudo ufw allow 80
   sudo ufw allow 8000
   sudo ufw enable
   ```

9. **测试后端**
   ```bash
   # 测试健康检查
   curl http://your-ecs-ip:8000/
   
   # 测试 API
   curl http://your-ecs-ip:8000/api/drugs
   ```

#### 选项 B: 使用函数计算（FC）

1. **创建函数**
   - 在函数计算控制台创建 Python 3.9 函数
   - 上传 `backend/` 目录代码

2. **配置环境变量**
   - 在函数配置中添加环境变量（同 .env 文件）

3. **创建 HTTP 触发器**
   - 获取函数访问地址

### 第二步：配置 ESA 前端

1. **登录 ESA 控制台**
   - https://esa.console.aliyun.com/
   - 找到应用：`drug_serve`

2. **配置环境变量**
   - 进入应用设置 → 环境变量
   - 添加：
     ```
     VITE_API_BASE_URL=http://your-ecs-ip:8000
     ```
     或如果使用域名：
     ```
     VITE_API_BASE_URL=http://your-domain.com
     ```

3. **重新构建部署**
   - 保存环境变量
   - 触发新的构建
   - 等待部署完成

### 第三步：验证部署

1. **访问前端应用**
   - 打开 ESA 提供的访问地址
   - 检查页面是否正常加载

2. **测试功能**
   - 尝试上传图片
   - 检查是否能连接到后端
   - 验证 AI 识别功能

3. **检查浏览器控制台**
   - 打开开发者工具（F12）
   - 查看 Network 标签
   - 确认 API 请求是否成功

## 🔧 常见问题

### 问题 1: 前端显示"无法连接到服务器"

**原因**：
- 后端未部署
- `VITE_API_BASE_URL` 未配置或配置错误
- 后端服务未启动

**解决**：
1. 确认后端服务已部署并运行
2. 测试后端地址可访问：`curl http://your-backend-ip:8000/`
3. 在 ESA 配置正确的 `VITE_API_BASE_URL`
4. 重新构建部署

### 问题 2: CORS 错误

**原因**：后端 CORS 配置不允许前端域名访问

**解决**：修改后端 `main.py`：
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-esa-domain.com"],  # 替换为实际前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 问题 3: 图片上传失败

**原因**：
- 后端 `uploads` 目录权限问题
- 文件大小限制

**解决**：
```bash
# 设置目录权限
sudo chmod 755 /opt/drug_serve/backend/uploads
sudo chown -R www-data:www-data /opt/drug_serve/backend/uploads
```

## 📊 部署检查清单

### 后端部署
- [ ] ECS 服务器已购买并配置
- [ ] 后端代码已部署
- [ ] 环境变量已配置（.env 文件）
- [ ] 后端服务已启动（`systemctl status drug-serve`）
- [ ] 防火墙已开放端口
- [ ] 后端可访问（`curl http://your-ip:8000/`）

### 前端部署
- [ ] ESA 应用已创建
- [ ] 环境变量 `VITE_API_BASE_URL` 已配置
- [ ] 前端已构建并部署
- [ ] 前端可访问

### 功能验证
- [ ] 前端页面正常加载
- [ ] 可以上传图片
- [ ] AI 识别功能正常
- [ ] 药品列表显示正常

## 🎉 部署完成

部署完成后，你的应用架构：

```
用户浏览器
    ↓
ESA 前端（静态文件）
    ↓
ECS 后端（API 服务）
    ↓
豆包 API（AI 服务）
```

---

**按照以上步骤操作，即可完成完整部署！** 🚀

