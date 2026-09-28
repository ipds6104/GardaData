import { 
  Type, Hash, CheckSquare, Calendar, Clock, MapPin, 
  UploadCloud, Folder, Layers, FileText, ClipboardList, 
  Building2, Home, Users, BarChart3, Wheat, Truck, 
  HeartPulse, GraduationCap, DollarSign, Sparkles, HelpCircle,
  Briefcase, Landmark, Factory, Settings, Tag, Cpu, BookOpen, Award, Lightbulb
} from 'lucide-react';

export const DATA_TYPES = [
  { id: 'Text', label: 'Text', desc: 'Jawaban teks atau uraian kalimat', icon: Type },
  { id: 'Number', label: 'Number', desc: 'Angka, kuantitas, atau nilai rupiah', icon: Hash },
  { id: 'Enum', label: 'Enum (Dropdown)', desc: 'Pilihan opsi tunggal dari daftar', icon: CheckSquare },
  { id: 'Date', label: 'Date', desc: 'Pemilih tanggal kalender', icon: Calendar },
  { id: 'Time', label: 'Time', desc: 'Pemilih waktu (format 24 jam)', icon: Clock },
  { id: 'LatLong', label: 'LatLong (GPS)', desc: 'Koordinat lokasi Latitude & Longitude', icon: MapPin },
  { id: 'Image', label: 'Image (Foto)', desc: 'Foto lapangan dari kamera / galeri', icon: UploadCloud },
  { id: 'File', label: 'File / Dokumen', desc: 'Dokumen lampiran (PDF/DOC)', icon: Folder },
];

export const AVAILABLE_ICONS = [
  { id: 'Layers', label: 'Kegiatan / Survei (Layers)', icon: Layers },
  { id: 'FileText', label: 'Formulir / Berkas (FileText)', icon: FileText },
  { id: 'ClipboardList', label: 'Pencacahan / Sensus (Clipboard)', icon: ClipboardList },
  { id: 'CheckSquare', label: 'Pemeriksaan / Pengawasan', icon: CheckSquare },
  { id: 'Briefcase', label: 'Ketenagakerjaan / Usaha', icon: Briefcase },
  { id: 'Users', label: 'Sosial / Kependudukan', icon: Users },
  { id: 'Landmark', label: 'Ekonomi / Pemerintahan', icon: Landmark },
  { id: 'Wheat', label: 'Pertanian / Pangan', icon: Wheat },
  { id: 'Factory', label: 'Produksi / Industri', icon: Factory },
  { id: 'Tag', label: 'Harga / Komoditas', icon: Tag },
  { id: 'Truck', label: 'Distribusi / Logistik', icon: Truck },
  { id: 'Building2', label: 'Bangunan & Konstruksi', icon: Building2 },
  { id: 'Home', label: 'Rumah Tangga', icon: Home },
  { id: 'MapPin', label: 'Lokasi & Geospasial', icon: MapPin },
  { id: 'BarChart3', label: 'Statistik & Analisis', icon: BarChart3 },
  { id: 'GraduationCap', label: 'Pendidikan / SDM', icon: GraduationCap },
  { id: 'HeartPulse', label: 'Kesehatan & Kesra', icon: HeartPulse },
  { id: 'DollarSign', label: 'Keuangan & Pendapatan', icon: DollarSign },
  { id: 'Cpu', label: 'Teknologi & Digitalisasi', icon: Cpu },
  { id: 'BookOpen', label: 'Modul & Pembelajaran', icon: BookOpen },
  { id: 'Award', label: 'Sertifikasi / Prestasi', icon: Award },
  { id: 'Lightbulb', label: 'Inovasi / Tematik', icon: Lightbulb },
  { id: 'Sparkles', label: 'Prioritas Khusus', icon: Sparkles },
  { id: 'Folder', label: 'Berkas / Arsip', icon: Folder },
  { id: 'Calendar', label: 'Jadwal & Periode', icon: Calendar },
];

export const getIconComponent = (name?: string, fallback = Layers) => {
  if (!name) return fallback;
  const match = AVAILABLE_ICONS.find(i => i.id.toLowerCase() === name.toLowerCase());
  return match ? match.icon : fallback;
};

// Clean and normalize strings (remove UTF-8 BOM, normalize spaces/newlines/NBSP, trim)
export const cleanText = (val: any): string => {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/^\uFEFF/, '')
    .replace(/[\u00A0\r\n\t]+/g, ' ')
    .trim();
};

