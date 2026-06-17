# 青少年作业自律辅助系统 - 数据库设计

## 数据库选型
- PostgreSQL (关系型数据库，支持复杂查询和事务)

## 核心数据表

### 1. 用户表 (users)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    role VARCHAR(20) NOT NULL, -- 'parent' 或 'student'
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);
```

### 2. 家长学生绑定表 (parent_student_bindings)
```sql
CREATE TABLE parent_student_bindings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(50),
    device_type VARCHAR(20), -- 'android_tablet', 'windows', 'display', 'tv'
    lock_screen_password VARCHAR(20),
    max_volume INTEGER DEFAULT 100,
    silent_start_time TIME,
    silent_end_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, student_id)
);
```

### 3. 作业表 (homework)
```sql
CREATE TABLE homework (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    content TEXT,
    category VARCHAR(20) NOT NULL, -- 'school', 'extra', 'recitation', 'wrong_questions', 'reading'
    estimated_duration INTEGER, -- 预计耗时（分钟）
    deadline TIMESTAMP NOT NULL,
    priority VARCHAR(10) NOT NULL, -- 'high', 'medium', 'low'
    status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'overdue', 'paused'
    actual_duration INTEGER, -- 实际完成耗时（分钟）
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    attachment_urls TEXT[], -- 图片、文档附件
    voice_note_url TEXT, -- 语音讲解
    is_template BOOLEAN DEFAULT FALSE,
    template_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. 作业模板表 (homework_templates)
```sql
CREATE TABLE homework_templates (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    content TEXT,
    category VARCHAR(20) NOT NULL,
    estimated_duration INTEGER,
    priority VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. 提醒配置表 (reminder_settings)
```sql
CREATE TABLE reminder_settings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_reminder BOOLEAN DEFAULT TRUE, -- 作业开始提醒
    deadline_warning BOOLEAN DEFAULT TRUE, -- 截止前置预警
    overdue_reminder BOOLEAN DEFAULT TRUE, -- 超时提醒
    auto_second_reminder BOOLEAN DEFAULT FALSE, -- 自动二次提醒
    force_top_on_overdue BOOLEAN DEFAULT FALSE, -- 超时强制置顶
    custom_reminders JSONB, -- 自定义定时提醒 [{"time": "08:00", "type": "wake_up"}, {"time": "21:00", "type": "sleep"}]
    ringtone_type VARCHAR(50) DEFAULT 'default', -- 提醒铃声类型
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. 专注模式配置表 (focus_settings)
```sql
CREATE TABLE focus_settings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    focus_duration INTEGER DEFAULT 25, -- 专注时长（分钟）
    break_duration INTEGER DEFAULT 5, -- 休息时长（分钟）
    force_lock BOOLEAN DEFAULT FALSE, -- 强制锁机模式
    mode VARCHAR(20) DEFAULT 'pomodoro', -- 'pomodoro' 或 'long_session'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. 专注记录表 (focus_sessions)
```sql
CREATE TABLE focus_sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    homework_id INTEGER REFERENCES homework(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    planned_duration INTEGER NOT NULL, -- 计划时长（分钟）
    actual_duration INTEGER, -- 实际时长（分钟）
    is_completed BOOLEAN DEFAULT FALSE,
    is_forced BOOLEAN DEFAULT FALSE, -- 是否家长强制
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. 积分规则表 (point_rules)
```sql
CREATE TABLE point_rules (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rule_type VARCHAR(20) NOT NULL, -- 'add' 或 'deduct'
    rule_name VARCHAR(100) NOT NULL,
    points INTEGER NOT NULL,
    condition VARCHAR(100) NOT NULL, -- 'on_time_complete', 'focus_study', 'overtime', 'exit_focus'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. 积分记录表 (point_records)
```sql
CREATE TABLE point_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rule_id INTEGER REFERENCES point_rules(id) ON DELETE SET NULL,
    homework_id INTEGER REFERENCES homework(id) ON DELETE SET NULL,
    points_change INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10. 奖励配置表 (rewards)
```sql
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'entertainment_time', 'outdoor_activity', 'gift', 'no_extra_homework'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 11. 兑换记录表 (redemption_records)
```sql
CREATE TABLE redemption_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER REFERENCES rewards(id) ON DELETE CASCADE,
    points_cost INTEGER NOT NULL,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'approved', 'rejected'
);
```

### 12. 拼音配置表 (pinyin_settings)
```sql
CREATE TABLE pinyin_settings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    default_enabled BOOLEAN DEFAULT TRUE, -- 默认开启
    filter_common_chars BOOLEAN DEFAULT TRUE, -- 过滤高频简单汉字
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 13. 语音配置表 (voice_settings)
```sql
CREATE TABLE voice_settings (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    auto_play_new_homework BOOLEAN DEFAULT TRUE,
    auto_play_content BOOLEAN DEFAULT TRUE,
    auto_play_reminder BOOLEAN DEFAULT TRUE,
    auto_play_reward BOOLEAN DEFAULT TRUE,
    auto_play_rest BOOLEAN DEFAULT TRUE,
    speech_rate DECIMAL(2,1) DEFAULT 1.0, -- 语速 0.5-2.0
    voice_type VARCHAR(20) DEFAULT 'standard', -- 'child' 或 'standard'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 14. 错题表 (wrong_questions)
```sql
CREATE TABLE wrong_questions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    question_content TEXT,
    question_image_url TEXT,
    answer_content TEXT,
    answer_image_url TEXT,
    difficulty VARCHAR(20), -- 'easy', 'medium', 'hard'
    mastered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 15. 打卡任务表 (checkin_tasks)
```sql
CREATE TABLE checkin_tasks (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    task_type VARCHAR(50) NOT NULL, -- 'reading', 'recitation', 'calligraphy', 'exercise'
    content TEXT,
    target_days INTEGER, -- 目标连续打卡天数
    current_streak INTEGER DEFAULT 0, -- 当前连续打卡天数
    points_per_completion INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 16. 打卡记录表 (checkin_records)
```sql
CREATE TABLE checkin_records (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES checkin_tasks(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_type VARCHAR(20) NOT NULL, -- 'image' 或 'voice'
    submission_url TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' -- 'pending', 'approved', 'rejected'
);
```

### 17. 留言表 (messages)
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL, -- 'text' 或 'voice'
    content TEXT,
    voice_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 18. 系统通知表 (notifications)
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    notification_type VARCHAR(50) NOT NULL, -- 'new_homework', 'reminder', 'warning', 'reward', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    force_top BOOLEAN DEFAULT FALSE, -- 强制置顶
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 19. 作息计划表 (daily_schedules)
```sql
CREATE TABLE daily_schedules (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    schedule_type VARCHAR(20) NOT NULL, -- 'weekday' 或 'weekend'
    schedule_data JSONB NOT NULL, -- [{"time": "07:00", "activity": "wake_up"}, {"time": "08:00", "activity": "study"}]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 20. 勋章表 (badges)
```sql
CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon_url TEXT,
    condition VARCHAR(100) NOT NULL, -- 解锁条件
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 21. 用户勋章表 (user_badges)
```sql
CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);
```

### 22. 学习统计表 (learning_statistics)
```sql
CREATE TABLE learning_statistics (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    total_homework INTEGER DEFAULT 0,
    completed_homework INTEGER DEFAULT 0,
    overdue_homework INTEGER DEFAULT 0,
    average_duration INTEGER, -- 平均完成耗时（分钟）
    total_focus_duration INTEGER DEFAULT 0, -- 总专注时长（分钟）
    subject_distribution JSONB, -- 各学科学习占比 {"chinese": 30, "math": 40, "english": 30}
    points_earned INTEGER DEFAULT 0,
    points_deducted INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, stat_date)
);
```

## 索引设计

```sql
-- 用户表索引
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- 作业表索引
CREATE INDEX idx_homework_parent ON homework(parent_id);
CREATE INDEX idx_homework_student ON homework(student_id);
CREATE INDEX idx_homework_status ON homework(status);
CREATE INDEX idx_homework_deadline ON homework(deadline);
CREATE INDEX idx_homework_priority ON homework(priority);

-- 专注记录表索引
CREATE INDEX idx_focus_sessions_student ON focus_sessions(student_id);
CREATE INDEX idx_focus_sessions_date ON focus_sessions(start_time);

-- 积分记录表索引
CREATE INDEX idx_point_records_student ON point_records(student_id);
CREATE INDEX idx_point_records_created ON point_records(created_at);

-- 通知表索引
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_force_top ON notifications(force_top);

-- 学习统计表索引
CREATE INDEX idx_learning_statistics_student ON learning_statistics(student_id);
CREATE INDEX idx_learning_statistics_date ON learning_statistics(stat_date);
```

## 数据库初始化脚本

将在后续开发中创建完整的初始化SQL脚本。
