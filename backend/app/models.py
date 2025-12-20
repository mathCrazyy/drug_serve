from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from .database import Base
import uuid

class Drug(Base):
    __tablename__ = "drugs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    production_date = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)
    image_url = Column(String, nullable=True)  # 主图片URL（兼容旧数据）
    image_urls = Column(Text, nullable=True)  # 多张图片URL，JSON数组格式
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    analysis_result = Column(Text, nullable=True)

