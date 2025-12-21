# 阿里云函数计算（FC）部署后端指南

## 📋 概述

使用阿里云函数计算（FC）部署后端服务，无需管理服务器，按需付费，适合中小型应用。

## 🎯 部署架构

```
前端（ESA） → 函数计算（FC） → 豆包 API
```

## 📝 详细步骤

### 第一步：准备代码

1. **确保代码已推送到 GitHub**
   ```bash
   git push origin main
   ```

2. **检查后端代码结构**
   ```
   backend/
   ├── app/
   │   ├── main.py          # FastAPI 应用入口
   │   ├── routers/
   │   ├── services/
   │   └── ...
   ├── requirements.txt     # Python 依赖
   └── .env.example         # 环境变量模板
   ```

### 第二步：创建函数计算服务

1. **登录阿里云控制台**
   - 访问：https://fcnext.console.aliyun.com/
   - 或搜索"函数计算"

2. **创建服务**
   - 点击"创建服务"
   - 服务名称：`drug-serve-backend`
   - 描述：药品识别系统后端服务
   - 点击"确定"

### 第三步：创建函数

1. **在服务中创建函数**
   - 进入刚创建的服务
   - 点击"创建函数"

2. **选择创建方式**
   - 选择"使用自定义运行时创建"
   - 或选择"Web 函数"（推荐，专门用于 HTTP 服务）

#### 方式 A: Web 函数（推荐）

1. **基本配置**
   - 函数名称：`drug-api`
   - 运行环境：Python 3.9
   - 请求处理程序类型：处理 HTTP 请求
   - 请求处理程序：`app.main.app`（FastAPI 应用对象）

2. **代码配置**
   - 代码上传方式：选择"通过文件夹上传"或"通过 ZIP 包上传"
   - 需要上传整个 `backend/` 目录

3. **环境变量配置**
   在"环境变量"中添加：
   ```
   API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
   API_KEY=your-api-key-here
   MODEL_ID=your-model-id-here
   DATABASE_URL=sqlite:///./drugs.db
   UPLOAD_DIR=/tmp/uploads
   MAX_FILE_SIZE=10485760
   ```

4. **高级配置**
   - 超时时间：60 秒（AI 识别可能需要较长时间）
   - 内存规格：512 MB 或 1024 MB
   - 实例并发：1（根据需求调整）

#### 方式 B: 自定义运行时

1. **创建 bootstrap 文件**
   
   在 `backend/` 目录创建 `bootstrap` 文件：
   ```bash
   #!/bin/bash
   cd /code
   source venv/bin/activate
   exec uvicorn app.main:app --host 0.0.0.0 --port 9000
   ```
   
   设置执行权限：
   ```bash
   chmod +x backend/bootstrap
   ```

2. **创建函数入口文件**
   
   创建 `backend/index.py`：
   ```python
   import os
   import sys
   
   # 添加当前目录到 Python 路径
   sys.path.insert(0, os.path.dirname(__file__))
   
   from app.main import app
   
   # FC 会调用这个 handler
   def handler(environ, start_response):
       return app(environ, start_response)
   ```

3. **打包代码**
   ```bash
   cd backend
   zip -r function.zip . -x "*.pyc" "__pycache__/*" "*.git*" "venv/*"
   ```

### 第四步：配置 HTTP 触发器

1. **创建触发器**
   - 在函数详情页，点击"触发器"
   - 点击"创建触发器"

2. **触发器配置**
   - 触发器类型：HTTP 触发器
   - 请求方法：GET, POST, PUT, DELETE（全选）
   - 认证方式：匿名访问（或根据需要选择）
   - 路径：`/api/*`（或 `/`）

3. **获取访问地址**
   - 创建触发器后，会生成一个 HTTP 访问地址
   - 格式类似：`https://your-service.cn-hangzhou.fcapp.run`
   - 复制这个地址，后续在 ESA 配置中使用

### 第五步：处理文件上传

函数计算是临时环境，需要特殊处理文件上传：

#### 方案 1: 使用 OSS（推荐）

1. **创建 OSS Bucket**
   - 在阿里云 OSS 控制台创建存储桶
   - 记录 Bucket 名称和访问域名

2. **修改后端代码**
   
   安装 OSS SDK：
   ```bash
   pip install oss2
   ```
   
   修改 `backend/app/routers/drugs.py`，使用 OSS 存储：
   ```python
   import oss2
   
   # 初始化 OSS 客户端
   auth = oss2.Auth(os.getenv('OSS_ACCESS_KEY_ID'), os.getenv('OSS_ACCESS_KEY_SECRET'))
   bucket = oss2.Bucket(auth, os.getenv('OSS_ENDPOINT'), os.getenv('OSS_BUCKET_NAME'))
   
   # 上传文件到 OSS
   async def upload_to_oss(file_data: bytes, file_name: str) -> str:
       object_key = f"uploads/{file_name}"
       bucket.put_object(object_key, file_data)
       return f"https://{os.getenv('OSS_BUCKET_NAME')}.{os.getenv('OSS_ENDPOINT')}/{object_key}"
   ```

