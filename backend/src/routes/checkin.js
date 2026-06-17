const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth, parentOnly, studentOnly } = require('../middleware/auth');

// 创建打卡任务
router.post('/tasks', auth, parentOnly, [
  body('student_id').isInt().withMessage('学生ID必须是整数'),
  body('title').notEmpty().withMessage('任务标题不能为空'),
  body('task_type').isIn(['reading', 'recitation', 'calligraphy', 'exercise']).withMessage('任务类型不正确'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, title, task_type, content, target_days, points_per_completion } = req.body;

    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权为该学生创建任务' });
    }

    const result = await pool.query(
      `INSERT INTO checkin_tasks (parent_id, student_id, title, task_type, content, target_days, points_per_completion) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [req.user.id, student_id, title, task_type, content, target_days, points_per_completion || 10]
    );

    res.status(201).json({ message: '任务创建成功', task: result.rows[0] });
  } catch (error) {
    console.error('创建打卡任务错误:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
});

// 获取打卡任务列表
router.get('/tasks/:student_id', auth, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (req.user.role === 'parent') {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, student_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权查看该学生任务' });
      }
    } else if (req.user.role === 'student' && req.user.id !== parseInt(student_id)) {
      return res.status(403).json({ error: '无权查看其他学生任务' });
    }

    const result = await pool.query(
      'SELECT * FROM checkin_tasks WHERE student_id = $1 AND is_active = true ORDER BY created_at DESC',
      [student_id]
    );

    res.json({ tasks: result.rows });
  } catch (error) {
    console.error('获取打卡任务错误:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 学生提交打卡
router.post('/records', auth, studentOnly, [
  body('task_id').isInt().withMessage('任务ID必须是整数'),
  body('submission_type').isIn(['image', 'voice']).withMessage('提交类型不正确'),
  body('submission_url').notEmpty().withMessage('提交内容不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { task_id, submission_type, submission_url } = req.body;
    const student_id = req.user.id;

    // 验证任务
    const taskResult = await pool.query(
      'SELECT * FROM checkin_tasks WHERE id = $1 AND student_id = $2 AND is_active = true',
      [task_id, student_id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const task = taskResult.rows[0];

    // 创建打卡记录
    const recordResult = await pool.query(
      `INSERT INTO checkin_records (task_id, student_id, submission_type, submission_url) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [task_id, student_id, submission_type, submission_url]
    );

    // 更新连续打卡天数
    await pool.query(
      `UPDATE checkin_tasks 
       SET current_streak = current_streak + 1 
       WHERE id = $1`,
      [task_id]
    );

    // 添加积分
    const balanceResult = await pool.query(
      `SELECT COALESCE(SUM(points_change), 0) as balance 
       FROM point_records 
       WHERE student_id = $1`,
      [student_id]
    );
    const currentBalance = parseInt(balanceResult.rows[0].balance) || 0;

    await pool.query(
      `INSERT INTO point_records (student_id, points_change, balance_after, reason) 
       VALUES ($1, $2, $3, $4)`,
      [student_id, task.points_per_completion, currentBalance + task.points_per_completion, `打卡完成: ${task.title}`]
    );

    res.status(201).json({ message: '打卡提交成功', record: recordResult.rows[0] });
  } catch (error) {
    console.error('提交打卡错误:', error);
    res.status(500).json({ error: '提交失败' });
  }
});

// 获取打卡记录
router.get('/records/:task_id', auth, async (req, res) => {
  try {
    const { task_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM checkin_records WHERE task_id = $1 ORDER BY submitted_at DESC',
      [task_id]
    );

    res.json({ records: result.rows });
  } catch (error) {
    console.error('获取打卡记录错误:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

// 审核打卡
router.put('/records/:id/approve', auth, parentOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '状态不正确' });
    }

    const result = await pool.query(
      `UPDATE checkin_records 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    // 如果拒绝，回退积分
    if (status === 'rejected') {
      const record = result.rows[0];
      const taskResult = await pool.query(
        'SELECT points_per_completion FROM checkin_tasks WHERE id = $1',
        [record.task_id]
      );
      const points = taskResult.rows[0].points_per_completion;

      await pool.query(
        `INSERT INTO point_records (student_id, points_change, balance_after, reason) 
         VALUES ($1, $2, (SELECT COALESCE(SUM(points_change), 0) FROM point_records WHERE student_id = $1) + $2, $3)`,
        [record.student_id, -points, `打卡审核拒绝: ${record.task_id}`]
      );

      // 回退连续打卡天数
      await pool.query(
        `UPDATE checkin_tasks 
         SET current_streak = GREATEST(0, current_streak - 1) 
         WHERE id = $1`,
        [record.task_id]
      );
    }

    res.json({ message: '审核完成', record: result.rows[0] });
  } catch (error) {
    console.error('审核打卡错误:', error);
    res.status(500).json({ error: '审核失败' });
  }
});

module.exports = router;
