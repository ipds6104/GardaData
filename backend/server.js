const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Konfigurasi trust proxy agar Express mengenali IP klien di belakang Cloudflare / reverse proxy Coolify
app.set('trust proxy', true);

// ==========================================
// KEAMANAN (CYBER SECURITY)
// ==========================================

// 1. Helmet: Menyembunyikan teknologi server dan konfigurasi CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: [
        "'self'", 
        "data:", 
        "https://*.tile.openstreetmap.org", 
        "https://maps.googleapis.com",
        "https://mt1.google.com",
        "https://server.arcgisonline.com",
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com", "https://accounts.google.com"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://accounts.google.com", "https://*.googleapis.com"],
      connectSrc: [
        "'self'", 
        "https://api.garda-data.com", 
        "https://gardadata.dvlpid.my.id",
        "https://docs.google.com", 
        "https://firestore.googleapis.com", 
        "https://*.firebaseio.com", 
        "wss://*.firebaseio.com", 
        "https://identitytoolkit.googleapis.com", 
        "https://securetoken.googleapis.com"
      ]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. CORS: Hanya mengizinkan request dari frontend kita
const allowedOrigins = ['https://garda-data.com', 'https://gardadata.dvlpid.my.id', 'http://gardadata.dvlpid.my.id', 'http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// 3. Rate Limiting: Mencegah DDoS atau Brute Force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 3000, // Kuota mencukupi untuk banyak petugas & admin yang mengakses bersamaan
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Ambil IP asli klien dari Cloudflare atau forwarded header
    return req.headers['cf-connecting-ip'] || 
           (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) || 
           req.ip || 
           '127.0.0.1';
  },
  skip: (req) => {
    // Endpoint status healthcheck tidak boleh dibatasi agar banner koneksi tidak salah muncul
    const p = req.path || req.url || '';
    return p.includes('/status');
  },
  message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.'
});
app.use('/api/', apiLimiter);

// Parse JSON payload (maksimal 2MB untuk mengamankan dari payload raksasa)
app.use(express.json({ limit: '2mb' }));

// ==========================================
// ROUTES
// ==========================================
const measurementsRouter = require('./routes/measurements');
const monitoringRouter = require('./routes/monitoring');
const lmsRouter = require('./routes/lms');
const laporanRouter = require('./routes/laporan');
const imputationRouter = require('./routes/imputation');
const infrastructureRouter = require('./routes/infrastructure');
const socialRouter = require('./routes/social');
const classificationRouter = require('./routes/classification');
const slsRouter = require('./routes/sls');
const mitraRouter = require('./routes/mitra');
app.use('/api/measurements', measurementsRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/lms', lmsRouter);
app.use('/api/laporan', laporanRouter);
app.use('/api/imputations', imputationRouter);
app.use('/api/infrastructure', infrastructureRouter);
app.use('/api/social', socialRouter);
app.use('/api/classification', classificationRouter);
app.use('/api/sls', slsRouter);
app.use('/api/mitra', mitraRouter);

// Root route for API verification (optional, can be removed)
app.get('/api/status', (req, res) => {
  res.json({ status: 'Garda Data API Server Terlindungi Berjalan!' });
});

// ==========================================
// BACKGROUND TASKS
// ==========================================
require('./cron'); // Jalankan cron job untuk monitoring


// ==========================================
// SERVE FRONTEND (REACT SPA)
// ==========================================
const path = require('path');
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Menyajikan file static uploads (foto, dokumen form pelaporan)
const uploadsPath = path.join(currentDir, currentDir.endsWith('backend') ? 'uploads' : 'backend/uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Menyajikan file statis dari hasil build React (Vite)
const distPath = path.join(currentDir, currentDir.endsWith('backend') ? '../dist' : 'dist');

// Konfigurasi cache control presisi:
// 1. File navigasi (HTML, service worker sw.js, manifest) selalu NO-CACHE agar update langsung diterima pengguna
// 2. File asset dengan hash unik (assets/*.js, assets/*.css) di-cache jangka panjang (immutable)
app.use(express.static(distPath, {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    const basename = path.basename(filePath);
    if (
      filePath.endsWith('.html') ||
      basename === 'sw.js' ||
      basename === 'registerSW.js' ||
      basename === 'manifest.webmanifest' ||
      basename.endsWith('.json')
    ) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.includes(path.sep + 'assets' + path.sep)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Tangkap semua route selain /api dan arahkan ke index.html (agar React Router berfungsi)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  // Pastikan SPA fallback juga selalu meminta HTML segar dari server
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.', details: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan aman di port ${PORT}`);
});
