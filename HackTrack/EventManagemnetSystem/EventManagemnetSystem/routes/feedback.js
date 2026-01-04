const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticate } = require('./middleware');

const verifyAttendance = async (req, res, next) => {
    try{
        const {eventId} = req.body;
        const [attendance] = await pool.query(
            `SELECT 1 FROM EventAttendance
             WHERE user_id = ? AND event_id = ? AND is_attending = true`,
            [req.user.id, eventId]
        );

        if(!attendance.length){
            return res.status(403).json({
                error: 'You must attend the event to review it'
            });
        }

        next();

    }catch (err) {
        console.error('Attendance verification error: ', err);
        res.status(500).json({ error: 'Failed to verify attendance' });
    }
};

router.post('/userfeedback',
    authenticate,
    verifyAttendance,
    async (req, res) => {
    try{
        const { eventId, title, rating, pros, cons, reviewText } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!eventId || !title || !rating) {
            return res.status(400).json({ error: 'Event ID, title, and rating are required' });
        }

        // Validate rating is a number and within range
        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
        }

        const [result] = await pool.query(
            `INSERT INTO Reviews
                 (event_id, user_id, title, rating, pros, cons, comment)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                eventId,
                userId,
                title,
                numericRating,
                pros || null,
                cons || null,
                reviewText || null
            ]
        );

        //Create feedback notification
        await pool.query(
            `INSERT INTO notifications 
             (user_id, type, title, message, event_id)
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                'feedback',
                'Feedback Received',
                'Thank you for your feedback! We value your input.',
                eventId
            ]
        );


        res.json({
            success: true,
            message: 'Anonymous review submitted successfully'
        });

    }catch (err) {
        if(err.code === 'ER_DUP_ENTRY'){
            return res.status(400).json({ error: 'You already reviewed this event' });

        }
        console.error('Review submission error: ', err.message);
        res.status(500).json({ error: 'Failed to submit review' })
    }
});

router.get('/:eventId/review', async (req, res) => {
    try{
        const eventId = req.params.eventId;

        const [review] = await pool.query(
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

        res.json({
            success: true,
            data: review.map(review => ({
                id: review.id,
                title: review.title,
                rating: review.rating,
                pros: review.pros,
                cons: review.cons,
                reviewText: review.reviewText,
                date: review.date
            }))
        })
    }catch (err) {
        console.error('Error fetching review: ', err.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviews'
        })
    }
});

module.exports = router;