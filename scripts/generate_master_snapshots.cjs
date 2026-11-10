/**
 * Script Pembangkit Master Snapshot Independen Garda Data
 * Menyimpan data master ke dalam folder database/snapshots/
 * File ini independen dari runtime app, dapat dijalankan kapan saja:
 * node scripts/generate_master_snapshots.cjs
 */

const fs = require('fs');
const path = require('path');

const SNAPSHOT_DIR = path.join(__dirname, '../database/snapshots');
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

// 1. DATA MASTER MITRA (388 Mitra, 229 Nilai SE2026 Pulih)
const mitraSourcePath = path.join(__dirname, '../server/data/mitra_evaluations.json');
let mitraData = [];
if (fs.existsSync(mitraSourcePath)) {
  mitraData = JSON.parse(fs.readFileSync(mitraSourcePath, 'utf8'));
} else {
  // Fallback to public/data/initial_mitra_se2026.json if needed
  const altPath = path.join(__dirname, '../public/data/initial_mitra_se2026.json');
  if (fs.existsSync(altPath)) {
    mitraData = JSON.parse(fs.readFileSync(altPath, 'utf8'));
  }
}

const evaluatedMitra = mitraData.filter(m => (m.nilai != null && m.nilai > 0) || (m.catatan && m.catatan.trim() !== ''));

const mitraSnapshot = {
  version: '2.0-master',
  snapshotId: 'master-mitra-snapshot',
  feature: 'penilaian_mitra',
  title: 'Master Snapshot Penilaian Kinerja Mitra SE2026',
  createdAt: new Date().toISOString(),
  description: 'Data independen 388 Mitra dengan 229 evaluasi terverifikasi dari backup data penilaian Mitra SE2026.xlsx',
  totalRecords: mitraData.length,
  evaluatedRecords: evaluatedMitra.length,
  data: mitraData
};

const mitraSnapshotPath = path.join(SNAPSHOT_DIR, 'master_snapshot_mitra.json');
fs.writeFileSync(mitraSnapshotPath, JSON.stringify(mitraSnapshot, null, 2), 'utf8');
console.log(`[Snapshot] ✅ Master Snapshot Mitra berhasil disimpan: ${mitraData.length} total mitra, ${evaluatedMitra.length} evaluasi.`);

