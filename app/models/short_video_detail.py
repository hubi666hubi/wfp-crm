from sqlalchemy import JSON, Column, Integer, Float, String
from ..database import Base

class ShortVideoDetail(Base):
    """短视频详情模型类"""
    
    __tablename__ = "short_video_details"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, comment="用户ID")
    video_title = Column(String(100), nullable=False, comment="视频标题")
    script_content = Column(String(255), comment="文案内容")
    video_duration = Column(Integer, comment="生成的视频时长(秒)")
    generation_count = Column(Integer, default=1, nullable=False, comment="生成数量")
    
    # 视频设置
    video_layout = Column(Integer, default=2, nullable=False, comment="视频布局（1-横屏，2-竖屏）")
    video_frame_rate = Column(Integer, default=25, nullable=False, comment="视频帧率（25,30,50,60）")
    resolution = Column(Integer, default=3, nullable=False, comment="分辨率(1-480p,2-720p,3-1080p,4-2k,5-4k)")
    export_format = Column(Integer, default=1, nullable=False, comment="导出格式（1-mp4,2-mov）")
    
    # 数字人设置
    digital_human_avatars_type = Column(Integer, default=1, nullable=False, comment="数字人形象类型（0远程，1本地）")
    digital_human_avatars_download_url = Column(String(255), comment="远程:模型压缩包下载地址") # video_path
    digital_human_avatars_id = Column(Integer, comment="人物id")
    digital_human_avatars_position = Column(String(20), default='0,0', comment="人物位置")
    digital_human_avatars_scale = Column(Float, default=1, nullable=False, comment="人物缩放比例")
    digital_human_avatars_human_id = Column(String(20), default='', comment="远程:human_id") # human_id
    digital_human_avatars_no_green_cover_image_width = Column(Integer, comment="远程:远程数字人宽") # no_green_cover_image_width
    digital_human_avatars_no_green_cover_image_height = Column(Integer, comment="远程:远程数字人宽") # no_green_cover_image_height

    # 配音设置
    voice_material_type = Column(Integer, default=1, nullable=False, comment="配音素材类型（1本地，0远程）")
    voice_switch = Column(Integer, default=0, comment="配音真人录制（0-关闭，1-开启）")
    voice_speed = Column(Float, default=1, comment="配音语速")
    voice_volume = Column(Float, default=1, comment="配音音量")
    voice_id = Column(Integer, comment="配音声音id")
    voice_path = Column(String(255), comment="声音文件路径")
    voice_download_url = Column(String(255), comment="远程:声音素材模型压缩包下载地址") # file_path
    voice_preview_url = Column(String(255), comment="声音素材预览地址")
    voice_resource_id = Column(String(50), comment="声音素材资源ID")
    voice_npy_prompt_text = Column(String(500), comment="远程:npy提示文本") # npy_prompt_text
    voice_voice_id = Column(String(500), comment="远端:voice_id") # voice_id

    
    # 字幕设置
    subtitle_switch = Column(Integer, default=0, nullable=False, comment="字幕开关（0-关闭，1-开启）")
    font_id = Column(Integer, comment="字体id")
    font_size = Column(Integer, default=16, nullable=False, comment="字体大小")
    font_color = Column(String(20), default='#000000', nullable=False, comment="字体颜色")
    font_position = Column(String(20), default='0,0', nullable=False, comment="字幕位置")
    font_path = Column(String(255), comment="字体文件路径")
    font_name = Column(String(50), comment="字体名称")
