const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET: Retrieve all imputation data
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM imputation_data');
    const result = rows.map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
    res.json(result);
  } catch (error) {
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return res.json([]);
    }
    console.error('Error fetching imputation data:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST: Receive synced imputation data from frontend
router.post('/sync', async (req, res) => {
  try {
    const data = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Expected an array of imputation records' });
    }
    
    for (const item of data) {
      if (!item.id) continue;
      await pool.query(
        `INSERT INTO imputation_data (id, data) VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE data = VALUES(data)`,
        [item.id, JSON.stringify(item)]
      );
    }

    console.log('Received & persisted imputation sync payload with', data.length, 'records');
    res.json({ message: 'Imputation data synced successfully' });
  } catch (error) {
    console.error('Error syncing imputation data:', error);
    res.status(500).json({ error: 'Failed to process imputation data' });
  }
});

module.exports = router;
