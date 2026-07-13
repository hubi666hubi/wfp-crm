from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Task(Base):
    """任务模型

    这个模型定义了简化后的任务在数据库中的结构

    属性:
        id (int): 主键，自动递增
        name (str): 任务名称
        start_time (datetime): 开始时间
        end_time (datetime): 结束时间
        result (str): 执行结果
        status (int): 任务状态 (0: 执行中, 1: 执行成功, 2: 执行失败, 3: 取消执行)
    """

    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    result = Column(String)
    status = Column(Integer, nullable=False, default=0)

    # 状态映射
    STATUS_MAPPING = {
        0: "执行中",
        1: "执行成功",
        2: "执行失败",
        3: "取消执行"
    }

    def __repr__(self):
        status_str = self.STATUS_MAPPING.get(self.status, "未知状态")
        return f"<Task(id={self.id}, name='{self.name}', status='{status_str}')>"
