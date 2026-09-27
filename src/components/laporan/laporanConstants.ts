import { 
  Type, Hash, CheckSquare, Calendar, Clock, MapPin, 
  UploadCloud, Folder, Layers, FileText, ClipboardList, 
  Building2, Home, Users, BarChart3, Wheat, Truck, 
  HeartPulse, GraduationCap, DollarSign, Sparkles, HelpCircle 
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
  { id: 'Layers', label: 'Layers / Kegiatan', icon: Layers },
  { id: 'FileText', label: 'Formulir / Berkas', icon: FileText },
  { id: 'ClipboardList', label: 'Pencacahan', icon: ClipboardList },
  { id: 'CheckSquare', label: 'Pemeriksaan', icon: CheckSquare },
  { id: 'Building2', label: 'Bangunan', icon: Building2 },
  { id: 'Home', label: 'Rumah Tangga', icon: Home },
  { id: 'Users', label: 'Penduduk / Mitra', icon: Users },
  { id: 'MapPin', label: 'Lokasi / Geospasial', icon: MapPin },
  { id: 'BarChart3', label: 'Statistik / Ekonomi', icon: BarChart3 },
  { id: 'Wheat', label: 'Pertanian / Pangan', icon: Wheat },
  { id: 'Truck', label: 'Distribusi / Logistik', icon: Truck },
  { id: 'Folder', label: 'Berkas / Arsip', icon: Folder },
  { id: 'Calendar', label: 'Jadwal / Periode', icon: Calendar },
  { id: 'HeartPulse', label: 'Kesehatan / Sosial', icon: HeartPulse },
  { id: 'GraduationCap', label: 'Pendidikan', icon: GraduationCap },
  { id: 'DollarSign', label: 'Harga / Keuangan', icon: DollarSign },
  { id: 'Sparkles', label: 'Khusus / Tematik', icon: Sparkles },
];

export const getIconComponent = (name?: string, fallback = Layers) => {
  if (!name) return fallback;
  const match = AVAILABLE_ICONS.find(i => i.id.toLowerCase() === name.toLowerCase());
  return match ? match.icon : fallback;
};

