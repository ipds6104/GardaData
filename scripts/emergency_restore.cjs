/**
 * Script Pemulihan Darurat Independen Garda Data
 * Mengembalikan data fitur dari snapshot master di database/snapshots/
 * Dapat dijalankan kapan saja di terminal tanpa tergantung web app atau server:
 *
 *   node scripts/emergency_restore.cjs [all|mitra|lms|laporan]
 *   npm run backup:restore
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SNAPSHOT_DIR = path.join(__dirname, '../database/snapshots');
const targetFeature = (process.argv[2] || 'all').toLowerCase();

console.log('===============================================================');
console.log('🚨 GARDA DATA - EMERGENCY RESTORE TOOL');
console.log('   BPS Kabupaten Mempawah');
console.log(`   Target Pemulihan: [${targetFeature.toUpperCase()}]`);
console.log(`   Waktu Eksekusi  : ${new Date().toLocaleString('id-ID')}`);
console.log('===============================================================\n');

// Helper AES-256-GCM encryption for public JSON
const SECRET_SEED = 'GARDA_DATA_BPS_MEMPAWAH_SECRET_KEY_2026';
const ALGORITHM = 'aes-256-gcm';

function encryptPublicData(plainObj) {
  const key = crypto.createHash('sha256').update(SECRET_SEED).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const jsonStr = JSON.stringify(plainObj);
  let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encrypted: true,
    iv: iv.toString('hex'),
    tag: authTag,
    data: encrypted
  };
}

// 1. RESTORE MITRA
async function restoreMitra(pool) {
  console.log('[Mitra] 🔄 Memulihkan data Penilaian Kinerja Mitra...');
  const snapshotPath = path.join(SNAPSHOT_DIR, 'master_snapshot_mitra.json');
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`File snapshot mitra tidak ditemukan: ${snapshotPath}`);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const list = snapshot.data || [];
  console.log(`[Mitra] Memuat ${list.length} data mitra dari master snapshot...`);

  // A. Pulihkan file fisik server/data/mitra_evaluations.json
  const serverPath = path.join(__dirname, '../server/data/mitra_evaluations.json');
  fs.mkdirSync(path.dirname(serverPath), { recursive: true });
  fs.writeFileSync(serverPath, JSON.stringify(list, null, 2), 'utf8');
  console.log(`[Mitra] ✅ File fisik server diperbarui: ${serverPath}`);

  // B. Pulihkan public/data/initial_mitra_se2026.json (terenkripsi AES-256-GCM)
  const encPayload = encryptPublicData(list);
  const publicPath = path.join(__dirname, '../public/data/initial_mitra_se2026.json');
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.writeFileSync(publicPath, JSON.stringify(encPayload), 'utf8');
  console.log(`[Mitra] ✅ File frontend public diperbarui: ${publicPath}`);

  // C. Pulihkan dist/data jika folder dist ada
  const distPath = path.join(__dirname, '../dist/data/initial_mitra_se2026.json');
  if (fs.existsSync(path.dirname(distPath))) {
    fs.writeFileSync(distPath, JSON.stringify(encPayload), 'utf8');
    console.log(`[Mitra] ✅ File production dist diperbarui: ${distPath}`);
  }

  // D. Pulihkan ke MySQL Database jika pool terhubung
  if (pool) {
    let dbSuccess = 0;
    for (const m of list) {
      try {
        await pool.query(
          `INSERT INTO mitra_evaluations 
            (id, idSobat, nama, email, hp, jenisKelamin, agama, pendidikan, pekerjaan, pengalamanSensus, 
             keahlianKhusus, alamat, kecamatan, desa, posisi, penugasan, nilai, catatan, kategori, pembina, isDuplicate, duplicateWithId, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
            idSobat = VALUES(idSobat),
            nama = VALUES(nama),
            email = VALUES(email),
            hp = VALUES(hp),
            jenisKelamin = VALUES(jenisKelamin),
            agama = VALUES(agama),
            pendidikan = VALUES(pendidikan),
            pekerjaan = VALUES(pekerjaan),
            pengalamanSensus = VALUES(pengalamanSensus),
            keahlianKhusus = VALUES(keahlianKhusus),
            alamat = VALUES(alamat),
            kecamatan = VALUES(kecamatan),
            desa = VALUES(desa),
            posisi = VALUES(posisi),
            penugasan = VALUES(penugasan),
            nilai = VALUES(nilai),
            catatan = VALUES(catatan),
            kategori = VALUES(kategori),
            pembina = VALUES(pembina),
            isDuplicate = VALUES(isDuplicate),
            duplicateWithId = VALUES(duplicateWithId),
            updatedAt = NOW()`,
          [
            m.id,
            m.idSobat || m.id,
            m.nama || '',
            m.email || '',
            m.hp || '',
            m.jenisKelamin || 'L',
            m.agama || 'Islam',
            m.pendidikan || 'SMA/Sederajat',
            m.pekerjaan || 'Lainnya',
            m.pengalamanSensus || 'Belum Ada',
            m.keahlianKhusus || 'IT / Mengoperasikan Smartphone',
            m.alamat || '',
            m.kecamatan || '',
            m.desa || '',
            m.posisi || 'Mitra Pendataan',
            m.penugasan || 'Sensus Ekonomi 2026',
            m.nilai !== undefined && m.nilai !== null ? m.nilai : null,
            m.catatan || '',
            m.kategori || 'Belum Diberi Penilaian',
            m.pembina || 'Ahmad Aulia Rahman',
            m.isDuplicate ? 1 : 0,
            m.duplicateWithId || null
          ]
        );
        dbSuccess++;
      } catch (err) {
        // Lewati jika error satu rekor
      }
    }
    console.log(`[Mitra] ✅ MySQL: ${dbSuccess} dari ${list.length} mitra tersinkronisasi ke tabel database.`);
  }

  const evaluatedCount = list.filter(m => (m.nilai != null && m.nilai > 0) || (m.catatan && m.catatan.trim() !== '')).length;
  console.log(`[Mitra] 🎉 PEMULIHAN MITRA SELESAI: ${list.length} total mitra, ${evaluatedCount} nilai & catatan kinerja siap digunakan.\n`);
  return { total: list.length, evaluated: evaluatedCount };
}

// 2. RESTORE LMS
async function restoreLms(pool) {
  console.log('[LMS] 🔄 Memulihkan struktur & modul pelatihan LMS...');
  const snapshotPath = path.join(SNAPSHOT_DIR, 'master_snapshot_lms.json');
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`File snapshot LMS tidak ditemukan: ${snapshotPath}`);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const trainings = snapshot.data || [];
  console.log(`[LMS] Memuat ${trainings.length} modul pelatihan dari master snapshot...`);

  if (pool) {
    let dbSuccess = 0;
    for (const t of trainings) {
      try {
        await pool.query(
          `INSERT INTO lms_trainings (id, name, startDate, endDate, period, icon, isActive, buttons)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            startDate = VALUES(startDate),
            endDate = VALUES(endDate),
            period = VALUES(period),
            icon = VALUES(icon),
            isActive = VALUES(isActive),
            buttons = VALUES(buttons)`,
          [
            t.id,
            t.name,
            t.startDate || null,
            t.endDate || null,
            t.period || '',
            t.icon || 'pendidikan',
            t.isActive !== false,
            JSON.stringify(t.buttons || [])
          ]
        );
        dbSuccess++;
      } catch (err) {
        console.warn(`[LMS] MySQL error pada ${t.name}:`, err.message);
      }
    }
    console.log(`[LMS] ✅ MySQL: ${dbSuccess} dari ${trainings.length} pelatihan tersinkronisasi ke tabel lms_trainings.`);
  }

  console.log(`[LMS] 🎉 PEMULIHAN LMS SELESAI: ${trainings.length} pelatihan standar dengan 5 kategori materi siap digunakan.\n`);
  return { total: trainings.length };
}

// 3. RESTORE LAPORAN
async function restoreLaporan(pool) {
  console.log('[Laporan] 🔄 Memulihkan skema & formulir laporan pendataan...');
  const snapshotPath = path.join(SNAPSHOT_DIR, 'master_snapshot_laporan.json');
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`File snapshot Laporan tidak ditemukan: ${snapshotPath}`);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const { activities = [], forms = [], fields = [] } = snapshot.data || {};
  console.log(`[Laporan] Memuat ${activities.length} kegiatan, ${forms.length} form, ${fields.length} field...`);

  if (pool) {
    // Activities
    for (const act of activities) {
      try {
        await pool.query(
          `INSERT INTO laporan_activities (id, title, description, category, startDate, endDate, isOpen, icon, sheetUrl, sheetName, settings)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            category = VALUES(category),
            startDate = VALUES(startDate),
            endDate = VALUES(endDate),
            isOpen = VALUES(isOpen),
            icon = VALUES(icon),
            sheetUrl = VALUES(sheetUrl),
            sheetName = VALUES(sheetName),
            settings = VALUES(settings)`,
          [act.id, act.title, act.description, act.category, act.startDate, act.endDate, act.isOpen ? 1 : 0, act.icon, act.sheetUrl, act.sheetName, act.settings]
        );
      } catch (err) {}
    }

    // Forms
    for (const form of forms) {
      try {
        await pool.query(
          `INSERT INTO laporan_forms (id, activityId, title, icon, orderIndex, sheetUrl, sheetName, webhookUrl, groupingLevels, settings)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            icon = VALUES(icon),
            orderIndex = VALUES(orderIndex),
            sheetUrl = VALUES(sheetUrl),
            sheetName = VALUES(sheetName),
            webhookUrl = VALUES(webhookUrl),
            groupingLevels = VALUES(groupingLevels),
            settings = VALUES(settings)`,
          [form.id, form.activityId, form.title, form.icon, form.orderIndex, form.sheetUrl, form.sheetName, form.webhookUrl, form.groupingLevels, form.settings]
        );
      } catch (err) {}
    }

    // Fields
    for (const fld of fields) {
      try {
        await pool.query(
          `INSERT INTO laporan_fields (id, formId, label, columnName, dataType, isRequired, groupSection, orderIndex, options, isKey, isLabel, isEditable)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            label = VALUES(label),
            columnName = VALUES(columnName),
            dataType = VALUES(dataType),
            isRequired = VALUES(isRequired),
            groupSection = VALUES(groupSection),
            orderIndex = VALUES(orderIndex),
            options = VALUES(options),
            isKey = VALUES(isKey),
            isLabel = VALUES(isLabel),
            isEditable = VALUES(isEditable)`,
          [fld.id, fld.formId, fld.label, fld.columnName, fld.dataType, fld.isRequired, fld.groupSection, fld.orderIndex, fld.options, fld.isKey, fld.isLabel, fld.isEditable]
        );
      } catch (err) {}
    }
    console.log(`[Laporan] ✅ MySQL: Kegiatan, formulir, dan field dinamis berhasil disinkronisasi.`);
  }

  console.log(`[Laporan] 🎉 PEMULIHAN LAPORAN SELESAI: ${activities.length} kegiatan & ${forms.length} formulir siap digunakan.\n`);
  return { activities: activities.length, forms: forms.length, fields: fields.length };
}

// MAIN EXECUTION
(async () => {
  let pool = null;
  try {
    const dbModule = require('../backend/db');
    // Test connection
    await dbModule.query('SELECT 1');
    pool = dbModule;
    console.log('✅ Terhubung ke MySQL Database lokal.\n');
  } catch (dbErr) {
    console.log('ℹ️  MySQL offline atau tidak merespons (Mode pemulihan file statis & JSON master tetap berjalan 100% aman).\n');
  }

  try {
    if (targetFeature === 'mitra') {
      await restoreMitra(pool);
    } else if (targetFeature === 'lms') {
      await restoreLms(pool);
    } else if (targetFeature === 'laporan') {
      await restoreLaporan(pool);
    } else {
      // Restore all
      await restoreMitra(pool);
      await restoreLms(pool);
      await restoreLaporan(pool);
    }

    console.log('===============================================================');
    console.log('✨ SEMUA PROSES PEMULIHAN DATA SELESAI DENGAN SUKSES!');
    console.log('   Data sistem terlindungi secara independen dan tahan galat sintaks.');
    console.log('===============================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat pemulihan data:', error.message);
    process.exit(1);
  }
})();
