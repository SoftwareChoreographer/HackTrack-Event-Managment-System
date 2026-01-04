const { getPool } = require('../_lib/db');
const { success, error, handleOptions } = require('../_lib/respond');
const { getAuthUser } = require('../_lib/auth');

/**
 * Serverless function to get user notifications
 * GET /api/notifications
 * Returns: Array of notification objects
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

    // Query notifications
    const [notifications] = await pool.query(
      `SELECT
        n.id,
        n.type,
        n.title,
        n.message,
        n.created_at,
        n.event_id,
        e.name AS event_name
      FROM notifications n
      LEFT JOIN Events e ON n.event_id = e.event_id
      WHERE n.user_id IS NULL OR n.user_id = ?
      ORDER BY n.created_at DESC`,
      [user.id]
    );

    return success(res, notifications);
  } catch (err) {
    if (err.status === 401) {
      return error(res, err.message, 401);
    }
    console.error('Error fetching notifications:', err);
    return error(res, 'Server error', 500);
  }
};
