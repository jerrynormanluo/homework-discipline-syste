const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的认证令牌' });
  }
};

const parentOnly = (req, res, next) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: '需要家长权限' });
  }
  next();
};

const studentOnly = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: '需要学生权限' });
  }
  next();
};

module.exports = { auth, parentOnly, studentOnly };
