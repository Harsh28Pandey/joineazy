const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const config = require('../config');

// Register a new student or admin
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', studentId, department } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr-' + uuidv4().slice(0, 8);

    const result = await db.query(
      `INSERT INTO users (id, name, email, password_hash, role, student_id, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, student_id, department, created_at`,
      [userId, name.trim(), normalizedEmail, passwordHash, role, studentId || null, department || 'General']
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const result = await db.query(
      `SELECT id, name, email, password_hash, role, student_id, department, created_at
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    // Sanitize user object (omit password_hash)
    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      student_id: user.student_id,
      department: user.department,
      created_at: user.created_at
    };

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: sanitizedUser
    });
  } catch (error) {
    next(error);
  }
};

// Get current logged-in user profile & memberships
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResult = await db.query(
      `SELECT id, name, email, role, student_id, department, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Fetch user's groups
    const groupsResult = await db.query(
      `SELECT g.id, g.name, g.description, g.join_code, gm.role_in_group, gm.joined_at
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      user: {
        ...user,
        groups: groupsResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// List students (for search/invite to group)
const getStudents = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const queryTerm = `%${search.toLowerCase().trim()}%`;

    let sql = `SELECT id, name, email, student_id, department, created_at FROM users WHERE role = 'student'`;
    let params = [];

    if (search.trim()) {
      sql += ` AND (LOWER(name) LIKE $1 OR LOWER(email) LIKE $1 OR LOWER(COALESCE(student_id, '')) LIKE $1)`;
      params = [queryTerm];
    }

    sql += ` ORDER BY name ASC LIMIT 50`;

    const result = await db.query(sql, params);

    res.json({
      success: true,
      count: result.rows.length,
      students: result.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  getStudents
};
