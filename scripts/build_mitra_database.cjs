const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const xlsx = require('xlsx');

const SECRET_PASSPHRASE = 'GARDA-DATA-SE2026-BPS-MEMPAWAH-MILITARY-GRADE-AES256-SECURE-KEY!';
const SALT_STR = 'garda_data_salt_6104_mempawah_sec';

function cleanName(raw) {
  if (!raw) return '';
  return String(raw).replace(/^\(\d+\)\s*/, '').trim();
}

function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|\/|-)\S/g, function(a) { return a.toUpperCase(); });
}

function encryptMilitaryPayload(dataObj) {
  const salt = SALT_STR;
  const key = crypto.pbkdf2Sync(SECRET_PASSPHRASE, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const jsonStr = JSON.stringify(dataObj);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();
  
  return {
    v: 1,
    algo: 'AES-256-GCM',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted
  };
}

// 1. Read existing evaluation records from server or snapshot
let existingList = [];
const serverMitraPath = path.join(__dirname, '../server/data/mitra_evaluations.json');
const snapshotMitraPath = path.join(__dirname, '../database/snapshots/master_snapshot_mitra.json');

if (fs.existsSync(serverMitraPath)) {
  try {
    existingList = JSON.parse(fs.readFileSync(serverMitraPath, 'utf8'));
  } catch (e) {
    console.warn('Gagal membaca server/data/mitra_evaluations.json:', e.message);
  }
} else if (fs.existsSync(snapshotMitraPath)) {
  try {
    const snap = JSON.parse(fs.readFileSync(snapshotMitraPath, 'utf8'));
    existingList = snap.data || [];
  } catch (e) {
    console.warn('Gagal membaca snapshot mitra:', e.message);
  }
}

const existingByEmail = new Map();
const existingBySobat = new Map();
const existingByName = new Map();

existingList.forEach(m => {
  if (m.email) existingByEmail.set(m.email.toLowerCase().trim(), m);
  if (m.sobatId) existingBySobat.set(String(m.sobatId).trim(), m);
  if (m.nama) existingByName.set(m.nama.toLowerCase().trim(), m);
});

// 2. Read evaluation backup from Excel if present
const evalByEmail = new Map();
const evalByName = new Map();
const backupExcelPath = path.join(__dirname, '../data/backup data penilaian Mitra SE2026.xlsx');
if (fs.existsSync(backupExcelPath)) {
  try {
    const wbB = xlsx.readFile(backupExcelPath);
    const rowsB = xlsx.utils.sheet_to_json(wbB.Sheets[wbB.SheetNames[0]]);
    rowsB.forEach(r => {
      const email = String(r['Email Mitra'] || r['Email'] || '').toLowerCase().trim();
      const nama = String(r['Nama Mitra'] || r['Nama'] || '').toLowerCase().trim();
      const val = r['Nilai Kinerja'] !== undefined ? r['Nilai Kinerja'] : r['Nilai'];
      const cat = r['Catatan Kinerja'] || r['Catatan'] || '';
      const kat = r['Kategori'] || r['Status Rekomendasi'] || null;
      const pj = r['Penanggung Jawab (PJ)'] || r['PJ'] || null;
      const role = r['Posisi / Role'] || r['Role'] || r['Posisi'] || null;
      const rec = { nilai: val, catatan: cat, kategori: kat, pj, role };
      if (email) evalByEmail.set(email, rec);
      if (nama) evalByName.set(nama, rec);
    });
    console.log(`[Backup] Dimuat ${rowsB.length} baris evaluasi dari backup Excel`);
  } catch (err) {
    console.warn('[Backup] Gagal membaca backup Excel:', err.message);
  }
}

// 3. 25 Sobat IDs assigned to Ahmad Aulia Rahman
const ahmadAuliaSobatIds = new Set([
  '610426050028', '610426070005', '610426070006', '610426070004', '610426050045',
  '610426050004', '610426070011', '610425110053', '610426080001', '610423110109',
  '610422100146', '610423090017', '610426070002', '610426070010', '610426050057',
  '610425110056', '610426050114', '610423040006', '610426050087', '610426050140',
  '610423040015', '610425110061', '610426050116', '610425110022', '610426070003'
]);

// 4. Read Kepka Excel
const excelPath = path.join(__dirname, '../data/2026_6104_exportmitrakepka_2026-11-10_100709.xlsx');
if (!fs.existsSync(excelPath)) {
  console.error('File Excel Kepka tidak ditemukan:', excelPath);
  process.exit(1);
}

const wb = xlsx.readFile(excelPath);
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
  .filter(r => (r['SOBAT ID'] && String(r['SOBAT ID']).trim()) || (r['Email'] && String(r['Email']).trim()));

console.log('Total valid rows in Kepka Excel:', rows.length);

const mergedList = [];
const seenDedup = new Set();

rows.forEach(r => {
  const sobatId = String(r['SOBAT ID'] || '').trim();
  const email = String(r['Email'] || '').trim().toLowerCase();
  const namaExcel = toTitleCase(cleanName(r['Nama Lengkap']));
  if (!email && !sobatId) return;

  const dedupKey = sobatId || email;
  if (seenDedup.has(dedupKey)) return;
  seenDedup.add(dedupKey);

  const rawKec = toTitleCase(cleanName(r['Alamat Kecamatan']));
  const rawDesa = toTitleCase(cleanName(r['Alamat Desa/Kel']));
  const alamatDetail = String(r['Alamat Detail'] || '').trim();
  const alamatKabKota = toTitleCase(cleanName(r['Alamat Kab/Kota'])) || 'Mempawah';
  const alamatProvinsi = toTitleCase(cleanName(r['Alamat Provinsi'])) || 'Kalimantan Barat';
  const noTelp = String(r['No Telp'] || '').trim();
  const jkRaw = String(r['Jenis Kelamin'] || '').trim();
  const jenisKelamin = jkRaw === 'Pr' ? 'Perempuan' : (jkRaw === 'L' ? 'Laki-laki' : jkRaw);
  const ttl = String(r['Tempat, Tanggal Lahir'] || '').trim();
  const umur = r['Umur'] !== undefined && !isNaN(Number(r['Umur'])) ? Number(r['Umur']) : null;
  const statusKawin = cleanName(r['Status Kawin']);
  const pendidikan = String(r['Pendidikan'] || '').trim();
  const pekerjaan = String(r['Pekerjaan'] || '').trim();
  const deskripsiPekerjaanLain = String(r['Deskripsi Pekerjaan Lain'] || '').trim();
  const terikatKontrakKldi = String(r['Terikat Kontrak KLDI Lain'] || '').trim();
  const namaKldi = String(r['Nama KLDI'] || '').trim();
  const posisiDaftar = String(r['Posisi Daftar'] || '').trim();
  const statusSeleksi = String(r['Status Seleksi'] || '').trim();
  const statusNik = String(r['Status NIK'] || '').trim();
  const verifikasiPada = String(r['Verifikasi Pada'] || '').trim();

  const kendaraanMotor = String(r['Punya Kendaraan Bermotor'] || '').trim();
  const bisaMotor = String(r['Bisa Mengendarai Motor'] || '').trim();
  const hpAndroid = String(r['Punya HP Android'] || '').trim();
  const merkHp = String(r['Merk HP'] || '').trim();
  const tipeHp = String(r['Tipe HP'] || '').trim();
  const ramHp = String(r['RAM HP'] || '').trim();
  const bisaKomputer = String(r['Bisa Komputer'] || '').trim();
  const punyaLaptop = String(r['Punya Laptop'] || '').trim();
  const pengalamanCapi = String(r['Berpengalaman CAPI'] || '').trim();

  const pengalamanBps = {
    pendataanBps: r['Pernah Pendataan BPS'] || 'Tidak',
    sp: r['Pernah SP'] || 'Tidak',
    st: r['Pernah ST'] || 'Tidak',
    se: r['Pernah SE'] || 'Tidak',
    susenas: r['Pernah Susenas'] || 'Tidak',
    sakernas: r['Pernah Sakernas'] || 'Tidak',
    sbh: r['Pernah SBH'] || 'Tidak'
  };

  const isAssignedToAhmad = ahmadAuliaSobatIds.has(sobatId);
  const existing = (email ? existingByEmail.get(email) : null) || (sobatId ? existingBySobat.get(sobatId) : null) || existingByName.get(namaExcel.toLowerCase());
  const backup = (email ? evalByEmail.get(email) : null) || evalByName.get(namaExcel.toLowerCase());

  let finalNilai = null;
  if (existing && existing.nilai !== null && existing.nilai !== undefined && !isNaN(Number(existing.nilai))) {
    finalNilai = Number(existing.nilai);
  } else if (backup && backup.nilai !== null && backup.nilai !== undefined && !isNaN(Number(backup.nilai))) {
    finalNilai = Number(backup.nilai);
  }

  let finalCatatan = '';
  if (existing && existing.catatan && String(existing.catatan).trim()) {
    finalCatatan = String(existing.catatan).trim();
  } else if (backup && backup.catatan && String(backup.catatan).trim()) {
    finalCatatan = String(backup.catatan).trim();
  }

  let finalKategori = null;
  if (existing && existing.kategori) finalKategori = existing.kategori;
  else if (backup && backup.kategori) finalKategori = backup.kategori;
  else if (finalNilai !== null) {
    if (finalNilai >= 90) finalKategori = 'Sangat Direkomendasikan';
    else if (finalNilai >= 80) finalKategori = 'Direkomendasikan';
    else if (finalNilai >= 60) finalKategori = 'Cukup';
    else finalKategori = 'Blacklist';
  }

  let finalPj = '-';
  if (isAssignedToAhmad) finalPj = 'Ahmad Aulia Rahman';
  else if (existing && existing.pj && existing.pj !== '-') finalPj = existing.pj;
  else if (backup && backup.pj && backup.pj !== '-') finalPj = backup.pj;

  let finalRole = (existing && existing.role) || (backup && backup.role) || (r['Posisi'] || 'Mitra Pendataan');
  if (finalRole === 'Mitra Pendataan') finalRole = 'PPL';

  mergedList.push({
    id: sobatId || `${email}_${finalRole.toLowerCase()}`,
    sobatId: sobatId,
    email: email,
    nama: (existing && existing.nama) || namaExcel,
    role: finalRole,
    pj: finalPj,
    kecamatan: (existing && existing.kecamatan && existing.kecamatan !== '-') ? existing.kecamatan : rawKec,
    desa: rawDesa,
    alamatDetail: alamatDetail,
    alamatKabKota: alamatKabKota,
    alamatProvinsi: alamatProvinsi,
    noTelp: noTelp,
    jenisKelamin: jenisKelamin,
    tempatTanggalLahir: ttl,
    umur: umur,
    statusKawin: statusKawin,
    pendidikan: pendidikan,
    pekerjaan: pekerjaan,
    deskripsiPekerjaanLain: deskripsiPekerjaanLain,
    terikatKontrakKldi: terikatKontrakKldi,
    namaKldi: namaKldi,
    posisiDaftar: posisiDaftar,
    statusSeleksi: statusSeleksi,
    statusNik: statusNik,
    verifikasiPada: verifikasiPada,
    kendaraanMotor: kendaraanMotor,
    bisaMotor: bisaMotor,
    hpAndroid: hpAndroid,
    merkHp: merkHp,
    tipeHp: tipeHp,
    ramHp: ramHp,
    bisaKomputer: bisaKomputer,
    punyaLaptop: punyaLaptop,
    pengalamanCapi: pengalamanCapi,
    pengalamanBps: pengalamanBps,
    nilai: finalNilai,
    kategori: finalKategori,
    catatan: finalCatatan,
    penilai: (existing && existing.penilai) || null,
    isDuplicate: Boolean(existing ? existing.isDuplicate : false),
    duplicateOf: existing ? (existing.duplicateOf || undefined) : undefined,
    duplicateNotes: existing ? (existing.duplicateNotes || undefined) : undefined,
    updatedAt: (existing && existing.updatedAt) || new Date().toISOString()
  });
});

console.log('Total merged mitra records:', mergedList.length);
const scoredCount = mergedList.filter(m => m.nilai !== null && m.nilai !== undefined);
console.log('Total evaluated mitra records (scores > 0):', scoredCount.length);

// 5. Save encrypted baseline to public/data/initial_mitra_se2026.json (Standard Military AES-256-GCM)
const publicDataDir = path.join(__dirname, '../public/data');
if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

const encryptedPayload = encryptMilitaryPayload(mergedList);
const publicJsonPath = path.join(publicDataDir, 'initial_mitra_se2026.json');
fs.writeFileSync(publicJsonPath, JSON.stringify(encryptedPayload, null, 2), 'utf8');
console.log('✅ Saved public/data/initial_mitra_se2026.json (AES-256-GCM Base64, size: ' + fs.statSync(publicJsonPath).size + ' bytes)');

// Also save to dist/data if dist exists
const distDataDir = path.join(__dirname, '../dist/data');
if (fs.existsSync(path.dirname(distDataDir))) {
  if (!fs.existsSync(distDataDir)) fs.mkdirSync(distDataDir, { recursive: true });
  fs.writeFileSync(path.join(distDataDir, 'initial_mitra_se2026.json'), JSON.stringify(encryptedPayload, null, 2), 'utf8');
  console.log('✅ Saved dist/data/initial_mitra_se2026.json');
}

// 6. Save persistent JSON to server/data/mitra_evaluations.json
const serverDataDir = path.join(__dirname, '../server/data');
if (!fs.existsSync(serverDataDir)) fs.mkdirSync(serverDataDir, { recursive: true });
const serverFilePath = path.join(serverDataDir, 'mitra_evaluations.json');
fs.writeFileSync(serverFilePath, JSON.stringify(mergedList, null, 2), 'utf8');
console.log('✅ Saved server/data/mitra_evaluations.json');

// 7. Save to database/snapshots/master_snapshot_mitra.json
const snapshotDir = path.join(__dirname, '../database/snapshots');
if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });
const masterSnapshot = {
  version: '2.1-kepka-complete',
  snapshotId: 'master-mitra-snapshot',
  feature: 'penilaian_mitra',
  title: 'Master Snapshot Penilaian Kinerja Mitra SE2026 (Kepka Complete)',
  createdAt: new Date().toISOString(),
  description: 'Data independen 388 Mitra dengan profil data diri lengkap dari 2026_6104_exportmitrakepka_2026-11-10_100709.xlsx dan evaluasi terverifikasi.',
  totalRecords: mergedList.length,
  evaluatedRecords: scoredCount.length,
  data: mergedList
};
fs.writeFileSync(path.join(snapshotDir, 'master_snapshot_mitra.json'), JSON.stringify(masterSnapshot, null, 2), 'utf8');
console.log('✅ Saved database/snapshots/master_snapshot_mitra.json');

