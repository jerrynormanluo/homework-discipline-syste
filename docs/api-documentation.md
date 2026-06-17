# 青少年作业自律辅助系统 - API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api` (开发环境)
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证接口

### 用户注册

**POST** `/auth/register`

**请求参数**:
```json
{
  "phone": "13800138000",
  "password": "123456",
  "role": "parent",
  "nickname": "张三"
}
```

**响应示例**:
```json
{
  "message": "注册成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "phone": "13800138000",
    "nickname": "张三",
    "role": "parent"
  }
}
```

### 用户登录

**POST** `/auth/login`

**请求参数**:
```json
{
  "phone": "13800138000",
  "password": "123456"
}
```

**响应示例**:
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "phone": "13800138000",
    "nickname": "张三",
    "role": "parent",
    "avatar_url": null
  }
}
```

### 获取当前用户信息

**GET** `/auth/me`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "user": {
    "id": 1,
    "phone": "13800138000",
    "nickname": "张三",
    "role": "parent",
    "avatar_url": null,
    "created_at": "2024-06-16T00:00:00.000Z"
  }
}
```

## 用户管理接口

### 绑定学生设备

**POST** `/users/bind-student`

**权限**: 家长

**请求参数**:
```json
{
  "student_phone": "13900139000",
  "device_name": "小明平板",
  "device_type": "android_tablet",
  "lock_screen_password": "1234",
  "max_volume": 80
}
```

**响应示例**:
```json
{
  "message": "绑定成功"
}
```

### 获取绑定的学生列表

**GET** `/users/my-students`

**权限**: 家长

**响应示例**:
```json
{
  "students": [
    {
      "id": 1,
      "student_id": 2,
      "device_name": "小明平板",
      "device_type": "android_tablet",
      "nickname": "小明",
      "phone": "13900139000"
    }
  ]
}
```

### 更新学生设备配置

**PUT** `/users/device-settings/:student_id`

**权限**: 家长

**请求参数**:
```json
{
  "lock_screen_password": "5678",
  "max_volume": 60,
  "silent_start_time": "22:00",
  "silent_end_time": "08:00"
}
```

**响应示例**:
```json
{
  "message": "配置更新成功"
}
```

### 解绑学生

**DELETE** `/users/unbind-student/:student_id`

**权限**: 家长

**响应示例**:
```json
{
  "message": "解绑成功"
}
```

## 作业管理接口

### 创建作业

**POST** `/homework`

**权限**: 家长

**请求参数**:
```json
{
  "student_id": 2,
  "title": "数学练习册第5页",
  "subject": "数学",
  "content": "完成练习册第5页的所有题目",
  "category": "school",
  "estimated_duration": 30,
  "deadline": "2024-06-17T18:00:00.000Z",
  "priority": "high",
  "attachment_urls": ["http://example.com/file1.pdf"],
  "voice_note_url": "http://example.com/voice.mp3"
}
```

**响应示例**:
```json
{
  "message": "作业创建成功",
  "homework": {
    "id": 1,
    "title": "数学练习册第5页",
    "subject": "数学",
    "status": "not_started",
    "created_at": "2024-06-16T00:00:00.000Z"
  }
}
```

### 批量创建作业

**POST** `/homework/batch`

**权限**: 家长

**请求参数**:
```json
{
  "homeworks": [
    {
      "student_id": 2,
      "title": "语文课文朗读",
      "subject": "语文",
      "content": "朗读第3课课文",
      "category": "recitation",
      "estimated_duration": 15,
      "deadline": "2024-06-17T20:00:00.000Z",
      "priority": "medium"
    }
  ]
}
```

### 获取作业列表

**GET** `/homework`

**权限**: 家长/学生

**查询参数**:
- `student_id`: 学生ID（可选）
- `status`: 作业状态（可选）
- `category`: 作业分类（可选）
- `date`: 日期（可选）

**响应示例**:
```json
{
  "homeworks": [
    {
      "id": 1,
      "title": "数学练习册第5页",
      "subject": "数学",
      "status": "not_started",
      "priority": "high",
      "deadline": "2024-06-17T18:00:00.000Z"
    }
  ]
}
```

### 获取作业详情

**GET** `/homework/:id`

**权限**: 家长/学生

