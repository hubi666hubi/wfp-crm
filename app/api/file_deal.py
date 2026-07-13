from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
import os

from app.utils import media_utils

router = APIRouter()
@router.get("/download")
def download_file(url: str = Query(..., description="文件的HTTP地址")):
    # 使用 convert_url_to_path 方法将 URL 转换为系统内部路径
    file_path = media_utils.convert_url_to_path(url)
    print(f"文件路径: {file_path}")
    # 检查文件是否存在
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # 返回文件响应
    return FileResponse(file_path, media_type='application/octet-stream', filename=os.path.basename(file_path))


@router.get("/get_preSign_url")
def get_presigned_url(filename: str = Query(..., description="文件名称")):
    from app.services.upload_service import generate_presigned_url
    from app.utils.response_utils import success_response
    
    # 调用生成预签名URL的方法
    result = generate_presigned_url(filename)
    
    if not result:
        raise HTTPException(status_code=500, detail="生成预签名URL失败")
        
    return success_response(
        data=result,
        message="获取预签名URL成功"
    )
