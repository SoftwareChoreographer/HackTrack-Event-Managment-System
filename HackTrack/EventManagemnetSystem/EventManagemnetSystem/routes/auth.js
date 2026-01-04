const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const  pool = require('../database');
const path = require('path');




// Login route
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate required fields
        if (!email || !password || !email.trim() || !password.trim()) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        const [Users] = await pool.query('SELECT * FROM Users WHERE email = ?', [normalizedEmail]);
        const user = Users[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Use bcrypt.compare for password verification
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ token, role: user.role, id: user.user_id });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

//signup route
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const saltRound = 10;

    try{
        if(!name || !email || !password){
            return res.status(400).json({error: 'All fields are required'});
        }

        if(name.length < 2 || name.length > 50){
            return res.status(400).json({error: 'Name must be between 2-50 characters'});
        }

        // Normalize email consistently
        const normalizedEmail = email.toLowerCase().trim();

        const [existingUsers] = await  pool.query(
            'SELECT * FROM Users WHERE email = ?', [normalizedEmail]
        );

        if(existingUsers.length > 0){
            return res.status(409).json({error: 'Email already exists'});
        }

        const hashedPassword = await bcrypt.hash(password, saltRound);

        const [result] = await pool.query(
            'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name.trim(), normalizedEmail, hashedPassword, 'User']
        );

        const token = jwt.sign(
            {
                id: result.insertId,
                name: name.trim(),
                email: normalizedEmail,
                role: 'User'
            },
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        );

        res.status(201).json({
            token,
            name: name.trim(),
            id: result.insertId,
            role: 'User'
        });
    }catch (err) {
        console.error('Signup error: ', err.message);
        res.status(500).json({error: 'Registration failed'})
    }

});

module.exports = router; // Export the router