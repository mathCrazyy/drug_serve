# 函数计算依赖安装问题排查

## 当前错误

```
Code: CAExited
Message: Function instance exited unexpectedly(code 1, message:operation not permitted) 
with start command './bootstrap'.
Logs: /var/fc/lang/python3.10/bin/python3: No module named uvicorn
```

## 问题分析

### 可能的原因

1. **权限问题**：函数计算环境可能不允许在运行时安装依赖
2. **依赖安装失败**：pip install 可能因为网络或权限问题失败
3. **Python 环境不匹配**：依赖安装到了错误的 Python 环境

## 解决方案

### 方案 1：使用 Dockerfile 构建镜像（强烈推荐）⭐

**这是最可靠的方案**，依赖在构建时安装，运行时不需要安装。

#### 步骤

1. **构建 Docker 镜像**：
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
   - 上传方式选择"镜像"
   - 上传 `drug-serve-fc.tar`
   - 启动命令：`./bootstrap`

#### 优点

- ✅ 依赖在构建时安装，启动快
- ✅ 不依赖运行时网络
- ✅ 不依赖运行时权限
- ✅ 可重复构建

### 方案 2：使用函数计算层（Layer）

如果无法使用 Dockerfile，可以创建函数计算层来预装依赖。

#### 步骤

1. **创建层**：
   ```bash
   # 在本地创建临时目录
   mkdir -p layer/python
   cd layer
   
   # 安装依赖到 layer/python
   pip3 install -r ../backend/requirements.txt \
       -t python \
       -i https://pypi.tuna.tsinghua.edu.cn/simple
   
   # 打包层
   zip -r layer.zip python/
   ```

2. **在函数计算控制台**：
   - 创建新层
   - 上传 `layer.zip`
   - 在函数配置中关联该层

3. **修改 bootstrap**：
   ```bash
   # 在 bootstrap 开头添加
   export PYTHONPATH=/opt/python:$PYTHONPATH
   ```

### 方案 3：检查并修复运行时安装

如果必须使用运行时安装，需要：

1. **确保 bootstrap 有执行权限**：
   ```bash
   chmod +x bootstrap
   ```

2. **检查函数计算配置**：
   - 执行超时：至少 300 秒（5分钟）
   - 内存：至少 512 MB
   - 网络：确保可以访问 PyPI

3. **查看详细日志**：
   - 在函数计算控制台查看"日志输出"
   - 新的 bootstrap 脚本会输出详细的安装日志
   - 查看是否有权限错误或网络错误

## 改进的 bootstrap 脚本

已更新 `bootstrap` 脚本，现在包含：

1. **详细的环境信息**：
   - Python 和 pip 路径
   - Python 版本信息
   - 当前工作目录

2. **依赖检查**：
   - 检查每个关键依赖是否已安装
   - 只在依赖缺失时安装

3. **错误处理**：
   - 显示 pip 安装的退出码
   - 验证安装是否成功
   - 提供详细的错误信息

4. **日志输出**：
   - 每个步骤都有日志
   - 方便排查问题

## 重新部署步骤

### 如果使用代码包部署

1. **重新打包**：
   ```bash
   cd backend
   chmod +x bootstrap
   zip -r function.zip . \
       -x "venv/*" \
       -x "__pycache__/*" \
       -x "*.pyc" \
       -x ".git/*" \
       -x "*.db" \
       -x ".history/*"
   ```

2. **上传到函数计算**：
   - 在函数计算控制台上传新的 `function.zip`
   - 确保启动命令是 `./bootstrap`

3. **查看日志**：
   - 等待几分钟（首次启动需要安装依赖）
   - 查看"日志输出"，应该看到详细的安装过程

### 如果使用 Dockerfile 部署

1. **构建镜像**：
   ```bash
   cd backend
   docker build -t drug-serve-fc:latest -f Dockerfile .
   docker save drug-serve-fc:latest -o drug-serve-fc.tar
   ```

2. **上传镜像**：
   - 在函数计算控制台选择"镜像"上传方式
   - 上传 `drug-serve-fc.tar`

3. **配置函数**：
   - 启动命令：`./bootstrap`
   - 监听端口：`9000`

## 验证部署

部署后，查看函数计算的"日志输出"，应该看到：

```
=== 环境信息 ===
使用 Python: /var/fc/lang/python3.10/bin/python3
Python 版本: Python 3.10.x
使用 Pip: /var/fc/lang/python3.10/bin/pip3
...
=== 检查依赖 ===
uvicorn 未安装
fastapi 未安装
...
=== 安装 Python 依赖（首次启动）===
[安装日志]
...
✓ 依赖安装完成
=== 启动 FastAPI 应用 ===
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:9000
```

## 常见错误

### 错误 1：operation not permitted

**原因**：函数计算环境可能不允许在运行时安装依赖

**解决**：使用 Dockerfile 构建镜像，在构建时安装依赖

### 错误 2：No module named uvicorn

**原因**：
- 依赖未安装
- 依赖安装到了错误的 Python 环境

**解决**：
- 检查 bootstrap 日志，确认依赖是否安装成功
- 确认使用的 Python 和 pip 路径正确
- 使用 Dockerfile 构建镜像

### 错误 3：pip install 超时

**原因**：网络慢或超时时间不够

**解决**：
- 增加函数计算的执行超时时间（至少 300 秒）
- 使用国内镜像源（已配置）
- 使用 Dockerfile 构建镜像

## 推荐方案

**强烈推荐使用 Dockerfile 构建镜像**，因为：

1. ✅ 依赖在构建时安装，启动快
2. ✅ 不依赖运行时网络和权限
3. ✅ 可重复构建，环境一致
4. ✅ 避免运行时安装的各种问题

如果必须使用代码包部署，确保：
- 执行超时至少 300 秒
- 内存至少 512 MB
- 网络可以访问 PyPI
- 查看详细日志排查问题

