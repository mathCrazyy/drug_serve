# 快速开始 - 函数计算部署

## 三步部署

### 步骤 1: 构建镜像

```bash
cd backend
./build_fc_image.sh
```

这会生成 `drug-serve-fc.tar` 文件。

### 步骤 2: 上传镜像

1. 登录阿里云函数计算控制台
2. 进入你的函数 → "代码"标签页
3. 选择"自定义运行时"
4. 上传 `drug-serve-fc.tar` 文件

### 步骤 3: 配置并测试

1. **启动命令**: `./bootstrap`
2. **环境变量**（可选）:
   ```
   API_KEY=your-api-key
   MODEL_ID=your-model-id
   ```
3. 点击"测试函数"验证部署

## 详细说明

查看 [FC_BUILD_GUIDE.md](./FC_BUILD_GUIDE.md) 获取完整指南。