// 8. Generate SQL seed
function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 1 : 0;
  const s = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
  return `'${s}'`;
}

let sqlContent = `-- ========================================================
-- GARDA DATA BPS KABUPATEN MEMPAWAH - SE2026
-- Database Seed: Mitra Evaluasi & Rekomendasi (${mergedList.length} Mitra)
-- Generated: ${new Date().toISOString()}
-- ========================================================

CREATE TABLE IF NOT EXISTS \`mitra_evaluations\` (
  \`id\` VARCHAR(255) NOT NULL,
  \`sobatId\` VARCHAR(50) DEFAULT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`nama\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(50) NOT NULL,
  \`pj\` VARCHAR(255) NOT NULL,
  \`kecamatan\` VARCHAR(100) NOT NULL,
  \`desa\` VARCHAR(100) DEFAULT NULL,
  \`alamatDetail\` TEXT DEFAULT NULL,
  \`alamatKabKota\` VARCHAR(100) DEFAULT NULL,
  \`alamatProvinsi\` VARCHAR(100) DEFAULT NULL,
  \`noTelp\` VARCHAR(50) DEFAULT NULL,
  \`jenisKelamin\` VARCHAR(20) DEFAULT NULL,
  \`tempatTanggalLahir\` VARCHAR(100) DEFAULT NULL,
  \`umur\` INT DEFAULT NULL,
  \`statusKawin\` VARCHAR(50) DEFAULT NULL,
  \`pendidikan\` VARCHAR(100) DEFAULT NULL,
  \`pekerjaan\` VARCHAR(100) DEFAULT NULL,
  \`posisiDaftar\` VARCHAR(100) DEFAULT NULL,
  \`statusSeleksi\` VARCHAR(50) DEFAULT NULL,
  \`statusNik\` VARCHAR(50) DEFAULT NULL,
  \`verifikasiPada\` VARCHAR(50) DEFAULT NULL,
  \`profileData\` JSON DEFAULT NULL,
  \`nilai\` INT DEFAULT NULL,
  \`kategori\` VARCHAR(50) DEFAULT NULL,
  \`catatan\` TEXT DEFAULT NULL,
  \`penilai\` VARCHAR(255) DEFAULT NULL,
  \`isDuplicate\` TINYINT(1) DEFAULT 0,
  \`duplicateOf\` VARCHAR(100) DEFAULT NULL,
  \`duplicateNotes\` TEXT DEFAULT NULL,
  \`updatedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_mitra_sobat\` (\`sobatId\`),
  INDEX \`idx_mitra_email\` (\`email\`),
  INDEX \`idx_mitra_pj\` (\`pj\`),
  INDEX \`idx_mitra_kec\` (\`kecamatan\`),
  INDEX \`idx_mitra_desa\` (\`desa\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`mitra_evaluations\` (
  \`id\`, \`sobatId\`, \`email\`, \`nama\`, \`role\`, \`pj\`, \`kecamatan\`, \`desa\`, \`alamatDetail\`,
  \`alamatKabKota\`, \`alamatProvinsi\`, \`noTelp\`, \`jenisKelamin\`, \`tempatTanggalLahir\`, \`umur\`,
  \`statusKawin\`, \`pendidikan\`, \`pekerjaan\`, \`posisiDaftar\`, \`statusSeleksi\`, \`statusNik\`,
  \`verifikasiPada\`, \`profileData\`, \`nilai\`, \`kategori\`, \`catatan\`, \`penilai\`,
  \`isDuplicate\`, \`duplicateOf\`, \`duplicateNotes\`
) VALUES
`;

