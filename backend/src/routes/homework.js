const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth, parentOnly, studentOnly } = require('../middleware/auth');

// 创建作业
router.post('/', auth, parentOnly, [
  body('title').notEmpty().withMessage('作业标题不能为空'),
  body('subject').notEmpty().withMessage('学科不能为空'),
  body('category').isIn(['school', 'extra', 'recitation', 'wrong_questions', 'reading']).withMessage('作业分类不正确'),
  body('deadline').isISO8601().withMessage('截止时间格式不正确'),
  body('priority').isIn(['high', 'medium', 'low']).withMessage('优先级不正确'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, subject, content, category, estimated_duration, deadline, priority, student_id, attachment_urls, voice_note_url } = req.body;
    const parent_id = req.user.id;

    // 验证绑定关系
    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [parent_id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权为该学生创建作业' });
    }

    const result = await pool.query(
      `INSERT INTO homework 
       (parent_id, student_id, title, subject, content, category, estimated_duration, deadline, priority, attachment_urls, voice_note_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [parent_id, student_id, title, subject, content, category, estimated_duration, deadline, priority, attachment_urls || [], voice_note_url]
    );

    const homework = result.rows[0];

    // 通过Socket.io通知学生端(Vercel Serverless环境不支持)
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('homework:created', { homework, student_id });
      }
    } catch (socketError) {
      console.log('Socket.io通知失败(正常):', socketError.message);
    }

    res.status(201).json({ message: '作业创建成功', homework });
  } catch (error) {
    console.error('创建作业错误:', error);
    res.status(500).json({ error: '创建作业失败' });
  }
});

// 批量创建作业
router.post('/batch', auth, parentOnly, async (req, res) => {
  try {
    const { homeworks } = req.body; // [{title, subject, content, category, estimated_duration, deadline, priority, student_id}]
    const parent_id = req.user.id;

    if (!Array.isArray(homeworks) || homeworks.length === 0) {
      return res.status(400).json({ error: '作业列表不能为空' });
    }

    const createdHomeworks = [];

    for (const hw of homeworks) {
      // 验证绑定关系
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [parent_id, hw.student_id]
      );

      if (binding.rows.length === 0) {
        continue;
      }

      const result = await pool.query(
        `INSERT INTO homework 
         (parent_id, student_id, title, subject, content, category, estimated_duration, deadline, priority) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [parent_id, hw.student_id, hw.title, hw.subject, hw.content, hw.category, hw.estimated_duration, hw.deadline, hw.priority]
      );

      createdHomeworks.push(result.rows[0]);
    }

    res.status(201).json({ message: '批量创建成功', homeworks: createdHomeworks });
  } catch (error) {
    console.error('批量创建作业错误:', error);
    res.status(500).json({ error: '批量创建失败' });
  }
});

