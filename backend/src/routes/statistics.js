const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, parentOnly, studentOnly } = require('../middleware/auth');

// 获取学习统计
router.get('/:student_id', auth, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { start_date, end_date } = req.query;

    if (req.user.role === 'parent') {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, student_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权查看该学生统计' });
      }
    } else if (req.user.role === 'student' && req.user.id !== parseInt(student_id)) {
      return res.status(403).json({ error: '无权查看其他学生统计' });
    }

    let query = 'SELECT * FROM learning_statistics WHERE student_id = $1';
    const params = [student_id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND stat_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND stat_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' ORDER BY stat_date DESC';

    const result = await pool.query(query, params);
    res.json({ statistics: result.rows });
  } catch (error) {
    console.error('获取学习统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 获取今日统计
router.get('/today/:student_id', auth, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (req.user.role === 'parent') {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, student_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权查看该学生统计' });
      }
    } else if (req.user.role === 'student' && req.user.id !== parseInt(student_id)) {
      return res.status(403).json({ error: '无权查看其他学生统计' });
    }

    const result = await pool.query(
      'SELECT * FROM learning_statistics WHERE student_id = $1 AND stat_date = CURRENT_DATE',
      [student_id]
    );

    if (result.rows.length === 0) {
      return res.json({ statistics: null });
    }

    res.json({ statistics: result.rows[0] });
  } catch (error) {
    console.error('获取今日统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 获取周统计
router.get('/week/:student_id', auth, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (req.user.role === 'parent') {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, student_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权查看该学生统计' });
      }
    } else if (req.user.role === 'student' && req.user.id !== parseInt(student_id)) {
      return res.status(403).json({ error: '无权查看其他学生统计' });
    }

    const result = await pool.query(
      `SELECT * FROM learning_statistics 
       WHERE student_id = $1 AND stat_date >= DATE_TRUNC('week', CURRENT_DATE) 
       ORDER BY stat_date DESC`,
      [student_id]
    );

    res.json({ statistics: result.rows });
  } catch (error) {
    console.error('获取周统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 获取月统计
router.get('/month/:student_id', auth, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (req.user.role === 'parent') {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, student_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权查看该学生统计' });
      }
    } else if (req.user.role === 'student' && req.user.id !== parseInt(student_id)) {
      return res.status(403).json({ error: '无权查看其他学生统计' });
    }

    const result = await pool.query(
      `SELECT * FROM learning_statistics 
       WHERE student_id = $1 AND stat_date >= DATE_TRUNC('month', CURRENT_DATE) 
       ORDER BY stat_date DESC`,
      [student_id]
    );

    res.json({ statistics: result.rows });
  } catch (error) {
    console.error('获取月统计错误:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 生成每日统计数据（定时任务调用）
router.post('/generate-daily', async (req, res) => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: '学生ID不能为空' });
    }

    // 获取今日作业统计
    const homeworkResult = await pool.query(
      `SELECT 
        COUNT(*) as total_homework,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_homework,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_homework,
        AVG(CASE WHEN actual_duration IS NOT NULL THEN actual_duration END) as average_duration
       FROM homework 
       WHERE student_id = $1 AND DATE(deadline) = CURRENT_DATE`,
      [student_id]
    );

    // 获取今日专注时长
    const focusResult = await pool.query(
      `SELECT COALESCE(SUM(actual_duration), 0) as total_focus_duration
       FROM focus_sessions 
       WHERE student_id = $1 AND DATE(start_time) = CURRENT_DATE AND is_completed = true`,
      [student_id]
    );

    // 获取今日积分变动
    const pointsResult = await pool.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN points_change > 0 THEN points_change ELSE 0 END), 0) as points_earned,
        COALESCE(SUM(CASE WHEN points_change < 0 THEN ABS(points_change) ELSE 0 END), 0) as points_deducted
       FROM point_records 
       WHERE student_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [student_id]
    );

    const hwStats = homeworkResult.rows[0];
    const focusStats = focusResult.rows[0];
    const pointsStats = pointsResult.rows[0];

    // 检查是否已存在今日统计
    const existing = await pool.query(
      'SELECT id FROM learning_statistics WHERE student_id = $1 AND stat_date = CURRENT_DATE',
      [student_id]
    );

    if (existing.rows.length > 0) {
      // 更新
      await pool.query(
        `UPDATE learning_statistics 
         SET total_homework = $1,
             completed_homework = $2,
             overdue_homework = $3,
             average_duration = $4,
             total_focus_duration = $5,
             points_earned = $6,
             points_deducted = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $8 AND stat_date = CURRENT_DATE`,
        [hwStats.total_homework, hwStats.completed_homework, hwStats.overdue_homework, hwStats.average_duration, focusStats.total_focus_duration, pointsStats.points_earned, pointsStats.points_deducted, student_id]
      );
    } else {
      // 插入
      await pool.query(
        `INSERT INTO learning_statistics 
         (student_id, stat_date, total_homework, completed_homework, overdue_homework, average_duration, total_focus_duration, points_earned, points_deducted) 
         VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8)`,
        [student_id, hwStats.total_homework, hwStats.completed_homework, hwStats.overdue_homework, hwStats.average_duration, focusStats.total_focus_duration, pointsStats.points_earned, pointsStats.points_deducted]
      );
    }

    res.json({ message: '统计数据生成成功' });
  } catch (error) {
    console.error('生成统计数据错误:', error);
    res.status(500).json({ error: '生成失败' });
  }
});

module.exports = router;