const valueRows = mergedList.map(m => {
  const profile = {
    kendaraanMotor: m.kendaraanMotor,
    bisaMotor: m.bisaMotor,
    hpAndroid: m.hpAndroid,
    merkHp: m.merkHp,
    tipeHp: m.tipeHp,
    ramHp: m.ramHp,
    bisaKomputer: m.bisaKomputer,
    punyaLaptop: m.punyaLaptop,
    pengalamanCapi: m.pengalamanCapi,
    pengalamanBps: m.pengalamanBps,
    deskripsiPekerjaanLain: m.deskripsiPekerjaanLain,
    terikatKontrakKldi: m.terikatKontrakKldi,
    namaKldi: m.namaKldi
  };
  return '  (' + [
    esc(m.id),
    esc(m.sobatId),
    esc(m.email),
    esc(m.nama),
    esc(m.role),
    esc(m.pj),
    esc(m.kecamatan),
    esc(m.desa),
    esc(m.alamatDetail),
    esc(m.alamatKabKota),
    esc(m.alamatProvinsi),
    esc(m.noTelp),
    esc(m.jenisKelamin),
    esc(m.tempatTanggalLahir),
    esc(m.umur),
    esc(m.statusKawin),
    esc(m.pendidikan),
    esc(m.pekerjaan),
    esc(m.posisiDaftar),
    esc(m.statusSeleksi),
    esc(m.statusNik),
    esc(m.verifikasiPada),
    esc(JSON.stringify(profile)),
    esc(m.nilai),
    esc(m.kategori),
    esc(m.catatan),
    esc(m.penilai),
    esc(m.isDuplicate ? 1 : 0),
    esc(m.duplicateOf),
    esc(m.duplicateNotes)
  ].join(', ') + ')';
});