// 获取作业列表
router.get('/', auth, async (req, res) => {
  try {
    const { student_id, status, category, date } = req.query;
    let query = 'SELECT * FROM homework WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (req.user.role === 'parent') {
      // 家长查看自己发布的作业
      query += ` AND parent_id = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    } else {
      // 学生查看自己的作业
      query += ` AND student_id = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }

    if (student_id) {
      query += ` AND student_id = $${paramIndex}`;
      params.push(student_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (date) {
      query += ` AND DATE(deadline) = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    query += ' ORDER BY priority DESC, deadline ASC';

    const result = await pool.query(query, params);
    res.json({ homeworks: result.rows });
  } catch (error) {
    console.error('获取作业列表错误:', error);
    res.status(500).json({ error: '获取作业列表失败' });
  }
});

// 获取单个作业详情
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM homework WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在' });
    }

    const homework = result.rows[0];

    // 权限验证
    if (req.user.role === 'parent' && homework.parent_id !== req.user.id) {
      return res.status(403).json({ error: '无权查看该作业' });
    }

    if (req.user.role === 'student' && homework.student_id !== req.user.id) {
      return res.status(403).json({ error: '无权查看该作业' });
    }

    res.json({ homework });
  } catch (error) {
    console.error('获取作业详情错误:', error);
    res.status(500).json({ error: '获取作业详情失败' });
  }
});

// 更新作业
router.put('/:id', auth, parentOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, content, category, estimated_duration, deadline, priority, status, attachment_urls, voice_note_url } = req.body;

    // 验证作业所有权
    const existing = await pool.query(
      'SELECT * FROM homework WHERE id = $1 AND parent_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在或无权修改' });
    }

    const result = await pool.query(
      `UPDATE homework 
       SET title = COALESCE($1, title),
           subject = COALESCE($2, subject),
           content = COALESCE($3, content),
           category = COALESCE($4, category),
           estimated_duration = COALESCE($5, estimated_duration),
           deadline = COALESCE($6, deadline),
           priority = COALESCE($7, priority),
           status = COALESCE($8, status),
           attachment_urls = COALESCE($9, attachment_urls),
           voice_note_url = COALESCE($10, voice_note_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [title, subject, content, category, estimated_duration, deadline, priority, status, attachment_urls, voice_note_url, id]
    );

    const homework = result.rows[0];

    // 通过Socket.io通知学生端
    const io = req.app.get('io');
    io.emit('homework:updated', { homework, student_id: homework.student_id });

    res.json({ message: '作业更新成功', homework });
  } catch (error) {
    console.error('更新作业错误:', error);
    res.status(500).json({ error: '更新作业失败' });
  }
});

// 学生更新作业状态
router.patch('/:id/status', auth, studentOnly, [
  body('status').isIn(['not_started', 'in_progress', 'completed']).withMessage('状态不正确'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // 验证作业所有权
    const existing = await pool.query(
      'SELECT * FROM homework WHERE id = $1 AND student_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在或无权修改' });
    }

    const homework = existing.rows[0];
    let updateData = { status };

    if (status === 'in_progress' && homework.status !== 'in_progress') {
      updateData.started_at = new Date();
    }

    if (status === 'completed' && homework.status !== 'completed') {
      updateData.completed_at = new Date();
      updateData.actual_duration = Math.floor((new Date() - homework.started_at) / 60000);
    }

    const result = await pool.query(
      `UPDATE homework 
       SET status = $1,
           started_at = COALESCE($2, started_at),
           completed_at = COALESCE($3, completed_at),
           actual_duration = COALESCE($4, actual_duration),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [status, updateData.started_at || null, updateData.completed_at || null, updateData.actual_duration || null, id]
    );

    // 通过Socket.io通知家长端(Vercel Serverless环境不支持)
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('homework:status_updated', { homework: result.rows[0], parent_id: homework.parent_id });
      }
    } catch (socketError) {
      console.log('Socket.io通知失败(正常):', socketError.message);
    }

    res.json({ message: '状态更新成功', homework: result.rows[0] });
  } catch (error) {
    console.error('更新作业状态错误:', error);
    res.status(500).json({ error: '更新状态失败' });
  }
});

// 删除作业
router.delete('/:id', auth, parentOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证作业所有权
    const existing = await pool.query(
      'SELECT * FROM homework WHERE id = $1 AND parent_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '作业不存在或无权删除' });
    }

    const homework = existing.rows[0];

    await pool.query('DELETE FROM homework WHERE id = $1', [id]);

    // 通过Socket.io通知学生端
    const io = req.app.get('io');
    io.emit('homework:deleted', { homework_id: id, student_id: homework.student_id });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除作业错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 清空已完成作业
router.delete('/completed/clear', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: '学生ID不能为空' });
    }

    // 验证绑定关系
    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权操作该学生作业' });
    }

    await pool.query(
      'DELETE FROM homework WHERE student_id = $1 AND status = $2',
      [student_id, 'completed']
    );

    res.json({ message: '清空成功' });
  } catch (error) {
    console.error('清空作业错误:', error);
    res.status(500).json({ error: '清空失败' });
  }
});

// 保存作业模板
router.post('/templates', auth, parentOnly, async (req, res) => {
  try {
    const { name, title, subject, content, category, estimated_duration, priority } = req.body;
    const parent_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO homework_templates 
       (parent_id, name, title, subject, content, category, estimated_duration, priority) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [parent_id, name, title, subject, content, category, estimated_duration, priority]
    );

    res.status(201).json({ message: '模板保存成功', template: result.rows[0] });
  } catch (error) {
    console.error('保存模板错误:', error);
    res.status(500).json({ error: '保存模板失败' });
  }
});

// 获取作业模板列表
router.get('/templates', auth, parentOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM homework_templates WHERE parent_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ templates: result.rows });
  } catch (error) {
    console.error('获取模板列表错误:', error);
    res.status(500).json({ error: '获取模板列表失败' });
  }
});

module.exports = router;
