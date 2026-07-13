from sqlalchemy import Column, Integer, String, DateTime, Boolean
from ..database import Base

class PublishingPlanDetail(Base):
    """发布计划详情模型"""
    __tablename__ = "publishing_plan_details"

    # 主键ID
    id = Column(Integer, primary_key=True, index=True)
    # 关联的发布计划ID
    publishing_plan_id = Column(Integer, index=True)
    # 视频ID
    video_id = Column(String, index=True)
    # 视频标题
    video_title = Column(String)
    # 封面URL
    cover_url = Column(String)
    # 视频URL
    video_url = Column(String)
    # 计划发布时间
    publish_time = Column(DateTime)
    # 是否立即发布
    is_publish_immediately = Column(Boolean, default=False, nullable=False)
    # 发布状态（1: 发布中, 2: 发布失败, 3: 发布成功, 4: 发布取消）
    publish_status = Column(Integer, nullable=False)
    # 任务ID(可为空)
    task_id = Column(String, nullable=True)
    # 渠道名称（可能的值：douyin, wechat, xiaohongshu, kuaishou，以逗号分隔的字符串）
    channel_names = Column(String, nullable=False)
    # 账号列表（以逗号分隔的字符串，非必填）
    account_list = Column(String, nullable=True)
    # 分组（非必填）
    group_name  = Column(String, nullable=True)

    # 发布状态常量
    STATUS_PUBLISHING = 1
    STATUS_FAILED = 2
    STATUS_SUCCESS = 3
    STATUS_CANCELLED = 4
