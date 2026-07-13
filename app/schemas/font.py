from pydantic import BaseModel, Field
from typing import Optional

class FontBase(BaseModel):
    """字体基础模式"""
    name: str = Field(..., description="字体名称")
    nickname: Optional[str] = Field(None, description="字体昵称")
    font_path: str = Field(..., description="字体文件路径")

class FontCreate(FontBase):
    """创建字体的请求模式"""
    pass

class FontUpdate(BaseModel):
    """更新字体的请求模式"""
    name: Optional[str] = None
    nickname: Optional[str] = None
    font_path: Optional[str] = None

class Font(FontBase):
    """字体的响应模式"""
    id: int

    class Config:
        orm_mode = True