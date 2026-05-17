const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
    const { username, password, name, role } = req.body;
    
    if (!username || !password || !name) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }
    
    try {
        // Check if user already exists
        const [existing] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const userRole = role || 'petugas';
        
        // Insert user
        await pool.query(
            'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
            [id, username, password_hash, name, userRole]
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            user: { id, username, name, role: userRole }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }
    
    try {
        // Find user
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        
        const user = users[0];
        
        // Validate password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }
        
        // Sign JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'gardadatajwtsecret12345!',
            { expiresIn: '30d' } // Long-lasting token for surveyors
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login', error: err.message });
    }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, name, role FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error getting profile', error: err.message });
    }
});

module.exports = router;
