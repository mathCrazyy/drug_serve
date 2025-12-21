# 函数计算部署故障排查指南

## 当前错误

```
Code: CAExited
Message: Function instance exited unexpectedly(code 1, message:operation not permitted) 
with start command './bootstrap'.
Logs: /var/fc/lang/python3.10/bin/python3: No module named uvicorn
```

## 问题分析

### 根本原因

函数计算使用特定的 Python 解释器路径：`/var/fc/lang/python3.10/bin/python3`

但依赖可能安装到了系统 Python 环境，导致函数计算的 Python 解释器找不到模块。

### 解决方案

已更新 `bootstrap` 脚本，现在会：

1. **自动检测 Python 解释器路径**
   - 优先使用 `/var/fc/lang/python3.10/bin/python3`
   - 如果不存在，回退到系统 Python

2. **使用对应的 pip 安装依赖**
   - 确保依赖安装到正确的 Python 环境

3. **详细的日志输出**
   - 显示使用的 Python 和 pip 路径
   - 显示依赖安装过程
   - 显示验证结果

## 部署步骤

### 方法一：使用 Dockerfile 构建（最可靠）

1. **构建镜像**：
```bash
cd backend
docker build -t drug-serve-fc:latest -f Dockerfile .
```

2. **导出镜像**：
```bash
docker save drug-serve-fc:latest -o drug-serve-fc.tar
```

3. **在函数计算控制台**：
   - 选择"自定义运行时"
   - 上传 `drug-serve-fc.tar`
   - 启动命令：`./bootstrap`

### 方法二：直接上传代码包

1. **打包代码**：
```bash
cd backend
# 确保 bootstrap 有执行权限
chmod +x bootstrap
# 打包（排除不必要的文件）
zip -r function.zip . \
    -x "venv/*" \
    -x "__pycache__/*" \
    -x "*.pyc" \
    -x ".git/*" \
    -x "*.db" \
    -x ".history/*"
```

2. **在函数计算控制台**：
   - 上传 `function.zip`
   - 启动命令：`./bootstrap`

## 验证步骤

部署后，查看函数计算的"日志输出"，应该看到：

```
=== 环境信息 ===
使用 Python: /var/fc/lang/python3.10/bin/python3
Python 版本: Python 3.10.x
使用 Pip: /var/fc/lang/python3.10/bin/pip3
...
=== 安装 Python 依赖 ===
[依赖安装日志]
...
=== 验证依赖安装 ===
✓ uvicorn: 0.24.0
✓ fastapi: 0.104.1
...
=== 启动 FastAPI 应用 ===
```

## 常见问题

### 1. 仍然提示 "No module named uvicorn"

**检查清单**：
- [ ] 查看日志，确认使用的 Python 路径
- [ ] 确认 pip 安装是否成功（查看日志中的安装输出）
- [ ] 确认使用的是函数计算的 Python（`/var/fc/lang/python3.10/bin/python3`）

**解决方法**：
- 使用 Dockerfile 构建镜像（推荐）
- 或者在 bootstrap 中强制使用函数计算的 pip：
  ```bash
  /var/fc/lang/python3.10/bin/pip3 install -r requirements.txt
  ```

### 2. "operation not permitted" 错误

**原因**：可能是文件权限问题

**解决方法**：
```bash
chmod +x bootstrap
# 确保在打包时包含执行权限
```

### 3. 依赖安装失败

**可能原因**：
- 网络问题
- 镜像源问题
- 权限问题

**解决方法**：
- 检查日志中的 pip 安装输出
- 尝试不同的镜像源
- 使用 Dockerfile 在构建时安装依赖

## 调试技巧

### 查看完整日志

在函数计算控制台：
1. 进入函数详情
2. 点击"日志输出"标签
3. 查看完整的启动日志

### 测试依赖安装

可以在 bootstrap 脚本中添加测试：
```bash
# 测试导入
$PYTHON -c "import sys; print(sys.path)"
$PYTHON -c "import uvicorn; print(uvicorn.__file__)"
```

### 检查文件结构

确保代码包包含：
```
/code/
  ├── bootstrap          # 启动脚本（必须有执行权限）
  ├── requirements.txt   # 依赖列表
  ├── app/              # 应用代码
  │   ├── __init__.py
  │   ├── main.py
  │   └── ...
  └── ...
```

## 联系支持

如果问题仍然存在：
1. 收集完整的日志输出
2. 记录使用的 Python 和 pip 路径
3. 记录依赖安装的输出
4. 联系阿里云函数计算技术支持

