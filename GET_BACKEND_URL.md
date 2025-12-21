# 如何获取后端 API 地址并验证后端是否正常

## 一、获取函数计算的 API 地址

### 方法 1：在函数计算控制台查看（推荐）

1. **登录阿里云控制台**
   - 进入 **函数计算 FC** 服务

2. **找到你的函数**
   - 在服务列表中找到你的服务（例如：`drug-serve`）
   - 点击进入服务详情

3. **查看 HTTP 触发器**
   - 在左侧菜单找到 **"触发器"** 或 **"HTTP 触发器"**
   - 点击进入触发器列表
   - 找到你的 HTTP 触发器（如果没有，需要创建一个）

4. **复制访问地址**
   - 在触发器详情中，找到 **"公网访问地址"** 或 **"访问路径"**
   - 地址格式类似：
     ```
     https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/drug-serve/api
     ```
   - **复制这个完整地址**

### 方法 2：通过函数详情查看

1. 进入函数详情页
2. 查看 **"函数入口"** 或 **"访问信息"**
3. 找到 **"公网访问地址"**

### 方法 3：创建 HTTP 触发器（如果还没有）

如果函数还没有 HTTP 触发器：

1. 在函数详情页，点击 **"创建触发器"**
2. 选择 **"HTTP 触发器"**
3. 配置：
   - **触发方式**：HTTP 请求
   - **请求方法**：GET, POST, PUT, DELETE（全选）
   - **认证方式**：匿名访问（或根据需要选择）
   - **路径**：`/` 或 `/api/*`（根据需求）
4. 创建后，会显示访问地址

## 二、验证后端是否正常运行

### 步骤 1：测试函数是否启动成功

在函数计算控制台：

1. **查看函数状态**
   - 进入函数详情
   - 查看 **"函数状态"**，应该是 **"运行中"**

2. **查看日志**
   - 点击 **"日志输出"** 或 **"实时日志"**
   - 应该看到：
     ```
     === 检查依赖 ===
     ✓ 依赖已安装
     或
     ✓ 依赖安装完成，启动应用
     INFO:     Started server process
     INFO:     Uvicorn running on http://0.0.0.0:9000
     ```

3. **测试函数**
   - 点击 **"测试函数"**
   - 使用以下测试事件：
     ```json
     {
       "httpMethod": "GET",
       "path": "/",
       "headers": {}
     }
     ```
   - 应该返回：
     ```json
     {
       "message": "药品识别与提醒系统 API",
       "docs": "/docs"
     }
     ```

### 步骤 2：测试 API 端点

#### 方法 1：在浏览器中测试

1. **测试根路径**：
   ```
   https://your-function-url/
   ```
   应该返回：
   ```json
   {"message":"药品识别与提醒系统 API","docs":"/docs"}
   ```

2. **测试 API 文档**：
   ```
   https://your-function-url/docs
   ```
   应该显示 Swagger API 文档页面

3. **测试健康检查**：
   ```
   https://your-function-url/api/drugs
   ```
   应该返回药品列表（可能是空数组 `[]`）

#### 方法 2：使用 curl 命令测试

```bash
# 测试根路径
curl https://your-function-url/

# 测试 API 文档
curl https://your-function-url/docs

# 测试药品列表
curl https://your-function-url/api/drugs
```

#### 方法 3：使用 Postman 或类似工具

1. 创建新请求
2. 方法：GET
3. URL：`https://your-function-url/`
4. 发送请求
5. 应该收到 JSON 响应

### 步骤 3：检查常见问题

#### 问题 1：函数未启动

**症状**：测试函数返回错误或超时

**解决**：
- 查看日志，检查是否有错误
- 确认依赖是否安装成功
- 确认 bootstrap 脚本是否正确执行

#### 问题 2：404 错误

**症状**：访问 URL 返回 404

**可能原因**：
- HTTP 触发器路径配置不正确
- API 路由路径不匹配

**解决**：
- 检查 HTTP 触发器的路径配置
- 确认访问的 URL 是否正确

#### 问题 3：CORS 错误

**症状**：浏览器控制台显示 CORS 错误

**解决**：
- 后端代码已配置 CORS（允许所有来源）
- 如果仍有问题，检查函数计算的 CORS 配置

## 三、配置前端连接后端

### 获取到 API 地址后

假设你的函数计算访问地址是：
```
https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/drug-serve/api
```

### 在 ESA 控制台配置

1. 进入 **ESA 控制台**
2. 找到你的应用（drugserve）
3. 进入 **环境变量** 配置
4. 添加：
   - **变量名**：`VITE_API_BASE_URL`
   - **变量值**：`https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/drug-serve/api`

   **注意**：
   - 如果函数计算地址已经包含 `/api`，直接使用
   - 如果不包含，需要加上 `/api`，因为前端代码会在地址后追加 `/api/drugs/...`

5. **重新构建**应用

### 验证配置

1. 重新构建 ESA 应用
2. 访问前端页面
3. 打开浏览器开发者工具（F12）
4. 查看 Network 标签
5. 尝试上传图片
6. 查看请求的 URL 应该是：
   ```
   https://your-function-url/api/drugs/upload
   ```

## 四、快速检查清单

### 后端检查清单

- [ ] 函数状态为"运行中"
- [ ] 日志显示应用已启动（"Uvicorn running"）
- [ ] 测试函数返回正确响应
- [ ] 浏览器访问根路径返回 JSON
- [ ] 浏览器访问 `/docs` 显示 API 文档

### 前端配置检查清单

- [ ] 已获取后端 API 地址
- [ ] 在 ESA 控制台配置了 `VITE_API_BASE_URL`
- [ ] 已重新构建 ESA 应用
- [ ] 浏览器 Network 显示请求发送到正确的地址

## 五、常见地址格式

### 函数计算 HTTP 触发器地址格式

```
https://{account-id}.{region}.fc.aliyuncs.com/2016-08-15/proxy/{service}/{function}/{path}
```

示例：
```
https://1234567890.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/drug-serve/api
```

### 如果使用自定义域名

```
https://api.your-domain.com
```

## 六、测试脚本

创建一个测试文件 `test_backend.sh`：

```bash
#!/bin/bash

# 替换为你的实际 API 地址
API_URL="https://your-function-url"

echo "测试后端 API..."
echo ""

echo "1. 测试根路径:"
curl -s "$API_URL/" | jq .
echo ""

echo "2. 测试药品列表:"
curl -s "$API_URL/api/drugs" | jq .
echo ""

echo "3. 测试 API 文档（应该返回 HTML）:"
curl -s "$API_URL/docs" | head -20
```

运行测试：
```bash
chmod +x test_backend.sh
./test_backend.sh
```

## 七、如果后端不正常

### 检查日志

1. 在函数计算控制台查看 **"日志输出"**
2. 查找错误信息
3. 常见错误：
   - 依赖未安装
   - 端口冲突
   - 应用启动失败

### 重新部署

如果后端有问题：
1. 检查 bootstrap 脚本
2. 确认 requirements.txt 完整
3. 重新打包并上传
4. 或者使用 Dockerfile 构建镜像

## 总结

1. **获取地址**：在函数计算控制台的 HTTP 触发器或函数详情中查看
2. **验证后端**：测试根路径 `/` 和 `/docs`，应该返回正确响应
3. **配置前端**：在 ESA 控制台设置 `VITE_API_BASE_URL` 环境变量
4. **重新构建**：配置后重新构建 ESA 应用

如果仍有问题，请提供：
- 函数计算的访问地址
- 浏览器控制台的错误信息
- 函数计算的日志输出

