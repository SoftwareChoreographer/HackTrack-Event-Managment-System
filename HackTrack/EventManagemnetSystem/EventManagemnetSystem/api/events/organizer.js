const { getPool } = require('../_lib/db');
const { success, error, handleOptions } = require('../_lib/respond');
const { getAuthUser } = require('../_lib/auth');

/**
 * Serverless function to get events created by organizer
 * GET /api/events/organizer
 * Returns: Array of future events created by the authenticated organizer
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

    // Query organizer's future events
    const [events] = await pool.query(
      `SELECT
        e.event_id,
        e.name,
        e.date_time,
        e.location,
        e.description,
        e.image_data
      FROM Events e
      WHERE e.organizer_id = ?
        AND e.date_time > NOW()
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
    console.error('Error fetching organizer events:', err);
    return error(res, 'Server error', 500);
  }
};
