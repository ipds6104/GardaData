const express = require('express');
const router = express.Router();
const pool = require('../db');

const DEFAULT_CLASSIFICATIONS = [
  { mjj_occtle: 'KARYAWAN KAFE', mjj_occmtd: 'MAKANAN DAN MINUMAN', mjj_bidang: 'PENYEDIA MAKANAN DAN MINUMAN', mjj_kbji_label: '[5131] PRAMUSAJI', mjj_kbli_label: '[56303] AKTIVITAS RUMAH MINUM/KAFE' },
  { mjj_occtle: 'PETANI PADI', mjj_occmtd: 'PERTANIAN', mjj_bidang: 'TANAMAN PANGAN', mjj_kbji_label: '[6111] PETANI TANAMAN PANGAN', mjj_kbli_label: '[01111] PERTANIAN PADI HIBRIDA' },
  { mjj_occtle: 'NELAYAN TANGKAP', mjj_occmtd: 'PERIKANAN', mjj_bidang: 'PENANGKAPAN IKAN LAUT', mjj_kbji_label: '[6222] NELAYAN LAUT', mjj_kbli_label: '[03111] PENANGKAPAN PISCES LAUT' },
  { mjj_occtle: 'PEDAGANG KELONTONG', mjj_occmtd: 'PERDAGANGAN', mjj_bidang: 'PERDAGANGAN ECERAN', mjj_kbji_label: '[5221] PEDAGANG ECERAN TOKO', mjj_kbli_label: '[47111] PERDAGANGAN ECERAN BERBAGAI MACAM BARANG' },
  { mjj_occtle: 'GURU SD', mjj_occmtd: 'PENDIDIKAN', mjj_bidang: 'JASA PENDIDIKAN DASAR', mjj_kbji_label: '[2341] GURU PENDIDIKAN DASAR', mjj_kbli_label: '[85121] PENDIDIKAN DASAR SWASTA' },
  { mjj_occtle: 'SUPIR TRUK', mjj_occmtd: 'TRANSPORTASI', mjj_bidang: 'ANGKUTAN BARANG', mjj_kbji_label: '[8332] PENGEMUDI TRUK BERAT', mjj_kbli_label: '[49431] ANGKUTAN BERMOTOR UNTUK BARANG UMUM' },
  { mjj_occtle: 'BURUH BANGUNAN', mjj_occmtd: 'KONSTRUKSI', mjj_bidang: 'KONSTRUKSI GEDUNG', mjj_kbji_label: '[9313] BURUH KONSTRUKSI BANGUNAN', mjj_kbli_label: '[41011] KONSTRUKSI GEDUNG HUNIAN' },
  { mjj_occtle: 'TUKANG JAHIT', mjj_occmtd: 'INDUSTRI PENGOLAHAN', mjj_bidang: 'INDUSTRI PAKAIAN JADI', mjj_kbji_label: '[7531] PENJAHIT DAN PEMBUAT PAKAIAN', mjj_kbli_label: '[14111] INDUSTRI PAKAIAN JADI DARI TEKSTIL' }
];

async function ensureClassificationSeed() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM classifications');
    if (rows[0].count === 0) {
      console.log('🌱 Seeding initial classifications...');
      for (const item of DEFAULT_CLASSIFICATIONS) {
        const id = `${item.mjj_occtle}-${item.mjj_kbji_label}`.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 250);
        await pool.query(
          `INSERT IGNORE INTO classifications (id, mjj_occtle, mjj_occmtd, mjj_bidang, mjj_kbji_label, mjj_kbli_label, updatedBy)
           VALUES (?,?,?,?,?,?,?)`,
          [id, item.mjj_occtle, item.mjj_occmtd, item.mjj_bidang, item.mjj_kbji_label, item.mjj_kbli_label, 'system']
        );
      }
      console.log('✅ Initial classifications seeded.');
    }
  } catch (err) {
    console.error('Error seeding classifications:', err);
  }
}

ensureClassificationSeed();

// GET /api/classification?q=... - search classifications
router.get('/', async (req, res) => {
  try {
    await ensureClassificationSeed();
    const { q, limit: lim } = req.query;
    const maxRows = Math.min(parseInt(lim) || 1000, 5000);

    let sql, params;
    if (q && q.trim()) {
      const search = `%${q.trim()}%`;
      sql = `SELECT * FROM classifications WHERE 
             mjj_occtle LIKE ? OR mjj_occmtd LIKE ? OR mjj_bidang LIKE ? OR 
             mjj_kbji_label LIKE ? OR mjj_kbli_label LIKE ? 
             ORDER BY createdAt DESC LIMIT ?`;
      params = [search, search, search, search, search, maxRows];
    } else {
      sql = `SELECT * FROM classifications ORDER BY createdAt DESC LIMIT ?`;
      params = [maxRows];
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data klasifikasi' });
  }
});

// POST /api/classification - tambah satu entry
router.post('/', async (req, res) => {
  try {
    const { mjj_occtle, mjj_occmtd, mjj_bidang, mjj_kbji_label, mjj_kbli_label, updatedBy } = req.body;
    if (!mjj_occtle) return res.status(400).json({ error: 'mjj_occtle wajib diisi' });
    const id = `${mjj_occtle}-${mjj_kbji_label}`.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 250);
    await pool.query(
      `INSERT INTO classifications (id, mjj_occtle, mjj_occmtd, mjj_bidang, mjj_kbji_label, mjj_kbli_label, updatedBy)
       VALUES (?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE mjj_occmtd=VALUES(mjj_occmtd), mjj_bidang=VALUES(mjj_bidang), mjj_kbji_label=VALUES(mjj_kbji_label), mjj_kbli_label=VALUES(mjj_kbli_label)`,
      [id, mjj_occtle, mjj_occmtd||'', mjj_bidang||'', mjj_kbji_label||'', mjj_kbli_label||'', updatedBy||'system']
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan data klasifikasi' });
  }
});

// POST /api/classification/bulk - upload batch classifications
router.post('/bulk', async (req, res) => {
  try {
    const { data, updatedBy } = req.body;
    if (!Array.isArray(data) || !data.length) return res.status(400).json({ error: 'Data kosong' });

    let count = 0;
    for (const item of data) {
      if (!item.mjj_occtle || !item.mjj_kbji_label) continue;
      const id = `${item.mjj_occtle}-${item.mjj_kbji_label}`.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 250);
      await pool.query(
        `INSERT INTO classifications (id, mjj_occtle, mjj_occmtd, mjj_bidang, mjj_kbji_label, mjj_kbli_label, updatedBy)
         VALUES (?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE mjj_occmtd=VALUES(mjj_occmtd), mjj_bidang=VALUES(mjj_bidang), mjj_kbji_label=VALUES(mjj_kbji_label), mjj_kbli_label=VALUES(mjj_kbli_label)`,
        [id, String(item.mjj_occtle), String(item.mjj_occmtd||''), String(item.mjj_bidang||''),
         String(item.mjj_kbji_label), String(item.mjj_kbli_label||''), updatedBy||'system']
      );
      count++;
    }
    res.json({ success: true, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal upload klasifikasi' });
  }
});

module.exports = router;
