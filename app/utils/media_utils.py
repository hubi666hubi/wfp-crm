import os
import shutil
import subprocess
from urllib.parse import urlparse
import uuid
import ffmpeg
import traceback
import logging
import zipfile
from pathlib import Path
import requests


logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36',
}

def get_image_dimensions(image_path):
    """
    使用 ffmpeg-python 获取图片的长度和宽度
    
    :param image_path: 图片文件的路径
    :return: 包含宽度和高度的元组 (width, height)
    """
    try:
        probe = ffmpeg.probe(image_path)
        video_stream = next(
            (stream for stream in probe['streams'] if stream['codec_type'] == 'video'),
            None
        )
        if video_stream is None:
            raise ValueError('没有找到视频流')
        
        width = int(video_stream['width'])
        height = int(video_stream['height'])
        return (width, height)
    except ffmpeg.Error as e:
        logger.error(f"处理文件 {image_path} 时发生 ffmpeg 错误:\n{e.stderr.decode()}")
        logger.error(traceback.format_exc())
        raise
    except Exception as e:
        logger.error(f"处理文件 {image_path} 时发生未知错误:\n{str(e)}")
        logger.error(traceback.format_exc())
        raise

# 下载单个媒体 
def download_media(media_url, save_directory, keep_name=False, file_name=None):
    """
    media_url: 媒体链接
    save_directory: 保存目录
    keep_name: 是否保留原文件名
    file_name: 指定的文件名
    return: 具体文件访问链接
    """
    if not os.path.exists(save_directory):
        os.makedirs(save_directory)

    if file_name is None:
        if keep_name:
            parsed_url = urlparse(media_url)
            file_name = os.path.basename(parsed_url.path)
        else:
            file_name = get_uuid_file_name(media_url)
        
    save_path = os.path.join(save_directory, file_name)

    response = requests.get(media_url, headers=HEADERS, stream=True)
    if response.status_code == 200:
        with open(save_path, 'wb') as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)
        logger.debug(f"Media downloaded successfully: {save_path}")
        return save_path
    else:
        logger.error(f"Failed to download media: {response.status_code}")
        return None

def handle_media_url(media_url, save_directory, keep_name=False, file_name=None):
    """
    判断 media_url 是否以 http 开头，是的话则下载到本地，否则返回原路径。

    :param media_url: 媒体链接或本地路径
    :param save_directory: 保存目录
    :param keep_name: 是否保留原文件名
    :param file_name: 指定的文件名
    :return: 本地文件路径或原路径
    """
    if media_url.startswith("http"):
        # 调用 download_media 下载文件
        save_path = download_media(media_url, save_directory, keep_name, file_name)
        if save_path is None:
            raise RuntimeError(f"下载失败: {media_url}")
        return save_path
    else:
        # 如果不是 HTTP URL，直接返回原路径
        logging.info(f"使用本地文件路径: {media_url}")
        return media_url


# 获取新的文件名
def get_uuid_file_name(url):
    """
    通过路径返回新的文件名
    """
    parsed_url = urlparse(url)
    path = parsed_url.path

    extension = os.path.splitext(path)[1] or '.unknown'
    file_name = f"{uuid.uuid4()}{extension}"
    return file_name


