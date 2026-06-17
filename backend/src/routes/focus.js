const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth, parentOnly, studentOnly } = require('../middleware/auth');

// 获取专注模式配置
router.get('/settings/:student_id', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.params;

    // 验证绑定关系
    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权查看该学生配置' });
    }

    const result = await pool.query(
      'SELECT * FROM focus_settings WHERE student_id = $1',
      [student_id]
    );

    if (result.rows.length === 0) {
      // 创建默认配置
      const defaultSettings = await pool.query(
        `INSERT INTO focus_settings (parent_id, student_id, focus_duration, break_duration, force_lock, mode) 
         VALUES ($1, $2, 25, 5, false, 'pomodoro') 
         RETURNING *`,
        [req.user.id, student_id]
      );
      return res.json({ settings: defaultSettings.rows[0] });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('获取专注配置错误:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 更新专注模式配置
router.put('/settings/:student_id', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { focus_duration, break_duration, force_lock, mode } = req.body;

    // 验证绑定关系
    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权修改该学生配置' });
    }

    const result = await pool.query(
      `UPDATE focus_settings 
       SET focus_duration = COALESCE($1, focus_duration),
           break_duration = COALESCE($2, break_duration),
           force_lock = COALESCE($3, force_lock),
           mode = COALESCE($4, mode),
           updated_at = CURRENT_TIMESTAMP
       WHERE student_id = $5
       RETURNING *`,
      [focus_duration, break_duration, force_lock, mode, student_id]
    );

    if (result.rows.length === 0) {
      // 创建配置
      const newSettings = await pool.query(
        `INSERT INTO focus_settings (parent_id, student_id, focus_duration, break_duration, force_lock, mode) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [req.user.id, student_id, focus_duration || 25, break_duration || 5, force_lock || false, mode || 'pomodoro']
      );
      return res.json({ message: '配置创建成功', settings: newSettings.rows[0] });
    }

    res.json({ message: '配置更新成功', settings: result.rows[0] });
  } catch (error) {
    console.error('更新专注配置错误:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

// 学生开始专注
router.post('/sessions', auth, studentOnly, [
  body('homework_id').optional().isInt().withMessage('作业ID必须是整数'),
  body('planned_duration').isInt().withMessage('计划时长必须是整数'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { homework_id, planned_duration } = req.body;
    const student_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO focus_sessions (student_id, homework_id, start_time, planned_duration, is_forced) 
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, false) 
       RETURNING *`,
      [student_id, homework_id || null, planned_duration]
    );

    res.status(201).json({ message: '专注开始', session: result.rows[0] });
  } catch (error) {
    console.error('开始专注错误:', error);
    res.status(500).json({ error: '开始专注失败' });
  }
});

// 家长强制学生专注
router.post('/sessions/force', auth, parentOnly, [
  body('student_id').isInt().withMessage('学生ID必须是整数'),
  body('planned_duration').isInt().withMessage('计划时长必须是整数'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, homework_id, planned_duration } = req.body;

    // 验证绑定关系
    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权操作该学生' });
    }

    const result = await pool.query(
      `INSERT INTO focus_sessions (student_id, homework_id, start_time, planned_duration, is_forced) 
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, true) 
       RETURNING *`,
      [student_id, homework_id || null, planned_duration]
    );

    // 通过Socket.io通知学生端
    const io = req.app.get('io');
    io.emit('focus:force_start', { session: result.rows[0], student_id });

    res.status(201).json({ message: '强制专注已下发', session: result.rows[0] });
  } catch (error) {
    console.error('强制专注错误:', error);
    res.status(500).json({ error: '强制专注失败' });
  }
});

// 结束专注
router.put('/sessions/:id/end', auth, studentOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM focus_sessions WHERE id = $1 AND student_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '专注记录不存在' });
    }

    const session = existing.rows[0];
    const actual_duration = Math.floor((new Date() - session.start_time) / 60000);

    const result = await pool.query(
      `UPDATE focus_sessions 
       SET end_time = CURRENT_TIMESTAMP,
           actual_duration = $1,
           is_completed = true
       WHERE id = $2
       RETURNING *`,
      [actual_duration, id]
    );

    res.json({ message: '专注结束', session: result.rows[0] });
  } catch (error) {
    console.error('结束专注错误:', error);
    res.status(500).json({ error: '结束专注失败' });
  }
});

// 获取专注记录
router.get('/sessions', auth, async (req, res) => {
  try {
    const { date, limit = 20 } = req.query;
    let query = 'SELECT * FROM focus_sessions WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (req.user.role === 'student') {
      query += ` AND student_id = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }

    if (date) {
      query += ` AND DATE(start_time) = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    query += ' ORDER BY start_time DESC LIMIT $' + paramIndex;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ sessions: result.rows });
  } catch (error) {
    console.error('获取专注记录错误:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

// 获取今日专注统计
router.get('/statistics/today', auth, studentOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as session_count,
        SUM(actual_duration) as total_duration,
        SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) as completed_count
       FROM focus_sessions 
       WHERE student_id = $1 AND DATE(start_time) = CURRENT_DATE`,
      [req.user.id]
    );

    res.json({ statistics: result.rows[0] });
  } catch (error) {
    console.error('获取专注统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

module.exports = router;
