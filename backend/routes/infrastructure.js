const express = require('express');
const router = express.Router();
const pool = require('../db');

function slugify(text) {
  return String(text).toLowerCase()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

const ALL_MEMPAWAH_VILLAGES = [
  // Mempawah Hilir
  'TENGAH', 'TERUSAN', 'MALIKIAN', 'KUALA SECAPAH', 'PASIR', 'SENGGIRING', 'PENIBUNG', 'KUALA',
  // Mempawah Timur
  'PASIR WAN SALIM', 'ANTIBAR', 'SUNGAI BAKAU KECIL', 'PARIT BANJAR', 'SENGKUBANG', 'SEJEGI', 'PINANG DALAM',
  // Sungai Pinyuh
  'SUNGAI PINYUH', 'GALANG', 'PENIRAMAN', 'NUSAPATI', 'SUNGAI PURUN KECIL', 'SUNGAI BATANG', 'SUNGAI RASAU', 'SUNGAI BAKAU BESAR LAUT', 'SUNGAI BAKAU BESAR DARAT',
  // Jongkat & Segedong
  'WAJOK HULU', 'WAJOK HILIR', 'JUNGKAT', 'PENITI DALAM I', 'PENITI DALAM II', 'PENITI BESAR', 'SUNGAI KUPAH', 'PARIT BUGIS', 'SEGEDONG', 'SUNGAI BURUNG',
  // Anjongan, Toho, Sadaniang
  'ANJUNGAN MELANCAR', 'ANJONGAN', 'KEPAYANG', 'DEMA', 'TOHO HILIR', 'PAK LAHENG', 'TOHO', 'PENTEK', 'SAMBORA', 'KECURIT', 'SEKABUK', 'AMAWANG', 'ANSIAP', 'SUAK BARANGAN', 'SEUDON', 'MALIK', 'PASIR PANJANG'
];

const BASE_CATEGORIES = [
  { category: 'Pendidikan', items: ['SD (2)', 'SMP (1)', 'TK (1)', 'PAUD (2)', 'TPA (4)'], source: 'Dinkes / Kemenag' },
  { category: 'Kesehatan', items: ['Polindes (1)', 'Poskesdes (1)', 'Posyandu (3)'], source: 'Dinkes' },
  { category: 'Olahraga', items: ['Sepak Bola (1)', 'Voli (1)', 'Bulu Tangkis (1)'], source: 'Data Desa' },
  { category: 'Hutan', items: ['Hutan Lindung', 'Lembaga Pengelola Hutan Desa (LPHD)'], source: 'UPT Kehutanan' },
  { category: 'Pertanian', items: ['UPJA (1)', 'RMU (1)'], source: 'Distan' },
  { category: 'Sampah', items: ['TPS (1)', 'Bank Sampah (1)'], source: 'DLH' },
  { category: 'Tambahan Data', items: ['Kantor Desa', 'Bumdes', 'Lembaga Adat', 'LPM'], source: 'Data Desa' },
  { category: 'Panti', items: ['Panti Asuhan', 'Panti Jompo'], source: 'Data Desa' },
  { category: 'Perhubungan', items: ['Dermaga (1)'], source: 'Data Desa' }
];

async function ensureSeedData() {
  try {
    const year = new Date().getFullYear().toString();

    // 1. Ensure infrastructure_items
    const [infraCount] = await pool.query('SELECT COUNT(*) as count FROM infrastructure_items');
    if (infraCount[0].count === 0) {
      console.log('🌱 Seeding infrastructure_items for all villages...');
      for (const vil of ALL_MEMPAWAH_VILLAGES) {
        for (const cat of BASE_CATEGORIES) {
          for (const itm of cat.items) {
            const id = `${slugify(vil)}-${slugify(cat.category)}-${slugify(itm)}-${year}`;
            await pool.query(
              'INSERT IGNORE INTO infrastructure_items (id,category,item,village,source,year) VALUES (?,?,?,?,?,?)',
              [id, cat.category, itm, vil, cat.source, year]
            );
          }
        }
      }
      console.log('✅ Infrastructure items seeded.');
    }

    // 2. Ensure village_stats
    const [popCount] = await pool.query('SELECT COUNT(*) as count FROM village_stats');
    if (popCount[0].count === 0) {
      console.log('🌱 Seeding village_stats for all villages...');
      for (let i = 0; i < ALL_MEMPAWAH_VILLAGES.length; i++) {
        const vil = ALL_MEMPAWAH_VILLAGES[i];
        const id = `${slugify(vil)}-${year}`;
        const male = 1000 + ((i * 137) % 2500);
        const female = 950 + ((i * 149) % 2400);
        const total = male + female;
        const kk = Math.floor(total / 3.4);
        const agriFamily = Math.floor(kk * 0.38);

        await pool.query(
          'INSERT IGNORE INTO village_stats (id,village,year,male,female,total,kk,agriFamily) VALUES (?,?,?,?,?,?,?,?)',
          [id, vil, year, String(male), String(female), String(total), String(kk), String(agriFamily)]
        );
      }
      console.log('✅ Village stats seeded.');
    }
  } catch (err) {
    console.error('Error ensuring seed data:', err);
  }
}

// Initial seed call
ensureSeedData();

// GET /api/infrastructure/villages
router.get('/villages', async (req, res) => {
  try {
    await ensureSeedData();
    const [infraRows] = await pool.query('SELECT DISTINCT village FROM infrastructure_items ORDER BY village ASC');
    const [statsRows] = await pool.query('SELECT DISTINCT village FROM village_stats ORDER BY village ASC');
    const all = new Set([...infraRows.map(r => r.village), ...statsRows.map(r => r.village)]);
    res.json({ villages: Array.from(all).sort() });
  } catch (err) { res.status(500).json({ error: 'Gagal mengambil daftar desa' }); }
});

// GET /api/infrastructure/items
router.get('/items', async (req, res) => {
  try {
    await ensureSeedData();
    const { village, villages } = req.query;
    let sql = 'SELECT * FROM infrastructure_items WHERE 1=1';
    const params = [];
    if (village) { 
      sql += ' AND village = ?'; 
      params.push(String(village).toUpperCase()); 
    } else if (villages) {
      const vs = String(villages).split(',').map(v => v.trim().toUpperCase()).filter(Boolean);
      if (vs.length > 0) {
        sql += ` AND village IN (${vs.map(() => '?').join(',')})`;
        params.push(...vs);
      }
    }
    sql += ' ORDER BY village ASC, category ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ items: rows });
  } catch (err) { res.status(500).json({ error: 'Gagal mengambil data infrastruktur' }); }
});

// GET /api/infrastructure/stats
router.get('/stats', async (req, res) => {
  try {
    await ensureSeedData();
    const { village, villages } = req.query;
    let sql = 'SELECT * FROM village_stats WHERE 1=1';
    const params = [];
    if (village) { 
      sql += ' AND village = ?'; 
      params.push(String(village).toUpperCase()); 
    } else if (villages) {
      const vs = String(villages).split(',').map(v => v.trim().toUpperCase()).filter(Boolean);
      if (vs.length > 0) {
        sql += ` AND village IN (${vs.map(() => '?').join(',')})`;
        params.push(...vs);
      }
    }
    sql += ' ORDER BY village ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ stats: rows });
  } catch (err) { res.status(500).json({ error: 'Gagal mengambil data kependudukan' }); }
});

// GET /api/infrastructure/user-wilayah
router.get('/user-wilayah', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json({ kecamatan: '-', desa: '-' });
    const [rows] = await pool.query('SELECT kecamatan, desa FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.json({ kecamatan: '-', desa: '-' });
    res.json({ kecamatan: rows[0].kecamatan || '-', desa: rows[0].desa || '-' });
  } catch (err) { res.json({ kecamatan: '-', desa: '-' }); }
});

