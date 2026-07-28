const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// GET: All LMS trainings
router.get('/configs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lms_trainings ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching LMS trainings:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST: Add new LMS training
router.post('/configs', async (req, res) => {
  try {
    const { name, startDate, endDate, period, icon, isActive, buttons } = req.body;
    const id = crypto.randomUUID();
    
    await pool.query(
      `INSERT INTO lms_trainings (id, name, startDate, endDate, period, icon, isActive, buttons) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, startDate || null, endDate || null, period || '', icon || 'pendidikan', isActive !== false, JSON.stringify(buttons || [])]
    );
    
    res.status(201).json({ id, message: 'LMS Training created successfully' });
  } catch (error) {
    console.error('Error creating LMS training:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT: Update LMS training
router.put('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, period, icon, isActive, buttons } = req.body;
    
    await pool.query(
      `UPDATE lms_trainings 
       SET name=?, startDate=?, endDate=?, period=?, icon=?, isActive=?, buttons=? 
       WHERE id=?`,
      [name, startDate || null, endDate || null, period || '', icon || 'pendidikan', isActive !== false, JSON.stringify(buttons || []), id]
    );
    
    res.json({ message: 'LMS Training updated successfully' });
  } catch (error) {
    console.error('Error updating LMS training:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE: Remove LMS training
router.delete('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM lms_trainings WHERE id=?', [id]);
    res.json({ message: 'LMS Training deleted successfully' });
  } catch (error) {
    console.error('Error deleting LMS training:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
