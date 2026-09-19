import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, Award, Database, Download, Upload, Search, Filter, 
  CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, 
  UserCheck, Users, BarChart3, HelpCircle, Save, Check, X, 
  SlidersHorizontal, Star, ThumbsUp, Smile, Ban, ArrowUpDown, 
  FileSpreadsheet, Sparkles, ShieldAlert, RefreshCw, Briefcase,
  MessageSquare, Copy, CheckCheck, FileDown, CheckSquare, Square, ListChecks
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../lib/auth';

interface PenilaianMitraModuleProps {
  onBack: () => void;
}

export interface MitraRecord {
  id?: string;
  email: string;
  nama: string;
  role: string; // 'PPL' | 'PML'
  pj: string;
  kecamatan: string;
  nilai: number | null;
  kategori: string | null;
  catatan?: string;
  updatedAt?: string;
}

export const getRecordKey = (m: MitraRecord): string => {
  return m.id || `${(m.email || '').toLowerCase()}_${(m.role || 'ppl').toLowerCase()}`;
};

// Helper penentu kategori penilaian sesuai aturan BPS
export function getKategoriFromNilai(nilai: number | null | undefined): string | null {
  if (nilai === null || nilai === undefined || isNaN(nilai)) return null;
  if (nilai >= 90 && nilai <= 100) return 'Sangat Direkomendasikan';
  if (nilai >= 80 && nilai < 90) return 'Direkomendasikan';
  if (nilai >= 60 && nilai < 80) return 'Cukup';
  return 'Blacklist';
}

// Helper styling badge kategori
export function getKategoriBadge(kategori: string | null) {
  switch (kategori) {
    case 'Sangat Direkomendasikan':
      return {
        label: '⭐ Sangat Direkomendasikan',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        text: 'text-emerald-700',
        color: '#10b981'
      };
    case 'Direkomendasikan':
      return {
        label: '👍 Direkomendasikan',
        bg: 'bg-sky-50 text-sky-800 border-sky-200',
        text: 'text-sky-700',
        color: '#0284c7'
      };
    case 'Cukup':
      return {
        label: '🙂 Cukup',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        text: 'text-amber-700',
        color: '#f59e0b'
      };
    case 'Blacklist':
      return {
        label: '⛔ Blacklist',
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        text: 'text-rose-700',
        color: '#f43f5e'
      };
    default:
      return {
        label: '⏳ Belum Dinilai',
        bg: 'bg-slate-50 text-slate-500 border-slate-200',
        text: 'text-slate-400',
        color: '#94a3b8'
      };
  }
}

// Konfigurasi daftar kolom ekspor yang dapat dipilih pengguna
export const EXPORT_COLUMNS_CONFIG = [
  { id: 'no', label: 'Nomor Urut', header: 'No', category: 'Umum' },
  { id: 'email', label: 'Email Mitra (Primary Key)', header: 'Email Mitra', category: 'Identitas' },
  { id: 'nama', label: 'Nama Lengkap Mitra', header: 'Nama Mitra', category: 'Identitas' },
  { id: 'role', label: 'Posisi / Role (PPL / PML)', header: 'Posisi / Role', category: 'Penugasan' },
  { id: 'pj', label: 'Penanggung Jawab (PJ)', header: 'Penanggung Jawab (PJ)', category: 'Penugasan' },
  { id: 'kecamatan', label: 'Wilayah / Kecamatan', header: 'Wilayah / Kecamatan', category: 'Penugasan' },
  { id: 'nilai', label: 'Nilai Kinerja (0-100)', header: 'Nilai Kinerja (0-100)', category: 'Penilaian' },
  { id: 'kategori', label: 'Kategori Rekomendasi', header: 'Kategori Kinerja', category: 'Penilaian' },
  { id: 'catatan', label: 'Catatan Kinerja Lapangan', header: 'Catatan Kualitatif Lapangan', category: 'Penilaian' },
  { id: 'status', label: 'Status Penilaian (Sudah/Belum)', header: 'Status Penilaian', category: 'Penilaian' },
  { id: 'penilai', label: 'Nama Penilai / Verifikator', header: 'Penilai', category: 'Sistem' }
];

// Komponen Dropdown Filter Interaktif & Smooth (mirip dashboard monitoring)
interface SmoothSelectOption {
  value: string;
  label: string;
}

interface SmoothSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: (string | SmoothSelectOption)[];
  placeholder: string;
  searchPlaceholder?: string;
  prefix?: string;
  className?: string;
}

