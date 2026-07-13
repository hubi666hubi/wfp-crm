from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class ShortVideoDetailBase(BaseModel):
    """短视频详情基础模式"""
    user_id: Optional[int] = Field(None, description="用户ID")
    video_title: Optional[str] = Field(None, description="视频标题")
    script_content: Optional[str] = Field(None, description="文案内容")
    video_layout: Optional[int] = Field(2, description="视频布局（1-横屏，2-竖屏）")
    resolution: Optional[int] = Field(3, description="分辨率(1-480p,2-720p,3-1080p,4-2k,5-4k)")
    video_frame_rate: Optional[int] = Field(25, description="视频帧率（1-25fps,2-30fps,3-50fps,4-60fps）")
    video_duration: Optional[int] = Field(None, description="生成的视频时长(秒)")
    export_format: Optional[int] = Field(1, description="导出格式（1-mp4,2-mov）")
    generation_count: Optional[int] = Field(1, description="生成数量")
    
    digital_human_avatars_type: Optional[int] = Field(1, description="数字人形象类型（0远程，1本地）")
    digital_human_avatars_download_url: Optional[str] = Field(default=None, description="远程:模型压缩包下载地址")
    digital_human_avatars_id: Optional[int] = Field(None, description="人物id")
    digital_human_avatars_position: Optional[str] = Field("0,0", description="人物位置")
    digital_human_avatars_scale: Optional[float] = Field(1, description="人物缩放比例")
    digital_human_avatars_human_id: Optional[str] = Field(default=None, description="远程:human_id") # human_id
    digital_human_avatars_no_green_cover_image_width: Optional[int] = Field(1920, description="远程数字人宽")
    digital_human_avatars_no_green_cover_image_height: Optional[int] = Field(1080, description="远程:远程数字人高")

    voice_speed: Optional[float] = Field(1.0, description="配音语速")
    voice_volume: Optional[float] = Field(1.0, description="配音音量")
    voice_id: Optional[int] = Field(None, description="配音声音id")
    voice_path: Optional[str] = Field(None, description="声音文件路径")
    voice_material_type: Optional[int] = Field(1, description="声音素材库类型（1-本地，0-远程）")
    voice_download_url: Optional[str] = Field(None, description="远程:声音素材模型压缩包下载地址")
    voice_preview_url: Optional[str] = Field(None, description="声音素材预览地址")
    voice_resource_id: Optional[str] = Field(None, description="声音素材资源ID")
    voice_npy_prompt_text: Optional[str] = Field(None, description="远程:npy提示文本")
    voice_voice_id: Optional[str] = Field(None, description="远端:voice_id")
    
    subtitle_switch: Optional[int] = Field(0, description="字幕开关（0-关闭，1-开启）")
    font_id: Optional[int] = Field(0, description="字体id")
    font_size: Optional[int] = Field(16, description="字体大小")
    font_color: Optional[str] = Field("#ffffffff", description="字体颜色")
    font_position: Optional[str] = Field("0,0", description="字幕位置")
    font_path: Optional[str] = Field(None, description="字体文件路径")
    font_name: Optional[str] = Field(None, description="字体名称")




class ShortVideoDetailCreate(ShortVideoDetailBase):
    """创建短视频详情的请求模式"""
    pass

class ShortVideoDetail(ShortVideoDetailBase):
    """短视频详情的响应模式"""
    id: int

    class Config:
        orm_mode = True
