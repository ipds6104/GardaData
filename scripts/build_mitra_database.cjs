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

// 1. Read existing baseline
const payload = JSON.parse(fs.readFileSync('public/data/initial_mitra_se2026.json', 'utf8'));
const key = crypto.pbkdf2Sync(SECRET_PASSPHRASE, SALT_STR, 100000, 32, 'sha256');
const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
let dec = decipher.update(Buffer.from(payload.data, 'base64'), null, 'utf8');
dec += decipher.final('utf8');
const existingList = JSON.parse(dec);

const existingByEmail = new Map();
existingList.forEach(m => {
  if (m.email) existingByEmail.set(m.email.toLowerCase().trim(), m);
});

// 2. 25 Sobat IDs assigned to Ahmad Aulia Rahman
const ahmadAuliaSobatIds = new Set([
  '610426050028', '610426070005', '610426070006', '610426070004', '610426050045',
  '610426050004', '610426070011', '610425110053', '610426080001', '610423110109',
  '610422100146', '610423090017', '610426070002', '610426070010', '610426050057',
  '610425110056', '610426050114', '610423040006', '610426050087', '610426050140',
  '610423040015', '610425110061', '610426050116', '610425110022', '610426070003'
]);

// 3. Read Excel
const excelPath = path.join(__dirname, '../data/2026_6104_exportmitrakepka_2026-11-10_100709.xlsx');
const wb = xlsx.readFile(excelPath);
const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
  .filter(r => r['SOBAT ID'] && String(r['SOBAT ID']).trim());

console.log('Total valid rows in Excel:', rows.length);

const mergedList = [];

rows.forEach(r => {
  const sobatId = String(r['SOBAT ID']).trim();
  const email = String(r['Email'] || '').trim().toLowerCase();
  const namaExcel = String(r['Nama Lengkap'] || '').trim();
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
  const existing = existingByEmail.get(email);

  if (existing) {
    mergedList.push({
      id: sobatId,
      sobatId: sobatId,
      email: email,
      nama: existing.nama || namaExcel,
      role: existing.role || (r['Posisi'] || 'PPL'),
      pj: isAssignedToAhmad ? 'Ahmad Aulia Rahman' : (existing.pj || '-'),
      kecamatan: existing.kecamatan || rawKec,
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
      nilai: existing.nilai !== undefined ? existing.nilai : null,
      kategori: existing.kategori !== undefined ? existing.kategori : null,
      catatan: existing.catatan || '',
      penilai: existing.penilai || null,
      updatedAt: existing.updatedAt || undefined
    });
  } else {
    mergedList.push({
      id: sobatId,
      sobatId: sobatId,
      email: email,
      nama: namaExcel,
      role: r['Posisi'] || 'Mitra Pendataan',
      pj: isAssignedToAhmad ? 'Ahmad Aulia Rahman' : '-',
      kecamatan: rawKec,
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
      nilai: null,
      kategori: null,
      catatan: '',
      penilai: null
    });
  }
});

// Save encrypted JSON
const encryptedPayload = encryptMilitaryPayload(mergedList);
fs.writeFileSync('public/data/initial_mitra_se2026.json', JSON.stringify(encryptedPayload, null, 2));
console.log('✅ Saved public/data/initial_mitra_se2026.json (AES-256-GCM, size: ' + fs.statSync('public/data/initial_mitra_se2026.json').size + ' bytes)');

// Also save local json to server/data if directory exists
const serverDataDir = path.join(__dirname, '../server/data');
if (fs.existsSync(serverDataDir)) {
  fs.writeFileSync(path.join(serverDataDir, 'mitra_evaluations.json'), JSON.stringify(mergedList, null, 2));
  console.log('✅ Saved server/data/mitra_evaluations.json');
}

// Generate SQL script
if (!fs.existsSync('database')) fs.mkdirSync('database', { recursive: true });

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  const s = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
  return `'${s}'`;
}

let sqlContent = `-- ========================================================
-- GARDA DATA BPS KABUPATEN MEMPAWAH - SE2026
-- Database Seed: Mitra Evaluasi & Rekomendasi (388 Mitra)
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
  \`verifikasiPada\`, \`profileData\`, \`nilai\`, \`kategori\`, \`catatan\`, \`penilai\`
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
    esc(m.penilai)
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
  \`catatan\` = IF(VALUES(\`catatan\`) != '', VALUES(\`catatan\`), \`mitra_evaluations\`.\`catatan\`);
`;

fs.writeFileSync('database/seed_mitra_388.sql', sqlContent, 'utf8');
console.log('✅ Saved database/seed_mitra_388.sql (size: ' + fs.statSync('database/seed_mitra_388.sql').size + ' bytes)');
