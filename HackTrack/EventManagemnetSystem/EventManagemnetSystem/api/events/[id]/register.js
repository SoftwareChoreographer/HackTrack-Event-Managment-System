const { getPool } = require('../../_lib/db');
const { success, error, handleOptions } = require('../../_lib/respond');
const { getAuthUser } = require('../../_lib/auth');
const { applyRateLimit } = require('../../_lib/rateLimit');

/**
 * Serverless function to register/unregister for an event
 * POST /api/events/:id/register
 * Body: { is_attending: boolean }
 * Returns: { success: true, registered: boolean }
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

  try {
    // Authenticate user
    const user = getAuthUser(req);

    // Extract event ID from query parameter
    const eventId = req.query.id;
    const { is_attending } = req.body;

    // Validate parameters
    if (!eventId) {
      return error(res, 'Event ID is required', 400);
    }

    if (is_attending === undefined || is_attending === null) {
      return error(res, 'is_attending parameter is required', 400);
    }

    // Coerce is_attending to boolean (handle both boolean and string inputs)
    const isAttending = is_attending === true || is_attending === 'true' || is_attending === 1 || is_attending === '1';

    // Get database pool
    const pool = getPool();

    // Verify event exists
    const [[event]] = await pool.query(
      'SELECT event_id FROM Events WHERE event_id = ?',
      [eventId]
    );

    if (!event) {
      return error(res, 'Event not found', 404);
    }

    // UPSERT into EventAttendance
    await pool.query(
      `INSERT INTO EventAttendance (user_id, event_id, is_attending)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_attending = VALUES(is_attending)`,
      [user.id, eventId, isAttending]
    );

    return success(res, {
      success: true,
      registered: isAttending
    });
  } catch (err) {
    if (err.status === 401) {
      return error(res, err.message, 401);
    }
    console.error('Registration error:', err);
    return error(res, 'Registration failed', 500);
  }
};
