import logging
import os
from datetime import datetime

def setup_logger():
    # 创建日志目录
    log_dir = "data/logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # 获取当前日期作为文件名
    current_date = datetime.now().strftime("%Y-%m-%d")
    log_file = os.path.join(log_dir, f"app_{current_date}.log")
    
    # 设置日志格式
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 创建 FileHandler，使用追加模式
    file_handler = logging.FileHandler(
        filename=log_file,
        encoding='utf-8',
        mode='a'  # 追加模式
    )
    file_handler.setFormatter(formatter)
    
    # 创建 StreamHandler 用于控制台输出
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    
    # 配置根日志记录器
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    
    # 清除可能存在的旧处理器
    root_logger.handlers.clear()
    
    # 添加处理器
    root_logger.addHandler(stream_handler)
    root_logger.addHandler(file_handler)
    