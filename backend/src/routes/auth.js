const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

// 注册
router.post('/register', [
  body('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').isIn(['parent', 'student']).withMessage('角色必须是parent或student'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password, role, nickname } = req.body;

    // 检查手机号是否已注册
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 创建用户
    const result = await pool.query(
      'INSERT INTO users (phone, password_hash, nickname, role) VALUES ($1, $2, $3, $4) RETURNING id, phone, nickname, role',
      [phone, passwordHash, nickname || phone, role]
    );

    const user = result.rows[0];

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', [
  body('phone').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('password').notEmpty().withMessage('密码不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    // 查找用户
    const result = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    const user = result.rows[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    // 更新最后登录时间
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, last_login_ip = $1 WHERE id = $2',
      [req.ip, user.id]
    );

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, phone, nickname, role, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

module.exports = router;
