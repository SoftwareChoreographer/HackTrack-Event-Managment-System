const { getPool } = require('../../_lib/db');
const { success, error, handleOptions } = require('../../_lib/respond');

/**
 * Serverless function to get reviews for an event
 * GET /api/reviews/:eventId/review
 * Returns: { success: true, data: Array<Review> }
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
    // Extract event ID from query parameter
    const eventId = req.query.eventId;

    if (!eventId) {
      return error(res, 'Event ID is required', 400);
    }

    // Get database pool
    const pool = getPool();

    // Query reviews for the event
    const [reviews] = await pool.query(
      `SELECT
        feedback_id AS id,
        title,
        rating,
        pros,
        cons,
        comment AS reviewText,
        submitted_at AS date
      FROM Reviews
      WHERE event_id = ?
      ORDER BY submitted_at DESC`,
      [eventId]
    );

    // Format response
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      title: review.title,
      rating: review.rating,
      pros: review.pros,
      cons: review.cons,
      reviewText: review.reviewText,
      date: review.date
    }));

    return success(res, {
      success: true,
      data: formattedReviews
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return error(res, 'Failed to fetch reviews', 500);
  }
};
