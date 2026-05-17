const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/measurements - Get all measurements (requires auth)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM building_measurements ORDER BY timestamp DESC');
        
        // Parse geojson strings back to objects
        const measurements = rows.map(row => {
            try {
                return {
                    id: row.id,
                    petugasId: row.petugas_id,
                    petugasName: row.petugas_name,
                    timestamp: Number(row.timestamp),
                    geojson: JSON.parse(row.geojson),
                    luasTapak: row.luas_tapak,
                    jumlahLantai: row.jumlah_lantai,
                    jenisBangunan: row.jenis_bangunan,
                    perkiraanLuasLantai: row.perkiraan_luas_lantai,
                    latitude: row.latitude,
                    longitude: row.longitude,
                    metodeDigitasi: row.metode_digitasi,
                    syncStatus: row.sync_status
                };
            } catch (e) {
                console.error(`Failed to parse geojson for measurement ID: ${row.id}`, e);
                return row;
            }
        });
        
        res.json(measurements);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching measurements', error: err.message });
    }
});

// POST /api/measurements - Create new measurement (requires auth)
router.post('/', authMiddleware, async (req, res) => {
    const {
        id, petugasId, petugasName, timestamp, geojson, luasTapak,
        jumlahLantai, jenisBangunan, perkiraanLuasLantai, latitude, longitude, metodeDigitasi
    } = req.body;
    
    if (!id || !geojson || !luasTapak || !jenisBangunan || !petugasId) {
        return res.status(400).json({ message: 'Missing required measurement fields' });
    }
    
    try {
        const geojsonStr = typeof geojson === 'string' ? geojson : JSON.stringify(geojson);
        
        await pool.query(`
            INSERT INTO building_measurements 
            (id, petugas_id, petugas_name, timestamp, geojson, luas_tapak, jumlah_lantai, jenis_bangunan, perkiraan_luas_lantai, latitude, longitude, metode_digitasi, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
            ON DUPLICATE KEY UPDATE
            petugas_id = VALUES(petugas_id),
            petugas_name = VALUES(petugas_name),
            timestamp = VALUES(timestamp),
            geojson = VALUES(geojson),
            luas_tapak = VALUES(luas_tapak),
            jumlah_lantai = VALUES(jumlah_lantai),
            jenis_bangunan = VALUES(jenis_bangunan),
            perkiraan_luas_lantai = VALUES(perkiraan_luas_lantai),
            latitude = VALUES(latitude),
            longitude = VALUES(longitude),
            metode_digitasi = VALUES(metode_digitasi),
            sync_status = 'synced'
        `, [
            id, petugasId, petugasName, timestamp, geojsonStr, luasTapak,
            jumlahLantai, jenisBangunan, perkiraanLuasLantai, latitude, longitude, metodeDigitasi
        ]);
        
        res.status(201).json({ message: 'Measurement saved successfully', id });
    } catch (err) {
        res.status(500).json({ message: 'Server error saving measurement', error: err.message });
    }
});

// POST /api/measurements/sync - Sync multiple measurements in batch (requires auth)
router.post('/sync', authMiddleware, async (req, res) => {
    const records = req.body; // Expecting an array
    
    if (!Array.isArray(records)) {
        return res.status(400).json({ message: 'Request body must be an array of records' });
    }
    
    if (records.length === 0) {
        return res.json({ message: 'No records to sync', syncedCount: 0 });
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        for (const record of records) {
            const {
                id, petugasId, petugasName, timestamp, geojson, luasTapak,
                jumlahLantai, jenisBangunan, perkiraanLuasLantai, latitude, longitude, metodeDigitasi
            } = record;
            
            const geojsonStr = typeof geojson === 'string' ? geojson : JSON.stringify(geojson);
            
            await connection.query(`
                INSERT INTO building_measurements 
                (id, petugas_id, petugas_name, timestamp, geojson, luas_tapak, jumlah_lantai, jenis_bangunan, perkiraan_luas_lantai, latitude, longitude, metode_digitasi, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
                ON DUPLICATE KEY UPDATE
                petugas_id = VALUES(petugas_id),
                petugas_name = VALUES(petugas_name),
                timestamp = VALUES(timestamp),
                geojson = VALUES(geojson),
                luas_tapak = VALUES(luas_tapak),
                jumlah_lantai = VALUES(jumlah_lantai),
                jenis_bangunan = VALUES(jenis_bangunan),
                perkiraan_luas_lantai = VALUES(perkiraan_luas_lantai),
                latitude = VALUES(latitude),
                longitude = VALUES(longitude),
                metode_digitasi = VALUES(metode_digitasi),
                sync_status = 'synced'
            `, [
                id, petugasId, petugasName, timestamp, geojsonStr, luasTapak,
                jumlahLantai, jenisBangunan, perkiraanLuasLantai, latitude, longitude, metodeDigitasi
            ]);
        }
        
        await connection.commit();
        res.json({ message: 'Successfully synced offline records', syncedCount: records.length });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: 'Server error during batch sync', error: err.message });
    } finally {
        connection.release();
    }
});

// DELETE /api/measurements/:id - Delete a measurement (requires auth)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM building_measurements WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Measurement not found' });
        }
        
        res.json({ message: 'Measurement deleted successfully', id: req.params.id });
    } catch (err) {
        res.status(500).json({ message: 'Server error deleting measurement', error: err.message });
    }
});

module.exports = router;
