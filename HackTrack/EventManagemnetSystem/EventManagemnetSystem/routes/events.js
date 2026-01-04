const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticate } = require('./middleware');
const multer = require('multer');

//configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });


router.post('/create-events', authenticate, upload.single('image_data'), async (req, res) => {
    try {
        const { name, description, location, date_time } = req.body;
        const organizer_id = req.user.id;
        const isoRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

        if (!isoRegex.test(req.body.date_time)) {
            return res.status(400).json({ error: 'Invalid datetime format' });
        }

        if (!name || !description || !location || !date_time) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const formattedDateTime = date_time.replace('T', ' ');

        const [result] = await pool.query(
            `INSERT INTO Events
                 (name, description, date_time, location, image_data, organizer_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.body.name,
                req.body.description,
                req.body.date_time,
                req.body.location,
                req.file ? req.file.buffer : null,
                req.user.id
            ]
        );

        //Get created evet details
        const [events] = await pool.query(
            `SELECT name, created_at 
             FROM Events 
             WHERE event_id = ?`,
            [result.insertId]
        ); 
        const newEvent = events[0];

        // Create system-wide notification
        await pool.query(
            `INSERT INTO notifications 
             (event_id, type, title, message, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [
                result.insertId,    // event_id
                'event',            // type
                'New Event Added', // title
                `We've just listed "${newEvent.name}". Check it out on the homepage!`, // message
                newEvent.created_at // timestamp from event
            ]
        );

        res.status(201).json({
            success: true,
            eventId: result.insertId,
            message: 'Event created successfully',
            notification: {
                title: 'New Event Added',
                message: `We've just listed "${newEvent.name}". Check it out on the homepage!`,
                timestamp: newEvent.created_at
            }
        });

    } catch (err) {
        console.error('Event creation error: ', err);
        res.status(500).json({
            error: 'Failed to create event',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});


/**
 * GET /api/events/organizer
 * Returns future events created by the authenticated organiser
 */
router.get('/organizer', authenticate, async (req, res) => {
    try {
      const organiserId = req.user.id;
      const [events] = await pool.query(
        `SELECT
           e.event_id      AS eventid,
           e.name          AS name,
           e.date_time     AS date_time,
           e.location      AS location,
           e.description   AS description,
           e.image_data    AS image_data
         FROM Events e
         WHERE e.organizer_id = ?
           AND e.date_time > NOW()
         ORDER BY e.date_time ASC`,
        [organiserId]
      );
  
      const processedEvents = events.map((evt) => ({
        eventid:       evt.eventid,
        name:          evt.name,
        date_time:     evt.date_time,
        location:      evt.location,
        description:   evt.description,
        image_url:     evt.image_data
                         ? `data:image/png;base64,${evt.image_data.toString('base64')}`
                         : null,
      }));

  
      res.json(processedEvents);
    } catch (err) {
      console.error('Error fetching organiser events:', err);
      res.status(500).json({ error: 'Server error' });
    }

  });

  /**
 * GET /api/events/:id
 * Returns details for a single event (used by UserEventDetails.js)
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
      const eventId = req.params.id;
      const [[evt]] = await pool.query(
        `SELECT
           e.event_id    AS eventid,
           e.name        AS name,
           e.description AS description,
           e.date_time   AS date_time,
           e.location    AS location,
           e.image_data  AS image_data
         FROM Events e
         WHERE e.event_id = ?`,
        [eventId]
      );
  
      if (!evt) {
        return res.status(404).json({ error: 'Event not found' });
      }
  
      const eventDetail = {
        eventid:     evt.eventid,
        name:        evt.name,
        description: evt.description,
        date_time:   evt.date_time,
        location:    evt.location,
        image_url:   evt.image_data
                       ? `data:image/png;base64,${evt.image_data.toString('base64')}`
                       : null,
      };
  
      res.json(eventDetail);
    } catch (err) {
      console.error('Error fetching event detail:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

router.get('/userpage', authenticate, async  (req, res) => {
    try{
        console.log('Received request for user events');
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
        ORDER BY e.date_time ASC`, [req.user.id]
        );

        const processedEvents = events.map(event => ({
            ...event,
            image_url: event.image_data
                ? `data:image/png;base64,${event.image_data.toString('base64')}`
                : null
        }));

        res.json(processedEvents);

    }catch (err) {
        console.error(err);
        res.status(500).json({error: 'Server error'});
    }
});

router.get('/me', authenticate, async (req, res) => {
    try {
        const [[user]] = await pool.query(
            'SELECT name FROM Users WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ name: user?.name || 'User' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/userevents', authenticate, async  (req, res) => {
    try{
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
            [req.user.id]
        );

        const processedEvents = events.map(event => ({
            ...event,
            image_url: event.image_data
                ? `data:image/png;base64,${event.image_data.toString('base64')}`
                : null
        }));

        res.json(processedEvents);

    }catch (err) {
        console.error(err);
        res.status(500).json({error: 'Server error'});
    }
});

router.post('/:id/register', authenticate, async (req, res) => {
    try {
        const { is_attending } = req.body;
        const eventId = req.params.id;
        const userId = req.user.id;

        // Validate parameters exist
        if (!eventId || !userId) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        // Validate is_attending parameter
        if (is_attending === undefined || is_attending === null) {
            return res.status(400).json({ error: 'is_attending parameter is required' });
        }

        // Coerce is_attending to boolean safely (handle both boolean and string inputs)
        const isAttending = is_attending === true || is_attending === 'true' || is_attending === 1 || is_attending === '1';

        // Verify event exists
        const [[event]] = await pool.query(
            'SELECT event_id FROM Events WHERE event_id = ?',
            [eventId]
        );

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const [result] = await pool.query(
            `INSERT INTO EventAttendance (user_id, event_id, is_attending)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE is_attending = VALUES(is_attending)`,
            [userId, eventId, isAttending]
        );

        res.json({
            success: true,
            is_attending: isAttending,
            affectedRows: result.affectedRows
        });

    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({
            error: 'Registration failed'
        });
    }
});




module.exports = router;