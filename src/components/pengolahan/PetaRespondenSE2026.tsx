import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, useMapEvents, CircleMarker, Popup, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, MapPin, Search, Layers, X, Copy, Check, ExternalLink, 
  RotateCcw, Filter, ChevronRight, Info, LocateFixed, Eye, EyeOff,
  Building2, Home, Briefcase, Users, ShieldCheck, Sparkles,
  SlidersHorizontal, CheckCircle2, Clock, AlertCircle, Compass, Lock,
  Maximize2, Minimize2, ChevronDown, ChevronUp, AlertTriangle, XCircle, FileText, Phone, UserCheck, Tag
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { decryptMilitaryPayload } from '../../utils/cryptoSecurity';

// Fix Leaflet Default Icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PetaRespondenSE2026Props {
  onBack: () => void;
}

export interface RespondenPoint {
  i: string;       // safe hashed id (e.g. SE26-A1B2C3D4 or MST-...)
  k: string;       // namaKK
  lt: number;      // lat
  lg: number;      // lng
  d: string;       // desaCode
  dn?: string;     // desaName
  s: string;       // namaSls
  ks: string;      // kodeSls
  u: number;       // jmlUsaha
  nu: string;      // namaUsaha
  kb: string;      // kbli
  st: string;      // status
  sk: string;      // skala
  stKel?: string;  // status keberadaan keluarga (e.g. 1. Ditemukan, 0. Tidak Ditemukan (STOP), 2. Baru, 3. Meninggal, dll)
  stUsaha?: string;// status keberadaan usaha (e.g. 1. Ditemukan, 0. Tidak Ditemukan, 2. Baru, 3. Tutup, 4. Ganda)
  peng?: string;   // Nama Pemilik / Pengelola Usaha
  nb?: string;     // Nomor Urut Bangunan (Bangunan Fisik / Tempat Tinggal)
  // Deterministic Matching & Source Attributes
  mSource?: string; // 'MATCH_TIER1A_DIRECT_NIK' | 'MATCH_TIER1B_FAMILY_ART_NIK' | 'MATCH_TIER2_PHONE' | 'MATCH_TIER3_BUSINESS_ROSTER' | 'MATCH_TIER5_CLEAN_NAME' | 'GEOTAG_LAPANGAN'
  mConf?: number;   // 100, 99, 95, 90, 88
  // Matching SE-ST attributes:
  m?: number;      // 1 if Matching SE-ST
  mKat?: string;   // Kategori: 'Sebagian Ditemukan' | 'Seluruh Usaha Prelist Tidak Ditemukan' | 'Seluruh Usaha Tutup'
  mFound?: string; // Daftar usaha ditemukan
  mNotFound?: string; // Daftar usaha tidak ditemukan
  mClosed?: string; // Daftar usaha tutup
  mFCnt?: number;  // Jml usaha ditemukan
  mNFCnt?: number; // Jml usaha tidak ditemukan
  mCCnt?: number;  // Jml usaha tutup
  mNotes?: string; // Catatan lapangan
  pml?: string;    // Nama PML
  ppl?: string;    // Nama PPL
  telp?: string;   // No Telp Responden
  resp?: string;   // Nama Responden Pemberi Informasi
}

export interface StatusCategory {
  id: string;
  name: string;
  color: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: string;
  group: 'Keluarga' | 'Usaha';
  description: string;
  kriteria: string;
}

export const STATUS_CATEGORIES: StatusCategory[] = [
  // 1. Kategori Keluarga
  {
    id: 'keluarga_ada_usaha',
    name: 'Keluarga ada usaha',
    color: '#059669', // Emerald green
    borderColor: '#065f46',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    icon: '🟢',
    group: 'Keluarga',
    description: 'Keluarga yang berhasil ditemukan dan memiliki sedikitnya satu anggota keluarga yang mengelola kegiatan usaha ekonomi produktif.',
    kriteria: 'Status keluarga ditemukan (1. Ditemukan) dan Jumlah Usaha > 0.'
  },
  {
    id: 'keluarga_non_usaha',
    name: 'Keluarga tidak memiliki usaha',
    color: '#2563eb', // Royal Blue
    borderColor: '#1d4ed8',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    badgeBorder: 'border-blue-300',
    icon: '🔵',
    group: 'Keluarga',
    description: 'Keluarga yang berhasil ditemukan menetap namun tidak memiliki anggota keluarga yang menjalankan kegiatan usaha mandiri.',
    kriteria: 'Status keluarga ditemukan (1. Ditemukan) dan Jumlah Usaha = 0.'
  },
  {
    id: 'keluarga_tidak_ditemukan',
    name: 'Keluarga tidak ditemukan',
    color: '#ef4444', // Red
    borderColor: '#b91c1c',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-300',
    icon: '🔴',
    group: 'Keluarga',
    description: 'Keluarga prelist yang tidak dapat dilacak / tidak ada di SLS dan tidak diketahui keberadaannya oleh warga lokal.',
    kriteria: 'Status keluarga = 0. Tidak Ditemukan (STOP).'
  },
  {
    id: 'keluarga_non_respon',
    name: 'Keluarga Non Respon',
    color: '#f97316', // Orange
    borderColor: '#c2410c',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900',
    badgeBorder: 'border-orange-300',
    icon: '🟠',
    group: 'Keluarga',
    description: 'Keluarga yang tidak dapat ditemui setelah kunjungan berulang kali atau menolak memberikan informasi hingga akhir periode sensus.',
    kriteria: 'Status keluarga = 5. Tidak dapat ditemui sampai akhir pendataan.'
  },
  {
    id: 'keluarga_meninggal',
    name: 'Keluarga Meninggal',
    color: '#475569', // Slate Dark
    borderColor: '#1e293b',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-900',
    badgeBorder: 'border-slate-400',
    icon: '⚫',
    group: 'Keluarga',
    description: 'Responden tunggal pada keluarga prelist yang telah meninggal dunia dan tidak ada anggota keluarga lain dalam rumah tangga.',
    kriteria: 'Status keluarga = 3. Meninggal.'
  },
  {
    id: 'keluarga_khusus',
    name: 'Keluarga Khusus',
    color: '#a855f7', // Purple
    borderColor: '#7e22ce',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300',
    icon: '🟣',
    group: 'Keluarga',
    description: 'Tempat tinggal kelompok khusus seperti asrama, panti asuhan, barak militer, lapas, atau penampungan khusus.',
    kriteria: 'Status keluarga = 6. Keluarga Khusus.'
  },
  {
    id: 'keluarga_baru',
    name: 'Keluarga ditemukan dan baru',
    color: '#06b6d4', // Cyan
    borderColor: '#0e7490',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-900',
    badgeBorder: 'border-cyan-300',
    icon: '🩵',
    group: 'Keluarga',
    description: 'Keluarga baru hasil sisiran lapangan (tidak ada di prelist) yang ditemukan tinggal menetap di wilayah sensus.',
    kriteria: 'Status keluarga = 2. Baru.'
  },
  {
    id: 'keluarga_tidak_eligible',
    name: 'Keluarga tidak eligible',
    color: '#b45309', // Amber Brown
    borderColor: '#78350f',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-400',
    icon: '🟤',
    group: 'Keluarga',
    description: 'Bangunan atau responden yang tidak memenuhi kriteria cakupan sensus (misalnya bangunan kosong, diplomatik, dsb).',
    kriteria: 'Status keluarga = 4. Tidak Eligible.'
  },
  // 2. Kategori Usaha
  {
    id: 'usaha_tidak_ditemukan',
    name: 'Usaha Tidak ditemukan',
    color: '#eab308', // Yellow
    borderColor: '#ca8a04',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-900',
    badgeBorder: 'border-yellow-300',
    icon: '🟡',
    group: 'Usaha',
    description: 'Unit usaha prelist yang tidak dapat ditemukan atau tidak diketahui keberadaannya di SLS setelah konfirmasi ke aparatur / warga setempat.',
    kriteria: 'Status usaha = 0. Tidak Ditemukan / Seluruh Usaha Prelist Tidak Ditemukan.'
  },
  {
    id: 'usaha_tutup',
    name: 'Usaha Tutup',
    color: '#71717a', // Zinc Gray
    borderColor: '#3f3f46',
    badgeBg: 'bg-zinc-100',
    badgeText: 'text-zinc-800',
    badgeBorder: 'border-zinc-300',
    icon: '⚪',
    group: 'Usaha',
    description: 'Unit usaha yang sebelumnya beroperasi namun saat pendataan lapangan telah tutup permanen, gulung tikar, atau berhenti beroperasi.',
    kriteria: 'Status usaha = 3. Tutup / Seluruh Usaha Tutup.'
  },
  {
    id: 'usaha_ganda',
    name: 'Usaha Ganda',
    color: '#ec4899', // Pink
    borderColor: '#db2777',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-900',
    badgeBorder: 'border-pink-300',
    icon: '🌸',
    group: 'Usaha',
    description: 'Unit usaha yang tercatat lebih dari satu kali (duplikasi) dalam prelist pendataan.',
    kriteria: 'Status usaha = 4. Ganda.'
  },
  {
    id: 'usaha_ditemukan',
    name: 'Usaha ditemukan',
    color: '#10b981', // Emerald Bright
    borderColor: '#047857',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
    icon: '🌿',
    group: 'Usaha',
    description: 'Unit usaha prelist yang berhasil ditemukan dan aktif beroperasi saat dikunjungi oleh petugas pendataan SE2026.',
    kriteria: 'Status usaha = 1. Ditemukan. Isian operasional dan omzet lengkap.'
  },
  {
    id: 'usaha_baru',
    name: 'Usaha baru',
    color: '#6366f1', // Indigo
    borderColor: '#4338ca',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-300',
    icon: '✨',
    group: 'Usaha',
    description: 'Unit usaha baru hasil penyisiran lapangan yang sebelumnya belum tercatat pada prelist sensus SE2026.',
    kriteria: 'Status usaha = 2. Baru / Penambahan baru saat sensus.'
  }
];

