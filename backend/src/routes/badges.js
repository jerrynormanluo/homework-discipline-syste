const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

// 获取所有勋章
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM badges ORDER BY created_at ASC');
    res.json({ badges: result.rows });
  } catch (error) {
    console.error('获取勋章列表错误:', error);
    res.status(500).json({ error: '获取勋章失败' });
  }
});

// 获取用户已获得的勋章
router.get('/my-badges', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ub.*, b.name, b.description, b.icon_url, b.condition 
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1
       ORDER BY ub.unlocked_at DESC`,
      [req.user.id]
    );

    res.json({ badges: result.rows });
  } catch (error) {
    console.error('获取用户勋章错误:', error);
    res.status(500).json({ error: '获取勋章失败' });
  }
});

// 解锁勋章（内部使用）
router.post('/unlock', async (req, res) => {
  try {
    const { user_id, badge_id } = req.body;

    // 检查是否已解锁
    const existing = await pool.query(
      'SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2',
      [user_id, badge_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '勋章已解锁' });
    }

    const result = await pool.query(
      `INSERT INTO user_badges (user_id, badge_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [user_id, badge_id]
    );

    res.status(201).json({ message: '勋章解锁成功', badge: result.rows[0] });
  } catch (error) {
    console.error('解锁勋章错误:', error);
    res.status(500).json({ error: '解锁失败' });
  }
});

module.exports = router;
