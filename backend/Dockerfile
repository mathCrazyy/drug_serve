# 阿里云函数计算自定义运行时 Dockerfile
# 基础镜像：阿里云函数计算 Python 3.10 运行时
FROM aliyunfc/runtime-python3.10:build-latest

# 设置工作目录
WORKDIR /code

# 先复制依赖文件（利用 Docker 缓存层）
COPY requirements.txt .

# 安装 Python 依赖到系统目录
# 使用清华镜像源加速下载
RUN pip3 install --no-cache-dir -r requirements.txt \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    && echo "依赖安装完成"

# 验证关键依赖是否安装成功
RUN python3 -c "import uvicorn; import fastapi; print('✓ uvicorn:', uvicorn.__version__); print('✓ fastapi:', fastapi.__version__)" \
    || (echo "✗ 依赖验证失败" && exit 1)

# 复制应用代码（放在依赖安装之后，提高构建效率）
COPY . .

# 创建必要的目录
RUN mkdir -p uploads /tmp/uploads && \
    chmod 755 uploads /tmp/uploads

# 设置 bootstrap 执行权限
RUN chmod +x bootstrap

# 验证 bootstrap 文件
RUN test -f bootstrap && test -x bootstrap && echo "✓ bootstrap 文件就绪" || (echo "✗ bootstrap 文件错误" && exit 1)

# 暴露端口（函数计算使用 9000）
EXPOSE 9000

# 注意：自定义运行时不需要 CMD
# 函数计算会执行 ./bootstrap 作为启动命令
