import shutil
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid
import os
from pathlib import Path
import subprocess
import logging
from app.services.ffmpeg_service import FFmpegService
from app.services.task_service import TaskService
from app.services.ultralight_service import UltralightService
from ..database import get_db
from ..models.digital_human_avatar import DigitalHumanAvatar
from ..schemas.digital_human_avatar import (
    DigitalHumanAvatar as DigitalHumanAvatarSchema,
    DigitalHumanAvatarCreate,
    DigitalHumanAvatarUpdate
)
from dotenv import load_dotenv
from ..utils.response_utils import success_response, error_response
from ..schemas.response import ApiResponse, PaginatedResponse
from ..utils import media_utils  # 新增这行导入语句
from ..utils.user_utils import get_user_id

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=ApiResponse[PaginatedResponse[DigitalHumanAvatarSchema]])
def list_digital_human_avatars(
    page: int = Query(1, description="当前页码"),
    page_size: int = Query(10, description="每页记录数"),
    type: Optional[int] = Query(None, description="形象类型"),
    name: Optional[str] = Query(None, description="形象名称"),
    status: Optional[int] = Query(None, description="形象状态 0 表示 AI 克隆训练中, 1 表示克隆完成, 2 表示克隆失败"),
    db: Session = Depends(get_db)
):
    """获取数字人形象列表，支持分页、类型、名称和状态筛选"""
    query = db.query(DigitalHumanAvatar).filter(
        DigitalHumanAvatar.is_deleted == False,
        DigitalHumanAvatar.user_id == get_user_id()
    )
    if type is not None:
        query = query.filter(DigitalHumanAvatar.type == type)
    if name:
        query = query.filter(DigitalHumanAvatar.name.like(f"%{name}%"))
    if status is not None:
        query = query.filter(DigitalHumanAvatar.status == status)
    
    total = query.count()
    skip = (page - 1) * page_size
    avatars = query.order_by(DigitalHumanAvatar.created_at.desc()).offset(skip).limit(page_size).all()

    # 转换路径为URL
    for avatar in avatars:
        avatar.audio_path = media_utils.convert_path_to_url(avatar.audio_path)
        avatar.no_green_video_path = media_utils.convert_path_to_url(avatar.no_green_video_path)
        avatar.no_green_cover_image_path = media_utils.convert_path_to_url(avatar.no_green_cover_image_path)
        avatar.welcome_audio_path = media_utils.convert_path_to_url(avatar.welcome_audio_path)
        avatar.welcome_video_path = media_utils.convert_path_to_url(avatar.welcome_video_path)
        avatar.video_path = media_utils.convert_path_to_url(avatar.video_path)

    return success_response(data=PaginatedResponse(items=avatars, total=total))

@router.post("/", response_model=ApiResponse[DigitalHumanAvatarSchema])
def create_digital_human_avatar(digital_human_avatar: DigitalHumanAvatarCreate, db: Session = Depends(get_db)):
    # 创建训练中的数字人数据
    db_digital_human_avatar = DigitalHumanAvatar(**digital_human_avatar.model_dump())
    try:
        validate_digital_human_avatar_data(db_digital_human_avatar)
        db_digital_human_avatar.created_at = datetime.now()
        db_digital_human_avatar.status = 0
        db_digital_human_avatar.status_msg = "克隆中"
        db_digital_human_avatar.user_id = get_user_id()
        db.add(db_digital_human_avatar)
        db.commit()
        db.refresh(db_digital_human_avatar)
    except ValueError as ve:
        return error_response(code=400, message=str(ve))

    """创建新的数字人形象"""
    task_service = TaskService.get_instance()
    task_id = f"create_avatar_{db_digital_human_avatar.id}"  # 确保 task_id 是字符串
    task_name = f"创建数字人形象_{digital_human_avatar.name}"
    task_func = lambda: create_avatar_task(db_digital_human_avatar, db)
    task_service.execute_task_immediately(task_func=task_func, task_id=task_id, task_name=task_name)

    return success_response(message="数字人形象克隆已提交，正在后台处理")


def get_avatar_origin_path(db_digital_human_avatar: DigitalHumanAvatar) -> Path:
    """创建数字人形象的目录并返回路径"""
    load_dotenv()
    project_root = Path(os.getenv("PROJECT_ROOT"))
    origin_dir = project_root / 'data' / 'avatar' / 'origin'
    origin_dir.mkdir(parents=True, exist_ok=True)
    video_path = media_utils.handle_media_url(db_digital_human_avatar.video_path, origin_dir)
    return video_path

