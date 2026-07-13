from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.font import Font
from ..schemas.font import Font as FontSchema, FontCreate, FontUpdate
from ..utils.response_utils import success_response, error_response
from ..schemas.response import ApiResponse, PaginatedResponse

router = APIRouter()

@router.get("/", response_model=ApiResponse[PaginatedResponse[FontSchema]])
def list_fonts(page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    """获取字体列表，支持分页"""
    query = db.query(Font)
    total = query.count()
    skip = (page - 1) * page_size
    fonts = query.offset(skip).limit(page_size).all()
    return success_response(data=PaginatedResponse(items=fonts, total=total))