export function getPointStatusCategory(point: RespondenPoint): StatusCategory {
  const sk = (point.stKel || '').toLowerCase();
  const su = (point.stUsaha || '').toLowerCase();
  const st = (point.st || '').toLowerCase();
  const mKat = (point.mKat || '').toLowerCase();

  // 1. Usaha specific statuses
  if (su.includes('baru') || st.includes('usaha baru')) {
    return STATUS_CATEGORIES.find(c => c.id === 'usaha_baru')!;
  }
  if (su.includes('tutup') || mKat.includes('tutup') || (point.mClosed && point.mClosed !== '-')) {
    return STATUS_CATEGORIES.find(c => c.id === 'usaha_tutup')!;
  }
  if (su.includes('ganda')) {
    return STATUS_CATEGORIES.find(c => c.id === 'usaha_ganda')!;
  }
  if (su.includes('tidak ditemukan') || mKat.includes('tidak ditemukan') || (point.mNotFound && point.mNotFound !== '-')) {
    return STATUS_CATEGORIES.find(c => c.id === 'usaha_tidak_ditemukan')!;
  }

  // 2. Keluarga specific statuses
  if (sk.includes('meninggal') || st.includes('meninggal')) {
    return STATUS_CATEGORIES.find(c => c.id === 'keluarga_meninggal')!;
  }
  if (sk.includes('tidak eligible') || st.includes('tidak eligible')) {
    return STATUS_CATEGORIES.find(c => c.id === 'keluarga_tidak_eligible')!;
  }
  if (sk.includes('tidak dapat ditemui') || sk.includes('non respon') || st.includes('non respon')) {
    return STATUS_CATEGORIES.find(c => c.id === 'keluarga_non_respon')!;
  }
  if (sk.includes('khusus') || st.includes('khusus')) {
    return STATUS_CATEGORIES.find(c => c.id === 'keluarga_khusus')!;
  }
  if (sk.includes('tidak ditemukan') || st.includes('keluarga tidak ditemukan')) {
    return STATUS_CATEGORIES.find(c => c.id === 'keluarga_tidak_ditemukan')!;
  }
  if (sk.includes('baru') || st.includes('keluarga baru')) {
    return STATUS_CATEGORIES.find(c => c.id === 'keluarga_baru')!;
  }

  // 3. Usaha ditemukan
  if (su.includes('ditemukan') || (point.mFound && point.mFound !== '-')) {
    return STATUS_CATEGORIES.find(c => c.id === 'usaha_ditemukan')!;
  }

  // 4. Default: Keluarga ada usaha vs tidak memiliki usaha
  if (point.u > 0) {
    return STATUS_CATEGORIES.find(c => c.id === 'keluarga_ada_usaha')!;
  }
  return STATUS_CATEGORIES.find(c => c.id === 'keluarga_non_usaha')!;
}

interface KecamatanMeta {
  kecCode: string;
  kecName: string;
  rawKec: string;
  total: number;
  totalBerusaha: number;
  totalNonUsaha: number;
  fileName: string;
  desaList: {
    desaCode: string;
    desaName: string;
    total: number;
    totalBerusaha: number;
    totalNonUsaha: number;
    slsList: { kodeSls: string; namaSls: string; total: number }[];
  }[];
}

interface MetadataIndex {
  totalRawRows: number;
  totalValidPoints?: number;
  totalValidOriginalGeotag?: number;
  totalDeterministicMatched?: number;
  totalFinalCoordinates?: number;
  totalBerusaha: number;
  totalNonUsaha: number;
  matchingBreakdown?: {
    tier1a_direct_nik_match?: number;
    tier1b_family_art_nik_match?: number;
    tier2_phone_fingerprint_match?: number;
    tier3_business_roster_match?: number;
    tier5_clean_name_match?: number;
  };
  security?: {
    standard: string;
    dataProtection: string;
  };
  kecamatanList: KecamatanMeta[];
  statusCounts: Record<string, number>;
  skalaCounts: Record<string, number>;
  generatedAt: string;
}

// Helper to get descriptive matching information and database provenance
export function getCoordinateSourceInfo(point: RespondenPoint) {
  const src = point.mSource || '';
  if (src === 'MATCH_TIER1A_DIRECT_NIK') {
    return {
      title: 'Padanan Presisi NIK Langsung (Tier 1A)',
      badge: '100% Eksak NIK',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: '⚡',
      sourceDb: 'DIL EIS PLN Mempawah × NIK KRT/Pengusaha SE2026',
      description: 'Koordinat rumah diperoleh dari titik meteran PLN yang terdaftar menggunakan NIK KRT / Pelaku Usaha SE2026 secara deterministik.'
    };
  }
  if (src === 'MATCH_TIER1B_FAMILY_ART_NIK') {
    return {
      title: 'Padanan NIK Keluarga Inti (Tier 1B)',
      badge: '100% Eksak Family NIK',
      badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
      icon: '👨‍👩‍👧‍👦',
      sourceDb: 'DIL EIS PLN Mempawah × Regsosek 2022 (Master ART)',
      description: 'Koordinat rumah diperoleh dari titik meteran PLN yang terdaftar atas nama salah satu anggota keluarga inti (istri/anak/orang tua) dalam 1 KK Regsosek.'
    };
  }
  if (src === 'MATCH_TIER2_PHONE') {
    return {
      title: 'Padanan Kontak HP/Telepon (Tier 2)',
      badge: '99% Phone Match',
      badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      icon: '📞',
      sourceDb: 'DIL EIS PLN Mempawah × Kontak Telepon SE2026',
      description: 'Koordinat diperoleh dari meteran PLN yang terdaftar dengan nomor HP/telepon identik pada kecamatan yang sama.'
    };
  }
  if (src === 'MATCH_TIER3_BUSINESS_ROSTER') {
    return {
      title: 'Padanan Roster Usaha Komersial (Tier 3)',
      badge: '95% Business Match',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      icon: '💼',
      sourceDb: 'DIL EIS PLN Mempawah (Tarif Bisnis) × Roster SE2026',
      description: 'Koordinat tempat usaha diperoleh dari meteran PLN kategori bisnis/toko yang memiliki nama komersial persis sama di desa ini.'
    };
  }
  if (src === 'MATCH_TIER5_CLEAN_NAME') {
    return {
      title: 'Padanan Nama & Batas Desa (Tier 5)',
      badge: '88% Name Match',
      badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
      icon: '🏢',
      sourceDb: 'DIL EIS PLN Mempawah × Master Desa SE2026',
      description: 'Koordinat diperoleh dari meteran PLN dengan nama responden yang cocok di dalam batas wilayah desa yang sama.'
    };
  }
  if (src === 'MATCHING_SE_ST' || point.m === 1 || point.mKat) {
    return {
      title: `Matching SE-ST (${point.mKat || 'Usaha Pra-Pencatatan'})`,
      badge: 'ST2023 × SE2026',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: '🟡',
      sourceDb: 'Database Matching SE-ST (Sensus Pertanian 2023 × Sensus Ekonomi 2026)',
      description: 'Titik koordinat keluarga/usaha hasil verifikasi matching SE-ST (AppSheet). Menampilkan rincian usaha ditemukan, tidak ditemukan, maupun tutup.'
    };
  }
  return {
    title: 'Geotagging Asli Lapangan (PCL/PML)',
    badge: '100% Tagging Lapangan',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: '🛰️',
    sourceDb: 'Pendataan Lapangan SE2026 BPS (GPS Tagging)',
    description: 'Koordinat titik diambil langsung dari geotagging GPS oleh petugas pencacah/pengawas lapangan saat sensus SE2026.'
  };
}

// Mempawah Center Coordinates
const MEMPAWAH_CENTER: [number, number] = [0.354, 109.18];
const MEMPAWAH_DEFAULT_ZOOM = 11;

// Helper DMS (Degree Minute Second) Converter
function toDMS(val: number, isLat: boolean): string {
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(2);
  
  let dir = '';
  if (isLat) {
    dir = val >= 0 ? 'LU' : 'LS';
  } else {
    dir = val >= 0 ? 'BT' : 'BB';
  }
  
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

// Helper to sanitize and validate text fields (filter out "nan", "none", etc.)
export const isValidText = (val?: string | null): boolean => {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s !== '' && s !== 'nan' && s !== 'none' && s !== '-' && s !== 'null' && s !== 'undefined';
};

// ==========================================
// ELEGANT SEARCHABLE DROPDOWN (PENILAIAN MITRA STYLE)
// ==========================================
interface DropdownOption {
  value: string;
  label: string;
  badge?: string | number;
}

interface SearchableFilterDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  prefix?: string;
  searchPlaceholder?: string;
  className?: string;
  icon?: React.ElementType;
}

