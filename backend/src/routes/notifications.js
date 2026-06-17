const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

// 获取通知列表
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50, unread_only } = req.query;
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (unread_only === 'true') {
      query += ' AND is_read = false';
    }

    query += ' ORDER BY force_top DESC, created_at DESC LIMIT $' + paramIndex;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('获取通知列表错误:', error);
    res.status(500).json({ error: '获取通知失败' });
  }
});

// 标记通知为已读
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '通知不存在' });
    }

    res.json({ message: '标记成功', notification: result.rows[0] });
  } catch (error) {
    console.error('标记通知错误:', error);
    res.status(500).json({ error: '标记失败' });
  }
});

// 全部标记为已读
router.put('/read-all', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.id]
    );

    res.json({ message: '全部标记成功' });
  } catch (error) {
    console.error('全部标记错误:', error);
    res.status(500).json({ error: '标记失败' });
  }
});

// 创建通知（内部使用）
router.post('/', async (req, res) => {
  try {
    const { user_id, title, content, notification_type, force_top } = req.body;

    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, content, notification_type, force_top) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, title, content, notification_type, force_top || false]
    );

    res.status(201).json({ notification: result.rows[0] });
  } catch (error) {
    console.error('创建通知错误:', error);
    res.status(500).json({ error: '创建通知失败' });
  }
});

// 删除通知
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除通知错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;