const SmoothSelect: React.FC<SmoothSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = 'Cari...',
  prefix = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const normalizedOptions = useMemo(() => {
    return options.map(opt => typeof opt === 'string' ? { value: opt, label: opt } : opt);
  }, [options]);

  const selectedOpt = normalizedOptions.find(o => o.value === value);
  const isDefaultOrAll = value === 'all' || value === 'ALL' || !value;
  const displayLabel = selectedOpt 
    ? (isDefaultOrAll ? selectedOpt.label : `${prefix}${selectedOpt.label}`) 
    : placeholder;

  const filtered = normalizedOptions.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
        className={`flex items-center justify-between gap-2 min-w-[145px] sm:min-w-[170px] bg-white border rounded-2xl px-3.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
          isOpen 
            ? 'border-primary-500 ring-2 ring-primary-500/20 text-primary-950 shadow-sm' 
            : !isDefaultOrAll
              ? 'border-primary-300 bg-primary-50/40 text-primary-900 hover:border-primary-400'
              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
        }`}
      >
        <span className="truncate max-w-[170px]">{displayLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 top-full left-0 mt-1.5 min-w-[210px] max-w-[300px] w-max bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col"
          >
            {normalizedOptions.length > 5 && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    type="text" 
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
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
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200">
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
                        ? 'bg-primary-50 text-primary-700 font-black' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span className="truncate mr-2">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 shrink-0" />}
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

export const PenilaianMitraModule: React.FC<PenilaianMitraModuleProps> = ({ onBack }) => {
  const { user } = useAuth();

  // State data utama
  const [mitraList, setMitraList] = useState<MitraRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  // State dropdown manajemen data (default tersembunyi / hidden)
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);

  // State modal monitoring PJ
  const [showPjModal, setShowPjModal] = useState(false);

  // State modal download dengan pemilihan kolom kustom
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'evaluated' | 'current'>('all');
  const [selectedExportCols, setSelectedExportCols] = useState<string[]>([
    'no', 'email', 'nama', 'role', 'pj', 'kecamatan', 'nilai', 'kategori', 'catatan', 'status'
  ]);

  // State modal import file & column mapping
  const [showImportModal, setShowImportModal] = useState(false);
  const [rawImportData, setRawImportData] = useState<any[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState({
    email: '',
    nama: '',
    role: '',
    pj: '',
    kecamatan: '',
    nilai: '',
    catatan: ''
  });
  const [upsertImport, setUpsertImport] = useState(true);
  const [importFileName, setImportFileName] = useState('');

  // State pop up notifikasi data berhasil tersimpan di database
  const [saveSuccessPopup, setSaveSuccessPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    badge?: string;
    details?: { label: string; val: string }[];
  } | null>(null);

  // Auto-dismiss popup setelah 5 detik jika tidak ditutup manual
  useEffect(() => {
    if (saveSuccessPopup?.isOpen) {
      const timer = setTimeout(() => {
        setSaveSuccessPopup(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccessPopup]);

  // Tab aktif: 'form' (Form Penilaian Per PJ) | 'direktori' (Direktori Rekomendasi Kerja)
  const [activeTab, setActiveTab] = useState<'form' | 'direktori'>('form');

  // State filter & pencarian form penilaian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPjFilter, setSelectedPjFilter] = useState('all');
  const [selectedKecFilter, setSelectedKecFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // State filter khusus direktori kerja
  const [direktoriSearch, setDirektoriSearch] = useState('');
  const [direktoriCategoryFilter, setDirektoriCategoryFilter] = useState('all');
  const [direktoriRoleFilter, setDirektoriRoleFilter] = useState('all');
  const [direktoriKecFilter, setDirektoriKecFilter] = useState('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // State accordion level 1 (PJ) yang terbuka (Default: KOSONG / COLLAPSED / HIDE)
  const [expandedPjs, setExpandedPjs] = useState<Record<string, boolean>>({});

  // Proteksi hak akses role admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl mb-4 border border-rose-100 shadow-sm">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Akses Terbatas</h2>
        <p className="text-slate-500 max-w-md text-sm mb-6">
          Fitur Penilaian Kinerja Mitra Statistik hanya dapat diakses oleh akun dengan peran <strong>Administrator</strong>.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-all shadow-md"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Load data mitra (MySQL API -> fallback local, selalu diselaraskan ke 244 mitra: 214 PPL + 30 PML)
  const fetchMitraData = useCallback(async () => {
    setLoading(true);
    const baseUrl = (import.meta as any).env.VITE_API_URL || '';
    const token = localStorage.getItem('navigasi_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      // 1. Muat acuan baseline resmi 244 mitra (214 PPL + 30 PML)
      let baseline: MitraRecord[] = [];
      try {
        const localRes = await fetch('/data/initial_mitra_se2026.json');
        if (localRes.ok) {
          baseline = await localRes.json();
        }
      } catch (e) {
        console.warn('Gagal memuat baseline data mitra:', e);
      }

      // 2. Ambil data dari API MySQL atau Local Cache
      let incomingData: MitraRecord[] = [];
      try {
        const res = await fetch(`${baseUrl}/api/mitra`, { headers });
        if (res.ok) {
          const apiData = await res.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            incomingData = apiData;
          }
        } else {
          console.warn(`Respon API tidak OK (${res.status}), menggunakan fallback cache lokal`);
        }
      } catch (e) {
        console.warn('Gagal fetch API /api/mitra, menggunakan cache lokal:', e);
      }

      // Jika incomingData kosong (misal API MySQL offline/kosong), pulihkan dari cache lokal v3
      if (incomingData.length === 0) {
        const cached = localStorage.getItem('garda_mitra_cache_v3');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              incomingData = parsed;
            }
          } catch (err) {}
        }
      }

      // 3. Selaraskan data baseline dan data incoming (memperbarui nilai/catatan & menyertakan mitra baru)
      let merged: MitraRecord[] = baseline;
      if (incomingData.length > 0 && baseline.length > 0) {
        const incomingMap = new Map<string, MitraRecord>();
        incomingData.forEach(m => {
          const key = m.id || `${(m.email || '').toLowerCase()}_${(m.role || 'ppl').toLowerCase()}`;
          incomingMap.set(key, m);
          if (m.email) incomingMap.set(m.email.toLowerCase(), m);
        });

        const baselineKeys = new Set<string>();
        merged = baseline.map(b => {
          const key = b.id || `${(b.email || '').toLowerCase()}_${(b.role || 'ppl').toLowerCase()}`;
          baselineKeys.add(key);
          if (b.email) baselineKeys.add(b.email.toLowerCase());

          const existing = incomingMap.get(key) || (incomingData.length === 243 && b.email.toLowerCase() === 'denok8881@gmail.com' ? null : incomingMap.get(b.email.toLowerCase()));
          if (existing) {
            return {
              ...b,
              nama: existing.nama || b.nama,
              role: existing.role || b.role,
              pj: existing.pj && existing.pj !== '-' ? existing.pj : b.pj,
              kecamatan: existing.kecamatan && existing.kecamatan !== '-' ? existing.kecamatan : b.kecamatan,
              nilai: existing.nilai !== undefined && existing.nilai !== null ? existing.nilai : b.nilai,
              kategori: existing.kategori || b.kategori,
              catatan: existing.catatan || b.catatan || ''
            };
          }
          return b;
        });

        // Pertahankan mitra baru yang belum ada di acuan baseline agar tidak hilang
        const extraMitra = incomingData.filter(m => {
          const key = m.id || `${(m.email || '').toLowerCase()}_${(m.role || 'ppl').toLowerCase()}`;
          const emailKey = (m.email || '').toLowerCase();
          return !baselineKeys.has(key) && !baselineKeys.has(emailKey);
        });

        if (extraMitra.length > 0) {
          merged = [...merged, ...extraMitra];
        }
      } else if (incomingData.length > 0) {
        merged = incomingData;
      }

      // Bersihkan cache lama dan simpan cache v3 (244 mitra dengan evaluasi terkini)
      localStorage.removeItem('garda_mitra_cache');
      localStorage.removeItem('garda_mitra_cache_v2');
      localStorage.setItem('garda_mitra_cache_v3', JSON.stringify(merged));
      setMitraList(merged);
    } catch (err) {
      console.error('Error in fetchMitraData:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMitraData();
  }, [fetchMitraData]);

  // Ekstraksi daftar unik PJ dan Kecamatan
  const uniquePjList = useMemo(() => {
    const s = new Set<string>();
    mitraList.forEach(m => { if (m.pj) s.add(m.pj.trim()); });
    return Array.from(s).sort();
  }, [mitraList]);

  const uniqueKecList = useMemo(() => {
    const s = new Set<string>();
    mitraList.forEach(m => { if (m.kecamatan) s.add(m.kecamatan.trim()); });
    return Array.from(s).sort();
  }, [mitraList]);

  // Statistik & Monitoring KPI
  const stats = useMemo(() => {
    const total = mitraList.length;
    let evaluated = 0;
    let totalScore = 0;
    let countSangat = 0;
    let countDirekom = 0;
    let countCukup = 0;
    let countBlacklist = 0;

    mitraList.forEach(m => {
      if (m.nilai !== null && m.nilai !== undefined && !isNaN(m.nilai)) {
        evaluated++;
        totalScore += m.nilai;
        if (m.nilai >= 90) countSangat++;
        else if (m.nilai >= 80) countDirekom++;
        else if (m.nilai >= 60) countCukup++;
        else countBlacklist++;
      }
    });

    const pending = total - evaluated;
    const evaluatedPercent = total > 0 ? Math.round((evaluated / total) * 100) : 0;
    const avgScore = evaluated > 0 ? (totalScore / evaluated).toFixed(1) : '0';

    return {
      total,
      evaluated,
      pending,
      evaluatedPercent,
      avgScore,
      countSangat,
      countDirekom,
      countCukup,
      countBlacklist,
      percentSangat: total > 0 ? Math.round((countSangat / total) * 100) : 0,
      percentDirekom: total > 0 ? Math.round((countDirekom / total) * 100) : 0,
      percentCukup: total > 0 ? Math.round((countCukup / total) * 100) : 0,
      percentBlacklist: total > 0 ? Math.round((countBlacklist / total) * 100) : 0
    };
  }, [mitraList]);

  // Rekapitulasi progres per PJ SE2026
  const pjMonitoringData = useMemo(() => {
    const map: Record<string, {
      pj: string;
      total: number;
      evaluated: number;
      pending: number;
      kecamatans: Set<string>;
      totalScore: number;
    }> = {};

    mitraList.forEach(m => {
      const p = m.pj || 'Tanpa PJ';
      if (!map[p]) {
        map[p] = { pj: p, total: 0, evaluated: 0, pending: 0, kecamatans: new Set(), totalScore: 0 };
      }
      map[p].total++;
      if (m.kecamatan) map[p].kecamatans.add(m.kecamatan);
      if (m.nilai !== null && m.nilai !== undefined && !isNaN(m.nilai)) {
        map[p].evaluated++;
        map[p].totalScore += m.nilai;
      } else {
        map[p].pending++;
      }
    });

    return Object.values(map).map(item => {
      const pct = item.total > 0 ? Math.round((item.evaluated / item.total) * 100) : 0;
      const avg = item.evaluated > 0 ? (item.totalScore / item.evaluated).toFixed(1) : '-';
      return {
        pj: item.pj,
        total: item.total,
        evaluated: item.evaluated,
        pending: item.pending,
        percent: pct,
        avg,
        kecamatans: Array.from(item.kecamatans).join(', '),
        status: pct === 100 ? 'Selesai' : (pct > 0 ? 'Sedang Berjalan' : 'Belum Mulai')
      };
    }).sort((a, b) => b.total - a.total || a.pj.localeCompare(b.pj));
  }, [mitraList]);

  // Filter Data Mitra
  const filteredMitra = useMemo(() => {
    return mitraList.filter(m => {
      const matchPj = selectedPjFilter === 'all' || m.pj === selectedPjFilter;
      const matchKec = selectedKecFilter === 'all' || m.kecamatan === selectedKecFilter;
      
      let matchStatus = true;
      if (selectedStatusFilter === 'evaluated') matchStatus = m.nilai !== null && m.nilai !== undefined;
      else if (selectedStatusFilter === 'pending') matchStatus = m.nilai === null || m.nilai === undefined;
      else if (selectedStatusFilter === 'sangat') matchStatus = (m.nilai || 0) >= 90;
      else if (selectedStatusFilter === 'direkom') matchStatus = (m.nilai || 0) >= 80 && (m.nilai || 0) < 90;
      else if (selectedStatusFilter === 'cukup') matchStatus = (m.nilai || 0) >= 60 && (m.nilai || 0) < 80;
      else if (selectedStatusFilter === 'blacklist') matchStatus = m.nilai !== null && (m.nilai || 0) < 60;

      let matchQuery = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nama = (m.nama || '').toLowerCase();
        const email = (m.email || '').toLowerCase();
        const kec = (m.kecamatan || '').toLowerCase();
        const pj = (m.pj || '').toLowerCase();
        matchQuery = nama.includes(q) || email.includes(q) || kec.includes(q) || pj.includes(q);
      }

      const matchRole = selectedRoleFilter === 'all' || m.role === selectedRoleFilter;

      return matchPj && matchKec && matchStatus && matchRole && matchQuery;
    });
  }, [mitraList, selectedPjFilter, selectedKecFilter, selectedStatusFilter, selectedRoleFilter, searchQuery]);

  // Hierarchical Structure (Grup Level 1: PJ -> Grup Level 2: Kecamatan -> List Mitra)
  const hierarchicalData = useMemo(() => {
    const pjMap: Record<string, Record<string, MitraRecord[]>> = {};

    filteredMitra.forEach(m => {
      const pj = m.pj || 'Tanpa PJ';
      const kec = m.kecamatan || 'Lainnya';

      if (!pjMap[pj]) pjMap[pj] = {};
      if (!pjMap[pj][kec]) pjMap[pj][kec] = [];

      pjMap[pj][kec].push(m);
    });

    return pjMap;
  }, [filteredMitra]);

  // Update nilai tunggal mitra (dengan validasi bilangan bulat 0-100)
  const handleScoreChange = (recordKey: string, rawVal: string) => {
    let finalVal: number | null = null;
    if (rawVal !== '') {
      const intVal = parseInt(rawVal, 10);
      if (isNaN(intVal)) return;
      finalVal = Math.max(0, Math.min(100, intVal)); // Clamp 0-100 bulat
    }

    const updatedKategori = getKategoriFromNilai(finalVal);

    setMitraList(prev => prev.map(m => {
      const key = getRecordKey(m);
      if (key === recordKey) {
        return {
          ...m,
          nilai: finalVal,
          kategori: updatedKategori
        };
      }
      return m;
    }));
  };

  // Update catatan kualitatif mitra
  const handleNoteChange = (recordKey: string, noteVal: string) => {
    setMitraList(prev => prev.map(m => {
      const key = getRecordKey(m);
      if (key === recordKey) {
        return {
          ...m,
          catatan: noteVal
        };
      }
      return m;
    }));
  };

  // Simpan nilai & catatan mitra ke backend / local cache
  const saveSingleMitra = async (record: MitraRecord) => {
    // Validasi catatan wajib diisi minimal 10 karakter
    const noteText = (record.catatan || '').trim();
    if (noteText.length < 10) {
      alert(`⚠️ Catatan kinerja wajib diisi minimal 10 karakter untuk mitra "${record.nama}"!\n\nSaat ini baru ${noteText.length} karakter. Silakan lengkapi catatan evaluasi kualitatif sebelum menyimpan.`);
      return;
    }

    setSavingStatus(`Menyimpan ${record.nama} (${record.role})...`);
    const baseUrl = (import.meta as any).env.VITE_API_URL || '';
    const token = localStorage.getItem('navigasi_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const recordKey = getRecordKey(record);
    let isServerOk = false;

    try {
      const res = await fetch(`${baseUrl}/api/mitra/${encodeURIComponent(recordKey)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: recordKey,
          email: record.email,
          nama: record.nama,
          role: record.role,
          pj: record.pj,
          kecamatan: record.kecamatan,
          nilai: record.nilai,
          catatan: record.catatan,
          penilai: user?.name || 'Administrator'
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned HTTP ${res.status}`);
      }
      isServerOk = true;
      setSavingStatus(`Tersimpan: ${record.nama} (${record.role})`);
    } catch (e: any) {
      console.warn('Simpan offline ke cache:', e);
      setSavingStatus(`Tersimpan lokal: ${record.nama} (${record.role})`);
    }

    // Update local cache v3
    localStorage.setItem('garda_mitra_cache_v3', JSON.stringify(mitraList));
    setTimeout(() => setSavingStatus(null), 2500);

    // Tampilkan Pop Up notifikasi data telah tersimpan di database
    setSaveSuccessPopup({
      isOpen: true,
      title: 'Data Berhasil Tersimpan!',
      badge: isServerOk ? 'Database MySQL Tersinkron' : 'Tersimpan ke Cache Lokal',
      message: `Data penilaian dan catatan untuk mitra "${record.nama}" (${record.role}) telah berhasil disimpan ke database.`,
      details: [
        { label: 'Nama Mitra', val: record.nama },
        { label: 'Posisi / Role', val: record.role },
        { label: 'Penanggung Jawab', val: record.pj || '-' },
        { label: 'Kecamatan', val: record.kecamatan || '-' },
        { label: 'Nilai Kinerja', val: record.nilai !== null && record.nilai !== undefined ? `${record.nilai} (${record.kategori || 'Ternilai'})` : 'Belum Dinilai' },
        ...(record.catatan ? [{ label: 'Catatan Kinerja', val: record.catatan }] : [])
      ]
    });
  };

  // Simpan semua nilai dalam 1 grup PJ
  const saveAllInPj = async (pjName: string) => {
    const itemsInPj = mitraList.filter(m => m.pj === pjName);
    
    // Validasi catatan minimal 10 karakter untuk mitra yang dinilai / memiliki catatan
    const evaluatedItems = itemsInPj.filter(m => m.nilai !== null && m.nilai !== undefined);
    const targetsToCheck = evaluatedItems.length > 0 ? evaluatedItems : itemsInPj;
    const invalidItems = targetsToCheck.filter(m => (m.catatan || '').trim().length < 10);

    if (invalidItems.length > 0) {
      alert(`⚠️ Catatan kinerja wajib diisi minimal 10 karakter untuk seluruh mitra yang dinilai!\n\nTerdapat ${invalidItems.length} mitra dengan catatan kurang dari 10 karakter:\n${invalidItems.slice(0, 5).map(m => `• ${m.nama} (${(m.catatan || '').trim().length}/10 karakter)`).join('\n')}${invalidItems.length > 5 ? `\n...dan ${invalidItems.length - 5} mitra lainnya.` : ''}\n\nSilakan lengkapi catatan terlebih dahulu.`);
      return;
    }

    setSavingStatus(`Menyimpan ${itemsInPj.length} nilai PJ ${pjName}...`);

    const baseUrl = (import.meta as any).env.VITE_API_URL || '';
    const token = localStorage.getItem('navigasi_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let isServerOk = false;
    try {
      const res = await fetch(`${baseUrl}/api/mitra/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: itemsInPj })
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      isServerOk = true;
      setSavingStatus(`✅ Berhasil menyimpan semua nilai & catatan PJ ${pjName}`);
    } catch (e) {
      console.warn('Simpan massal offline ke cache:', e);
      setSavingStatus(`✅ Tersimpan lokal (${itemsInPj.length} data)`);
    }

    localStorage.setItem('garda_mitra_cache_v3', JSON.stringify(mitraList));
    setTimeout(() => setSavingStatus(null), 3000);

    // Tampilkan Pop Up notifikasi data telah tersimpan di database
    setSaveSuccessPopup({
      isOpen: true,
      title: 'Data Berhasil Tersimpan di Database!',
      badge: isServerOk ? `Database MySQL: PJ ${pjName}` : 'Tersimpan ke Cache',
      message: `Seluruh data penilaian (${itemsInPj.length} mitra) untuk Penanggung Jawab ${pjName} telah berhasil disimpan ke database.`,
      details: [
        { label: 'Penanggung Jawab', val: pjName },
        { label: 'Total Mitra Tersimpan', val: `${itemsInPj.length} orang` },
        { label: 'Status Sinkronisasi', val: isServerOk ? 'Tersimpan di Database' : 'Tersimpan Lokal' },
        { label: 'Waktu Simpan', val: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB' }
      ]
    });
  };

  // Filter Data Khusus Direktori Penawaran Kerja
  const direktoriFilteredMitra = useMemo(() => {
    return mitraList.filter(m => {
      // Category filter
      let matchCat = true;
      if (direktoriCategoryFilter === 'prioritas') matchCat = (m.nilai || 0) >= 90;
      else if (direktoriCategoryFilter === 'layak') matchCat = (m.nilai || 0) >= 80 && (m.nilai || 0) < 90;
      else if (direktoriCategoryFilter === 'cadangan') matchCat = (m.nilai || 0) >= 60 && (m.nilai || 0) < 80;
      else if (direktoriCategoryFilter === 'blacklist') matchCat = m.nilai !== null && (m.nilai || 0) < 60;
      else if (direktoriCategoryFilter === 'pending') matchCat = m.nilai === null || m.nilai === undefined;

      // Role filter
      const matchRole = direktoriRoleFilter === 'all' || m.role === direktoriRoleFilter;

      // Kec filter
      const matchKec = direktoriKecFilter === 'all' || m.kecamatan === direktoriKecFilter;

      // Search query
      let matchSearch = true;
      if (direktoriSearch.trim()) {
        const q = direktoriSearch.toLowerCase().trim();
        const nama = (m.nama || '').toLowerCase();
        const email = (m.email || '').toLowerCase();
        const kec = (m.kecamatan || '').toLowerCase();
        const pj = (m.pj || '').toLowerCase();
        const catatan = (m.catatan || '').toLowerCase();
        matchSearch = nama.includes(q) || email.includes(q) || kec.includes(q) || pj.includes(q) || catatan.includes(q);
      }

      return matchCat && matchRole && matchKec && matchSearch;
    });
  }, [mitraList, direktoriCategoryFilter, direktoriRoleFilter, direktoriKecFilter, direktoriSearch]);

  // Salin email ke clipboard
  const handleCopyEmail = (emailStr: string) => {
    navigator.clipboard.writeText(emailStr);
    setCopiedEmail(emailStr);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Export Rekap Khusus Penawaran Kerja Berikutnya
  const handleExportPenawaranKerja = () => {
    const formattedRows = direktoriFilteredMitra.map((m, idx) => {
      let statusPenawaran = 'Belum Dinilai';
      if (m.nilai !== null) {
        if (m.nilai >= 90) statusPenawaran = '🌟 Prioritas Utama (Sangat Direkomendasikan)';
        else if (m.nilai >= 80) statusPenawaran = '👍 Layak Ditawari (Direkomendasikan)';
        else if (m.nilai >= 60) statusPenawaran = '⚠️ Cadangan / Selektif (Cukup)';
        else statusPenawaran = '⛔ Blacklist (Jangan Ditawari)';
      }

      return {
        'No': idx + 1,
        'Nama Mitra': m.nama,
        'Email': m.email,
        'Posisi / Jabatan': m.role,
        'Wilayah / Kecamatan': m.kecamatan,
        'PJ Pembina Sebelumnya': m.pj,
        'Nilai Kinerja (0-100)': m.nilai !== null ? m.nilai : 'Belum Ada',
        'Kategori Kinerja': m.kategori || 'Belum Dinilai',
        'Catatan Kinerja Lapangan': m.catatan || '-',
        'Rekomendasi Penawaran Kerja': statusPenawaran
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekomendasi Penawaran Kerja');

    // Auto-width
    const max_width = formattedRows.reduce((w: any, r: any) => {
      Object.keys(r).forEach((k, i) => {
        const valLen = String(r[k] || '').length;
        w[i] = Math.max(w[i] || 10, valLen + 3);
      });
      return w;
    }, []);
    worksheet['!cols'] = max_width.map((w: number) => ({ wch: w }));

    XLSX.writeFile(workbook, `Rekomendasi_Penawaran_Kerja_Mitra_BPS_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // 1. Download Template Excel Pembaruan Data Mitra
  const handleDownloadTemplate = () => {
    let rowsToExport: any[] = [];

    if (mitraList.length > 0) {
      rowsToExport = mitraList.map(m => ({
        'Email Mitra (Wajib / Identifier)': m.email,
        'Nama Mitra': m.nama,
        'Posisi / Role (PPL / PML)': m.role,
        'Penanggung Jawab (PJ)': m.pj || '-',
        'Wilayah / Kecamatan': m.kecamatan || '-',
        'Nilai Kinerja (0-100)': m.nilai !== null && m.nilai !== undefined ? m.nilai : '',
        'Catatan Kinerja Lapangan': m.catatan || ''
      }));
    } else {
      rowsToExport = [
        {
          'Email Mitra (Wajib / Identifier)': 'contoh.mitra1@bps.go.id',
          'Nama Mitra': 'Ahmad Fauzi',
          'Posisi / Role (PPL / PML)': 'PPL',
          'Penanggung Jawab (PJ)': 'Rahman BPS',
          'Wilayah / Kecamatan': 'Mempawah Hilir',
          'Nilai Kinerja (0-100)': 85,
          'Catatan Kinerja Lapangan': 'Disiplin dan tepat waktu dalam pendataan lapangan'
        },
        {
          'Email Mitra (Wajib / Identifier)': 'contoh.mitra2@bps.go.id',
          'Nama Mitra': 'Siti Aminah',
          'Posisi / Role (PPL / PML)': 'PML',
          'Penanggung Jawab (PJ)': 'Rahman BPS',
          'Wilayah / Kecamatan': 'Sungai Pinyuh',
          'Nilai Kinerja (0-100)': 92,
          'Catatan Kinerja Lapangan': 'Supervisi lapangan sangat teliti dan aktif berkoordinasi'
        }
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pembaruan Nilai Mitra');

    // Auto width
    worksheet['!cols'] = [
      { wch: 32 }, // Email
      { wch: 28 }, // Nama
      { wch: 20 }, // Posisi
      { wch: 24 }, // PJ
      { wch: 22 }, // Kecamatan
      { wch: 20 }, // Nilai
      { wch: 45 }  // Catatan
    ];

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Template_Pembaruan_Nilai_Mitra_SE2026_${dateStr}.xlsx`);
  };

  // 2. Export Data Kustom berdasarkan Kolom yang Dipilih Pengguna
  const handleCustomExport = () => {
    if (selectedExportCols.length === 0) {
      alert('Silakan pilih minimal 1 kolom untuk diekspor!');
      return;
    }

    let sourceData = mitraList;
    let fileSuffix = 'Semua';
    if (exportScope === 'evaluated') {
      sourceData = mitraList.filter(m => m.nilai !== null && m.nilai !== undefined);
      fileSuffix = 'Sudah_Dinilai';
    } else if (exportScope === 'current') {
      sourceData = filteredMitra;
      fileSuffix = 'Filter_Aktif';
    }

    if (sourceData.length === 0) {
      alert('Tidak ada data mitra untuk diekspor pada cakupan ini.');
      return;
    }

    const formattedRows = sourceData.map((m, idx) => {
      const row: Record<string, any> = {};
      selectedExportCols.forEach(colId => {
        const colDef = EXPORT_COLUMNS_CONFIG.find(c => c.id === colId);
        const header = colDef ? colDef.header : colId;

        switch (colId) {
          case 'no':
            row[header] = idx + 1;
            break;
          case 'email':
            row[header] = m.email;
            break;
          case 'nama':
            row[header] = m.nama;
            break;
          case 'role':
            row[header] = m.role;
            break;
          case 'pj':
            row[header] = m.pj;
            break;
          case 'kecamatan':
            row[header] = m.kecamatan;
            break;
          case 'nilai':
            row[header] = m.nilai !== null && m.nilai !== undefined ? m.nilai : '';
            break;
          case 'kategori':
            row[header] = m.kategori || 'Belum Dinilai';
            break;
          case 'catatan':
            row[header] = m.catatan || '';
            break;
          case 'status':
            row[header] = m.nilai !== null && m.nilai !== undefined ? 'Sudah Dinilai' : 'Belum Dinilai';
            break;
          case 'penilai':
            row[header] = user?.name || 'Administrator';
            break;
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Evaluasi Mitra');

    // Auto width
    const keys = Object.keys(formattedRows[0] || {});
    worksheet['!cols'] = keys.map(k => {
      const maxLen = formattedRows.reduce((acc, r) => Math.max(acc, String(r[k] || '').length), k.length);
      return { wch: Math.max(10, Math.min(55, maxLen + 3)) };
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Data_Mitra_SE2026_${fileSuffix}_${dateStr}.xlsx`);
    setShowExportModal(false);
  };

  // 3. Export Data Cepat Standar ke Excel
  const handleExportToExcel = (filterMode: 'all' | 'evaluated' | 'current') => {
    let dataToExport = mitraList;
    if (filterMode === 'evaluated') {
      dataToExport = mitraList.filter(m => m.nilai !== null);
    } else if (filterMode === 'current') {
      dataToExport = filteredMitra;
    }

    if (dataToExport.length === 0) {
      alert('Tidak ada data mitra untuk diekspor.');
      return;
    }

    const formattedRows = dataToExport.map((m, idx) => ({
      'No': idx + 1,
      'Email Mitra': m.email,
      'Nama Mitra': m.nama,
      'Posisi / Role': m.role,
      'Penanggung Jawab (PJ)': m.pj,
      'Wilayah / Kecamatan': m.kecamatan,
      'Nilai Kinerja (0-100)': m.nilai !== null ? m.nilai : '',
      'Kategori Kinerja': m.kategori || 'Belum Dinilai',
      'Catatan Kualitatif Lapangan': m.catatan || '',
      'Status Penilaian': m.nilai !== null ? 'Sudah Dinilai' : 'Belum Dinilai'
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Evaluasi Mitra SE2026');

    // Auto-width columns
    const max_width = formattedRows.reduce((w: any, r: any) => {
      Object.keys(r).forEach((k, i) => {
        const valLen = String(r[k] || '').length;
        w[i] = Math.max(w[i] || 10, valLen + 3);
      });
      return w;
    }, []);
    worksheet['!cols'] = max_width.map((w: number) => ({ wch: w }));

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Hasil_Penilaian_Mitra_SE2026_${dateStr}.xlsx`);
  };

  // 4. Baca File saat Import dipilih
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length === 0) {
          alert('Berkas kosong.');
          return;
        }

        const cols = Object.keys(rows[0]);
        setDetectedColumns(cols);
        setRawImportData(rows);

        // Auto-detect kolom mapping umum
        const autoMap = {
          email: cols.find(c => /email/i.test(c)) || cols[0],
          nama: cols.find(c => /nama/i.test(c) && !/pj/i.test(c)) || cols[1] || '',
          role: cols.find(c => /role|jabatan|posisi/i.test(c)) || '',
          pj: cols.find(c => /pj|penanggung/i.test(c)) || '',
          kecamatan: cols.find(c => /kec|wilayah/i.test(c)) || '',
          nilai: cols.find(c => /nilai|skor|score/i.test(c)) || '',
          catatan: cols.find(c => /catatan|keterangan|review|evaluasi|note/i.test(c)) || ''
        };
        setColumnMapping(autoMap);
        setShowImportModal(true);
      } catch (err) {
        alert('Gagal membaca berkas: ' + err);
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input value
    e.target.value = '';
  };

  // 5. Konfirmasi Import Data dengan Mapping (Upsert: Perbarui data lama + Tambah data baru)
  const handleConfirmImport = async () => {
    if (!columnMapping.email) {
      alert('Kolom Email wajib dipilih sebagai Primary Key!');
      return;
    }
    if (!columnMapping.nama) {
      alert('Kolom Nama Mitra wajib dipilih!');
      return;
    }

    const processedItems: MitraRecord[] = [];
    rawImportData.forEach(row => {
      const email = String(row[columnMapping.email] || '').trim().toLowerCase();
      if (!email) return;

      const nama = String(row[columnMapping.nama] || 'Tanpa Nama').trim();
      const role = columnMapping.role ? String(row[columnMapping.role] || 'PPL').trim().toUpperCase() : 'PPL';
      const pj = columnMapping.pj ? String(row[columnMapping.pj] || '-').trim() : '-';
      const kecamatan = columnMapping.kecamatan ? String(row[columnMapping.kecamatan] || '-').trim() : '-';
      
      let nilai: number | null = null;
      if (columnMapping.nilai && row[columnMapping.nilai] !== '' && row[columnMapping.nilai] !== null && row[columnMapping.nilai] !== undefined) {
        const parsed = parseInt(String(row[columnMapping.nilai]), 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          nilai = parsed;
        }
      }

      const catatan = columnMapping.catatan ? String(row[columnMapping.catatan] || '').trim() : '';

      processedItems.push({
        id: `${email}_${role.toLowerCase()}`,
        email,
        nama,
        role,
        pj,
        kecamatan,
        nilai,
        kategori: getKategoriFromNilai(nilai),
        catatan
      });
    });

    if (processedItems.length === 0) {
      alert('Tidak ada data valid yang dapat di-import.');
      return;
    }

    setSavingStatus(`Memproses import ${processedItems.length} data mitra...`);
    const baseUrl = (import.meta as any).env.VITE_API_URL || '';
    const token = localStorage.getItem('navigasi_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch(`${baseUrl}/api/mitra/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: processedItems, upsert: upsertImport })
      });
    } catch (err) {
      console.warn('Gagal import ke backend MySQL, menyimpan ke local state:', err);
    }

    // Merge ke data: Update data ada dan tambah data baru
    let updatedCount = 0;
    let addedCount = 0;

    const recordMap = new Map<string, MitraRecord>();
    mitraList.forEach(m => {
      recordMap.set(getRecordKey(m), m);
    });

    processedItems.forEach(item => {
      const itemKey = getRecordKey(item);
      const existing = recordMap.get(itemKey) || Array.from(recordMap.values()).find(m => m.email.toLowerCase() === item.email.toLowerCase());

      if (existing) {
        if (upsertImport) {
          updatedCount++;
          const mergedItem: MitraRecord = {
            ...existing,
            nama: item.nama || existing.nama,
            role: item.role || existing.role,
            pj: item.pj && item.pj !== '-' ? item.pj : existing.pj,
            kecamatan: item.kecamatan && item.kecamatan !== '-' ? item.kecamatan : existing.kecamatan,
            nilai: item.nilai !== null ? item.nilai : existing.nilai,
            kategori: item.nilai !== null ? item.kategori : existing.kategori,
            catatan: item.catatan ? item.catatan : (existing.catatan || '')
          };
          recordMap.set(getRecordKey(mergedItem), mergedItem);
        }
      } else {
        addedCount++;
        recordMap.set(itemKey, item);
      }
    });

    const merged = Array.from(recordMap.values());
    localStorage.setItem('garda_mitra_cache_v3', JSON.stringify(merged));
    setMitraList(merged);

    setShowImportModal(false);
    setSavingStatus(`✅ Berhasil import: ${updatedCount} diperbarui, ${addedCount} mitra baru ditambahkan!`);
    setTimeout(() => setSavingStatus(null), 4000);

    // Tampilkan Pop Up notifikasi data telah tersimpan di database
    setSaveSuccessPopup({
      isOpen: true,
      title: 'Data Berhasil Disimpan di Database!',
      badge: 'Sinkronisasi Database Berhasil',
      message: `Pembaruan data penilaian dan penambahan mitra baru dari file "${importFileName || 'Excel'}" telah berhasil disimpan ke database.`,
      details: [
        { label: 'Data Diperbarui (Update)', val: `${updatedCount} mitra` },
        { label: 'Mitra Baru Ditambahkan', val: `${addedCount} orang` },
        { label: 'Total Mitra di Database', val: `${merged.length} mitra` },
        { label: 'Status Sinkronisasi', val: 'Database & Cache Tersinkron' }
      ]
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-primary-600 rounded-2xl border border-slate-200 shadow-xs transition-all"
            title="Kembali"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Penilaian Kinerja Mitra Statistik
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wide">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluasi kinerja mitra lapangan
            </p>
          </div>
        </div>

        {/* Status Simpan / Autosave Toast */}
        {savingStatus && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{savingStatus}</span>
          </div>
        )}
      </div>

      {/* SUB-FITUR NAVIGASI TAB: FORM PENILAIAN VS DIREKTORI PENAWARAN KERJA */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-white text-primary-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Form Penilaian (Per PJ)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('direktori')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'direktori'
                ? 'bg-white text-primary-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 font-bold'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Direktori Rekomendasi & Penawaran Kerja</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'direktori' ? 'bg-primary-100 text-primary-700' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {stats.total} Mitra
            </span>
          </button>
        </div>

        {/* Ringkasan status */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Progres: <strong className="text-slate-800">{stats.evaluated}</strong> / {stats.total} Mitra ({stats.evaluatedPercent}%)</span>
        </div>
      </div>

      {/* TAMPILAN 1: FORM PENILAIAN PER PJ */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          {/* DROPDOWN MANAJEMEN DATA (DEFAULT TERSEMBUNYI / HIDDEN) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <button
          onClick={() => setIsDataManagementOpen(!isDataManagementOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100/80 text-orange-700">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-800">Manajemen Data Mitra</span>
              <p className="text-[11px] text-slate-400">Perbarui, tambah data via Excel, atau unduh data untuk Manajemen Mitra BPS</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>{isDataManagementOpen ? 'Sembunyikan' : 'Buka Pengaturan Data'}</span>
            {isDataManagementOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        <AnimatePresence>
          {isDataManagementOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-100 bg-slate-50/50 p-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Opsi 1: Import & Pembaruan Data */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="w-4 h-4 text-primary-600" />
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                        Import & Pembaruan Data Mitra
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      Unduh template Excel terlebih dahulu, isi atau sesuaikan nilai & catatan kualitatif, lalu unggah kembali untuk sinkronisasi database.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 mb-4 text-[11px] text-slate-600 leading-relaxed">
                      💡 <strong>Aturan Sinkronisasi:</strong> Data yang sudah ada di database akan diperbarui nilai & catatannya. Baris baru yang belum ada akan otomatis ditambahkan ke database.
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 font-bold rounded-xl text-xs text-center transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1. Unduh Template Excel Pembaruan</span>
                    </button>
                    <label className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs text-center cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>2. Upload Berkas Excel yang Sudah Diisi</span>
                      <input 
                        type="file" 
                        accept=".xlsx,.xls,.csv" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Opsi 2: Unduh / Export untuk Manajemen Mitra */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                        Download Data untuk Manajemen Mitra
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      Ekspor data hasil penilaian mitra ke format Excel (<code className="font-mono text-slate-700">.xlsx</code>) dengan kebebasan memilih kolom mana saja yang ingin diikutsertakan.
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 mb-4 text-[11px] text-slate-600 leading-relaxed">
                      📋 <strong>Pilihan Kustom:</strong> Anda dapat mencentang kolom Identitas, Penugasan, Nilai, Catatan, atau Kategori Rekomendasi sesuai kebutuhan.
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4 shrink-0" />
                      <span>Pilih Kolom & Unduh Excel</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleExportToExcel('all')}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition-all truncate"
                        title="Download cepat semua mitra format standar"
                      >
                        <Download className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">Cepat: Semua ({mitraList.length})</span>
                      </button>
                      <button
                        onClick={() => handleExportToExcel('evaluated')}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition-all truncate"
                        title="Download cepat mitra yang sudah dinilai"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">Dinilai ({stats.evaluated})</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DASHBOARD MONITORING & GRAFIK KINERJA */}
      <div className="space-y-4">
        
        {/* KPI Cards Ringkasan */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Mitra</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PML & PPL SE2026</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sudah Dinilai</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.evaluated}</p>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">{stats.evaluatedPercent}% dari total</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Belum Dinilai</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-500">{stats.pending}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Perlu evaluasi PJ</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-Rata Nilai</p>
              <p className="text-2xl sm:text-3xl font-black text-primary-600">{stats.avgScore}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Skala 0–100</p>
            </div>
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>

        {/* Visual Kategori Kinerja & Tombol Monitoring PJ */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-600" />
                Distribusi Mutu & Rekomendasi Kinerja Mitra
              </h3>
              <p className="text-xs text-slate-500">Rentang nilai penilaian mitra yang telah terisi</p>
            </div>

            {/* Tombol Tabel Monitoring Pengisian Nilai per PJ SE2026 */}
            <button
              onClick={() => setShowPjModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Tabel Monitoring per PJ SE2026 ({pjMonitoringData.length} PJ)</span>
            </button>
          </div>

          {/* Bar Distribusi Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            
            {/* 1. Sangat Direkomendasikan */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                  ⭐ Sangat Direkomendasikan
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                  90–100
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black text-emerald-900">{stats.countSangat}</p>
                <p className="text-xs font-bold text-emerald-700">{stats.percentSangat}%</p>
              </div>
              <div className="w-full h-1.5 bg-emerald-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${stats.percentSangat}%` }}></div>
              </div>
            </div>

            {/* 2. Direkomendasikan */}
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-800 flex items-center gap-1.5">
                  👍 Direkomendasikan
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-bold">
                  80–89
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black text-sky-900">{stats.countDirekom}</p>
                <p className="text-xs font-bold text-sky-700">{stats.percentDirekom}%</p>
              </div>
              <div className="w-full h-1.5 bg-sky-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-sky-600 rounded-full" style={{ width: `${stats.percentDirekom}%` }}></div>
              </div>
            </div>

            {/* 3. Cukup */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                  🙂 Cukup
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                  60–79
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black text-amber-900">{stats.countCukup}</p>
                <p className="text-xs font-bold text-amber-700">{stats.percentCukup}%</p>
              </div>
              <div className="w-full h-1.5 bg-amber-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full" style={{ width: `${stats.percentCukup}%` }}></div>
              </div>
              <p className="text-[10px] text-amber-700 mt-1 italic leading-tight">
                *kalau kepepet aja boleh dipakai 😄
              </p>
            </div>

            {/* 4. Blacklist */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-800 flex items-center gap-1.5">
                  ⛔ Blacklist
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold">
                  &lt; 60
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-black text-rose-900">{stats.countBlacklist}</p>
                <p className="text-xs font-bold text-rose-700">{stats.percentBlacklist}%</p>
              </div>
              <div className="w-full h-1.5 bg-rose-200 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-rose-600 rounded-full" style={{ width: `${stats.percentBlacklist}%` }}></div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* PETUNJUK PENGISIAN NILAI (PETUNJUK KINERJA & WAJIB BULAT) */}
      <div className="bg-[#fff7ed] rounded-3xl border border-[#fed7aa] p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-700 shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-black text-slate-900 text-sm tracking-tight">
              Petunjuk Pengisian Nilai Kinerja Mitra Statistik
            </h4>
            <p className="text-slate-600">
              Silakan berikan penilaian kinerja objektif terhadap mitra statistik lapangan SE2026. Dalam penilaian ini, mitra yang bertugas sebagai <strong>PML</strong> dan <strong>PPL dianggap berkedudukan setara</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 font-medium">
              <div className="p-2 rounded-xl bg-white/80 border border-emerald-200 text-emerald-900">
                <p className="font-bold">⭐ Sangat Direkomendasikan</p>
                <p className="text-[11px] text-emerald-700">Rentang Nilai: <strong>90 – 100</strong></p>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-sky-200 text-sky-900">
                <p className="font-bold">👍 Direkomendasikan</p>
                <p className="text-[11px] text-sky-700">Rentang Nilai: <strong>80 – &lt;90</strong></p>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-amber-200 text-amber-900">
                <p className="font-bold">🙂 Cukup</p>
                <p className="text-[11px] text-amber-700">Rentang Nilai: <strong>60 – &lt;80</strong> <em>(kalau kepepet aja boleh dipakai 😄)</em></p>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-rose-200 text-rose-900">
                <p className="font-bold">⛔ Blacklist</p>
                <p className="text-[11px] text-rose-700">Rentang Nilai: <strong>&lt; 60</strong></p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2 text-[11px]">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                PERHATIAN: Nilai yang dimasukkan <strong>HARUS BILANGAN BULAT</strong> (0 sampai 100) dan <strong>TIDAK BOLEH DESIMAL</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & PENCARIAN FORM */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-grow min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama mitra, email, PJ, atau kecamatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 focus:bg-white focus:border-primary-500 outline-none transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter PJ */}
          <SmoothSelect
            value={selectedPjFilter}
            onChange={setSelectedPjFilter}
            options={[
              { value: 'all', label: `Semua PJ (${uniquePjList.length})` },
              ...uniquePjList.map(p => ({ value: p, label: p }))
            ]}
            placeholder="Semua PJ"
            searchPlaceholder="Cari PJ SE2026..."
            prefix="PJ: "
          />

          {/* Filter Kecamatan */}
          <SmoothSelect
            value={selectedKecFilter}
            onChange={setSelectedKecFilter}
            options={[
              { value: 'all', label: `Semua Kecamatan (${uniqueKecList.length})` },
              ...uniqueKecList.map(k => ({ value: k, label: k }))
            ]}
            placeholder="Semua Kecamatan"
            searchPlaceholder="Cari Kecamatan..."
            prefix="Kec: "
          />

          {/* Filter Posisi / Peran */}
          <SmoothSelect
            value={selectedRoleFilter}
            onChange={setSelectedRoleFilter}
            options={[
              { value: 'all', label: `Semua Posisi (${mitraList.length})` },
              { value: 'PPL', label: `PPL (${mitraList.filter(m => m.role === 'PPL').length})` },
              { value: 'PML', label: `PML (${mitraList.filter(m => m.role === 'PML').length})` }
            ]}
            placeholder="Semua Posisi"
            searchPlaceholder="Cari Posisi..."
            prefix="Posisi: "
          />

          {/* Filter Status */}
          <SmoothSelect
            value={selectedStatusFilter}
            onChange={setSelectedStatusFilter}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'evaluated', label: `Sudah Dinilai (${stats.evaluated})` },
              { value: 'pending', label: `Belum Dinilai (${stats.pending})` },
              { value: 'sangat', label: `⭐ Sangat Rekomen (${stats.countSangat})` },
              { value: 'direkom', label: `👍 Direkomendasikan (${stats.countDirekom})` },
              { value: 'cukup', label: `🙂 Cukup (${stats.countCukup})` },
              { value: 'blacklist', label: `⛔ Blacklist (${stats.countBlacklist})` }
            ]}
            placeholder="Semua Status"
            prefix="Status: "
          />

          {/* Reset Filter Button */}
          {(selectedPjFilter !== 'all' || selectedKecFilter !== 'all' || selectedRoleFilter !== 'all' || selectedStatusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedPjFilter('all');
                setSelectedKecFilter('all');
                setSelectedRoleFilter('all');
                setSelectedStatusFilter('all');
                setSearchQuery('');
              }}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset Filter"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* FORM PENILAIAN HIERARKIS: LEVEL 1 (PJ) -> LEVEL 2 (KECAMATAN) -> LEVEL 3 (MITRA) */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-bold text-slate-700 text-sm">Memuat Data Mitra & Penilaian...</p>
          </div>
        ) : Object.keys(hierarchicalData).length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
            <p className="text-slate-400 font-bold text-sm">Tidak ada mitra yang cocok dengan filter pencarian.</p>
            <button
              onClick={() => {
                setSelectedPjFilter('all');
                setSelectedKecFilter('all');
                setSelectedStatusFilter('all');
                setSearchQuery('');
              }}
              className="mt-3 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl text-xs hover:bg-primary-700"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <>
            {/* Kontrol Buka/Tutup Semua Akordeon PJ (Default: HIDE / COLLAPSED) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
              <span className="text-xs font-bold text-slate-500">
                Pengelompokan menurut Penanggung Jawab ({Object.keys(hierarchicalData).length} PJ)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allOpen: Record<string, boolean> = {};
                    Object.keys(hierarchicalData).forEach(p => { allOpen[p] = true; });
                    setExpandedPjs(allOpen);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
                  <span>Buka Semua PJ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedPjs({})}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tutup Semua PJ</span>
                </button>
              </div>
            </div>

            {Object.entries(hierarchicalData).map(([pjName, kecMap]) => {
              // Hitung total mitra & yang sudah dinilai pada PJ ini
              let totalInPj = 0;
              let evaluatedInPj = 0;
              Object.values(kecMap).forEach(list => {
                totalInPj += list.length;
                list.forEach(m => {
                  if (m.nilai !== null && m.nilai !== undefined) evaluatedInPj++;
                });
              });
              const pctInPj = totalInPj > 0 ? Math.round((evaluatedInPj / totalInPj) * 100) : 0;
              const isExpanded = expandedPjs[pjName] === true; // Default HIDE / COLLAPSED

              return (
                <div 
                  key={pjName} 
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                >
                {/* GRUP LEVEL 1: NAMA PJ SE2026 */}
                <div 
                  className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-orange-50/40 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedPjs(p => ({ ...p, [pjName]: !isExpanded }))}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-700 font-bold shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-md">
                          PJ SE2026
                        </span>
                        <h3 className="font-black text-base text-slate-900 tracking-tight">
                          {pjName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {totalInPj} Mitra Lapangan • {Object.keys(kecMap).length} Kecamatan
                      </p>
                    </div>
                  </div>

                  {/* Progres & Tombol Aksi PJ */}
                  <div className="flex items-center gap-3 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-700">
                        {evaluatedInPj} / {totalInPj} Dinilai
                      </p>
                      <div className="w-28 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${pctInPj}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => saveAllInPj(pjName)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      title="Simpan Semua Nilai PJ Ini"
                    >
                      <Save className="w-3.5 h-3.5 text-primary-600" />
                      <span className="hidden sm:inline">Simpan PJ</span>
                    </button>

                    <button
                      onClick={() => setExpandedPjs(p => ({ ...p, [pjName]: !isExpanded }))}
                      className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-500"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* GRUP LEVEL 2: KECAMATAN */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 sm:p-5 space-y-5"
                    >
                      {Object.entries(kecMap).map(([kecName, mitras]) => (
                        <div key={kecName} className="space-y-3">
                          {/* Sub-Header Kecamatan */}
                          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                              Kecamatan {kecName}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">
                              ({mitras.length} Mitra)
                            </span>
                          </div>

                          {/* LEVEL 3: TABEL DAFTAR MITRA */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  <th className="py-2.5 px-3">Nama Mitra & Jabatan</th>
                                  <th className="py-2.5 px-3 hidden lg:table-cell">Email</th>
                                  <th className="py-2.5 px-3 w-32 text-center">Nilai (0–100 Bulat)</th>
                                  <th className="py-2.5 px-3 w-40 text-center">Kategori Rekomendasi</th>
                                  <th className="py-2.5 px-3 min-w-[260px]">Catatan Kinerja (Wajib, Min. 10 Karakter)</th>
                                  <th className="py-2.5 px-3 w-20 text-center">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {mitras.map((m) => {
                                  const badge = getKategoriBadge(m.kategori);
                                  const itemKey = getRecordKey(m);
                                  const noteLength = (m.catatan || '').trim().length;
                                  return (
                                    <tr key={itemKey} className="hover:bg-slate-50/70 transition-colors group">
                                      {/* Nama & Role */}
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                          <p className="font-bold text-slate-900">{m.nama}</p>
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                            m.role === 'PML' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                                          }`}>
                                            {m.role}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 lg:hidden mt-0.5">{m.email}</p>
                                      </td>

                                      {/* Email */}
                                      <td className="py-3 px-3 hidden lg:table-cell font-mono text-[11px] text-slate-500">
                                        {m.email}
                                      </td>

                                      {/* Input Nilai Bulat */}
                                      <td className="py-3 px-3 text-center">
                                        <div className="inline-flex items-center justify-center">
                                          <input
                                            type="number"
                                            step="1"
                                            min="0"
                                            max="100"
                                            placeholder="—"
                                            value={m.nilai !== null && m.nilai !== undefined ? m.nilai : ''}
                                            onChange={(e) => handleScoreChange(itemKey, e.target.value)}
                                            onKeyDown={(e) => {
                                              // Mencegah karakter desimal (titik/koma)
                                              if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') {
                                                e.preventDefault();
                                              }
                                            }}
                                            className={`w-20 px-2 py-1.5 text-center font-black text-sm rounded-xl border outline-none transition-all ${
                                              m.nilai !== null
                                                ? 'bg-white border-primary-400 text-slate-900 shadow-xs focus:ring-2 focus:ring-primary-200'
                                                : 'bg-slate-50 border-slate-200 text-slate-400 focus:bg-white focus:border-primary-400'
                                            }`}
                                          />
                                        </div>
                                      </td>

                                      {/* Kategori Badge */}
                                      <td className="py-3 px-3 text-center">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.bg}`}>
                                          {badge.label}
                                        </span>
                                      </td>

                                      {/* Kolom Catatan Penilaian (Kualitatif) */}
                                      <td className="py-3 px-3">
                                        <div className="relative flex items-center">
                                          <input
                                            type="text"
                                            placeholder="Tulis catatan evaluasi (Wajib, min. 10 karakter)..."
                                            value={m.catatan || ''}
                                            onChange={(e) => handleNoteChange(itemKey, e.target.value)}
                                            className={`w-full bg-slate-50 hover:bg-white focus:bg-white border rounded-xl pl-3 pr-14 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all ${
                                              noteLength >= 10
                                                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                                                : noteLength > 0
                                                  ? 'border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                                                  : 'border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'
                                            }`}
                                          />
                                          <span className={`absolute right-2.5 text-[10px] font-mono font-bold select-none ${
                                            noteLength >= 10 ? 'text-emerald-600 font-black' : noteLength > 0 ? 'text-amber-600' : 'text-slate-400'
                                          }`}>
                                            {noteLength}/10
                                          </span>
                                        </div>
                                      </td>

                                      {/* Tombol Simpan Baris */}
                                      <td className="py-3 px-3 text-center">
                                        <button
                                          onClick={() => saveSingleMitra(m)}
                                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary-50 text-slate-500 hover:text-primary-600 transition-colors cursor-pointer"
                                          title="Simpan Penilaian & Catatan"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
          </>
        )}
      </div>
      </div>
      )}

      {/* TAMPILAN 2: SUB-FITUR DIREKTORI REKOMENDASI & PENAWARAN KERJA */}
      {activeTab === 'direktori' && (
        <div className="space-y-6">
          {/* Header Card Direktori - Redesigned to be Clean, Bright & Modern */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Direktori Evaluasi & Penawaran Kerja Survei Berikutnya</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Profil Kinerja & Rekomendasi Penugasan Mitra
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  Pantau nilai evaluasi dan catatan kualitatif lapangan seluruh mitra untuk mempermudah seleksi, penawaran kontrak, atau pemanggilan tugas pada kegiatan survei BPS Kabupaten Mempawah berikutnya.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleExportPenawaranKerja}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Rekap Penawaran (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Cards - Bright, Clean & Clickable for Quick Filtering */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Prioritas Utama */}
              <button
                type="button"
                onClick={() => setDirektoriCategoryFilter(direktoriCategoryFilter === 'prioritas' ? 'all' : 'prioritas')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  direktoriCategoryFilter === 'prioritas'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/40'
                    : 'bg-emerald-50/60 hover:bg-emerald-50 text-emerald-950 border-emerald-200/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] uppercase font-black tracking-wider ${
                    direktoriCategoryFilter === 'prioritas' ? 'text-emerald-100' : 'text-emerald-700'
                  }`}>
                    ⭐ Prioritas Utama
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    direktoriCategoryFilter === 'prioritas' ? 'bg-white/20 text-white' : 'bg-emerald-100/80 text-emerald-800'
                  }`}>
                    90–100
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black">{stats.countSangat}</span>
                  <span className={`text-xs font-semibold ${
                    direktoriCategoryFilter === 'prioritas' ? 'text-emerald-100' : 'text-emerald-600'
                  }`}>Mitra</span>
                </div>
                <p className={`text-[11px] mt-1 truncate ${
                  direktoriCategoryFilter === 'prioritas' ? 'text-emerald-100' : 'text-slate-500'
                }`}>
                  Sangat Direkomendasikan
                </p>
              </button>

              {/* Layak Ditawari */}
              <button
                type="button"
                onClick={() => setDirektoriCategoryFilter(direktoriCategoryFilter === 'layak' ? 'all' : 'layak')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  direktoriCategoryFilter === 'layak'
                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm ring-2 ring-sky-400/40'
                    : 'bg-sky-50/60 hover:bg-sky-50 text-sky-950 border-sky-200/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] uppercase font-black tracking-wider ${
                    direktoriCategoryFilter === 'layak' ? 'text-sky-100' : 'text-sky-700'
                  }`}>
                    👍 Layak Ditawari
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    direktoriCategoryFilter === 'layak' ? 'bg-white/20 text-white' : 'bg-sky-100/80 text-sky-800'
                  }`}>
                    80–89
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black">{stats.countDirekom}</span>
                  <span className={`text-xs font-semibold ${
                    direktoriCategoryFilter === 'layak' ? 'text-sky-100' : 'text-sky-600'
                  }`}>Mitra</span>
                </div>
                <p className={`text-[11px] mt-1 truncate ${
                  direktoriCategoryFilter === 'layak' ? 'text-sky-100' : 'text-slate-500'
                }`}>
                  Direkomendasikan
                </p>
              </button>

              {/* Cadangan Bersyarat */}
              <button
                type="button"
                onClick={() => setDirektoriCategoryFilter(direktoriCategoryFilter === 'cadangan' ? 'all' : 'cadangan')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  direktoriCategoryFilter === 'cadangan'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                    : 'bg-amber-50/60 hover:bg-amber-50 text-amber-950 border-amber-200/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] uppercase font-black tracking-wider ${
                    direktoriCategoryFilter === 'cadangan' ? 'text-amber-100' : 'text-amber-700'
                  }`}>
                    ⚠️ Cadangan
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    direktoriCategoryFilter === 'cadangan' ? 'bg-white/20 text-white' : 'bg-amber-100/80 text-amber-800'
                  }`}>
                    60–79
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black">{stats.countCukup}</span>
                  <span className={`text-xs font-semibold ${
                    direktoriCategoryFilter === 'cadangan' ? 'text-amber-100' : 'text-amber-600'
                  }`}>Mitra</span>
                </div>
                <p className={`text-[11px] mt-1 truncate ${
                  direktoriCategoryFilter === 'cadangan' ? 'text-amber-100' : 'text-slate-500'
                }`}>
                  Kinerja Cukup
                </p>
              </button>

              {/* Blacklist */}
              <button
                type="button"
                onClick={() => setDirektoriCategoryFilter(direktoriCategoryFilter === 'blacklist' ? 'all' : 'blacklist')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  direktoriCategoryFilter === 'blacklist'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm ring-2 ring-rose-400/40'
                    : 'bg-rose-50/60 hover:bg-rose-50 text-rose-950 border-rose-200/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] uppercase font-black tracking-wider ${
                    direktoriCategoryFilter === 'blacklist' ? 'text-rose-100' : 'text-rose-700'
                  }`}>
                    ⛔ Blacklist
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    direktoriCategoryFilter === 'blacklist' ? 'bg-white/20 text-white' : 'bg-rose-100/80 text-rose-800'
                  }`}>
                    &lt; 60
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black">{stats.countBlacklist}</span>
                  <span className={`text-xs font-semibold ${
                    direktoriCategoryFilter === 'blacklist' ? 'text-rose-100' : 'text-rose-600'
                  }`}>Mitra</span>
                </div>
                <p className={`text-[11px] mt-1 truncate ${
                  direktoriCategoryFilter === 'blacklist' ? 'text-rose-100' : 'text-slate-500'
                }`}>
                  Hindari Penugasan
                </p>
              </button>
            </div>
          </div>

          {/* Filter Bar Direktori */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-grow min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama mitra, email, catatan kualitatif, atau PJ..."
                value={direktoriSearch}
                onChange={(e) => setDirektoriSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 focus:bg-white focus:border-primary-500 outline-none transition-all"
              />
              {direktoriSearch && (
                <button 
                  type="button" 
                  onClick={() => setDirektoriSearch('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filter Rekomendasi Kerja */}
              <SmoothSelect
                value={direktoriCategoryFilter}
                onChange={setDirektoriCategoryFilter}
                options={[
                  { value: 'all', label: `Semua Kategori (${mitraList.length})` },
                  { value: 'prioritas', label: `🌟 Prioritas Ditawari (${stats.countSangat})` },
                  { value: 'layak', label: `👍 Layak Ditawari (${stats.countDirekom})` },
                  { value: 'cadangan', label: `⚠️ Cadangan (${stats.countCukup})` },
                  { value: 'blacklist', label: `⛔ Blacklist (${stats.countBlacklist})` },
                  { value: 'pending', label: `⏳ Belum Dievaluasi (${stats.pending})` }
                ]}
                placeholder="Semua Kategori"
                prefix="Rekomendasi: "
              />

              {/* Filter Posisi */}
              <SmoothSelect
                value={direktoriRoleFilter}
                onChange={setDirektoriRoleFilter}
                options={[
                  { value: 'all', label: `Semua Posisi (${mitraList.length})` },
                  { value: 'PPL', label: `PPL (${mitraList.filter(m => m.role === 'PPL').length})` },
                  { value: 'PML', label: `PML (${mitraList.filter(m => m.role === 'PML').length})` }
                ]}
                placeholder="Semua Posisi"
                prefix="Posisi: "
              />

              {/* Filter Kecamatan */}
              <SmoothSelect
                value={direktoriKecFilter}
                onChange={setDirektoriKecFilter}
                options={[
                  { value: 'all', label: `Semua Kecamatan (${uniqueKecList.length})` },
                  ...uniqueKecList.map(k => ({ value: k, label: k }))
                ]}
                placeholder="Semua Kecamatan"
                searchPlaceholder="Cari Kecamatan..."
                prefix="Kec: "
              />

              {/* Reset */}
              {(direktoriSearch || direktoriCategoryFilter !== 'all' || direktoriRoleFilter !== 'all' || direktoriKecFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setDirektoriSearch('');
                    setDirektoriCategoryFilter('all');
                    setDirektoriRoleFilter('all');
                    setDirektoriKecFilter('all');
                  }}
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Reset Filter"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Daftar Mitra & Profil Kinerja untuk Penawaran Kerja */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">
                Menampilkan <strong className="text-slate-900">{direktoriFilteredMitra.length}</strong> mitra yang siap dipertimbangkan untuk penawaran kerja berikutnya
              </span>
              {copiedEmail && (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Email {copiedEmail} berhasil disalin!
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Mitra</th>
                    <th className="py-3 px-3">Wilayah & Posisi</th>
                    <th className="py-3 px-3 w-32 text-center">Nilai Kinerja</th>
                    <th className="py-3 px-3 w-40 text-center">Status Rekomendasi</th>
                    <th className="py-3 px-4 min-w-[260px]">Catatan Kinerja (Wajib, Min. 10 Karakter)</th>
                    <th className="py-3 px-3 w-28 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {direktoriFilteredMitra.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        Tidak ada mitra yang cocok dengan filter penawaran kerja.
                      </td>
                    </tr>
                  ) : (
                    direktoriFilteredMitra.map((m) => {
                      const itemKey = getRecordKey(m);
                      const noteLength = (m.catatan || '').trim().length;
                      let offerBadge = {
                        text: '⏳ Belum Dinilai',
                        bg: 'bg-slate-100 text-slate-600 border-slate-200'
                      };
                      if (m.nilai !== null) {
                        if (m.nilai >= 90) offerBadge = { text: '🌟 Prioritas Ditawari', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black' };
                        else if (m.nilai >= 80) offerBadge = { text: '👍 Layak Ditawari', bg: 'bg-sky-50 text-sky-700 border-sky-300 font-black' };
                        else if (m.nilai >= 60) offerBadge = { text: '⚠️ Cadangan Bersyarat', bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' };
                        else offerBadge = { text: '⛔ Jangan Ditawari', bg: 'bg-rose-50 text-rose-800 border-rose-300 font-black' };
                      }

                      return (
                        <tr key={itemKey} className="hover:bg-slate-50/70 transition-colors">
                          {/* Nama & Email */}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900 text-sm">{m.nama}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-500">{m.email}</span>
                              <button 
                                type="button" 
                                onClick={() => handleCopyEmail(m.email)}
                                title="Salin Email"
                                className="text-slate-400 hover:text-primary-600 cursor-pointer p-0.5 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">PJ Pembina: {m.pj}</p>
                          </td>

                          {/* Wilayah & Posisi */}
                          <td className="py-3.5 px-3">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                              m.role === 'PML' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {m.role}
                            </span>
                            <p className="font-bold text-slate-700 text-xs">Kec. {m.kecamatan}</p>
                          </td>

                          {/* Nilai */}
                          <td className="py-3.5 px-3 text-center">
                            {m.nilai !== null ? (
                              <div>
                                <span className="text-base font-black text-slate-900">{m.nilai}</span>
                                <span className="text-[10px] text-slate-400 block font-medium">Skala 0-100</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Belum dinilai</span>
                            )}
                          </td>

                          {/* Status Rekomendasi Penawaran Kerja */}
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-flex items-center justify-center text-[10px] px-2.5 py-1 rounded-full border ${offerBadge.bg}`}>
                              {offerBadge.text}
                            </span>
                          </td>

                          {/* Catatan Kinerja Lapangan (Kualitatif) */}
                          <td className="py-3.5 px-4">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                placeholder="Tulis catatan pertimbangan (Wajib, min. 10 karakter)..."
                                value={m.catatan || ''}
                                onChange={(e) => handleNoteChange(itemKey, e.target.value)}
                                className={`w-full bg-slate-50 hover:bg-white focus:bg-white border rounded-xl pl-3 pr-14 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all ${
                                  noteLength >= 10
                                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                                    : noteLength > 0
                                      ? 'border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                                      : 'border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'
                                }`}
                              />
                              <span className={`absolute right-2.5 text-[10px] font-mono font-bold select-none ${
                                noteLength >= 10 ? 'text-emerald-600 font-black' : noteLength > 0 ? 'text-amber-600' : 'text-slate-400'
                              }`}>
                                {noteLength}/10
                              </span>
                            </div>
                          </td>

                          {/* Aksi Cepat */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => saveSingleMitra(m)}
                                className="px-3 py-1.5 bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Simpan Perubahan Catatan/Nilai"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MONITORING PROGRES PER PJ SE2026 */}
      <AnimatePresence>
        {showPjModal && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 bg-[#fff7ed] flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base tracking-tight flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-orange-600" />
                    Monitoring Pengisian Nilai per PJ SE2026
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rekapitulasi progres evaluasi seluruh Penanggung Jawab (PJ) di Kabupaten Mempawah
                  </p>
                </div>
                <button
                  onClick={() => setShowPjModal(false)}
                  className="p-1.5 rounded-xl hover:bg-orange-100 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Table Content */}
              <div className="p-5 overflow-y-auto custom-scrollbar flex-grow text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama PJ SE2026</th>
                      <th className="py-2.5 px-3">Kecamatan Diampu</th>
                      <th className="py-2.5 px-3 text-center">Total Mitra</th>
                      <th className="py-2.5 px-3 text-center">Sudah Dinilai</th>
                      <th className="py-2.5 px-3 text-center">Belum</th>
                      <th className="py-2.5 px-3 text-center">Progres</th>
                      <th className="py-2.5 px-3 text-center">Rata-Rata</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pjMonitoringData.map((row, idx) => (
                      <tr key={row.pj} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{row.pj}</td>
                        <td className="py-3 px-3 text-slate-500">{row.kecamatans}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">{row.total}</td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600">{row.evaluated}</td>
                        <td className="py-3 px-3 text-center font-bold text-amber-500">{row.pending}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block font-black text-[10px] px-2 py-0.5 rounded-full ${
                            row.percent === 100 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : (row.percent > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500')
                          }`}>
                            {row.percent}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-primary-600">{row.avg}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedPjFilter(row.pj);
                              setShowPjModal(false);
                              setExpandedPjs({ [row.pj]: true });
                            }}
                            className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Nilai PJ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Total <strong>{pjMonitoringData.length}</strong> PJ terdaftar
                </span>
                <button
                  onClick={() => setShowPjModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL IMPORT & COLUMN MAPPING */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-[1350] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary-600" />
                    Pemetaan Kolom Import ({importFileName})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih kolom yang sesuai dari berkas Excel Anda. Email digunakan sebagai primary key unik.
                  </p>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Template Download Quick Helper Banner */}
              <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-3 text-xs">
                <span className="text-emerald-900 font-medium truncate">
                  Belum memiliki format berkas pembaruan yang tepat?
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Template Excel</span>
                </button>
              </div>

              {/* Mapping Controls */}
              <div className="p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs">
                
                {/* 1. Kolom Email */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Kolom Email Mitra (Primary Key Unik) *
                  </label>
                  <select
                    value={columnMapping.email}
                    onChange={(e) => setColumnMapping(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-primary-500"
                  >
                    <option value="">-- Pilih Kolom Email --</option>
                    {detectedColumns.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Kolom Nama Mitra */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Kolom Nama Mitra *
                  </label>
                  <select
                    value={columnMapping.nama}
                    onChange={(e) => setColumnMapping(p => ({ ...p, nama: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:border-primary-500"
                  >
                    <option value="">-- Pilih Kolom Nama Mitra --</option>
                    {detectedColumns.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 3. Kolom Jabatan / Role */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Kolom Jabatan (PPL / PML)
                    </label>
                    <select
                      value={columnMapping.role}
                      onChange={(e) => setColumnMapping(p => ({ ...p, role: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                    >
                      <option value="">-- Gunakan Default (PPL) --</option>
                      {detectedColumns.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Kolom Nilai Kinerja */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Kolom Nilai (Opsional)
                    </label>
                    <select
                      value={columnMapping.nilai}
                      onChange={(e) => setColumnMapping(p => ({ ...p, nilai: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                    >
                      <option value="">-- Kosongkan Jika Belum Ada --</option>
                      {detectedColumns.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 5. Kolom PJ SE2026 */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Kolom PJ SE2026
                    </label>
                    <select
                      value={columnMapping.pj}
                      onChange={(e) => setColumnMapping(p => ({ ...p, pj: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                    >
                      <option value="">-- Kosongkan / Default (-) --</option>
                      {detectedColumns.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Kolom Kecamatan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Kolom Kecamatan / Wilayah
                    </label>
                    <select
                      value={columnMapping.kecamatan}
                      onChange={(e) => setColumnMapping(p => ({ ...p, kecamatan: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                    >
                      <option value="">-- Kosongkan / Default (-) --</option>
                      {detectedColumns.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 7. Kolom Catatan Kualitatif Lapangan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Kolom Catatan Kinerja Lapangan (Opsional)
                  </label>
                  <select
                    value={columnMapping.catatan}
                    onChange={(e) => setColumnMapping(p => ({ ...p, catatan: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 outline-none"
                  >
                    <option value="">-- Kosongkan Jika Tidak Ada Catatan --</option>
                    {detectedColumns.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Upsert Option Card */}
                <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="upsertCheckbox"
                      checked={upsertImport}
                      onChange={(e) => setUpsertImport(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded cursor-pointer"
                    />
                    <label htmlFor="upsertCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Sinkronisasi Database (Perbarui Data Lama + Tambah Data Baru)
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                    Data yang sudah terdaftar di database akan diperbarui nilainya & catatannya. Baris baru yang belum ada di database akan langsung ditambahkan sebagai mitra baru.
                  </p>
                </div>

                {/* Preview 3 baris awal */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-2">
                    Pratinjau 3 Baris Pertama:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-slate-200">
                          {detectedColumns.slice(0, 6).map(c => (
                            <th key={c} className="py-1 px-2 text-slate-600">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawImportData.slice(0, 3).map((r, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            {detectedColumns.slice(0, 6).map(c => (
                              <td key={c} className="py-1 px-2 text-slate-500">{String(r[c] || '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Konfirmasi & Import {rawImportData.length} Baris
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KUSTOMISASI KOLOM & UNDUH EXCEL */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-[1350] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Pilih Kolom & Unduh Data Mitra
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih cakupan data dan centang kolom yang ingin Anda masukkan ke dalam berkas Excel (.xlsx).
                  </p>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar space-y-5 text-xs">
                
                {/* 1. Cakupan Data (Scope) */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2">
                    1. Cakupan Data yang Diekspor
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportScope('all')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        exportScope === 'all'
                          ? 'bg-primary-50/70 border-primary-500 ring-2 ring-primary-500/20 text-primary-950'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">Semua Mitra</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-100 rounded-md text-slate-600">
                          {mitraList.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">Seluruh mitra PPL & PML terdaftar</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportScope('evaluated')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        exportScope === 'evaluated'
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">Sudah Dinilai</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-emerald-100 rounded-md text-emerald-700">
                          {stats.evaluated}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">Hanya mitra yang sudah memiliki nilai</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportScope('current')}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        exportScope === 'current'
                          ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 text-amber-950'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">Filter Aktif</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-amber-100 rounded-md text-amber-700">
                          {filteredMitra.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">Sesuai pencarian & filter tabel saat ini</p>
                    </button>
                  </div>
                </div>

                {/* 2. Pilihan Kolom (Checklist) */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      2. Pilih Kolom Excel ({selectedExportCols.length} dari {EXPORT_COLUMNS_CONFIG.length} terpilih)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedExportCols(EXPORT_COLUMNS_CONFIG.map(c => c.id))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExportCols(['no', 'email', 'nama', 'role', 'pj', 'kecamatan', 'nilai', 'kategori'])}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Default BPS
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExportCols(['nama', 'role', 'nilai', 'catatan'])}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Nilai & Catatan
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExportCols([])}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EXPORT_COLUMNS_CONFIG.map(col => {
                      const isChecked = selectedExportCols.includes(col.id);
                      return (
                        <div
                          key={col.id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedExportCols(prev => prev.filter(c => c !== col.id));
                            } else {
                              setSelectedExportCols(prev => [...prev, col.id]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-50/50 border-emerald-300 text-slate-900 shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                              isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="truncate">
                              <span className={`text-xs font-bold block truncate ${isChecked ? 'text-slate-800' : 'text-slate-600'}`}>
                                {col.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Header: {col.header}
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0 ml-2">
                            {col.category}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Pratinjau Urutan Kolom Terpilih */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    Urutan Kolom pada File Excel:
                  </p>
                  {selectedExportCols.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedExportCols.map((colId, i) => {
                        const colDef = EXPORT_COLUMNS_CONFIG.find(c => c.id === colId);
                        return (
                          <span 
                            key={colId}
                            className="inline-flex items-center gap-1 text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-700 shadow-2xs"
                          >
                            <span className="text-slate-400">{i + 1}.</span>
                            <span>{colDef?.header || colId}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-rose-500 italic">Belum ada kolom yang dipilih. Silakan centang minimal 1 kolom.</p>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleCustomExport}
                  disabled={selectedExportCols.length === 0}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                    selectedExportCols.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh File Excel ({selectedExportCols.length} Kolom)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL POP UP: DATA TELAH TERSIMPAN DI DATABASE */}
      <AnimatePresence>
        {saveSuccessPopup?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSaveSuccessPopup(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-md w-full p-6 sm:p-7 overflow-hidden z-10 text-center"
            >
              {/* Decorative top ambient glow */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close icon button */}
              <button
                onClick={() => setSaveSuccessPopup(null)}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Tutup Notifikasi"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Big Success Icon */}
              <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-100/70 animate-ping opacity-30" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl sm:rounded-3xl shadow-lg shadow-emerald-500/25 flex items-center justify-center text-white rotate-1 hover:rotate-0 transition-transform">
                  <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.5]" />
                </div>
              </div>

              {/* Badge */}
              {saveSuccessPopup.badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 uppercase tracking-wider mb-2.5 shadow-2xs">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{saveSuccessPopup.badge}</span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug mb-2">
                {saveSuccessPopup.title}
              </h3>

              {/* Message */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5 font-medium">
                {saveSuccessPopup.message}
              </p>

              {/* Details List */}
              {saveSuccessPopup.details && saveSuccessPopup.details.length > 0 && (
                <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70 mb-5 text-left divide-y divide-slate-100">
                  {saveSuccessPopup.details.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0 text-xs">
                      <span className="text-slate-500 font-medium">{item.label}</span>
                      <span className="text-slate-900 font-black text-right ml-2 truncate max-w-[200px]" title={item.val}>
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Action Button */}
              <button
                type="button"
                onClick={() => setSaveSuccessPopup(null)}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Oke, Mengerti</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

