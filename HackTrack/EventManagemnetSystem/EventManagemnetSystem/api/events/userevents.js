const { getPool } = require('../_lib/db');
const { success, error, handleOptions } = require('../_lib/respond');
const { getAuthUser } = require('../_lib/auth');

/**
 * Serverless function to get events user is attending
 * GET /api/events/userevents
 * Returns: Array of events user is attending (future events only)
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

    // Query events user is attending
    const [events] = await pool.query(
      `SELECT
        e.event_id,
        e.name AS event_name,
        e.date_time,
        e.location,
        e.image_data,
        e.organizer_id,
        e.description,
        u.name AS organizer_name,
        ea.is_attending
      FROM EventAttendance ea
      INNER JOIN Events e
        ON ea.event_id = e.event_id
        AND ea.user_id = ?
        AND ea.is_attending = TRUE
      INNER JOIN Users u
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
    console.error('Error fetching user events:', err);
    return error(res, 'Server error', 500);
  }
};
