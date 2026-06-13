const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ==========================================
// KEAMANAN (CYBER SECURITY)
// ==========================================

// 1. Helmet: Menyembunyikan teknologi server dan mencegah serangan XSS ringan.
app.use(helmet());

// 2. CORS: Hanya mengizinkan request dari frontend kita
app.use(cors({
  origin: '*', // Di produksi, ganti ini menjadi URL frontend Anda (misal: https://garda-data.com)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// 3. Rate Limiting: Mencegah DDoS atau Brute Force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Maksimal 100 request per IP setiap 15 menit
  message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.'
});
app.use('/api/', apiLimiter);

// Parse JSON payload (maksimal 10MB untuk mengamankan dari payload raksasa)
app.use(express.json({ limit: '10mb' }));

// ==========================================
// ROUTES
// ==========================================
const measurementsRouter = require('./routes/measurements');
app.use('/api/measurements', measurementsRouter);

// Root route for API verification (optional, can be removed)
app.get('/api/status', (req, res) => {
  res.json({ status: 'Garda Data API Server Terlindungi Berjalan!' });
});

// ==========================================
// SERVE FRONTEND (REACT SPA)
// ==========================================
const path = require('path');

// Menyajikan file statis dari hasil build React (Vite)
app.use(express.static(path.join(__dirname, '../dist')));

// Tangkap semua route selain /api dan arahkan ke index.html (agar React Router berfungsi)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan aman di port ${PORT}`);
});
