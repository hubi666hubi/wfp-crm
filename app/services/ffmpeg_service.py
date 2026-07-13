import shlex
import ffmpeg
from pathlib import Path
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
import traceback
import logging
import srt
import platform

logger = logging.getLogger(__name__)

class FFmpegService:
    def __init__(self):
        load_dotenv()
        self.project_root = Path(os.getenv("PROJECT_ROOT"))
        self.video_dir = self.project_root / 'data' / 'video'
        self.image_dir = self.project_root / 'data' / 'image'
        self.music_dir = self.project_root / 'data' / 'music'
        self.audio_dir = self.project_root / 'data' / 'audio'
        self.subtitle_dir = self.project_root / 'data' / 'subtitle'  # 新增字幕目录
        self.publish_dir = self.project_root / 'data' / 'publish'
        
        # 创建所有必要的目录
        for directory in [self.video_dir, self.image_dir, self.music_dir, self.audio_dir, self.subtitle_dir, self.publish_dir]:
            directory.mkdir(parents=True, exist_ok=True)

        self.default_font_path = self.project_root / 'resources' / 'fonts' / 'lipin.ttf'  # 默认使用黑体
        
        # 确保字体文件存在
        if not self.default_font_path.exists():
            logger.warning(f"默认字体文件不存在: {self.default_font_path}")

    def convert_video_format(self, input_path: str, output_path: str):
        """将视频格式从MOV转换为MP4"""
        # 确保输出目录存在
        output_dir = Path(output_path).parent
        output_dir.mkdir(parents=True, exist_ok=True)
        input_stream = ffmpeg.input(input_path)

        output_path = Path(output_path).as_posix()
        output_stream = ffmpeg.output(input_stream, output_path, vcodec='libx264', acodec='aac', strict='experimental')
        ffmpeg.run(output_stream, overwrite_output=True)

