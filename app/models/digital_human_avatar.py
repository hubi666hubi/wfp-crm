from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from ..database import Base

class DigitalHumanAvatar(Base):
    """数字人形象模型

    定义数字人形象在数据库中的结构

    属性:
        id (int): 主键，自动递增
        name (str): 形象名称
        type (int): 形象类型，0表示公共，1表示个人
        created_at (datetime): 创建时间，默认为当前时间
        finished_at (datetime): 完成时间
        status (int): 状态，0表示AI克隆训练中，1表示克隆完成，2表示克隆失败
        status_msg (str): 训练中的进度和预计耗时
        is_deleted (bool): 删除状态，True表示已删除，False表示未删除
        description (str): 形象描述
        audio_path (str): 音频文件路径
        audio_prompt_npy_path (str): 音频提示npy文件路径
        welcome_audio_path (str): 欢迎语音频路径
        welcome_video_path (str): 欢迎视频路径
        human_id (str): 数字人形象唯一标识符
        user_id (str): 用户ID
        no_green_video_path (str): 去除绿幕后的视频路径
        no_green_cover_image_path (str): 去除绿幕后的封面图片路径
    """

    __tablename__ = "digital_human_avatars"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    
    type = Column(Integer, default=1, nullable=False)  # 0表示公共，1表示个人
    created_at = Column(DateTime(timezone=True), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Integer, default=0, nullable=False)  # 0：AI克隆训练中，1：克隆完成，2：克隆失败
    status_msg = Column(String(20), default="", nullable=False) #训练中的进度和预计耗时
    is_deleted = Column(Boolean, default=False, nullable=False)
    description = Column(String(500))
    
    video_path = Column(String(255), nullable=False)
    audio_path = Column(String(255), nullable=True)
    audio_prompt_npy_path = Column(String(255), nullable=True)
   
    welcome_audio_path = Column(String(255), nullable=True)
    welcome_video_path = Column(String(255), nullable=True)
    human_id = Column(String(255), nullable=True)
    user_id = Column(String(100), nullable=True)

    no_green_video_path = Column(String(255), nullable=True)
    no_green_cover_image_path = Column(String(255), nullable=True)
    no_green_cover_image_width = Column(Integer, nullable=True)
    no_green_cover_image_height = Column(Integer, nullable=True)

    TYPE_MAPPING = {0: "公共", 1: "个人"}
    STATUS_MAPPING = {0: "AI克隆训练中", 1: "克隆完成", 2: "克隆失败"}

    @property
    def type_name(self):
        """返回形象类型的文字描述"""
        return self.TYPE_MAPPING.get(self.type, "未知")

    @property
    def status_name(self):
        """返回状态的文字描述"""
        return self.STATUS_MAPPING.get(self.status, "未知")

    def __repr__(self):
        """返回数字人形象对象的字符串表示"""
        return f"<DigitalHumanAvatar(id={self.id}, name='{self.name}', type={self.type_name}, status={self.status_name})>"
