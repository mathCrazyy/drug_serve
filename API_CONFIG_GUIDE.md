# 豆包 API 配置指南

## 当前问题

API 返回 401 认证错误，说明 API Key 配置可能有问题。

## 可能的原因

1. **API Key 不正确或已过期**
2. **需要使用 AK/SK 认证方式**（Access Key / Secret Key）
3. **模型 ID 不正确**
4. **API 端点格式不对**

## 解决步骤

### 1. 检查豆包 API 控制台

1. 登录火山引擎控制台：https://console.volcengine.com/
2. 进入豆包 API 服务
3. 检查并确认：
   - API Key 是否正确
   - 模型 ID 是否正确
   - API 端点是否正确

### 2. 获取正确的 API Key

根据豆包 API 文档，可能需要：
- **API Key**: 用于 Bearer Token 认证
- **AK/SK**: Access Key 和 Secret Key 对（用于签名认证）

### 3. 检查模型 ID

当前配置的模型 ID 是占位符：`ep-20241201123456-abcde`

需要替换为实际的模型 ID，例如：
- `doubao-pro-4k` (通用模型)
- `doubao-vision` (视觉模型)
- 或其他自定义模型 ID

### 4. 更新配置

编辑 `backend/.env` 文件：

```env
# 豆包 API 配置
API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
API_KEY=your-actual-api-key-here
MODEL_ID=your-actual-model-id-here
```

### 5. 测试 API 连接

运行测试脚本：

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
        print(f'响应: {resp.text[:500]}')

asyncio.run(test())
"
```

## 豆包 API 文档参考

请查阅官方文档获取：
- 正确的 API 端点
- 认证方式
- 模型 ID 列表
- 请求格式

## 临时解决方案

如果暂时无法配置正确的 API，可以：

1. **使用模拟数据**：修改代码返回模拟的药品信息用于测试前端功能
2. **使用其他 API**：如果可以使用其他视觉识别 API（如 OpenAI Vision API）

## 需要帮助？

如果遇到问题，请检查：
1. 火山引擎控制台的 API Key 是否正确
2. 模型 ID 是否在可用列表中
3. API 端点 URL 是否正确
4. 账户是否有足够的配额

