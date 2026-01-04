const express = require('express');
const cors = require('cors');
const authRouter = require('./routes/auth');
const eventRouter = require('./routes/events');
//const feedbackRouter = require('./routes/feedback');
//const notificationsRouter = require('./routes/notifications');
require('dotenv').config();

const app = express();

const corsOption = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOption));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);

//app.use('/api/reviews', );

//app.use('/api/feedback', feedbackRouter);
//app.use('/api/notifications', notificationsRouter);

module.exports = app;