sqlContent += valueRows.join(',\n') + '\n';
sqlContent += `ON DUPLICATE KEY UPDATE
  \`sobatId\` = VALUES(\`sobatId\`),
  \`email\` = VALUES(\`email\`),
  \`nama\` = VALUES(\`nama\`),
  \`role\` = VALUES(\`role\`),
  \`pj\` = VALUES(\`pj\`),
  \`kecamatan\` = VALUES(\`kecamatan\`),
  \`desa\` = VALUES(\`desa\`),
  \`alamatDetail\` = VALUES(\`alamatDetail\`),
  \`alamatKabKota\` = VALUES(\`alamatKabKota\`),
  \`alamatProvinsi\` = VALUES(\`alamatProvinsi\`),
  \`noTelp\` = VALUES(\`noTelp\`),
  \`jenisKelamin\` = VALUES(\`jenisKelamin\`),
  \`tempatTanggalLahir\` = VALUES(\`tempatTanggalLahir\`),
  \`umur\` = VALUES(\`umur\`),
  \`statusKawin\` = VALUES(\`statusKawin\`),
  \`pendidikan\` = VALUES(\`pendidikan\`),
  \`pekerjaan\` = VALUES(\`pekerjaan\`),
  \`posisiDaftar\` = VALUES(\`posisiDaftar\`),
  \`statusSeleksi\` = VALUES(\`statusSeleksi\`),
  \`statusNik\` = VALUES(\`statusNik\`),
  \`verifikasiPada\` = VALUES(\`verifikasiPada\`),
  \`profileData\` = VALUES(\`profileData\`),
  \`nilai\` = COALESCE(VALUES(\`nilai\`), \`mitra_evaluations\`.\`nilai\`),
  \`kategori\` = COALESCE(VALUES(\`kategori\`), \`mitra_evaluations\`.\`kategori\`),
  \`catatan\` = IF(VALUES(\`catatan\`) != '', VALUES(\`catatan\`), \`mitra_evaluations\`.\`catatan\`),
  \`isDuplicate\` = VALUES(\`isDuplicate\`),
  \`duplicateOf\` = VALUES(\`duplicateOf\`),
  \`duplicateNotes\` = VALUES(\`duplicateNotes\`);
`;

fs.writeFileSync(path.join(__dirname, '../database/seed_mitra_388.sql'), sqlContent, 'utf8');
console.log('✅ Saved database/seed_mitra_388.sql');
console.log('\n🎉 Selesai! Seluruh data diri mitra dari Excel Kepka berhasil digabungkan.');
