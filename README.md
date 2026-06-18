# 青少年作业自律辅助系统

## 🌐 在线演示

**家长端 Web**: https://parent-web-jade.vercel.app

**学生端 Web**: https://student-mibqwbvvv-jerrynormanluos-projects.vercel.app

**测试账号**:
- 家长账号: `13800138000` / 密码: `123456`
- 学生账号: `13900139000` / 密码: `123456`

---

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

### ✅ 已完成功能

1. ✅ 确认技术栈和开发方向
2. ✅ 设计系统架构和数据库
3. ✅ 搭建项目基础结构
4. ✅ 开发后端服务（API + 数据库）
5. ✅ 开发家长端 Web
6. ✅ 部署到云端 (Vercel + Neon)
7. ✅ 作业管理系统（创建、编辑、删除、模板）
8. ✅ 学生绑定与管理
9. ✅ 专注模式配置（番茄钟/长会话）
10. ✅ 积分奖惩体系（规则配置、积分记录、奖励兑换）
11. ✅ 数据统计与报表（日/周/月统计）
12. ✅ 拼音标注配置
13. ✅ 语音播放配置
14. ✅ 错题收纳功能
15. ✅ 打卡任务系统
16. ✅ 亲子留言功能
17. ✅ 勋章系统
18. ✅ 智能提醒配置
19. ✅ **前端拼音标注显示** (pinyin-pro集成)
20. ✅ **浏览器语音合成** (Web Speech API)
21. ✅ **学生端 Web 版本** (React + Vite)

### ⏳ 待完成功能

1. ⏳ 学生端 React Native App（安卓平板）
2. ⏳ 家长端微信小程序
3. ⏳ WebSocket 实时通知（需更换部署平台）

## 快速开始

### 🚀 在线体验 (推荐)

直接访问已部署的系统，无需本地安装：
- **家长端**: https://parent-web-jade.vercel.app
- **学生端**: https://student-mibqwbvvv-jerrynormanluos-projects.vercel.app
- **测试账号**: `13800138000` / `123456`

### 💻 本地开发

#### 后端服务
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

- Node.js >= 18.0.0
- PostgreSQL >= 13.0 (或使用 Neon 云数据库)
- React Native CLI (学生端)
- 微信开发者工具 (小程序端)

## 部署说明

### 云端部署 (已完成)

本项目已成功部署到云端：

- **前端**: Vercel (https://parent-web-jade.vercel.app)
- **后端**: Vercel Serverless (https://backend-five-indol-51.vercel.app)
- **数据库**: Neon PostgreSQL (免费层)

详细部署指南请参考: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 开发规范

- 使用 ESLint + Prettier 进行代码格式化
- 遵循 Git Flow 分支管理
- 提交信息使用 Conventional Commits 规范

## 许可证

MIT License
