-- 创建短视频表 short_videos
CREATE TABLE short_videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,                -- 短视频的标题
    status INTEGER NOT NULL DEFAULT 0,  -- 短视频状态：0表示生成中，1表示已生成，2表示生成失败需要重试
    status_msg TEXT DEFAULT '',   -- 短视频状态信息
    video_url TEXT,                     -- 视频文件的URL或本地存储路径
    video_cover TEXT,                   -- 视频封面文件的URL或本地存储路径
    type INTEGER NOT NULL DEFAULT 0,    -- 视频类型：0表示创作，1表示混剪
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 视频创建时间
    finished_at DATETIME,               -- 视频生成完成时间
    is_deleted BOOLEAN NOT NULL DEFAULT 0, -- 删除标志：0表示未删除，1表示已删除
    short_videos_detail_id INTEGER NOT NULL, -- 视频详情id
    user_id TEXT                        -- 用户ID
);

-- 创建视频列表详情表 short_video_details
CREATE TABLE short_video_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT, -- 用户ID
    video_title TEXT NOT NULL, -- 视频标题
    script_content TEXT, -- 文案内容
    video_duration INTEGER, -- 生成的视频时长(秒)
    video_layout INTEGER NOT NULL, -- 视频布局（1-横屏，2-竖屏）
    video_frame_rate INTEGER NOT NULL, -- 视频帧率（1-25fps,2-30fps,3-50fps,4-60fps）
    resolution INTEGER NOT NULL, -- 分辨率(1-480p,2-720p,3-1080p,4-2k,5-4k)
    export_format INTEGER NOT NULL, -- 导出格式（1-mp4,2-mov）
    digital_human_avatars_type INTEGER DEFAULT 1, -- 数字人形象类型（0远程，1本地）
    digital_human_avatars_download_url TEXT, -- 数字人形象下载地址
    digital_human_avatars_id INTEGER, -- 人物id
    digital_human_avatars_position TEXT DEFAULT '0,0', -- 人物位置
    digital_human_avatars_scale REAL NOT NULL DEFAULT 1, -- 人物缩放比例
    digital_human_avatars_human_id TEXT, -- 远程：human_id
    digital_human_avatars_no_green_cover_image_width INTEGER, --数字人的宽
    digital_human_avatars_no_green_cover_image_height INTEGER, -- 数字人的高


    voice_speed REAL DEFAULT 1, -- 配音语速
    voice_volume REAL DEFAULT 1, -- 配音音量
    voice_id INTEGER, -- 配音声音id
    voice_path TEXT, -- 声音文件路径
    voice_material_type INTEGER DEFAULT 1, -- 声音类型（0远程，1本地）
    voice_download_url TEXT, -- 声音素材下载地址
    voice_preview_url TEXT, -- 声音素材预览地址
    voice_resource_id TEXT, -- 声音素材资源ID
    voice_npy_prompt_text TEXT, -- 远程:npy提示文本
    voice_voice_id TEXT, -- 远端:voice_id

    subtitle_switch INTEGER NOT NULL DEFAULT 0, -- 字幕开关（0-关闭，1-开启）
    font_id INTEGER, -- 字体id
    font_name TEXT, -- 字体名称
    font_size INTEGER NOT NULL DEFAULT 16, -- 字体大小
    font_color TEXT NOT NULL DEFAULT '#000000', -- 字体颜色
    font_position TEXT NOT NULL DEFAULT '0,0', -- 字幕位置
    font_path TEXT, -- 字体文件路径
);

-- 创建数字人声音表 digital_human_voices
CREATE TABLE IF NOT EXISTS digital_human_voices (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `user_id` VARCHAR(100) NOT NULL,         -- 用户ID
    `name` VARCHAR(100) NOT NULL,            -- 声音名称
    `file_path` VARCHAR(255) NOT NULL,       -- 音频文件路径
    `npy_path` VARCHAR(255),                -- npy文件路径
    `npy_prompt_text` VARCHAR(255),         -- npy提示文本
    `type` INTEGER NOT NULL DEFAULT 1,       -- 声音类型：1-个人
    `status` INTEGER NOT NULL DEFAULT 0,     -- 声音状态：0-AI克隆训练中，1-可用，2-失败
    `status_msg` VARCHAR(255) DEFAULT '', -- 状态信息
    `is_deleted` BOOLEAN NOT NULL DEFAULT 0, -- 删除标志
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    `finished_at` DATETIME,                  -- 完成时间
    `voice_id` VARCHAR(255) NOT NULL, -- 声音唯一标识符
    `sample_audio_url` VARCHAR(255)          -- 示例音频URL
);

