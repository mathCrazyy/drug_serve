from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from pydantic import BaseModel
import os
import aiofiles
import uuid
import json
from datetime import datetime

from ..database import get_db
from ..models import Drug
from ..services.doubao_api import analyze_drug_image, analyze_drug_images

class DrugUpdate(BaseModel):
    name: Optional[str] = None
    production_date: Optional[str] = None
    expiry_date: Optional[str] = None

router = APIRouter(prefix="/api/drugs", tags=["drugs"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_images(
    files: List[UploadFile] = File(...),
):
    """
    上传药品图片
    """
    if not files:
        raise HTTPException(status_code=400, detail="请至少上传一张图片")
    
    uploaded_files = []
    
    for file in files:
        # 读取文件内容
        content = await file.read()
        
        # 检查文件大小
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"文件 {file.filename} 超过大小限制（最大 {MAX_FILE_SIZE // 1024 // 1024}MB）")
        
        # 生成唯一文件名
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
        
        # 保存文件
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        uploaded_files.append({
            "image_id": file_id,
            "message": "上传成功"
        })
    
    return uploaded_files

@router.post("/analyze-batch")
async def analyze_batch_images(
    image_ids: List[str] = Body(...),
    db: Session = Depends(get_db)
):
    """
    批量分析多张图片（作为同一药品的不同角度）
    """
    if not image_ids:
        raise HTTPException(status_code=400, detail="请至少提供一张图片ID")
    
    # 读取所有图片数据
    image_data_list = []
    image_paths = []
    
    for image_id in image_ids:
        image_path = None
        for ext in [".jpg", ".jpeg", ".png", ".webp"]:
            potential_path = os.path.join(UPLOAD_DIR, f"{image_id}{ext}")
            if os.path.exists(potential_path):
                image_path = potential_path
                break
        
        if not image_path:
            raise HTTPException(status_code=404, detail=f"图片 {image_id} 不存在")
        
        async with aiofiles.open(image_path, 'rb') as f:
            image_data = await f.read()
            image_data_list.append(image_data)
            image_paths.append(image_path)
    
    # 调用豆包 API 批量分析
    try:
        analysis_result = await analyze_drug_images(image_data_list)
    except Exception as e:
        import traceback
        error_detail = str(e)
        print(f"批量分析图片失败: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"分析失败: {error_detail}")
    
    # 验证和提取数据
    name = analysis_result.get("name") or "未知药品"
    production_date = analysis_result.get("production_date") or None
    expiry_date = analysis_result.get("expiry_date") or None
    
    # 构建图片URL列表
    image_urls = [f"/uploads/{os.path.basename(path)}" for path in image_paths]
    image_urls_json = json.dumps(image_urls)
    
    # 创建药品记录（多张图片）
    drug = Drug(
        name=name,
        production_date=production_date,
        expiry_date=expiry_date,
        image_url=image_urls[0] if image_urls else None,  # 主图片（兼容旧数据）
        image_urls=image_urls_json,  # 所有图片
        analysis_result=str(analysis_result)
    )
    
    db.add(drug)
    db.commit()
    db.refresh(drug)
    
    return {
        "name": drug.name,
        "production_date": drug.production_date,
        "expiry_date": drug.expiry_date,
        "image_urls": image_urls
    }

@router.post("/{image_id}/analyze")
async def analyze_image(
    image_id: str,
    db: Session = Depends(get_db)
):
    """
    分析图片并保存药品信息
    """
    # 查找图片文件
    image_path = None
    for ext in [".jpg", ".jpeg", ".png", ".webp"]:
        potential_path = os.path.join(UPLOAD_DIR, f"{image_id}{ext}")
        if os.path.exists(potential_path):
            image_path = potential_path
            break
    
    if not image_path:
        raise HTTPException(status_code=404, detail="图片不存在")
    
    # 读取图片数据
    async with aiofiles.open(image_path, 'rb') as f:
        image_data = await f.read()
    
    # 调用豆包 API 分析
    try:
        analysis_result = await analyze_drug_image(image_data)
    except Exception as e:
        import traceback
        error_detail = str(e)
        # 记录详细错误信息到日志
        print(f"分析图片失败: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"分析失败: {error_detail}")
    
    # 验证和提取数据
    name = analysis_result.get("name") or "未知药品"
    production_date = analysis_result.get("production_date") or None
    expiry_date = analysis_result.get("expiry_date") or None
    
    # 创建药品记录
    drug = Drug(
        name=name,
        production_date=production_date,
        expiry_date=expiry_date,
        image_url=f"/uploads/{os.path.basename(image_path)}",
        analysis_result=str(analysis_result)
    )
    
    db.add(drug)
    db.commit()
    db.refresh(drug)
    
    return {
        "name": drug.name,
        "production_date": drug.production_date,
        "expiry_date": drug.expiry_date
    }

@router.get("")
async def get_drugs(
    db: Session = Depends(get_db)
):
    """
    获取所有药品列表
    """
    drugs = db.query(Drug).order_by(Drug.created_at.desc()).all()
    # 将 image_urls JSON字符串转换为列表格式返回
    result = []
    for drug in drugs:
        drug_dict = {
            "id": drug.id,
            "name": drug.name,
            "production_date": drug.production_date,
            "expiry_date": drug.expiry_date,
            "image_url": drug.image_url,
            "image_urls": drug.image_urls,
            "created_at": drug.created_at.isoformat() if drug.created_at else None,
            "analysis_result": drug.analysis_result
        }
        result.append(drug_dict)
    return result

@router.get("/expiring")
async def get_expiring_drugs(
    db: Session = Depends(get_db)
):
    """
    获取即将过期的药品（30天内）
    """
    from datetime import datetime, timedelta
    today = datetime.now().date()
    thirty_days_later = today + timedelta(days=30)
    
    drugs = db.query(Drug).all()
    expiring_drugs = []
    
    for drug in drugs:
        try:
            expiry_date = datetime.strptime(drug.expiry_date, "%Y-%m-%d").date()
            if expiry_date <= thirty_days_later:
                expiring_drugs.append(drug)
        except:
            continue
    
    return expiring_drugs

@router.put("/{drug_id}")
async def update_drug(
    drug_id: str,
    drug_data: DrugUpdate,
    db: Session = Depends(get_db)
):
    """
    更新药品信息
    """
    drug = db.query(Drug).filter(Drug.id == drug_id).first()
    if not drug:
        raise HTTPException(status_code=404, detail="药品不存在")
    
    # 更新字段
    if drug_data.name is not None:
        drug.name = drug_data.name
    if drug_data.production_date is not None:
        drug.production_date = drug_data.production_date if drug_data.production_date else None
    if drug_data.expiry_date is not None:
        drug.expiry_date = drug_data.expiry_date if drug_data.expiry_date else None
    
    db.commit()
    db.refresh(drug)
    
    return drug

@router.get("/search")
async def search_drugs(
    q: str = Query(..., description="搜索关键词"),
    db: Session = Depends(get_db)
):
    """
    搜索药品
    """
    if not q or not q.strip():
        return []
    
    search_term = f"%{q.strip()}%"
    drugs = db.query(Drug).filter(
        Drug.name.like(search_term)
    ).order_by(Drug.created_at.desc()).all()
    
    return drugs

@router.delete("/{drug_id}")
async def delete_drug(
    drug_id: str,
    db: Session = Depends(get_db)
):
    """
    删除药品记录
    """
    drug = db.query(Drug).filter(Drug.id == drug_id).first()
    if not drug:
        raise HTTPException(status_code=404, detail="药品不存在")
    
    # 删除关联的所有图片文件
    image_urls_to_delete = []
    
    # 从 image_urls 字段获取所有图片
    if drug.image_urls:
        try:
            url_list = json.loads(drug.image_urls) if isinstance(drug.image_urls, str) else drug.image_urls
            if isinstance(url_list, list):
                image_urls_to_delete.extend(url_list)
        except:
            pass
    
    # 兼容旧数据：如果有 image_url 但没有 image_urls
    if drug.image_url and drug.image_url not in image_urls_to_delete:
        image_urls_to_delete.append(drug.image_url)
    
    # 删除所有图片文件
    for image_url in image_urls_to_delete:
        if image_url:
            image_path = os.path.join(UPLOAD_DIR, os.path.basename(image_url))
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception as e:
                    print(f"删除图片文件失败: {image_path}, 错误: {e}")
    
    db.delete(drug)
    db.commit()
    
    return {"message": "删除成功"}

