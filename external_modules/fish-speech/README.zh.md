


---
## 特性

1. **零样本 & 小样本 TTS**：输入 10 到 30 秒的声音样本即可生成高质量的 TTS 输出。**详见 [语音克隆最佳实践指南](https://docs.fish.audio/text-to-speech/voice-clone-best-practices)。**
2. **多语言 & 跨语言支持**：只需复制并粘贴多语言文本到输入框中，无需担心语言问题。目前支持英语、日语、韩语、中文、法语、德语、阿拉伯语和西班牙语。
3. **无音素依赖**：模型具备强大的泛化能力，不依赖音素进行 TTS，能够处理任何文字表示的语言。
4. **高准确率**：在 5 分钟的英文文本上，达到了约 2% 的 CER（字符错误率）和 WER（词错误率）。
5. **快速**：通过 fish-tech 加速，在 Nvidia RTX 4060 笔记本上的实时因子约为 1:5，在 Nvidia RTX 4090 上约为 1:15。
6. **WebUI 推理**：提供易于使用的基于 Gradio 的网页用户界面，兼容 Chrome、Firefox、Edge 等浏览器。
7. **GUI 推理**：提供 PyQt6 图形界面，与 API 服务器无缝协作。支持 Linux、Windows 和 macOS。[查看 GUI](https://github.com/AnyaCoder/fish-speech-gui)。
8. **易于部署**：轻松设置推理服务器，原生支持 Linux、Windows 和 macOS，最大程度减少速度损失。


## 免责声明

我们不对代码库的任何非法使用承担任何责任. 请参阅您当地关于 DMCA (数字千年法案) 和其他相关法律法规.


## 在线 DEMO

[Fish Audio](https://fish.audio)

## 快速开始本地推理

[inference.ipynb](/inference.ipynb)

## 视频

#### 1.4 介绍: https://www.bilibili.com/video/BV1pu46eVEk7

#### 1.2 介绍: https://www.bilibili.com/video/BV1wz421B71D

#### 1.1 介绍: https://www.bilibili.com/video/BV1zJ4m1K7cj

## 文档

- [English](https://speech.fish.audio/)
- [中文](https://speech.fish.audio/zh/)
- [日本語](https://speech.fish.audio/ja/)
- [Portuguese (Brazil)](https://speech.fish.audio/pt/)

## 例子 (2024/10/02 V1.4)

- [English](https://speech.fish.audio/samples/)
- [中文](https://speech.fish.audio/zh/samples/)
- [日本語](https://speech.fish.audio/ja/samples/)
- [Portuguese (Brazil)](https://speech.fish.audio/pt/samples/)

## 鸣谢

- [VITS2 (daniilrobnikov)](https://github.com/daniilrobnikov/vits2)
- [Bert-VITS2](https://github.com/fishaudio/Bert-VITS2)
- [GPT VITS](https://github.com/innnky/gpt-vits)
- [MQTTS](https://github.com/b04901014/MQTTS)
- [GPT Fast](https://github.com/pytorch-labs/gpt-fast)
- [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS)


python tools/vqgan/inference.py -i /Users/libn/Desktop/123.wav --checkpoint-path /Users/libn/dev/project/me/auto_lead_backend/external_modules/fish-speech/checkpoints/fish-speech-1.4/firefly-gan-vq-fsq-8x1024-21hz-generator.pth -o  /Users/libn/Desktop/20241016162915_3e3cc3.npy