-- 创建数字人形象表 digital_human_avatars
CREATE TABLE IF NOT EXISTS digital_human_avatars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(100),                   -- 用户ID
    name VARCHAR(100) NOT NULL,            -- 形象名称
    type INTEGER NOT NULL DEFAULT 1,       -- 形象类型
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    finished_at DATETIME,                  -- 完成时间
    status INTEGER NOT NULL DEFAULT 0,     -- 状态
    status_msg VARCHAR(255) DEFAULT '', -- 状态信息
    is_deleted BOOLEAN NOT NULL DEFAULT 0, -- 删除标志
    description TEXT,                      -- 描述
    video_path VARCHAR(255) NOT NULL,      -- 视频路径
    audio_path VARCHAR(255),               -- 音频路径
    audio_prompt_npy_path VARCHAR(255),    -- 音频提示NPY文件路径
    no_green_video_path VARCHAR(255),       -- 去除绿幕后的视频路径
    no_green_cover_image_path VARCHAR(255),-- 去除绿幕后的封面图片路径
    no_green_cover_image_width INTEGER,  -- 去除绿幕后的封面图片宽度
    no_green_cover_image_height INTEGER, -- 去除绿幕后的封面图片高度
    welcome_audio_path VARCHAR(255),       -- 欢迎音频路径
    welcome_video_path VARCHAR(255),       -- 欢迎视频路径
    human_id VARCHAR(255) UNIQUE           -- 人物唯一标识符
);

-- 创建 tasks 表
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    result TEXT,
    status INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE fonts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,  -- UNIQUE 约束在 SQLite 中可以直接在列定义中使用
  nickname TEXT DEFAULT NULL,
  font_path TEXT NOT NULL
);

-- 创建必要的索引
CREATE INDEX idx_short_videos_user_id ON short_videos(user_id);
CREATE INDEX idx_digital_human_voices_user_id ON digital_human_voices(user_id);
CREATE INDEX idx_digital_human_avatars_user_id ON digital_human_avatars(user_id);
CREATE INDEX idx_publishing_plans_user_id ON publishing_plans(user_id);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);



