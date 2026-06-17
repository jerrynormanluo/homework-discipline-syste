-- 青少年作业自律辅助系统 - 数据库初始化脚本

-- 创建数据库
-- CREATE DATABASE homework_discipline;

-- 连接到数据库
-- \c homework_discipline;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    role VARCHAR(20) NOT NULL CHECK (role IN ('parent', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- 家长学生绑定表
CREATE TABLE IF NOT EXISTS parent_student_bindings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(50),
    device_type VARCHAR(20) CHECK (device_type IN ('android_tablet', 'windows', 'display', 'tv')),
    lock_screen_password VARCHAR(20),
    max_volume INTEGER DEFAULT 100,
    silent_start_time TIME,
    silent_end_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, student_id)
);

-- 作业表
CREATE TABLE IF NOT EXISTS homework (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    content TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('school', 'extra', 'recitation', 'wrong_questions', 'reading')),
    estimated_duration INTEGER,
    deadline TIMESTAMP NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue', 'paused')),
    actual_duration INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    attachment_urls TEXT[],
    voice_note_url TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    template_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 作业模板表
CREATE TABLE IF NOT EXISTS homework_templates (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    content TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('school', 'extra', 'recitation', 'wrong_questions', 'reading')),
    estimated_duration INTEGER,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 提醒配置表
CREATE TABLE IF NOT EXISTS reminder_settings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_reminder BOOLEAN DEFAULT TRUE,
    deadline_warning BOOLEAN DEFAULT TRUE,
    overdue_reminder BOOLEAN DEFAULT TRUE,
    auto_second_reminder BOOLEAN DEFAULT FALSE,
    force_top_on_overdue BOOLEAN DEFAULT FALSE,
    custom_reminders JSONB,
    ringtone_type VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 专注模式配置表
CREATE TABLE IF NOT EXISTS focus_settings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    focus_duration INTEGER DEFAULT 25,
    break_duration INTEGER DEFAULT 5,
    force_lock BOOLEAN DEFAULT FALSE,
    mode VARCHAR(20) DEFAULT 'pomodoro' CHECK (mode IN ('pomodoro', 'long_session')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 专注记录表
CREATE TABLE IF NOT EXISTS focus_sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    homework_id INTEGER REFERENCES homework(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    planned_duration INTEGER NOT NULL,
    actual_duration INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    is_forced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 积分规则表
CREATE TABLE IF NOT EXISTS point_rules (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('add', 'deduct')),
    rule_name VARCHAR(100) NOT NULL,
    points INTEGER NOT NULL,
    condition VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 积分记录表
CREATE TABLE IF NOT EXISTS point_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rule_id INTEGER REFERENCES point_rules(id) ON DELETE SET NULL,
    homework_id INTEGER REFERENCES homework(id) ON DELETE SET NULL,
    points_change INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 奖励配置表
CREATE TABLE IF NOT EXISTS rewards (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('entertainment_time', 'outdoor_activity', 'gift', 'no_extra_homework')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 兑换记录表
CREATE TABLE IF NOT EXISTS redemption_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER REFERENCES rewards(id) ON DELETE CASCADE,
    points_cost INTEGER NOT NULL,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 拼音配置表
CREATE TABLE IF NOT EXISTS pinyin_settings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    default_enabled BOOLEAN DEFAULT TRUE,
    filter_common_chars BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 语音配置表
CREATE TABLE IF NOT EXISTS voice_settings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    auto_play_new_homework BOOLEAN DEFAULT TRUE,
    auto_play_content BOOLEAN DEFAULT TRUE,
    auto_play_reminder BOOLEAN DEFAULT TRUE,
    auto_play_reward BOOLEAN DEFAULT TRUE,
    auto_play_rest BOOLEAN DEFAULT TRUE,
    speech_rate DECIMAL(2,1) DEFAULT 1.0,
    voice_type VARCHAR(20) DEFAULT 'standard' CHECK (voice_type IN ('child', 'standard')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 错题表
CREATE TABLE IF NOT EXISTS wrong_questions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    question_content TEXT,
    question_image_url TEXT,
    answer_content TEXT,
    answer_image_url TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    mastered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 打卡任务表
CREATE TABLE IF NOT EXISTS checkin_tasks (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('reading', 'recitation', 'calligraphy', 'exercise')),
    content TEXT,
    target_days INTEGER,
    current_streak INTEGER DEFAULT 0,
    points_per_completion INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 打卡记录表
CREATE TABLE IF NOT EXISTS checkin_records (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES checkin_tasks(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('image', 'voice')),
    submission_url TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 留言表
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('text', 'voice')),
    content TEXT,
    voice_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统通知表
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    force_top BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 作息计划表
CREATE TABLE IF NOT EXISTS daily_schedules (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('weekday', 'weekend')),
    schedule_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 勋章表
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon_url TEXT,
    condition VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户勋章表
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- 学习统计表
CREATE TABLE IF NOT EXISTS learning_statistics (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    total_homework INTEGER DEFAULT 0,
    completed_homework INTEGER DEFAULT 0,
    overdue_homework INTEGER DEFAULT 0,
    average_duration INTEGER,
    total_focus_duration INTEGER DEFAULT 0,
    subject_distribution JSONB,
    points_earned INTEGER DEFAULT 0,
    points_deducted INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, stat_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_homework_parent ON homework(parent_id);
CREATE INDEX IF NOT EXISTS idx_homework_student ON homework(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_status ON homework(status);
CREATE INDEX IF NOT EXISTS idx_homework_deadline ON homework(deadline);
CREATE INDEX IF NOT EXISTS idx_homework_priority ON homework(priority);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_student ON focus_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_date ON focus_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_point_records_student ON point_records(student_id);
CREATE INDEX IF NOT EXISTS idx_point_records_created ON point_records(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_force_top ON notifications(force_top);
CREATE INDEX IF NOT EXISTS idx_learning_statistics_student ON learning_statistics(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_statistics_date ON learning_statistics(stat_date);

-- 插入默认勋章数据
INSERT INTO badges (name, description, icon_url, condition) VALUES
('按时达人', '连续7天按时完成作业', '', 'on_time_7_days'),
('专注之星', '累计专注时长达到100小时', '', 'focus_100_hours'),
('全能学霸', '所有学科作业完成率达到90%', '', 'all_subjects_90_percent'),
('坚持不懈', '连续打卡30天', '', 'checkin_30_days'),
('错题克星', '掌握100道错题', '', 'master_100_wrong_questions')
ON CONFLICT DO NOTHING;