**响应示例**:
```json
{
  "homework": {
    "id": 1,
    "title": "数学练习册第5页",
    "subject": "数学",
    "content": "完成练习册第5页的所有题目",
    "category": "school",
    "estimated_duration": 30,
    "deadline": "2024-06-17T18:00:00.000Z",
    "priority": "high",
    "status": "not_started",
    "attachment_urls": ["http://example.com/file1.pdf"],
    "voice_note_url": "http://example.com/voice.mp3"
  }
}
```

### 更新作业

**PUT** `/homework/:id`

**权限**: 家长

**请求参数**:
```json
{
  "title": "数学练习册第5-6页",
  "deadline": "2024-06-17T20:00:00.000Z"
}
```

### 学生更新作业状态

**PATCH** `/homework/:id/status`

**权限**: 学生

**请求参数**:
```json
{
  "status": "in_progress"
}
```

**响应示例**:
```json
{
  "message": "状态更新成功",
  "homework": {
    "id": 1,
    "status": "in_progress",
    "started_at": "2024-06-16T10:00:00.000Z"
  }
}
```

### 删除作业

**DELETE** `/homework/:id`

**权限**: 家长

**响应示例**:
```json
{
  "message": "删除成功"
}
```

### 清空已完成作业

**DELETE** `/homework/completed/clear`

**权限**: 家长

**查询参数**:
- `student_id`: 学生ID

**响应示例**:
```json
{
  "message": "清空成功"
}
```

### 保存作业模板

**POST** `/homework/templates`

**权限**: 家长

**请求参数**:
```json
{
  "name": "数学日常作业",
  "title": "数学练习册",
  "subject": "数学",
  "content": "完成练习册指定页码",
  "category": "school",
  "estimated_duration": 30,
  "priority": "medium"
}
```

### 获取作业模板

**GET** `/homework/templates`

**权限**: 家长

**响应示例**:
```json
{
  "templates": [
    {
      "id": 1,
      "name": "数学日常作业",
      "title": "数学练习册",
      "subject": "数学"
    }
  ]
}
```

## 专注模式接口

### 获取专注配置

**GET** `/focus/settings/:student_id`

**权限**: 家长

**响应示例**:
```json
{
  "settings": {
    "id": 1,
    "focus_duration": 25,
    "break_duration": 5,
    "force_lock": false,
    "mode": "pomodoro"
  }
}
```

### 更新专注配置

**PUT** `/focus/settings/:student_id`

**权限**: 家长

**请求参数**:
```json
{
  "focus_duration": 30,
  "break_duration": 10,
  "force_lock": true,
  "mode": "pomodoro"
}
```

### 学生开始专注

**POST** `/focus/sessions`

**权限**: 学生

**请求参数**:
```json
{
  "homework_id": 1,
  "planned_duration": 25
}
```

**响应示例**:
```json
{
  "message": "专注开始",
  "session": {
    "id": 1,
    "start_time": "2024-06-16T10:00:00.000Z",
    "planned_duration": 25,
    "is_forced": false
  }
}
```

### 家长强制专注

**POST** `/focus/sessions/force`

**权限**: 家长

**请求参数**:
```json
{
  "student_id": 2,
  "homework_id": 1,
  "planned_duration": 30
}
```

### 结束专注

**PUT** `/focus/sessions/:id/end`

**权限**: 学生

**响应示例**:
```json
{
  "message": "专注结束",
  "session": {
    "id": 1,
    "end_time": "2024-06-16T10:25:00.000Z",
    "actual_duration": 25,
    "is_completed": true
  }
}
```

### 获取专注记录

**GET** `/focus/sessions`

**权限**: 家长/学生

**查询参数**:
- `date`: 日期（可选）
- `limit`: 数量限制（可选）

**响应示例**:
```json
{
  "sessions": [
    {
      "id": 1,
      "start_time": "2024-06-16T10:00:00.000Z",
      "planned_duration": 25,
      "actual_duration": 25,
      "is_completed": true
    }
  ]
}
```

### 获取今日专注统计

**GET** `/focus/statistics/today`

**权限**: 学生

**响应示例**:
```json
{
  "statistics": {
    "session_count": 3,
    "total_duration": 75,
    "completed_count": 3
  }
}
```

## 积分管理接口

### 获取积分余额

**GET** `/points/balance/:student_id`

**权限**: 家长/学生

