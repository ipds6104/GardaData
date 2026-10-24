// Data Rentang Wajar Rasio NTB Sensus Ekonomi 2026 (SE2026)
// Rasio = NTB / (Nilai Produksi - Biaya Pembelian Barang Terjual)

export interface KategoriLapanganUsaha {
  kode: string;
  nama: string;
  singkat: string;
  min: number | null;
  max: number | null;
  dianalisis: boolean;
}

export const KATEGORI_LAPANGAN_USAHA: KategoriLapanganUsaha[] = [
  {
    kode: 'A',
    nama: 'Kategori A - Pertanian, Kehutanan dan Perikanan',
    singkat: 'Pertanian, Kehutanan & Perikanan',
    min: 0.51,
    max: 0.94,
    dianalisis: true,
  },
  {
    kode: 'B',
    nama: 'Kategori B - Pertambangan dan Penggalian',
    singkat: 'Pertambangan & Penggalian',
    min: 0.28,
    max: 0.81,
    dianalisis: true,
  },
  {
    kode: 'C',
    nama: 'Kategori C - Industri Pengolahan',
    singkat: 'Industri Pengolahan / Manufaktur',
    min: 0.15,
    max: 0.61,
    dianalisis: true,
  },
  {
    kode: 'D',
    nama: 'Kategori D - Pengadaan Listrik, Gas, Uap/Air Panas dan Udara Dingin',
    singkat: 'Pengadaan Listrik, Gas & Uap',
    min: 0.13,
    max: 0.68,
    dianalisis: true,
  },
  {
    kode: 'E',
    nama: 'Kategori E - Pengelolaan Air, Pengelolaan Air Limbah, Pengelolaan dan Daur Ulang Sampah, dan Aktivitas Remediasi',
    singkat: 'Pengelolaan Air, Limbah & Sampah',
    min: 0.29,
    max: 0.47,
    dianalisis: true,
  },
  {
    kode: 'F',
    nama: 'Kategori F - Konstruksi',
    singkat: 'Konstruksi',
    min: 0.34,
    max: 0.44,
    dianalisis: true,
  },
  {
    kode: 'G',
    nama: 'Kategori G - Perdagangan Besar dan Eceran; Reparasi dan Perawatan Mobil dan Sepeda Motor',
    singkat: 'Perdagangan Besar & Eceran; Reparasi',
    min: 0.64,
    max: 0.78,
    dianalisis: true,
  },
  {
    kode: 'H',
    nama: 'Kategori H - Pengangkutan dan Pergudangan',
    singkat: 'Pengangkutan & Pergudangan',
    min: 0.29,
    max: 0.64,
    dianalisis: true,
  },
  {
    kode: 'I',
    nama: 'Kategori I - Penyediaan Akomodasi dan Penyediaan Makan Minum',
    singkat: 'Akomodasi & Makan Minum (Hotel/Resto)',
    min: 0.36,
    max: 0.69,
    dianalisis: true,
  },
  {
    kode: 'J',
    nama: 'Kategori J - Informasi dan Komunikasi',
    singkat: 'Informasi & Komunikasi',
    min: 0.36,
    max: 0.73,
    dianalisis: true,
  },
  {
    kode: 'K',
    nama: 'Kategori K - Aktivitas Keuangan dan Asuransi',
    singkat: 'Aktivitas Keuangan & Asuransi',
    min: 0.50,
    max: 0.72,
    dianalisis: true,
  },
  {
    kode: 'L',
    nama: 'Kategori L - Real Estat',
    singkat: 'Real Estat / Properti',
    min: 0.46,
    max: 0.86,
    dianalisis: true,
  },
  {
    kode: 'M',
    nama: 'Kategori M - Aktivitas Profesional, Ilmiah dan Teknis',
    singkat: 'Aktivitas Profesional, Ilmiah & Teknis',
    min: 0.50,
    max: 0.99,
    dianalisis: true,
  },
  {
    kode: 'N',
    nama: 'Kategori N - Aktivitas Penyewaan dan Sewa Guna Usaha Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya',
    singkat: 'Jasa Persewaan, Agen & Penunjang Usaha',
    min: 0.44,
    max: 0.57,
    dianalisis: true,
  },
  {
    kode: 'O',
    nama: 'Kategori O - Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib',
    singkat: 'Administrasi Pemerintahan & Pertahanan',
    min: 0.54,
    max: 0.66,
    dianalisis: true,
  },
  {
    kode: 'P',
    nama: 'Kategori P - Pendidikan (Tidak Dianalisis SE2026)',
    singkat: 'Pendidikan',
    min: null,
    max: null,
    dianalisis: false,
  },
  {
    kode: 'Q',
    nama: 'Kategori Q - Aktivitas Kesehatan Manusia dan Aktivitas Sosial',
    singkat: 'Kesehatan & Aktivitas Sosial',
    min: 0.27,
    max: 0.82,
    dianalisis: true,
  },
  {
    kode: 'R',
    nama: 'Kategori R - Kesenian, Hiburan dan Rekreasi',
    singkat: 'Kesenian, Hiburan & Rekreasi',
    min: 0.20,
    max: 0.60,
    dianalisis: true,
  },
  {
    kode: 'S',
    nama: 'Kategori S - Aktivitas Jasa Lainnya',
    singkat: 'Aktivitas Jasa Lainnya',
    min: 0.21,
    max: 0.57,
    dianalisis: true,
  },
  {
    kode: 'T',
    nama: 'Kategori T - Aktivitas Rumah Tangga sebagai Pemberi Kerja',
    singkat: 'Aktivitas Rumah Tangga Pemberi Kerja',
    min: 0.30,
    max: 0.69,
    dianalisis: true,
  },
  {
    kode: 'U',
    nama: 'Kategori U - Aktivitas Badan Internasional dan Badan Ekstra Internasional Lainnya (Tidak Dianalisis SE2026)',
    singkat: 'Badan Internasional',
    min: null,
    max: null,
    dianalisis: false,
  },
];

