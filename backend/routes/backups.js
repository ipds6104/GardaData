const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const {
  createSystemBackup,
  getBackupList,
  getRevisionList,
  restoreRecordFromRevision,
  MONITORED_TABLES
} = require('../services/backupService');

// GET /api/backups: Ambil daftar cadangan & riwayat revisi data
router.get('/', async (req, res) => {
  try {
    const [backups, revisions] = await Promise.all([
      getBackupList(20),
      getRevisionList(null, 30)
    ]);

    res.json({
      status: 'success',
      totalBackups: backups.length,
      monitoredTables: MONITORED_TABLES,
      backups,
      revisions
    });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ error: 'Gagal mengambil data cadangan' });
  }
});

// POST /api/backups/create: Picu pencadangan manual sekarang
router.post('/create', async (req, res) => {
  try {
    const { scope = 'all', specificTables = null } = req.body;
    const result = await createSystemBackup({
      backupType: 'manual',
      scope,
      specificTables
    });

    res.json({
      status: 'success',
      message: `Cadangan manual berhasil dibuat (${result.totalRecords} baris data tersimpan)`,
      backup: result
    });
  } catch (error) {
    console.error('Error creating manual backup:', error);
    res.status(500).json({ error: 'Gagal membuat cadangan data' });
  }
});

// POST /api/backups/restore-revision/:id: Pulihkan 1 data spesifik dari riwayat revisi
router.post('/restore-revision/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await restoreRecordFromRevision(id);
    res.json(result);
  } catch (error) {
    console.error('Error restoring revision:', error);
    res.status(500).json({ error: error.message || 'Gagal memulihkan revisi' });
  }
});

// GET /api/backups/download/:fileName: Unduh file cadangan JSON
router.get('/download/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    // Sanitasi nama file agar tidak ada directory traversal
    const safeName = path.basename(fileName);
    const filePath = path.join(__dirname, '../backups', safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File cadangan tidak ditemukan' });
    }

    res.download(filePath, safeName);
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengunduh file cadangan' });
  }
});

module.exports = router;
