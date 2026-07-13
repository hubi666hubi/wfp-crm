from pydantic import BaseModel, Field,validator
from datetime import datetime
from typing import Optional

class DigitalHumanAvatarBase(BaseModel):
    """数字人形象基础模式

    这个模式定义了创建和更新数字人形象时共用的字段
    """
    name: str = Field(..., description="形象名称")
    
    type: Optional[int] = Field(default=1, description="形象类型, 0 代表公共, 1 代表个人") 
    status: Optional[int] = Field(default=0, description="状态, 0 表示 AI 克隆训练中, 1 表示克隆完成, 2 表示克隆失败")
    description: Optional[str] = Field(None, description="形象描述")
    audio_path: Optional[str] = Field(None, description="音频文件路径")
    audio_prompt_npy_path: Optional[str] = Field(None, description="语音prompt_npy路径")
    no_green_video_path: Optional[str] = Field(None, description="去除绿幕后的视频路径")
    no_green_cover_image_path: Optional[str] = Field(None, description="去除绿幕后的封面图片路径")
    no_green_cover_image_width: Optional[int] = Field(None, description="去除绿幕后的封面图片宽度")
    no_green_cover_image_height: Optional[int] = Field(None, description="去除绿幕后的封面图片高度")   
    welcome_audio_path: Optional[str] = Field(None, description="欢迎语音频路径")
    welcome_video_path: Optional[str] = Field(None, description="欢迎视频路径")
    human_id: Optional[str] = Field(None, description="数字人形象唯一标识符")
    video_path: str = Field(..., description="形象视频文件路径") 

class DigitalHumanAvatarCreate(DigitalHumanAvatarBase):
    """创建数字人形象的请求模式"""
    pass

class DigitalHumanAvatar(DigitalHumanAvatarBase):
    """数字人形象的响应模

    这个模式包含了从数据库返回的所有字段
    """
    id: int
    created_at: datetime
    is_deleted: bool = False
    no_green_cover_image_width: Optional[int]
    no_green_cover_image_height: Optional[int]
    no_green_cover_image_path: Optional[str]

   
    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.strftime("%Y-%m-%d %H:%M:%S")
        }
        #orm_mode = True

class DigitalHumanAvatarUpdate(BaseModel):
    """更新数字人形象的请求模式

    所有字段都是可选的,允许部分更新
    """
    name: Optional[str] = None
    video_path: Optional[str] = None
    type: Optional[int] = None
    status: Optional[int] = None
    description: Optional[str] = None
    audio_path: Optional[str] = None
    audio_prompt_npy_path: Optional[str] = None
    no_green_video_path: Optional[str] = None
    no_green_cover_image_path: Optional[str] = None
    welcome_audio_path: Optional[str] = None
    welcome_video_path: Optional[str] = None
    human_id: Optional[str] = None