// 2. DATA MASTER LMS (Struktur Pelatihan BPS & Link Pembelajaran)
const standardButtons = [
  { id: 'std_1', title: 'Presensi Kehadiran Peserta (Pagi / Masuk)', url: 'https://', category: 'Absensi', isActive: true },
  { id: 'std_2', title: 'Presensi Kehadiran Peserta (Sore / Pulang)', url: 'https://', category: 'Absensi', isActive: true },
  { id: 'std_3', title: 'Unggah Kelengkapan Administrasi & Surat Tugas', url: 'https://', category: 'Administrasi', isActive: true },
  { id: 'std_4', title: 'Buku Pedoman Pencacahan & Konsep Definisi', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
  { id: 'std_5', title: 'Kuesioner Lapangan & Instrumen Survei', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
  { id: 'std_6', title: 'Slide Bahan Paparan / Tayang Fasilitator', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
  { id: 'std_7', title: 'Jadwal Agenda Pelatihan & Pembagian Kelas', url: 'https://', category: 'Jadwal Pelatihan', isActive: true },
  { id: 'std_8', title: 'Pre-Test Pemahaman Awal Peserta', url: 'https://', category: 'Kuis dan Pendalaman', isActive: true },
  { id: 'std_9', title: 'Post-Test & Evaluasi Penyelenggaraan', url: 'https://', category: 'Kuis dan Pendalaman', isActive: true }
];

const lmsTrainings = [
  {
    id: 'lms-se2026-master',
    name: 'Pelatihan Petugas Sensus Ekonomi 2026 (SE2026)',
    period: 'Tahun 2026',
    icon: 'ekonomi',
    isActive: true,
    startDate: '2026-05-01T08:00',
    endDate: '2026-05-31T17:00',
    buttons: standardButtons
  },
  {
    id: 'lms-susenas-master',
    name: 'Pelatihan Petugas Survei Sosial Ekonomi Nasional (Susenas)',
    period: 'Semester 1 2026',
    icon: 'sosial',
    isActive: true,
    startDate: '2026-02-01T08:00',
    endDate: '2026-03-31T17:00',
    buttons: [
      { id: 'sus_1', title: 'Daftar Hadir Kelas Susenas', url: 'https://', category: 'Absensi', isActive: true },
      { id: 'sus_2', title: 'Buku 1 Pedoman Pencacah Susenas', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
      { id: 'sus_3', title: 'Kuesioner Kor & Modul Konsumsi', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
      { id: 'sus_4', title: 'Simulasi Kasus Pencacahan', url: 'https://', category: 'Kuis dan Pendalaman', isActive: true }
    ]
  },
  {
    id: 'lms-sakernas-master',
    name: 'Pelatihan Petugas Survei Angkatan Kerja Nasional (Sakernas)',
    period: 'Tahun 2026',
    icon: 'ketenagakerjaan',
    isActive: true,
    startDate: '2026-08-01T08:00',
    endDate: '2026-08-31T17:00',
    buttons: [
      { id: 'sak_1', title: 'Presensi Peserta Sakernas', url: 'https://', category: 'Absensi', isActive: true },
      { id: 'sak_2', title: 'Buku Pedoman Konsep Ketenagakerjaan Sakernas', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
      { id: 'sak_3', title: 'Kuesioner Sakernas CAPI/PAPI', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
      { id: 'sak_4', title: 'Kuis Evaluasi Pemahaman Konsep Bekerja', url: 'https://', category: 'Kuis dan Pendalaman', isActive: true }
    ]
  }
];

const lmsSnapshot = {
  version: '2.0-master',
  snapshotId: 'master-lms-snapshot',
  feature: 'lms',
  title: 'Master Snapshot Modul Pelatihan (LMS)',
  createdAt: new Date().toISOString(),
  description: 'Struktur standar pelatihan BPS lengkap dengan 5 kategori materi, tombol interaktif, dan presensi',
  totalTrainings: lmsTrainings.length,
  data: lmsTrainings
};

const lmsSnapshotPath = path.join(SNAPSHOT_DIR, 'master_snapshot_lms.json');
fs.writeFileSync(lmsSnapshotPath, JSON.stringify(lmsSnapshot, null, 2), 'utf8');
console.log(`[Snapshot] ✅ Master Snapshot LMS berhasil disimpan: ${lmsTrainings.length} modul pelatihan standar.`);

// 3. DATA MASTER LAPORAN PENDATAAN (Activities, Forms, Fields)
const laporanActivities = [
  {
    id: 'act-se2026-lapangan',
    title: 'Pendataan Lapangan Sensus Ekonomi 2026',
    description: 'Pelaporan progres harian dan pengawasan mutu pencacahan usaha/perusahaan SE2026.',
    category: 'Sensus Ekonomi',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    isOpen: true,
    icon: 'TrendingUp',
    sheetUrl: '',
    sheetName: '',
    settings: JSON.stringify({ allowDuplicateEntries: false, requireGeoLocation: true })
  },
  {
    id: 'act-susenas-lapangan',
    title: 'Pelaporan Lapangan Susenas 2026',
    description: 'Monitoring pencacahan rumah tangga sampel Susenas tingkat kecamatan dan desa.',
    category: 'Statistik Sosial',
    startDate: '2026-02-15',
    endDate: '2026-03-31',
    isOpen: true,
    icon: 'FileText',
    sheetUrl: '',
    sheetName: '',
    settings: JSON.stringify({ allowDuplicateEntries: false, requireGeoLocation: true })
  }
];

const laporanForms = [
  {
    id: 'form-se2026-progres',
    activityId: 'act-se2026-lapangan',
    title: 'Formulir Laporan Progres Pencacahan SE2026',
    icon: 'FileSpreadsheet',
    orderIndex: 0,
    sheetUrl: '',
    sheetName: '',
    webhookUrl: '',
    groupingLevels: JSON.stringify(['kecamatan', 'desa']),
    settings: JSON.stringify({ enableGeo: true })
  },
  {
    id: 'form-se2026-supervisi',
    activityId: 'act-se2026-lapangan',
    title: 'Formulir Catatan Supervisi PML / Koseka',
    icon: 'CheckSquare',
    orderIndex: 1,
    sheetUrl: '',
    sheetName: '',
    webhookUrl: '',
    groupingLevels: JSON.stringify(['kecamatan']),
    settings: JSON.stringify({ enableGeo: true })
  }
];

const laporanFields = [
  { id: 'fld-1', formId: 'form-se2026-progres', label: 'Kecamatan', columnName: 'kecamatan', dataType: 'select', isRequired: 1, groupSection: 'Wilayah', orderIndex: 0, options: JSON.stringify(['Mempawah Hilir', 'Mempawah Timur', 'Sungai Pinyuh', 'Anjongan', 'Toho', 'Sadaniang', 'Sungai Kunyit', 'Segedong', 'Siantan']), isKey: 1, isLabel: 0, isEditable: 1 },
  { id: 'fld-2', formId: 'form-se2026-progres', label: 'Desa / Kelurahan', columnName: 'desa', dataType: 'text', isRequired: 1, groupSection: 'Wilayah', orderIndex: 1, options: JSON.stringify([]), isKey: 0, isLabel: 1, isEditable: 1 },
  { id: 'fld-3', formId: 'form-se2026-progres', label: 'Nama Petugas Pencacah (PPL)', columnName: 'nama_petugas', dataType: 'text', isRequired: 1, groupSection: 'Petugas', orderIndex: 2, options: JSON.stringify([]), isKey: 0, isLabel: 0, isEditable: 1 },
  { id: 'fld-4', formId: 'form-se2026-progres', label: 'Jumlah Usaha Tercacah Hari Ini', columnName: 'usaha_tercacah', dataType: 'number', isRequired: 1, groupSection: 'Progres', orderIndex: 3, options: JSON.stringify([]), isKey: 0, isLabel: 0, isEditable: 1 },
  { id: 'fld-5', formId: 'form-se2026-progres', label: 'Kendala / Hambatan Lapangan', columnName: 'kendala', dataType: 'textarea', isRequired: 0, groupSection: 'Keterangan', orderIndex: 4, options: JSON.stringify([]), isKey: 0, isLabel: 0, isEditable: 1 }
];

const laporanSnapshot = {
  version: '2.0-master',
  snapshotId: 'master-laporan-snapshot',
  feature: 'laporan_pendataan',
  title: 'Master Snapshot Sistem Laporan Pendataan',
  createdAt: new Date().toISOString(),
  description: 'Skema kegiatan survei/sensus BPS, formulir pelaporan progres, dan field dinamis kontrol kualitas',
  totalActivities: laporanActivities.length,
  totalForms: laporanForms.length,
  totalFields: laporanFields.length,
  data: {
    activities: laporanActivities,
    forms: laporanForms,
    fields: laporanFields
  }
};

const laporanSnapshotPath = path.join(SNAPSHOT_DIR, 'master_snapshot_laporan.json');
fs.writeFileSync(laporanSnapshotPath, JSON.stringify(laporanSnapshot, null, 2), 'utf8');
console.log(`[Snapshot] ✅ Master Snapshot Laporan berhasil disimpan: ${laporanActivities.length} kegiatan, ${laporanForms.length} form, ${laporanFields.length} field.`);

// 4. KONSOLIDASI SNAPSHOT SISTEM LENGKAP
const fullSnapshot = {
  version: '2.0-master',
  snapshotId: 'master-system-all-snapshot',
  title: 'Master Snapshot Sistem Garda Data (Full)',
  createdAt: new Date().toISOString(),
  system: 'Garda Data - BPS Kabupaten Mempawah',
  features: {
    mitra: {
      totalRecords: mitraData.length,
      evaluatedRecords: evaluatedMitra.length,
      snapshotFile: 'master_snapshot_mitra.json'
    },
    lms: {
      totalTrainings: lmsTrainings.length,
      snapshotFile: 'master_snapshot_lms.json'
    },
    laporan: {
      totalActivities: laporanActivities.length,
      totalForms: laporanForms.length,
      totalFields: laporanFields.length,
      snapshotFile: 'master_snapshot_laporan.json'
    }
  }
};

const fullSnapshotPath = path.join(SNAPSHOT_DIR, 'master_snapshot_all.json');
fs.writeFileSync(fullSnapshotPath, JSON.stringify(fullSnapshot, null, 2), 'utf8');
console.log(`[Snapshot] ✅ Master Snapshot Sistem Lengkap berhasil disimpan di ${fullSnapshotPath}`);
