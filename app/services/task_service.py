from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from typing import Callable, Any, Optional, Dict, List
from app.models.task import Task
from functools import wraps
from sqlalchemy.orm import Session
from app.database import get_db
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class TaskService:
    """
    任务服务类,用于管理和调度任务。
    实现了单例模式,确保全局只有一个实例。
    """
    _instance = None

    @classmethod
    def get_instance(cls):
        """获取TaskService的单例实例"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        """初始化TaskService,创建后台调度器"""
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()

    def _get_db_session(self):
        """获取数据库会话"""
        return next(get_db())

    @contextmanager
    def _db_session_context(self):
        """创建一个数据库会话上下文管理器"""
        session = self._get_db_session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise

    def _add_task_to_db(self, task_func: Callable, run_date: datetime, task_id: str, task_name: str):
        """将任务添加到数据库"""
        with self._db_session_context() as db:
            try:
                task = Task(
                    id=task_id,
                    name=task_name,
                    start_time=run_date,
                    status=0,  # 0 表示执行中
                )
                db.add(task)
            except Exception as e:
                logger.error(f"添加任务到数据库失败: {str(e)}")
                raise

    def _update_task_status(self, task_id: str, status: int, result: str = None):
        """更新任务状态"""
        with self._db_session_context() as db:
            try:
                task = db.query(Task).filter(Task.id == task_id).first()
                if task:
                    task.status = status
                    task.result = result
                    if status in [1, 2, 3]:  # 执行成功、失败或取消时设置结束时间
                        task.end_time = datetime.now()
            except Exception as e:
                logger.error(f"更新任务状态失败: {str(e)}")
                raise

    def _task_wrapper(self, task_func: Callable, task_id: str):
        """包装任务函数,在执行前后更新任务状态"""
        @wraps(task_func)
        def wrapper(*args, **kwargs):
            self._update_task_status(task_id, 0)  # 0 表示执行中
            try:
                result = task_func(*args, **kwargs)
                self._update_task_status(task_id, 1, str(result))  # 1 表示执行成功
                return result
            except Exception as e:
                self._update_task_status(task_id, 2, str(e))  # 2 表示执行失败
                logger.error(f"任务执行失败: {str(e)}")
                raise
        return wrapper

    def schedule_task(self, task_func: Callable, run_date: datetime, task_id: str, task_name: str):
        """调度一个任务在指定时间执行"""
        try:
            wrapped_func = self._task_wrapper(task_func, task_id)
            self.scheduler.add_job(
                wrapped_func,
                'date',
                run_date=run_date,
                id=task_id,
                name=task_name
            )
            self._add_task_to_db(task_func, run_date, task_id, task_name)
        except Exception as e:
            logger.error(f"调度任务失败: {str(e)}")
            raise

    def execute_task_immediately(self, task_func: Callable, task_id: str, task_name: str):
        """立即执行一个任务"""
        try:
            run_date = datetime.now()
            wrapped_func = self._task_wrapper(task_func, task_id)
            self.scheduler.add_job(
                wrapped_func,
                'date',
                run_date=run_date,
                id=task_id,
                name=task_name
            )
            self._add_task_to_db(task_func, run_date, task_id, task_name)
        except Exception as e:
            logger.error(f"立即执行任务失败: {str(e)}")
            raise

    def remove_task(self, task_id: str):
        """从调度器中移除指定的任务"""
        try:
            self.scheduler.remove_job(task_id)
            self._update_task_status(task_id, 3, "任务被取消")  # 3 表示取消执行
        except Exception as e:
            logger.error(f"移除任务失败: {str(e)}")
            raise

    def get_task_details(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务详情"""
        try:
            job = self.scheduler.get_job(task_id)
            if job:
                return self._get_job_details(job)
            
            with self._db_session_context() as db:
                task = db.query(Task).filter(Task.id == task_id).first()
                if task:
                    return self._get_task_details(task)
            
            return None
        except Exception as e:
            logger.error(f"获取任务详情失败: {str(e)}")
            raise

    def _get_job_details(self, job):
        """获取调度器中任务的详情"""
        return {
            'id': job.id,
            'name': job.name,
            'func': job.func.__name__,
            'args': job.args,
            'kwargs': job.kwargs,
            'next_run_time': job.next_run_time,
            'trigger': str(job.trigger),
            'misfire_grace_time': job.misfire_grace_time,
            'coalesce': job.coalesce,
            'max_instances': job.max_instances,
        }

    def _get_task_details(self, task):
        """获取数据库中任务的详情"""
        return {
            'id': task.id,
            'name': task.name,
            'status': task.status,
            'scheduled_time': task.scheduled_time,
            'execution_time': task.execution_time,
            'result': task.result,
        }

    def list_all_tasks(self) -> List[Dict[str, Any]]:
        """列出所有任务"""
        try:
            scheduler_jobs = self.scheduler.get_jobs()
            with self._db_session_context() as db:
                db_tasks = db.query(Task).all()

            all_tasks = [self.get_task_details(job.id) for job in scheduler_jobs]
            all_tasks.extend([self._get_task_details(task) for task in db_tasks if not any(t['id'] == task.id for t in all_tasks)])

            return all_tasks
        except Exception as e:
            logger.error(f"列出所有任务失败: {str(e)}")
            raise

    def shutdown(self):
        """关闭调度器"""
        self.scheduler.shutdown()
