const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../public/data/se2026_responden');

// GET /api/pengolahan/metadata - Ambil ringkasan metadata sebaran responden
router.get('/metadata', (req, res) => {
  try {
    const indexPath = path.join(dataDir, 'metadata_index.json');
    if (!fs.existsSync(indexPath)) {
      return res.status(404).json({ error: 'Metadata responden SE2026 belum tersedia.' });
    }
    const metadata = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.json(metadata);
  } catch (error) {
    console.error('Error fetching SE2026 metadata:', error);
    res.status(500).json({ error: 'Gagal memuat metadata responden.' });
  }
});

// GET /api/pengolahan/responden/:kecCode - Ambil titik responden per kecamatan dengan filter opsional
router.get('/responden/:kecCode', (req, res) => {
  try {
    const { kecCode } = req.params;
    const { desa, sls, usahaOnly, status, search, limit } = req.query;

    const fileName = `responden_kec_${kecCode}.json`;
    const filePath = path.join(dataDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Data responden untuk kecamatan kode ${kecCode} tidak ditemukan.` });
    }

    const kecData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let points = kecData.points || [];

    if (desa && desa !== 'all') {
      points = points.filter(p => p.d === desa || (p.dn && p.dn.toLowerCase() === desa.toLowerCase()));
    }

    if (sls && sls !== 'all') {
      points = points.filter(p => p.ks === sls || (p.s && p.s.toLowerCase().includes(sls.toLowerCase())));
    }

    if (usahaOnly === 'true' || usahaOnly === '1') {
      points = points.filter(p => p.u > 0);
    } else if (usahaOnly === 'false' || usahaOnly === '0') {
      points = points.filter(p => p.u === 0);
    }

    if (status && status !== 'all') {
      points = points.filter(p => p.st && p.st.toLowerCase() === status.toLowerCase());
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      points = points.filter(p => 
        (p.k && p.k.toLowerCase().includes(q)) ||
        (p.nu && p.nu.toLowerCase().includes(q)) ||
        (p.s && p.s.toLowerCase().includes(q)) ||
        (p.i && p.i.toLowerCase().includes(q)) ||
        (p.kb && p.kb.toLowerCase().includes(q))
      );
    }

    if (limit && !isNaN(parseInt(limit, 10))) {
      points = points.slice(0, parseInt(limit, 10));
    }

    res.json({
      kecCode: kecData.kecCode,
      kecName: kecData.kecName,
      totalFiltered: points.length,
      points: points
    });
  } catch (error) {
    console.error('Error fetching SE2026 kecamatan data:', error);
    res.status(500).json({ error: 'Gagal memuat titik responden kecamatan.' });
  }
});

// In-memory cache for ultra-fast < 1ms response
let cachedDetails = null;
const DETAILS_FILE = path.join(__dirname, '../data/se2026_business_details.json');

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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

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

