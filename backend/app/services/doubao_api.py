import httpx
import base64
import os
import json
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "https://api.chatfire.site/v1/chat/completions")
API_KEY = os.getenv("API_KEY", "sk-pzZXi9zXV9ERBJFrjAVV4WEMj6u7TcTLtoNUkRfefSrLxlid")
MODEL_ID = os.getenv("MODEL_ID", "doubao-1.5-vision-pro-250328")

async def analyze_drug_images(image_data_list: list[bytes]) -> Dict[str, Any]:
    """
    调用豆包 API 分析多张药品图片（作为同一药品的不同角度）
    """
    prompt = """请识别这些药品图片中的所有文字信息，这些图片是同一个药品的不同角度或不同面。请综合分析所有图片，提取以下信息并以JSON格式返回：
{"name": "药品名称", "brand": "品牌", "manufacturer": "生产厂家", "production_date": "生产日期", "expiry_date": "有效期", "batch_number": "批号", "dosage_form": "剂型", "strength": "规格"}

如果没有则对应字段返回null。请确保日期格式为YYYY-MM-DD。"""

    # 构建多图内容
    content_items = [
        {
            "type": "text",
            "text": prompt
        }
    ]
    
    # 添加所有图片
    for image_data in image_data_list:
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        content_items.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{image_base64}"
            }
        })

    messages = [
        {
            "role": "user",
            "content": content_items
        }
    ]

    payload = {
        "model": MODEL_ID,
        "messages": messages,
        "max_tokens": 1000,
        "temperature": 0.1,
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:  # 多图需要更长的超时时间
        try:
            response = await client.post(
                API_BASE_URL,
                json=payload,
                headers=headers
            )
            
            if response.status_code != 200:
                error_text = response.text[:500] if response.text else "无响应内容"
                raise Exception(f"API返回错误 (状态码: {response.status_code}): {error_text}")
            
            response.raise_for_status()
            
            # 检查是否是流式响应 (SSE)
            content_type = response.headers.get('Content-Type', '')
            is_stream = 'text/event-stream' in content_type or 'event-stream' in content_type
            
            content = ""
            
            if is_stream:
                # 解析流式响应
                import re
                content_parts = []
                lines = response.text.strip().split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('data: '):
                        json_str = line[6:]
                        if json_str and json_str != '[DONE]':
                            try:
                                chunk = json.loads(json_str, strict=False)
                                if "choices" in chunk and len(chunk["choices"]) > 0:
                                    delta = chunk["choices"][0].get("delta", {})
                                    if "content" in delta and delta["content"]:
                                        content_parts.append(delta["content"])
                            except (json.JSONDecodeError, Exception):
                                continue
                content = ''.join(content_parts)
            else:
                # 普通JSON响应
                result = response.json()
                if "choices" not in result or not result["choices"]:
                    raise Exception("响应格式不正确：缺少'choices'字段")
                
                choice = result["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    content = choice["message"]["content"]
                elif "delta" in choice and "content" in choice["delta"]:
                    content = choice["delta"]["content"]
                else:
                    raise Exception("响应格式不正确：缺少'content'字段")
            
            # 解析JSON内容
            try:
                cleaned_content = content.strip()
                if cleaned_content.startswith("```"):
                    lines = cleaned_content.split("\n")
                    cleaned_content = "\n".join(lines[1:-1]) if len(lines) > 2 else cleaned_content
                    cleaned_content = cleaned_content.replace("```json", "").replace("```", "").strip()
                
                if cleaned_content.startswith("{"):
                    parsed = json.loads(cleaned_content, strict=False)
                else:
                    import re
                    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', cleaned_content, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group(), strict=False)
                    else:
                        parsed = {
                            "name": None,
                            "production_date": None,
                            "expiry_date": None
                        }
                
                return {
                    "name": parsed.get("name") or parsed.get("药品名称"),
                    "production_date": parsed.get("production_date") or parsed.get("生产日期"),
                    "expiry_date": parsed.get("expiry_date") or parsed.get("有效期"),
                }
            except (json.JSONDecodeError, Exception) as e:
                return {
                    "name": None,
                    "production_date": None,
                    "expiry_date": None
                }
            
        except httpx.HTTPStatusError as e:
            error_text = e.response.text[:500] if e.response.text else "无响应内容"
            if e.response.status_code == 401:
                raise Exception(f"API认证失败 (401): 请检查 .env 文件中的 API_KEY 和 MODEL_ID 是否正确。错误详情: {error_text}")
            elif e.response.status_code == 404:
                raise Exception(f"API端点不存在 (404): 请检查 API_BASE_URL 和 MODEL_ID 是否正确。错误详情: {error_text}")
            else:
                raise Exception(f"API请求失败 ({e.response.status_code}): {error_text}")
        except Exception as e:
            raise Exception(f"分析图片时出错: {str(e)}")

# 保留单图分析函数以兼容旧代码
async def analyze_drug_image(image_data: bytes) -> Dict[str, Any]:
    """
    调用豆包 API 分析单张药品图片（兼容旧接口）
    """
    return await analyze_drug_images([image_data])
    """
    调用豆包 API 分析药品图片
    """
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    
    prompt = """请识别这张药品图片中的所有文字信息，包括药品名称、生产日期、有效期、批号、生产厂家等信息。如果没有则对应字段返回无。请以JSON格式返回结果，格式如下：{"name": "药品名称", "brand": "品牌", "manufacturer": "生产厂家", "production_date": "生产日期", "expiry_date": "有效期", "batch_number": "批号", "dosage_form": "剂型", "strength": "规格"}"""

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": prompt
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        }
    ]

    payload = {
        "model": MODEL_ID,
        "messages": messages,
        "max_tokens": 1000,
        "temperature": 0.1,
    }

    # 豆包 API 可能使用不同的认证方式，尝试多种格式
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    
    # 如果 Bearer 方式失败，尝试直接使用 API_KEY
    if not API_KEY.startswith("Bearer"):
        # 某些 API 可能需要不同的认证头
        pass

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # API_BASE_URL 已经包含完整路径
            response = await client.post(
                API_BASE_URL,
                json=payload,
                headers=headers
            )
            
            # 记录响应状态和错误信息
            if response.status_code != 200:
                error_text = response.text[:500] if response.text else "无响应内容"
                raise Exception(f"API返回错误 (状态码: {response.status_code}): {error_text}")
            
            response.raise_for_status()
            
            # 检查是否是流式响应 (SSE)
            content_type = response.headers.get('Content-Type', '')
            is_stream = 'text/event-stream' in content_type or 'event-stream' in content_type
            
            content = ""
            
            if is_stream:
                # 解析流式响应
                import re
                content_parts = []
                lines = response.text.strip().split('\n')
                for line in lines:
                    line = line.strip()
                    if line.startswith('data: '):
                        json_str = line[6:]
                        if json_str and json_str != '[DONE]':
                            try:
                                chunk = json.loads(json_str, strict=False)
                                if "choices" in chunk and len(chunk["choices"]) > 0:
                                    delta = chunk["choices"][0].get("delta", {})
                                    if "content" in delta and delta["content"]:
                                        content_parts.append(delta["content"])
                            except (json.JSONDecodeError, Exception):
                                continue
                content = ''.join(content_parts)
            else:
                # 普通JSON响应
                result = response.json()
                if "choices" not in result or not result["choices"]:
                    raise Exception("响应格式不正确：缺少'choices'字段")
                
                choice = result["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    content = choice["message"]["content"]
                elif "delta" in choice and "content" in choice["delta"]:
                    content = choice["delta"]["content"]
                else:
                    raise Exception("响应格式不正确：缺少'content'字段")
            
            # 解析JSON内容
            try:
                # 清理内容，移除可能的markdown代码块标记
                cleaned_content = content.strip()
                if cleaned_content.startswith("```"):
                    lines = cleaned_content.split("\n")
                    cleaned_content = "\n".join(lines[1:-1]) if len(lines) > 2 else cleaned_content
                    cleaned_content = cleaned_content.replace("```json", "").replace("```", "").strip()
                
                # 如果返回的是JSON字符串，直接解析
                if cleaned_content.startswith("{"):
                    parsed = json.loads(cleaned_content, strict=False)
                else:
                    # 尝试从文本中提取JSON（支持嵌套）
                    import re
                    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', cleaned_content, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group(), strict=False)
                    else:
                        # 如果无法解析，返回默认值
                        parsed = {
                            "name": None,
                            "production_date": None,
                            "expiry_date": None
                        }
                
                # 确保返回的字段符合预期格式
                return {
                    "name": parsed.get("name") or parsed.get("药品名称"),
                    "production_date": parsed.get("production_date") or parsed.get("生产日期"),
                    "expiry_date": parsed.get("expiry_date") or parsed.get("有效期"),
                }
            except (json.JSONDecodeError, Exception) as e:
                # 如果解析失败，返回默认值
                return {
                    "name": None,
                    "production_date": None,
                    "expiry_date": None
                }
            
        except httpx.HTTPStatusError as e:
            error_text = e.response.text[:500] if e.response.text else "无响应内容"
            if e.response.status_code == 401:
                raise Exception(f"API认证失败 (401): 请检查 .env 文件中的 API_KEY 和 MODEL_ID 是否正确。错误详情: {error_text}")
            elif e.response.status_code == 404:
                raise Exception(f"API端点不存在 (404): 请检查 API_BASE_URL 和 MODEL_ID 是否正确。错误详情: {error_text}")
            else:
                raise Exception(f"API请求失败 ({e.response.status_code}): {error_text}")
        except Exception as e:
            raise Exception(f"分析图片时出错: {str(e)}")

