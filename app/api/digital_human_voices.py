from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging
from ..database import get_db
from ..models.digital_human_voice import DigitalHumanVoice
from ..schemas.digital_human_voice import DigitalHumanVoice as DigitalHumanVoiceSchema, DigitalHumanVoiceCreate, DigitalHumanVoiceUpdate
from ..utils.response_utils import success_response, error_response
from ..utils import media_utils
from ..schemas.response import ApiResponse, PaginatedResponse
from ..utils.user_utils import get_user_id

router = APIRouter()

# 设置日志记录
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/", response_model=ApiResponse[PaginatedResponse[DigitalHumanVoiceSchema]])
def list_digital_human_voices(
    page: int = Query(1, description="当前页码"),
    page_size: int = Query(10, description="每页记录数"),
    status: int = Query(None, description="状态 0-AI克隆训练中，1-可用，2-失败"),
    name: str = Query(None, description="声音名称"),
    db: Session = Depends(get_db)
):
    """
    获取数字人声音列表

    这个端点返回一个数字人声音列表,支持分页
    - skip: 跳过的记录数,用于分页
    - limit: 返回的最大记录数,用于分页
    - name: 按名称搜索
    """
    query = db.query(DigitalHumanVoice).filter(DigitalHumanVoice.is_deleted == False, DigitalHumanVoice.user_id == get_user_id())

    if status is not None:
        query = query.filter(DigitalHumanVoice.status == status)
    if name  is not None:
        query = query.filter(DigitalHumanVoice.name.like(f"%{name}%"))


    total = query.count()
    skip = (page - 1) * page_size
    voices = query.order_by(DigitalHumanVoice.created_at.desc()).offset(skip).limit(page_size).all()
    
    # 转换路径为URL
    for voice in voices:
        voice.sample_audio_url = media_utils.convert_path_to_url(voice.sample_audio_url)
    return success_response(data=PaginatedResponse(items=voices, total=total))