const SearchableFilterDropdown: React.FC<SearchableFilterDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  prefix = '',
  searchPlaceholder = 'Cari opsi...',
  className = '',
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);
  const isDefaultOrAll = value === 'all' || value === 'ALL' || value === 'none' || !value;
  const displayLabel = selectedOpt 
    ? (isDefaultOrAll ? selectedOpt.label : `${prefix}${selectedOpt.label}`) 
    : placeholder;

  const filtered = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative ${isOpen ? 'z-[100]' : 'z-10'} ${className}`} ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
        className={`flex items-center justify-between gap-2 min-w-[145px] sm:min-w-[170px] bg-white border rounded-2xl px-3.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none shadow-2xs ${
          isOpen 
            ? 'border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-950 shadow-sm' 
            : !isDefaultOrAll
              ? 'border-cyan-300 bg-cyan-50/40 text-cyan-900 hover:border-cyan-400'
              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span className="truncate max-w-[160px]">{displayLabel}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-600' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-[100] top-full left-0 mt-1.5 min-w-[220px] max-w-[calc(100vw-32px)] sm:max-w-[320px] w-max bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col"
          >
            {options.length > 5 && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    type="text" 
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-7 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    autoFocus
                  />
                  {search && (
                    <button 
                      type="button" 
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
              {filtered.map(opt => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { 
                      onChange(opt.value); 
                      setIsOpen(false); 
                      setSearch(''); 
                    }}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-50 text-cyan-800 font-extrabold' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span className="truncate mr-2">{opt.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge !== undefined && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-400 italic">Tidak ditemukan</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// MULTI-SELECT STATUS & COLOR FILTER DROPDOWN
// ==========================================
interface MultiSelectStatusDropdownProps {
  categories: StatusCategory[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  statusCounts?: Record<string, number>;
  className?: string;
}

const MultiSelectStatusDropdown: React.FC<MultiSelectStatusDropdownProps> = ({
  categories,
  selectedIds,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = selectedIds.length === 0 || selectedIds.length === categories.length;

  const toggleStatus = (id: string) => {
    if (selectedIds.length === 0) {
      // If currently all selected, clicking one unchecks that one (selects the other 12)
      const allExceptThis = categories.map(c => c.id).filter(i => i !== id);
      onChange(allExceptThis);
    } else if (selectedIds.includes(id)) {
      const next = selectedIds.filter(i => i !== id);
      onChange(next.length === 0 ? ['__none__'] : next);
    } else {
      const next = [...selectedIds.filter(i => i !== '__none__'), id];
      onChange(next.length === categories.length ? [] : next);
    }
  };

  const selectAll = () => {
    onChange([]);
  };

  const clearAll = () => {
    onChange(['__none__']);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.group.toLowerCase().includes(search.toLowerCase())
  );

  const displayLabel = isAllSelected 
    ? 'Semua Status (13 Kategori)' 
    : selectedIds.includes('__none__')
      ? '0 Status Dipilih'
      : `${selectedIds.length} Status Dipilih`;

  return (
    <div className={`relative ${isOpen ? 'z-[100]' : 'z-10'} ${className}`} ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
        className={`flex items-center justify-between gap-2 min-w-[160px] sm:min-w-[195px] bg-white border rounded-2xl px-3.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none shadow-2xs ${
          isOpen 
            ? 'border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-950 shadow-sm' 
            : !isAllSelected
              ? 'border-indigo-400 bg-indigo-50/50 text-indigo-950 hover:border-indigo-500'
              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className={`w-3.5 h-3.5 shrink-0 ${!isAllSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="truncate max-w-[150px]">{displayLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isAllSelected && !selectedIds.includes('__none__') && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
              {selectedIds.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-600' : ''}`} />
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-[100] top-full left-0 mt-1.5 min-w-[280px] sm:min-w-[340px] max-w-[calc(100vw-32px)] bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col"
          >
            {/* Header & Quick Action Buttons */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-cyan-600" />
                  Pilih Warna & Status Peta
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-cyan-100 text-cyan-800 hover:bg-cyan-200 cursor-pointer transition-colors"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer transition-colors"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Cari kategori status..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-1 pl-8 pr-7 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  autoFocus
                />
                {search && (
                  <button 
                    type="button" 
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* List with Checkboxes and Color Dots */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1.5 custom-scrollbar">
              {['Usaha', 'Keluarga'].map(groupName => {
                const groupItems = filteredCategories.filter(c => c.group === groupName);
                if (groupItems.length === 0) return null;

                return (
                  <div key={groupName} className="space-y-0.5">
                    <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/70 rounded-md">
                      {groupName === 'Usaha' ? '💼 Kategori Keberadaan Usaha' : '🏠 Kategori Keberadaan Keluarga'}
                    </div>
                    {groupItems.map(cat => {
                      const isChecked = selectedIds.length === 0 
                        ? true 
                        : (selectedIds.includes(cat.id) && !selectedIds.includes('__none__'));

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleStatus(cat.id)}
                          className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 text-xs rounded-xl transition-all cursor-pointer ${
                            isChecked 
                              ? 'bg-slate-50/80 text-slate-900 font-bold hover:bg-slate-100' 
                              : 'text-slate-400 opacity-60 hover:opacity-100 hover:bg-slate-50 font-normal'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-0 cursor-pointer"
                            />
                            <span 
                              className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10" 
                              style={{ backgroundColor: cat.color }} 
                            />
                            <span className="truncate">{cat.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                            {cat.icon}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              {filteredCategories.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-400 italic">Kategori tidak ditemukan</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// MULTI-SELECT SLS FILTER DROPDOWN
// ==========================================
interface SlsOption {
  kodeSls: string;
  namaSls: string;
  total: number;
}

interface MultiSelectSlsDropdownProps {
  options: SlsOption[];
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const MultiSelectSlsDropdown: React.FC<MultiSelectSlsDropdownProps> = ({
  options,
  selectedKeys,
  onChange,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = selectedKeys.length === 0 || (options.length > 0 && selectedKeys.length === options.length);

  const toggleSls = (key: string) => {
    if (selectedKeys.length === 0) {
      const allExceptThis = options.map(o => o.kodeSls || o.namaSls).filter(k => k !== key);
      onChange(allExceptThis);
    } else if (selectedKeys.includes(key)) {
      const next = selectedKeys.filter(k => k !== key);
      onChange(next.length === 0 ? ['__none__'] : next);
    } else {
      const next = [...selectedKeys.filter(k => k !== '__none__'), key];
      onChange(options.length > 0 && next.length === options.length ? [] : next);
    }
  };

  const selectAll = () => {
    onChange([]);
  };

  const clearAll = () => {
    onChange(['__none__']);
  };

  const filtered = options.filter(o => 
    o.namaSls.toLowerCase().includes(search.toLowerCase()) || 
    o.kodeSls.toLowerCase().includes(search.toLowerCase())
  );

  const displayLabel = disabled
    ? 'Semua SLS (Pilih Desa Dahulu)'
    : options.length === 0
      ? 'Tidak Ada SLS'
      : isAllSelected
        ? `Semua SLS (${options.length})`
        : selectedKeys.includes('__none__')
          ? '0 SLS Dipilih'
          : `${selectedKeys.length} SLS Dipilih`;

  return (
    <div className={`relative ${isOpen ? 'z-[100]' : 'z-10'} ${className}`} ref={dropdownRef}>
      <button 
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => {
          if (disabled || options.length === 0) return;
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
        className={`flex items-center justify-between gap-2 min-w-[155px] sm:min-w-[185px] bg-white border rounded-2xl px-3.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none shadow-2xs ${
          disabled || options.length === 0
            ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400'
            : isOpen 
              ? 'border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-950 shadow-sm' 
              : !isAllSelected
                ? 'border-cyan-400 bg-cyan-50/60 text-cyan-950 hover:border-cyan-500'
                : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className={`w-3.5 h-3.5 shrink-0 ${!isAllSelected && !disabled ? 'text-cyan-600' : 'text-slate-400'}`} />
          <span className="truncate max-w-[145px]">{displayLabel}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isAllSelected && !selectedKeys.includes('__none__') && !disabled && (
            <span className="w-4 h-4 rounded-full bg-cyan-600 text-white text-[9px] font-black flex items-center justify-center">
              {selectedKeys.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-600' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-[100] top-full left-0 mt-1.5 min-w-[280px] sm:min-w-[340px] max-w-[calc(100vw-32px)] bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden flex flex-col"
          >
            {/* Header & Quick Action Buttons */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-600" />
                  Filter Beberapa SLS ({options.length})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-cyan-100 text-cyan-800 hover:bg-cyan-200 cursor-pointer transition-colors"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer transition-colors"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Cari nama atau kode SLS..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-1 pl-8 pr-7 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  autoFocus
                />
                {search && (
                  <button 
                    type="button" 
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* SLS Options List */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
              {filtered.map(sls => {
                const slsKey = sls.kodeSls || sls.namaSls;
                const isChecked = isAllSelected || (selectedKeys.includes(slsKey) && !selectedKeys.includes('__none__'));
                return (
                  <button
                    key={slsKey}
                    type="button"
                    onClick={() => toggleSls(slsKey)}
                    className={`w-full flex items-center justify-between text-left p-2 rounded-xl transition-all cursor-pointer ${
                      isChecked 
                        ? 'bg-cyan-50/90 text-cyan-950 font-bold border border-cyan-200/80 shadow-2xs' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 mr-2">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isChecked 
                          ? 'bg-cyan-600 border-cyan-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs truncate block">{sls.namaSls}</span>
                        {sls.kodeSls && (
                          <span className="text-[10px] text-slate-400 font-mono block">Kode: {sls.kodeSls}</span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0 border border-slate-200/70">
                      {sls.total.toLocaleString('id-ID')}
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-400 italic">SLS tidak ditemukan</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Map Movement Controller Helper
function MapController({
  targetCenter,
  targetZoom,
  targetBounds
}: {
  targetCenter: [number, number] | null;
  targetZoom?: number;
  targetBounds: L.LatLngBoundsExpression | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (targetBounds) {
      map.fitBounds(targetBounds, { padding: [40, 40], maxZoom: 18, animate: true, duration: 1.0 });
    } else if (targetCenter) {
      map.flyTo(targetCenter, targetZoom || 18, { duration: 1.2 });
    }
  }, [map, targetCenter, targetZoom, targetBounds]);

  return null;
}

// Locate User GPS with robust HTML5 Geolocation, Leaflet event isolation, and accuracy circle
function LocateUserControl({ accentColor = '#0ea5e9', markerText = 'Lokasi Anda Saat Ini' }: { accentColor?: string; markerText?: string }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const userLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Initialize LayerGroup for user location marker & circle
  useEffect(() => {
    const layerGroup = L.layerGroup().addTo(map);
    userLayerGroupRef.current = layerGroup;
    return () => {
      layerGroup.clearLayers();
      layerGroup.remove();
    };
  }, [map]);

  // Disable Leaflet map drag/click propagation on the locate button
  useEffect(() => {
    if (buttonRef.current) {
      L.DomEvent.disableClickPropagation(buttonRef.current);
      L.DomEvent.disableScrollPropagation(buttonRef.current);
    }
  }, []);

  const handleLocate = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (locating) return;

    if (!navigator.geolocation) {
      alert('Perangkat atau browser Anda tidak mendukung fitur lokasi (Geolocation).');
      return;
    }

    setLocating(true);

    const onLocationSuccess = (pos: GeolocationPosition) => {
      setLocating(false);
      const { latitude, longitude, accuracy } = pos.coords;
      const latlng: [number, number] = [latitude, longitude];

      if (userLayerGroupRef.current) {
        userLayerGroupRef.current.clearLayers();

        // Accuracy Circle
        if (accuracy && accuracy < 5000) {
          const accCircle = L.circle(latlng, {
            radius: Math.max(accuracy, 15),
            color: accentColor,
            fillColor: accentColor,
            fillOpacity: 0.15,
            weight: 1.5,
          });
          userLayerGroupRef.current.addLayer(accCircle);
        }

        // Pulse Marker
        const userMarker = L.circleMarker(latlng, {
          radius: 8,
          fillColor: accentColor,
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 1,
        });

        userMarker.bindPopup(
          `<div style="font-family: sans-serif; padding: 4px;">
            <b style="font-size: 12px; color: #0f172a;">📍 ${markerText}</b>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              Akurasi: ±${Math.round(accuracy || 0)} meter<br/>
              ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
            </div>
          </div>`,
          { offset: [0, -6] }
        );

        userLayerGroupRef.current.addLayer(userMarker);
        userMarker.openPopup();
      }

      map.flyTo(latlng, Math.max(map.getZoom(), 17), { duration: 1.2 });
    };

    const showErrorMsg = (err: GeolocationPositionError) => {
      if (err.code === 1) { // PERMISSION_DENIED
        alert('Akses lokasi (GPS) ditolak. Harap izinkan akses lokasi pada pengaturan browser atau smartphone Anda.');
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        alert('Informasi lokasi tidak tersedia. Pastikan GPS/Layanan Lokasi perangkat Anda sudah aktif.');
      } else if (err.code === 3) { // TIMEOUT
        alert('Waktu permintaan lokasi GPS habis. Pastikan sinyal GPS cukup kuat.');
      } else {
        alert('Gagal mendeteksi lokasi: ' + (err.message || 'Kesalahan tidak diketahui'));
      }
    };

    const onLocationError = (err: GeolocationPositionError) => {
      // If high accuracy failed with timeout, retry once with low accuracy (network/wifi-based)
      if (err.code === err.TIMEOUT) {
        navigator.geolocation.getCurrentPosition(
          onLocationSuccess,
          (finalErr) => {
            setLocating(false);
            showErrorMsg(finalErr);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
        return;
      }

      setLocating(false);
      showErrorMsg(err);
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [map, accentColor, markerText, locating]);

  return (
    <div className="leaflet-top leaflet-right mt-16 mr-3 z-[900] pointer-events-auto">
      <div className="leaflet-control">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleLocate}
          title="Pusatkan ke Lokasi Saya"
          className="p-2.5 sm:p-3 bg-white/95 backdrop-blur-md hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 active:scale-95 rounded-2xl shadow-xl border border-slate-200/90 transition-all flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer select-none ring-1 ring-black/5"
        >
          <LocateFixed className={`w-4 h-4 sm:w-5 sm:h-5 ${locating ? 'animate-spin text-cyan-600' : 'text-slate-700'}`} style={{ color: locating ? accentColor : undefined }} />
          <span className="hidden sm:inline font-bold">Lokasi Saya</span>
        </button>
      </div>
    </div>
  );
}

// Helper to generate custom SVG Pin with Building Number Label (like mobile FASIH / Wilkerstat CAPI)
const createBuildingPinIcon = (point: RespondenPoint, isSelected: boolean) => {
  const category = getPointStatusCategory(point);
  const rawNb = (point.nb || '').trim();
  let labelText = '';
  if (rawNb && !['NONE', 'NAN', 'NULL', '-', '0'].includes(rawNb.toUpperCase())) {
    labelText = rawNb.toUpperCase().startsWith('B') ? rawNb.toUpperCase() : `B${rawNb}`;
  }

  const fillColor = category.color;
  const strokeColor = isSelected ? '#ffffff' : category.borderColor;
  const isUsaha = point.u > 0;

  // Badge background & text styling matching high-readability satellite layer
  const badgeBg = isUsaha ? '#f0fdf4' : '#ffffff';
  const badgeBorder = isUsaha ? '#4ade80' : '#94a3b8';
  const badgeText = isUsaha ? '#15803d' : '#1e293b';

  const html = `
    <div style="display:inline-flex;align-items:center;transform:translate(-10px, -24px);cursor:pointer;white-space:nowrap;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));pointer-events:auto;">
      <div style="position:relative;width:20px;height:24px;flex-shrink:0;">
        <svg width="20" height="24" viewBox="0 0 24 30" fill="${fillColor}" stroke="${isSelected ? '#ffffff' : strokeColor}" stroke-width="${isSelected ? '2.5' : '1.5'}">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 8.5 12 18 12 18s12-9.5 12-18c0-6.627-5.373-12-12-12z"/>
        </svg>
        <div style="position:absolute;top:6px;left:7px;width:6px;height:6px;border-radius:50%;background:#ffffff;box-shadow:inset 0 1px 2px rgba(0,0,0,0.4);"></div>
      </div>
      ${labelText ? `
        <div style="margin-left:2px;background:${badgeBg};color:${badgeText};border:1.5px solid ${badgeBorder};font-size:10px;font-weight:900;line-height:1;padding:2px 4.5px;border-radius:5px;box-shadow:0 1.5px 4px rgba(0,0,0,0.4);letter-spacing:0.2px;">
          ${labelText}
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-custom-building-pin',
    html: html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Super-Fast Viewport Spatial Culling & Dynamic LOD
function ViewportPointsLayer({
  points,
  onSelectPoint,
  selectedPointId,
  onCopyCoord,
  copiedId,
  isFiltered = false,
  showBuildingLabels = false
}: {
  points: RespondenPoint[];
  onSelectPoint: (p: RespondenPoint) => void;
  selectedPointId?: string;
  onCopyCoord?: (text: string, id: string) => void;
  copiedId?: string | null;
  isFiltered?: boolean;
  showBuildingLabels?: boolean;
}) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [bounds, setBounds] = useState(map.getBounds());

  // Debounced map bounds updates to keep 60 FPS silky smooth
  useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
      setBounds(map.getBounds());
    },
    moveend: () => {
      setBounds(map.getBounds());
    }
  });

  // Calculate visible points inside viewport bounds
  const visiblePoints = useMemo(() => {
    if (!bounds || points.length === 0) return [];
    
    // When filtered, expand bounds buffer and allow higher cap so all points show
    const pad = isFiltered ? 0.06 : 0.01;
    const south = bounds.getSouth() - pad;
    const north = bounds.getNorth() + pad;
    const west = bounds.getWest() - pad;
    const east = bounds.getEast() + pad;

    const visible: RespondenPoint[] = [];
    const len = points.length;
    const maxCap = isFiltered ? 25000 : 4000;

    for (let i = 0; i < len; i++) {
      const p = points[i];
      if (p.lt >= south && p.lt <= north && p.lg >= west && p.lg <= east) {
        visible.push(p);
        if (visible.length >= maxCap) break;
      }
    }
    return visible;
  }, [bounds, points, isFiltered]);

  // When zoomed out (< 12) AND NOT FILTERED, group by desa clusters for summary
  const shouldCluster = !isFiltered && points.length > 3000 && currentZoom < 12;

  const desaClusters = useMemo(() => {
    if (!shouldCluster || points.length === 0) return [];
    
    const groups: Record<string, { name: string; count: number; usaha: number; latSum: number; lngSum: number }> = {};
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const key = p.d || 'unknown';
      if (!groups[key]) {
        groups[key] = {
          name: p.dn || `Desa ${p.d}`,
          count: 0,
          usaha: 0,
          latSum: 0,
          lngSum: 0
        };
      }
      groups[key].count++;
      if (p.u > 0) groups[key].usaha++;
      groups[key].latSum += p.lt;
      groups[key].lngSum += p.lg;
    }

    return Object.entries(groups).map(([code, g]) => ({
      code,
      name: g.name,
      total: g.count,
      usaha: g.usaha,
      lat: g.latSum / g.count,
      lng: g.lngSum / g.count
    }));
  }, [points, shouldCluster]);

  // Zoomed out mode: Render lightweight custom HTML cluster badges only when not filtered
  if (shouldCluster) {
    return (
      <>
        {desaClusters.map((cluster) => {
          const customBadge = L.divIcon({
            className: '',
            html: `<div style="transform:translate(-50%, -50%);background:#0891b2;color:white;padding:5px 10px;border-radius:14px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 4px 14px rgba(8,145,178,0.4);border:2px solid white;cursor:pointer;display:flex;align-items:center;gap:5px;">
              <span style="width:7px;height:7px;border-radius:50%;background:#34d399;"></span>
              <span>${cluster.name} (${cluster.total.toLocaleString('id-ID')})</span>
            </div>`,
            iconSize: [0, 0]
          });

          return (
            <Marker
              key={cluster.code}
              position={[cluster.lat, cluster.lng]}
              icon={customBadge}
              eventHandlers={{
                click: () => {
                  map.flyTo([cluster.lat, cluster.lng], 14, { duration: 1 });
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <div className="font-bold text-xs">
                  <p className="text-cyan-900 font-extrabold">{cluster.name}</p>
                  <p className="text-slate-600">Total: {cluster.total} Responden</p>
                  <p className="text-emerald-700 font-semibold">Ada Usaha: {cluster.usaha} ({Math.round(cluster.usaha / cluster.total * 100)}%)</p>
                  <p className="text-[10px] text-cyan-600 mt-0.5">Klik untuk zoom detail</p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </>
    );
  }

  // If showBuildingLabels is enabled (e.g. filtered by 1-3 SLS or toggled ON), render SVG Pins with B1, B2... labels
  if (showBuildingLabels) {
    return (
      <>
        {visiblePoints.map((point) => {
          const isSelected = selectedPointId === point.i;
          const pinIcon = createBuildingPinIcon(point, isSelected);

          return (
            <Marker
              key={point.i}
              position={[point.lt, point.lg]}
              icon={pinIcon}
              eventHandlers={{
                click: () => {
                  onSelectPoint(point);
                },
              }}
            />
          );
        })}
      </>
    );
  }

  // Zoomed in default mode: Crisp Canvas hardware-accelerated circle markers with 13-category color system
  return (
    <>
      {visiblePoints.map((point) => {
        const isSelected = selectedPointId === point.i;
        const category = getPointStatusCategory(point);

        const fillColor = category.color;
        const strokeColor = isSelected ? '#ffffff' : category.borderColor;

        return (
          <CircleMarker
            key={point.i}
            center={[point.lt, point.lg]}
            radius={isSelected ? 11 : 6.5}
            pathOptions={{
              fillColor: fillColor,
              color: strokeColor,
              weight: isSelected ? 3.5 : 1.5,
              fillOpacity: isSelected ? 1 : 0.9,
            }}
            eventHandlers={{
              click: () => {
                onSelectPoint(point);
              },
            }}
          />
        );
      })}
    </>
  );
}

export const PetaRespondenSE2026: React.FC<PetaRespondenSE2026Props> = ({ onBack }) => {
  const { user } = useAuth();

  // Fullscreen toggle state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Data State
  const [metadata, setMetadata] = useState<MetadataIndex | null>(null);
  const [pointsByKec, setPointsByKec] = useState<Record<string, RespondenPoint[]>>({});
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);
  const [loadingPoints, setLoadingPoints] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // GeoJSON Boundaries State
  const [slsGeoJson, setSlsGeoJson] = useState<any>(null);
  const [desaGeoJson, setDesaGeoJson] = useState<any>(null);
  const [kecGeoJson, setKecGeoJson] = useState<any>(null);

  // Boundary Mode Selection State
  // Options: 'all' | 'kec_desa' | 'kec' | 'desa' | 'sls' | 'none'
  const [boundaryMode, setBoundaryMode] = useState<string>('all');

  // Filters State
  const [selectedKec, setSelectedKec] = useState<string>('all');
  const [selectedDesa, setSelectedDesa] = useState<string>('all');
  const [selectedSls, setSelectedSls] = useState<string[]>([]);
  const [filterUsaha, setFilterUsaha] = useState<string>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  // Building Number Label Visibility (Auto on for 1-3 SLS, or manually toggleable)
  const [showBuildingLabelsManual, setShowBuildingLabelsManual] = useState<boolean | null>(null);
  const isAutoBuildingLabels = selectedSls.length >= 1 && selectedSls.length <= 3;
  const effectiveShowBuildingLabels = showBuildingLabelsManual !== null ? showBuildingLabelsManual : isAutoBuildingLabels;

  // Filter Toolbar Collapsible State (Allows hiding filters on Mobile / Desktop to expand map view)
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  // UI Panels
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showLegendModal, setShowLegendModal] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<RespondenPoint | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Map Movement Target
  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);
  const [targetZoom, setTargetZoom] = useState<number>(11);
  const [targetBounds, setTargetBounds] = useState<L.LatLngBoundsExpression | null>(null);

  // 1. Load Metadata Index on Mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoadingMeta(true);
        setLoadError(null);
        const res = await fetch('/data/se2026_responden/metadata_index.json');
        if (!res.ok) throw new Error('Gagal memuat indeks metadata responden.');
        const rawData = await res.json();
        const data: MetadataIndex = await decryptMilitaryPayload<MetadataIndex>(rawData);
        setMetadata(data);

        // Preload default selected kecamatan data (e.g. 100 Mempawah Hilir)
        if (data.kecamatanList && data.kecamatanList.length > 0) {
          const defaultKec = data.kecamatanList[0].kecCode;
          loadKecamatanPoints(defaultKec);
        }
      } catch (err: any) {
        console.error('Metadata load error:', err);
        setLoadError(err.message || 'Gagal memuat metadata.');
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMetadata();
  }, []);

  // 2. Load Boundary GeoJSONs in Background
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const [resKec, resDesa, resSls] = await Promise.all([
          fetch('/data/batas_kecamatan_6104.geojson'),
          fetch('/data/batas_desa_6104.geojson'),
          fetch('/data/batas_sls_6104.geojson')
        ]);

        if (resKec.ok) setKecGeoJson(await resKec.json());
        if (resDesa.ok) setDesaGeoJson(await resDesa.json());
        if (resSls.ok) setSlsGeoJson(await resSls.json());
      } catch (err) {
        console.warn('Failed to load boundary GeoJSONs:', err);
      }
    };

    fetchGeoData();
  }, []);

  // 3. Helper to Load & Decrypt Points for a specific Kecamatan (AES-256-GCM)
  const loadKecamatanPoints = async (kecCode: string) => {
    if (pointsByKec[kecCode]) return pointsByKec[kecCode];

    try {
      setLoadingPoints(true);
      const res = await fetch(`/data/se2026_responden/responden_kec_${kecCode}.json`);
      if (!res.ok) throw new Error(`Gagal memuat data responden kecamatan ${kecCode}`);
      const rawEncrypted = await res.json();
      
      const decryptedData = await decryptMilitaryPayload(rawEncrypted);
      const loadedPoints: RespondenPoint[] = decryptedData.points || [];

      setPointsByKec(prev => ({
        ...prev,
        [kecCode]: loadedPoints
      }));
      return loadedPoints;
    } catch (err: any) {
      console.error(`Error decrypting points for kec ${kecCode}:`, err);
      return [];
    } finally {
      setLoadingPoints(false);
    }
  };

  // 4. Load points when selectedKec changes
  useEffect(() => {
    if (selectedKec !== 'all') {
      loadKecamatanPoints(selectedKec);
    } else if (metadata?.kecamatanList) {
      metadata.kecamatanList.forEach(k => {
        if (!pointsByKec[k.kecCode]) {
          loadKecamatanPoints(k.kecCode);
        }
      });
    }
  }, [selectedKec, metadata]);

  // 5. Active Kecamatan Info & Available Desas
  const activeKecMeta = useMemo(() => {
    if (!metadata || selectedKec === 'all') return null;
    return metadata.kecamatanList.find(k => k.kecCode === selectedKec) || null;
  }, [metadata, selectedKec]);

  const availableDesasList = useMemo(() => {
    if (!activeKecMeta) {
      if (!metadata) return [];
      const allDesas: { desaCode: string; desaName: string; total: number; slsList: any[] }[] = [];
      metadata.kecamatanList.forEach(k => {
        k.desaList.forEach(d => {
          allDesas.push(d);
        });
      });
      return allDesas;
    }
    return activeKecMeta.desaList;
  }, [activeKecMeta, metadata]);

  const availableSlsList = useMemo(() => {
    if (selectedDesa === 'all') return [];
    const desaObj = availableDesasList.find(d => d.desaCode === selectedDesa);
    return desaObj ? desaObj.slsList : [];
  }, [availableDesasList, selectedDesa]);

  // All points combined
  const allLoadedPoints = useMemo(() => {
    let list: RespondenPoint[] = [];
    Object.values(pointsByKec).forEach(subList => {
      list = list.concat(subList);
    });
    return list;
  }, [pointsByKec]);

  // 6. Filtered Points Calculation
  const displayedPoints = useMemo(() => {
    let sourcePoints: RespondenPoint[] = [];

    if (selectedKec === 'all') {
      sourcePoints = allLoadedPoints;
    } else {
      sourcePoints = pointsByKec[selectedKec] || [];
    }

    if (sourcePoints.length === 0) return [];

    let result = sourcePoints;

    // Filter Desa
    if (selectedDesa !== 'all') {
      result = result.filter(p => p.d === selectedDesa);
    }

    // Filter SLS (Multi-Select)
    if (selectedSls.length > 0) {
      if (selectedSls.includes('__none__')) {
        result = [];
      } else {
        result = result.filter(p => (p.ks && selectedSls.includes(p.ks)) || (p.s && selectedSls.includes(p.s)));
      }
    }

    // Filter Usaha & Matching SE-ST
    if (filterUsaha === 'ada_usaha') {
      result = result.filter(p => p.u > 0 && !p.m);
    } else if (filterUsaha === 'matching_sest') {
      result = result.filter(p => p.m === 1 || !!p.mKat);
    } else if (filterUsaha === 'non_usaha') {
      result = result.filter(p => p.u === 0 && !p.m);
    }

    // Filter Multi-Select Status Kategori (13 Kategori)
    if (selectedStatuses.length > 0) {
      if (selectedStatuses.includes('__none__')) {
        result = [];
      } else {
        result = result.filter(p => selectedStatuses.includes(getPointStatusCategory(p).id));
      }
    }

    // Filter Query (Mencakup Nama KK, Nama Usaha, Pemilik/Pengelola, No Urut Bangunan, SLS, dll)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p => 
        (p.k && p.k.toLowerCase().includes(q)) ||
        (p.nu && p.nu.toLowerCase().includes(q)) ||
        (p.peng && p.peng.toLowerCase().includes(q)) ||
        (p.nb && p.nb.toLowerCase().includes(q)) ||
        (p.s && p.s.toLowerCase().includes(q)) ||
        (p.i && p.i.toLowerCase().includes(q)) ||
        (p.kb && p.kb.toLowerCase().includes(q)) ||
        (p.dn && p.dn.toLowerCase().includes(q)) ||
        (p.stKel && p.stKel.toLowerCase().includes(q)) ||
        (p.stUsaha && p.stUsaha.toLowerCase().includes(q)) ||
        (p.mKat && p.mKat.toLowerCase().includes(q)) ||
        (p.mFound && p.mFound.toLowerCase().includes(q)) ||
        (p.mNotFound && p.mNotFound.toLowerCase().includes(q)) ||
        (p.mClosed && p.mClosed.toLowerCase().includes(q)) ||
        (p.ppl && p.ppl.toLowerCase().includes(q)) ||
        (p.pml && p.pml.toLowerCase().includes(q)) ||
        (p.resp && p.resp.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allLoadedPoints, pointsByKec, selectedKec, selectedDesa, selectedSls, filterUsaha, selectedStatuses, searchQuery]);

  // Instant Search Suggestions Dropdown (Top 8 Matches)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const q = searchQuery.trim().toLowerCase();
    
    const matches: RespondenPoint[] = [];
    for (let i = 0; i < allLoadedPoints.length; i++) {
      const p = allLoadedPoints[i];
      if (
        (p.k && p.k.toLowerCase().includes(q)) ||
        (p.nu && p.nu.toLowerCase().includes(q)) ||
        (p.peng && p.peng.toLowerCase().includes(q)) ||
        (p.nb && p.nb.toLowerCase().includes(q)) ||
        (p.s && p.s.toLowerCase().includes(q)) ||
        (p.i && p.i.toLowerCase().includes(q)) ||
        (p.mKat && p.mKat.toLowerCase().includes(q)) ||
        (p.resp && p.resp.toLowerCase().includes(q))
      ) {
        matches.push(p);
        if (matches.length >= 8) break;
      }
    }
    return matches;
  }, [allLoadedPoints, searchQuery]);

  // Auto-Focus & Fit Bounds to filtered wilayah
  useEffect(() => {
    if (displayedPoints.length === 0) return;

    if (selectedSls.length > 0 || selectedDesa !== 'all' || selectedKec !== 'all') {
      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLng = Infinity;
      let maxLng = -Infinity;

      for (let i = 0; i < displayedPoints.length; i++) {
        const pt = displayedPoints[i];
        if (pt.lt < minLat) minLat = pt.lt;
        if (pt.lt > maxLat) maxLat = pt.lt;
        if (pt.lg < minLng) minLng = pt.lg;
        if (pt.lg > maxLng) maxLng = pt.lg;
      }

      if (minLat !== Infinity && maxLat !== -Infinity && minLng !== Infinity && maxLng !== -Infinity) {
        setTargetCenter(null);
        if (minLat === maxLat && minLng === maxLng) {
          setTargetCenter([minLat, minLng]);
          setTargetZoom(18);
        } else {
          setTargetBounds([
            [minLat, minLng],
            [maxLat, maxLng]
          ]);
        }
      }
    }
  }, [selectedKec, selectedDesa, selectedSls, displayedPoints.length]);

  // Fly to point on select & open popup
  const handleSelectAndZoomToPoint = (pt: RespondenPoint) => {
    setSelectedPoint(pt);
    setTargetBounds(null);
    setTargetCenter([pt.lt, pt.lg]);
    setTargetZoom(19);
    setShowSearchDropdown(false);
  };

  // Handle Enter on Search Bar -> Immediately zoom to first match
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchSuggestions.length > 0) {
        handleSelectAndZoomToPoint(searchSuggestions[0]);
      } else if (displayedPoints.length > 0) {
        handleSelectAndZoomToPoint(displayedPoints[0]);
      }
    }
  };

  // Compute live filtered stats
  const filteredStats = useMemo(() => {
    let total = displayedPoints.length;
    let berUsaha = 0;
    let matchingSEST = 0;
    let nonUsaha = 0;

    for (let i = 0; i < total; i++) {
      const p = displayedPoints[i];
      if (p.m === 1 || p.mKat) matchingSEST++;
      else if (p.u > 0) berUsaha++;
      else nonUsaha++;
    }

    return { total, berUsaha, matchingSEST, nonUsaha };
  }, [displayedPoints]);

  // Handle Copy Helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fly to Mempawah Reset
  const handleResetView = () => {
    setTargetBounds(null);
    setTargetCenter(MEMPAWAH_CENTER);
    setTargetZoom(MEMPAWAH_DEFAULT_ZOOM);
    setSelectedKec('all');
    setSelectedDesa('all');
    setSelectedSls([]);
    setFilterUsaha('all');
    setSelectedPoint(null);
    setShowSearchDropdown(false);
    setShowBuildingLabelsManual(null);
  };

  // Options for Dropdowns
  const kecamatanOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { value: 'all', label: 'Semua Kecamatan', badge: metadata?.totalValidPoints }
    ];
    if (metadata?.kecamatanList) {
      metadata.kecamatanList.forEach(k => {
        list.push({
          value: k.kecCode,
          label: `[${k.kecCode}] ${k.kecName}`,
          badge: k.total
        });
      });
    }
    return list;
  }, [metadata]);

  const desaOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { value: 'all', label: 'Semua Desa/Kelurahan' }
    ];
    availableDesasList.forEach(d => {
      list.push({
        value: d.desaCode,
        label: `[${d.desaCode}] ${d.desaName}`,
        badge: d.total
      });
    });
    return list;
  }, [availableDesasList]);

  const slsOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { value: 'all', label: 'Semua SLS' }
    ];
    availableSlsList.forEach(s => {
      list.push({
        value: s.kodeSls || s.namaSls,
        label: s.namaSls,
        badge: s.total
      });
    });
    return list;
  }, [availableSlsList]);

  const boundaryOptions: DropdownOption[] = [
    { value: 'all', label: 'Semua Batas (Kec + Desa + SLS)' },
    { value: 'kec_desa', label: 'Batas Kecamatan & Desa' },
    { value: 'kec', label: 'Hanya Batas Kecamatan' },
    { value: 'desa', label: 'Hanya Batas Desa/Kelurahan' },
    { value: 'sls', label: 'Hanya Batas SLS' },
    { value: 'none', label: 'Tanpa Batas Wilayah' },
  ];

  const usahaOptions: DropdownOption[] = [
    { value: 'all', label: 'Semua Responden' },
    { value: 'ada_usaha', label: '🟢 Ada Usaha (SE2026)', badge: metadata?.totalBerusaha },
    { value: 'matching_sest', label: '🟡 Usaha Tidak/Sebagian Ditemukan (Matching SE-ST)', badge: 16524 },
    { value: 'non_usaha', label: '🔵 Tidak Ada Usaha', badge: metadata?.totalNonUsaha },
  ];

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedKec !== 'all') count++;
    if (selectedDesa !== 'all') count++;
    if (selectedSls.length > 0) count++;
    if (filterUsaha !== 'all') count++;
    if (selectedStatuses.length > 0) count++;
    if (searchQuery.trim() !== '') count++;
    if (boundaryMode !== 'all') count++;
    return count;
  }, [selectedKec, selectedDesa, selectedSls, filterUsaha, selectedStatuses, searchQuery, boundaryMode]);

  // Active Boundary Layer States based on boundaryMode
  const showKec = boundaryMode === 'all' || boundaryMode === 'kec_desa' || boundaryMode === 'kec';
  const showDesa = boundaryMode === 'all' || boundaryMode === 'kec_desa' || boundaryMode === 'desa';
  const showSls = boundaryMode === 'all' || boundaryMode === 'sls';

  return (
    <div className={`flex flex-col w-full bg-slate-900/5 overflow-hidden select-none transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-[9999] w-screen h-screen bg-slate-900' 
        : 'h-[calc(100vh-5.5rem)] min-h-[620px] rounded-3xl border border-slate-200/80 shadow-lg relative'
    }`}>
      {/* 1. TOP HEADER & STREAMLINED TOOLBAR */}
      <div className="bg-white/95 backdrop-blur-md px-3.5 sm:px-5 py-2.5 border-b border-slate-200/80 flex items-center justify-between gap-2.5 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-slate-800 tracking-tight leading-none">
                  Peta Responden SE2026
                </h1>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-cyan-700" />
                  AES-256
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Fullscreen Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
          {/* Toggle Filter Button (Collapsible / Expandable for Mobile / Desktop) */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
              isFilterOpen
                ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80'
            }`}
            title={isFilterOpen ? 'Sembunyikan Filter & Perluas Peta' : 'Buka Panel Filter'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden xs:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white text-[9px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            {isFilterOpen ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>

          {/* Toggle Nomor Bangunan (B1, B2...) */}
          <button
            onClick={() => setShowBuildingLabelsManual(prev => prev === null ? !isAutoBuildingLabels : !prev)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
              effectiveShowBuildingLabels
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border-slate-200/60'
            }`}
            title={effectiveShowBuildingLabels ? 'Sembunyikan Label Nomor Bangunan' : 'Tampilkan Label Nomor Bangunan (B1, B2...)'}
          >
            <Tag className={`w-3.5 h-3.5 ${effectiveShowBuildingLabels ? 'text-white' : 'text-emerald-600'}`} />
            <span className="hidden sm:inline">No. Bangunan</span>
            {effectiveShowBuildingLabels && (
              <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setShowLegendModal(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/60 shadow-2xs"
            title="Penjelasan & Panduan Legenda Peta"
          >
            <Info className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Legenda</span>
          </button>

          <button
            onClick={() => setShowStatsModal(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/60 shadow-2xs"
            title="Statistik Sebaran Responden"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Statistik</span>
          </button>

          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
              showDrawer 
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
            }`}
            title="Daftar Responden"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Daftar</span>
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 rounded-xl transition-all border border-slate-200/80 cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Perbesar / Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-700" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. NEAT SEARCHABLE FILTER TOOLBAR (Collapsible / Expandable for Full Map View) */}
      <AnimatePresence initial={false}>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="bg-slate-50/95 px-3.5 sm:px-5 py-2 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 z-40 relative shrink-0"
          >
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* 1. Kecamatan Dropdown */}
              <SearchableFilterDropdown
                options={kecamatanOptions}
                value={selectedKec}
                onChange={(val) => {
                  setSelectedKec(val);
                  setSelectedDesa('all');
                  setSelectedSls([]);
                }}
                placeholder="Pilih Kecamatan"
                prefix="Kec: "
                searchPlaceholder="Cari Kecamatan..."
                icon={Building2}
              />

              {/* 2. Desa Dropdown */}
              <SearchableFilterDropdown
                options={desaOptions}
                value={selectedDesa}
                onChange={(val) => {
                  setSelectedDesa(val);
                  setSelectedSls([]);
                }}
                placeholder="Pilih Desa"
                prefix="Desa: "
                searchPlaceholder="Cari Desa/Kel..."
                icon={Home}
              />

              {/* 3. Multi-Select SLS Dropdown */}
              <MultiSelectSlsDropdown
                options={availableSlsList}
                selectedKeys={selectedSls}
                onChange={setSelectedSls}
                disabled={selectedDesa === 'all'}
              />

              {/* 4. Dropdown Batas Wilayah */}
              <SearchableFilterDropdown
                options={boundaryOptions}
                value={boundaryMode}
                onChange={setBoundaryMode}
                placeholder="Pilih Batas Wilayah"
                prefix="Batas: "
                searchPlaceholder="Pilih opsi batas..."
                icon={Layers}
              />

              {/* 5. Multi-Select Status & Warna Responden (13 Kategori) */}
              <MultiSelectStatusDropdown
                categories={STATUS_CATEGORIES}
                selectedIds={selectedStatuses}
                onChange={setSelectedStatuses}
              />
            </div>

            {/* INSTANT SEARCH & AUTO-ZOOM TO COORDINATE */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto relative">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari Nama KK (Tekan Enter utk Zoom)..."
                  className="w-full pl-8 pr-7 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-2xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none shadow-2xs transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Instant Search Suggestions Dropdown with Auto-Zoom on Click */}
                <AnimatePresence>
                  {showSearchDropdown && searchSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[9999] max-h-72 overflow-y-auto custom-scrollbar"
                    >
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Hasil Pencarian ({searchSuggestions.length})</span>
                        <span>Klik utk Zoom</span>
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {searchSuggestions.map((item) => (
                          <li key={item.i}>
                            <button
                              onClick={() => handleSelectAndZoomToPoint(item)}
                              className="w-full text-left p-2.5 hover:bg-cyan-50/70 flex items-start justify-between gap-2 transition-colors cursor-pointer group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-xs text-slate-900 group-hover:text-cyan-700 truncate">
                                    👤 {item.k || 'Responden SE2026'}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                                    item.u > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {item.u > 0 ? 'Ada Usaha' : 'Non-Usaha'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  📍 {item.s} • {item.dn || item.d}
                                </p>
                                {item.nu && (
                                  <p className="text-[10px] font-bold text-emerald-700 truncate">
                                    💼 {item.nu}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleResetView}
                className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
                title="Reset Peta ke Mempawah"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN MAP WORKSPACE (Large & Immersion Mode) */}
      <div className="flex-1 w-full h-full relative z-0">
        {/* Floating Quick Open Filter Pill when filter toolbar is hidden */}
        {!isFilterOpen && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => setIsFilterOpen(true)}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[990] bg-white/95 hover:bg-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-slate-200/90 flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-cyan-700 transition-all cursor-pointer group"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600 group-hover:rotate-45 transition-transform" />
            <span>Buka Filter</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-600 text-white text-[10px] font-black leading-none">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
        )}
        {/* Decryption status indicator */}
        {(loadingMeta || loadingPoints) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <span>Memproses data geospasial mikro SE2026...</span>
          </div>
        )}

        <MapContainer
          center={MEMPAWAH_CENTER}
          zoom={MEMPAWAH_DEFAULT_ZOOM}
          maxZoom={22}
          preferCanvas={true}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          {/* Base Layers with MaxZoom up to 22 */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Google Satellite (Detail Tinggi)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                attribution="&copy; Google Maps"
                maxNativeZoom={20}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Google Hybrid (Satelit + Jalan)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution="&copy; Google Maps"
                maxNativeZoom={20}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="OpenStreetMap Standard">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
                maxNativeZoom={19}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Esri World Imagery">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri"
                maxNativeZoom={18}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Dynamic Boundary Overlays controlled by Dropdown */}
          {showKec && kecGeoJson && (
            <GeoJSON
              key={`layer-kecamatan-${boundaryMode}`}
              data={kecGeoJson}
              style={() => ({
                color: '#dc2626',
                weight: 2.5,
                fillOpacity: 0.03,
                dashArray: '4, 4',
              })}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                layer.bindTooltip(`<b>Kecamatan: ${p.nmkec || '-'}</b>`, { sticky: true });
              }}
            />
          )}

          {showDesa && desaGeoJson && (
            <GeoJSON
              key={`layer-desa-${boundaryMode}`}
              data={desaGeoJson}
              style={() => ({
                color: '#f97316',
                weight: 1.5,
                fillOpacity: 0.04,
                dashArray: '2, 3',
              })}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                layer.bindTooltip(`<b>Desa: ${p.nmdesa || '-'}</b><br/>Kecamatan: ${p.nmkec || '-'}`, { sticky: true });
              }}
            />
          )}

          {showSls && slsGeoJson && (
            <GeoJSON
              key={`layer-sls-${boundaryMode}`}
              data={slsGeoJson}
              style={() => ({
                color: '#8b5cf6',
                weight: 1.2,
                fillOpacity: 0.08,
              })}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                layer.bindTooltip(`<b>${p.nmsls || 'SLS'}</b><br/>Desa: ${p.nmdesa || '-'}`, { sticky: true });
              }}
            />
          )}

          {/* Map Movement & GPS Controller */}
          <MapController
            targetCenter={targetCenter}
            targetZoom={targetZoom}
            targetBounds={targetBounds}
          />
          <LocateUserControl />

          {/* High-Performance Viewport Points Layer */}
          <ViewportPointsLayer
            points={displayedPoints}
            onSelectPoint={(p) => setSelectedPoint(p)}
            selectedPointId={selectedPoint?.i}
            onCopyCoord={handleCopy}
            copiedId={copiedId}
            isFiltered={selectedKec !== 'all' || selectedDesa !== 'all' || selectedSls.length > 0 || filterUsaha !== 'all' || selectedStatuses.length > 0 || searchQuery.trim() !== ''}
            showBuildingLabels={effectiveShowBuildingLabels}
          />
        </MapContainer>

        {/* 5. SLIDE-OUT DRAWER FOR RESPONDENTS LIST */}
        <AnimatePresence>
          {showDrawer && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-white z-[900] shadow-2xl border-l border-slate-200 flex flex-col pointer-events-auto"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-black">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">Daftar Responden</h3>
                    <p className="text-[11px] text-slate-400">{displayedPoints.length} titik terfilter</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {displayedPoints.slice(0, 150).map((pt) => {
                  const isSelected = selectedPoint?.i === pt.i;
                  const isMatching = pt.m === 1 || !!pt.mKat;
                  return (
                    <button
                      key={pt.i}
                      onClick={() => handleSelectAndZoomToPoint(pt)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-cyan-500 bg-cyan-50/60 ring-2 ring-cyan-200 shadow-sm' 
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        {isMatching ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            🟡 {pt.mKat || 'Matching SE-ST'}
                          </span>
                        ) : (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            pt.u > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {pt.u > 0 ? `Ada Usaha (${pt.u})` : 'Tidak Ada Usaha'}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {pt.lt.toFixed(4)}, {pt.lg.toFixed(4)}
                        </span>
                      </div>

                      <h5 className="font-extrabold text-xs text-slate-900 mt-1.5 truncate">
                        👤 {pt.k || 'Responden'}
                      </h5>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        📍 {pt.s} {pt.dn ? `(${pt.dn})` : ''}
                      </p>

                      {isMatching ? (
                        <div className="mt-1 space-y-0.5 text-[10px]">
                          {isValidText(pt.mFound) && <p className="text-emerald-700 font-bold truncate">✅ Ditemukan: {pt.mFound}</p>}
                          {isValidText(pt.mNotFound) && <p className="text-rose-700 font-bold truncate">❌ Tdk Ditemukan: {pt.mNotFound}</p>}
                          {isValidText(pt.mClosed) && <p className="text-amber-700 font-bold truncate">⚠️ Tutup: {pt.mClosed}</p>}
                        </div>
                      ) : isValidText(pt.nu) ? (
                        <p className="text-[11px] font-bold text-emerald-700 truncate mt-1">
                          💼 {pt.nu}
                        </p>
                      ) : null}
                    </button>
                  );
                })}

                {displayedPoints.length > 150 && (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                    Menampilkan 150 responden pertama dari {displayedPoints.length} responden.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. RESPONDENT DETAIL MODAL / BOTTOM SHEET (ROOT LEVEL z-[1050]) */}
      <AnimatePresence>
        {selectedPoint && (
          <div className="fixed inset-0 z-[1050] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPoint(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs pointer-events-auto"
            />

            {/* Modal Card / Bottom Sheet Container */}
            <motion.div
              initial={{ y: '100%', opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) {
                  setSelectedPoint(null);
                }
              }}
              className="relative w-full sm:max-w-lg bg-white border-t sm:border border-slate-200/90 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 pointer-events-auto max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden touch-pan-y"
            >
              {/* Drag Handle Bar for Touch Gestures on Mobile/HP */}
              <div 
                onClick={() => setSelectedPoint(null)}
                className="sm:hidden pt-3 pb-1.5 flex flex-col items-center justify-center cursor-pointer bg-slate-50 border-b border-slate-100 shrink-0"
              >
                <div className="w-12 h-1.5 rounded-full bg-slate-300 mb-1" />
                <span className="text-[10px] text-slate-400 font-bold tracking-tight">Geser ke bawah atau ketuk untuk menutup</span>
              </div>

              {/* Header (Sticky, clearly visible & never cut off) */}
              <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                    (selectedPoint.m === 1 || selectedPoint.mKat)
                      ? 'bg-amber-500 ring-2 ring-amber-200' 
                      : selectedPoint.u > 0 
                      ? 'bg-emerald-500 ring-2 ring-emerald-200' 
                      : 'bg-blue-500 ring-2 ring-blue-200'
                  }`} />
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                      {selectedPoint.k || 'Responden SE2026'}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400 block truncate">ID: {selectedPoint.i}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer shrink-0 transition-colors"
                  title="Tutup Detail"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 text-slate-800">
                {/* Category Status Banner */}
                {(() => {
                  const cat = getPointStatusCategory(selectedPoint);
                  return (
                    <div 
                      className="p-3.5 rounded-2xl border flex flex-col gap-1.5 shadow-2xs"
                      style={{ backgroundColor: `${cat.color}14`, borderColor: `${cat.color}40` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Kategori Status Responden:</span>
                            <h5 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{cat.name}</h5>
                          </div>
                        </div>
                        <span 
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`}
                        >
                          {cat.group}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-100/80 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  );
                })()}

                {/* IDENTITAS KELUARGA, PEMILIK/PENGELOLA USAHA & NO. URUT BANGUNAN */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      Identitas Responden & Bangunan
                    </span>
                    {isValidText(selectedPoint.nb) && (
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        No. Bangunan: #{selectedPoint.nb}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {/* 1. Nama Kepala Keluarga */}
                    <div className="p-2 bg-white rounded-xl border border-slate-200/70 flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0 flex items-center gap-1">
                        <Home className="w-3 h-3 text-blue-500" />
                        Kepala Keluarga:
                      </span>
                      <span className="font-black text-right text-slate-900">{selectedPoint.k || '-'}</span>
                    </div>

                    {/* 2. Nama Pemilik / Pengelola Usaha */}
                    {isValidText(selectedPoint.peng) && (
                      <div className="p-2 bg-emerald-50/90 rounded-xl border border-emerald-200/80 flex items-start justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-emerald-900 flex items-center gap-1 shrink-0">
                          <UserCheck className="w-3 h-3 text-emerald-700" />
                          Pemilik / Pengelola:
                        </span>
                        <span className="font-black text-right text-emerald-950">{selectedPoint.peng}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* KHUSUS: INFORMASI STATUS & ALASAN TIDAK DITEMUKAN / NON-RESPON / TUTUP */}
                {(() => {
                  const cat = getPointStatusCategory(selectedPoint);
                  const isNotFoundOrSpecial = [
                    'keluarga_tidak_ditemukan', 'keluarga_non_respon', 'keluarga_meninggal', 
                    'keluarga_tidak_eligible', 'keluarga_khusus', 'usaha_tidak_ditemukan', 
                    'usaha_tutup', 'usaha_ganda'
                  ].includes(cat.id) || (selectedPoint.m === 1 || !!selectedPoint.mKat);

                  const hasValidStKel = isValidText(selectedPoint.stKel);
                  const hasValidStUsaha = isValidText(selectedPoint.stUsaha);
                  const hasValidMKat = isValidText(selectedPoint.mKat);
                  const hasValidMNotes = isValidText(selectedPoint.mNotes);

                  if (!isNotFoundOrSpecial && !hasValidStKel && !hasValidStUsaha) return null;

                  return (
                    <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Informasi Status & Alasan Lapangan
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Verifikasi Sensus
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-800">
                        {hasValidStKel && (
                          <div className="p-2 bg-white rounded-xl border border-amber-100 flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Status Keluarga:</span>
                            <span className="font-extrabold text-right text-slate-900">{selectedPoint.stKel}</span>
                          </div>
                        )}

                        {hasValidStUsaha && (
                          <div className="p-2 bg-white rounded-xl border border-amber-100 flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Status Usaha:</span>
                            <span className="font-extrabold text-right text-slate-900">{selectedPoint.stUsaha}</span>
                          </div>
                        )}

                        {hasValidMKat && (
                          <div className="p-2 bg-white rounded-xl border border-amber-100 flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Kategori Matching:</span>
                            <span className="font-extrabold text-right text-amber-950">{selectedPoint.mKat}</span>
                          </div>
                        )}

                        {hasValidMNotes && (
                          <div className="p-2.5 bg-white rounded-xl border border-amber-200/60 text-xs">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Catatan Petugas Lapangan:</span>
                            <p className="italic text-slate-700 leading-relaxed font-medium">"{selectedPoint.mNotes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Wilayah */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span className="truncate"><b>SLS:</b> {selectedPoint.s || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pl-5">
                    <span><b>Desa/Kel:</b> {selectedPoint.dn || selectedPoint.d || '-'}</span>
                    {selectedPoint.ks && <span><b>Kode SLS:</b> {selectedPoint.ks}</span>}
                  </div>
                </div>

                {/* DETAIL USAHA MATCHING SE-ST */}
                {(selectedPoint.m === 1 || selectedPoint.mKat) ? (
                  <div className="space-y-2 text-xs">
                    {/* 1. Usaha Ditemukan */}
                    {isValidText(selectedPoint.mFound) && (
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Daftar Usaha Ditemukan ({selectedPoint.mFCnt || 1})
                          </span>
                        </div>
                        <div className="space-y-1 pl-5">
                          {selectedPoint.mFound!.split(/[;\n]/).map((item, idx) => isValidText(item) && (
                            <p key={idx} className="text-xs font-bold text-emerald-950 leading-relaxed">
                              • {item.trim()}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Usaha Tidak Ditemukan */}
                    {isValidText(selectedPoint.mNotFound) && (
                      <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            Daftar Usaha Tidak Ditemukan ({selectedPoint.mNFCnt || 1})
                          </span>
                        </div>
                        <div className="space-y-1 pl-5">
                          {selectedPoint.mNotFound!.split(/[;\n]/).map((item, idx) => isValidText(item) && (
                            <p key={idx} className="text-xs font-bold text-rose-950 leading-relaxed">
                              • {item.trim()}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Usaha Tutup */}
                    {isValidText(selectedPoint.mClosed) && (
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Daftar Usaha Tutup ({selectedPoint.mCCnt || 1})
                          </span>
                        </div>
                        <div className="space-y-1 pl-5">
                          {selectedPoint.mClosed!.split(/[;\n]/).map((item, idx) => isValidText(item) && (
                            <p key={idx} className="text-xs font-bold text-amber-950 leading-relaxed">
                              • {item.trim()}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Catatan Lapangan */}
                    {isValidText(selectedPoint.mNotes) && (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-[10px] uppercase text-slate-500 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          Catatan Lapangan:
                        </span>
                        <p className="italic text-slate-800 leading-relaxed">{selectedPoint.mNotes}</p>
                      </div>
                    )}

                    {/* Informasi Petugas Lapangan & Responden */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Petugas Pendataan (PPL):</span>
                        <span className="font-bold text-slate-800">{isValidText(selectedPoint.ppl) ? selectedPoint.ppl : '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Petugas Pengawas (PML):</span>
                        <span className="font-bold text-slate-800">{isValidText(selectedPoint.pml) ? selectedPoint.pml : '-'}</span>
                      </div>
                      {isValidText(selectedPoint.resp) && (
                        <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-slate-600">Pemberi Info: <b>{selectedPoint.resp}</b></span>
                          {isValidText(selectedPoint.telp) && <span className="font-mono text-[11px] text-cyan-700">📞 {selectedPoint.telp}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Info Usaha Biasa (SE2026) */
                  (isValidText(selectedPoint.nu) || isValidText(selectedPoint.peng)) && (
                    <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-emerald-700" />
                          {isValidText(selectedPoint.nu) ? selectedPoint.nu : 'Kegiatan Usaha Responden'}
                        </p>
                        {selectedPoint.u > 0 && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                            {selectedPoint.u} Usaha
                          </span>
                        )}
                      </div>
                      
                      {isValidText(selectedPoint.peng) && (
                        <div className="p-2 bg-white/80 rounded-xl border border-emerald-200/60 flex items-center justify-between gap-2 text-xs">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase">Pemilik/Pengelola:</span>
                          <span className="font-black text-emerald-950">{selectedPoint.peng}</span>
                        </div>
                      )}
                      
                      {isValidText(selectedPoint.kb) && <p className="text-[11px] text-emerald-800 font-medium">{selectedPoint.kb}</p>}
                      {isValidText(selectedPoint.sk) && <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Skala: {selectedPoint.sk}</p>}
                    </div>
                  )
                )}

                {/* METADATA SUMBER KOORDINAT & HASIL PADANAN (NIK / PLN / LAPANGAN) */}
                {(() => {
                  const srcInfo = getCoordinateSourceInfo(selectedPoint);
                  return (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <span>{srcInfo.icon}</span>
                          Sumber & Metode Koordinat
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${srcInfo.badgeClass}`}>
                          {srcInfo.badge}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900 leading-tight">
                          {srcInfo.title}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          <b>Basis Data:</b> {srcInfo.sourceDb}
                        </p>
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-100 leading-relaxed">
                          {srcInfo.description}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Geospasial Coordinates Card */}
                <div className="p-3 bg-cyan-50/60 rounded-2xl border border-cyan-100 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-cyan-700" />
                    Koordinat Geospasial
                  </span>

                  {/* Format Desimal */}
                  <div className="space-y-0.5 text-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Format Desimal (Long, Lat):</span>
                    <div className="font-mono text-slate-800 font-bold bg-white px-2.5 py-1.5 rounded-xl border border-cyan-100 flex items-center justify-between">
                      <span className="truncate">Long: {selectedPoint.lg.toFixed(6)}°, Lat: {selectedPoint.lt.toFixed(6)}°</span>
                      <button
                        onClick={() => handleCopy(`${selectedPoint.lg}, ${selectedPoint.lt}`, selectedPoint.i + '_dec_drawer')}
                        className="text-cyan-600 hover:text-cyan-800 p-1 cursor-pointer ml-1"
                        title="Salin Desimal"
                      >
                        {copiedId === selectedPoint.i + '_dec_drawer' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Format DMS */}
                  <div className="space-y-0.5 text-xs pt-1 border-t border-cyan-100/80">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Format DMS:</span>
                    <div className="font-mono text-slate-800 font-bold bg-white px-2.5 py-1.5 rounded-xl border border-cyan-100 flex items-center justify-between">
                      <div className="space-y-0.5 text-[11px] truncate">
                        <div><b>Long:</b> {toDMS(selectedPoint.lg, false)}</div>
                        <div><b>Lat:</b> {toDMS(selectedPoint.lt, true)}</div>
                      </div>
                      <button
                        onClick={() => handleCopy(`${toDMS(selectedPoint.lg, false)}, ${toDMS(selectedPoint.lt, true)}`, selectedPoint.i + '_dms_drawer')}
                        className="text-cyan-600 hover:text-cyan-800 p-1 cursor-pointer ml-1 shrink-0"
                        title="Salin DMS"
                      >
                        {copiedId === selectedPoint.i + '_dms_drawer' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Google Maps Link */}
                  <div className="pt-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.lt},${selectedPoint.lg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Buka Rute di Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. STATS MODAL DIALOG */}
      <AnimatePresence>
        {showStatsModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatsModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 sm:p-8 overflow-hidden z-10 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Ringkasan Sebaran Responden SE2026</h3>
                    <p className="text-xs text-slate-500">Statistik agregat se-Kabupaten Mempawah & Matching SE-ST</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Overall Statistics Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-wide">
                    Ringkasan Keseluruhan (Kabupaten Mempawah)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      Ada Usaha (SE2026)
                    </span>
                    <p className="text-2xl font-black text-emerald-900 mt-2">
                      {metadata?.totalBerusaha.toLocaleString('id-ID') || '41.599'}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      Populasi SE2026
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Matching SE-ST
                    </span>
                    <p className="text-2xl font-black text-amber-900 mt-2">
                      16.524
                    </p>
                    <span className="text-[10px] text-amber-800 font-bold mt-0.5">
                      Sebagian / Tdk Ditemukan / Tutup
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Tidak Ada Usaha
                    </span>
                    <p className="text-2xl font-black text-blue-900 mt-2">
                      {metadata?.totalNonUsaha.toLocaleString('id-ID') || '42.525'}
                    </p>
                    <span className="text-[10px] text-blue-700 font-medium mt-0.5">
                      Non-Usaha Rumah Tangga
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown Hasil Pemadanan Presisi NIK & PLN */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                    Hasil Pemadanan Spasial Presisi NIK + PLN Mempawah
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    +9.364 Titik Baru
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">NIK Langsung (100%):</span>
                    <span className="text-xs font-black text-slate-900">3.233 Responden</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">NIK Keluarga/ART (100%):</span>
                    <span className="text-xs font-black text-slate-900">3.614 Responden</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Roster Usaha (95%):</span>
                    <span className="text-xs font-black text-slate-900">2 Usaha</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Nama & Batas Desa (88%):</span>
                    <span className="text-xs font-black text-slate-900">2.515 Responden</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Matching SE-ST Categories */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  Rincian Kategori Matching SE-ST (16.524 Responden)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 block">Sebagian Ditemukan:</span>
                    <span className="text-sm font-black text-amber-950">7.809 (47,3%)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 block">Seluruh Tutup:</span>
                    <span className="text-sm font-black text-amber-950">5.958 (36,1%)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 block">Prelist Tdk Ditemukan:</span>
                    <span className="text-sm font-black text-amber-950">2.757 (16,7%)</span>
                  </div>
                </div>
              </div>

              {/* Filtered Active State (If Filter is applied) */}
              {(selectedKec !== 'all' || selectedDesa !== 'all' || selectedSls.length > 0 || filterUsaha !== 'all' || searchQuery) && (
                <div className="p-3.5 bg-cyan-50/60 rounded-2xl border border-cyan-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-cyan-900 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-cyan-700" />
                      Hasil Filter Aktif Saat Ini
                    </span>
                    <span className="font-mono font-bold text-cyan-800">
                      {filteredStats.total.toLocaleString('id-ID')} Responden Terfilter
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-white/90 rounded-xl border border-cyan-100 flex items-center justify-between">
                      <span className="text-emerald-800 font-bold">🟢 Ada Usaha:</span>
                      <span className="font-extrabold text-emerald-950">{filteredStats.berUsaha.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-xl border border-amber-200 flex items-center justify-between bg-amber-50/60">
                      <span className="text-amber-800 font-bold">🟡 Matching:</span>
                      <span className="font-extrabold text-amber-950">{filteredStats.matchingSEST.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-xl border border-cyan-100 flex items-center justify-between">
                      <span className="text-blue-800 font-bold">🔵 Non-Usaha:</span>
                      <span className="font-extrabold text-blue-950">{filteredStats.nonUsaha.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. DEDICATED MODAL: PANDUAN & PENJELASAN LEGENDA PETA SE2026 */}
      <AnimatePresence>
        {showLegendModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLegendModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[88vh] overflow-hidden z-10 flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-5 sm:px-7 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Panduan & Penjelasan Legenda Peta SE2026
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rincian definisi, kriteria lapangan, dan arti warna dari seluruh 13 kategori responden.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLegendModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Category Cards */}
              <div className="p-5 sm:p-7 overflow-y-auto space-y-6 custom-scrollbar flex-1 text-slate-800">
                {/* 1. KELOMPOK USAHA */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Kategori Keberadaan Usaha (5 Kategori)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {STATUS_CATEGORIES.filter(c => c.group === 'Usaha').map(cat => (
                      <div
                        key={cat.id}
                        className="p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between space-y-2 bg-slate-50/50"
                        style={{ borderColor: `${cat.color}50` }}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white shadow-xs" 
                                style={{ backgroundColor: cat.color }} 
                              />
                              <h5 className="font-black text-xs text-slate-900 leading-tight">
                                {cat.name}
                              </h5>
                            </div>
                            <span className="text-base shrink-0">{cat.icon}</span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                            {cat.description}
                          </p>

                          <div className="p-2 bg-white rounded-xl border border-slate-200/70 text-[10px] space-y-0.5">
                            <span className="font-bold text-slate-500 uppercase block">Kriteria SOP Sensus:</span>
                            <span className="text-slate-800 font-medium leading-relaxed block">{cat.kriteria}</span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`}>
                            {cat.group}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatuses([cat.id]);
                              setShowLegendModal(false);
                            }}
                            className="text-[10px] font-extrabold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
                          >
                            Tampilkan Hanya Status Ini →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. KELOMPOK KELUARGA */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <Home className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Kategori Keberadaan Keluarga (8 Kategori)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {STATUS_CATEGORIES.filter(c => c.group === 'Keluarga').map(cat => (
                      <div
                        key={cat.id}
                        className="p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between space-y-2 bg-slate-50/50"
                        style={{ borderColor: `${cat.color}50` }}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white shadow-xs" 
                                style={{ backgroundColor: cat.color }} 
                              />
                              <h5 className="font-black text-xs text-slate-900 leading-tight">
                                {cat.name}
                              </h5>
                            </div>
                            <span className="text-base shrink-0">{cat.icon}</span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                            {cat.description}
                          </p>

                          <div className="p-2 bg-white rounded-xl border border-slate-200/70 text-[10px] space-y-0.5">
                            <span className="font-bold text-slate-500 uppercase block">Kriteria SOP Sensus:</span>
                            <span className="text-slate-800 font-medium leading-relaxed block">{cat.kriteria}</span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`}>
                            {cat.group}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStatuses([cat.id]);
                              setShowLegendModal(false);
                            }}
                            className="text-[10px] font-extrabold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
                          >
                            Tampilkan Hanya Status Ini →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 sm:px-7 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatuses([]);
                    setShowLegendModal(false);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Tampilkan Semua 13 Status
                </button>
                <button
                  onClick={() => setShowLegendModal(false)}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Tutup Panduan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
