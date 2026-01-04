const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool } = require('../_lib/db');
const { success, error, handleOptions } = require('../_lib/respond');
const { applyRateLimit } = require('../_lib/rateLimit');

/**
 * Serverless function for user signup
 * POST /api/auth/signup
 * Body: { name, email, password }
 * Returns: { token, role, id, name }
 */
module.exports = async (req, res) => {
  // Handle OPTIONS preflight
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  // Apply rate limiting
  if (applyRateLimit(req, res)) {
    return;
  }

  const { name, email, password } = req.body;
  const saltRounds = 10;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return error(res, 'All fields are required', 400);
    }

    // Validate name length
    if (name.length < 2 || name.length > 50) {
      return error(res, 'Name must be between 2-50 characters', 400);
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get database pool
    const pool = getPool();

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM Users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return error(res, 'Email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), normalizedEmail, hashedPassword, 'User']
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        role: 'User'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return success(res, {
      token,
      name: name.trim(),
      id: result.insertId,
      role: 'User'
    }, 201);
  } catch (err) {
    console.error('Signup error:', err.message);
    return error(res, 'Registration failed', 500);
  }
};
