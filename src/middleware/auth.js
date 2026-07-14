// src/middleware/auth.js — JWT + school context
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ success: false, code: 'no_token' });

  try {
    const payload   = jwt.verify(token, process.env.JWT_SECRET);
    req.user        = payload;
    req.schoolId    = payload.schoolId || null; // Multi-tenant context
    req.userId      = payload.userId;
    req.role        = payload.role;
    next();
  } catch {
    res.status(401).json({ success: false, code: 'invalid_token' });
  }
};