export interface CalculationResult {
  nilaiProduksi: number;
  biayaBarangTerjual: number;
  biayaProduksi: number;
  biayaOperasional: number;
  pendapatanBersihBarang: number;
  totalBiaya: number;
  nilaiTambah: number;
  rasio: number;
  rasioFormatted: string;
  kategoriKode: string;
  kategoriInfo: KategoriLapanganUsaha;
  status: 'empty' | 'unsupported' | 'defisit' | 'under_min' | 'over_max' | 'wajar';
  statusLabel: string;
  statusColor: 'gray' | 'red' | 'yellow' | 'green';
  statusDesc: string;
}

export interface HistoryItem {
  id: string;
  namaUsaha: string;
  kategoriKode: string;
  kategoriNama: string;
  kategoriMin?: number | null;
  kategoriMax?: number | null;
  nilaiProduksi: number;
  biayaBarangTerjual: number;
  biayaProduksi: number;
  biayaOperasional: number;
  nilaiTambah: number;
  rasio: number;
  rasioFormatted: string;
  statusLabel: string;
  statusColor: 'gray' | 'red' | 'yellow' | 'green';
  timestamp: string;
  timestampFormatted: string;
}

export interface FormDataState {
  namaUsaha: string;
  kategoriKode: string;
  nilaiProduksi: string;
  biayaBarangTerjual: string;
  biayaProduksi: string;
  biayaOperasional: string;
}

// Format number to Indonesian Rupiah string
export const formatRupiah = (value: number | null | undefined, withPrefix = true): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return withPrefix ? 'Rp 0' : '0';
  }
  const rounded = Math.round(value);
  const formatted = new Intl.NumberFormat('id-ID').format(rounded);
  return withPrefix ? `Rp ${formatted}` : formatted;
};

// Clean string input to pure integer
export const parseRupiah = (str: string | number | null | undefined): number => {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleanStr = str.toString().replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// Format decimal to Indonesian comma style (e.g. 0.45 -> "0,45")
export const formatDecimal = (num: number | null | undefined, decimals = 2): string => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return Number(num).toFixed(decimals).replace('.', ',');
};

