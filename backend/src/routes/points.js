const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth, parentOnly, studentOnly } = require('../middleware/auth');

// 获取学生当前积分
router.get('/balance/:student_id', auth, async (req, res) => {
  try {
    const { student_id } = req.params;

    // 权限验证
    if (req.user.role === 'parent') {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, student_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权查看该学生积分' });
      }
    } else if (req.user.role === 'student' && req.user.id !== parseInt(student_id)) {
      return res.status(403).json({ error: '无权查看其他学生积分' });
    }

    // 计算当前积分
    const result = await pool.query(
      `SELECT COALESCE(SUM(points_change), 0) as balance 
       FROM point_records 
       WHERE student_id = $1`,
      [student_id]
    );

    res.json({ balance: parseInt(result.rows[0].balance) || 0 });
  } catch (error) {
    console.error('获取积分余额错误:', error);
    res.status(500).json({ error: '获取积分失败' });
  }
});

// 获取积分记录
router.get('/records/:student_id', auth, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { limit = 50 } = req.query;

    // 权限验证
    if (req.user.role === 'parent') {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, student_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权查看该学生记录' });
      }
    } else if (req.user.role === 'student' && req.user.id !== parseInt(student_id)) {
      return res.status(403).json({ error: '无权查看其他学生记录' });
    }

    const result = await pool.query(
      `SELECT pr.*, hw.title as homework_title 
       FROM point_records pr
       LEFT JOIN homework hw ON pr.homework_id = hw.id
       WHERE pr.student_id = $1
       ORDER BY pr.created_at DESC
       LIMIT $2`,
      [student_id, limit]
    );

    res.json({ records: result.rows });
  } catch (error) {
    console.error('获取积分记录错误:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

// 创建积分规则
router.post('/rules', auth, parentOnly, [
  body('student_id').isInt().withMessage('学生ID必须是整数'),
  body('rule_type').isIn(['add', 'deduct']).withMessage('规则类型不正确'),
  body('rule_name').notEmpty().withMessage('规则名称不能为空'),
  body('points').isInt().withMessage('积分必须是整数'),
  body('condition').notEmpty().withMessage('触发条件不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, rule_type, rule_name, points, condition } = req.body;

    // 验证绑定关系
    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权为该学生创建规则' });
    }

    const result = await pool.query(
      `INSERT INTO point_rules (parent_id, student_id, rule_type, rule_name, points, condition) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.user.id, student_id, rule_type, rule_name, points, condition]
    );

    res.status(201).json({ message: '规则创建成功', rule: result.rows[0] });
  } catch (error) {
    console.error('创建积分规则错误:', error);
    res.status(500).json({ error: '创建规则失败' });
  }
});

// 获取积分规则列表
router.get('/rules/:student_id', auth, parentOnly, async (req, res) => {
  try {
    const { student_id } = req.params;

    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权查看该学生规则' });
    }

    const result = await pool.query(
      'SELECT * FROM point_rules WHERE student_id = $1 ORDER BY created_at DESC',
      [student_id]
    );

    res.json({ rules: result.rows });
  } catch (error) {
    console.error('获取积分规则错误:', error);
    res.status(500).json({ error: '获取规则失败' });
  }
});

// 手动添加/扣除积分
router.post('/manual', auth, parentOnly, [
  body('student_id').isInt().withMessage('学生ID必须是整数'),
  body('points').isInt().withMessage('积分必须是整数'),
  body('reason').notEmpty().withMessage('原因不能为空'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, points, reason, homework_id } = req.body;

    // 验证绑定关系
    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权操作该学生积分' });
    }

    // 获取当前积分
    const balanceResult = await pool.query(
      `SELECT COALESCE(SUM(points_change), 0) as balance 
       FROM point_records 
       WHERE student_id = $1`,
      [student_id]
    );
    const currentBalance = parseInt(balanceResult.rows[0].balance) || 0;

    // 创建积分记录
    const result = await pool.query(
      `INSERT INTO point_records (student_id, points_change, balance_after, reason, homework_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [student_id, points, currentBalance + points, reason, homework_id || null]
    );

    res.status(201).json({ message: '积分操作成功', record: result.rows[0] });
  } catch (error) {
    console.error('手动积分操作错误:', error);
    res.status(500).json({ error: '积分操作失败' });
  }
});

// 创建奖励
router.post('/rewards', auth, parentOnly, [
  body('student_id').isInt().withMessage('学生ID必须是整数'),
  body('name').notEmpty().withMessage('奖励名称不能为空'),
  body('points_required').isInt().withMessage('所需积分必须是整数'),
  body('reward_type').isIn(['entertainment_time', 'outdoor_activity', 'gift', 'no_extra_homework']).withMessage('奖励类型不正确'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, name, description, points_required, reward_type } = req.body;

    const binding = await pool.query(
      'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
      [req.user.id, student_id]
    );

    if (binding.rows.length === 0) {
      return res.status(403).json({ error: '无权为该学生创建奖励' });
    }

    const result = await pool.query(
      `INSERT INTO rewards (parent_id, student_id, name, description, points_required, reward_type) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.user.id, student_id, name, description, points_required, reward_type]
    );

    res.status(201).json({ message: '奖励创建成功', reward: result.rows[0] });
  } catch (error) {
    console.error('创建奖励错误:', error);
    res.status(500).json({ error: '创建奖励失败' });
  }
});

// 获取奖励列表
router.get('/rewards/:student_id', auth, async (req, res) => {
  try {
    const { student_id } = req.params;

    if (req.user.role === 'parent') {
      const binding = await pool.query(
        'SELECT id FROM parent_student_bindings WHERE parent_id = $1 AND student_id = $2',
        [req.user.id, student_id]
      );
      if (binding.rows.length === 0) {
        return res.status(403).json({ error: '无权查看该学生奖励' });
      }
    } else if (req.user.role === 'student' && req.user.id !== parseInt(student_id)) {
      return res.status(403).json({ error: '无权查看其他学生奖励' });
    }

    const result = await pool.query(
      'SELECT * FROM rewards WHERE student_id = $1 AND is_active = true ORDER BY points_required ASC',
      [student_id]
    );

    res.json({ rewards: result.rows });
  } catch (error) {
    console.error('获取奖励列表错误:', error);
    res.status(500).json({ error: '获取奖励失败' });
  }
});

// 兑换奖励
router.post('/redeem', auth, studentOnly, [
  body('reward_id').isInt().withMessage('奖励ID必须是整数'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reward_id } = req.body;
    const student_id = req.user.id;

    // 获取奖励信息
    const rewardResult = await pool.query(
      'SELECT * FROM rewards WHERE id = $1 AND student_id = $2 AND is_active = true',
      [reward_id, student_id]
    );

    if (rewardResult.rows.length === 0) {
      return res.status(404).json({ error: '奖励不存在或不可兑换' });
    }

    const reward = rewardResult.rows[0];

    // 获取当前积分
    const balanceResult = await pool.query(
      `SELECT COALESCE(SUM(points_change), 0) as balance 
       FROM point_records 
       WHERE student_id = $1`,
      [student_id]
    );
    const currentBalance = parseInt(balanceResult.rows[0].balance) || 0;

    if (currentBalance < reward.points_required) {
      return res.status(400).json({ error: '积分不足' });
    }

    // 创建兑换记录
    const redemptionResult = await pool.query(
      `INSERT INTO redemption_records (student_id, reward_id, points_cost, status) 
       VALUES ($1, $2, $3, 'pending') 
       RETURNING *`,
      [student_id, reward_id, reward.points_required]
    );

    // 扣除积分
    await pool.query(
      `INSERT INTO point_records (student_id, points_change, balance_after, reason) 
       VALUES ($1, $2, $3, $4)`,
      [student_id, -reward.points_required, currentBalance - reward.points_required, `兑换奖励: ${reward.name}`]
    );

    res.status(201).json({ message: '兑换申请已提交，等待家长审核', redemption: redemptionResult.rows[0] });
  } catch (error) {
    console.error('兑换奖励错误:', error);
    res.status(500).json({ error: '兑换失败' });
  }
});

// 审核兑换申请
router.put('/redeem/:id/approve', auth, parentOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '状态不正确' });
    }

    const result = await pool.query(
      `UPDATE redemption_records 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '兑换记录不存在' });
    }

    res.json({ message: '审核完成', redemption: result.rows[0] });
  } catch (error) {
    console.error('审核兑换错误:', error);
    res.status(500).json({ error: '审核失败' });
  }
});

module.exports = router;
