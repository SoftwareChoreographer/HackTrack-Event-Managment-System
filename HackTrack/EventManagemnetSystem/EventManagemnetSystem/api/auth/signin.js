const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool } = require('../_lib/db');
const { success, error, handleOptions } = require('../_lib/respond');
const { applyRateLimit } = require('../_lib/rateLimit');

/**
 * Serverless function for user signin
 * POST /api/auth/signin
 * Body: { email, password }
 * Returns: { token, role, id }
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

  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email || !password || !email.trim() || !password.trim()) {
      return error(res, 'Email and password are required', 400);
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get database pool and query user
    const pool = getPool();
    const [Users] = await pool.query('SELECT * FROM Users WHERE email = ?', [normalizedEmail]);
    const user = Users[0];

    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }

    // Use bcrypt.compare for password verification
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return error(res, 'Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return success(res, { token, role: user.role, id: user.user_id }, 200);
  } catch (err) {
    console.error('Login error occurred');
    return error(res, 'Server error', 500);
  }
};