// Format input live while typing
export const formatInputCurrency = (rawVal: string | null | undefined): string => {
  if (!rawVal) return '';
  const clean = rawVal.toString().replace(/[^0-9]/g, '');
  if (!clean) return '';
  try {
    return new Intl.NumberFormat('id-ID').format(BigInt(clean));
  } catch {
    return new Intl.NumberFormat('id-ID').format(parseInt(clean, 10));
  }
};

// Hitung Nilai Tambah Bruto (NTB) dan Rasio Kewajaran Lapangan Usaha
// Kaidah SE2026:
// - Rincian 26.c (Biaya pembelian barang yang terjual) HANYA berlaku untuk Kategori G (Perdagangan).
// - Untuk kategori lain selain G, 26.c tidak digunakan (0).
// Rumus Kategori G:
//   Output Bersih = 27.a - 26.c
//   NTB = (27.a - 26.c) - 26.b - 26.d
//   Rasio = NTB / (27.a - 26.c)
// Rumus Selain Kategori G:
//   Output Bersih = 27.a
//   NTB = 27.a - 26.b - 26.d
//   Rasio = NTB / 27.a
export const calculateNTB = ({
  nilaiProduksi = 0,
  biayaBarangTerjual = 0,
  biayaProduksi = 0,
  biayaOperasional = 0,
  kategoriKode = 'C',
}: {
  nilaiProduksi?: number;
  biayaBarangTerjual?: number;
  biayaProduksi?: number;
  biayaOperasional?: number;
  kategoriKode?: string;
}): CalculationResult => {
  const isKbliG = (kategoriKode || '').toUpperCase() === 'G';
  // Jika bukan Kategori G, biaya pembelian barang terjual (26.c) TIDAK ditambahkan/dihitung
  const actualBiayaBarangTerjual = isKbliG ? biayaBarangTerjual : 0;

  const pendapatanBersihBarang = nilaiProduksi - actualBiayaBarangTerjual;
  const totalBiaya = biayaProduksi + biayaOperasional;
  const nilaiTambah = pendapatanBersihBarang - totalBiaya;

  // Rasio NTB terhadap Output Bersih (Desimal murni)
  const rasio = pendapatanBersihBarang > 0 ? (nilaiTambah / pendapatanBersihBarang) : 0;
  const rasioRounded = parseFloat(rasio.toFixed(4));

  // Ambil data kategori lapangan usaha terpilih
  const kategoriInfo = KATEGORI_LAPANGAN_USAHA.find(k => k.kode === kategoriKode) || KATEGORI_LAPANGAN_USAHA[2]; // Default C

  // Evaluasi Kewajaran berdasarkan Rentang MIN & MAX Kategori
  let status: CalculationResult['status'] = 'empty';
  let statusLabel = 'Menunggu Input';
  let statusColor: CalculationResult['statusColor'] = 'gray';
  let statusDesc = 'Masukkan nilai produksi dan biaya untuk memeriksa kewajaran.';

  if (nilaiProduksi <= 0) {
    status = 'empty';
    statusLabel = 'Menunggu Input';
    statusColor = 'gray';
    statusDesc = 'Masukkan nilai produksi dan biaya operasional untuk melihat analisis.';
  } else if (!kategoriInfo.dianalisis) {
    status = 'unsupported';
    statusLabel = `Kategori ${kategoriInfo.kode} Tidak Dianalisis`;
    statusColor = 'gray';
    statusDesc = `Kategori ${kategoriInfo.kode} tidak dianalisis rasionalitasnya dalam Sensus Ekonomi 2026.`;
  } else if (nilaiTambah < 0) {
    status = 'defisit';
    statusLabel = 'Anomali / Nilai Tambah Defisit (< 0)';
    statusColor = 'red';
    statusDesc = `Rasio ${formatDecimal(rasioRounded)} bertanda negatif. Total biaya melebihi pendapatan kotor. Waspadai kesalahan pencatatan sensus!`;
  } else if (kategoriInfo.min !== null && rasioRounded < kategoriInfo.min) {
    status = 'under_min';
    statusLabel = 'Di Bawah Rentang Wajar';
    statusColor = 'red';
    statusDesc = `Rasio ${formatDecimal(rasioRounded)} berada di bawah batas minimum wajar (${formatDecimal(kategoriInfo.min)}) untuk Kategori ${kategoriInfo.kode}. Cermati kemungkinan biaya bahan/operasional yang tercatat terlalu tinggi atau ganda.`;
  } else if (kategoriInfo.max !== null && rasioRounded > kategoriInfo.max) {
    status = 'over_max';
    statusLabel = 'Di Atas Rentang Wajar';
    statusColor = 'yellow';
    statusDesc = `Rasio ${formatDecimal(rasioRounded)} melebihi batas maksimum wajar (${formatDecimal(kategoriInfo.max)}) untuk Kategori ${kategoriInfo.kode}. Cermati kemungkinan ada biaya operasional/bahan baku yang belum tercatat.`;
  } else {
    status = 'wajar';
    statusLabel = 'Wajar (Rasional Sesuai SE2026)';
    statusColor = 'green';
    statusDesc = `Rasio ${formatDecimal(rasioRounded)} berada dalam rentang wajar (${formatDecimal(kategoriInfo.min)} - ${formatDecimal(kategoriInfo.max)}) untuk Kategori ${kategoriInfo.kode} (${kategoriInfo.singkat}).`;
  }

  return {
    nilaiProduksi,
    biayaBarangTerjual: actualBiayaBarangTerjual,
    biayaProduksi,
    biayaOperasional,
    pendapatanBersihBarang,
    totalBiaya,
    nilaiTambah,
    rasio: rasioRounded,
    rasioFormatted: formatDecimal(rasioRounded),
    kategoriKode,
    kategoriInfo,
    status,
    statusLabel,
    statusColor,
    statusDesc,
  };
};

