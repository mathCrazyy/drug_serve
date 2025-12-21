# 函数计算依赖安装问题修复

## 🔴 当前错误

```json
{
  "RequestId": "1-69477ca2-154ce50c-d79aeba3c2f8",
  "Code": "CAExited",
  "Message": "Function instance exited unexpectedly(code 1, message:operation not permitted) with start command 'python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000'.\nLogs:/var/fc/lang/python3.10/bin/python3: No module named uvicorn"
}
```

## 🔍 问题原因

**自定义运行时**环境中，Python 依赖包没有被自动安装。

- `uvicorn` 模块不存在
- `requirements.txt` 中的依赖没有被安装
- 自定义运行时需要手动处理依赖安装

## ✅ 解决方案

### 方案 1: 改用 Web 函数（强烈推荐）

**Web 函数会自动安装依赖**，不需要手动处理。

1. **删除当前函数**
   - 在函数详情页，点击"删除函数"
   - 确认删除

2. **重新创建 Web 函数**
   - 选择"Web 函数"（不是自定义运行时）
   - 请求处理程序：`app.main.app`
   - 上传代码（包含 `requirements.txt`）
   - Web 函数会自动安装 `requirements.txt` 中的依赖

**这是最简单的解决方案！**

### 方案 2: 修复自定义运行时（如果必须使用）

如果必须使用自定义运行时，需要修改启动脚本自动安装依赖。

#### 步骤 1: 修改 bootstrap 文件

更新 `backend/bootstrap` 文件：

```bash
#!/bin/bash
cd /code

# 安装依赖（如果还没有安装）
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
else
    source venv/bin/activate
fi

# 设置 Python 路径
export PYTHONPATH=/code:$PYTHONPATH

# 启动应用
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000
```

#### 步骤 2: 重新上传代码

1. **打包代码**
   ```bash
   cd /Users/chunshengwu/code/drug_serve/backend
   zip -r function.zip . -x "*.pyc" "__pycache__/*" "*.git*" "venv/*" "*.db" "uploads/*"
   ```

2. **上传代码**
   - 在函数计算控制台，点击"上传代码"
   - 选择 `function.zip` 文件

#### 步骤 3: 配置启动命令

- 启动命令：`./bootstrap`
- 或：`bash bootstrap`

## 📋 requirements.txt 内容

确保 `requirements.txt` 包含：

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
sqlalchemy==2.0.23
aiofiles==23.2.1
httpx==0.25.2
python-dotenv==1.0.0
pillow==10.1.0
```

## 🎯 推荐操作

**强烈推荐使用方案 1：改用 Web 函数**

原因：
1. ✅ Web 函数自动安装依赖
2. ✅ 配置更简单
3. ✅ 不需要修改启动脚本
4. ✅ 更少的配置错误

## 📝 如果选择方案 1（推荐）

### 重新创建 Web 函数的完整步骤

1. **删除当前函数**
   - 函数详情页 → 删除函数

2. **创建新函数**
   - 选择"**Web 函数**"（重要！）
   - 函数名称：`drug-api`
   - 运行环境：Python 3.9 或 Python 3.10

3. **配置请求处理程序**
   - 请求处理程序类型：处理 HTTP 请求
   - 请求处理程序：`app.main.app`

4. **上传代码**
   - 上传整个 `backend/` 目录
   - **确保包含 `requirements.txt` 文件**
   - Web 函数会自动安装依赖

5. **配置环境变量**
   - 添加 6 个环境变量（参考之前的文档）

6. **创建 HTTP 触发器**
   - 认证方式：无需认证

## 🧪 验证修复

修复后，测试：

```bash
curl https://drug-se-backend-laubwkztsv.cn-hangzhou.fcapp.run/
```

应该返回：
```json
{"message":"药品识别与提醒系统 API","docs":"/docs"}
```

## ⚠️ 关键区别

| 特性 | Web 函数 | 自定义运行时 |
|------|---------|------------|
| 依赖安装 | ✅ 自动安装 | ❌ 需要手动处理 |
| 配置复杂度 | ⭐ 简单 | ⭐⭐⭐ 复杂 |
| 启动脚本 | 不需要 | 需要 bootstrap |
| **推荐** | ✅ | ❌ |

---

**建议：删除当前函数，重新创建为 Web 函数，这样会自动安装依赖！** 🚀

