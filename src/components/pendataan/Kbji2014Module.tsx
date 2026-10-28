import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  ChevronRight,
  Copy,
  Check,
  BookOpen,
  X,
  Sparkles,
  ArrowLeft,
  Loader2,
  ChevronDown,
  Layers,
  Briefcase,
  GraduationCap,
  HardHat,
  Building2,
  ShoppingBag,
  Sprout,
  Factory,
  Truck,
  Users,
  ShieldCheck,
  Info,
  ExternalLink,
  MapPin,
  CheckCircle2,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  INITIAL_KBJI_CATEGORIES,
  KBJI_LEVELS,
  KBJI_SORT_OPTIONS,
  KbjiCategory
} from './kbjiCategoriesData';

interface Kbji2014ModuleProps {
  onBack: () => void;
}

interface KbjiItem {
  kode: string;
  judul: string;
  level: 'golongan_pokok' | 'sub_golongan_pokok' | 'golongan' | 'sub_golongan' | 'jabatan';
  digit: number;
  level_label: string;
  induk: string;
  golongan_pokok_kode: string;
  breadcrumbs: Array<{
    kode: string;
    judul: string;
    level: string;
    digit: number;
  }>;
  child_count: number;
  snippet?: string;
  deskripsi?: string;
  mempawah_recommendation?: {
    badge: string;
    pekerjaan: string;
    bidang: string;
    count: number;
  } | null;
}

interface KbjiDetail extends KbjiItem {
  deskripsi: string;
  children: Array<{
    kode: string;
    judul: string;
    level: string;
    digit: number;
    level_label: string;
    deskripsi?: string;
    snippet?: string;
    child_count?: number;
  }>;
  siblings: Array<{
    kode: string;
    judul: string;
    level: string;
    digit: number;
  }>;
  mempawah_context?: {
    primary_job: string;
    bidang: string;
    count: number;
  } | null;
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  '1': Briefcase,
  '2': GraduationCap,
  '3': HardHat,
  '4': Building2,
  '5': ShoppingBag,
  '6': Sprout,
  '7': Factory,
  '8': Truck,
  '9': Users,
  '0': ShieldCheck
};

