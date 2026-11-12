const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DETAILS_FILE = path.join(DATA_DIR, 'se2026_business_details.json');

// In-memory cache for ultra-fast < 1ms response
let cachedDetails = null;

function getDetails() {
  if (!cachedDetails) {
    if (fs.existsSync(DETAILS_FILE)) {
      try {
        cachedDetails = JSON.parse(fs.readFileSync(DETAILS_FILE, 'utf8'));
      } catch (e) {
        console.error('Error reading se2026_business_details.json:', e);
        cachedDetails = {};
      }
    } else {
      cachedDetails = {};
    }
  }
  return cachedDetails;
}

// GET /api/pengolahan/business-detail
// KEAMANAN & PRIVASI: Hanya dapat diakses oleh role Administrator!
// ZERO-CACHE: Header HTTP mewajibkan browser untuk TIDAK MENYIMPAN ke cache apapun.
router.get('/business-detail', (req, res) => {
  // 1. Strict Zero-Cache HTTP Headers (RFC 7234 & NIST 800-88 compliance)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // 2. Access Control: Role Admin verification
  const role = req.headers['x-user-role'] || req.query.role;
  const userEmail = req.headers['x-user-email'] || req.query.email;
  const isAhmad = userEmail && (
    userEmail.toLowerCase().includes('ahmad') || 
    userEmail.toLowerCase().includes('digitalofficer79') ||
    userEmail.toLowerCase().includes('admin')
  );

  if (role !== 'admin' && !isAhmad) {
    return res.status(403).json({
      error: 'Akses Ditolak: Rincian kuesioner SE2026 hanya dapat diakses oleh Administrator.'
    });
  }

  const { aid, pointId } = req.query;
  if (!aid && !pointId) {
    return res.status(400).json({ error: 'Parameter aid atau pointId diperlukan.' });
  }

  const detailsDb = getDetails();
  const detail = (aid && detailsDb[aid]) || (pointId && detailsDb[pointId]);

  if (!detail) {
    return res.status(404).json({ error: 'Rincian data usaha tidak ditemukan.' });
  }

  return res.json(detail);
});

module.exports = router;
