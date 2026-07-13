from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class DigitalHumanVoiceBase(BaseModel):
    """数字人声音基础模式

    这个模式定义了创建和更新数字人声音时共用的字段
    """
    user_id: Optional[str] = Field(None, description="用户ID")
    name: str = Field(..., description="声音名称")
    file_path: str = Field(..., description="音频路径")
    type: Optional[int] = Field(None, description="类型, 0 代表公共, 1 代表个人")
    sample_audio_url: Optional[str] = Field(None, description="示例音频地址")

class DigitalHumanVoiceCreate(DigitalHumanVoiceBase):
    """创建数字人声音的请求模式"""
    pass

class DigitalHumanVoice(DigitalHumanVoiceBase):
    """数字人声音的响应模式

    这个模式包含了从数据库返回的所有字段
    """
    id: int
    status: int
    status_msg: str
    is_deleted: bool
    created_at: datetime
    finished_at: Optional[datetime]
    voice_id: Optional[str]
    type_name: str
    status_name: str

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.strftime("%Y-%m-%d %H:%M:%S")
        }

class DigitalHumanVoiceUpdate(BaseModel):
    """更新数字人声音的请求模式

    所有字段都是可选的,允许部分更新
    """
    name: Optional[str] = None
    file_path: Optional[str] = None
    type: Optional[int] = None
    status: Optional[int] = None
    sample_audio_url: Optional[str] = None
