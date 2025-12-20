# 故障排查指南

## 当前问题：API 认证失败

### 问题现象
- 前端显示："分析失败,请重试"
- 后端返回：500 错误
- API 返回：401 认证错误

### 根本原因
豆包 API 认证失败，可能的原因：
1. API_KEY 不正确或已过期
2. MODEL_ID 是占位符，需要替换为实际模型 ID
3. API 端点或认证方式不正确

### 解决方案

#### 步骤 1: 检查配置
编辑 `backend/.env` 文件，确保：
```env
API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
API_KEY=你的实际API密钥
MODEL_ID=你的实际模型ID
```

#### 步骤 2: 获取正确的 API 凭证
1. 登录火山引擎控制台：https://console.volcengine.com/
2. 进入豆包 API 服务
3. 获取：
   - 正确的 API Key
   - 正确的模型 ID（如 `doubao-vision` 或其他视觉模型）

#### 步骤 3: 测试 API 连接
```bash
cd backend
source venv/bin/activate
python3 -c "
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()
API_BASE_URL = os.getenv('API_BASE_URL')
API_KEY = os.getenv('API_KEY')
MODEL_ID = os.getenv('MODEL_ID')

async def test():
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
    }
    payload = {
        'model': MODEL_ID,
        'messages': [{'role': 'user', 'content': '你好'}],
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(f'{API_BASE_URL}/chat/completions', json=payload, headers=headers)
        print(f'状态码: {resp.status_code}')
        if resp.status_code == 200:
            print('✅ API 连接成功！')
        else:
            print(f'❌ 错误: {resp.text[:500]}')

asyncio.run(test())
"
```

#### 步骤 4: 重启服务
```bash
# 停止服务
./stop_all.sh

# 启动服务
./start_all.sh
```

### 临时测试方案

如果暂时无法配置正确的 API，可以修改代码返回模拟数据用于测试前端功能。

### 详细配置指南

请参考 `API_CONFIG_GUIDE.md` 文件获取更详细的配置说明。

## 其他常见问题

### 1. 端口被占用
```bash
# 检查端口
lsof -i:8000
lsof -i:5173

# 停止占用端口的进程
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### 2. 依赖安装失败
```bash
# 后端
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 前端
cd frontend
npm install
```

### 3. 数据库错误
```bash
# 删除旧数据库重新创建
cd backend
rm drugs.db
# 重启服务会自动创建新数据库
```

## 获取帮助

如果问题仍然存在，请检查：
1. 火山引擎控制台的 API 文档
2. 账户是否有足够的配额
3. 网络连接是否正常
4. 查看后端日志：`tail -f /tmp/backend.log`

