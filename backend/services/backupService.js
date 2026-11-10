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

/**
 * 6. Kelola Snapshot Master Independen
 */
const SNAPSHOT_DIR = path.join(__dirname, '../../database/snapshots');

async function getSnapshotList() {
  const result = [];
  const targets = [
    { key: 'mitra', file: 'master_snapshot_mitra.json', title: 'Penilaian Kinerja Mitra SE2026', desc: '388 Mitra dengan 232 evaluasi dan catatan kinerja lengkap' },
    { key: 'lms', file: 'master_snapshot_lms.json', title: 'Modul & Pelatihan LMS BPS', desc: 'Struktur standar pelatihan dengan 5 kategori materi & presensi' },
    { key: 'laporan', file: 'master_snapshot_laporan.json', title: 'Sistem Laporan Pendataan', desc: 'Skema kegiatan sensus/survei, formulir pelaporan & field kontrol mutu' },
    { key: 'all', file: 'master_snapshot_all.json', title: 'Konsolidasi Sistem Lengkap', desc: 'Snapshot menyeluruh gabungan Mitra, LMS, dan Laporan' }
  ];

  for (const item of targets) {
    const fullPath = path.join(SNAPSHOT_DIR, item.file);
    const exists = fs.existsSync(fullPath);
    let size = '0 KB';
    let updatedAt = null;
    let details = {};

    if (exists) {
      try {
        const stats = fs.statSync(fullPath);
        size = (stats.size / 1024).toFixed(1) + ' KB';
        updatedAt = stats.mtime.toISOString();
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (item.key === 'mitra') {
          details = { totalRecords: content.totalRecords, evaluatedRecords: content.evaluatedRecords };
        } else if (item.key === 'lms') {
          details = { totalTrainings: content.totalTrainings };
        } else if (item.key === 'laporan') {
          details = { totalActivities: content.totalActivities, totalForms: content.totalForms, totalFields: content.totalFields };
        }
      } catch (e) {
        console.warn(`[Snapshot] Gagal membaca metadata ${item.file}:`, e.message);
      }
    }

    result.push({
      feature: item.key,
      fileName: item.file,
      title: item.title,
      description: item.desc,
      exists,
      size,
      updatedAt,
      details
    });
  }

  return result;
}

/**
 * 7. Pulihkan Fitur Tertentu dari Snapshot Master
 */
