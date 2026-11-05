const pool = require('../db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Folder penyimpanan file fisik backup di server
const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Daftar tabel yang wajib dicadangkan
const MONITORED_TABLES = [
  'lms_trainings',
  'monitoring_configs',
  'monitoring_snapshots',
  'monitoring_log_harian',
  'laporan_activities',
  'laporan_forms',
  'laporan_fields',
  'laporan_records',
  'laporan_report_links',
  'mitra_evaluations',
  'building_measurements',
  'infrastructure_items',
  'social_phenomenon',
  'classifications',
  'imputation_data'
];

/**
 * 1. Simpan Snapshot Sebelum Update/Delete (Point-in-Time Revision)
 * Mencegah data tertimpa atau terhapus tanpa jejak
 */
async function recordTableRevision({ tableName, recordId, action = 'UPDATE', previousData, changedBy = 'system' }) {
  try {
    if (!previousData || !tableName || !recordId) return;

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO system_table_revisions (id, tableName, recordId, action, previousData, changedBy) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, tableName, recordId, action, JSON.stringify(previousData), changedBy]
    );

    // Auto-prune riwayat revisi yang lebih lama dari 30 hari
    pool.query(`DELETE FROM system_table_revisions WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY)`).catch(() => {});
    
    return id;
  } catch (err) {
    console.error(`[BackupService] Gagal merekam revisi ${tableName}:${recordId}:`, err.message);
  }
}

/**
 * 2. Eksekusi Pencadangan Data Periodik (Full / Scope)
 */
async function createSystemBackup({ backupType = 'scheduled', scope = 'all', specificTables = null } = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupId = crypto.randomUUID();
  const tablesToDump = specificTables && Array.isArray(specificTables) && specificTables.length > 0 
    ? specificTables 
    : MONITORED_TABLES;

  console.log(`[BackupService] Memulai pencadangan data (${backupType}, scope: ${scope})...`);

  const dumpPayload = {
    version: '1.0',
    backupId,
    backupType,
    scope,
    createdAt: new Date().toISOString(),
    tables: {}
  };

  let totalRecords = 0;
  const tablesIncluded = [];

  for (const table of tablesToDump) {
    try {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\``);
      dumpPayload.tables[table] = rows;
      totalRecords += rows.length;
      tablesIncluded.push(table);
    } catch (err) {
      console.warn(`[BackupService] Lewati tabel ${table} (${err.message})`);
    }
  }

  // A. Simpan ke file JSON fisik di disk
  const fileName = `backup_${backupType}_${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(dumpPayload, null, 2), 'utf8');
  } catch (fsErr) {
    console.error('[BackupService] Gagal menulis file cadangan ke disk:', fsErr.message);
  }

  // B. Simpan ke database tabel system_data_backups
  try {
    await pool.query(
      `INSERT INTO system_data_backups (id, backupType, scope, tablesIncluded, dataPayload, totalRecords, filePath) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [backupId, backupType, scope, JSON.stringify(tablesIncluded), JSON.stringify(dumpPayload), totalRecords, fileName]
    );
  } catch (dbErr) {
    console.error('[BackupService] Gagal menyimpan cadangan ke tabel database:', dbErr.message);
  }

  // C. Retensi file: Pertahankan maksimal 30 file backup terakhir di disk
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      for (const oldFile of files.slice(30)) {
        fs.unlinkSync(path.join(BACKUP_DIR, oldFile.name));
      }
    }
  } catch (cleanErr) {
    console.warn('[BackupService] Pembersihan file lama dilewati:', cleanErr.message);
  }

  console.log(`[BackupService] ✅ Pencadangan selesai: ${totalRecords} baris data berhasil diamankan (${fileName})`);
  return {
    id: backupId,
    backupType,
    scope,
    totalRecords,
    tablesIncluded,
    fileName,
    createdAt: dumpPayload.createdAt
  };
}

/**
 * 3. Ambil Daftar Cadangan Terkini
 */
async function getBackupList(limit = 20) {
  try {
    const [rows] = await pool.query(
      `SELECT id, backupType, scope, tablesIncluded, totalRecords, filePath, createdAt 
       FROM system_data_backups 
       ORDER BY createdAt DESC 
       LIMIT ?`,
      [limit]
    );
    return rows.map(r => ({
      ...r,
      tablesIncluded: typeof r.tablesIncluded === 'string' ? JSON.parse(r.tablesIncluded) : r.tablesIncluded
    }));
  } catch (err) {
    console.error('[BackupService] Gagal mengambil daftar cadangan:', err);
    return [];
  }
}

/**
 * 4. Ambil Riwayat Revisi Terakhir (per tabel / global)
 */
async function getRevisionList(tableName = null, limit = 50) {
  try {
    let query = `SELECT id, tableName, recordId, action, changedBy, createdAt, previousData FROM system_table_revisions`;
    const params = [];
    if (tableName) {
      query += ` WHERE tableName = ?`;
      params.push(tableName);
    }
    query += ` ORDER BY createdAt DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(query, params);
    return rows.map(r => ({
      ...r,
      previousData: typeof r.previousData === 'string' ? JSON.parse(r.previousData) : r.previousData
    }));
  } catch (err) {
    console.error('[BackupService] Gagal mengambil daftar revisi:', err);
    return [];
  }
}

/**
 * 5. Pulihkan Satu Rekor dari Riwayat Revisi
 */
async function restoreRecordFromRevision(revisionId) {
  const [rows] = await pool.query(`SELECT * FROM system_table_revisions WHERE id = ?`, [revisionId]);
  if (!rows || rows.length === 0) {
    throw new Error('Data revisi tidak ditemukan');
  }

  const revision = rows[0];
  const { tableName, recordId, previousData } = revision;
  const data = typeof previousData === 'string' ? JSON.parse(previousData) : previousData;

  console.log(`[BackupService] Memulihkan data ${tableName} recordId ${recordId}...`);

  if (tableName === 'lms_trainings') {
    await pool.query(
      `UPDATE lms_trainings 
       SET name=?, startDate=?, endDate=?, period=?, icon=?, isActive=?, buttons=? 
       WHERE id=?`,
      [
        data.name,
        data.startDate || null,
        data.endDate || null,
        data.period || '',
        data.icon || 'pendidikan',
        data.isActive !== false,
        typeof data.buttons === 'string' ? data.buttons : JSON.stringify(data.buttons || []),
        recordId
      ]
    );
    return { success: true, message: `Pelatihan "${data.name}" berhasil dipulihkan dari revisi ${revisionId}` };
  }

  // Generic fallback for other tables
  const fields = Object.keys(data).filter(k => k !== 'createdAt' && k !== 'updatedAt');
  const setClauses = fields.map(k => `\`${k}\` = ?`).join(', ');
  const values = fields.map(k => {
    const val = data[k];
    if (val !== null && typeof val === 'object') return JSON.stringify(val);
    return val;
  });

  await pool.query(
    `UPDATE \`${tableName}\` SET ${setClauses} WHERE id = ?`,
    [...values, recordId]
  );

  return { success: true, message: `Data ${tableName} (${recordId}) berhasil dipulihkan.` };
}

module.exports = {
  createSystemBackup,
  recordTableRevision,
  getBackupList,
  getRevisionList,
  restoreRecordFromRevision,
  MONITORED_TABLES
};

