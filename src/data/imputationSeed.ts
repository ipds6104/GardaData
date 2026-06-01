import { ImputationData } from '../types/imputation';

const generateId = (prefix: string, index: number) => `${prefix}_${index}`;

export const DEFAULT_IMPUTATION_DATA: ImputationData[] = [
  // --- NILAI IMPUTASI ---
  ...[
    { kategori: "Asuransi BPJS Kesehatan", keterangan: "Kelas 3 (PBI gratis)/orang", nilaiPengeluaran: "504000", nilaiOOP: "-", nilaiPendapatan: "504000", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "Asuransi BPJS Kesehatan", keterangan: "Kelas 3 (Berbayar)/orang", nilaiPengeluaran: "504000", nilaiOOP: "420000", nilaiPendapatan: "84000", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "Asuransi BPJS Kesehatan", keterangan: "Kelas 2/orang", nilaiPengeluaran: "1200000", nilaiOOP: "1200000", nilaiPendapatan: "-", sumberPendapatan: "-" },
    { kategori: "Asuransi BPJS Kesehatan", keterangan: "Kelas 1/orang", nilaiPengeluaran: "1800000", nilaiOOP: "1800000", nilaiPendapatan: "-", sumberPendapatan: "-" },
    { kategori: "Asuransi BPJS Kesehatan", keterangan: "PNS/TNI/Polri/BUMN", nilaiPengeluaran: "5% Gaji x 12", nilaiOOP: "1% Gaji x 12", nilaiPendapatan: "4% Gaji x 12", sumberPendapatan: "[VA] Upah/Gaji dalam bentuk barang" },
    { kategori: "Asuransi BPJS Kesehatan", keterangan: "Tambahan anak ke-4/Ortu PNS", nilaiPengeluaran: "1% Gaji x 12", nilaiOOP: "1% Gaji x 12", nilaiPendapatan: "-", sumberPendapatan: "-" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Rawat inap Rubini Kelas 1/hari", nilaiPengeluaran: "150000", nilaiOOP: "0", nilaiPendapatan: "150000 x hari", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Rawat inap Rubini Kelas 2/hari", nilaiPengeluaran: "100000", nilaiOOP: "0", nilaiPendapatan: "100000 x hari", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Rawat inap Rubini Kelas 3/hari", nilaiPengeluaran: "75000", nilaiOOP: "0", nilaiPendapatan: "75000 x hari", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Biaya pelayanan rawat inap (makan, minum, laundry)", nilaiPengeluaran: "45000", nilaiOOP: "0", nilaiPendapatan: "45000 x hari", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Rawat jalan di Rubini/kali", nilaiPengeluaran: "30000", nilaiOOP: "0", nilaiPendapatan: "45000 x hari", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Persalinan normal di Rubini", nilaiPengeluaran: "635000", nilaiOOP: "0", nilaiPendapatan: "635000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Persalinan caesar", nilaiPengeluaran: "minimal 5000000", nilaiOOP: "0", nilaiPendapatan: "5000000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Cek darah lengkap Rubini", nilaiPengeluaran: "96000", nilaiOOP: "0", nilaiPendapatan: "96000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Tes kolesterol Rubini", nilaiPengeluaran: "57000-82000", nilaiOOP: "0", nilaiPendapatan: "57000-82000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Papsmear", nilaiPengeluaran: "324000", nilaiOOP: "0", nilaiPendapatan: "324000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Tindakan medis gigi", nilaiPengeluaran: "77000-898000", nilaiOOP: "0", nilaiPendapatan: "77000-898000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Pemasangan KB (implan)", nilaiPengeluaran: "100000-2000000", nilaiOOP: "0", nilaiPendapatan: "100000-2000000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di rumah sakit Rubini", keterangan: "Pemasangan KB (suntik)", nilaiPengeluaran: "15000-30000", nilaiOOP: "0", nilaiPendapatan: "15000-30000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di Puskesmas", keterangan: "Pemeriksaan kesehatan", nilaiPengeluaran: "6000", nilaiOOP: "0 atau disesuaikan", nilaiPendapatan: "6000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "Imputasi Klaim BPJS di Puskesmas", keterangan: "Cabut gigi dewasa", nilaiPengeluaran: "60000", nilaiOOP: "0 atau disesuaikan", nilaiPendapatan: "60000", sumberPendapatan: "[VE] Transfer (barang) dari badan usaha" },
    { kategori: "BOS Sekolah Negeri/Swasta", keterangan: "PAUD/tahun", nilaiPengeluaran: "670000", nilaiOOP: "0 atau disesuaikan", nilaiPendapatan: "minimal 670000", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "BOS Sekolah Negeri/Swasta", keterangan: "SD/tahun", nilaiPengeluaran: "1000000", nilaiOOP: "0 atau disesuaikan", nilaiPendapatan: "minimal 1000000", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "BOS Sekolah Negeri/Swasta", keterangan: "SMP/tahun", nilaiPengeluaran: "1220000", nilaiOOP: "0 atau disesuaikan", nilaiPendapatan: "minimal 1220000", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "BOS Sekolah Negeri/Swasta", keterangan: "SMA/tahun", nilaiPengeluaran: "1670000", nilaiOOP: "0 atau disesuaikan", nilaiPendapatan: "minimal 1670000", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "MBG", keterangan: "Porsi besar (15000)", nilaiPengeluaran: "90000 per minggu/anak", nilaiOOP: "0", nilaiPendapatan: "4628571/anak", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "MBG", keterangan: "Porsi kecil (13000)", nilaiPengeluaran: "78000 per minggu/anak", nilaiOOP: "0", nilaiPendapatan: "4011428/anak", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "Listrik", keterangan: "450 VA (subsidi)", nilaiPengeluaran: "415", nilaiOOP: "pengeluaran listrik per bulan / harga listrik per kWh", nilaiPendapatan: "747 x kWh", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "Listrik", keterangan: "900 VA (subsidi)", nilaiPengeluaran: "605", nilaiOOP: "pengeluaran listrik per bulan / harga listrik per kWh", nilaiPendapatan: "747 x kWh", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "Listrik", keterangan: "900 VA (non subsidi)", nilaiPengeluaran: "1352", nilaiOOP: "pengeluaran listrik per bulan / harga listrik per kWh", nilaiPendapatan: "747 x kWh", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "Listrik", keterangan: "1300 VA atau lebih", nilaiPengeluaran: "1444", nilaiOOP: "pengeluaran listrik per bulan / harga listrik per kWh", nilaiPendapatan: "747 x kWh", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" },
    { kategori: "Listrik", keterangan: "2200 VA atau lebih", nilaiPengeluaran: "1699", nilaiOOP: "pengeluaran listrik per bulan / harga listrik per kWh", nilaiPendapatan: "747 x kWh", sumberPendapatan: "[VE] Transfer (barang) dari pemerintah" }
  ].map((item, idx) => ({
    id: generateId('NILAI', idx),
    type: 'NILAI_IMPUTASI' as const,
    aktif: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    keywordText: `${item.kategori} ${item.keterangan}`,
    ...item
  })),

  // --- BANSOS ---
  ...[
    { kategori: "Bantuan Sosial", jenisBantuan: "Bansos Beras", pengelompokanJenisBantuan: "Bansos Beras", nilai: "10 Kg beras setara 130000", periodePenerimaan: "2025" },
    { kategori: "Bantuan Sosial", jenisBantuan: "PKH", pengelompokanJenisBantuan: "Ibu hamil dan balita", nilai: "750000 per tahap atau 3000000 per tahun", periodePenerimaan: "Januari-Maret 2026" },
    { kategori: "Bantuan Sosial", jenisBantuan: "PKH", pengelompokanJenisBantuan: "Lansia dan disabilitas", nilai: "600000 per tahap atau 2400000 per tahun", periodePenerimaan: "Januari-Maret 2026" },
    { kategori: "Bantuan Sosial", jenisBantuan: "PKH", pengelompokanJenisBantuan: "Siswa SD", nilai: "225000 per tahap atau 900000 per tahun", periodePenerimaan: "Januari-Maret 2026" },
    { kategori: "Bantuan Sosial", jenisBantuan: "PKH", pengelompokanJenisBantuan: "Siswa SMP", nilai: "375000 per tahap atau 1500000 per tahun", periodePenerimaan: "Januari-Maret 2026" },
    { kategori: "Bantuan Sosial", jenisBantuan: "PKH", pengelompokanJenisBantuan: "Siswa SMA", nilai: "500000 per tahap atau 2000000 per tahun", periodePenerimaan: "Januari-Maret 2026" },
    { kategori: "Bantuan Sosial", jenisBantuan: "BPNT", pengelompokanJenisBantuan: "BPNT", nilai: "200000 per bulan", periodePenerimaan: "Januari-Maret 2026 atau akhir tahun 2025" },
    { kategori: "Bantuan Sosial", jenisBantuan: "BLTS Kesra", pengelompokanJenisBantuan: "BLTS Kesra periode okt-des 2025", nilai: "900000 per kpm", periodePenerimaan: "Oktober-Desember 2025" },
    { kategori: "Bantuan Sosial", jenisBantuan: "BLTS Kesra", pengelompokanJenisBantuan: "BLTS Kesra periode jan-mar 2026", nilai: "600000 per kpm", periodePenerimaan: "Januari-Maret 2026" },
    { kategori: "Bantuan Sosial", jenisBantuan: "PIP", pengelompokanJenisBantuan: "SD", nilai: "225000 per semester atau 450000 per tahun", periodePenerimaan: "Oktober-Desember 2025" },
    { kategori: "Bantuan Sosial", jenisBantuan: "PIP", pengelompokanJenisBantuan: "SMP", nilai: "375000 per semester atau 750000 per tahun", periodePenerimaan: "Oktober-Desember 2025" },
    { kategori: "Bantuan Sosial", jenisBantuan: "PIP", pengelompokanJenisBantuan: "SMA", nilai: "500000 per semester atau 1000000 per tahun", periodePenerimaan: "Oktober-Desember 2025" },
    { kategori: "Bantuan Sosial", jenisBantuan: "Prakerja", pengelompokanJenisBantuan: "Beasiswa Pelatihan", nilai: "3500000 per kali", periodePenerimaan: "2026" },
    { kategori: "Bantuan Sosial", jenisBantuan: "Prakerja", pengelompokanJenisBantuan: "Insentif", nilai: "600000 per kali", periodePenerimaan: "2026" },
    { kategori: "Bantuan Sosial", jenisBantuan: "Prakerja", pengelompokanJenisBantuan: "Survey", nilai: "50000 per kali (maksimal 2 kali)", periodePenerimaan: "2026" }
  ].map((item, idx) => ({
    id: generateId('BANSOS', idx),
    type: 'BANSOS' as const,
    aktif: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    keywordText: `${item.jenisBantuan} ${item.pengelompokanJenisBantuan} bansos pkh bpnt`,
    ...item
  })),

  // --- WAJIB IMPUTASI ---
  ...[
    { kategori: "Pendidikan", kuesioner: "KP", rincianPertanyaan: "R293 KP (1 tahun)", keterangan: "Biaya BOS disesuaikan dengan jenjang pendidikan", sumberPendanaan: "VE Transfer dari pemerintah dalam bentuk barang/jasa (1 tahun)" },
    { kategori: "Pendidikan", kuesioner: "Seruti", rincianPertanyaan: "R457-460 Seruti (3 bulan)", keterangan: "Biaya BOS disesuaikan dengan jenjang pendidikan", sumberPendanaan: "V.504 Transfer dari pemerintah dalam bentuk barang/jasa (3 bulan)" },
    { kategori: "Asuransi Kesehatan BPJS PBI dan BPJS Non PBI (menunggak)", kuesioner: "KP", rincianPertanyaan: "R338 KP (1 tahun)", keterangan: "Biaya BPJS PBI/Non PBI", sumberPendanaan: "VE Transfer dari pemerintah dalam bentuk barang/jasa (1 tahun)" },
    { kategori: "Asuransi Kesehatan BPJS PBI dan BPJS Non PBI (menunggak)", kuesioner: "Seruti", rincianPertanyaan: "R445 Seruti (3 bulan)", keterangan: "Biaya BPJS PBI/Non PBI", sumberPendanaan: "V Transfer dari pemerintah dalam bentuk barang/jasa (3 bulan)" },
    { kategori: "Kesehatan", kuesioner: "KP", rincianPertanyaan: "R276-291 KP (1 tahun)", keterangan: "Biaya Klaim BPJS (sakit lalu berobat baik menggunakan BPJS PBI atau non PBI)", sumberPendanaan: "VE Transfer dari badan usaha dalam bentuk barang/jasa (1 tahun)" },
    { kategori: "Kesehatan", kuesioner: "Seruti", rincianPertanyaan: "R453-455 Seruti (3 bulan)", keterangan: "Biaya Klaim BPJS (sakit lalu berobat baik menggunakan BPJS PBI atau non PBI)", sumberPendanaan: "V.504 Transfer dari lainnya dalam bentuk barang/jasa (1 tahun)" },
    { kategori: "Biaya Rumah Milik Sendiri", kuesioner: "KP", rincianPertanyaan: "R228-331 KP (1 tahun)", keterangan: "Biaya perkiraan sewa rumah milik sendiri", sumberPendanaan: "VC Perkiraan sewa rumah milik sendiri (1 tahun)" },
    { kategori: "Biaya Rumah Milik Sendiri", kuesioner: "Seruti", rincianPertanyaan: "R406 (disalin dari VSEN KP)", keterangan: "Biaya perkiraan sewa rumah milik sendiri", sumberPendanaan: "-" },
    { kategori: "Pajak STNK motor bodong/nunggak", kuesioner: "KP", rincianPertanyaan: "R336 KP (1 tahun)", keterangan: "Pajak STNK yang tidak bayar", sumberPendanaan: "VII penerimaan dari lainnya (kolom 2 baris 5)" },
    { kategori: "Pajak STNK motor bodong/nunggak", kuesioner: "Seruti", rincianPertanyaan: "R444 Seruti (bulan jatuh tempo)", keterangan: "Pajak STNK yang tidak bayar", sumberPendanaan: "-" },
    { kategori: "Pajak PBB (baik yang bayar atau tidak bayar)", kuesioner: "KP", rincianPertanyaan: "R335 KP (1 tahun) dan R444 Seruti (bulan jatuh tempo)", keterangan: "Pajak PBB yang tidak bayar", sumberPendanaan: "VIII penerimaan dari lainnya (kolom 2 baris 5)" },
    { kategori: "Pajak PBB (baik yang bayar atau tidak bayar)", kuesioner: "Seruti", rincianPertanyaan: "R444 Seruti (bulan jatuh tempo)", keterangan: "Pajak PBB yang tidak bayar", sumberPendanaan: "-" },
    { kategori: "Kendaraan", kuesioner: "KP", rincianPertanyaan: "R298 KP (1 tahun)", keterangan: "Biaya imputasi menumpang kendaraan orang lain (walau biasanya tidak membayar tapi nilainya diperkirakan bisa dengan nilai ojek)", sumberPendanaan: "VE Transfer dari rumah tangga lain dalam bentuk barang/jasa (1 tahun)" },
    { kategori: "Kendaraan", kuesioner: "Seruti", rincianPertanyaan: "R422 Seruti (3 bulan)", keterangan: "Biaya imputasi menumpang kendaraan orang lain (walau biasanya tidak membayar tapi nilainya diperkirakan bisa dengan nilai ojek)", sumberPendanaan: "V.504 Transfer dari rumah tangga lain dalam bentuk barang/jasa" }
  ].map((item, idx) => ({
    id: generateId('WAJIB_IMP', idx),
    type: 'WAJIB_IMPUTASI' as const,
    aktif: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    keywordText: `Blok V wajib imputasi ${item.kategori} ${item.kuesioner} ${item.rincianPertanyaan} ${item.keterangan}`,
    ...item
  })),

  // --- WAJIB TRANSFER ---
  ...[
    { penerimaan: "Pemerintah", transferDiterimaUang: "PKH", transferDiterimaBarang: "BPJS PBI", transferDibayarUang: "Pembayaran zakat ke BAZNAS", transferDibayarBarang: "-" },
    { penerimaan: "Pemerintah", transferDiterimaUang: "BPNT", transferDiterimaBarang: "BOS", transferDibayarUang: "Pembayaran zakat ke BAZNAS", transferDibayarBarang: "-" },
    { penerimaan: "Pemerintah", transferDiterimaUang: "Biaya PIP", transferDiterimaBarang: "MBG", transferDibayarUang: "Pembayaran zakat ke BAZNAS", transferDibayarBarang: "-" },
    { penerimaan: "Pemerintah", transferDiterimaUang: "-", transferDiterimaBarang: "Bantuan barang", transferDibayarUang: "Pembayaran zakat ke BAZNAS", transferDibayarBarang: "-" },
    { penerimaan: "Badan Usaha", transferDiterimaUang: "Pesangon PHK", transferDiterimaBarang: "Klaim berobat ke sarana kesehatan dengan BPJS", transferDibayarUang: "-", transferDibayarBarang: "-" },
    { penerimaan: "Rumah Tangga Lain", transferDiterimaUang: "THR anak kecil ketika lebaran/imlek/natal", transferDiterimaBarang: "Penerimaan transfer makanan dalam seminggu terakhir", transferDibayarUang: "Sedekah/zakat ke rumah tangga lain", transferDibayarBarang: "Pemberian makanan acara nikahan/beroah" },
    { penerimaan: "Rumah Tangga Lain", transferDiterimaUang: "Kiriman uang dari keluarga", transferDiterimaBarang: "Penerimaan kalau makan di acara nikahan", transferDibayarUang: "Uang amplop kondangan (solok)", transferDibayarBarang: "Pengeluaran untuk makanan/kue ketika hari raya" },
    { penerimaan: "Rumah Tangga Lain", transferDiterimaUang: "Anak yatim yang menerima sumbangan", transferDiterimaBarang: "Penerimaan kalau makan ketika hari raya", transferDibayarUang: "Uang pemberian THR ke anak kecil", transferDibayarBarang: "Biaya catering/makanan untuk acara" },
    { penerimaan: "Lembaga Nirlaba (Sumbangan, dll)", transferDiterimaUang: "Penerimaan zakat", transferDiterimaBarang: "Daging qurban dikasih dari masjid", transferDibayarUang: "Infaq dan sedekah ke masjid", transferDibayarBarang: "Zakat berupa barang (beras)" },
    { penerimaan: "Lembaga Nirlaba (Sumbangan, dll)", transferDiterimaUang: "Anak yatim mendapat sumbangan dari komunitas", transferDiterimaBarang: "Daging qurban dikasih dari masjid", transferDibayarUang: "Zakat ke masjid", transferDibayarBarang: "Sumbangan ke tempat ibadah" },
    { penerimaan: "Lembaga Nirlaba (Sumbangan, dll)", transferDiterimaUang: "Memberikan/membayar uang persembahan gereja", transferDiterimaBarang: "Daging qurban dikasih dari masjid", transferDibayarUang: "Zakat dan infaq melalui ormas", transferDibayarBarang: "Menyumbang bantuan banjir" },
    { penerimaan: "Luar Negeri (TKI, dll)", transferDiterimaUang: "Kiriman dari keluarga yang TKI", transferDiterimaBarang: "Dibelikan barang", transferDibayarUang: "-", transferDibayarBarang: "-" }
  ].map((item, idx) => ({
    id: generateId('WAJIB_TRANS', idx),
    type: 'WAJIB_TRANSFER' as const,
    kategori: 'Wajib Transfer Blok V',
    aktif: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    keywordText: `Blok V wajib transfer ${item.penerimaan} ${item.transferDiterimaUang} ${item.transferDiterimaBarang}`,
    ...item
  }))
];