def create_avatar_task(db_digital_human_avatar: DigitalHumanAvatar, db: Session):
    try:
        load_dotenv()
        project_root = Path(os.getenv("PROJECT_ROOT"))
        clone_dir = project_root / 'data' / 'avatar'
        clone_human_id = f"{db_digital_human_avatar.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        avatar_dir = clone_dir / clone_human_id
        avatar_dir.mkdir(parents=True, exist_ok=True)

        # 复制训练视频到数字人目录
        source_ext = Path(db_digital_human_avatar.video_path).suffix
        target_video_path = Path(avatar_dir) / f"source{source_ext}"
        if source_ext.lower() == '.mov':
            ffmpeg_service = FFmpegService()
            ffmpeg_service.convert_video_format(db_digital_human_avatar.video_path, target_video_path)
        else:
            shutil.copy2(db_digital_human_avatar.video_path, target_video_path)
        db_digital_human_avatar.video_path = str(target_video_path)
        db_digital_human_avatar.human_id = clone_human_id

        # ffmpeg_service = FFmpegService()
  
        no_green_video_path = avatar_dir / 'remove_green' / f"no_green.mp4"
        no_green_video_path.parent.mkdir(parents=True, exist_ok=True)
        # TODO 使用media_utils.remove_green_screen
        # ffmpeg_service.remove_green_screen(
        #     str(db_digital_human_avatar.video_path), 
        #     str(no_green_video_path)
        # )

        # 截取第一帧 TODO 使用media_utils.extract_video_frame
        # video_path = str(no_green_video_path) if os.path.exists(no_green_video_path) else str(db_digital_human_avatar.video_path)
        video_path = str(target_video_path)
        first_frame_path = avatar_dir / 'first_frame' / f"first_frame.png"
        first_frame_path.parent.mkdir(parents=True, exist_ok=True)
        media_utils.extract_video_frame(video_path, 1, first_frame_path)

        # 第一帧的尺寸
        width, height = media_utils.get_image_dimensions(str(first_frame_path))
        db_digital_human_avatar.no_green_cover_image_width = width
        db_digital_human_avatar.no_green_cover_image_height = height
        db_digital_human_avatar.no_green_cover_image_path = str(first_frame_path)
        db_digital_human_avatar.no_green_video_path = str(no_green_video_path)
        logger.info(f"处理完成: 第一帧 {first_frame_path}, 尺寸 {width}x{height}, 无绿幕视频 {no_green_video_path}")
        

        # 训练数字人模型    
        ultralight_service = UltralightService()
        best_checkpoint_path = ultralight_service.train(video_path, avatar_dir, 'hubert', True)


        # 生成数字人视频
        output_video_path = avatar_dir / 'welcome' / f"welcome.mp4"
        output_video_path.parent.mkdir(parents=True, exist_ok=True)

        # 数字人统一使用默认的声音
        default_audio = project_root / 'resources' / 'audios' / 'default_audio.wav'
        audio_path = avatar_dir / 'default_audio.wav'
        shutil.copy2(default_audio, audio_path)
        db_digital_human_avatar.audio_path = str(audio_path)
        
        ultralight_service.generate_video(str(audio_path), avatar_dir, best_checkpoint_path, str(output_video_path), 'hubert')

        # 更新数字人形象数据
        db_digital_human_avatar.welcome_audio_path = str(audio_path)    
        db_digital_human_avatar.welcome_video_path = str(output_video_path)
        db_digital_human_avatar.finished_at = datetime.now()
        total_minutes = (db_digital_human_avatar.finished_at - db_digital_human_avatar.created_at).total_seconds() / 60
        db_digital_human_avatar.status_msg = f"克隆完成，耗时{total_minutes:.2f}分钟"
        logger.info(f"创建数字人形象任务完成，耗时 {total_minutes:.2f} 分钟")
        db_digital_human_avatar.status = 1
        db.merge(db_digital_human_avatar)
        db.commit()
        logger.info(f"成功更新数字人形象: {db_digital_human_avatar.id}")
        media_utils.delete_file(db_digital_human_avatar.video_path)
    except Exception as e:
        logger.error(f"创建数字人形象失败: {str(e)}")
        db_digital_human_avatar.status = 2
        db_digital_human_avatar.status_msg = f"创建失败: {str(e)}"
        db.merge(db_digital_human_avatar)
        db.commit()
        raise Exception(f"创建数字人形象失败: {str(e)}")




@router.delete("/{avatar_id}", response_model=ApiResponse[DigitalHumanAvatarSchema])
def delete_digital_human_avatar(avatar_id: int, db: Session = Depends(get_db)):
    """软删除数字人形象"""
    db_digital_human_avatar = get_digital_human_avatar_or_404(db, avatar_id)
    if isinstance(db_digital_human_avatar, dict):
        return db_digital_human_avatar
    db_digital_human_avatar.is_deleted = True
    db.commit()
    return success_response(data=db_digital_human_avatar, message="成功删除数字人形象")

def validate_digital_human_avatar_data(db_digital_human_avatar):
    """验证数字人形象数据"""
    if len(db_digital_human_avatar.name) > 20:
        raise ValueError("形象名称不能超过20个字符")
    if not (db_digital_human_avatar.video_path.lower().endswith('.mp4') or db_digital_human_avatar.video_path.lower().endswith('.mov')):
        raise ValueError("素材必须是MP4或MOV格式")
     # 获取路径，如果是http链接，则下载到本地，重新赋值给video_path
    db_digital_human_avatar.video_path = get_avatar_origin_path(db_digital_human_avatar)
    file_size = os.path.getsize(db_digital_human_avatar.video_path)
    if file_size > 1024 * 1024 * 1024:  # 1GB in bytes
        raise ValueError("MP4文件大小不能超过1GB")

def generate_unique_id() -> str:
    """生成唯一操作ID"""
    return f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

def process_audio(avatar_path: str, wav_output_path: str) -> str:
    """处理音频文件"""
    try:
        subprocess.run([
            'ffmpeg',
            '-i', avatar_path,
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            wav_output_path
        ], check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"音频提取失败: {e.stderr}")
    return wav_output_path

def get_digital_human_avatar_or_404(db: Session, avatar_id: int):
    """获取数字人形象或返回404错误"""
    digital_human_avatar = db.query(DigitalHumanAvatar).filter(
        DigitalHumanAvatar.id == avatar_id,
        DigitalHumanAvatar.is_deleted == False,
        DigitalHumanAvatar.user_id == get_user_id()
    ).first()
    if not digital_human_avatar:
        return error_response(code=404, message="数字人形象不存在")
    return digital_human_avatar

def update_digital_human_avatar_data(db_digital_human_avatar, digital_human_avatar):
    """更新数字人形象数据"""
    update_data = digital_human_avatar.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_digital_human_avatar, key, value)
