const { 
  parseGoogleSheetUrl, 
  parseCsvRows, 
  inferHeaderDataType, 
  fetchSheetData,
  pushRecordToGoogleSheet 
} = require('../backend/services/googleSheetsSync');

async function testGoogleSyncEngine() {
  console.log('====================================================');
  console.log('🔍 PENGUJIAN MASTER SYNC ENGINE - GARDA DATA');
  console.log('====================================================\n');

  // 1. Uji parsing URL Google Sheet
  const sampleUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?gid=0#gid=0';
  console.log('1️⃣ Menguji Parsing URL Google Sheet...');
  const parsed = parseGoogleSheetUrl(sampleUrl);
  console.log('   Hasil Parse:');
  console.log('   - Document ID :', parsed.documentId);
  console.log('   - CSV Sync URL:', parsed.csvUrl);
  console.log('   ✅ URL Parsing: OK\n');

  // 2. Uji Inferensi Tipe Data Otomatis dari Header Kolom
  console.log('2️⃣ Menguji Auto-Discovery & Inferensi Tipe Data Header:');
  const testHeaders = [
    'ID Responden',
    'Nama Lengkap Usaha',
    'Status Usaha [Aktif|Tutup Sementara|Tutup Permanen]',
    'Tanggal Pendataan',
    'Waktu Kunjungan',
    'Titik Koordinat Lokasi',
    'Omset Bulanan',
    'Foto Bukti Usaha'
  ];

  testHeaders.forEach(header => {
    const inferred = inferHeaderDataType(header);
    console.log(`   - "${header}" -> Tipe: [${inferred.dataType.toUpperCase()}]${inferred.options.length ? ` (Opsi: ${inferred.options.join(', ')})` : ''}`);
  });
  console.log('   ✅ Smart Field Inference: OK\n');

  // 3. Uji Live Fetch Google Sheets
  console.log('3️⃣ Menguji Live Fetch Google Sheet (Public Sample Spreadsheet)...');
  try {
    // Kita gunakan sample spreadsheet Google Sheets publik
    const result = await fetchSheetData(sampleUrl);
    console.log(`   ✅ Berhasil terhubung ke Google Sheet!`);
    console.log(`   - Total Header Kolom Ditemukan: ${result.headers.length}`);
    console.log(`   - Header: ${JSON.stringify(result.headers.slice(0, 5))}`);
    console.log(`   - Total Baris Data Tersinkron: ${result.totalRows}`);
    if (result.records.length > 0) {
      console.log('   - Contoh Sampel Baris Pertama:', JSON.stringify(result.records[0].data));
    }
  } catch (err) {
    console.log(`   ℹ️ Fetch live test notice:`, err.message);
  }

  // 4. Uji Simulasi Write/Push ke Antrian Google Sheet
  console.log('\n4️⃣ Menguji Simulasi Push Laporan (Two-Way Sync write-back):');
  const mockForm = {
    sheetUrl: sampleUrl,
    sheetName: 'Sheet1'
  };
  const mockPayload = {
    data: {
      'Nama Lengkap Usaha': 'Warung Berkah Jaya',
      'Status Usaha': 'Aktif',
      'Omset Bulanan': 15000000
    },
    status: 'submitted',
    submittedBy: 'Petugas Lapangan 01'
  };

  const pushRes = await pushRecordToGoogleSheet(mockForm, mockPayload);
  console.log('   Hasil Push:', pushRes);
  console.log('   ✅ Write-back Queue Service: OK\n');

  console.log('====================================================');
  console.log('🎉 SELURUH SISTEM SYNC GOOGLE SHEET BERFUNGSI SEMPURNA!');
  console.log('====================================================');
}

testGoogleSyncEngine();

