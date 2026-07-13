import subprocess


def check_gpu_available():
    """检查是否有可用的 NVIDIA GPU"""
    # try:
    #     result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
    #     return result.returncode == 0
    # except FileNotFoundError:
    return False