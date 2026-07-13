from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class ShortVideo(Base):
    """短视频模型

    这个模型定义了短视频在数据库中的结构

    属性:
        id (int): 主键,自动递增
        title (str): 短视频标题,最大长度20字符
        status (int): 状态, 0表示生成中, 1表示已生成, 2表示生成失败需要重试
        video_url (str): 视频文件的URL或本地存储路径,最大长度255字符
        video_cover (str): 视频封面文件的URL或本地存储路径,最大长度255字符
        type (int): 视频类型, 0表示创作, 1表示混剪
        created_at (datetime): 视频创建时间
        finished_at (datetime): 视频生成完成时间
        is_deleted (bool): 删除标志, False表示未删除, True表示已删除
        short_videos_detail_id (int): 视频详情id,外键
        user_id (str): 用户ID,最大长度100字符
    """

    __tablename__ = "short_videos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(100), nullable=False, comment="短视频的标题")
    status = Column(Integer, nullable=False, default=0, comment="短视频状态：0表示生成中，1表示已生成，2表示生成失败需要重试")
    status_msg = Column(String(20), nullable=True, default="", comment="短视频状态信息")
    video_url = Column(String(255), nullable=True, comment="视频文件的URL或本地存储路径")
    video_cover = Column(String(255), nullable=True, comment="视频封面文件的URL或本地存储路径")
    type = Column(Integer, nullable=False, default=0, comment="视频类型：0表示创作，1表示混剪")
    created_at = Column(DateTime, nullable=False, server_default=func.now(), comment="视频创建时间")
    finished_at = Column(DateTime, comment="视频生成完成时间")
    is_deleted = Column(Boolean, nullable=False, default=False, comment="删除标志：False表示未删除，True表示已删除")
    short_videos_detail_id = Column(Integer, nullable=False, comment="视频详情id")
    user_id = Column(String(100), nullable=True, comment="用户ID")

    STATUS_MAPPING = {0: "生成中", 1: "已生成", 2: "生成失败,需要重试"}
    TYPE_MAPPING = {0: "创作", 1: "混剪"}

    @property
    def status_name(self):
        """返回状态的文字描述"""
        return self.STATUS_MAPPING.get(self.status, "未知")

    @property
    def type_name(self):
        """返回类型的文字描述"""
        return self.TYPE_MAPPING.get(self.type, "未知")

    def __repr__(self):
        """返回短视频对象的字符串表示"""
        return f"<ShortVideo(id={self.id}, title='{self.title}', status={self.status_name}, type={self.type_name})>"
