const { getPool } = require('../_lib/db');
const { success, error, handleOptions } = require('../_lib/respond');
const { getAuthUser } = require('../_lib/auth');

/**
 * Serverless function to get authenticated user's name
 * GET /api/events/me
 * Returns: { name: string }
 */
module.exports = async (req, res) => {
  // Handle OPTIONS preflight
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return error(res, 'Method not allowed', 405);
  }

  try {
    // Authenticate user
    const user = getAuthUser(req);

    // Get database pool
    const pool = getPool();

    // Query user name
    const [[dbUser]] = await pool.query(
      'SELECT name FROM Users WHERE user_id = ?',
      [user.id]
    );

    if (!dbUser) {
      return error(res, 'User not found', 404);
    }

    return success(res, { name: dbUser.name || 'User' });
  } catch (err) {
    if (err.status === 401) {
      return error(res, err.message, 401);
    }
    console.error('Error fetching user name:', err);
    return error(res, 'Server error', 500);
  }
};
