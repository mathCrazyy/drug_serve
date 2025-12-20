from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./drugs.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def migrate_db():
    """
    数据库迁移：添加新列（如果不存在）
    """
    if "sqlite" not in DATABASE_URL:
        return  # 只对 SQLite 进行迁移
    
    with engine.connect() as conn:
        # 检查 image_urls 列是否存在
        result = conn.execute(text("PRAGMA table_info(drugs)"))
        columns = [row[1] for row in result]
        
        if "image_urls" not in columns:
            print("正在添加 image_urls 列...")
            conn.execute(text("ALTER TABLE drugs ADD COLUMN image_urls TEXT"))
            conn.commit()
            print("✅ image_urls 列已添加")
        
        # 检查 production_date 和 expiry_date 是否允许 NULL
        # SQLite 不支持直接修改列约束，但新插入的数据可以接受 NULL

def init_db():
    """
    初始化数据库：创建表并执行迁移
    """
    Base.metadata.create_all(bind=engine)
    migrate_db()
