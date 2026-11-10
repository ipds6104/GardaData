const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const pool = require('../db');
const {
  createSystemBackup,
  getBackupList,
  getRevisionList,
  restoreRecordFromRevision,
  getSnapshotList,
  restoreFeatureSnapshot,
  restoreFullBackup,
  MONITORED_TABLES
} = require('../services/backupService');

// GET /api/backups: Ambil daftar cadangan & riwayat revisi data
router.get('/', async (req, res) => {
  try {
    const [backups, revisions] = await Promise.all([
      getBackupList(30),
      getRevisionList(null, 50)
    ]);

    // Hitung ukuran file fisik jika ada di disk
    const backupsWithStats = backups.map(b => {
      let fileSize = null;
      let fileExists = false;
      if (b.filePath) {
        const fullPath = path.join(__dirname, '../backups', b.filePath);
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          fileSize = (stats.size / 1024).toFixed(1) + ' KB';
          fileExists = true;
        }
      }
      return {
        ...b,
        fileSize: fileSize || 'Database Only',
        fileExists
      };
    });

    res.json({
      status: 'success',
      totalBackups: backups.length,
      monitoredTables: MONITORED_TABLES,
      backups: backupsWithStats,
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

// GET /api/backups/snapshots: Daftar master snapshot independen
router.get('/snapshots', async (req, res) => {
  try {
    const snapshots = await getSnapshotList();
    res.json({
      status: 'success',
      snapshots
    });
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar master snapshot' });
  }
});

// POST /api/backups/restore-feature/:feature: Pulihkan fitur dari snapshot master
router.post('/restore-feature/:feature', async (req, res) => {
  try {
    const { feature } = req.params;
    const result = await restoreFeatureSnapshot(feature);
    res.json({
      status: 'success',
      message: `Pemulihan data fitur [${feature.toUpperCase()}] berhasil diselesaikan.`,
      result
    });
  } catch (error) {
    console.error(`Error restoring feature ${req.params.feature}:`, error);
    res.status(500).json({ error: error.message || 'Gagal memulihkan data fitur' });
  }
});

// POST /api/backups/restore-full/:id: Pulihkan seluruh database dari arsip cadangan
router.post('/restore-full/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await restoreFullBackup(id);
    res.json(result);
  } catch (error) {
    console.error(`Error restoring full backup ${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Gagal memulihkan cadangan menyeluruh' });
  }
});

// GET /api/backups/download-zip/:id: Unduh cadangan dalam format ZIP lengkap
router.get('/download-zip/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM system_data_backups WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Data cadangan tidak ditemukan' });
    }

    const backup = rows[0];
    const payload = typeof backup.dataPayload === 'string' ? JSON.parse(backup.dataPayload) : backup.dataPayload;

    const dateStr = new Date(backup.createdAt).toISOString().replace(/[:.]/g, '-');
    const zipFileName = `gardadata_backup_${backup.backupType}_${dateStr}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    // 1. Tambahkan manifest ringkasan
    const manifest = {
      system: 'Garda Data - BPS Kabupaten Mempawah',
      backupId: backup.id,
      backupType: backup.backupType,
      scope: backup.scope,
      totalRecords: backup.totalRecords,
      tablesIncluded: typeof backup.tablesIncluded === 'string' ? JSON.parse(backup.tablesIncluded) : backup.tablesIncluded,
      createdAt: backup.createdAt,
      exportedAt: new Date().toISOString()
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    // 2. Tambahkan setiap tabel dalam folder tables/
    if (payload.tables) {
      for (const [tableName, tableRows] of Object.entries(payload.tables)) {
        archive.append(JSON.stringify(tableRows, null, 2), { name: `tables/${tableName}.json` });
      }
    }

    // 3. Tambahkan full database dump
    archive.append(JSON.stringify(payload, null, 2), { name: 'full_database_dump.json' });

    await archive.finalize();
  } catch (error) {
    console.error('Error generating zip backup:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal membuat file zip cadangan' });
  }
});

// GET /api/backups/download/:fileName: Unduh file cadangan JSON asli
router.get('/download/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
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
