from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from ..database import Base

class DigitalHumanVoice(Base):
    """数字人声音模型

    这个模型定义了数字人声音在数据库中的结构

    属性:
        id (int): 主键,自动递增
        user_id (str): 用户ID
        name (str): 声音名称
        file_path (str) : 音频路径
        type (int): 类型, 0 代表公共, 1 代表个人
        status (int): 状态, 0-AI克隆训练中, 1-克隆完成, 2-克隆失败
        is_deleted (bool): 删除状态, False 表示未删除, True 表示已删除
        created_at (datetime): 创建时间
        finished_at (datetime): 完成时间
        voice_id (str): 声音唯一标识符
        sample_audio_url (str): 示例音频地址
    """

    __tablename__ = "digital_human_voices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    file_path = Column(String(255), nullable=False)
    npy_path = Column(String(255), nullable=True)
    npy_prompt_text = Column(String(255), nullable=True)
    type = Column(Integer, default=1, nullable=False)
    status = Column(Integer, default=0, nullable=False)
    status_msg = Column(String(20), default="", nullable=False) #训练中的进度和预计耗时
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    voice_id = Column(String(255), nullable=True)
    sample_audio_url = Column(String(255), nullable=True)

    TYPE_MAPPING = {0: "公共", 1: "个人"}
    STATUS_MAPPING = {0: "AI克隆训练中", 1: "克隆完成", 2: "克隆失败"}

    @property
    def type_name(self):
        """返回类型的文字描述"""
        return self.TYPE_MAPPING.get(self.type, "未知")

    @property
    def status_name(self):
        """返回状态的文字描述"""
        return self.STATUS_MAPPING.get(self.status, "未知")

    def __repr__(self):
        """返回数字人声音对象的字符串表示"""
        return f"<DigitalHumanVoice(id={self.id}, name='{self.name}', type={self.type_name}, status={self.status_name})>"
