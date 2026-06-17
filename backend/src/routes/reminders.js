const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth, parentOnly } = require('../middleware/auth');

// 获取提醒配置
router.get('/settings/:student_id', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.params;

    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权查看该学生配置' });
    }

    const result = await pool.query(
      'SELECT * FROM reminder_settings WHERE student_id = $1',
      [student_id]
    );

    if (result.rows.length === 0) {
      const defaultSettings = await pool.query(
        `INSERT INTO reminder_settings (parent_id, student_id, start_reminder, deadline_warning, overdue_reminder) 
         VALUES ($1, $2, true, true, true) 
         RETURNING *`,
        [req.user.id, student_id]
      );
      return res.json({ settings: defaultSettings.rows[0] });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('获取提醒配置错误:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 更新提醒配置
router.put('/settings/:student_id', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { start_reminder, deadline_warning, overdue_reminder, auto_second_reminder, force_top_on_overdue, custom_reminders, ringtone_type } = req.body;

    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权修改该学生配置' });
    }

    const result = await pool.query(
      `UPDATE reminder_settings 
       SET start_reminder = COALESCE($1, start_reminder),
           deadline_warning = COALESCE($2, deadline_warning),
           overdue_reminder = COALESCE($3, overdue_reminder),
           auto_second_reminder = COALESCE($4, auto_second_reminder),
           force_top_on_overdue = COALESCE($5, force_top_on_overdue),
           custom_reminders = COALESCE($6, custom_reminders),
           ringtone_type = COALESCE($7, ringtone_type),
           updated_at = CURRENT_TIMESTAMP
       WHERE student_id = $8
       RETURNING *`,
      [start_reminder, deadline_warning, overdue_reminder, auto_second_reminder, force_top_on_overdue, custom_reminders, ringtone_type, student_id]
    );

    if (result.rows.length === 0) {
      const newSettings = await pool.query(
        `INSERT INTO reminder_settings (parent_id, student_id, start_reminder, deadline_warning, overdue_reminder) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [req.user.id, student_id, start_reminder ?? true, deadline_warning ?? true, overdue_reminder ?? true]
      );
      return res.json({ message: '配置创建成功', settings: newSettings.rows[0] });
    }

    res.json({ message: '配置更新成功', settings: result.rows[0] });
  } catch (error) {
    console.error('更新提醒配置错误:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

module.exports = router;
