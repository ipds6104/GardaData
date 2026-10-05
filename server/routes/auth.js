const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// In-Memory Rate Limiter for Login Attempts (Anti-Brute Force)
const loginAttemptTracker = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout

// Clean up stale attempts periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of loginAttemptTracker.entries()) {
        if (now - record.lastAttempt > LOCKOUT_WINDOW_MS) {
            loginAttemptTracker.delete(key);
        }
    }
}, 5 * 60 * 1000);

function validatePasswordPolicy(password) {
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return { isValid: false, message: 'Kata sandi tidak boleh kosong.' };
    }
    return { isValid: true };
}

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
    const { username, password, name, role } = req.body;
    
    if (!username || !password || !name) {
        return res.status(400).json({ message: 'Semua bidang wajib diisi.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanName = String(name).trim();

    // Password Complexity Validation
    const pwValidation = validatePasswordPolicy(password);
    if (!pwValidation.isValid) {
        return res.status(400).json({ message: pwValidation.message });
    }
    
    try {
        // Check if user already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username sudah terdaftar.' });
        }
        
        // Hash password with 12 rounds
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);
        
        const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const validRoles = ['admin', 'petugas', 'petugas_pengolahan', 'pengunjung'];
        const userRole = validRoles.includes(role) ? role : 'petugas';
        
        // Insert user
        await pool.query(
            'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
            [id, cleanUsername, password_hash, cleanName, userRole]
        );
        
        res.status(201).json({
            message: 'Pengguna berhasil didaftarkan.',
            user: { id, username: cleanUsername, name: cleanName, role: userRole }
        });
    } catch (err) {
        res.status(500).json({ message: 'Kesalahan server saat pendaftaran.', error: err.message });
    }
});

// POST /api/auth/login - Login user with rate limiting
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan kata sandi wajib diisi.' });
    }

    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const cleanUsername = String(username).trim().toLowerCase();
    const trackKey = `${clientIp}_${cleanUsername}`;
    const now = Date.now();

    // Check Rate Limiter
    const attemptRecord = loginAttemptTracker.get(trackKey) || { count: 0, lastAttempt: now };
    if (attemptRecord.count >= MAX_FAILED_ATTEMPTS && (now - attemptRecord.lastAttempt < LOCKOUT_WINDOW_MS)) {
        const remainingMinutes = Math.ceil((LOCKOUT_WINDOW_MS - (now - attemptRecord.lastAttempt)) / 60000);
        return res.status(429).json({
            message: `Akun dikunci sementara akibat terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${remainingMinutes} menit.`
        });
    }
    
    try {
        // Find user
        const [users] = await pool.query('SELECT id, username, password_hash, name, role FROM users WHERE username = ?', [cleanUsername]);
        if (users.length === 0) {
            attemptRecord.count += 1;
            attemptRecord.lastAttempt = now;
            loginAttemptTracker.set(trackKey, attemptRecord);
            return res.status(400).json({ message: 'Username atau kata sandi tidak sesuai.' });
        }
        
        const user = users[0];
        
        // Validate password using secure bcrypt compare
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            attemptRecord.count += 1;
            attemptRecord.lastAttempt = now;
            loginAttemptTracker.set(trackKey, attemptRecord);
            const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - attemptRecord.count);
            return res.status(400).json({ 
                message: remainingAttempts > 0 
                    ? `Username atau kata sandi tidak sesuai. Sisa kesempatan: ${remainingAttempts} kali.`
                    : 'Terlalu banyak percobaan gagal. Akun dikunci sementara selama 15 menit.'
            });
        }
        
        // Reset failed attempt on success
        loginAttemptTracker.delete(trackKey);

        // Sign JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.name },
            process.env.JWT_SECRET || 'GARDA_DATA_SUPER_SECURE_JWT_SECRET_KEY_6104!',
            { expiresIn: '7d' } // Secure 7 days session duration
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
        res.status(500).json({ message: 'Kesalahan server saat otentikasi.', error: err.message });
    }
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Kata sandi lama dan kata sandi baru wajib diisi.' });
    }

    if (oldPassword === newPassword) {
        return res.status(400).json({ message: 'Kata sandi baru tidak boleh sama dengan kata sandi lama.' });
    }

    const pwValidation = validatePasswordPolicy(newPassword);
    if (!pwValidation.isValid) {
        return res.status(400).json({ message: pwValidation.message });
    }

    try {
        const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, users[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Kata sandi lama tidak sesuai.' });
        }

        const salt = await bcrypt.genSalt(12);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.user.id]);

        res.json({ message: 'Kata sandi berhasil diperbarui dengan aman.' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal memperbarui kata sandi.', error: err.message });
    }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, name, role FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ message: 'Kesalahan server saat memuat profil.', error: err.message });
    }
});

module.exports = router;