// Normalize key for loose alphanumeric comparison
export const normalizeKey = (key: string): string => {
  if (!key) return '';
  return cleanText(key).toLowerCase().replace(/[^a-z0-9]/gi, '');
};

// Normalize string value for loose matching
export const normalizeStringVal = (val: any): string => {
  if (val === undefined || val === null) return '';
  return cleanText(val).toLowerCase();
};

// Semantic key aliases for intelligent field resolution across Google Sheet variations
export const SEMANTIC_ALIASES: Record<string, string[]> = {
  ppl: ['ppl', 'namappl', 'petugas', 'namapetugas', 'pencacah', 'namapencacah', 'mitra', 'namamitra', 'petugaspencacah'],
  pml: ['pml', 'namapml', 'pengawas', 'namapengawas', 'pemeriksa'],
  kecamatan: ['kecamatan', 'namakecamatan', 'kec', 'kodekec', 'kodekecamatan'],
  desa: ['desa', 'namadesa', 'kelurahan', 'namakelurahan', 'desakelurahan', 'desakel', 'kodedesa'],
  sls: ['sls', 'namasls', 'slsrt', 'slsrtrw', 'rt', 'rw', 'rtrw', 'kodesls', 'satuanlingkungansetempat', 'dusun'],
  krt: ['krt', 'namakrt', 'responden', 'namaresponden', 'kepalakeluarga', 'namakk', 'namausahakrt', 'usaha', 'namapemilik'],
  gps: ['gps', 'lokasi', 'lokasigps', 'titiklokasi', 'latlong', 'koordinat', 'latitude', 'longitude', 'titikkoordinat'],
  foto: ['foto', 'fotolapangan', 'gambar', 'image', 'dokumentasi', 'fotobangunan', 'fotousaha'],
  status: ['status', 'statuspendataan', 'statuspencacahan', 'kegiatan', 'keterangan']
};

// Helper to resolve record field value with fuzzy & semantic matching
export const getRecordVal = (data: Record<string, any>, keyName: string): any => {
  if (!data || !keyName) return '';
  
  // 1. Direct access
  if (data[keyName] !== undefined && data[keyName] !== null && data[keyName] !== '') {
    return cleanText(data[keyName]);
  }
  
  const cleanKey = cleanText(keyName);
  const normTarget = normalizeKey(cleanKey);
  
  // 2. Exact trimmed & case-insensitive match
  for (const [k, v] of Object.entries(data)) {
    if (cleanText(k).toLowerCase() === cleanKey.toLowerCase()) {
      if (v !== undefined && v !== null && v !== '') return cleanText(v);
    }
  }
  
  // 3. Alphanumeric normalized match (e.g. "SLS / RT" -> "slsrt" matches "SLS_RT" or "sls rt")
  for (const [k, v] of Object.entries(data)) {
    if (normalizeKey(k) === normTarget) {
      if (v !== undefined && v !== null && v !== '') return cleanText(v);
    }
  }
  
  // 4. Semantic alias matching
  let matchedGroup: string[] | null = null;
  for (const group of Object.values(SEMANTIC_ALIASES)) {
    if (group.some(alias => normTarget.includes(alias) || alias.includes(normTarget))) {
      matchedGroup = group;
      break;
    }
  }
  
  if (matchedGroup) {
    for (const [k, v] of Object.entries(data)) {
      const normK = normalizeKey(k);
      if (matchedGroup.some(alias => normK === alias || normK.includes(alias) || alias.includes(normK))) {
        if (v !== undefined && v !== null && v !== '') return cleanText(v);
      }
    }
  }
  
  return '';
};

// Fuzzy check if a record's cell value matches a step value
export const isRecordMatchStep = (cellValRaw: any, stepValRaw: any): boolean => {
  const stepVal = normalizeStringVal(stepValRaw);
  if (!stepVal || stepVal === 'semua' || stepVal === 'all') return true;
  
  const cellVal = normalizeStringVal(cellValRaw);
  if (!cellVal) return false;
  
  // Exact match
  if (cellVal === stepVal) return true;
  
  // Alphanumeric stripped match (handles "RT 005 / RW 15" vs "RT 005 RW 15")
  const normCell = cellVal.replace(/[^a-z0-9]/g, '');
  const normStep = stepVal.replace(/[^a-z0-9]/g, '');
  if (normCell === normStep) return true;
  
  // Substring matching for descriptive names (e.g. "RT 002 RW 01" vs "RT 002 RW 01 DUSUN PELITA")
  if (normCell.length >= 4 && normStep.length >= 4) {
    if (normCell.includes(normStep) || normStep.includes(normCell)) return true;
  }
  
  return false;
};

