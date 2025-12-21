# 阿里云函数计算镜像构建指南

## 快速开始

### 1. 构建镜像

在 `backend` 目录下运行：

```bash
./build_fc_image.sh
```

或者手动执行：

```bash
# 构建镜像
docker build -t drug-serve-fc:latest -f Dockerfile .

# 导出镜像
docker save drug-serve-fc:latest -o drug-serve-fc.tar
```

### 2. 上传到函数计算

1. 登录阿里云函数计算控制台
2. 进入你的函数
3. 选择"代码"标签页
4. 选择"自定义运行时"
5. 点击"上传镜像"
6. 选择 `drug-serve-fc.tar` 文件
7. 等待上传完成

### 3. 配置函数

#### 基本配置
- **启动命令**: `./bootstrap`
- **工作目录**: `/code`（默认）
- **运行环境**: 自定义运行时 (Debian10)

#### 环境变量（可选）

在函数配置中添加以下环境变量：

```
API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
API_KEY=your-api-key-here
MODEL_ID=your-model-id-here
DATABASE_URL=sqlite:////tmp/drugs.db
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE=10485760
PORT=9000
```

### 4. 测试部署

1. 点击"测试函数"
2. 查看"日志输出"确认应用启动成功
3. 应该能看到：
   - ✓ uvicorn 版本信息
   - ✓ fastapi 版本信息
   - ✓ 应用启动信息

## 构建过程说明

### 镜像构建步骤

1. **基础镜像**: 使用 `aliyunfc/runtime-python3.10:build-latest`
2. **安装依赖**: 从 `requirements.txt` 安装所有 Python 包
3. **复制代码**: 复制应用代码到 `/code` 目录
4. **设置权限**: 设置 bootstrap 文件为可执行
5. **验证**: 验证依赖和应用文件是否正确

### 镜像大小优化

- 使用 `.dockerignore` 排除不必要的文件
- 使用 `--no-cache-dir` 减少 pip 缓存
- 多阶段构建（如需要）

### 依赖安装

所有依赖在构建时安装到系统 Python 环境，运行时无需再次安装。

## 故障排查

### 构建失败

**问题**: `docker build` 失败

**解决方案**:
1. 检查 Docker 是否运行: `docker info`
2. 检查网络连接（需要下载基础镜像）
3. 检查 `requirements.txt` 文件是否存在
4. 查看构建日志中的具体错误信息

### 镜像上传失败

**问题**: 上传镜像文件失败

**解决方案**:
1. 检查文件大小（建议 < 500MB）
2. 检查网络连接
3. 尝试压缩镜像（使用 gzip）
4. 分块上传（如果文件很大）

### 运行时错误

**问题**: 函数启动失败

**解决方案**:
1. 查看函数计算的"日志输出"
2. 检查 bootstrap 文件是否有执行权限
3. 验证环境变量是否正确设置
4. 检查端口配置（应该是 9000）

## 文件说明

- `Dockerfile`: Docker 镜像构建文件
- `bootstrap`: 函数启动脚本（在镜像中）
- `build_fc_image.sh`: 自动化构建脚本
- `.dockerignore`: Docker 构建时忽略的文件
- `requirements.txt`: Python 依赖列表

## 注意事项

1. **镜像大小**: 构建后的镜像可能较大（包含所有依赖），这是正常的
2. **构建时间**: 首次构建可能需要较长时间（下载基础镜像和依赖）
3. **端口**: 函数计算使用固定端口 9000
4. **存储**: 使用 `/tmp` 目录存储临时文件（重启后丢失）

## 更新部署

当代码更新后：

1. 重新构建镜像: `./build_fc_image.sh`
2. 上传新的 `drug-serve-fc.tar` 文件
3. 函数计算会自动使用新镜像

## 相关文档

- [FC_DEPLOY.md](../FC_DEPLOY.md) - 完整部署指南
- [README.md](../README.md) - 项目说明

