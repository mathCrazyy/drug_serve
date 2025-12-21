# ESA 环境变量配置步骤

## 📋 从 test.py 提取的信息

根据 `/Users/chunshengwu/code/drug_pool2/test.py` 文件：

```python
API_BASE_URL = "https://api.chatfire.site/v1/chat/completions"
API_KEY = "sk-pzZXi9zXV9ERBJFrjAVV4WEMj6u7TcTLtoNUkRfefSrLxlid"
model = "doubao-1.5-vision-pro-250328"
```

## ⚠️ 重要说明

**ESA 的环境变量是用于前端构建的**，不是用于后端运行的。

- **ESA 环境变量**：用于前端构建时替换代码中的变量
- **后端环境变量**：需要在**函数计算（FC）**中配置

## 📝 在 ESA 配置前端环境变量

### 步骤 1: 进入构建信息页面

1. 在 ESA 控制台，找到你的应用：`drug_serve`
2. 点击"构建信息"或"修改"按钮

### 步骤 2: 找到环境变量部分

向下滚动到"环境变量"部分，当前显示"没有数据"。

### 步骤 3: 添加环境变量

点击"添加"或"新增"按钮，添加以下环境变量：

```
变量名：VITE_API_BASE_URL
变量值：http://your-backend-url:8000
```

**说明**：
- `VITE_API_BASE_URL` 是前端连接后端的地址
- 如果后端部署在函数计算，使用函数计算的 HTTP 触发器地址
- 如果后端部署在 ECS，使用 ECS 的公网 IP 或域名
- **注意**：这个值需要等后端部署完成后才能确定

### 步骤 4: 保存并重新构建

1. 点击"保存"按钮
2. 重新触发构建

## 🔧 在函数计算配置后端环境变量

**后端的环境变量需要在函数计算（FC）中配置**，不是在 ESA 中。

### 步骤 1: 登录函数计算控制台

访问：https://fcnext.console.aliyun.com/

### 步骤 2: 进入函数配置

1. 服务 → `drug-serve-backend`
2. 函数 → `drug-api`
3. 函数配置 → 环境变量

### 步骤 3: 添加后端环境变量

根据 `test.py` 文件，添加以下环境变量：

```
变量名：API_BASE_URL
变量值：https://api.chatfire.site/v1/chat/completions

变量名：API_KEY
变量值：sk-pzZXi9zXV9ERBJFrjAVV4WEMj6u7TcTLtoNUkRfefSrLxlid

变量名：MODEL_ID
变量值：doubao-1.5-vision-pro-250328

变量名：DATABASE_URL
变量值：sqlite:///./drugs.db

变量名：UPLOAD_DIR
变量值：/tmp/uploads

变量名：MAX_FILE_SIZE
变量值：10485760
```

## 📊 配置总结

### ESA 环境变量（前端构建）

```
VITE_API_BASE_URL = http://your-backend-url:8000
```

### 函数计算环境变量（后端运行）

```
API_BASE_URL = https://api.chatfire.site/v1/chat/completions
API_KEY = sk-pzZXi9zXV9ERBJFrjAVV4WEMj6u7TcTLtoNUkRfefSrLxlid
MODEL_ID = doubao-1.5-vision-pro-250328
DATABASE_URL = sqlite:///./drugs.db
UPLOAD_DIR = /tmp/uploads
MAX_FILE_SIZE = 10485760
```

## 🎯 配置流程

```
1. 部署后端到函数计算（FC）
   ↓
2. 在函数计算配置后端环境变量（API_KEY 等）
   ↓
3. 创建 HTTP 触发器，获取后端地址
   ↓
4. 在 ESA 配置 VITE_API_BASE_URL = 后端地址
   ↓
5. 重新构建前端
   ↓
6. 完成！
```

## ⚠️ 注意事项

1. **不要在前端暴露 API_KEY**
   - API_KEY 是敏感信息，只能在后端使用
   - 前端只需要配置后端地址（VITE_API_BASE_URL）

2. **环境变量命名**
   - 前端环境变量必须以 `VITE_` 开头
   - 后端环境变量不需要前缀

3. **配置顺序**
   - 先部署后端，获取后端地址
   - 再配置前端的 `VITE_API_BASE_URL`

---

**按照以上步骤配置即可！** 🚀

