from sqlalchemy import Column, Integer, String
from ..database import Base

class Font(Base):
    """字体模型"""
    __tablename__ = "fonts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
    nickname = Column(String, nullable=True)
    font_path = Column(String, nullable=False)