export const Kbji2014Module: React.FC<Kbji2014ModuleProps> = ({ onBack }) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('relevance');

  // Data & Results
  const [categories, setCategories] = useState<KbjiCategory[]>(INITIAL_KBJI_CATEGORIES);
  const [results, setResults] = useState<KbjiItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalJabatan, setTotalJabatan] = useState<number>(0);
  const [searchTimeMs, setSearchTimeMs] = useState<number>(0);
  const [bestRec, setBestRec] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Detail Modal
  const [selectedDetailCode, setSelectedDetailCode] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<KbjiDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Copy Feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Autocomplete Recommendations
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/kbji/recommend?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (e) {
        // Quiet fail for autocomplete
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/kbji/categories');
        if (res.ok) {
          const data = await res.json();
          // Merge with predefined style metadata
          const merged = data.map((cat: any) => {
            const initial = INITIAL_KBJI_CATEGORIES.find(c => c.code === cat.code);
            return {
              ...initial,
              ...cat
            };
          });
          setCategories(merged);
        }
      } catch (e) {
        console.warn('Using initial categories due to fetch error:', e);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Search Results
  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      setCurrentPage(1);

      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (selectedCategory && selectedCategory !== 'ALL') params.set('kategori', selectedCategory);
      if (selectedLevel && selectedLevel !== 'all') params.set('level', selectedLevel);
      if (selectedSort) params.set('sort', selectedSort);
      params.set('page', '1');
      params.set('limit', '20');

      try {
        const res = await fetch(`/api/kbji/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.items || []);
          setTotalCount(data.total || 0);
          setTotalJabatan(data.total_jabatan || 0);
          setTotalPages(data.total_pages || 1);
          setSearchTimeMs(data.time_ms || 0);
          setBestRec(data.best_recommendation || null);
        }
      } catch (e) {
        console.error('Failed to search KBJI:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedQuery, selectedCategory, selectedLevel, selectedSort]);

  // Load More Results (Infinite scrolling / append)
  const handleLoadMore = async () => {
    if (isLoadingMore || currentPage >= totalPages) return;
    setIsLoadingMore(true);

    const nextPage = currentPage + 1;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (selectedCategory && selectedCategory !== 'ALL') params.set('kategori', selectedCategory);
    if (selectedLevel && selectedLevel !== 'all') params.set('level', selectedLevel);
    if (selectedSort) params.set('sort', selectedSort);
    params.set('page', String(nextPage));
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/kbji/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(prev => [...prev, ...(data.items || [])]);
        setCurrentPage(nextPage);
      }
    } catch (e) {
      console.error('Failed to load more KBJI:', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Fetch Detail Data
  const openDetailModal = async (kode: string) => {
    setSelectedDetailCode(kode);
    setIsDetailLoading(true);
    setDetailData(null);

    try {
      const res = await fetch(`/api/kbji/detail/${encodeURIComponent(kode)}`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
        // Log telemetry
        fetch('/api/kbji/log-selection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: debouncedQuery,
            kode: data.kode,
            judul: data.judul,
            level: data.level,
            timestamp: new Date().toISOString()
          })
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to fetch KBJI detail:', e);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setSelectedDetailCode(null);
    setDetailData(null);
  };

  // Copy to clipboard helper
  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Keyboard shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'Escape') {
        if (selectedDetailCode) {
          closeDetailModal();
        } else if (showSuggestions) {
          setShowSuggestions(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDetailCode, showSuggestions]);

  // Click outside suggestions box
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsBoxRef.current &&
        !suggestionsBoxRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight matching words helper
  const highlightQuery = (text: string, query: string) => {
    if (!text || !query.trim()) return text;
    const tokens = query.trim().split(/\s+/).filter(t => t.length > 1);
    if (tokens.length === 0) return text;

    const regex = new RegExp(`(${tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 px-0.5 rounded-sm font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 mt-0.5 cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60">
                <BookOpen className="w-3.5 h-3.5 text-primary-600" />
                KBJI 2014
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                2.816 Entitas Baku
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Recommender Lapangan Mempawah
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Klasifikasi Baku Jabatan Indonesia (KBJI 2014)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Navigasi cerdas konsep, definisi, dan kode jabatan dengan metode pencarian multi-token serta rekomendasi pekerjaan lapangan Mempawah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <div className="text-right hidden lg:block">
            <span className="text-[10px] text-slate-400 block font-medium">Cakupan Klasifikasi</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              10 Gol. Pokok &bull; 2.187 Jabatan
            </span>
          </div>
        </div>
      </div>

      {/* 10 Visual Category Cards (Golongan Pokok 1-9 & 0) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              10 Golongan Pokok KBJI 2014
            </h2>
          </div>
          {selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Tampilkan Semua Kategori</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.code;
            const IconComponent = CATEGORY_ICON_MAP[cat.code] || Briefcase;

            return (
              <button
                key={cat.code}
                onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.code)}
                className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-primary-50 dark:bg-primary-950/50 border-primary-500 shadow-md ring-2 ring-primary-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 shadow-2xs hover:shadow'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black text-xs ${
                      isSelected
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cat.code}
                  </span>
                  <div className={`p-1.5 rounded-xl ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                <span className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-1 leading-tight">
                  {cat.title}
                </span>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  <span>{cat.total_jabatan || 0} Jabatan</span>
                  <span>{cat.total_sub_golongan || 0} Sub-Gol</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Search Toolbar & Quick Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Input Bar with Autocomplete Dropdown */}
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-4 pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ketik kegiatan pekerjaan, jabatan, kata kunci, atau kode KBJI (contoh: supir truk, barista, 5131, nelayan, guru)..."
              className="w-full pl-12 pr-28 py-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-inner"
            />

            <div className="absolute right-3 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsBoxRef}
              className="absolute left-0 right-0 top-full mt-2 z-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-fade-in divide-y divide-slate-100 dark:divide-slate-800"
            >
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Rekomendasi Cepat KBJI</span>
                <span className="text-[10px] text-slate-400">Klik untuk melihat detail</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.kode}-${idx}`}
                    onClick={() => {
                      setShowSuggestions(false);
                      openDetailModal(item.kode);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-primary-50/70 dark:hover:bg-primary-950/40 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg bg-primary-100 dark:bg-primary-900/60 text-primary-800 dark:text-primary-200 font-black text-xs shrink-0">
                        {item.kode}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.judul}
                      </span>
                      {item.pekerjaan && (
                        <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold shrink-0">
                          {item.pekerjaan}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {item.source}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hierarchy Level Tabs & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto scrollbar-none text-xs font-bold">
            {KBJI_LEVELS.map(lvl => {
              const active = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">{lvl.label}</span>
                  <span className="sm:hidden">{lvl.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Sort & Quick Select */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-400 hidden md:inline">Urutkan:</span>
            <select
              value={selectedSort}
              onChange={e => setSelectedSort(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              {KBJI_SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mempawah Empirical Best Match Banner (if query triggered rule) */}
      {bestRec && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  Rekomendasi Lapangan Mempawah
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Kesesuaian Kata Kunci: &ldquo;{bestRec.pattern}&rdquo;
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                {bestRec.pekerjaan} &bull; Kode KBJI: [{bestRec.kbji}] {bestRec.job_title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Bidang Usaha: <strong>{bestRec.bidang}</strong> &bull; Sering tercatat pada survei lapangan BPS Kabupaten Mempawah.
              </p>
            </div>
          </div>

          <button
            onClick={() => openDetailModal(bestRec.kbji)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Lihat Konsep & Rincian
          </button>
        </div>
      )}

      {/* Results Header Info */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400 font-bold">
        <div className="flex items-center gap-2">
          <span>
            Ditemukan <strong>{totalCount}</strong> entitas KBJI
            {totalJabatan > 0 && <span> (termasuk <strong>{totalJabatan}</strong> jabatan spesifik)</span>}
          </span>
          {searchTimeMs > 0 && (
            <span className="hidden sm:inline text-slate-400 font-normal">
              &bull; Pencarian dalam {searchTimeMs} ms
            </span>
          )}
        </div>

        {debouncedQuery && (
          <span className="text-slate-400">
            Kata kunci: &ldquo;<strong className="text-slate-700 dark:text-slate-300">{debouncedQuery}</strong>&rdquo;
          </span>
        )}
      </div>

      {/* Results List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500">Mencari entitas dan konsep jabatan...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
            Tidak ada entitas KBJI yang cocok
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Coba gunakan istilah pekerjaan yang lebih umum, sinonim kegiatan, atau periksa kembali filter kategori/level yang aktif.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedLevel('all');
              }}
              className="px-4 py-2 bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-xs font-bold rounded-xl hover:bg-primary-100 transition-colors cursor-pointer"
            >
              Reset Filter Pencarian
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(item => {
            const isJabatan = item.level === 'jabatan';
            const isSubGol = item.level === 'sub_golongan';

            return (
              <div
                key={item.kode}
                onClick={() => openDetailModal(item.kode)}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 shadow-2xs hover:shadow transition-all group cursor-pointer relative"
              >
                {/* Top Meta Bar: Code, Level, & Copy Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Code Badge with click to copy */}
                    <button
                      type="button"
                      onClick={e => handleCopyCode(item.kode, e)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer ${
                        copiedCode === item.kode
                          ? 'bg-emerald-600 text-white'
                          : isJabatan
                          ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/80 hover:bg-primary-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                      title="Salin kode KBJI"
                    >
                      <span>{item.kode}</span>
                      {copiedCode === item.kode ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 group-hover:text-primary-600 transition-colors" />
                      )}
                    </button>

                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        isJabatan
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : isSubGol
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.level_label}
                    </span>

                    {/* Mempawah Field Survey Recommendation Badge */}
                    {item.mempawah_recommendation && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Mempawah: {item.mempawah_recommendation.pekerjaan}</span>
                      </span>
                    )}
                  </div>

                  {item.child_count > 0 && (
                    <span className="text-[11px] font-bold text-slate-400">
                      {item.child_count} Sub-Jabatan
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                  {highlightQuery(item.judul, debouncedQuery)}
                </h3>

                {/* Breadcrumbs Path */}
                {item.breadcrumbs && item.breadcrumbs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                    {item.breadcrumbs.map((bc, bidx) => (
                      <React.Fragment key={bc.kode}>
                        {bidx > 0 && <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />}
                        <span className="truncate max-w-xs">{bc.kode} - {bc.judul}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Concept Snippet */}
                {item.snippet && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {highlightQuery(item.snippet, debouncedQuery)}
                  </p>
                )}

                {/* Card Action Hint */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 group-hover:underline flex items-center gap-1">
                    <span>Lihat Uraian Tugas & Konsep Lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>

                  <span className="text-[10px] text-slate-400 font-medium">
                    Golongan Pokok {item.golongan_pokok_kode}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {currentPage < totalPages && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 text-slate-700 dark:text-slate-200 text-xs font-black rounded-2xl shadow-xs hover:shadow transition-all cursor-pointer inline-flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600" />
                    <span>Memuat entitas berikutnya...</span>
                  </>
                ) : (
                  <>
                    <span>Muat 20 Hasil Berikutnya</span>
                    <span className="text-slate-400">({results.length} dari {totalCount})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL DIALOG */}
      {selectedDetailCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-primary-600 text-white font-black text-sm tracking-wider shadow-2xs">
                    {selectedDetailCode}
                  </span>
                  {detailData && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60 uppercase">
                      {detailData.level_label}
                    </span>
                  )}
                  {detailData?.mempawah_context && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Rekomendasi Lapangan Mempawah
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {detailData ? detailData.judul : 'Memuat data jabatan...'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetailModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300">
              {isDetailLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-400">Mengambil konsep dan hierarki KBJI...</p>
                </div>
              ) : detailData ? (
                <>
                  {/* Breadcrumb Hierarchy Trail */}
                  {detailData.breadcrumbs && detailData.breadcrumbs.length > 0 && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Jalur Hierarki Klasifikasi:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                        {detailData.breadcrumbs.map((bc, bidx) => (
                          <React.Fragment key={bc.kode}>
                            {bidx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />}
                            <button
                              type="button"
                              onClick={() => openDetailModal(bc.kode)}
                              className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                            >
                              [{bc.kode}] {bc.judul}
                            </button>
                          </React.Fragment>
                        ))}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                        <span className="font-black text-slate-900 dark:text-slate-100">
                          [{detailData.kode}] {detailData.judul}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mempawah Local Context Card (if available) */}
                  {detailData.mempawah_context && (
                    <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-black text-xs">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>Konteks Lapangan Kabupaten Mempawah:</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        Kegiatan Pekerjaan: <strong>{detailData.mempawah_context.primary_job}</strong> &bull; Bidang Usaha: <strong>{detailData.mempawah_context.bidang}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Entitas ini teridentifikasi sebagai salah satu jabatan paling sering dilaporkan pada sensus & survei BPS Mempawah.
                      </p>
                    </div>
                  )}

                  {/* Concept & Definition */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary-600" />
                      <span>Uraian Tugas Pokok, Fungsi & Konsep:</span>
                    </h3>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm leading-relaxed font-normal whitespace-pre-line text-slate-700 dark:text-slate-300">
                      {detailData.deskripsi || 'Tidak ada deskripsi rinci untuk entitas ini.'}
                    </div>
                  </div>

                  {/* Children / Sub-Jabatan */}
                  {detailData.children && detailData.children.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Rincian Sub-Jabatan Spesifik ({detailData.children.length}):</span>
                        <span className="text-[10px] text-slate-400 font-normal">Klik untuk membuka</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {detailData.children.map(child => (
                          <button
                            key={child.kode}
                            type="button"
                            onClick={() => openDetailModal(child.kode)}
                            className="p-3 bg-white dark:bg-slate-800/80 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                {child.kode}
                              </span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 transition-colors line-clamp-1">
                                {child.judul}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Siblings Under Same Parent */}
                  {detailData.siblings && detailData.siblings.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Jabatan Selevel Lainnya:
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {detailData.siblings.map(sib => (
                          <button
                            key={sib.kode}
                            type="button"
                            onClick={() => openDetailModal(sib.kode)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            [{sib.kode}] {sib.judul}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopyCode(selectedDetailCode)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  copiedCode === selectedDetailCode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                {copiedCode === selectedDetailCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Kode Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode [{selectedDetailCode}]</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={closeDetailModal}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

