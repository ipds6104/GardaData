const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// GET: All monitoring configs
router.get('/configs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM monitoring_configs ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching configs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST: Add new config
router.post('/configs', async (req, res) => {
  try {
    const { kegiatan, subKegiatan, sheetUrl, sheetName, startDate, endDate, isActive, icon, color } = req.body;
    const id = crypto.randomUUID();
    
    await pool.query(
      `INSERT INTO monitoring_configs (id, kegiatan, subKegiatan, sheetUrl, sheetName, startDate, endDate, isActive, icon, color) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, kegiatan, subKegiatan || '', sheetUrl, sheetName, startDate, endDate, isActive !== false, icon || 'pertanian', color || 'emerald']
    );
    
    res.status(201).json({ id, message: 'Config created successfully' });
  } catch (error) {
    console.error('Error creating config:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT: Update config
router.put('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { kegiatan, subKegiatan, sheetUrl, sheetName, startDate, endDate, isActive, icon, color } = req.body;
    
    await pool.query(
      `UPDATE monitoring_configs 
       SET kegiatan=?, subKegiatan=?, sheetUrl=?, sheetName=?, startDate=?, endDate=?, isActive=?, icon=?, color=? 
       WHERE id=?`,
      [kegiatan, subKegiatan || '', sheetUrl, sheetName, startDate, endDate, isActive !== false, icon || 'pertanian', color || 'emerald', id]
    );
    
    res.json({ message: 'Config updated successfully' });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE: Remove config
router.delete('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM monitoring_snapshots WHERE configId=?', [id]);
    await pool.query('DELETE FROM monitoring_configs WHERE id=?', [id]);
    res.json({ message: 'Config deleted successfully' });
  } catch (error) {
    console.error('Error deleting config:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET: Snapshots for a config
router.get('/snapshots/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM monitoring_snapshots WHERE configId=? ORDER BY snapshotDate ASC',
      [configId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET: Daily Logs for a config
router.get('/logs/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM monitoring_log_harian WHERE configId=? ORDER BY tanggalUpdate DESC',
      [configId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET: Proxy to fetch Google Sheet to bypass CORS
router.get('/proxy-sheet', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    if (!url.startsWith('https://docs.google.com/')) {
       return res.status(403).json({ error: 'Invalid URL' });
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch from Google Sheets');
    const text = await response.text();
    res.send(text);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request' });
  }
});

module.exports = router;
