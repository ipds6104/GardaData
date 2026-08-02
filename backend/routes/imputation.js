const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET: Retrieve all imputation data
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM imputation_data');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching imputation data:', error);
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return res.json([]);
    }
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
    // TODO: Persist data to the DB if needed. For now just acknowledge receipt.
    console.log('Received imputation sync payload with', data.length, 'records');
    res.json({ message: 'Imputation data received' });
  } catch (error) {
    console.error('Error syncing imputation data:', error);
    res.status(500).json({ error: 'Failed to process imputation data' });
  }
});

module.exports = router;