INSERT INTO "digital_human_voices" ("id", "user_id", "name", "file_path", "npy_path", "npy_prompt_text", "type", "status", "status_msg", "is_deleted", "created_at", "finished_at", "voice_id", "sample_audio_url") VALUES (1, 'admin', '稳重男', 'http://127.0.0.1:8000/data/public/voice/2.zip', 'http://127.0.0.1:8000/data/public/voice/2/prompt/audio_prompt.npy', '大家好,欢迎来到我的直播间,非常感谢大家抽出宝贵的时间来和我相聚在这里。今天我们会有非常精彩的内容,要分享给大家。首先,让我来快速介绍一下今天的主题。 今天我们会看到一些非常棒的产品,每一款都是我亲自试用过的,保证质量上成,性价比高。 首先,我们来看看第一款产品,它是一款多功能厨房神器,非常适合忙碌的上班族和喷怨爱好者。', 0, 1, '“', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', '2', 'http://127.0.0.1:8000/data/public/voice/2/welcome/welcome.wav');
INSERT INTO "digital_human_voices" ("id", "user_id", "name", "file_path", "npy_path", "npy_prompt_text", "type", "status", "status_msg", "is_deleted", "created_at", "finished_at", "voice_id", "sample_audio_url") VALUES (2, 'admin', '成熟男', 'http://127.0.0.1:8000/data/public/voice/1.zip', 'http://127.0.0.1:8000/data/public/voice/1/prompt/audio_prompt.npy', '大家好,欢迎来到我的直播间,非常感谢大家抽出宝贵的时间来和我相聚在这里。今天我们会有非常精彩的内容,要分享给大家。首先,让我来快速介绍一下今天的主题。 今天我们会看到一些非常棒的产品,每一款都是我亲自试用过的,保证质量上成,性价比高。 首先,我们来看看第一款产品,它是一款多功能厨房神器,非常适合忙碌的上班族和喷怨爱好者。', 0, 1, '“', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', '1', 'http://127.0.0.1:8000/data/public/voice/1/welcome/welcome.wav');
INSERT INTO "digital_human_voices" ("id", "user_id", "name", "file_path", "npy_path", "npy_prompt_text", "type", "status", "status_msg", "is_deleted", "created_at", "finished_at", "voice_id", "sample_audio_url") VALUES (3, 'admin', '成熟女', 'http://127.0.0.1:8000/data/public/voice/3.zip', 'http://127.0.0.1:8000/data/public/voice/3/prompt/audio_prompt.npy', '大家好,欢迎来到我的直播间,非常感谢大家抽出宝贵的时间来和我相聚在这里。今天我们会有非常精彩的内容,要分享给大家。首先,让我来快速介绍一下今天的主题。 今天我们会看到一些非常棒的产品,每一款都是我亲自试用过的,保证质量上成,性价比高。 首先,我们来看看第一款产品,它是一款多功能厨房神器,非常适合忙碌的上班族和喷怨爱好者。', 0, 1, '“', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', '3', 'http://127.0.0.1:8000/data/public/voice/3/welcome/welcome.wav');
INSERT INTO "digital_human_voices" ("id", "user_id", "name", "file_path", "npy_path", "npy_prompt_text", "type", "status", "status_msg", "is_deleted", "created_at", "finished_at", "voice_id", "sample_audio_url") VALUES (4, 'admin', '开朗女', 'http://127.0.0.1:8000/data/public/voice/4.zip', 'http://127.0.0.1:8000/data/public/voice/4/prompt/audio_prompt.npy', '大家好,欢迎来到我的直播间,非常感谢大家抽出宝贵的时间来和我相聚在这里。今天我们会有非常精彩的内容,要分享给大家。首先,让我来快速介绍一下今天的主题。 今天我们会看到一些非常棒的产品,每一款都是我亲自试用过的,保证质量上成,性价比高。 首先,我们来看看第一款产品,它是一款多功能厨房神器,非常适合忙碌的上班族和喷怨爱好者。', 0, 1, '“', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', '4', 'http://127.0.0.1:8000/data/public/voice/4/welcome/welcome.wav');
INSERT INTO "digital_human_voices" ("id", "user_id", "name", "file_path", "npy_path", "npy_prompt_text", "type", "status", "status_msg", "is_deleted", "created_at", "finished_at", "voice_id", "sample_audio_url") VALUES (5, 'admin', '温柔女', 'http://127.0.0.1:8000/data/public/voice/5.zip', 'http://127.0.0.1:8000/data/public/voice/5/prompt/audio_prompt.npy', '大家好,欢迎来到我的直播间,非常感谢大家抽出宝贵的时间来和我相聚在这里。今天我们会有非常精彩的内容,要分享给大家。首先,让我来快速介绍一下今天的主题。 今天我们会看到一些非常棒的产品,每一款都是我亲自试用过的,保证质量上成,性价比高。 首先,我们来看看第一款产品,它是一款多功能厨房神器,非常适合忙碌的上班族和喷怨爱好者。', 0, 1, '“', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', '5', 'http://127.0.0.1:8000/data/public/voice/5/welcome/welcome.wav');

INSERT INTO "digital_human_avatars" ("id", "name", "type", "created_at", "finished_at", "status", "status_msg", "is_deleted", "description", "video_path", "audio_path", "audio_prompt_npy_path", "welcome_audio_path", "welcome_video_path", "human_id", "user_id", "no_green_video_path", "no_green_cover_image_path", "no_green_cover_image_width", "no_green_cover_image_height") VALUES (1, '车模女', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', 1, '""', 0, NULL, 'http://127.0.0.1:8000/1/1.zip', '1', '1', '1', 'http://127.0.0.1:8000/data/public/avatar/1/welcome/welcome.mp4', '1', 'admin', NULL, 'http://127.0.0.1:8000/data/public/avatar/1/first_frame/first_frame.png', 1080, 1920);
INSERT INTO "digital_human_avatars" ("id", "name", "type", "created_at", "finished_at", "status", "status_msg", "is_deleted", "description", "video_path", "audio_path", "audio_prompt_npy_path", "welcome_audio_path", "welcome_video_path", "human_id", "user_id", "no_green_video_path", "no_green_cover_image_path", "no_green_cover_image_width", "no_green_cover_image_height") VALUES (2, '气质男', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', 1, '""', 0, NULL, 'http://127.0.0.1:8000/2/2.zip', '1', '1', '1', 'http://127.0.0.1:8000/data/public/avatar/2/welcome/welcome.mp4', '2', 'admin', NULL, 'http://127.0.0.1:8000/data/public/avatar/2/first_frame/first_frame.png', 1080, 1920);
INSERT INTO "digital_human_avatars" ("id", "name", "type", "created_at", "finished_at", "status", "status_msg", "is_deleted", "description", "video_path", "audio_path", "audio_prompt_npy_path", "welcome_audio_path", "welcome_video_path", "human_id", "user_id", "no_green_video_path", "no_green_cover_image_path", "no_green_cover_image_width", "no_green_cover_image_height") VALUES (3, '温柔女', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', 1, '""', 0, NULL, 'http://127.0.0.1:8000/3/3.zip', '1', '1', '1', 'http://127.0.0.1:8000/data/public/avatar/3/welcome/welcome.mp4', '2', 'admin', NULL, 'http://127.0.0.1:8000/data/public/avatar/3/first_frame/first_frame.png', 1080, 1920);
INSERT INTO "digital_human_avatars" ("id", "name", "type", "created_at", "finished_at", "status", "status_msg", "is_deleted", "description", "video_path", "audio_path", "audio_prompt_npy_path", "welcome_audio_path", "welcome_video_path", "human_id", "user_id", "no_green_video_path", "no_green_cover_image_path", "no_green_cover_image_width", "no_green_cover_image_height") VALUES (4, '漂亮女', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', 1, '""', 0, NULL, 'http://127.0.0.1:8000/4/4.zip', '1', '1', '1', 'http://127.0.0.1:8000/data/public/avatar/3/welcome/welcome.mp4', '2', 'admin', NULL, 'http://127.0.0.1:8000/data/public/avatar/4/first_frame/first_frame.png', 1080, 1920);
INSERT INTO "digital_human_avatars" ("id", "name", "type", "created_at", "finished_at", "status", "status_msg", "is_deleted", "description", "video_path", "audio_path", "audio_prompt_npy_path", "welcome_audio_path", "welcome_video_path", "human_id", "user_id", "no_green_video_path", "no_green_cover_image_path", "no_green_cover_image_width", "no_green_cover_image_height") VALUES (5, '帅气男', 0, '2024-12-12 12:12:12', '2024-12-12 12:12:12', 1, '""', 0, NULL, 'http://127.0.0.1:8000/5/5.zip', '1', '1', '1', 'http://127.0.0.1:8000/data/public/avatar/3/welcome/welcome.mp4', '2', 'admin', NULL, 'http://127.0.0.1:8000/data/public/avatar/5/first_frame/first_frame.png', 1080, 1920);

INSERT INTO "fonts" ("id", "name", "nickname", "font_path") VALUES (1, 'Alimama DaoLiTi', '隶体', 'http://127.0.0.1:8000/data/public/font/aliliti.ttf');
INSERT INTO "fonts" ("id", "name", "nickname", "font_path") VALUES (2, 'Alimama FangYuanTi VF', '方圆体', 'http://127.0.0.1:8000/data/public/font/aliyuanti.ttf');
INSERT INTO "fonts" ("id", "name", "nickname", "font_path") VALUES (3, '飞波正点体', '正点体', 'http://127.0.0.1:8000/data/public/font/feibozhengdian.otf');
INSERT INTO "fonts" ("id", "name", "nickname", "font_path") VALUES (4, '光良酒\-干杯体', '干杯体', 'http://127.0.0.1:8000/data/public/font/guangliang.ttf');
INSERT INTO "fonts" ("id", "name", "nickname", "font_path") VALUES (5, '礼品卉自由理想体', '自由理想体', 'http://127.0.0.1:8000/data/public/font/1731038013622_lixiangti.ttf');