**响应示例**:
```json
{
  "balance": 150
}
```

### 获取积分记录

**GET** `/points/records/:student_id`

**权限**: 家长/学生

**查询参数**:
- `limit`: 数量限制（可选）

**响应示例**:
```json
{
  "records": [
    {
      "id": 1,
      "points_change": 10,
      "balance_after": 150,
      "reason": "按时完成作业",
      "created_at": "2024-06-16T10:00:00.000Z"
    }
  ]
}
```

### 手动操作积分

**POST** `/points/manual`

**权限**: 家长

**请求参数**:
```json
{
  "student_id": 2,
  "points": 20,
  "reason": "额外奖励",
  "homework_id": 1
}
```

### 创建积分规则

**POST** `/points/rules`

**权限**: 家长

**请求参数**:
```json
{
  "student_id": 2,
  "rule_type": "add",
  "rule_name": "按时完成",
  "points": 10,
  "condition": "on_time_complete"
}
```

### 获取积分规则

**GET** `/points/rules/:student_id`

**权限**: 家长

**响应示例**:
```json
{
  "rules": [
    {
      "id": 1,
      "rule_type": "add",
      "rule_name": "按时完成",
      "points": 10,
      "condition": "on_time_complete"
    }
  ]
}
```

### 创建奖励

**POST** `/points/rewards`

**权限**: 家长

**请求参数**:
```json
{
  "student_id": 2,
  "name": "游戏时间",
  "description": "1小时游戏时间",
  "points_required": 100,
  "reward_type": "entertainment_time"
}
```

### 获取奖励列表

**GET** `/points/rewards/:student_id`

**权限**: 家长/学生

**响应示例**:
```json
{
  "rewards": [
    {
      "id": 1,
      "name": "游戏时间",
      "description": "1小时游戏时间",
      "points_required": 100,
      "reward_type": "entertainment_time",
      "is_active": true
    }
  ]
}
```

### 兑换奖励

**POST** `/points/redeem`

**权限**: 学生

**请求参数**:
```json
{
  "reward_id": 1
}
```

**响应示例**:
```json
{
  "message": "兑换申请已提交，等待家长审核",
  "redemption": {
    "id": 1,
    "points_cost": 100,
    "status": "pending"
  }
}
```

### 审核兑换申请

**PUT** `/points/redeem/:id/approve`

**权限**: 家长

**请求参数**:
```json
{
  "status": "approved"
}
```

## 提醒配置接口

### 获取提醒配置

**GET** `/reminders/settings/:student_id`

**权限**: 家长

**响应示例**:
```json
{
  "settings": {
    "id": 1,
    "start_reminder": true,
    "deadline_warning": true,
    "overdue_reminder": true,
    "auto_second_reminder": false,
    "force_top_on_overdue": false,
    "ringtone_type": "default"
  }
}
```

### 更新提醒配置

**PUT** `/reminders/settings/:student_id`

**权限**: 家长

**请求参数**:
```json
{
  "start_reminder": true,
  "deadline_warning": true,
  "overdue_reminder": true,
  "auto_second_reminder": true,
  "force_top_on_overdue": true,
  "ringtone_type": "custom"
}
```

## 系统设置接口

### 获取拼音配置

**GET** `/settings/pinyin/:student_id`

**权限**: 家长

**响应示例**:
```json
{
  "settings": {
    "id": 1,
    "default_enabled": true,
    "filter_common_chars": true
  }
}
```

### 更新拼音配置

**PUT** `/settings/pinyin/:student_id`

**权限**: 家长

**请求参数**:
```json
{
  "default_enabled": true,
  "filter_common_chars": false
}
```

### 获取语音配置

**GET** `/settings/voice/:student_id`

**权限**: 家长

**响应示例**:
```json
{
  "settings": {
    "id": 1,
    "auto_play_new_homework": true,
    "auto_play_content": true,
    "auto_play_reminder": true,
    "speech_rate": 1.0,
    "voice_type": "standard"
  }
}
```

### 更新语音配置

**PUT** `/settings/voice/:student_id`

**权限**: 家长

**请求参数**:
```json
{
  "auto_play_new_homework": false,
  "auto_play_content": true,
  "speech_rate": 1.2,
  "voice_type": "child"
}
```

## 消息接口

### 发送消息

**POST** `/messages`

**权限**: 家长/学生

