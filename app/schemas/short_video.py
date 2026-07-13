from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class ShortVideoBase(BaseModel):
    """短视频基础模型

    这个模型定义了创建和更新短视频时共用的字段
    """
    title: str = Field(..., max_length=20, description="短视频标题")
    status: int = Field(..., description="短视频状态: 0表示生成中, 1表示已生成, 2表示生成失败需要重试")
    video_url: str = Field(..., max_length=255, description="视频文件的URL或本地存储路径")
    type: int = Field(0, description="视频类型: 0表示创作, 1表示混剪")
    short_videos_detail_id: int = Field(..., description="视频详情id")
    user_id: str = Field(..., max_length=100, description="用户ID")

class ShortVideoCreate(ShortVideoBase):
    """创建短视频的请求模型"""
    pass

class ShortVideo(ShortVideoBase):
    """短视频的响应模型

    这个模型包含了从数据库返回的所有字段
    """
    id: int = Field(..., description="短视频的唯一标识符")
    title: str = Field(..., max_length=100, description="短视频标题")
    status: int = Field(..., description="短视频状态: 0表示生成中, 1表示已生成, 2表示生成失败需要重试")
    video_url: Optional[str] = Field(..., max_length=255, description="视频文件的URL或本地存储路径")
    video_cover: Optional[str] = Field(None, max_length=255, description="视频封面文件的URL或本地存储路径")
    type: int = Field(..., description="视频类型: 0表示创作, 1表示混剪")
    created_at: datetime = Field(..., description="视频创建时间")
    finished_at: Optional[datetime] = Field(None, description="视频生成完成时间")
    is_deleted: bool = Field(False, description="删除标志: False表示未删除, True表示已删除")
    short_videos_detail_id: int = Field(..., description="视频详情id")
    user_id: str = Field(..., max_length=100, description="用户ID")

    class Config:
        from_attributes = True
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.strftime("%Y-%m-%d %H:%M:%S")
        }

class ShortVideoUpdate(BaseModel):
    """更新短视频的请求模型

    所有字段都是可选的,允许部分更新
    """
    title: Optional[str] = Field(None, max_length=20, description="短视频标题")
    status: Optional[int] = Field(None, description="短视频状态: 0表示生成中, 1表示已生成, 2表示生成失败需要重试")
    video_url: Optional[str] = Field(None, max_length=255, description="视频文件的URL或本地存储路径")
    type: Optional[int] = Field(None, description="视频类型: 0表示创作, 1表示混剪")
    finished_at: Optional[datetime] = Field(None, description="视频生成完成时间")
    short_videos_detail_id: Optional[int] = Field(None, description="视频详情id")
    user_id: Optional[str] = Field(None, max_length=100, description="用户ID")






class GlobalSettings(BaseModel):
    video_layout: int
    video_frame_rate: int
    resolution: int
    export_format: int
    generation_count: Optional[int] = 1

class ScriptSettings(BaseModel):
    golden_opening_id: Optional[int]
    language_style_id: Optional[int]
    script_content: Optional[str]
    title: Optional[str]   # 前端字段

class DigitalHumanAvatarsSettings(BaseModel):
    digital_human_avatars_switch: int = 0
    digital_human_avatars_id: Optional[int]
    digital_human_avatars_position: Optional[str]
    digital_human_avatars_scale: float = 1.0

class VoiceSettings(BaseModel):
    voice_switch: int = 0
    voice_language: int = 1
    voice_speed: float = 1.0
    voice_volume: float = 1.0
    voice_id: Optional[int]
    voice_path: Optional[str]  # 前端字段

class MusicSettings(BaseModel):
    music_switch: int = 0
    music_speed: float = 1.0
    music_volume: float = 1.0
    music_material_id: Optional[int]
    music_path: Optional[str]  # 前端字段

class BackgroundSettings(BaseModel):
    background_switch: int = 0
    background_material_id: Optional[int]
    min_clip_duration: int = 1
    max_clip_duration: int = 5
    background_path: Optional[str] = None # 前端字段

class SubtitleSettings(BaseModel):
    subtitle_switch: int = 0
    font_id: int = 0
    font_size: int = 16
    font_position: Optional[str]
    font_color: str = '#000000'

class TransitionSettings(BaseModel):
    transition_duration: Optional[int] = 1
    transition_switch: Optional[int] = 1
    transition_materials_id: Optional[int] = 1

# 创作
class ShortVideoCreationDetails(BaseModel):
    global_settings: GlobalSettings
    script_settings: ScriptSettings
    digital_human_avatars_settings: DigitalHumanAvatarsSettings
    voice_settings: VoiceSettings
    music_settings: MusicSettings
    background_settings: BackgroundSettings
    subtitle_settings: SubtitleSettings

# 混剪
class ShortVideoMontageDetails(BaseModel):
    global_settings: GlobalSettings
    script_settings: ScriptSettings
    digital_human_avatars_settings: DigitalHumanAvatarsSettings
    voice_settings: VoiceSettings
    music_settings: MusicSettings
    background_settings: BackgroundSettings
    subtitle_settings: SubtitleSettings
    transition_settings: Optional[TransitionSettings]

class ShortVideoInput(BaseModel):
    title: str
    video_url: str
    type: int

# 创作
class ShortVideoCreationInput(BaseModel):
    global_settings: GlobalSettings
    script_settings: ScriptSettings
    digital_human_avatars_settings: DigitalHumanAvatarsSettings
    voice_settings: VoiceSettings
    music_settings: MusicSettings
    background_settings: BackgroundSettings
    subtitle_settings: SubtitleSettings


# 混剪
class ShortVideoMontageInput(BaseModel):
    global_settings: GlobalSettings
    script_settings: ScriptSettings
    digital_human_avatars_settings: DigitalHumanAvatarsSettings
    voice_settings: VoiceSettings
    music_settings: MusicSettings
    background_settings: BackgroundSettings
    subtitle_settings: SubtitleSettings
    transition_settings: TransitionSettings

class ShortVideoWithDetailsOutput(BaseModel):
    global_settings: GlobalSettings
    script_settings: ScriptSettings
    digital_human_avatars_settings: DigitalHumanAvatarsSettings
    voice_settings: VoiceSettings
    music_settings: MusicSettings
    background_settings: BackgroundSettings
    subtitle_settings: SubtitleSettings
    transition_settings: TransitionSettings

