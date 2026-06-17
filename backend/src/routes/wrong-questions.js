const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth, studentOnly } = require('../middleware/auth');

// 添加错题
router.post('/', auth, studentOnly, [
  body('subject').notEmpty().withMessage('学科不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, question_content, question_image_url, answer_content, answer_image_url, difficulty } = req.body;
    const student_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO wrong_questions (student_id, subject, question_content, question_image_url, answer_content, answer_image_url, difficulty) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [student_id, subject, question_content, question_image_url, answer_content, answer_image_url, difficulty]
    );

    res.status(201).json({ message: '错题添加成功', question: result.rows[0] });
  } catch (error) {
    console.error('添加错题错误:', error);
    res.status(500).json({ error: '添加失败' });
  }
});

// 获取错题列表
router.get('/', auth, async (req, res) => {
  try {
    const { subject, difficulty, mastered, limit = 50 } = req.query;
    let query = 'SELECT * FROM wrong_questions WHERE student_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (subject) {
      query += ` AND subject = $${paramIndex}`;
      params.push(subject);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (mastered !== undefined) {
      query += ` AND mastered = $${paramIndex}`;
      params.push(mastered === 'true');
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC LIMIT $' + paramIndex;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ questions: result.rows });
  } catch (error) {
    console.error('获取错题列表错误:', error);
    res.status(500).json({ error: '获取列表失败' });
  }
});

// 更新错题
router.put('/:id', auth, studentOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { question_content, question_image_url, answer_content, answer_image_url, difficulty, mastered } = req.body;

    const existing = await pool.query(
      'SELECT * FROM wrong_questions WHERE id = $1 AND student_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '错题不存在' });
    }

    const result = await pool.query(
      `UPDATE wrong_questions 
       SET question_content = COALESCE($1, question_content),
           question_image_url = COALESCE($2, question_image_url),
           answer_content = COALESCE($3, answer_content),
           answer_image_url = COALESCE($4, answer_image_url),
           difficulty = COALESCE($5, difficulty),
           mastered = COALESCE($6, mastered),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [question_content, question_image_url, answer_content, answer_image_url, difficulty, mastered, id]
    );

    res.json({ message: '更新成功', question: result.rows[0] });
  } catch (error) {
    console.error('更新错题错误:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 删除错题
router.delete('/:id', auth, studentOnly, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM wrong_questions WHERE id = $1 AND student_id = $2',
      [id, req.user.id]
    );

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除错题错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 标记为已掌握
router.put('/:id/master', auth, studentOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE wrong_questions 
       SET mastered = true, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND student_id = $2 
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '错题不存在' });
    }

    res.json({ message: '标记成功', question: result.rows[0] });
  } catch (error) {
    console.error('标记错题错误:', error);
    res.status(500).json({ error: '标记失败' });
  }
});

module.exports = router;
