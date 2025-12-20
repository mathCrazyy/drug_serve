# 部署指南

## 阿里云 ECS 部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Python 3.9+
sudo apt install python3 python3-pip python3-venv -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Nginx
sudo apt install nginx -y
```

### 2. 克隆项目

```bash
cd /var/www
sudo git clone <your-github-repo-url> drug_serve
sudo chown -R $USER:$USER drug_serve
cd drug_serve
```

### 3. 后端部署

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
nano .env  # 编辑并填入正确的配置

# 测试运行
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. 配置 systemd 服务

创建 `/etc/systemd/system/drug-serve-backend.service`:

```ini
[Unit]
Description=Drug Serve Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/drug_serve/backend
Environment="PATH=/var/www/drug_serve/backend/venv/bin"
ExecStart=/var/www/drug_serve/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable drug-serve-backend
sudo systemctl start drug-serve-backend
sudo systemctl status drug-serve-backend
```

### 5. 前端构建

```bash
cd /var/www/drug_serve/frontend

# 安装依赖
npm install

# 配置环境变量
echo "VITE_API_BASE_URL=http://your-domain.com" > .env.production

# 构建
npm run build
```

### 6. 配置 Nginx

创建 `/etc/nginx/sites-available/drug-serve`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/drug_serve/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 上传的图片
    location /uploads {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/drug-serve /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. 配置 SSL（可选，使用 Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## GitHub Pages 部署（仅前端）

1. 修改 `frontend/vite.config.ts` 添加 base 路径
2. 构建前端：`npm run build`
3. 将 `dist` 目录内容推送到 GitHub Pages

## Docker 部署（可选）

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - API_BASE_URL=${API_BASE_URL}
      - API_KEY=${API_KEY}
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/drugs.db:/app/drugs.db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

