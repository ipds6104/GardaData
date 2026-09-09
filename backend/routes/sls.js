const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs');
const path = require('path');

// GET /api/sls - Mengambil data GeoJSON SLS dari database MySQL
router.get('/', async (req, res) => {
  try {
    const { kec, desa, search } = req.query;
    let query = 'SELECT * FROM sls_boundaries WHERE 1=1';
    const params = [];

    if (kec && kec !== 'all') {
      query += ' AND UPPER(nmkec) = UPPER(?)';
      params.push(kec.trim());
    }

    if (desa && desa !== 'all') {
      query += ' AND UPPER(nmdesa) = UPPER(?)';
      params.push(desa.trim());
    }

    if (search && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      query += ' AND (nmsls LIKE ? OR idsls LIKE ? OR kdsls LIKE ? OR nmdesa LIKE ? OR nmkec LIKE ?)';
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY nmkec, nmdesa, nmsls';

    const [rows] = await pool.query(query, params);

    // Format menjadi GeoJSON FeatureCollection
    const features = rows.map(row => {
      const geometry = typeof row.geometry === 'string' ? JSON.parse(row.geometry) : row.geometry;
      const bbox = row.bbox ? (typeof row.bbox === 'string' ? JSON.parse(row.bbox) : row.bbox) : undefined;
      return {
        type: 'Feature',
        id: row.idsls,
        bbox: bbox,
        geometry: geometry,
        properties: {
          idsls: row.idsls,
          nmsls: row.nmsls,
          kdsls: row.kdsls,
          nmkec: row.nmkec,
          kdkec: row.kdkec,
          nmdesa: row.nmdesa,
          kddesa: row.kddesa,
          nmkab: row.nmkab,
          kdkab: row.kdkab,
          nmprov: row.nmprov,
          kdprov: row.kdprov,
          luas: row.luas,
          muatan: row.muatan,
          kk: row.kk,
          subsls: row.subsls,
          idsubsls: row.idsubsls,
          sumber: row.sumber,
          periode: row.periode
        }
      };
    });

    res.json({
      type: 'FeatureCollection',
      features: features,
      total: features.length
    });
  } catch (error) {
    console.error('Error fetching SLS from MySQL:', error);
    res.status(500).json({ error: 'Gagal mengambil data SLS dari database' });
  }
});

// GET /api/sls/:idsls - Mengambil detail 1 SLS
router.get('/:idsls', async (req, res) => {
  try {
    const { idsls } = req.params;
    const [rows] = await pool.query('SELECT * FROM sls_boundaries WHERE idsls = ?', [idsls]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'SLS tidak ditemukan' });
    }
    const row = rows[0];
    const geometry = typeof row.geometry === 'string' ? JSON.parse(row.geometry) : row.geometry;
    res.json({
      type: 'Feature',
      id: row.idsls,
      geometry: geometry,
      properties: { ...row, geometry: undefined }
    });
  } catch (error) {
    console.error('Error fetching SLS detail:', error);
    res.status(500).json({ error: 'Gagal mengambil detail SLS' });
  }
});

// POST /api/sls/seed - Sinkronisasi / seeding berkas GeoJSON ke tabel MySQL
router.post('/seed', async (req, res) => {
  try {
    const geojsonPath = path.join(__dirname, '../../public/data/batas_sls_6104.geojson');
    if (!fs.existsSync(geojsonPath)) {
      return res.status(404).json({ error: 'Berkas GeoJSON SLS tidak ditemukan di public/data' });
    }

    const fileContent = fs.readFileSync(geojsonPath, 'utf8');
    const geojson = JSON.parse(fileContent);

    if (!geojson.features || !Array.isArray(geojson.features)) {
      return res.status(400).json({ error: 'Format berkas GeoJSON tidak valid' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const feat of geojson.features) {
        const p = feat.properties || {};
        const query = `
          INSERT INTO sls_boundaries 
          (idsls, nmsls, kdsls, nmkec, kdkec, nmdesa, kddesa, nmkab, kdkab, nmprov, kdprov, luas, muatan, kk, subsls, idsubsls, sumber, periode, bbox, geometry)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          nmsls = VALUES(nmsls),
          kdsls = VALUES(kdsls),
          nmkec = VALUES(nmkec),
          kdkec = VALUES(kdkec),
          nmdesa = VALUES(nmdesa),
          kddesa = VALUES(kddesa),
          luas = VALUES(luas),
          muatan = VALUES(muatan),
          kk = VALUES(kk),
          geometry = VALUES(geometry)
        `;

        await connection.execute(query, [
          p.idsls || feat.id || '',
          p.nmsls || '',
          p.kdsls || '',
          p.nmkec || '',
          p.kdkec || '',
          p.nmdesa || '',
          p.kddesa || '',
          p.nmkab || '',
          p.kdkab || '',
          p.nmprov || '',
          p.kdprov || '',
          String(p.luas || ''),
          String(p.muatan || ''),
          String(p.kk || ''),
          String(p.subsls || ''),
          String(p.idsubsls || ''),
          p.sumber || '',
          p.periode || '',
          JSON.stringify(feat.bbox || null),
          JSON.stringify(feat.geometry)
        ]);
      }

      await connection.commit();
      res.json({ message: `Berhasil sinkronisasi ${geojson.features.length} SLS ke database MySQL.` });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error seeding SLS to MySQL:', error);
    res.status(500).json({ error: 'Gagal memasukkan data ke MySQL: ' + error.message });
  }
});

module.exports = router;

