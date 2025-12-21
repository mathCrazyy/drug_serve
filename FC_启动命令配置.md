# 函数计算启动命令配置

## 📋 当前界面

你看到的是启动命令配置界面：
- 选中的是"命令模式"
- 输入框显示：`python3 app.py`

## ✅ 应该配置什么？

### 方案 1: 使用命令模式（推荐）

1. **保持"命令模式"选中**
   - 不要改变，继续使用命令模式

2. **修改输入框内容**
   - 删除：`python3 app.py`
   - 输入：`python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000`

3. **保存配置**

### 方案 2: 使用 Bash 脚本模式

1. **选择"Bash 脚本模式"**
   - 点击第四个选项"Bash 脚本模式"

2. **输入框内容**
   - 输入：`./bootstrap`
   - 或：`bash bootstrap`

3. **保存配置**
   - **注意**：需要确保代码中已包含 `bootstrap` 文件

## 🎯 推荐配置

### 推荐使用方案 1（命令模式）

**配置内容**：
```
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000
```

**说明**：
- `python3 -m uvicorn`：使用 uvicorn 运行 FastAPI 应用
- `app.main:app`：应用对象的路径（app 模块的 main 子模块的 app 对象）
- `--host 0.0.0.0`：监听所有网络接口
- `--port 9000`：函数计算默认端口是 9000

## 📝 完整配置步骤

1. **在启动命令配置界面**
   - 保持"命令模式"选中（当前已选中）

2. **修改输入框**
   - 删除：`python3 app.py`
   - 输入：`python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000`

3. **保存配置**
   - 点击"保存"或"确定"按钮
   - 等待配置生效

4. **重新测试**
   ```bash
   curl https://drug-se-backend-laubwkztsv.cn-hangzhou.fcapp.run/
   ```

## ⚠️ 注意事项

1. **端口号**
   - 函数计算自定义运行时默认端口是 9000
   - 不要使用 8000（那是本地开发端口）

2. **应用路径**
   - 正确：`app.main:app`（app 模块的 main 子模块的 app 对象）
   - 错误：`app.py`（文件不存在）

3. **命令格式**
   - 使用 `python3 -m uvicorn` 而不是直接 `python3 app.py`
   - 因为 FastAPI 应用需要通过 uvicorn 运行

## 🧪 验证配置

配置完成后，测试：

```bash
curl https://drug-se-backend-laubwkztsv.cn-hangzhou.fcapp.run/
```

应该返回：
```json
{"message":"药品识别与提醒系统 API","docs":"/docs"}
```

## 📊 配置对比

| 模式 | 配置内容 | 适用场景 |
|------|---------|---------|
| **命令模式** | `python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000` | ✅ 推荐 |
| Bash 脚本模式 | `./bootstrap` | 需要复杂启动逻辑 |
| 默认模式 | 自动检测 | 不适用 |
| 数组模式 | 命令数组 | 不适用 |

---

**在输入框中输入：`python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9000`** 🚀

