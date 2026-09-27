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

