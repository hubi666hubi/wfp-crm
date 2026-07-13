import logging
import os
import torch
from faster_whisper import WhisperModel
import srt
from datetime import timedelta
from PIL import ImageFont
import re
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO) 


def singleton(cls):
    _instances = {}
    
    def get_instance(*args, **kwargs):
        if cls not in _instances:
            _instances[cls] = cls(*args, **kwargs)
        return _instances[cls]
    
    return get_instance

@singleton
class TranscriptionService:
    def __init__(self, model_size=None):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"
        
        if model_size is None:
            self.model_size = "large-v3" if self.device == "cuda" else "base"
        else:
            self.model_size = model_size
        
        logger.info(f"使用设备: {self.device}, 计算类型: {self.compute_type}, 模型大小: {self.model_size}")
        
        self.model = WhisperModel(self.model_size, device=self.device, compute_type=self.compute_type)
        # self.model = WhisperModel(self.model_size, device="cpu", compute_type="int8")

        logger.info(f"转录服务初始化完成,用模型: {self.model_size}")

    def transcribe(self, audio_file):
        try:
            segments, info = self.model.transcribe(
                audio_file,
                language="zh",
                beam_size=5,
                word_timestamps=True,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
                initial_prompt="以下是普通话的句子。"
            )
            logger.info(f"成功转录 {audio_file}")
            return [{"start": segment.start, "end": segment.end, "text": segment.text} for segment in segments]
        except Exception as e:
            logger.error(f"转录 {audio_file} 时出错: {str(e)}")
            raise

    def transcribe_and_split(self, audio_file, max_chars_per_segment=10, prompt_text=None):
        """
        转录音频并将文本分割成指定长度的片段。

        :param audio_file: 音频文件路径
        :param max_chars_per_segment: 每个片段的最大字符数,默认10个字符
        :param prompt_text: 提示文本
        :return: 包含分割后片段的列表,每个片段包含开始时间、结束时间和文本
        """
        logger.info(f"每个片段的最大字符数: {max_chars_per_segment}")
        initial_prompt = "请使用简体中文转录以下音频内容，要求：\n" \
                         "1. 保持语言表达自然流畅\n" \
                         "2. 去除语气词和重复内容\n" \
                         "3. 保持文意完整性\n" \
                         "4. 避免使用特殊符号\n"
        if prompt_text:
            initial_prompt = initial_prompt + "5. 参考文本如下：\n" + prompt_text

        # 转写音频
        segments, info = self.model.transcribe(
            audio_file,
            language="zh",
            vad_filter=True,
            word_timestamps=True,
            initial_prompt=initial_prompt,
        )
        
        split_segments = []
        last_end_time = 0  # 记录上一个片段的结束时间
        punctuation = ['，', '。', '！', '？', '；', '：', ',', '.', '!', '?', ';', ':', '、']
        
        for segment in segments:
            # 检查是否是重复的时间戳
            # if segment.start < last_end_time:
            #     continue
                
            # 格式化时间戳
            start = f"{int(segment.start // 60):02d}:{segment.start % 60:05.2f}"
            end = f"{int(segment.end // 60):02d}:{segment.end % 60:05.2f}"
            
            # 打印带时间戳的字幕
            print(f"[{start} -> {end}] {segment.text}")
            current_text = ""
            current_words = []
            
            # 处理词级时间戳
            if segment.words:
                for word in segment.words:

                    word_start = f"{int(word.start // 60):02d}:{word.start % 60:05.2f}"
                    word_end = f"{int(word.end // 60):02d}:{word.end % 60:05.2f}"
                    print(f"    {word.word}: [{word_start} -> {word_end}]")
                    # 检查词级时间戳是否在有效范围内
                    if word.start >= last_end_time and word.end <= segment.end:


                        current_text += word.word
                        current_words.append(word)
                        
                        # 检查是否需要分割
                        should_split = False
                        # 1. 检查标点符号
                        if any(p in word.word for p in punctuation):
                            should_split = True
                        # 2. 检查长度限制
                        elif len(current_text) >= max_chars_per_segment:
                            should_split = True
                        # 3. 检查是否是最后一个词
                        elif word == segment.words[-1]:
                            should_split = True
                            
                        if should_split and current_words:
                            # 添加新的片段
                            split_segments.append({
                                "start": current_words[0].start,
                                "end": current_words[-1].end,
                                "text": current_text,
                                "words": self.remove_punctuation(''.join(w.word for w in current_words), punctuation)
                            })
                            
                            # 重置当前文本和词列表
                            current_text = ""
                            current_words = []
            
            # 更新最后的结束时间
            last_end_time = segment.end

        return split_segments



    def transcribe_batch(self, audio_files):
        results = []
        for audio_file in audio_files:
            try:
                result = self.transcribe(audio_file)
                results.append({"file": audio_file, "transcription": result})
            except Exception as e:
                results.append({"file": audio_file, "error": str(e)})
        return results

    def get_model_info(self):
        return {
            "model_size": self.model_size,
            "device": self.device,
            "compute_type": self.compute_type
        }

    def generate_srt_data(self, audio_file):
        try:
            transcription = self.transcribe(audio_file)
            subtitles = []
            for i, segment in enumerate(transcription):
                start = timedelta(seconds=segment['start'])
                end = timedelta(seconds=segment['end'])
                text = segment['text']
                subtitle = srt.Subtitle(index=i+1, start=start, end=end, content=text)
                subtitles.append(subtitle)
            
            logger.info(f"成功生成字幕数据")
            return subtitles
        except Exception as e:
            logger.error(f"生成字幕数据时出错: {str(e)}")
            raise

    def generate_srt_file(self, audio_file, output_file):
        subtitles = self.generate_srt_data(audio_file)
        srt_content = srt.compose(subtitles)
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(srt_content)
        logger.info(f"成功生成字幕文件: {output_file}")
        return output_file
    
    
    def generate_ass_file(self, audio_file, output_file, font_style=None, resolution=None, prompt_text=None):
        try:
            if resolution is None:
                resolution = (1920, 1080)
                
            # 判断视频方向并设置对应的浏览器尺寸
            is_portrait = resolution[0] > resolution[1]
            browser_size = (512, 288) if is_portrait else (162, 288)
            scale_ratio = resolution[1 if is_portrait else 0] / browser_size[1 if is_portrait else 0]

            # 默认字体样式
            default_style = {
                "font_name": "微软雅黑",
                "font_file": None,
                "font_size": 12 * scale_ratio,  # 转换默认字体大小
                "margin_v": 0,  # 默认边距设为0，等待外部传入
                "margin_l": 0,
                "margin_r": 0,
                "alignment": 8,
                "outline": 0,  # 基础描边值
                "shadow": 0,   # 基础阴影值
                "primary_color": "&H00FFFFFF",
                "outline_color": "&H00000000"
            }

            # 更新字体样式
            if font_style:
                # 转换字体大小和边距值
                for key in ['font_size', 'margin_v', 'margin_l', 'margin_r']:
                    if key in font_style:
                        font_style[key] = int(font_style[key] * scale_ratio)
                default_style.update(font_style)
                
            # 验证字体文件
            if not default_style['font_file'] or not os.path.exists(default_style['font_file']):
                raise ValueError("必须提供有效的字体文件路径")
            
            # 计算每行可容纳的最大字符数
            max_chars_per_line = self.calculate_max_chars_per_line(resolution, default_style)
            # 转录
            transcription = self.transcribe_and_split(audio_file, max_chars_per_line, prompt_text)

            # ASS文件头部信息
            ass_header = f"""[Script Info]
                        ScriptType: v4.00+
                        PlayResX: {resolution[1]}
                        PlayResY: {resolution[0]}
                        ScaledBorderAndShadow: yes

                        [V4+ Styles]
                        Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginV, Encoding
                        Style: Default,{default_style['font_name']},{default_style['font_size']},{default_style['primary_color']},&H000000FF,{default_style['outline_color']},&H00000000,0,0,0,0,100,100,0,0,1,{default_style['outline']},{default_style['shadow']},{default_style['alignment']},{default_style['margin_v']},1

                        [Events]
                        Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
                        Comment: 0,0:00:00.00,0:00:00.00,Default,,0,0,0,,{{\fn@{default_style['font_file']}}}
            """
            
            # 生成字幕内容
            ass_events = []
            for segment in transcription:
                
                if math.isclose(segment['start'], segment['end'], rel_tol=1e-9):
                    logger.debug(f"跳过时长为0的片段: start={segment['start']}, end={segment['end']}")
                    continue
                    
                start_time = "{:02d}:{:02d}:{:02d}.{:02d}".format(
                    int(segment['start']) // 3600,
                    (int(segment['start']) % 3600) // 60,
                    int(segment['start']) % 60,
                    int((segment['start'] % 1) * 100)
                )
                end_time = "{:02d}:{:02d}:{:02d}.{:02d}".format(
                    int(segment['end']) // 3600,
                    (int(segment['end']) % 3600) // 60,
                    int(segment['end']) % 60,
                    int((segment['end'] % 1) * 100)
                )
                
                event_line = f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{segment['words']}"
                ass_events.append(event_line)
            
            # 写入文件
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(ass_header)
                f.write('\n'.join(ass_events))
                
            logger.info(f"成功生成ASS字幕文件: {output_file}")
            return output_file
            
        except Exception as e:
            logger.error(f"生成ASS字幕文件时出错: {str(e)}")
            raise


    def generate_ass_from_text(self, text, video_length, output_file, font_style=None, resolution=None):
        try:
            if resolution is None:
                resolution = (1920, 1080)

            # 判断视频方向并设置对应的浏览器尺寸
            is_portrait = resolution[0] > resolution[1]
            browser_size = (512, 288) if is_portrait else (162, 288)
            scale_ratio = resolution[1 if is_portrait else 0] / browser_size[1 if is_portrait else 0]

            # 将文案分割成段落
            segments = text.split('\n')
            segment_length = video_length / len(segments)  # 计算每段的持续时间
            
            # 默认字体样式
            default_style = {
                "font_name": "微软雅黑",
                "font_file": None,
                "font_size": 12 * scale_ratio,  # 转换默认字体大小
                "margin_v": 0,  # 默认边距设为0，等待外部传入
                "margin_l": 0,
                "margin_r": 0,
                "alignment": 8,
                "outline": 0,  # 基础描边值
                "shadow": 0,   # 基础阴影值
                "primary_color": "&H00FFFFFF",
                "outline_color": "&H00000000"
            }
            # 更新字体样式
            if font_style:
                for key in ['font_size', 'margin_v', 'margin_l', 'margin_r']:
                    if key in font_style:
                        font_style[key] = int(font_style[key] * scale_ratio)  # 转换字体大小和边距值
                default_style.update(font_style)

            # ASS文件头部信息
            ass_header = f"""[Script Info]
                        ScriptType: v4.00+
                        PlayResX: {resolution[1]}
                        PlayResY: {resolution[0]}
                        ScaledBorderAndShadow: yes

                        [V4+ Styles]
                        Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
                        Style: Default,{default_style['font_name']},{default_style['font_size']},{default_style['primary_color']},&H000000FF,{default_style['outline_color']},&H00000000,0,0,0,0,100,100,0,0,1,{default_style['outline']},{default_style['shadow']},{default_style['alignment']},{default_style['margin_l']},{default_style['margin_r']},{default_style['margin_v']},1

                        [Events]
                        Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
                        Comment: 0,0:00:00.00,0:00:00.00,Default,,0,0,0,,{{\fn@{default_style['font_file']}}}
            """
            
            # 生成字幕内容
            ass_events = []
            for i, segment in enumerate(segments):
                start_time = i * segment_length
                end_time = (i + 1) * segment_length
                
                start_str = "{:02d}:{:02d}:{:02d}.{:02d}".format(
                    int(start_time) // 3600,
                    (int(start_time) % 3600) // 60,
                    int(start_time) % 60,
                    int((start_time % 1) * 100)
                )
                end_str = "{:02d}:{:02d}:{:02d}.{:02d}".format(
                    int(end_time) // 3600,
                    (int(end_time) % 3600) // 60,
                    int(end_time) % 60,
                    int((end_time % 1) * 100)
                )
                
                event_line = f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{segment}"
                ass_events.append(event_line)
            
            # 写入文件
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(ass_header)
                f.write('\n'.join(ass_events))
                
            logger.info(f"成功生成ASS字幕文件: {output_file}")
            return output_file
            
        except Exception as e:
            logger.error(f"生成ASS字幕文件时出错: {str(e)}")
            raise


    def calculate_max_chars_per_line(self, resolution, default_style):
        """
        计算每行可容纳的最大字符数。

        :param font_file: 字体文件路径
        :param font_size: 字体大小
        :param resolution: 屏幕分辨率 (高, 宽)
        :param margin_l: 左边距
        :param margin_r: 右边距
        :return: 每行可容纳的最大字符数
        """
        font_file = default_style['font_file']
        font_size = default_style['font_size']
        margin_l = default_style['margin_l']
        margin_r = default_style['margin_r']
        max_width = resolution[1] - margin_r - margin_l
        logger.info(f"字体展示宽度: {max_width}")
        try:
            font = ImageFont.truetype(font_file, font_size)
            char_width = font.getbbox('好')[2]  # 使用 getbbox 获取字符宽度
            logger.info(f"字体宽度: {char_width}")
            if char_width == 0:
                raise ValueError("字体宽度计算失败")
            return max_width // char_width
        except Exception as e:
            logger.error(f"字体加载或计算失败: {str(e)}")
            raise


    def generate_ass_file_h5(self, audio_file, output_file, font_style=None, resolution=None, margin_x=0, margin_y=0):
        try:
            transcription = self.transcribe(audio_file)
            
            if resolution is None:
                resolution = (1920, 1080)
                
            # 判断视频方向并设置对应的浏览器尺寸
            is_portrait = resolution[0] > resolution[1]
            browser_size = (320, 180) if is_portrait else (180, 320)
            scale_ratio = resolution[1 if is_portrait else 0] / browser_size[1 if is_portrait else 0]

            # 默认字体样式
            default_style = {
                "font_name": "微软雅黑",
                "font_file": None,
                "font_size": 12 * scale_ratio,  # 转换默认字体大小
                "margin_v": 0,  # 默认边距设为0，等待外部传入
                "margin_l": 0,
                "margin_r": 0,
                "alignment": 8,
                "outline": 0,  # 基础描边值
                "shadow": 0,   # 基础阴影值
                "primary_color": "&H00FFFFFF",
                "outline_color": "&H00000000"
            }
            # 更新字体样式
            if font_style:
                # 转换字体大小和边距值
                for key in ['font_size', 'margin_v', 'margin_l', 'margin_r']:
                    if key in font_style:
                        font_style[key] = int(font_style[key] * scale_ratio)
                default_style.update(font_style)
            
            default_style['margin_l'] = default_style['margin_l'] + margin_x
            default_style['margin_r'] = default_style['margin_r'] + margin_x
            default_style['margin_v'] = default_style['margin_v'] - margin_y


                
            # 验证字体文件
            if not default_style['font_file'] or not os.path.exists(default_style['font_file']):
                raise ValueError("必须提供有效的字体文件路径")

            # 计算每行可容纳的最大字符数
            max_chars_per_line = self.calculate_max_chars_per_line(resolution, default_style)
            # 转录
            transcription = self.transcribe_and_split(audio_file, max_chars_per_line)

            # ASS文件头部信息
            ass_header = f"""[Script Info]
                        ScriptType: v4.00+
                        PlayResX: {resolution[1]}
                        PlayResY: {resolution[0]}
                        ScaledBorderAndShadow: yes

                        [V4+ Styles]
                        Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginV, Encoding
                        Style: Default,{default_style['font_name']},{default_style['font_size']},{default_style['primary_color']},&H000000FF,{default_style['outline_color']},&H00000000,0,0,0,0,100,100,0,0,1,{default_style['outline']},{default_style['shadow']},{default_style['alignment']},{default_style['margin_v']},1

                        [Events]
                        Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
                        Comment: 0,0:00:00.00,0:00:00.00,Default,,0,0,0,,{{\fn@{default_style['font_file']}}}
            """

            # 生成字幕内容
            ass_events = []
            for segment in transcription:
                start_time = "{:02d}:{:02d}:{:02d}.{:02d}".format(
                    int(segment['start']) // 3600,
                    (int(segment['start']) % 3600) // 60,
                    int(segment['start']) % 60,
                    int((segment['start'] % 1) * 100)
                )
                end_time = "{:02d}:{:02d}:{:02d}.{:02d}".format(
                    int(segment['end']) // 3600,
                    (int(segment['end']) % 3600) // 60,
                    int(segment['end']) % 60,
                    int((segment['end'] % 1) * 100)
                )
                
                event_line = f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{segment['text']}"
                ass_events.append(event_line)
            
            # 写入文件
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(ass_header)
                f.write('\n'.join(ass_events))
                
            logger.info(f"成功生成ASS字幕文件: {output_file}")
            return output_file
            
        except Exception as e:
            logger.error(f"生成ASS字幕文件时出错: {str(e)}")
            raise
    # 定义一个函数来移除标点符号
    def remove_punctuation(self, text, punctuation_list):
        """
        移除文本中的标点符号
        :param text: 要处理的文本
        :param punctuation_list: 标点符号列表
        :return: 处理后的文本
        """
        for p in punctuation_list:
            text = text.replace(p, '')
        return text