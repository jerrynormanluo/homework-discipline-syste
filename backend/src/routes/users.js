const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth, parentOnly } = require('../middleware/auth');

// 绑定学生设备
router.post('/bind-student', auth, parentOnly, [
  body('student_phone').isMobilePhone('zh-CN').withMessage('学生手机号格式不正确'),
  body('device_name').notEmpty().withMessage('设备名称不能为空'),
  body('device_type').isIn(['android_tablet', 'windows', 'display', 'tv']).withMessage('设备类型不正确'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_phone, device_name, device_type, lock_screen_password, max_volume } = req.body;
    const parent_id = req.user.id;

    // 查找学生用户
    const studentResult = await pool.query(
      'SELECT id FROM users WHERE phone = $1 AND role = $2',
      [student_phone, 'student']
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: '学生用户不存在' });
    }

    const student_id = studentResult.rows[0].id;

    // 检查是否已绑定
    const existingBinding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [parent_id, student_id]
    );

    if (existingBinding.rows.length > 0) {
      return res.status(400).json({ error: '该学生已绑定' });
    }

    // 检查家长绑定的学生数量（最多3个）
    const bindingCount = await pool.query(
      'SELECT COUNT(*) FROM parent_student_bindings WHERE parent_id = $1',
      [parent_id]
    );

    if (parseInt(bindingCount.rows[0].count) >= 3) {
      return res.status(400).json({ error: '最多只能绑定3个学生设备' });
    }

    // 创建绑定
    await pool.query(
      `INSERT INTO parent_student_bindings 
       (parent_id, student_id, device_name, device_type, lock_screen_password, max_volume) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [parent_id, student_id, device_name, device_type, lock_screen_password || null, max_volume || 100]
    );

    res.json({ message: '绑定成功' });
  } catch (error) {
    console.error('绑定学生错误:', error);
    res.status(500).json({ error: '绑定失败' });
  }
});

// 获取家长绑定的学生列表
router.get('/my-students', auth, parentOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT psb.*, u.phone, u.nickname, u.avatar_url 
       FROM parent_student_bindings psb
       JOIN users u ON psb.student_id = u.id
       WHERE psb.parent_id = $1`,
      [req.user.id]
    );

    res.json({ students: result.rows });
  } catch (error) {
    console.error('获取学生列表错误:', error);
    res.status(500).json({ error: '获取学生列表失败' });
  }
});

// 获取学生绑定的家长信息
router.get('/my-parent', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT psb.*, u.phone, u.nickname, u.avatar_url 
       FROM parent_student_bindings psb
       JOIN users u ON psb.parent_id = u.id
       WHERE psb.student_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '未找到绑定的家长' });
    }

    res.json({ parent: result.rows[0] });
  } catch (error) {
    console.error('获取家长信息错误:', error);
    res.status(500).json({ error: '获取家长信息失败' });
  }
});

// 更新学生设备配置
router.put('/device-settings/:student_id', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { lock_screen_password, max_volume, silent_start_time, silent_end_time } = req.body;

    // 验证绑定关系
    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权操作该学生设备' });
    }

    // 更新配置
    await pool.query(
      `UPDATE parent_student_bindings 
       SET lock_screen_password = COALESCE($1, lock_screen_password),
           max_volume = COALESCE($2, max_volume),
           silent_start_time = COALESCE($3, silent_start_time),
           silent_end_time = COALESCE($4, silent_end_time),
           updated_at = CURRENT_TIMESTAMP
       WHERE student_id = $5`,
      [lock_screen_password, max_volume, silent_start_time, silent_end_time, student_id]
    );

    res.json({ message: '配置更新成功' });
  } catch (error) {
    console.error('更新设备配置错误:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

// 解绑学生
router.delete('/unbind-student/:student_id', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.params;

    await pool.query(
      'DELETE FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    res.json({ message: '解绑成功' });
  } catch (error) {
    console.error('解绑学生错误:', error);
    res.status(500).json({ error: '解绑失败' });
  }
});

module.exports = router;
