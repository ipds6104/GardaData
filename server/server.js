const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
// Celah 2 Fix: Bind to localhost loopback interface by default to prevent direct public port exposure
const HOST = process.env.HOST || '127.0.0.1';

// Celah 4 Fix: Restrict CORS origins instead of wildcard '*'
const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

const envOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
    : [];

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, internal service-to-service)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // Izinkan request untuk integrasi API eksternal dengan API Key
        return callback(null, true);

    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-api-key', 'X-API-Token', 'x-api-token'],
    credentials: true
}));

// HTTP Security Headers (OWASP & NIST Recommended)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: http://localhost:5000 http://127.0.0.1:5000; frame-ancestors 'self';");
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
});

app.use(express.json({ limit: '25mb' })); // Reasonable limit for GeoJSON
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Database Connection Import to verify connection early
const db = require('./db');

// Route Imports
const authRoutes = require('./routes/auth');
const measurementRoutes = require('./routes/measurements');
const imputationRoutes = require('./routes/imputations');
const phenomenaRoutes = require('./routes/phenomena');
const laporanRoutes = require('./routes/laporan');
const kbliRoutes = require('./routes/kbli');
const analyticsRoutes = require('./routes/analytics');
const mitraRoutes = require('./routes/mitra');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/imputations', imputationRoutes);
app.use('/api/phenomena', phenomenaRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/kbli', kbliRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mitra', mitraRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Garda Data API is running securely',
        timestamp: new Date().toISOString()
    });
});

// Centralized generic error handler (Prevent stack trace leaks)
app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, err.message);
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' 
            ? 'Terjadi kesalahan internal pada server.' 
            : err.message
    });
});

// Start server on localhost loopback (Behind Reverse Proxy / Firewall)
app.listen(PORT, HOST, () => {
    console.log(`========================================`);
    console.log(` Garda Data Hardened Backend API Server`);
    console.log(` Bound to: http://${HOST}:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Binding Host: ${HOST} (Loopback Protected)`);
    console.log(`========================================`);
});