// POST /api/infrastructure/upload-infra
router.post('/upload-infra', async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || !data.length) return res.status(400).json({ error: 'Data kosong' });
    let count = 0;
    const year = new Date().getFullYear().toString();
    for (const item of data) {
      const kategori = item.Kategori || item.category || 'Lainnya';
      const namaInfra = item.Infrastruktur || item.item;
      const desa = item['Nama Desa'] || item.village;
      const sumber = item['Sumber Data'] || item.source || 'Unknown';
      const tahun = item.Tahun || item.year || year;
      if (namaInfra && desa) {
        const id = `${slugify(desa)}-${slugify(kategori)}-${slugify(namaInfra)}-${tahun}`;
        await pool.query(
          'INSERT INTO infrastructure_items (id,category,item,village,source,year) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE category=VALUES(category),item=VALUES(item),source=VALUES(source),year=VALUES(year)',
          [id, String(kategori), String(namaInfra), String(desa).toUpperCase(), String(sumber), String(tahun)]
        );
        count++;
      }
    }
    res.json({ success: true, count });
  } catch (err) { res.status(500).json({ error: 'Gagal upload infrastruktur' }); }
});

// POST /api/infrastructure/upload-pop
router.post('/upload-pop', async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || !data.length) return res.status(400).json({ error: 'Data kosong' });
    let count = 0;
    const year = new Date().getFullYear().toString();
    for (const item of data) {
      const desa = item['Nama Desa/Kelurahan'] || item.village;
      const tahun = item.Tahun || item.year || year;
      if (desa) {
        const id = `${slugify(desa)}-${tahun}`;
        const male = Number(item['Banyak Penduduk Laki-Laki'] || item.male || 0);
        const female = Number(item['Banyak Penduduk Perempuan'] || item.female || 0);
        let total = Number(item['Jumlah Penduduk'] || item['Total Jiwa'] || item.total || 0);
        if (total === 0 && (male > 0 || female > 0)) total = male + female;
        await pool.query(
          'INSERT INTO village_stats (id,village,year,male,female,total,kk,agriFamily) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE male=VALUES(male),female=VALUES(female),total=VALUES(total),kk=VALUES(kk),agriFamily=VALUES(agriFamily)',
          [id, String(desa).toUpperCase(), String(tahun), String(male), String(female), String(total), String(item['Jumlah KK'] || item.kk || 0), String(item['Jumlah Keluarga Pertanian'] || item.agriFamily || 0)]
        );
        count++;
      }
    }
    res.json({ success: true, count });
  } catch (err) { res.status(500).json({ error: 'Gagal upload kependudukan' }); }
});

// DELETE /api/infrastructure/items/:id
router.delete('/items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM infrastructure_items WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Gagal menghapus' }); }
});

module.exports = router;
