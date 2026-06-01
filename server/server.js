const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // In development, allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Support large GeoJSON payloads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection Import to verify connection early
const db = require('./db');

// Route Imports
const authRoutes = require('./routes/auth');
const measurementRoutes = require('./routes/measurements');
const imputationRoutes = require('./routes/imputations');
const phenomenaRoutes = require('./routes/phenomena');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/imputations', imputationRoutes);
app.use('/api/phenomena', phenomenaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Garda Data API is running successfully' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(` Garda Data Backend API Server`);
    console.log(` Running at http://localhost:${PORT}`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================`);
});
