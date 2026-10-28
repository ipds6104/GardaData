import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  ChevronRight,
  Copy,
  Check,
  LayoutGrid,
  BookOpen,
  X,
  History,
  TrendingUp,
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
  MapPin,
  CheckCircle2,
  HelpCircle,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../lib/auth';
import {
  HeroBannerIllustration,
  SpeechQuestionIllustration,
  BookGearIllustration
} from './KbjiIllustrations';
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

interface KbjiDetailNode extends KbjiItem {
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

// Map 10 Golongan Pokok to Lucide Icons
const CATEGORY_ICONS: Record<string, React.ElementType> = {
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

// KBJI 2014 Signature Pastel Palettes (selang-seling bar bertingkat)
const KBJI_PASTEL_PALETTES = [
  { bg: 'bg-[#C5C2FC]', border: 'border-indigo-200/80', text: 'text-[#1E1B4B]', badge: 'bg-white/90 text-[#1E1B4B]', iconColor: 'text-[#4338CA]', hex: '#C5C2FC' },
  { bg: 'bg-[#FFAF65]', border: 'border-amber-200/80', text: 'text-[#431407]', badge: 'bg-white/90 text-[#431407]', iconColor: 'text-[#C2410C]', hex: '#FFAF65' },
  { bg: 'bg-[#FF82BE]', border: 'border-pink-200/80', text: 'text-[#4A044E]', badge: 'bg-white/90 text-[#4A044E]', iconColor: 'text-[#BE185D]', hex: '#FF82BE' },
  { bg: 'bg-[#B9F5D0]', border: 'border-emerald-200/80', text: 'text-[#064E3B]', badge: 'bg-white/90 text-[#064E3B]', iconColor: 'text-[#15803D]', hex: '#B9F5D0' },
  { bg: 'bg-[#A5D8FF]', border: 'border-sky-200/80', text: 'text-[#0C4A6E]', badge: 'bg-white/90 text-[#0C4A6E]', iconColor: 'text-[#0284C7]', hex: '#A5D8FF' },
  { bg: 'bg-[#E9D5FF]', border: 'border-purple-200/80', text: 'text-[#3B0764]', badge: 'bg-white/90 text-[#3B0764]', iconColor: 'text-[#7E22CE]', hex: '#E9D5FF' },
  { bg: 'bg-[#FED7AA]', border: 'border-orange-200/80', text: 'text-[#431407]', badge: 'bg-white/90 text-[#431407]', iconColor: 'text-[#EA580C]', hex: '#FED7AA' },
  { bg: 'bg-[#CFFAFE]', border: 'border-cyan-200/80', text: 'text-[#164E63]', badge: 'bg-white/90 text-[#164E63]', iconColor: 'text-[#0E7490]', hex: '#CFFAFE' },
  { bg: 'bg-[#DDD6FE]', border: 'border-violet-200/80', text: 'text-[#2E1065]', badge: 'bg-white/90 text-[#2E1065]', iconColor: 'text-[#6D28D9]', hex: '#DDD6FE' },
  { bg: 'bg-[#E2E8F0]', border: 'border-slate-300/80', text: 'text-[#0F172A]', badge: 'bg-white/90 text-[#0F172A]', iconColor: 'text-[#334155]', hex: '#E2E8F0' },
];

const LEVEL_NAMES: Record<string, string> = {
  golongan_pokok: 'Golongan Pokok (1 Digit)',
  sub_golongan_pokok: 'Sub-Golongan Pokok (2 Digit)',
  golongan: 'Golongan (3 Digit)',
  sub_golongan: 'Sub-Golongan (4 Digit)',
  jabatan: 'Jabatan Spesifik (5 Digit)'
};

const LEVEL_BADGE_STYLES: Record<string, string> = {
  golongan_pokok: 'bg-[#E9D5FF] text-[#3B0764] border-purple-200',
  sub_golongan_pokok: 'bg-[#C5C2FC] text-[#1E1B4B] border-indigo-200',
  golongan: 'bg-[#A5D8FF] text-[#0C4A6E] border-sky-200',
  sub_golongan: 'bg-[#FFAF65] text-[#431407] border-orange-200',
  jabatan: 'bg-[#FF82BE] text-[#4A044E] border-pink-200'
};

const TRENDING_SEARCHES_KBJI = [
  { keyword: 'Pramusaji', tag: '5131', desc: 'Pelayan kafe & resto' },
  { keyword: 'Petani Kelapa Sawit', tag: '6112', desc: 'Perkebunan kelapa sawit' },
  { keyword: 'Supir Truk', tag: '8332', desc: 'Angkutan barang' },
  { keyword: 'Petani Padi', tag: '6111', desc: 'Tanaman pangan' },
  { keyword: 'Nelayan Tangkap', tag: '6222', desc: 'Penangkapan ikan laut' },
  { keyword: 'Pedagang Kelontong', tag: '5221', desc: 'Toko eceran & sembako' },
  { keyword: 'Tukang Jahit', tag: '7531', desc: 'Pakaian jadi / konveksi' },
  { keyword: 'Montir Bengkel', tag: '7231', desc: 'Mekanik motor & mobil' },
  { keyword: 'Buruh Bangunan', tag: '9313', desc: 'Pekerja konstruksi' },
  { keyword: 'Guru SD', tag: '2341', desc: 'Pendidikan dasar' },
  { keyword: 'Kasir Minimarket', tag: '5230', desc: 'Petugas kasir' },
  { keyword: 'Satpam / Security', tag: '5414', desc: 'Petugas keamanan' }
];

// Parser definition for structured rendering of duties & exclusions
interface ParsedBlock {
  type: 'paragraph' | 'list';
  header?: string;
  items?: string[];
  text?: string;
}

const parseKbjiDefinition = (desc: string = ''): { mainBlocks: ParsedBlock[]; exclusionBlocks: ParsedBlock[] } => {
  if (!desc) return { mainBlocks: [], exclusionBlocks: [] };

  const exclusionRegex = /(?:dikecualikan\s+dari\s+(?:golongan\s+pokok|golongan|subgolongan|sub-golongan)\s+ini|beberapa\s+pekerjaan\s+terkait\s+diklasifikasikan\s+di\s+tempat\s+lain)[^:]*:\s*/i;
  const parts = desc.split(exclusionRegex);

  const mainPart = parts[0] || '';
  const exclusionPart = parts[1] || '';

  const parseTextToBlocks = (text: string): ParsedBlock[] => {
    const blocks: ParsedBlock[] = [];
    if (!text.trim()) return blocks;

    // Check for "Tugasnya meliputi :" or "Tugas pokoknya mencakup :" or list pattern
    const listHeaderRegex = /(?:tugas(?:nya)?\s+(?:pokoknya\s+)?(?:meliputi|mencakup)|tugas-tugas\s+pokoknya\s+mencakup)\s*:\s*/i;
    const listSplit = text.split(listHeaderRegex);

    if (listSplit.length > 1) {
      if (listSplit[0].trim()) {
        blocks.push({ type: 'paragraph', text: listSplit[0].trim() });
      }

      const listContent = listSplit[1].trim();
      // Split items by semicolon, dash, or bullet
      const rawItems = listContent.split(/(?:;|\n\s*-\s*|\s*-\s+)/).map(i => i.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
      if (rawItems.length > 0) {
        blocks.push({
          type: 'list',
          header: 'Tugas Pokok & Fungsi Meliputi:',
          items: rawItems
        });
      }
    } else {
      // Split paragraphs
      const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      paragraphs.forEach(p => {
        blocks.push({ type: 'paragraph', text: p });
      });
    }

    return blocks;
  };

  const exclusionBlocks: ParsedBlock[] = [];
  if (exclusionPart.trim()) {
    const rawItems = exclusionPart.split(/(?:;|\n\s*-\s*|\s*-\s+)/).map(i => i.trim().replace(/^[-•]\s*/, '')).filter(Boolean);
    if (rawItems.length > 0) {
      exclusionBlocks.push({
        type: 'list',
        header: 'Dikecualikan dari Klasifikasi Ini:',
        items: rawItems
      });
    }
  }

  return {
    mainBlocks: parseTextToBlocks(mainPart),
    exclusionBlocks
  };
};

export const Kbji2014Module: React.FC<Kbji2014ModuleProps> = ({ onBack }) => {
  const { user } = useAuth();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'jabatan' | 'mempawah' | 'guide'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('relevance');

  // Search Input UI State
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('kbji_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Categories & Preview State
  const [categories, setCategories] = useState<KbjiCategory[]>(INITIAL_KBJI_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [previewCategoryCode, setPreviewCategoryCode] = useState<string>('5');

  // Active Drill-Down Node (VIEW 2 - seperti KBLI 2025)
  const [currentNode, setCurrentNode] = useState<KbjiDetailNode | null>(null);
  const [loadingNode, setLoadingNode] = useState<boolean>(false);

  // Search Results State (VIEW 1 - seperti KBLI 2025)
  const [results, setResults] = useState<KbjiItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalJabatan, setTotalJabatan] = useState<number>(0);
  const [searchTimeMs, setSearchTimeMs] = useState<number>(0);
  const [bestRec, setBestRec] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Guide Modal
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Greeting helper
  const getGreeting = (fullName?: string) => {
    const hour = new Date().getHours();
    let timeGreeting = 'Selamat pagi';
    if (hour >= 11 && hour < 15) {
      timeGreeting = 'Selamat siang';
    } else if (hour >= 15 && hour < 18) {
      timeGreeting = 'Selamat sore';
    } else if (hour >= 18 || hour < 4) {
      timeGreeting = 'Selamat malam';
    }
    const firstName = fullName ? fullName.split(' ')[0] : 'Sobat Data';
    return `${timeGreeting}, ${firstName}`;
  };

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Record Search History
  const recordRecentSearch = (kw: string) => {
    if (!kw || kw.trim().length < 2) return;
    const clean = kw.trim();
    setRecentSearches(prev => {
      const next = [clean, ...prev.filter(x => x.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem('kbji_recent_searches', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const next = prev.filter(x => x !== item);
      try {
        localStorage.setItem('kbji_recent_searches', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Close Search Dropdown on Click Outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Categories from Backend
  useEffect(() => {
    const fetchCats = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch('/api/kbji/categories');
        if (res.ok) {
          const data = await res.json();
          const merged = INITIAL_KBJI_CATEGORIES.map(initCat => {
            const apiCat = data.find((c: any) => c.code === initCat.code);
            return apiCat ? { ...initCat, ...apiCat } : initCat;
          });
          setCategories(merged);
        }
      } catch (err) {
        console.warn('Using initial KBJI categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

  // Execute Search (VIEW 1)
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setTotalCount(0);
      setBestRec(null);
      return;
    }

    recordRecentSearch(debouncedQuery);
    setIsSearching(true);
    setCurrentPage(1);

    const params = new URLSearchParams();
    params.set('q', debouncedQuery);
    if (selectedCategory && selectedCategory !== 'ALL') params.set('kategori', selectedCategory);
    if (selectedLevel && selectedLevel !== 'all') params.set('level', selectedLevel);
    if (selectedSort) params.set('sort', selectedSort);
    params.set('page', '1');
    params.set('limit', '20');

    const exec = async () => {
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
        setIsSearching(false);
      }
    };
    exec();
  }, [debouncedQuery, selectedCategory, selectedLevel, selectedSort]);

  // Load More Search Results
  const handleLoadMore = async () => {
    if (isLoadingMore || currentPage >= totalPages) return;
    setIsLoadingMore(true);

    const nextPage = currentPage + 1;
    const params = new URLSearchParams();
    params.set('q', debouncedQuery);
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
      console.error('Failed to load more:', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Drill-Down to Detail Node (VIEW 2)
  const handleSelectCode = async (kode: string) => {
    setLoadingNode(true);
    try {
      const res = await fetch(`/api/kbji/detail/${encodeURIComponent(kode)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentNode(data);
        // Clear search input so drill-down view renders prominently
        setSearchQuery('');
        setDebouncedQuery('');
        setIsSearchFocused(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to fetch KBJI node detail:', err);
    } finally {
      setLoadingNode(false);
    }
  };

  const handleBackToAllCategories = () => {
    setCurrentNode(null);
    setSearchQuery('');
    setDebouncedQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackOneLevel = () => {
    if (!currentNode || !currentNode.breadcrumbs || currentNode.breadcrumbs.length <= 1) {
      handleBackToAllCategories();
      return;
    }
    const parentIndex = currentNode.breadcrumbs.length - 2;
    const parentNode = currentNode.breadcrumbs[parentIndex];
    if (parentNode) {
      handleSelectCode(parentNode.kode);
    } else {
      handleBackToAllCategories();
    }
  };

  // Copy code helper
  const handleCopy = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setIsGuideOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Highlight matching query words
  const highlightQuery = (text: string, query: string) => {
    if (!text || !query.trim()) return text;
    const tokens = query.trim().split(/\s+/).filter(t => t.length > 1);
    if (tokens.length === 0) return text;

    const regex = new RegExp(`(${tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-[#FED7AA] text-[#431407] px-0.5 rounded-sm font-black">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Parse definition for currently active node
  const parsedDefinition = useMemo(() => {
    if (!currentNode?.deskripsi) return { mainBlocks: [], exclusionBlocks: [] };
    return parseKbjiDefinition(currentNode.deskripsi);
  }, [currentNode]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 space-y-6 font-sans pb-20 animate-fade-in">
      {/* ========================================================= */}
      {/* HEADER TOOLBAR & GOOGLE-STYLE PILL SEARCH BAR (PERSIS KBLI 2025) */}
      {/* ========================================================= */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 relative z-30">
        {/* Back button & Navigation buttons (Persis KBLI 2025) */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              if (currentNode) {
                handleBackOneLevel();
              } else {
                onBack();
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            title={currentNode ? "Kembali ke tingkat sebelumnya" : "Kembali ke menu Garda Data"}
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>{currentNode ? "Tingkat Sebelumnya" : "Kembali"}</span>
          </button>

          {currentNode && (
            <button
              type="button"
              onClick={handleBackToAllCategories}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              title="Kembali ke semua 10 golongan pokok"
            >
              <LayoutGrid className="w-4 h-4 text-slate-500" />
              <span>Semua Golongan Pokok</span>
            </button>
          )}
        </div>

        {/* Centered Pill Search Bar with Google-style Trending Dropdown (Persis KBLI 2025: sm:max-w-3xl, Pink Search Circle & Filter Tags) */}
        <div className="relative w-full sm:flex-1 sm:max-w-3xl" ref={searchDropdownRef}>
          <div className="w-full flex items-center bg-white/95 dark:bg-slate-900/95 rounded-full border border-slate-200/90 dark:border-slate-800 p-1.5 pl-2 pr-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
            {/* Pink Search Circle Icon Button (Persis KBLI 2025) */}
            <div className="w-9 h-9 rounded-full bg-[#FCE7F3] dark:bg-pink-950/60 text-[#DB2777] dark:text-pink-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Search className="w-4 h-4" />
            </div>

            {/* Input text */}
            <input
              id="kbji-search-input"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  recordRecentSearch(searchQuery);
                  setIsSearchFocused(false);
                }
              }}
              placeholder="Cari kode (misal: 5131), nama jabatan, atau tugas pokok..."
              className="w-full bg-transparent pl-3 pr-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  setResults([]);
                  searchInputRef.current?.focus();
                }}
                className="p-1 mr-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Bersihkan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Filter Pills Tag (In: Semua | 5-Digit | Mempawah | Panduan - Persis KBLI 2025) */}
            <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 shrink-0 select-none">
              <span className="text-slate-400">In:</span>
              <button
                type="button"
                onClick={() => {
                  setFilterTag('all');
                  setSelectedLevel('all');
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  filterTag === 'all'
                    ? 'bg-[#1E1B4B] text-white shadow-2xs'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterTag('jabatan');
                  setSelectedLevel('jabatan');
                }}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  filterTag === 'jabatan'
                    ? 'bg-[#1E1B4B] text-white shadow-2xs'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                5-Digit
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterTag('mempawah');
                  setSearchQuery('kafe');
                }}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  filterTag === 'mempawah'
                    ? 'bg-[#1E1B4B] text-white shadow-2xs'
                    : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Mempawah
              </button>
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title="Buka panduan & aturan KBJI"
              >
                Panduan
              </button>
            </div>
          </div>

            {/* Trending & Recent Searches Dropdown (Google Style - persis KBLI 2025) */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 z-50 space-y-3.5"
                >
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && !searchQuery && (
                    <div className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <History className="w-3.5 h-3.5" />
                          <span>Pencarian Terakhir</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {recentSearches.map(rec => (
                          <button
                            key={rec}
                            type="button"
                            onClick={() => {
                              setSearchQuery(rec);
                              setIsSearchFocused(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer group"
                          >
                            <History className="w-3 h-3 text-slate-400" />
                            <span>{rec}</span>
                            <span
                              onClick={e => removeRecentSearch(e, rec)}
                              className="ml-0.5 hover:text-rose-600 text-slate-400 p-0.5"
                              title="Hapus riwayat"
                            >
                              <X className="w-2.5 h-2.5" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Searches Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#1E1B4B] dark:text-indigo-400">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span>Trending Pencarian KBJI 2014 Lapangan</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Paling Sering Dicari</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {TRENDING_SEARCHES_KBJI.map((trend, idx) => (
                        <button
                          key={trend.keyword}
                          type="button"
                          onClick={() => {
                            setSearchQuery(trend.keyword);
                            setIsSearchFocused(false);
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#C5C2FC]/20 transition-colors text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              idx < 3 ? 'bg-[#FFAF65] text-[#431407]' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 truncate">
                              {trend.keyword}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-[#C5C2FC] group-hover:text-[#1E1B4B] shrink-0">
                            {trend.tag}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

      {/* ========================================================= */}
      {/* TIGA TAMPILAN (VIEWS) PERSIS ARSITEKTUR KBLI 2025:        */}
      {/* VIEW 1: HASIL PENCARIAN (Saat searchQuery terisi)         */}
      {/* VIEW 2: DETAIL KLASIFIKASI & DAFTAR TURUNAN (currentNode) */}
      {/* VIEW 3: BERANDA KBJI DUA KOLOM DENGAN PALET WARNA KBJI   */}
      {/* ========================================================= */}
      {debouncedQuery ? (
        /* ========================================================= */
        /* VIEW 1: SEARCH RESULTS                                    */
        /* ========================================================= */
        <div className="space-y-5">
          {/* Mempawah Empirical AI Recommender Card (Persis SE2026 Card di KBLI 2025) */}
          {bestRec && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-r from-[#C5C2FC] via-[#D4D1FB] to-[#FF82BE]/40 text-[#1E1B4B] shadow-sm border border-indigo-200/80 relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#1E1B4B] shadow-2xs shrink-0">
                    <Sparkles className="w-6 h-6 text-indigo-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#181829] text-white">
                        Rekomendasi Lapangan Mempawah
                      </span>
                      <span className="text-xs font-bold text-[#1E1B4B]/80">
                        Pencocokan: &ldquo;{bestRec.pattern}&rdquo;
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-[#1E1B4B] mt-1 leading-snug">
                      [{bestRec.kbji}] {bestRec.job_title}
                    </h3>

                    <p className="text-xs text-[#1E1B4B]/80 mt-0.5">
                      Pekerjaan Survei: <strong>{bestRec.pekerjaan}</strong> &bull; Sektor/Bidang: <strong>{bestRec.bidang}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectCode(bestRec.kbji)}
                  className="px-5 py-2.5 rounded-full bg-[#181829] text-white text-xs font-black hover:bg-black transition-all shadow-xs shrink-0 self-start md:self-auto cursor-pointer"
                >
                  Buka Rincian Tugas [{bestRec.kbji}]
                </button>
              </div>
            </motion.div>
          )}

          {/* Results Counter & Level Tabs Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Ditemukan <strong className="text-slate-900 dark:text-white">{totalCount}</strong> entitas KBJI
              {totalJabatan > 0 && <span> (termasuk <strong>{totalJabatan}</strong> jabatan spesifik)</span>}
              {searchTimeMs > 0 && <span className="text-slate-400 font-normal"> dalam {searchTimeMs} ms</span>}
            </div>

            {/* Level Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
              {KBJI_LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    selectedLevel === lvl.id
                      ? 'bg-[#181829] text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Result Items List */}
          {isSearching ? (
            <div className="py-24 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-500">Mencari entitas jabatan KBJI 2014...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
                Tidak ada entitas yang cocok dengan &ldquo;{debouncedQuery}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba gunakan istilah kata kunci lain atau periksa filter level yang dipilih.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(item => {
                const isJabatan = item.level === 'jabatan';

                return (
                  <motion.article
                    key={item.kode}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectCode(item.kode)}
                    className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Kode Badge */}
                        <button
                          type="button"
                          onClick={e => handleCopy(item.kode, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider transition-all cursor-pointer ${
                            copiedCode === item.kode
                              ? 'bg-emerald-600 text-white'
                              : isJabatan
                              ? 'bg-[#C5C2FC] text-[#1E1B4B] hover:bg-[#b0adfa]'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200'
                          }`}
                          title="Salin kode KBJI"
                        >
                          <span>{item.kode}</span>
                          {copiedCode === item.kode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />}
                        </button>

                        {/* Level Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${LEVEL_BADGE_STYLES[item.level] || 'bg-slate-100 text-slate-700'}`}>
                          {LEVEL_NAMES[item.level] || item.level}
                        </span>

                        {/* Mempawah Survey Badge */}
                        {item.mempawah_recommendation && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FED7AA] text-[#431407]">
                            <Sparkles className="w-3 h-3 text-[#C2410C]" />
                            <span>Mempawah: {item.mempawah_recommendation.pekerjaan}</span>
                          </span>
                        )}
                      </div>

                      {item.child_count > 0 && (
                        <span className="text-[11px] font-bold text-slate-400">
                          {item.child_count} turunan klasifikasi
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors leading-snug">
                      {highlightQuery(item.judul, debouncedQuery)}
                    </h3>

                    {/* Breadcrumbs */}
                    {item.breadcrumbs && item.breadcrumbs.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400 font-medium">
                        {item.breadcrumbs.map((bc, bidx) => (
                          <React.Fragment key={bc.kode}>
                            {bidx > 0 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
                            <span>{bc.kode} - {bc.judul}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* Snippet */}
                    {item.snippet && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {highlightQuery(item.snippet, debouncedQuery)}
                      </p>
                    )}

                    {/* Bottom Action */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                        <span>Lihat Definisi &amp; Turunan</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        Golongan Pokok {item.golongan_pokok_kode}
                      </span>
                    </div>
                  </motion.article>
                );
              })}

              {/* Load More Button */}
              {currentPage < totalPages && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-800 dark:text-slate-200 text-xs font-black shadow-xs hover:shadow transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>Memuat berikutnya...</span>
                      </>
                    ) : (
                      <>
                        <span>Muat Lebih Banyak ({results.length} dari {totalCount})</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : loadingNode ? (
        <div className="min-h-[280px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <span className="text-xs font-semibold text-slate-500">Memuat rincian jabatan dari server...</span>
        </div>
      ) : currentNode ? (
        /* ========================================================= */
        /* VIEW 2: DETAIL KLASIFIKASI & DAFTAR TURUNAN (DRILL-DOWN)  */
        /* ========================================================= */
        <section className="space-y-6">
          {/* Breadcrumb Navigation Bar (Persis KBLI 2025) */}
          <nav className="flex items-center flex-wrap gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs text-xs">
            <button
              onClick={handleBackToAllCategories}
              className="font-extrabold px-3 py-1.5 rounded-full bg-[#181829] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Semua Golongan Pokok</span>
            </button>

            {currentNode.breadcrumbs && currentNode.breadcrumbs.map((crumb, idx) => {
              const isLast = idx === currentNode.breadcrumbs.length - 1;
              const levelColorClass = LEVEL_BADGE_STYLES[crumb.level] || 'bg-slate-100 text-slate-700';

              return (
                <React.Fragment key={crumb.kode}>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <button
                    disabled={isLast}
                    onClick={() => handleSelectCode(crumb.kode)}
                    title={crumb.judul}
                    className={`transition-all px-3 py-1.5 rounded-full border text-xs font-extrabold ${
                      isLast
                        ? 'bg-[#181829] text-white border-[#181829] shadow-xs'
                        : `hover:scale-105 cursor-pointer shadow-xs ${levelColorClass}`
                    }`}
                  >
                    {crumb.level === 'golongan_pokok' ? `Gol. Pokok ${crumb.kode}` : crumb.kode}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* ACTIVE NODE HERO CARD (Persis KBLI 2025 dengan Pastel Palet KBJI) */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#C5C2FC] text-[#1E1B4B] flex items-center justify-center shrink-0 shadow-2xs">
                  {(() => {
                    const IconComp = CATEGORY_ICONS[currentNode.golongan_pokok_kode] || Briefcase;
                    return <IconComp className="w-7 h-7 text-[#1E1B4B]" />;
                  })()}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm px-3 py-1 rounded-full bg-[#181829] text-white">
                      {currentNode.kode}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${LEVEL_BADGE_STYLES[currentNode.level] || 'bg-indigo-100 text-indigo-800'}`}>
                      {LEVEL_NAMES[currentNode.level] || currentNode.level}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Golongan Pokok {currentNode.golongan_pokok_kode}
                    </span>
                    {currentNode.mempawah_context && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FED7AA] text-[#431407]">
                        <Sparkles className="w-3 h-3 text-[#C2410C]" />
                        <span>Mempawah: {currentNode.mempawah_context.primary_job}</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                    {currentNode.judul}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(currentNode.kode)}
                className="px-4 py-2.5 rounded-full text-xs font-extrabold bg-[#F4F5FA] dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 self-start shrink-0 cursor-pointer"
              >
                {copiedCode === currentNode.kode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
            </div>

            {/* Deskripsi & Konsep Definisi */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
                {parsedDefinition.mainBlocks.length > 0 ? (
                  parsedDefinition.mainBlocks.map((block, bIdx) =>
                    block.type === 'paragraph' ? (
                      <p key={bIdx} className="leading-relaxed">
                        {block.text}
                      </p>
                    ) : (
                      <div key={bIdx} className="space-y-2">
                        {block.header && (
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            <span>{block.header}</span>
                          </div>
                        )}
                        <ul className="space-y-1.5 pl-2">
                          {block.items?.map((li, lIdx) => (
                            <li key={lIdx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{li}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )
                ) : (
                  <p className="leading-relaxed">{currentNode.deskripsi}</p>
                )}

                {/* Exclusions Block (jika ada) */}
                {parsedDefinition.exclusionBlocks.map((exBlock, exIdx) => (
                  <div key={exIdx} className="p-4 rounded-2xl bg-[#FFE4E6] dark:bg-rose-950/40 border border-rose-200 text-rose-950 dark:text-rose-200 space-y-2 mt-3">
                    <span className="font-bold text-xs uppercase tracking-wide block">
                      {exBlock.header}
                    </span>
                    <ul className="space-y-1 pl-1 text-xs">
                      {exBlock.items?.map((it, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TURUNAN KLASIFIKASI LANGSUNG (CHILDREN) */}
          {currentNode.children && currentNode.children.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Turunan Klasifikasi Langsung ({currentNode.children.length})
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  Klik untuk melihat rincian
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {currentNode.children.map(child => (
                  <div
                    key={child.kode}
                    onClick={() => handleSelectCode(child.kode)}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-[#181829] text-white">
                          {child.kode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${LEVEL_BADGE_STYLES[child.level] || 'bg-slate-100 text-slate-700'}`}>
                          {LEVEL_NAMES[child.level] || child.level}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                        {child.judul}
                      </h4>
                      {child.snippet && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {child.snippet}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline shrink-0">
                      <span>Rincian</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIBLINGS SELEVEL */}
          {currentNode.siblings && currentNode.siblings.length > 0 && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Jabatan Selevel Lainnya dalam Sub-Golongan Ini:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentNode.siblings.map(sib => (
                  <button
                    key={sib.kode}
                    type="button"
                    onClick={() => handleSelectCode(sib.kode)}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#C5C2FC] hover:text-[#1E1B4B] text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    [{sib.kode}] {sib.judul}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        /* ========================================================= */
        /* VIEW 3: BERANDA KBJI 2014 (STRUKTUR PERSIS KBLI 2025       */
        /* DENGAN PALET WARNA PASTEL KBJI 2014)                      */
        /* ========================================================= */
        <div className="space-y-6 flex flex-col">
          {/* GREETING HEADLINE & SUBTITLE (Persis KBLI 2025) */}
          <div className="order-1 pt-2 pb-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#191614] dark:text-white tracking-tight">
                {getGreeting(user?.name)}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
                Klasifikasi Baku Jabatan Indonesia 2014. Telusuri 10 golongan pokok resmi BPS, 446 sub-golongan, dan 2.187 jenis jabatan terintegrasi rekomendasi lapangan Kabupaten Mempawah.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors self-start md:self-end shrink-0 cursor-pointer"
            >
              <span>Buka Panduan &amp; Aturan</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* HERO BANNER PASTEL LAVENDER (PERSIS GAMBAR REFERENSI DESAIN KBJI 2014) */}
          <div className="order-2 p-6 sm:p-7 rounded-[28px] bg-[#C5C2FC] text-[#1E1B4B] shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3.5 max-w-xl z-10">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E1B4B] leading-tight">
                Butuh referensi resmi klasifikasi jabatan untuk kegiatan survei atau sensus?
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#1E1B4B]/80 leading-relaxed">
                Telusuri 10 golongan pokok berstandar ISCO-08, 446 sub-golongan, 2.187 jenis jabatan spesifik, serta rekomendasi empiris lapangan BPS Kabupaten Mempawah.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    searchInputRef.current?.focus();
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#181829] hover:bg-black text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Mulai Pencarian Jabatan
                </button>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-white/70 hover:bg-white text-[#1E1B4B] text-xs font-bold transition-all border border-[#1E1B4B]/20 cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Panduan &amp; Aturan</span>
                </button>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center z-10">
              <HeroBannerIllustration className="w-52 h-36 sm:w-60 sm:h-40 object-contain" />
            </div>
          </div>

          {/* 3 CARDS STATISTIK / METRIK PASTEL (PERSIS FITUR KBLI 2025 - TANPA PROGRES) */}
          <div className="order-3 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1: Pastel Lavender (Struktur Golongan Pokok) */}
            <div className="p-5 rounded-[26px] bg-[#C5C2FC] text-[#1E1B4B] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[168px]">
              {/* Decorative Cross Shape in Top Right */}
              <div className="absolute -top-3 -right-3 w-16 h-16 pointer-events-none opacity-20">
                <div className="w-full h-full relative">
                  <div className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 bg-[#1E1B4B] rounded-full rotate-45" />
                  <div className="absolute top-0 left-1/2 w-4 h-full -translate-x-1/2 bg-[#1E1B4B] rounded-full rotate-45" />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#1E1B4B] shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#1E1B4B]">
                    Golongan Pokok Jabatan:
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  <div>
                    <div className="text-base sm:text-lg font-black leading-none">10</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">gol. pokok</div>
                    <div className="text-[9px] opacity-60">1 - 9 &amp; 0</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-black leading-none">446</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">sub-gol</div>
                    <div className="text-[9px] opacity-60">4-Digit</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-black leading-none">2.187</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">jabatan</div>
                    <div className="text-[9px] opacity-60">5-Digit</div>
                  </div>
                </div>
              </div>

              {/* Minimalist Vertical Bar Chart Decoration (Sesuai Fitur KBLI 2025) */}
              <div className="pt-4 flex items-end gap-1.5 h-11">
                <div className="w-1.5 h-6 bg-[#1E1B4B]/30 rounded-full" />
                <div className="w-1.5 h-4 bg-[#1E1B4B]/30 rounded-full" />
                <div className="w-1.5 h-8 bg-[#1E1B4B] rounded-full" />
                <div className="w-1.5 h-5 bg-[#1E1B4B]/40 rounded-full" />
                <div className="w-1.5 h-10 bg-[#1E1B4B] rounded-full" />
                <div className="w-1.5 h-6 bg-[#1E1B4B]/40 rounded-full" />
                <div className="w-1.5 h-7 bg-[#1E1B4B] rounded-full" />
                <div className="w-1.5 h-3 bg-[#1E1B4B]/30 rounded-full" />
              </div>
            </div>

            {/* Card 2: Soft Pink (Hierarki Struktur) */}
            <div className="p-5 rounded-[26px] bg-[#FF82BE] text-[#4A044E] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[168px]">
              {/* Decorative Heart / Star Shape in Top Right */}
              <div className="absolute top-2 right-2 w-12 h-12 pointer-events-none opacity-20">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#4A044E]">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#4A044E] shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#4A044E]">
                    Hierarki Struktur KBJI:
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  <div>
                    <div className="text-base sm:text-lg font-black leading-none">5 Level</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">HIERARKI</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-black leading-none">4 Digit</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">SUB-GOL</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-black leading-none">5 Digit</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">JABATAN</div>
                  </div>
                </div>
              </div>

              {/* Smooth Wave Path with Dot Peak (Sesuai Fitur KBLI 2025) */}
              <div className="pt-2 relative h-11 flex items-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 160 36" fill="none">
                  <path
                    d="M0 24 Q 25 32, 50 16 T 95 8 T 130 20 T 160 14"
                    stroke="#4A044E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="95" cy="8" r="3.5" fill="#4A044E" />
                </svg>
              </div>
            </div>

            {/* Card 3: Warm Apricot (Standar Resmi & Mempawah) */}
            <div className="p-5 rounded-[26px] bg-[#FFAF65] text-[#431407] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[168px]">
              {/* Decorative Geometric Shape in Top Right */}
              <div className="absolute -top-4 -right-4 w-16 h-16 pointer-events-none opacity-20">
                <div className="w-full h-full bg-[#431407] rounded-2xl rotate-12" />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#431407] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#431407]">
                    Standar Resmi KBJI 2014:
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  <div>
                    <div className="text-base sm:text-lg font-black leading-none">BPS RI</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">RESMI</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-black leading-none">Mempawah</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">TERINTEGRASI</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-black leading-none">ISCO-08</div>
                    <div className="text-[10px] font-bold opacity-75 mt-0.5">INTERNASIONAL</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-2 text-[10px] font-bold opacity-75">
                <span>Rujukan Baku Jabatan Indonesia &bull; Survei &amp; Sensus</span>
              </div>
            </div>
          </div>

          {/* BAGIAN BAWAH: DUA KOLOM LAYOUT (PERSIS KBLI 2025: List Kiri 60% + Card Rincian Kanan 40%) */}
          <div className="order-2 lg:order-3 grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
            {/* KOLOM KIRI: LIST GOLONGAN POKOK (1 - 9 & 0) BERBENTUK BAR BERTINGKAT PASTEL (60%) */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-black text-[#191614] dark:text-slate-100">
                  Daftar Golongan Pokok KBJI
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3 py-1 rounded-full shadow-2xs">
                  10 Golongan Pokok
                </span>
              </div>

              {loadingCategories ? (
                <div className="min-h-[220px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Memuat kategori KBJI 2014...</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {categories.map((cat, idx) => {
                    const IconComp = CATEGORY_ICONS[cat.code] || Briefcase;
                    const isSelected = previewCategoryCode === cat.code;
                    const palette = KBJI_PASTEL_PALETTES[idx % KBJI_PASTEL_PALETTES.length];

                    return (
                      <div
                        key={cat.code}
                        onClick={() => handleSelectCode(cat.code)}
                        onMouseEnter={() => setPreviewCategoryCode(cat.code)}
                        className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer ${palette.bg} ${
                          isSelected
                            ? 'ring-2 ring-slate-900 shadow-sm scale-[1.01]'
                            : 'hover:opacity-95 shadow-2xs hover:shadow-xs'
                        }`}
                        title={`Klik untuk melihat rincian, konsep definisi & turunan Golongan Pokok ${cat.code}`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Bulatan Putih Icon (persis KBLI 2025) */}
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs">
                            <IconComp className={`w-5 h-5 ${palette.iconColor}`} />
                          </div>

                          <div className="min-w-0">
                            <h3 className={`font-black text-sm truncate ${palette.text}`}>
                              {cat.code} &bull; {cat.title}
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-700/80 truncate">
                              {cat.total_sub_golongan} Sub-Golongan &bull; {cat.total_jabatan} Jenis Jabatan
                            </p>
                          </div>
                        </div>

                        {/* Badge Pill Kanan (persis KBLI 2025) */}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-[11px] font-mono font-black px-3 py-1 rounded-full ${palette.badge} shadow-2xs`}>
                            Gol. {cat.code}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* KOLOM KANAN: CARD RINCIAN DETAIL PREVIEW STICKY (40% - Persis KBLI 2025 dengan Pastel Palet) */}
            <div className="lg:col-span-5">
              {(() => {
                const selCat = categories.find(c => c.code === previewCategoryCode) || categories[0];
                if (!selCat) return null;
                const IconComp = CATEGORY_ICONS[selCat.code] || Briefcase;

                return (
                  <div className="p-6 sm:p-7 rounded-[28px] bg-[#C5C2FC] text-[#1E1B4B] shadow-xs space-y-5 sticky top-6">
                    {/* Header dengan Title dan Badge Kode Putih */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black text-[#1E1B4B] leading-snug">
                          Golongan Pokok {selCat.code}
                        </h3>
                        <p className="text-xs font-bold text-[#1E1B4B]/80">
                          {selCat.title}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-black px-3 py-1 rounded-full bg-white text-[#1E1B4B] shadow-2xs shrink-0">
                        KBJI-GOL-{selCat.code}
                      </span>
                    </div>

                    {/* Tag Pill Filter (Persis KBLI 2025) */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#1E1B4B]/15 text-[#1E1B4B]">
                        #ProfesiResmiBPS
                      </span>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#1E1B4B]/15 text-[#1E1B4B]">
                        #KBJI2014
                      </span>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#1E1B4B]/15 text-[#1E1B4B]">
                        #HierarkiJabatan
                      </span>
                    </div>

                    {/* Rincian Cakupan & Konsep Definisi */}
                    <div className="space-y-3 pt-2 border-t border-[#1E1B4B]/15 text-xs text-[#1E1B4B]/90">
                      <div>
                        <span className="font-bold opacity-75 block text-[11px]">Cakupan &amp; Tugas Pokok:</span>
                        <p className="mt-0.5 leading-relaxed font-medium line-clamp-4">
                          {selCat.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-white/70">
                          <span className="opacity-70 block font-bold">Sub-Golongan:</span>
                          <span className="text-sm font-black">{selCat.total_sub_golongan} Kode</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/70">
                          <span className="opacity-70 block font-bold">Jenis Jabatan:</span>
                          <span className="text-sm font-black">{selCat.total_jabatan} Jabatan</span>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi Buka Golongan Pokok */}
                    <button
                      type="button"
                      onClick={() => handleSelectCode(selCat.code)}
                      className="w-full py-3 rounded-full bg-[#181829] hover:bg-black text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <IconComp className="w-4 h-4" />
                      <span>Jelajahi Golongan Pokok {selCat.code}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* SECTION "TOP ARTICLES FOR YOU" / WAWASAN & PANDUAN KBJI 2014 (PERSIS GAMBAR REFERENSI DESAIN) */}
          <div className="order-4 space-y-3.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-black text-[#191614] dark:text-white">
                Top articles for you
              </h2>
              <span className="text-xs font-bold text-slate-500">Panduan Teknis Pencacahan BPS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Card 1: Question Bubble Illustration */}
              <div
                onClick={() => setIsGuideOpen(true)}
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 group"
              >
                <div className="rounded-2xl bg-[#F8F9FE] dark:bg-slate-800/60 p-2 flex items-center justify-center overflow-hidden">
                  <SpeechQuestionIllustration className="w-full h-36 object-contain group-hover:scale-105 transition-transform" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    Strategi Menentukan Kode Jabatan 5-Digit di Lapangan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                    Pedoman praktis petugas pencacah dalam membedakan tugas utama responden dengan aktivitas institusi tempat bekerja.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 pt-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Metodologi BPS</span>
                    <span>&bull;</span>
                    <span>5 min baca</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Book & Gear Illustration */}
              <div
                onClick={() => setIsGuideOpen(true)}
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4 group"
              >
                <div className="rounded-2xl bg-[#F8F9FE] dark:bg-slate-800/60 p-2 flex items-center justify-center overflow-hidden">
                  <BookGearIllustration className="w-full h-36 object-contain group-hover:scale-105 transition-transform" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    Harmonisasi Standar ISCO-08 &amp; Rujukan Empiris Mempawah
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                    Prinsip hierarki 5 tingkat internasional yang disesuaikan dengan nomenklatur profesi lokal masyarakat Mempawah &amp; Kalimantan Barat.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 pt-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Standar Global &amp; Lokal</span>
                    <span>&bull;</span>
                    <span>3 min baca</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL PANDUAN & ATURAN KBJI 2014 (PERSIS MODAL KBLI 2025)  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[28px] max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#C5C2FC] text-[#1E1B4B] flex items-center justify-center font-black">
                    <BookOpen className="w-5 h-5 text-[#1E1B4B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      Panduan Klasifikasi Baku Jabatan (KBJI 2014)
                    </h3>
                    <p className="text-xs text-slate-500">Struktur Hierarki &amp; Aturan Penentuan Jabatan BPS</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-4 rounded-2xl bg-[#C5C2FC]/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
                  <span className="font-bold text-[#1E1B4B] dark:text-indigo-300 block text-xs">
                    Pengertian Jabatan (Occupation):
                  </span>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    Jabatan didefinisikan sebagai sekumpulan pekerjaan yang tugas utamanya sama atau mirip satu sama lain. KBJI 2014 didasarkan pada <em>International Standard Classification of Occupations 2008 (ISCO-08)</em> yang diterbitkan oleh ILO.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                    Struktur 5 Tingkat Hierarki KBJI 2014:
                  </h4>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-black px-2 py-0.5 rounded-md bg-[#E9D5FF] text-[#3B0764] shrink-0">1 Digit</span>
                      <span><strong>Golongan Pokok (10 Kategori):</strong> Mencakup kelompok besar manajer, profesional, teknisi, staf administrasi, pekerja jasa, pertanian, teknis/kerajinan, operator mesin, pekerja kasar, dan TNI/POLRI.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-black px-2 py-0.5 rounded-md bg-[#C5C2FC] text-[#1E1B4B] shrink-0">2 Digit</span>
                      <span><strong>Sub-Golongan Pokok (43 Kategori):</strong> Mengelompokkan spesialisasi bidang keahlian di bawah golongan pokok.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-black px-2 py-0.5 rounded-md bg-[#A5D8FF] text-[#0C4A6E] shrink-0">3 Digit</span>
                      <span><strong>Golongan (130 Kategori):</strong> Mengelompokkan rumpun pekerjaan sejenis.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-black px-2 py-0.5 rounded-md bg-[#FFAF65] text-[#431407] shrink-0">4 Digit</span>
                      <span><strong>Sub-Golongan (446 Kategori):</strong> Klasifikasi operasional standar yang mencakup definisi tugas pokok.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono font-black px-2 py-0.5 rounded-md bg-[#FF82BE] text-[#4A044E] shrink-0">5 Digit</span>
                      <span><strong>Jabatan Spesifik (2.187 Jenis Jabatan):</strong> Rincian spesifik jenis pekerjaan (misal: 1111.01 Anggota Parlemen, 5131.01 Pramusaji).</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#FED7AA]/40 border border-amber-200 text-[#431407] space-y-1">
                  <span className="font-bold text-xs block">Rekomendasi Petugas Lapangan Mempawah:</span>
                  <p className="text-xs leading-relaxed">
                    Fitur ini telah dilengkapi 142 aturan pencocokan empiris berdasarkan survei &amp; pendataan lapangan BPS Kabupaten Mempawah. Cukup ketik istilah pekerjaan sehari-hari (contoh: <em>supir truk, petani sawit, barista, nelayan, kuli bangunan</em>) untuk mendapatkan rekomendasi instan.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="px-5 py-2 rounded-full bg-[#181829] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  Mengerti &amp; Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