3. **配置环境变量**
   ```
   OSS_ACCESS_KEY_ID=your-access-key-id
   OSS_ACCESS_KEY_SECRET=your-access-key-secret
   OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
   OSS_BUCKET_NAME=your-bucket-name
   ```

#### 方案 2: 使用临时目录（简单但不持久）

修改代码使用 `/tmp` 目录：
```python
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/uploads")
```

**注意**：函数计算实例重启后，`/tmp` 目录会被清空。

### 第六步：配置数据库

函数计算是临时环境，SQLite 文件也会丢失。建议：

#### 方案 1: 使用 RDS（推荐）

1. **创建 RDS 实例**
   - 在阿里云 RDS 控制台创建 MySQL 或 PostgreSQL 实例
   - 记录连接信息

2. **修改数据库配置**
   ```python
   # 修改 backend/app/database.py
   DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://user:password@host:port/dbname")
   ```

3. **安装数据库驱动**
   ```bash
   # MySQL
   pip install pymysql
   
   # PostgreSQL
   pip install psycopg2-binary
   ```

#### 方案 2: 使用表格存储（TableStore）

适合简单的键值存储场景。

### 第七步：在 ESA 配置前端

1. **登录 ESA 控制台**
   - https://esa.console.aliyun.com/
   - 找到应用：`drug_serve`

2. **配置环境变量**
   - 进入应用设置 → 环境变量
   - 添加：
     ```
     VITE_API_BASE_URL=https://your-service.cn-hangzhou.fcapp.run
     ```
     （使用第四步获取的 HTTP 触发器地址）

3. **重新构建部署**
   - 保存环境变量
   - 触发新的构建
   - 等待部署完成

### 第八步：测试部署

1. **测试函数**
   ```bash
   # 测试健康检查
   curl https://your-service.cn-hangzhou.fcapp.run/
   
   # 测试 API
   curl https://your-service.cn-hangzhou.fcapp.run/api/drugs
   ```

2. **测试前端**
   - 访问 ESA 提供的前端地址
   - 尝试上传图片
   - 检查是否能正常识别

## 🔧 常见问题

### 问题 1: 函数超时

**原因**：AI 识别可能需要较长时间

**解决**：
- 增加函数超时时间（最大 600 秒）
- 优化代码，使用异步处理
- 考虑使用异步任务（如消息队列）

### 问题 2: 内存不足

**原因**：图片处理需要较多内存

**解决**：
- 增加内存规格（512 MB → 1024 MB 或更高）
- 优化图片处理逻辑

### 问题 3: 文件上传失败

**原因**：函数计算临时目录限制

**解决**：
- 使用 OSS 存储文件（推荐）
- 或使用表格存储

### 问题 4: CORS 错误

**原因**：函数计算需要配置 CORS

**解决**：在函数配置中添加 CORS 响应头：
```python
# 在 app/main.py 中
@app.middleware("http")
async def add_cors_header(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response
```

## 📊 成本估算

函数计算按调用次数和运行时间计费：
- **调用次数**：前 100 万次免费
- **执行时间**：按 GB-秒计费
- **内存**：按配置的内存规格计费

对于中小型应用，月费用通常在 10-50 元。

## 📝 完整配置示例

### requirements.txt 需要包含

```
fastapi==0.104.1
uvicorn==0.24.0
python-multipart==0.0.6
aiofiles==23.2.1
httpx==0.25.2
python-dotenv==1.0.0
sqlalchemy==2.0.23
pillow==10.1.0
oss2==2.18.0  # 如果使用 OSS
pymysql==1.1.0  # 如果使用 MySQL
```

### 环境变量配置

```
API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
API_KEY=your-api-key
MODEL_ID=your-model-id
DATABASE_URL=mysql+pymysql://user:pass@host:3306/dbname
OSS_ACCESS_KEY_ID=your-key-id
OSS_ACCESS_KEY_SECRET=your-key-secret
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET_NAME=your-bucket-name
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE=10485760
```

## ✅ 部署检查清单

- [ ] 函数计算服务已创建
- [ ] 函数已创建并配置
- [ ] HTTP 触发器已创建
- [ ] 环境变量已配置（豆包 API、OSS、数据库等）
- [ ] 代码已上传
- [ ] 函数可以正常调用（测试 HTTP 触发器地址）
- [ ] ESA 前端已配置 `VITE_API_BASE_URL`
- [ ] 前端可以正常访问后端 API

## 🎉 完成

部署完成后，你的应用架构：

```
用户浏览器
    ↓
ESA 前端（静态文件）
    ↓
函数计算（FC）- 后端 API
    ↓
OSS（文件存储）
    ↓
RDS（数据库）
    ↓
豆包 API（AI 服务）
```

---

**按照以上步骤操作，即可完成函数计算部署！** 🚀

