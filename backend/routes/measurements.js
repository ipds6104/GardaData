const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET: Mengambil semua data luas bangunan
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM building_measurements ORDER BY timestamp DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST: Sinkronisasi data offline dari PWA ke server
router.post('/sync', async (req, res) => {
  const records = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Payload harus berupa array.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const record of records) {
      // Gunakan parameterized query (?) untuk mencegah SQL Injection!
      const query = `
        INSERT INTO building_measurements 
        (id, petugasId, petugasName, timestamp, geojson, luasAtap, jumlahLantai, jenisBangunan, perkiraanLuasLantai, longitude, latitude, metodeDigitasi, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        geojson = VALUES(geojson), 
        luasAtap = VALUES(luasAtap), 
        perkiraanLuasLantai = VALUES(perkiraanLuasLantai),
        syncStatus = 'synced'
      `;

      await connection.execute(query, [
        record.id,
        record.petugasId || 'unknown',
        record.petugasName || 'Petugas',
        record.timestamp,
        JSON.stringify(record.geojson), // Parse geojson object to string for MySQL JSON column
        record.luasAtap || 0,
        record.jumlahLantai || 1,
        record.jenisBangunan || 'Rumah Tinggal',
        record.perkiraanLuasLantai || 0,
        record.longitude || 0,
        record.latitude || 0,
        record.metodeDigitasi || 'manual',
        'synced'
      ]);
    }

    await connection.commit();
    res.status(200).json({ message: `Berhasil sinkronisasi ${records.length} data.` });
  } catch (error) {
    await connection.rollback();
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Gagal melakukan sinkronisasi data.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
