# 阿里云函数计算自定义运行时 Dockerfile
FROM aliyunfc/runtime-python3.10:build-latest

# 设置工作目录
WORKDIR /code

# 复制依赖文件
COPY requirements.txt .

# 安装依赖到系统目录（不使用 --user，因为函数计算需要系统级安装）
RUN pip3 install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads /tmp/uploads

# 设置 bootstrap 执行权限
RUN chmod +x bootstrap

# 验证安装
RUN python3 -c "import uvicorn; import fastapi; print('依赖安装成功')"

# 暴露端口
EXPOSE 9000

# 注意：自定义运行时不需要 CMD，使用 bootstrap 作为启动脚本
