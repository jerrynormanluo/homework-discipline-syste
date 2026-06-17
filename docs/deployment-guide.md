# 青少年作业自律辅助系统 - 部署指南

## 系统架构

本系统采用B/S架构，包含以下组件：

- **后端服务**: Node.js + Express + PostgreSQL + Socket.io
- **学生端**: React Native (安卓平板) + React (Web)
- **家长端**: React Web + 微信小程序
- **数据库**: PostgreSQL
- **实时通信**: Socket.io

## 环境要求

### 后端服务
- Node.js >= 16.0.0
- PostgreSQL >= 13.0
- npm 或 yarn

### 学生端 (React Native)
- Node.js >= 16.0.0
- React Native CLI
- Android Studio (安卓开发)
- Xcode (iOS开发，可选)

### 学生端 (Web)
- Node.js >= 16.0.0
- 现代浏览器

### 家长端 (Web)
- Node.js >= 16.0.0
- 现代浏览器

### 家长端 (微信小程序)
- 微信开发者工具
- 微信小程序账号

## 部署步骤

### 1. 数据库部署

#### 安装 PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 创建数据库
```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库
CREATE DATABASE homework_discipline;

# 创建用户（可选）
CREATE USER homework_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE homework_discipline TO homework_user;

# 退出
\q
```

#### 初始化数据库表
```bash
cd backend
psql -U postgres -d homework_discipline -f database/init.sql
```

### 2. 后端服务部署

#### 安装依赖
```bash
cd backend
npm install
```

#### 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接、JWT密钥等
```

#### 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

#### 使用 PM2 进行进程管理（推荐）
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start src/server.js --name homework-api

# 设置开机自启
pm2 startup
pm2 save
```

### 3. 学生端部署

#### React Native 版本（安卓平板）

##### 安装依赖
```bash
cd student-app
npm install
```

##### 配置环境变量
编辑 `src/constants/api.js`，修改 API_BASE_URL 为生产环境地址。

##### 构建安卓 APK
```bash
# 生成签名密钥
keytool -genkey -v -keystore homework-release.keystore -alias homework-key -keyalg RSA -keysize 2048 -validity 10000

# 放置密钥到 android/app/
# 配置 android/app/build.gradle

# 构建发布版本
cd android
./gradlew assembleRelease

# APK 文件位置: android/app/build/outputs/apk/release/app-release.apk
```

##### 部署到设备
```bash
# 通过 USB 安装
adb install android/app/build/outputs/apk/release/app-release.apk

# 或通过应用商店发布
```

#### Web 版本

##### 安装依赖
```bash
cd student-app
npm install
```

##### 构建生产版本
```bash
# 需要先配置 Web 支持
npm run web-build
```

##### 部署到服务器
```bash
# 使用 Nginx 托管静态文件
# 或部署到 Vercel、Netlify 等平台
```

### 4. 家长端部署

#### Web 版本

##### 安装依赖
```bash
cd parent-web
npm install
```

##### 配置环境变量
```bash
# 创建 .env 文件
echo "VITE_API_BASE_URL=https://your-api-domain.com/api" > .env
```

##### 构建生产版本
```bash
npm run build
```

##### 部署到服务器
```bash
# 使用 Nginx 托管 dist 目录
# 或部署到 Vercel、Netlify 等平台
```

#### 微信小程序版本

##### 使用微信开发者工具打开
```bash
cd parent-miniprogram
# 使用微信开发者工具打开该目录
```

##### 配置服务器域名
在微信公众平台配置服务器域名白名单。

##### 上传发布
使用微信开发者工具上传代码并提交审核。

### 5. Nginx 配置示例

```nginx
# 后端 API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 家长端 Web
server {
    listen 80;
    server_name parent.yourdomain.com;

    root /path/to/parent-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 学生端 Web
server {
    listen 80;
    server_name student.yourdomain.com;

    root /path/to/student-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 6. SSL 证书配置（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.yourdomain.com -d parent.yourdomain.com -d student.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

## 监控和维护

### 日志管理
```bash
# PM2 日志
pm2 logs homework-api

# 查看错误日志
pm2 logs homework-api --err

# 清空日志
pm2 flush
```

### 数据库备份
```bash
# 备份数据库
pg_dump -U postgres homework_discipline > backup_$(date +%Y%m%d).sql

# 恢复数据库
psql -U postgres homework_discipline < backup_20240616.sql
```

### 性能监控
- 使用 PM2 监控: `pm2 monit`
- 数据库性能监控: 使用 pgAdmin 或其他工具
- 应用性能监控: 可集成 Sentry、New Relic 等

## 故障排查

### 后端服务无法启动
1. 检查数据库连接配置
2. 检查端口是否被占用
3. 查看日志文件

### Socket.io 连接失败
1. 检查防火墙设置
2. 确认 WebSocket 端口开放
3. 检查 Nginx 配置

### 移动端无法连接服务器
1. 检查 API 地址配置
2. 确认网络连接
3. 检查 SSL 证书

## 安全建议

1. 使用强密码和 JWT 密钥
2. 启用 HTTPS
3. 定期更新依赖包
4. 配置防火墙规则
5. 限制数据库访问权限
6. 定期备份数据
7. 启用日志监控

## 扩展部署

### 使用 Docker
```bash
# 构建后端镜像
cd backend
docker build -t homework-api .

# 运行容器
docker run -d -p 3000:3000 --name homework-api homework-api
```

### 使用 Docker Compose
```yaml
version: '3'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: homework_discipline
      POSTGRES_USER: homework_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: homework_discipline
      DB_USER: homework_user
      DB_PASSWORD: your_password

volumes:
  postgres_data:
```

## 联系支持

如有部署问题，请联系技术支持团队。
