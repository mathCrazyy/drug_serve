# 函数计算启动命令错误修复

## 🔴 当前错误

```json
{
  "RequestId": "1-694768fc-151caf39-73d6898abd61",
  "Code": "CAExited",
  "Message": "Function instance exited unexpectedly(code 2, message:no such file or directory) with start command 'python3 app.py'.\nLogs:python3: can't open file '/code/app.py': [Errno 2] No such file or directory"
}
```

## 🔍 问题原因

函数计算的启动命令配置错误：
- 当前配置：`python3 app.py`
- 实际文件：`app/main.py`（不是 `app.py`）
- 对于 Web 函数，应该使用 `app.main.app` 作为请求处理程序

## ✅ 解决方法

### 方法 1: 检查函数类型（重要）

首先确认你创建的是 **Web 函数**，而不是事件函数：

1. **检查函数类型**
   - 在函数详情页，查看函数类型
   - 应该是"Web 函数"
   - 如果是"事件函数"，需要删除并重新创建为 Web 函数

### 方法 2: 检查请求处理程序配置

1. **进入配置页面**
   - 在函数详情页，点击"配置"标签
   - 找到"请求处理程序"或"Handler"设置

2. **检查请求处理程序**
   - 应该是：`app.main.app`
   - 如果是 `app.py` 或其他值，需要修改

3. **修改请求处理程序**
   - 将请求处理程序改为：`app.main.app`
   - 这是 FastAPI 应用对象的路径
   - 保存修改

### 方法 3: 检查代码结构

确认上传的代码结构正确：

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          ← FastAPI 应用在这里
│   ├── database.py
│   ├── models.py
│   ├── routers/
│   │   ├── __init__.py
│   │   └── drugs.py
│   └── services/
│       ├── __init__.py
│       └── doubao_api.py
├── requirements.txt
└── .env.example
```

### 方法 4: 如果是事件函数，需要重新创建

如果当前是事件函数，需要删除并重新创建为 Web 函数：

1. **删除现有函数**
   - 在函数详情页，点击"删除函数"
   - 确认删除

2. **重新创建 Web 函数**
   - 参考 `FC_一步一步部署教程.md`
   - 选择"Web 函数"（不是事件函数）
   - 请求处理程序：`app.main.app`
   - 上传代码
   - 配置环境变量

## 📝 正确的配置

### Web 函数配置

- **函数类型**：Web 函数
- **运行环境**：Python 3.9 或 Python 3.10
- **请求处理程序类型**：处理 HTTP 请求
- **请求处理程序**：`app.main.app`
- **认证方式**：无需认证

### 代码结构

确保上传的代码包含：
- `app/` 目录
- `app/main.py` 文件（FastAPI 应用）
- `requirements.txt` 文件

## 🧪 验证修复

修复后，测试：

```bash
curl https://drug-se-backend-laubwkztsv.cn-hangzhou.fcapp.run/
```

应该返回：
```json
{"message":"药品识别与提醒系统 API","docs":"/docs"}
```

## ⚠️ 常见错误配置

### 错误 1: 请求处理程序错误

❌ 错误：`app.py`
✅ 正确：`app.main.app`

### 错误 2: 函数类型错误

❌ 错误：事件函数
✅ 正确：Web 函数

### 错误 3: 代码结构错误

❌ 错误：只上传了 `app.py` 文件
✅ 正确：上传整个 `backend/` 目录

## 🔧 快速修复步骤

1. **检查函数类型**
   - 如果是事件函数 → 删除并重新创建为 Web 函数
   - 如果是 Web 函数 → 继续下一步

2. **检查请求处理程序**
   - 进入"配置"页面
   - 确认请求处理程序是 `app.main.app`
   - 如果不是，修改并保存

3. **检查代码上传**
   - 确认上传了整个 `backend/` 目录
   - 确认包含 `app/main.py` 文件

4. **重新部署**
   - 保存所有配置
   - 等待部署完成

5. **测试**
   - 使用 curl 测试函数地址

---

**按照以上步骤修复，问题应该就能解决了！** 🚀

