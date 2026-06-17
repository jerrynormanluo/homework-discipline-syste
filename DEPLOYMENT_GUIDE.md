# 完整部署指南

## 📋 部署步骤总览

### 第1步: 创建Neon数据库 (2分钟)

1. 访问 https://neon.tech/
2. 使用GitHub账号登录(或注册新账号)
3. 点击 "New Project"
4. 填写项目信息:
   - Project name: `homework-discipline`
   - Region: 选择最近的区域(建议 US East)
   - PostgreSQL version: 保持默认
5. 点击 "Create Project"
6. 在Dashboard中找到 **Connection Details**
7. 复制 **Connection string**,格式类似:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### 第2步: 解析连接字符串

从连接字符串中提取以下信息:
```
postgresql://用户名:密码@主机地址/数据库名?sslmode=require
```

例如:
- Host: `ep-xxx.region.aws.neon.tech`
- User: `neondb_owner`  
- Password: `your-password`
- Database: `neondb`

### 第3步: 配置后端环境变量

编辑文件: `backend/.env.production`

将以下内容替换为您的实际信息:

```env
# 数据库配置
DB_HOST=您的-host地址
DB_PORT=5432
DB_NAME=您的-数据库名
DB_USER=您的-用户名
DB_PASSWORD=您的-密码
```

### 第4步: 初始化数据库

在项目根目录执行:

```bash
cd backend
npm install
npm run init-db
```

这会:
- ✓ 创建所有数据库表
- ✓ 插入默认勋章数据
- ✓ 创建测试账号

**测试账号:**
- 家长账号: `13800138000` / 密码: `123456`
- 学生账号: `13900139000` / 密码: `123456`

### 第5步: 部署后端到Vercel

```bash
cd backend
npx vercel --prod
```

部署完成后,您会获得一个后端URL,例如:
```
https://homework-discipline-backend.vercel.app
```

### 第6步: 配置前端API地址

编辑文件: `parent-web/.env.production`

```env
VITE_API_BASE_URL=https://您的后端URL.vercel.app/api
```

### 第7步: 重新部署前端

```bash
cd parent-web
npx vercel --prod
```

### 第8步: 测试登录

访问您的前端URL,使用测试账号登录:
- 手机号: `13800138000`
- 密码: `123456`

---

## 🔧 故障排除

### 问题1: 数据库连接失败

检查:
1. `.env.production` 中的数据库配置是否正确
2. Neon数据库中是否已启用该项目
3. 防火墙/网络是否允许访问

### 问题2: CORS错误

确保 `backend/.env.production` 中的 `CORS_ORIGIN` 包含您的前端域名:

```env
CORS_ORIGIN=https://您的前端URL.vercel.app,http://localhost:3001
```

### 问题3: Socket.io连接失败

Vercel的Serverless函数不支持WebSocket长连接。如果需要实时功能,建议:
- 使用 Railway、Render 或 Heroku 部署后端
- 或使用 Vercel + 第三方WebSocket服务(Pusher、Ably等)

---

## 🚀 快速命令汇总

```bash
# 初始化数据库
cd backend && npm run init-db

# 本地测试后端
cd backend && npm run dev

# 本地测试前端  
cd parent-web && npm run dev

# 部署后端
cd backend && npx vercel --prod

# 部署前端
cd parent-web && npx vercel --prod
```

---

## 📝 注意事项

1. **环境变量安全**: 不要将 `.env.production` 提交到Git
2. **JWT密钥**: 生产环境应使用强随机密钥
3. **数据库备份**: Neon提供自动备份,也可手动导出
4. **免费额度**: 
   - Neon: 0.5 GB存储,足够开发测试
   - Vercel: 无限个人项目,100GB带宽/月

---

## 🎯 下一步

部署成功后,您可以:
1. 添加更多测试数据
2. 配置自定义域名
3. 设置CI/CD自动部署
4. 部署学生端应用

祝您部署顺利! 🎉
