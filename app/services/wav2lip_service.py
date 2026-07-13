import subprocess
from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import datetime
import uuid

class Wav2LipService:
    """Wav2Lip服务类,用于生成唇形同步视频。"""

    def __init__(self):
        """初始化Wav2LipService"""
        load_dotenv()
        project_root = Path(os.getenv("PROJECT_ROOT"))
        
        self.base_path = project_root / 'external_modules' / 'wav2lip-onnx-256'
        self.checkpoint_path = self.base_path / 'checkpoints' / 'wav2lip_256.onnx'
        self.conda_env = os.getenv("WAV2LIP_CONDA_ENV")
        self.video_dir = project_root / 'data' / 'video'
        self.video_dir.mkdir(parents=True, exist_ok=True)

    def run_command(self, command):
        """在指定的Conda环境中运行命令。"""
        full_command = f"conda run -n {self.conda_env} {command}"
        subprocess.run(full_command, shell=True, check=True, cwd=str(self.base_path))

    def generate_video(self, face_path, audio_path, output_video_path):
        """
        生成唇形同步视频。

        参数:
        face_path (str): 人脸图像或视频的路径
        audio_path (str): 音频文件的路径
        output_video_path (str): 生成的视频文件的路径

        返回:
        Path: 生成的视频文件的路径
        """
        # 生成唯一的文件名和日期目录
        current_date = datetime.now().strftime("%Y-%m-%d")
        output_dir = self.video_dir / current_date
        output_dir.mkdir(parents=True, exist_ok=True)
        

        command = (f"python inference_onnxModel.py "
                   f"--checkpoint_path {self.checkpoint_path} "
                   f"--face {face_path} "
                   f"--audio {audio_path} "
                   f"--outfile {output_video_path}")
        
        self.run_command(command)
        return output_video_path

if __name__ == "__main__":
    # 使用示例
    wav2lip = Wav2LipService()
    
    face_path = "/path/to/face_image.jpg"
    audio_path = "/path/to/audio.wav"
    unique_id = str(uuid.uuid4())  # 生成唯一标识符
    
    result_video = wav2lip.generate_video(face_path, audio_path, unique_id)
    print(f"生成的视频文件路径: {result_video}")
