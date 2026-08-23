const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET /api/social - ambil semua laporan
router.get('/', async (req, res) => {
  try {
    const { desa, kecamatan } = req.query;
    let sql = 'SELECT * FROM social_phenomenon WHERE 1=1';
    const params = [];
    if (desa) { sql += ' AND desa = ?'; params.push(desa); }
    if (kecamatan) { sql += ' AND kecamatan = ?'; params.push(kecamatan); }
    sql += ' ORDER BY createdAt DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data fenomena sosial' });
  }
});

// POST /api/social - tambah laporan baru
router.post('/', async (req, res) => {
  try {
    const { judul, desa, kecamatan, isi, petugasId, petugasName } = req.body;
    if (!judul) return res.status(400).json({ error: 'Judul wajib diisi' });
    const id = uuidv4();
    const timestamp = Date.now();
    await pool.query(
      'INSERT INTO social_phenomenon (id, judul, desa, kecamatan, isi, petugasId, petugasName, timestamp) VALUES (?,?,?,?,?,?,?,?)',
      [id, judul, desa || null, kecamatan || null, isi || null, petugasId || null, petugasName || null, timestamp]
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan laporan' });
  }
});

// PUT /api/social/:id - update laporan
router.put('/:id', async (req, res) => {
  try {
    const { judul, desa, kecamatan, isi } = req.body;
    await pool.query(
      'UPDATE social_phenomenon SET judul=?, desa=?, kecamatan=?, isi=? WHERE id=?',
      [judul, desa || null, kecamatan || null, isi || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate laporan' });
  }
});

// DELETE /api/social/:id - hapus laporan
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM social_phenomenon WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus laporan' });
  }
});

module.exports = router;
