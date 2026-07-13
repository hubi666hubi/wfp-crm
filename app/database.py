from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件中的环境变量
load_dotenv()

# 获取项目根目录
BASE_DIR = Path(os.getenv("PROJECT_ROOT"))

# 确保 data 目录存在
(BASE_DIR / 'data').mkdir(exist_ok=True)

# 创建 SQLite 数据库文件的路径
DATABASE_URL = f"sqlite:///{BASE_DIR / 'data' / 'app.db'}"

# 创建 SQLAlchemy 引擎
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 10},
    poolclass=QueuePool,
    pool_size=50,
    max_overflow=100
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基本模型类，所有的 ORM 模型都将继承这个类
Base = declarative_base()

def get_db():
    """
    创建一个数据库会话的生成器函数
    
    每次调用时创建一个新的数据库会话，并在使用完毕后关闭它
    这个函数将被用作 FastAPI 的依赖项
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
