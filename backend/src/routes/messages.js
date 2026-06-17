const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

// 发送消息
router.post('/', auth, [
  body('receiver_id').isInt().withMessage('接收者ID必须是整数'),
  body('message_type').isIn(['text', 'voice']).withMessage('消息类型不正确'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiver_id, message_type, content, voice_url } = req.body;
    const sender_id = req.user.id;

    // 验证发送者和接收者的绑定关系
    if (req.user.role === 'parent') {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [sender_id, receiver_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权发送消息给该学生' });
      }
    } else {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [receiver_id, sender_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权发送消息给该家长' });
      }
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_type, content, voice_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [sender_id, receiver_id, message_type, content, voice_url]
    );

    // 通过Socket.io通知接收者
    const io = req.app.get('io');
    io.emit('message:sent', { message: result.rows[0], receiver_id });

    res.status(201).json({ message: '发送成功', message: result.rows[0] });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ error: '发送失败' });
  }
});

// 获取消息列表
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `SELECT m.*, 
              sender.nickname as sender_nickname, sender.avatar_url as sender_avatar,
              receiver.nickname as receiver_nickname, receiver.avatar_url as receiver_avatar
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       JOIN users receiver ON m.receiver_id = receiver.id
       WHERE m.sender_id = $1 OR m.receiver_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    res.status(500).json({ error: '获取消息失败' });
  }
});

// 标记消息为已读
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE messages SET is_read = true WHERE id = $1 AND receiver_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '消息不存在' });
    }

    res.json({ message: '标记成功', message: result.rows[0] });
  } catch (error) {
    console.error('标记消息错误:', error);
    res.status(500).json({ error: '标记失败' });
  }
});

// 获取未读消息数量
router.get('/unread/count', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('获取未读数量错误:', error);
    res.status(500).json({ error: '获取数量失败' });
  }
});

module.exports = router;
