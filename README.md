# 青少年作业自律辅助系统

## 项目简介
双端联动家庭教育辅助系统，面向小学至初中自律性偏弱的学生及家长。依托家长管理端+学生显示端，实现远程作业下发、屏幕可视化展示、智能提醒、低龄拼音语音辅助、专注锁机、积分奖惩、数据统计，全方位培养孩子作业自律性。

## 技术栈

### 后端服务
- Node.js + Express
- PostgreSQL
- Socket.io (实时通信)
- JWT (身份认证)
- Multer (文件上传)

### 学生端
- React Native (安卓平板)
- React (Web版本)
- React Navigation
- AsyncStorage (本地存储)
- react-native-tts (语音合成)
- pinyin-pro (拼音标注)

### 家长端
- React (Web)
- 微信小程序
- Ant Design (UI组件库)
- Recharts (数据可视化)

## 项目结构

```
homework-discipline-system/
├── backend/              # 后端服务
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── models/       # 数据模型
│   │   ├── routes/       # 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── middleware/   # 中间件
│   │   ├── utils/        # 工具函数
│   │   └── config/       # 配置文件
│   ├── database/         # 数据库脚本
│   └── package.json
├── student-app/          # 学生端 (React Native)
│   ├── src/
│   │   ├── components/   # 组件
│   │   ├── screens/      # 页面
│   │   ├── services/     # API服务
│   │   ├── utils/        # 工具函数
│   │   ├── navigation/   # 导航配置
│   │   └── store/        # 状态管理
│   └── package.json
├── student-web/          # 学生端 (Web版本)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── parent-web/           # 家长端 (Web)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── parent-miniprogram/   # 家长端 (微信小程序)
│   ├── pages/
│   ├── components/
│   ├── utils/
│   └── app.json
└── docs/                 # 文档
    ├── database-design.md
    └── api-doc.md
```

## 核心功能

### 家长管理端
- 作业任务管理（创建、编辑、删除、模板）
- 智能提醒配置
- 专注模式配置
- 积分奖惩体系
- 全维度数据统计
- 拼音辅助功能配置
- 智能语音功能配置

### 学生显示端
- 极简作业主页
- 多元化提醒功能
- 专注学习模块
- 积分与成长板块
- 作息日历模块
- 作业拼音显示功能
- 智能语音播放功能
- 错题收纳
- 打卡任务
- 亲子留言

## 开发计划

1. ✅ 确认技术栈和开发方向
2. ✅ 设计系统架构和数据库
3. ⏳ 搭建项目基础结构
4. ⏳ 开发后端服务（API + 数据库 + WebSocket）
5. ⏳ 开发学生端（React Native + Web）
6. ⏳ 开发家长端（React Web + 微信小程序）
7. ⏳ 实现拼音标注功能
8. ⏳ 实现本地语音合成功能
9. ⏳ 实现专注模式和锁机功能
10. ⏳ 实现积分奖惩体系
11. ⏳ 实现数据统计和报表
12. ⏳ 测试和优化

## 快速开始

### 后端服务
```bash
cd backend
npm install
npm run dev
```

### 学生端 (React Native)
```bash
cd student-app
npm install
npm run android  # 安卓平板
npm run web      # Web版本
```

### 家长端 (Web)
```bash
cd parent-web
npm install
npm start
```

### 家长端 (微信小程序)
```bash
cd parent-miniprogram
# 使用微信开发者工具打开
```

## 环境要求

- Node.js >= 16.0.0
- PostgreSQL >= 13.0
- React Native CLI
- 微信开发者工具

## 开发规范

- 使用 ESLint + Prettier 进行代码格式化
- 遵循 Git Flow 分支管理
- 提交信息使用 Conventional Commits 规范

## 许可证

MIT License
