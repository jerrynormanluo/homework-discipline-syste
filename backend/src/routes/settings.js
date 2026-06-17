const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth, parentOnly } = require('../middleware/auth');

// 获取拼音配置
router.get('/pinyin/:student_id', auth, parentOnly, async (req, res) => {
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
      'SELECT * FROM pinyin_settings WHERE student_id = $1',
      [student_id]
    );

    if (result.rows.length === 0) {
      const defaultSettings = await pool.query(
        `INSERT INTO pinyin_settings (parent_id, student_id, default_enabled, filter_common_chars) 
         VALUES ($1, $2, true, true) 
         RETURNING *`,
        [req.user.id, student_id]
      );
      return res.json({ settings: defaultSettings.rows[0] });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('获取拼音配置错误:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 更新拼音配置
router.put('/pinyin/:student_id', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { default_enabled, filter_common_chars } = req.body;

    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权修改该学生配置' });
    }

    const result = await pool.query(
      `UPDATE pinyin_settings 
       SET default_enabled = COALESCE($1, default_enabled),
           filter_common_chars = COALESCE($2, filter_common_chars),
           updated_at = CURRENT_TIMESTAMP
       WHERE student_id = $3
       RETURNING *`,
      [default_enabled, filter_common_chars, student_id]
    );

    if (result.rows.length === 0) {
      const newSettings = await pool.query(
        `INSERT INTO pinyin_settings (parent_id, student_id, default_enabled, filter_common_chars) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [req.user.id, student_id, default_enabled ?? true, filter_common_chars ?? true]
      );
      return res.json({ message: '配置创建成功', settings: newSettings.rows[0] });
    }

    res.json({ message: '配置更新成功', settings: result.rows[0] });
  } catch (error) {
    console.error('更新拼音配置错误:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

// 获取语音配置
router.get('/voice/:student_id', auth, parentOnly, async (req, res) => {
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
      'SELECT * FROM voice_settings WHERE student_id = $1',
      [student_id]
    );

    if (result.rows.length === 0) {
      const defaultSettings = await pool.query(
        `INSERT INTO voice_settings (parent_id, student_id, auto_play_new_homework, auto_play_content, auto_play_reminder, auto_play_reward, auto_play_rest) 
         VALUES ($1, $2, true, true, true, true, true) 
         RETURNING *`,
        [req.user.id, student_id]
      );
      return res.json({ settings: defaultSettings.rows[0] });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('获取语音配置错误:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 更新语音配置
router.put('/voice/:student_id', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { auto_play_new_homework, auto_play_content, auto_play_reminder, auto_play_reward, auto_play_rest, speech_rate, voice_type } = req.body;

    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权修改该学生配置' });
    }

    const result = await pool.query(
      `UPDATE voice_settings 
       SET auto_play_new_homework = COALESCE($1, auto_play_new_homework),
           auto_play_content = COALESCE($2, auto_play_content),
           auto_play_reminder = COALESCE($3, auto_play_reminder),
           auto_play_reward = COALESCE($4, auto_play_reward),
           auto_play_rest = COALESCE($5, auto_play_rest),
           speech_rate = COALESCE($6, speech_rate),
           voice_type = COALESCE($7, voice_type),
           updated_at = CURRENT_TIMESTAMP
       WHERE student_id = $8
       RETURNING *`,
      [auto_play_new_homework, auto_play_content, auto_play_reminder, auto_play_reward, auto_play_rest, speech_rate, voice_type, student_id]
    );

    if (result.rows.length === 0) {
      const newSettings = await pool.query(
        `INSERT INTO voice_settings (parent_id, student_id, auto_play_new_homework, auto_play_content, auto_play_reminder, auto_play_reward, auto_play_rest) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [req.user.id, student_id, auto_play_new_homework ?? true, auto_play_content ?? true, auto_play_reminder ?? true, auto_play_reward ?? true, auto_play_rest ?? true]
      );
      return res.json({ message: '配置创建成功', settings: newSettings.rows[0] });
    }

    res.json({ message: '配置更新成功', settings: result.rows[0] });
  } catch (error) {
    console.error('更新语音配置错误:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

module.exports = router;