async function restoreFeatureSnapshot(feature) {
  const SECRET_SEED = 'GARDA_DATA_BPS_MEMPAWAH_SECRET_KEY_2026';
  const ALGORITHM = 'aes-256-gcm';

  const encryptPublicData = (plainObj) => {
    const key = crypto.createHash('sha256').update(SECRET_SEED).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const jsonStr = JSON.stringify(plainObj);
    let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      encrypted: true,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
      data: encrypted
    };
  };

  const results = {};

  // Pemulihan Mitra
  if (feature === 'mitra' || feature === 'all') {
    const filePath = path.join(SNAPSHOT_DIR, 'master_snapshot_mitra.json');
    if (fs.existsSync(filePath)) {
      const snap = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const list = snap.data || [];

      // Update physical files
      const serverPath = path.join(__dirname, '../../server/data/mitra_evaluations.json');
      fs.mkdirSync(path.dirname(serverPath), { recursive: true });
      fs.writeFileSync(serverPath, JSON.stringify(list, null, 2), 'utf8');

      const encPayload = encryptPublicData(list);
      const publicPath = path.join(__dirname, '../../public/data/initial_mitra_se2026.json');
      fs.mkdirSync(path.dirname(publicPath), { recursive: true });
      fs.writeFileSync(publicPath, JSON.stringify(encPayload), 'utf8');

      const distPath = path.join(__dirname, '../../dist/data/initial_mitra_se2026.json');
      if (fs.existsSync(path.dirname(distPath))) {
        fs.writeFileSync(distPath, JSON.stringify(encPayload), 'utf8');
      }

      // Sync ke DB jika terhubung
      let dbCount = 0;
      try {
        for (const m of list) {
          await pool.query(
            `INSERT INTO mitra_evaluations 
              (id, idSobat, nama, email, hp, jenisKelamin, agama, pendidikan, pekerjaan, pengalamanSensus, 
               keahlianKhusus, alamat, kecamatan, desa, posisi, penugasan, nilai, catatan, kategori, pembina, isDuplicate, duplicateWithId, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
              idSobat = VALUES(idSobat), nama = VALUES(nama), email = VALUES(email), hp = VALUES(hp),
              alamat = VALUES(alamat), kecamatan = VALUES(kecamatan), desa = VALUES(desa),
              posisi = VALUES(posisi), penugasan = VALUES(penugasan), nilai = VALUES(nilai),
              catatan = VALUES(catatan), kategori = VALUES(kategori), pembina = VALUES(pembina),
              isDuplicate = VALUES(isDuplicate), duplicateWithId = VALUES(duplicateWithId), updatedAt = NOW()`,
            [
              m.id, m.idSobat || m.id, m.nama || '', m.email || '', m.hp || '',
              m.jenisKelamin || 'L', m.agama || 'Islam', m.pendidikan || 'SMA/Sederajat',
              m.pekerjaan || 'Lainnya', m.pengalamanSensus || 'Belum Ada',
              m.keahlianKhusus || 'IT', m.alamat || '', m.kecamatan || '', m.desa || '',
              m.posisi || 'Mitra Pendataan', m.penugasan || 'Sensus Ekonomi 2026',
              m.nilai !== undefined && m.nilai !== null ? m.nilai : null,
              m.catatan || '', m.kategori || 'Belum Diberi Penilaian',
              m.pembina || 'Ahmad Aulia Rahman', m.isDuplicate ? 1 : 0, m.duplicateWithId || null
            ]
          );
          dbCount++;
        }
      } catch (e) {
        console.warn('[Snapshot] DB Sync Mitra lewati:', e.message);
      }

      const evalCount = list.filter(m => (m.nilai != null && m.nilai > 0) || (m.catatan && m.catatan.trim() !== '')).length;
      results.mitra = { total: list.length, evaluated: evalCount, dbSynced: dbCount };
    }
  }

  // Pemulihan LMS
  if (feature === 'lms' || feature === 'all') {
    const filePath = path.join(SNAPSHOT_DIR, 'master_snapshot_lms.json');
    if (fs.existsSync(filePath)) {
      const snap = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const trainings = snap.data || [];
      let dbCount = 0;
      try {
        for (const t of trainings) {
          await pool.query(
            `INSERT INTO lms_trainings (id, name, startDate, endDate, period, icon, isActive, buttons)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
              name = VALUES(name), startDate = VALUES(startDate), endDate = VALUES(endDate),
              period = VALUES(period), icon = VALUES(icon), isActive = VALUES(isActive), buttons = VALUES(buttons)`,
            [t.id, t.name, t.startDate || null, t.endDate || null, t.period || '', t.icon || 'pendidikan', t.isActive !== false, JSON.stringify(t.buttons || [])]
          );
          dbCount++;
        }
      } catch (e) {
        console.warn('[Snapshot] DB Sync LMS lewati:', e.message);
      }
      results.lms = { total: trainings.length, dbSynced: dbCount };
    }
  }

  // Pemulihan Laporan
  if (feature === 'laporan' || feature === 'all') {
    const filePath = path.join(SNAPSHOT_DIR, 'master_snapshot_laporan.json');
    if (fs.existsSync(filePath)) {
      const snap = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const { activities = [], forms = [], fields = [] } = snap.data || {};
      try {
        for (const act of activities) {
          await pool.query(
            `INSERT INTO laporan_activities (id, title, description, category, startDate, endDate, isOpen, icon, sheetUrl, sheetName, settings)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), isOpen = VALUES(isOpen)`,
            [act.id, act.title, act.description, act.category, act.startDate, act.endDate, act.isOpen ? 1 : 0, act.icon, act.sheetUrl, act.sheetName, act.settings]
          );
        }
        for (const form of forms) {
          await pool.query(
            `INSERT INTO laporan_forms (id, activityId, title, icon, orderIndex, sheetUrl, sheetName, webhookUrl, groupingLevels, settings)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE title = VALUES(title), icon = VALUES(icon)`,
            [form.id, form.activityId, form.title, form.icon, form.orderIndex, form.sheetUrl, form.sheetName, form.webhookUrl, form.groupingLevels, form.settings]
          );
        }
        for (const fld of fields) {
          await pool.query(
            `INSERT INTO laporan_fields (id, formId, label, columnName, dataType, isRequired, groupSection, orderIndex, options, isKey, isLabel, isEditable)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE label = VALUES(label), dataType = VALUES(dataType)`,
            [fld.id, fld.formId, fld.label, fld.columnName, fld.dataType, fld.isRequired, fld.groupSection, fld.orderIndex, fld.options, fld.isKey, fld.isLabel, fld.isEditable]
          );
        }
      } catch (e) {
        console.warn('[Snapshot] DB Sync Laporan lewati:', e.message);
      }
      results.laporan = { activities: activities.length, forms: forms.length, fields: fields.length };
    }
  }

  return { success: true, feature, results };
}

/**
 * 8. Pulihkan Full Database dari Arsip Cadangan
 */
async function restoreFullBackup(backupId) {
  const [rows] = await pool.query('SELECT * FROM system_data_backups WHERE id = ?', [backupId]);
  if (!rows || rows.length === 0) {
    throw new Error('Data cadangan tidak ditemukan di database');
  }

  const backup = rows[0];
  const payload = typeof backup.dataPayload === 'string' ? JSON.parse(backup.dataPayload) : backup.dataPayload;
  if (!payload || !payload.tables) {
    throw new Error('Struktur arsip cadangan tidak valid');
  }

  let restoredTables = 0;
  let restoredRecords = 0;

  for (const [table, records] of Object.entries(payload.tables)) {
    if (!Array.isArray(records) || records.length === 0) continue;
    try {
      for (const row of records) {
        const fields = Object.keys(row);
        const placeholders = fields.map(() => '?').join(', ');
        const updateClauses = fields.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ');
        const values = fields.map(k => {
          const val = row[k];
          if (val !== null && typeof val === 'object') return JSON.stringify(val);
          return val;
        });

        await pool.query(
          `INSERT INTO \`${table}\` (${fields.map(k => `\`${k}\``).join(', ')})
           VALUES (${placeholders})
           ON DUPLICATE KEY UPDATE ${updateClauses}`,
          values
        );
        restoredRecords++;
      }
      restoredTables++;
    } catch (tblErr) {
      console.warn(`[BackupService] Gagal memulihkan tabel ${table}:`, tblErr.message);
    }
  }

  return {
    success: true,
    message: `Berhasil memulihkan ${restoredRecords} baris data dari ${restoredTables} tabel.`,
    backupId,
    restoredTables,
    restoredRecords
  };
}

module.exports = {
  createSystemBackup,
  recordTableRevision,
  getBackupList,
  getRevisionList,
  restoreRecordFromRevision,
  getSnapshotList,
  restoreFeatureSnapshot,
  restoreFullBackup,
  MONITORED_TABLES
};

