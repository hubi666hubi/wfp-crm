import subprocess
from pathlib import Path
import datetime
import uuid
import os
from dotenv import load_dotenv
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class FishSpeechService:
    """FishSpeech服务类,用于语音克隆和生成。"""

    def __init__(self):
        """初始化FishSpeechService"""
        load_dotenv()
        project_root = Path(os.getenv("PROJECT_ROOT"))
        
        self.base_path = project_root / 'external_modules' / 'fish-speech'
        self.checkpoint_path = self.base_path / 'checkpoints' / 'fish-speech-1.4'
        self.vqgan_path = self.checkpoint_path / 'firefly-gan-vq-fsq-8x1024-21hz-generator.pth'
        self.conda_env = os.getenv("FISH_SPEECH_CONDA_ENV")

    def run_command(self, command):
        """在指定的Conda环境中运行命令。"""
        full_command = f"conda run -n {self.conda_env} {command}"
        logger.debug(f"fishspeech: 执行命令: {command}")
        subprocess.run(full_command, shell=True, check=True, cwd=str(self.base_path))

    def clone_voice(self, audio_path, audio_prompt_wav_path):
        """
        克隆声音。

        参数:
        audio_path (str): 参考音频文件的路径
        output_path (str): 克隆npy的路径

        返回:
        str: 克隆声音的唯一标识符
        """
        command = f"python tools/vqgan/inference.py -i {audio_path} --checkpoint-path {self.vqgan_path} -o {audio_prompt_wav_path}"
        logger.debug(f"fishspeech: 执行命令: {command}")
        self.run_command(command)
        return audio_prompt_wav_path

    def generate_speech(self, text, prompt_text, prompt_npy_path, output_npy_path, output_wav_path):
        """
        生成语音。

        参数:
        text (str): 要转换为语音的文本
        prompt_npy_path (str): 语意prompt_npy的路径
        output_npy_path (str): 输出的npy文件路径
        output_wav_path (str): 输出的wav文件路径

        返回:
        tuple: 生成的npy文件路径和wav文件路径
        """
        # 生成语音特征
        self.run_command(f"python tools/llama/generate.py --text \"{text}\" --prompt-text \"{prompt_text}\"  --prompt-tokens {prompt_npy_path} "
                         f"--checkpoint-path {self.checkpoint_path} --num-samples 1 ")
        
        # 将特征转换为音频
        self.run_command(f"python tools/vqgan/inference.py -i codes_0.npy --checkpoint-path {self.vqgan_path} -o {output_wav_path}")
        return output_npy_path, output_wav_path

    def process_audio(self, avatar_path, wav_output_path):
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
            raise
        return wav_output_path

if __name__ == "__main__":
    # 使用示例
    fish_speech = FishSpeechService()
    
    unique_id = fish_speech.clone_voice("/path/to/reference_audio.wav", "unique_voice_id")
    output_audio = fish_speech.generate_speech("这是一测试文本", unique_id)
    print(f"生成的音频文件路径: {output_audio}")
