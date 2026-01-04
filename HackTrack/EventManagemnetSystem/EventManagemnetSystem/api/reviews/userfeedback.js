const { getPool } = require('../_lib/db');
const { success, error, handleOptions } = require('../_lib/respond');
const { getAuthUser } = require('../_lib/auth');
const { applyRateLimit } = require('../_lib/rateLimit');

/**
 * Serverless function to submit user feedback/review for an event
 * POST /api/reviews/userfeedback
 * Body: { eventId, title, rating, pros, cons, reviewText }
 * Returns: { success: true, message: string }
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

    const { eventId, title, rating, pros, cons, reviewText } = req.body;

    // Validate required fields
    if (!eventId || !title || !rating) {
      return error(res, 'Event ID, title, and rating are required', 400);
    }

    // Validate rating is a number and within range
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return error(res, 'Rating must be a number between 1 and 5', 400);
    }

    // Get database pool
    const pool = getPool();

    // Verify attendance
    const [attendance] = await pool.query(
      `SELECT 1 FROM EventAttendance
       WHERE user_id = ? AND event_id = ? AND is_attending = true`,
      [user.id, eventId]
    );

    if (!attendance.length) {
      return error(res, 'You must attend the event to review it', 403);
    }

    // Insert review
    await pool.query(
      `INSERT INTO Reviews
       (event_id, user_id, title, rating, pros, cons, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        user.id,
        title,
        numericRating,
        pros || null,
        cons || null,
        reviewText || null
      ]
    );

    // Create feedback notification
    await pool.query(
      `INSERT INTO notifications
       (user_id, type, title, message, event_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.id,
        'feedback',
        'Feedback Received',
        'Thank you for your feedback! We value your input.',
        eventId
      ]
    );

    return success(res, {
      success: true,
      message: 'Review submitted successfully'
    });
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      return error(res, err.message, err.status);
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return error(res, 'You already reviewed this event', 400);
    }
    console.error('Review submission error:', err);
    return error(res, 'Failed to submit review', 500);
  }
};
