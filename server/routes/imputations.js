const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Make sure imputation_data table exists
const ensureTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS imputation_data (
                id VARCHAR(50) PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                data LONGTEXT NOT NULL,
                updated_at BIGINT NOT NULL
            )
        `);
    } catch (e) {
        console.error('Failed to create imputation_data table', e);
    }
};

ensureTable();

// GET /api/imputations - Get all imputation data (requires auth)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM imputation_data');
        
        const data = rows.map(row => {
            try {
                return JSON.parse(row.data);
            } catch (e) {
                console.error(`Failed to parse imputation data ID: ${row.id}`, e);
                return null;
            }
        }).filter(Boolean);
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching imputation data', error: err.message });
    }
});

// POST /api/imputations/sync - Batch upsert imputation data (requires auth)
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
            const { id, type, updatedAt } = record;
            const dataStr = JSON.stringify(record);
            const time = updatedAt || Date.now();
            
            await connection.query(`
                INSERT INTO imputation_data (id, type, data, updated_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                type = VALUES(type),
                data = VALUES(data),
                updated_at = VALUES(updated_at)
            `, [id, type || 'UNKNOWN', dataStr, time]);
        }
        
        await connection.commit();
        res.json({ message: 'Successfully synced imputation records', syncedCount: records.length });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: 'Server error during imputation sync', error: err.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