// Format Timestamp to Indonesian
export const formatIndonesianDate = (dateObj: Date | string = new Date()): string => {
  const d = new Date(dateObj);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

// Export to CSV
export const exportHistoryToCSV = (historyItems: HistoryItem[]): void => {
  if (!historyItems || historyItems.length === 0) return;

  const headers = [
    'ID',
    'Waktu',
    'Nama Usaha / Catatan',
    'Kategori Lapangan Usaha',
    '26. b. Biaya Produksi (Rp)',
    '26. c. Biaya Pembelian Barang Terjual (Rp)',
    '26. d. Biaya Operasional (Rp)',
    '27. a. Nilai Pendapatan Barang dan Jasa (Rp)',
    'Nilai Tambah Bruto (Rp)',
    'Rasio NTB (Desimal)',
    'Rentang Wajar (MIN - MAX)',
    'Status Kewajaran SE2026',
  ];

  const rows = historyItems.map((item, idx) => {
    const minStr = item.kategoriMin !== null && item.kategoriMin !== undefined ? formatDecimal(item.kategoriMin) : '-';
    const maxStr = item.kategoriMax !== null && item.kategoriMax !== undefined ? formatDecimal(item.kategoriMax) : '-';
    return [
      idx + 1,
      `"${item.timestampFormatted || item.timestamp}"`,
      `"${(item.namaUsaha || 'Simulasi').replace(/"/g, '""')}"`,
      `"${(item.kategoriNama || 'Kategori C').replace(/"/g, '""')}"`,
      item.biayaProduksi || 0,
      item.biayaBarangTerjual || 0,
      item.biayaOperasional || 0,
      item.nilaiProduksi || 0,
      item.nilaiTambah || 0,
      `"${item.rasioFormatted || formatDecimal(item.rasio)}"`,
      `"${minStr} - ${maxStr}"`,
      `"${item.statusLabel || ''}"`,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((e) => e.join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Riwayat_Kewajaran_NTB_SE2026_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

