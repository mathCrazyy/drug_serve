# FC Bootstrap 脚本修复说明

## 🔴 当前错误

```json
{
  "RequestId": "1-6947c544-15b91908-255a0d8692ed",
  "Code": "CAExited",
  "Message": "Function instance exited unexpectedly(code 1, message:operation not permitted) with start command './bootstrap'.\nLogs:/var/fc/lang/python3.10/bin/python3: No module named uvicorn"
}
```

## 🔍 问题分析

即使使用了 `./bootstrap` 启动命令，仍然出现 `No module named uvicorn` 错误。

**可能的原因：**
1. ✅ bootstrap 脚本执行了，但依赖安装失败
2. ✅ 自定义运行时环境可能没有权限创建 venv
3. ✅ 需要使用系统级 pip 安装，而不是 venv

## ✅ 修复方案

### 已更新 bootstrap 脚本

修改后的 `backend/bootstrap` 文件：

```bash
#!/bin/bash
cd /code

# 设置 Python 路径
export PYTHONPATH=/code:$PYTHONPATH

# 安装依赖到系统（FC 自定义运行时环境）
pip3 install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --user || pip3 install -r requirements.txt --user

# 启动应用
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000
```

**关键改动：**
- ❌ 移除了 venv 创建逻辑（FC 环境可能没有权限）
- ✅ 使用 `pip3 install --user` 安装到用户目录
- ✅ 添加了备用安装命令（如果镜像源失败，使用默认源）

## 📋 操作步骤

### 1. 重新打包代码

```bash
cd /Users/chunshengwu/code/drug_serve/backend
zip -r function.zip . -x "*.pyc" "__pycache__/*" "*.git*" "venv/*" "*.db" "uploads/*"
```

**确保包含：**
- ✅ `bootstrap` 文件（已更新）
- ✅ `requirements.txt` 文件
- ✅ `app/` 目录（所有 Python 代码）
- ✅ `.env` 文件（如果需要）

### 2. 上传代码到 FC

1. 进入函数计算控制台
2. 选择你的函数
3. 点击"上传代码"
4. 选择 `function.zip` 文件
5. 等待上传完成

### 3. 配置启动命令

- **启动命令**：`./bootstrap`
- 或：`bash bootstrap`
- 保存配置

### 4. 部署函数

点击"部署"按钮，等待部署完成。

## 🧪 验证

部署成功后，测试：

```bash
curl https://your-function-url.cn-hangzhou.fcapp.run/
```

应该返回：
```json
{"message":"药品识别与提醒系统 API","docs":"/docs"}
```

## ⚠️ 如果仍然失败

### 方案 A: 检查 bootstrap 文件权限

确保 bootstrap 文件有执行权限：

```bash
chmod +x bootstrap
```

然后重新打包上传。

### 方案 B: 使用 Web 函数（最推荐）

如果自定义运行时仍然有问题，**强烈建议改用 Web 函数**：

1. **删除当前函数**
2. **创建新函数**
   - 选择"**Web 函数**"
   - 请求处理程序：`app.main.app`
   - Web 函数会自动安装依赖，不需要 bootstrap 脚本

### 方案 C: 检查 requirements.txt

确保 `requirements.txt` 文件在代码包中，且内容正确：

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

## 📝 关键点

1. **自定义运行时需要手动安装依赖**
2. **使用 `--user` 标志安装到用户目录**（避免权限问题）
3. **bootstrap 脚本必须可执行**（`chmod +x bootstrap`）
4. **Web 函数更简单**（自动安装依赖）

## 🎯 推荐

如果修复后仍然有问题，**强烈建议改用 Web 函数**，因为：
- ✅ 自动安装依赖
- ✅ 不需要 bootstrap 脚本
- ✅ 配置更简单
- ✅ 更少的错误

---

**已更新 bootstrap 脚本，请重新打包上传代码！** 🚀

