const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

// Verify JWT token and attach user to request
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    jwt.verify(token, config.jwtSecret, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token.'
        });
      }

      // Fetch user from DB to ensure still active
      const userResult = await db.query(
        'SELECT id, name, email, role, student_id, department FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists.'
        });
      }

      req.user = userResult.rows[0];
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Require specific role(s)
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role.`
      });
    }

    next();
  };
};

const requireAdmin = requireRole(['admin']);
const requireStudent = requireRole(['student']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireStudent
};
