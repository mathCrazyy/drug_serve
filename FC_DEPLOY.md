# 阿里云函数计算 (Function Compute) 部署指南

## 问题解决

### 错误信息
```
Code: CAExited
Message: Function instance exited unexpectedly(code 1, message:operation not permitted) 
with start command './bootstrap'.
Logs: /var/fc/lang/python3.10/bin/python3: No module named uvicorn
```

### 原因分析
1. **缺少 uvicorn 模块**：函数计算环境未正确安装依赖
2. **bootstrap 文件问题**：启动脚本可能不正确或缺少执行权限

## 解决方案

### 1. 确保依赖正确安装

已更新 `backend/requirements.txt`，包含所有必需依赖：
- `uvicorn[standard]==0.24.0` - ASGI 服务器
- `mangum==0.17.0` - FastAPI 到函数计算的适配器
- 其他所有后端依赖

### 2. Bootstrap 文件

已创建 `backend/bootstrap` 文件，支持：
- 自动检测并使用 mangum 适配器（推荐）
- 如果没有 mangum，回退到直接使用 uvicorn
- 正确的 Python 路径配置

### 3. 函数计算配置

在阿里云函数计算控制台配置：

#### 基本配置
- **运行环境**：Python 3.10
- **代码包**：上传 `backend/` 目录（或整个项目）
- **启动命令**：`./bootstrap`（或留空使用默认）
- **工作目录**：`/code`（或函数计算指定的目录）

#### 环境变量
```
API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
API_KEY=your-api-key
MODEL_ID=your-model-id
DATABASE_URL=sqlite:///./drugs.db
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE=10485760
PORT=9000
```

#### 函数入口
- **处理程序**：`bootstrap.handler`（如果使用 mangum）
- 或：`bootstrap`（直接运行）

### 4. 打包部署

#### 方法一：使用 Dockerfile 构建自定义运行时（推荐）

对于自定义运行时，**必须使用 Dockerfile 构建镜像**，在构建时安装依赖：

1. **构建 Docker 镜像**：
```bash
cd backend
docker build -t drug-serve-fc:latest -f Dockerfile .
```

2. **导出镜像为 tar 文件**：
```bash
docker save drug-serve-fc:latest -o drug-serve-fc.tar
```

3. **在函数计算控制台**：
   - 选择"自定义运行时"
   - 上传 `drug-serve-fc.tar` 镜像文件
   - 启动命令：`./bootstrap`

#### 方法二：直接上传代码包（不推荐，依赖可能无法安装）

1. 打包 backend 目录：
```bash
cd backend
zip -r function.zip . -x "venv/*" -x "__pycache__/*" -x "*.pyc" -x ".git/*" -x "*.db"
```

2. 在函数计算控制台上传 `function.zip`

**注意**：此方法可能无法正确安装依赖，建议使用方法一。

#### 方法二：使用命令行工具

```bash
# 安装函数计算 CLI
npm install -g @alicloud/fun

# 配置
fun config

# 部署
fun deploy
```

### 5. 创建函数配置文件（可选）

在 `backend/` 目录创建 `template.yml`：

```yaml
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  drug-serve:
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Description: '药品识别与提醒系统'
    api:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Description: 'FastAPI 后端服务'
        CodeUri: './'
        Handler: 'bootstrap.handler'
        Runtime: python3.10
        Timeout: 60
        MemorySize: 512
        EnvironmentVariables:
          API_BASE_URL: 'https://ark.cn-beijing.volces.com/api/v3'
          DATABASE_URL: 'sqlite:///./drugs.db'
          UPLOAD_DIR: '/tmp/uploads'
```

## 验证部署

### 测试函数

部署后，在函数计算控制台：
1. 进入函数详情
2. 点击"测试函数"
3. 使用 HTTP 触发器测试

### 检查日志

查看函数计算日志，确认：
- ✅ 依赖安装成功
- ✅ bootstrap 文件执行成功
- ✅ 应用启动无错误

## 常见问题

### 1. 仍然提示 "No module named uvicorn"

**解决方案**：

**重要**：对于自定义运行时，必须使用 Dockerfile 构建镜像！

1. **使用 Dockerfile 构建**（推荐）：
   ```bash
   cd backend
   docker build -t drug-serve-fc:latest -f Dockerfile .
   docker save drug-serve-fc:latest -o drug-serve-fc.tar
   ```
   然后在函数计算控制台上传 `drug-serve-fc.tar`

2. **检查 bootstrap 脚本**：
   - ✅ 已改进：添加了详细的日志输出和错误检查
   - 脚本会在启动前强制安装依赖
   - 会验证关键依赖是否安装成功

3. **查看日志**：
   - 在函数计算控制台查看"日志输出"
   - 检查是否有依赖安装的错误信息
   - 确认 Python 路径是否正确

4. **确保文件结构**：
   - `bootstrap` 文件在代码包根目录
   - `requirements.txt` 在代码包根目录
   - `app/` 目录包含所有应用代码

### 2. Bootstrap 权限错误

**解决方案**：
```bash
chmod +x bootstrap
# 确保在打包时包含执行权限
```

### 3. 端口问题

函数计算使用固定端口，通常通过环境变量 `PORT` 或 `FC_SERVER_PORT` 获取。
已配置默认端口 9000。

### 4. 数据库文件路径

函数计算使用临时存储，数据库文件应保存在 `/tmp/` 目录：
```python
DATABASE_URL=sqlite:////tmp/drugs.db
```

## 注意事项

1. **临时存储**：函数计算使用临时存储，重启后数据会丢失
   - 建议使用云数据库（RDS）或对象存储（OSS）
   
2. **冷启动**：首次调用可能有延迟
   - 可以配置预留实例避免冷启动
   
3. **超时设置**：根据实际需求设置函数超时时间
   - 图片处理可能需要较长时间
   
4. **内存配置**：图片处理需要足够内存
   - 建议至少 512MB

## 相关文件

- `backend/bootstrap` - 启动脚本
- `backend/requirements.txt` - Python 依赖
- `backend/app/main.py` - FastAPI 应用入口

