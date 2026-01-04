// notifications.js
const express = require('express');
const router = express.Router();
const pool = require('../database');
const authenticate = require('./middleware');

router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        const [notifications] = await pool.query(`
            SELECT 
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
            ORDER BY n.created_at DESC
        `, [userId]);

        res.json(notifications);

    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;