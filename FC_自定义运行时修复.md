# 函数计算自定义运行时修复指南

## 🔴 当前问题

错误信息：
```
Function instance exited unexpectedly (code 2, message: no such file or directory) 
with start command 'python3 app.py'.
Logs: python3: can't open file '/code/app.py': [Errno 2] No such file or directory
```

运行环境显示：**自定义运行时(Debian 10) Python 3.10**

## 🔍 问题分析

你创建的是**自定义运行时**函数，而不是 **Web 函数**。

自定义运行时需要：
1. 创建 `bootstrap` 启动脚本
2. 配置正确的启动命令

## ✅ 解决方案

### 方案 1: 改为 Web 函数（推荐）

**最简单的方法**：删除当前函数，重新创建为 Web 函数。

1. **删除当前函数**
   - 在函数详情页，点击"删除函数"
   - 确认删除

2. **重新创建 Web 函数**
   - 选择"Web 函数"（不是自定义运行时）
   - 请求处理程序：`app.main.app`
   - 上传代码
   - 配置环境变量

**详细步骤参考：`FC_一步一步部署教程.md`**

### 方案 2: 修复自定义运行时（如果必须使用）

如果你必须使用自定义运行时，需要创建启动脚本：

#### 步骤 1: 创建 bootstrap 文件

在 `backend/` 目录创建 `bootstrap` 文件：

```bash
#!/bin/bash
cd /code
export PYTHONPATH=/code:$PYTHONPATH
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000
```

#### 步骤 2: 设置执行权限

```bash
chmod +x backend/bootstrap
```

#### 步骤 3: 修改函数配置

1. **进入函数配置**
   - 点击"配置"标签
   - 找到"启动命令"或"启动配置"

2. **配置启动命令**
   - 启动命令：`./bootstrap`
   - 或：`bash bootstrap`

3. **保存配置**

#### 步骤 4: 重新上传代码

1. **打包代码**
   ```bash
   cd /Users/chunshengwu/code/drug_serve/backend
   zip -r function.zip . -x "*.pyc" "__pycache__/*" "*.git*" "venv/*" "*.db" "uploads/*"
   ```

2. **上传代码**
   - 在函数计算控制台，点击"上传代码"
   - 选择 `function.zip` 文件
   - 等待上传完成

## 📊 两种方案对比

| 特性 | Web 函数 | 自定义运行时 |
|------|---------|------------|
| 配置复杂度 | ⭐ 简单 | ⭐⭐⭐ 复杂 |
| 启动脚本 | 不需要 | 需要 bootstrap |
| 请求处理程序 | `app.main.app` | 需要配置启动命令 |
| **推荐** | ✅ | ❌ |

## 🎯 推荐操作

**强烈推荐使用方案 1：改为 Web 函数**

原因：
1. 配置更简单
2. 不需要创建启动脚本
3. 更适合 FastAPI 应用
4. 更少的配置错误

## 📝 如果选择方案 1（推荐）

### 重新创建 Web 函数的步骤

1. **删除当前函数**
   - 函数详情页 → 删除函数

2. **创建新函数**
   - 选择"Web 函数"
   - 函数名称：`drug-api`
   - 运行环境：Python 3.9 或 Python 3.10

3. **配置请求处理程序**
   - 请求处理程序类型：处理 HTTP 请求
   - 请求处理程序：`app.main.app`

4. **上传代码**
   - 上传整个 `backend/` 目录
   - 确保包含 `app/main.py` 文件

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

---

**建议：删除当前函数，重新创建为 Web 函数，这样更简单！** 🚀

