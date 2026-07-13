import traceback
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date

from ..database import get_db
from ..models.short_video import ShortVideo
from ..schemas.short_video import ShortVideo as ShortVideoSchema, ShortVideoCreate, ShortVideoUpdate
from ..services.ffmpeg_service import FFmpegService
from ..utils import media_utils
from ..utils.response_utils import success_response, error_response
from ..schemas.response import ApiResponse, PaginatedResponse
from ..utils.user_utils import get_user_id

router = APIRouter()

@router.get("/", response_model=ApiResponse[PaginatedResponse[ShortVideoSchema]])
def list_short_videos(
    page: int = Query(1, description="当前页码"),
    page_size: int = Query(10, description="每页记录数"),
    name: str = Query(None, description="视频名称"),
    start_time: datetime = Query(None, description="生成时间开始"),
    end_time: datetime = Query(None, description="生成时间结束"),
    video_type: str = Query(None, description="视频类型"),
    status: int = Query(None, description="状态 0-生成中，1-已生成，2-生成失败需要重试"),
    db: Session = Depends(get_db)
):
    """获取短视频列表"""
    query = db.query(ShortVideo).filter(ShortVideo.is_deleted == False, ShortVideo.user_id == get_user_id())
    
    if name:
        query = query.filter(ShortVideo.title.ilike(f"%{name}%"))
    if start_time:
        query = query.filter(ShortVideo.created_at >= start_time)
    if end_time:
        query = query.filter(ShortVideo.created_at <= end_time)
    if video_type:
        query = query.filter(ShortVideo.type == video_type)
    if status is not None:
        query = query.filter(ShortVideo.status == status)
    
    total = query.count()
    skip = (page - 1) * page_size
    short_videos = query.order_by(ShortVideo.created_at.desc()).offset(skip).limit(page_size).all()

    # 转换路径为URL
    for short_video in short_videos:
        short_video.video_cover = media_utils.convert_path_to_url(short_video.video_cover)
        short_video.video_url = media_utils.convert_path_to_url(short_video.video_url)

    return success_response(data=PaginatedResponse(items=short_videos, total=total))


@router.delete("/{short_video_id}", response_model=ApiResponse[ShortVideoSchema])
def delete_short_video(short_video_id: int, db: Session = Depends(get_db)):
    """
    软删除短视频

    这个端点用于软删除指定 ID 的短视频(将 is_deleted 设置为 True)
    """
    db_short_video = db.query(ShortVideo).filter(
        ShortVideo.id == short_video_id,
        ShortVideo.is_deleted == False,
        ShortVideo.user_id == get_user_id()
    ).first()
    if not db_short_video:
         return error_response(code=404, message="短视频不存在")
    
    db_short_video.is_deleted = True
    db.commit()
    return success_response(data=db_short_video, message="成功删除短视频")
