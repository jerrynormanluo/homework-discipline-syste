const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io 配置
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 100个请求
  message: '请求过于频繁，请稍后再试',
});
app.use('/api/', limiter);

// 静态文件
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/focus', require('./routes/focus'));
app.use('/api/points', require('./routes/points'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/checkin', require('./routes/checkin'));
app.use('/api/wrong-questions', require('./routes/wrong-questions'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/badges', require('./routes/badges'));

// Socket.io 连接管理
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('user:connect', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`用户 ${userId} 已连接`);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`用户 ${userId} 已断开连接`);
        break;
      }
    }
  });

  // 作业相关事件
  socket.on('homework:created', (data) => {
    const studentSocketId = connectedUsers.get(data.studentId);
    if (studentSocketId) {
      io.to(studentSocketId).emit('homework:new', data);
    }
  });

  socket.on('homework:updated', (data) => {
    const studentSocketId = connectedUsers.get(data.studentId);
    if (studentSocketId) {
      io.to(studentSocketId).emit('homework:update', data);
    }
  });

  socket.on('homework:deleted', (data) => {
    const studentSocketId = connectedUsers.get(data.studentId);
    if (studentSocketId) {
      io.to(studentSocketId).emit('homework:delete', data);
    }
  });

  // 提醒相关事件
  socket.on('reminder:trigger', (data) => {
    const studentSocketId = connectedUsers.get(data.studentId);
    if (studentSocketId) {
      io.to(studentSocketId).emit('reminder:alert', data);
    }
  });

  // 专注模式相关事件
  socket.on('focus:start', (data) => {
    const studentSocketId = connectedUsers.get(data.studentId);
    if (studentSocketId) {
      io.to(studentSocketId).emit('focus:force_start', data);
    }
  });

  // 消息相关事件
  socket.on('message:sent', (data) => {
    const receiverSocketId = connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message:new', data);
    }
  });
});

// 导出 io 实例供其他模块使用
app.set('io', io);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io, connectedUsers };
