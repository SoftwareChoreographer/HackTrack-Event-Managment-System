const { getPool } = require('../_lib/db');
const { success, error, handleOptions } = require('../_lib/respond');
const { getAuthUser } = require('../_lib/auth');

/**
 * Serverless function to get upcoming events for user page
 * GET /api/events/userpage
 * Returns: Array of events with organizer_name and is_attending
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

    // Query upcoming events with attendance status
    const [events] = await pool.query(
      `SELECT
        e.event_id,
        e.name AS name,
        u.name AS organizer_name,
        e.date_time,
        e.location,
        e.image_data,
        e.organizer_id,
        ea.is_attending
      FROM Events e
      LEFT JOIN EventAttendance ea
        ON e.event_id = ea.event_id
        AND ea.user_id = ?
      LEFT JOIN Users u
        ON e.organizer_id = u.user_id
      WHERE e.date_time > NOW()
      ORDER BY e.date_time ASC`,
      [user.id]
    );

    // Process events to convert image_data to image_url
    const processedEvents = events.map(event => {
      const { image_data, ...rest } = event;
      return {
        ...rest,
        image_url: image_data
          ? `data:image/png;base64,${image_data.toString('base64')}`
          : null
      };
    });

    return success(res, processedEvents);
  } catch (err) {
    if (err.status === 401) {
      return error(res, err.message, 401);
    }
    console.error('Error fetching user page events:', err);
    return error(res, 'Server error', 500);
  }
};
