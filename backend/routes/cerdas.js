const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// GET: All Cerdas links
router.get('/links', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cerdas_report_links ORDER BY createdAt ASC');
    // Ensure isOpen is sent as boolean
    const links = rows.map(r => ({
      ...r,
      isOpen: Boolean(r.isOpen)
    }));
    res.json(links);
  } catch (error) {
    console.error('Error fetching Cerdas links:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST: Add new Cerdas link
router.post('/links', async (req, res) => {
  try {
    const { title, url, isOpen } = req.body;
    const id = `link_${Date.now()}`;
    
    await pool.query(
      `INSERT INTO cerdas_report_links (id, title, url, isOpen) VALUES (?, ?, ?, ?)`,
      [id, title, url, isOpen !== false]
    );
    
    res.status(201).json({ id, message: 'Cerdas link created successfully' });
  } catch (error) {
    console.error('Error creating Cerdas link:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT: Update Cerdas link
router.put('/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, isOpen } = req.body;
    
    await pool.query(
      `UPDATE cerdas_report_links SET title=?, url=?, isOpen=? WHERE id=?`,
      [title, url, isOpen !== false, id]
    );
    
    res.json({ message: 'Cerdas link updated successfully' });
  } catch (error) {
    console.error('Error updating Cerdas link:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE: Remove Cerdas link
router.delete('/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cerdas_report_links WHERE id=?', [id]);
    res.json({ message: 'Cerdas link deleted successfully' });
  } catch (error) {
    console.error('Error deleting Cerdas link:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
