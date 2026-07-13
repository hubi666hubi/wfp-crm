import os
from app.utils.logger_utils import setup_logger
setup_logger()
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.video import crt_video,h5_crt_video
from .database import engine, Base
from .api import (digital_human_avatars, digital_human_voices, short_videos, font)
from .api import (file_deal)

from .utils.response_utils import error_response
from contextlib import asynccontextmanager
from app.services.task_service import TaskService
import logging
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 设置第三方库的日志级别为 WARNING，以减少噪音
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("asyncio").setLevel(logging.WARNING)

@asynccontextmanager
async def lifespan(app: FastAPI):
    TaskService.get_instance()
    yield
    TaskService.get_instance().shutdown()

app = FastAPI(title="数字人管理系统", version="0.1.0", lifespan=lifespan)

# 静态挂载目录
avatars_path = os.path.join(os.path.dirname(__file__), '..', 'data/avatar')
voice_path = os.path.join(os.path.dirname(__file__), '..', 'data/voice')
video_path = os.path.join(os.path.dirname(__file__), '..', 'data/video')
public_path = os.path.join(os.path.dirname(__file__), '..', 'data/public')

# 定义需要创建的目录列表
directories = [
    avatars_path, voice_path, video_path, public_path
]

# 检查并创建目录
for directory in directories:
    if not os.path.exists(directory):
        logger.info(f"创建目录: {directory}")
        os.makedirs(directory, exist_ok=True)

# 挂载静态文件目录
app.mount("/data/avatar", StaticFiles(directory=avatars_path), name="avatar")

# 挂载静态文件目录
app.mount("/data/voice", StaticFiles(directory=voice_path), name="voice")

# 挂载静态文件目录
app.mount("/data/video", StaticFiles(directory=video_path), name="video")

# 挂载静态文件目录
app.mount("/data/public", StaticFiles(directory=public_path), name="public")



# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_error_response(status_code: int, message: str, errors: dict = None):
    content = error_response(code=status_code, message=message)
    if errors:
        content.data = {"errors": errors}
    return JSONResponse(status_code=status_code, content=content.dict())

def process_validation_errors(exc):
    return {".".join(map(str, error["loc"])): error["msg"] for error in exc.errors()}

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_fields = [error['loc'] for error in exc.errors()]  # 提取错误字段
    logger.error(f"验证错误字段: {error_fields}")  # 输出错误字段
    return create_error_response(422, "输入验证错误", process_validation_errors(exc))

@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    return create_error_response(422, "数据验证错误", process_validation_errors(exc))

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return create_error_response(exc.status_code, exc.detail)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"code": 500, "data": None, "message": f"Unhandled error: {str(exc)}"}
    )

# 包含API路由
app.include_router(digital_human_avatars.router, prefix="/api/digital-human-avatars", tags=["digital_human_avatars"])
app.include_router(short_videos.router, prefix="/api/short-videos", tags=["short_videos"])
app.include_router(digital_human_voices.router, prefix="/api/digital-human-voices", tags=["digital_human_voices"])
app.include_router(crt_video.router, prefix="/api/video/create", tags=["crt_video"]) 
app.include_router(h5_crt_video.router, prefix="/api/video/h5-create", tags=["h5_crt_video"])
app.include_router(file_deal.router, prefix="/api/file-deal", tags=["file_deal"])
app.include_router(font.router, prefix="/api/font", tags=["font"])

@app.get("/")
async def root():
    return {"message": "欢迎使用数字人管理系统"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
