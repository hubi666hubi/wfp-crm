from typing import Optional, Any
from ..schemas.response import ApiResponse

def success_response(data: Any = None, message: Optional[str] = None) -> ApiResponse:
    return ApiResponse(code=200, data=data, message=message)

def error_response(code: int = 400, message: str = "操作失败", data: Any = None) -> ApiResponse:
    return ApiResponse(code=code, message=message, data=data)