def adjust_audio_volume_and_speed(input_path, output_path, volume=1.0, speed=1.0):
    """
    调整音频的音量和速度
    
    :param input_path: 输入音频文件路径
    :param output_path: 输出音频文件路径
    :param volume: 音量调整倍数，默认为1.0（不变）
    :param speed: 速度调整倍数，默认为1.0（不变）
    """
    try:
        # 构建 FFmpeg 命令
        command = [
            'ffmpeg',
            '-i', input_path,
            '-filter:a', f'volume={volume},atempo={speed}',
            '-y',  # 覆盖输出文件（如果存在）
            output_path
        ]

        # 运行 FFmpeg 命令
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        logger.info(f"音频调整成功。输出文件: {output_path}")
    except Exception as e:
        logger.error(f"调整音频失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise



def calculate_target_dimensions(video_layout, resolution):
    """
    根据视频布局和分辨率计算目标宽高
    
    :param video_layout: 视频布局（1-横屏，2-竖屏）
    :param resolution: 分辨率(1-480p,2-720p,3-1080p,4-2k,5-4k)
    :return: 目标宽度和高度的元组
    """
    resolutions = {
        1: (854, 480),   # 480p
        2: (1280, 720),  # 720p
        3: (1920, 1080), # 1080p
        4: (2560, 1440), # 2K
        5: (3840, 2160)  # 4K
    }
    
    width, height = resolutions.get(resolution, (1920, 1080))  # 默认1080p
    
    if video_layout == 1:  # 横屏
        return width, height
    else:  # 竖屏
        return height, width
    
def get_video_duration(video_path):
    """
    获取视频的播放长度

    :param video_path: 视频文件路径
    :return: 视频长度（秒）
    """
    try:
        probe = ffmpeg.probe(video_path)
        video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        duration = float(video_info['duration'])
        logger.info(f"成功获取视频 {video_path} 的长度: {duration} 秒")
        return duration
    except Exception as e:
        logger.error(f"获取视频 {video_path} 长度时发生错误: {str(e)}")
        raise


def extract_video_frame(video_path, frame_number=1, output_path=None):
    """
    从视频中提取指定帧并保存为图像

    :param video_path: 视频文件路径
    :param frame_number: 要提取的帧数，默认为1（第一帧）
    :param output_path: 输出图像的路径，如果为None，则使用默认路径
    :return: 提取的帧图像的路径
    """
    try:
        if output_path is None:
            output_dir = os.path.dirname(video_path)
            base_name = os.path.splitext(os.path.basename(video_path))[0]
            output_path = os.path.join(output_dir, f"{base_name}_frame_{frame_number}.png")

        # 使用subprocess执行ffmpeg命令
        command = [
            'ffmpeg',
            '-i', video_path,
            '-vf', f'select=gte(n\,{frame_number})',
            '-vframes', '1',
            '-y',
            output_path
        ]
        
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        logger.info(f"成功从视频 {video_path} 提取第 {frame_number} 帧并保存为 {output_path}")
        return output_path
    except subprocess.CalledProcessError as e:
        logger.error(f"从视频 {video_path} 提取第 {frame_number} 帧时发生错误: {e.stderr}")
        raise
    except Exception as e:
        logger.error(f"提取视频帧时发生未知错误: {str(e)}")
        raise

def delete_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"已成功删除文件: {file_path}")
        else:
            logger.info(f"文件不存在: {file_path}")
    except Exception as e:
        logger.error(f"删除文件时发生错误: {str(e)}")

def delete_directory(directory_path):
    """
    删除指定的文件夹及其所有内容。

    :param directory_path: 要删除的文件夹路径
    """
    try:
        if os.path.exists(directory_path):
            shutil.rmtree(directory_path)
            logger.info(f"已成功删除 {directory_path} 目录及其所有内容")
    except Exception as e:
        logger.error(f"删除 {directory_path} 目录时发生错误: {str(e)}")


# 将本地路径转化为线上路径
def convert_path_to_url(file_path):
    """
    根据 channel 配置将本地路径转换为 URL
    
    :param file_path: 本地文件路径
    :return: 转换后的路径
    """
    try:
        from dotenv import load_dotenv
        import os
        load_dotenv()
            
        project_root = os.getenv('PROJECT_ROOT')
        host = os.getenv('LOCAL_HOST')

        # 将 project_root 替换为 host
        if not file_path or not project_root or not host:
            return file_path

        url = file_path.replace(project_root, host)
        url = url.replace('\\', '/')
        return url
        
    except Exception as e:
        logger.error(f"path -> url 转换失败: {str(e)}")
        return file_path
    

# 将线上路径转化为本地路径
def convert_url_to_path(file_url):
    """
    根据 channel 配置将 URL 转换为 本地路径：区分win和linux

    :param file_url: 本地文件路径
    :return: 转换后的路径
    """
    try:
        from dotenv import load_dotenv
        import os
        load_dotenv()

        project_root = os.getenv('PROJECT_ROOT')
        host = os.getenv('LOCAL_HOST')

        # 将 project_root 替换为 host
        if not file_url or not project_root or not host:
            return file_url

        path = file_url.replace(host, project_root)
        return path

    except Exception as e:
        logger.error(f"url -> path 转换失败: {str(e)}")
        return file_url

def download_and_extract(url, download_dir, extract_dir):
    """
    将url文件下载到download_dir,并解压到extract_dir

    :param url: 下载文件的URL
    :param download_dir: 下载文件的保存目录
    :param extract_dir: 解压缩文件的目标目录
    """
    # 确保下载目录存在
    download_dir = Path(download_dir)
    download_dir.mkdir(parents=True, exist_ok=True)

    # 下载文件
    logger.info(f"开始下载文件: {url}")
    downloaded_file = download_media(url, str(download_dir), keep_name=True)

    if not downloaded_file:
        logger.error(f"下载失败: {url}")
        return

    # 解压缩文件
    try:
        with zipfile.ZipFile(downloaded_file, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        logger.info(f"成功解压缩文件到: {extract_dir}")
    except zipfile.BadZipFile:
        logger.error(f"文件不是有效的ZIP文件: {downloaded_file}")
    finally:
        delete_directory(download_dir)