**请求参数**:
```json
{
  "receiver_id": 2,
  "message_type": "text",
  "content": "今天表现不错，继续加油！"
}
```

### 获取消息列表

**GET** `/messages`

**权限**: 家长/学生

**查询参数**:
- `limit`: 数量限制（可选）

**响应示例**:
```json
{
  "messages": [
    {
      "id": 1,
      "sender_id": 1,
      "receiver_id": 2,
      "message_type": "text",
      "content": "今天表现不错，继续加油！",
      "is_read": false,
      "created_at": "2024-06-16T10:00:00.000Z"
    }
  ]
}
```

### 标记消息为已读

**PUT** `/messages/:id/read`

**权限**: 家长/学生

### 获取未读消息数量

**GET** `/messages/unread/count`

**权限**: 家长/学生

**响应示例**:
```json
{
  "count": 3
}
```

## 打卡任务接口

### 创建打卡任务

**POST** `/checkin/tasks`

**权限**: 家长

**请求参数**:
```json
{
  "student_id": 2,
  "title": "每日阅读",
  "task_type": "reading",
  "content": "阅读课外书30分钟",
  "target_days": 30,
  "points_per_completion": 10
}
```

### 获取打卡任务

**GET** `/checkin/tasks/:student_id`

**权限**: 家长/学生

**响应示例**:
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "每日阅读",
      "task_type": "reading",
      "current_streak": 5,
      "target_days": 30,
      "points_per_completion": 10
    }
  ]
}
```

### 提交打卡

**POST** `/checkin/records`

**权限**: 学生

**请求参数**:
```json
{
  "task_id": 1,
  "submission_type": "image",
  "submission_url": "http://example.com/photo.jpg"
}
```

### 获取打卡记录

**GET** `/checkin/records/:task_id`

**权限**: 家长/学生

**响应示例**:
```json
{
  "records": [
    {
      "id": 1,
      "task_id": 1,
      "submission_type": "image",
      "submission_url": "http://example.com/photo.jpg",
      "status": "pending",
      "submitted_at": "2024-06-16T10:00:00.000Z"
    }
  ]
}
```

### 审核打卡

**PUT** `/checkin/records/:id/approve`

**权限**: 家长

**请求参数**:
```json
{
  "status": "approved"
}
```

## 错题管理接口

### 添加错题

**POST** `/wrong-questions`

**权限**: 学生

**请求参数**:
```json
{
  "subject": "数学",
  "question_content": "题目内容",
  "question_image_url": "http://example.com/question.jpg",
  "answer_content": "正确答案",
  "answer_image_url": "http://example.com/answer.jpg",
  "difficulty": "medium"
}
```

### 获取错题列表

**GET** `/wrong-questions`

**权限**: 学生

**查询参数**:
- `subject`: 学科（可选）
- `difficulty`: 难度（可选）
- `mastered`: 是否已掌握（可选）
- `limit`: 数量限制（可选）

**响应示例**:
```json
{
  "questions": [
    {
      "id": 1,
      "subject": "数学",
      "question_content": "题目内容",
      "difficulty": "medium",
      "mastered": false
    }
  ]
}
```

### 更新错题

**PUT** `/wrong-questions/:id`

**权限**: 学生

### 标记错题为已掌握

**PUT** `/wrong-questions/:id/master`

**权限**: 学生

### 删除错题

**DELETE** `/wrong-questions/:id`

**权限**: 学生

## 统计数据接口

### 获取学习统计

**GET** `/statistics/:student_id`

**权限**: 家长/学生

**查询参数**:
- `start_date`: 开始日期（可选）
- `end_date`: 结束日期（可选）

**响应示例**:
```json
{
  "statistics": [
    {
      "id": 1,
      "student_id": 2,
      "stat_date": "2024-06-16",
      "total_homework": 5,
      "completed_homework": 4,
      "overdue_homework": 1,
      "average_duration": 25,
      "total_focus_duration": 75,
      "points_earned": 40,
      "points_deducted": 0
    }
  ]
}
```

### 获取今日统计

**GET** `/statistics/today/:student_id`

**权限**: 家长/学生

### 获取周统计

**GET** `/statistics/week/:student_id`

**权限**: 家长/学生

### 获取月统计

**GET** `/statistics/month/:student_id`

**权限**: 家长/学生

### 生成每日统计数据

**POST** `/statistics/generate-daily`

**权限**: 系统（定时任务）

**请求参数**:
```json
{
  "student_id": 2
}
```

## 勋章接口

### 获取所有勋章

**GET** `/badges`

**响应示例**:
```json
{
  "badges": [
    {
      "id": 1,
      "name": "按时达人",
      "description": "连续7天按时完成作业",
      "icon_url": "",
      "condition": "on_time_7_days"
    }
  ]
}
```

### 获取用户勋章

**GET** `/badges/my-badges`

**权限**: 家长/学生

**响应示例**:
```json
{
  "badges": [
    {
      "id": 1,
      "name": "按时达人",
      "description": "连续7天按时完成作业",
      "icon_url": "",
      "unlocked_at": "2024-06-16T00:00:00.000Z"
    }
  ]
}
```

### 解锁勋章

**POST** `/badges/unlock`

**权限**: 系统（内部）

**请求参数**:
```json
{
  "user_id": 2,
  "badge_id": 1
}
```

## 通知接口

### 获取通知列表

**GET** `/notifications`

**权限**: 家长/学生

**查询参数**:
- `limit`: 数量限制（可选）
- `unread_only`: 仅未读（可选）

**响应示例**:
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "新作业通知",
      "content": "您有新的作业需要完成",
      "notification_type": "new_homework",
      "is_read": false,
      "force_top": true,
      "created_at": "2024-06-16T10:00:00.000Z"
    }
  ]
}
```

