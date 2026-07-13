from dotenv import load_dotenv
import boto3
import os
from botocore.config import Config

# 加载 .env 文件
load_dotenv()

# 从环境变量中获取配置
endpoint = os.getenv('OSS_ENDPOINT')
access_key_id = os.getenv('OSS_ACCESS_KEY_ID')
secret_access_key = os.getenv('OSS_SECRET_ACCESS_KEY')
bucket_name = os.getenv('OSS_BUCKET_NAME')

# 打印以验证加载的值（仅用于调试，生产环境中请移除）
print(f"Endpoint: {endpoint}")
print(f"Access Key ID: {access_key_id}")
print(f"Secret Access Key: {secret_access_key}")
print(f"bucket_name: {bucket_name}")

# 创建S3客户端
s3 = boto3.client(
    's3',
    aws_access_key_id=access_key_id,
    aws_secret_access_key=secret_access_key,
    endpoint_url=endpoint,
    config=Config(s3={"addressing_style": "virtual"},
                  signature_version='v4')
)

def generate_presigned_url(object_name, expiration=3600):
    """
    生成用于上传文件的预签名URL。

    :param bucket_name: 存储桶名称
    :param object_name: 对象名称（即文件名）
    :param expiration: URL的有效期（秒），默认为3600秒
    :return: 预签名的URL
    """
    try:
        bucket_name = os.getenv('OSS_BUCKET_NAME')
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={'Bucket': bucket_name, 'Key': object_name},
            ExpiresIn=expiration
        )
        return {
            "oriFileName": object_name,
            "filePath": f"{bucket_name}/{object_name}",
            "preSignUrl": presigned_url
        }

    except Exception as e:
        print(f"生成预签名URL时出错: {e}")
        return None