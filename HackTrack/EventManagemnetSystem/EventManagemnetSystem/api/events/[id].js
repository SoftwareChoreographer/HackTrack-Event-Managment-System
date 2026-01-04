const { getPool } = require('../_lib/db');
const { success, error, handleOptions } = require('../_lib/respond');
const { getAuthUser } = require('../_lib/auth');

/**
 * Serverless function to get single event details
 * GET /api/events/:id
 * Returns: Single event object with details
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

    // Extract event ID from query parameter (Vercel uses req.query for dynamic routes)
    const eventId = req.query.id;

    if (!eventId) {
      return error(res, 'Event ID is required', 400);
    }

    // Get database pool
    const pool = getPool();

    // Query single event
    const [[evt]] = await pool.query(
      `SELECT
        e.event_id AS eventid,
        e.name AS name,
        e.description AS description,
        e.date_time AS date_time,
        e.location AS location,
        e.image_data AS image_data
      FROM Events e
      WHERE e.event_id = ?`,
      [eventId]
    );

    if (!evt) {
      return error(res, 'Event not found', 404);
    }

    // Process event to convert image_data to image_url
    const eventDetail = {
      eventid: evt.eventid,
      name: evt.name,
      description: evt.description,
      date_time: evt.date_time,
      location: evt.location,
      image_url: evt.image_data
        ? `data:image/png;base64,${evt.image_data.toString('base64')}`
        : null
    };

    return success(res, eventDetail);
  } catch (err) {
    if (err.status === 401) {
      return error(res, err.message, 401);
    }
    console.error('Error fetching event detail:', err);
    return error(res, 'Server error', 500);
  }
};