### 标记通知为已读

**PUT** `/notifications/:id/read`

**权限**: 家长/学生

### 全部标记为已读

**PUT** `/notifications/read-all`

**权限**: 家长/学生

### 创建通知

**POST** `/notifications`

**权限**: 系统（内部）

**请求参数**:
```json
{
  "user_id": 2,
  "title": "通知标题",
  "content": "通知内容",
  "notification_type": "reminder",
  "force_top": false
}
```

### 删除通知

**DELETE** `/notifications/:id`

**权限**: 家长/学生

## WebSocket 事件

### 连接事件

**客户端发送**:
```javascript
socket.emit('user:connect', userId);
```

### 作业事件

**作业创建**:
```javascript
// 服务端发送
socket.emit('homework:new', { homework, student_id });

// 客户端监听
socket.on('homework:new', (data) => {
  console.log('新作业:', data.homework);
});
```

**作业更新**:
```javascript
// 服务端发送
socket.emit('homework:update', { homework, student_id });

// 客户端监听
socket.on('homework:update', (data) => {
  console.log('作业更新:', data.homework);
});
```

**作业删除**:
```javascript
// 服务端发送
socket.emit('homework:delete', { homework_id, student_id });

// 客户端监听
socket.on('homework:delete', (data) => {
  console.log('作业删除:', data.homework_id);
});
```

### 提醒事件

**提醒触发**:
```javascript
// 服务端发送
socket.emit('reminder:alert', { student_id, type, message });

// 客户端监听
socket.on('reminder:alert', (data) => {
  console.log('提醒:', data.message);
});
```

### 专注模式事件

**强制专注**:
```javascript
// 服务端发送
socket.emit('focus:force_start', { session, student_id });

// 客户端监听
socket.on('focus:force_start', (data) => {
  console.log('强制专注:', data.session);
});
```

### 消息事件

**消息发送**:
```javascript
// 服务端发送
socket.emit('message:new', { message, receiver_id });

// 客户端监听
socket.on('message:new', (data) => {
  console.log('新消息:', data.message);
});
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权或Token过期 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 速率限制

- 默认限制: 每个IP每15分钟最多100个请求
- 超过限制将返回429状态码

## 数据验证

所有POST和PUT请求都会进行数据验证，验证失败返回400状态码和详细错误信息。

## 文件上传

文件上传接口使用multipart/form-data格式，最大文件大小为10MB。

## 分页

列表接口支持分页，使用`limit`和`offset`参数控制。

## 排序

列表接口支持排序，使用`sort`和`order`参数控制。

## 过滤

列表接口支持过滤，使用相应的查询参数进行过滤。

## 搜索

部分接口支持搜索功能，使用`search`参数进行全文搜索。

## 导出

统计接口支持数据导出，使用`format`参数指定导出格式（Excel/PDF）。
