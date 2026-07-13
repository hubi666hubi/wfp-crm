from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..models.task import Task
from ..schemas.task import Task as TaskSchema, TaskCreate, TaskUpdate
from ..utils.response_utils import success_response, error_response
from ..schemas.response import ApiResponse, PaginatedResponse

router = APIRouter()

@router.get("/", response_model=ApiResponse[PaginatedResponse[TaskSchema]])
def list_tasks(
    page: int = Query(1, description="当前页码"),
    page_size: int = Query(10, description="每页记录数"),
    name: Optional[str] = Query(None, description="任务名称"),
    status: Optional[int] = Query(None, description="任务状态"),
    start_time: Optional[datetime] = Query(None, description="计划执行时间开始"),
    end_time: Optional[datetime] = Query(None, description="计划执行时间结束"),
    task_type: Optional[str] = Query(None, description="任务类型"),
    db: Session = Depends(get_db)
):
    """获取任务列表"""
    query = db.query(Task).filter(Task.is_deleted == False)
    
    if name:
        query = query.filter(Task.name.ilike(f"%{name}%"))
    if status is not None:
        query = query.filter(Task.status == status)
    if start_time:
        query = query.filter(Task.scheduled_time >= start_time)
    if end_time:
        query = query.filter(Task.scheduled_time <= end_time)
    if task_type:
        query = query.filter(Task.type == task_type)
    
    total = query.count()
    skip = (page - 1) * page_size
    tasks = query.offset(skip).limit(page_size).all()
    
    return success_response(data=PaginatedResponse(items=tasks, total=total))


@router.get("/{task_id}", response_model=ApiResponse[TaskSchema])
def read_task(task_id: int, db: Session = Depends(get_db)):
    """获取特定任务的详细信息"""
    task = db.query(Task).filter(Task.id == task_id, Task.is_deleted == False).first()
    if not task:
        return error_response(code=404, message="任务不存在")
    return success_response(data=task)


@router.delete("/{task_id}", response_model=ApiResponse[TaskSchema])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """软删除任务"""
    db_task = db.query(Task).filter(Task.id == task_id, Task.is_deleted == False).first()
    if not db_task:
        return error_response(code=404, message="任务不存在")
    
    db_task.is_deleted = True
    db.commit()
    return success_response(data=db_task, message="成功删除任务")

