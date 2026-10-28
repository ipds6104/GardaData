import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Flame,
  Search,
  ChevronRight,
  Copy,
  Check,
  LayoutGrid,
  BookOpen,
  ExternalLink,
  X,
  AlertTriangle,
  CheckCircle2,
  Sprout,
  Mountain,
  Factory,
  Zap,
  Recycle,
  HardHat,
  ShoppingBag,
  Truck,
  Utensils,
  Wifi,
  Landmark,
  Building2,
  Briefcase,
  ShieldCheck,
  Scale,
  GraduationCap,
  HeartPulse,
  Palette,
  Sparkles,
  Users,
  Globe,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  Lightbulb,
  Hash,
  Home,
  MessageSquare,
  History,
  LogOut,
  Bell,
  ArrowUpRight,
  Store,
  Wrench,
  Coffee,
  Trees,
  Wheat,
  HomeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_KBLI_CATEGORIES } from './kbliCategoriesData';
import { getKbliSuggestionFromBusinessName } from '../pengolahan/rasionalitas/kbliRecommender';
import { useAuth } from '../../lib/auth';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface KbliCategory {
  code: string;
  title: string;
  description: string;
  total_items: number;
  total_kelompok: number;
  total_golongan_pokok: number;
}

export interface BreadcrumbNode {
  kode: string;
  judul: string;
  level: string;
  digit: number;
}

export interface ChildItem {
  kode: string;
  judul: string;
  level: 'kategori' | 'golongan_pokok' | 'golongan' | 'subgolongan' | 'kelompok';
  digit: number;
  deskripsi: string;
  snippet: string;
  has_exclusions: boolean;
  child_count: number;
}

export interface KbliDetail {
  kode: string;
  judul: string;
  level: 'kategori' | 'golongan_pokok' | 'golongan' | 'subgolongan' | 'kelompok';
  digit: number;
  kategori_kode: string;
  kategori_judul: string;
  induk: string;
  deskripsi: string;
  breadcrumb: BreadcrumbNode[];
  children: ChildItem[];
  siblings: {
    kode: string;
    judul: string;
    level: string;
  }[];
}

export interface SearchResultItem {
  kode: string;
  judul: string;
  level: 'kategori' | 'golongan_pokok' | 'golongan' | 'subgolongan' | 'kelompok';
  digit: number;
  kategori_kode: string;
  kategori_judul: string;
  induk: string;
  snippet: string;
  has_exclusions: boolean;
  se2026_match?: {
    count: number;
    top_produk: string[];
    top_kegiatan: string[];
    top_nama: string[];
  } | null;
}

interface RecommendedKbliMeta {
  kategori: string;
  ntbKategori?: string;
  kbli: string;
  judul: string;
  matchedKeyword: string;
  count: number;
  confidence?: number;
}

interface SearchResponse {
  total: number;
  total_kelompok?: number;
  execution_time_ms?: number;
  page: number;
  limit: number;
  totalPages: number;
  recommended_kbli?: RecommendedKbliMeta | null;
  items: SearchResultItem[];
}

interface Kbli2025ModuleProps {
  onBack: () => void;
}

// ==========================================
// CATEGORY VISUAL CONFIGURATION (22 KATEGORI A - V)
// Palet warna pastel & modern sesuai desain Helper Dashboard
// ==========================================

interface CategoryVisual {
  icon: React.ElementType;
  bgPastel: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  shortLabel: string;
  barColor: string;
  dotColor: string;
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  A: { icon: Sprout, bgPastel: 'bg-[#EDE9FE]', textColor: 'text-[#6D28D9]', borderColor: 'border-purple-200', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800', shortLabel: 'Pertanian & Perikanan', barColor: 'bg-[#6D28D9]', dotColor: '#6D28D9' },
  B: { icon: Mountain, bgPastel: 'bg-[#FEF3C7]', textColor: 'text-[#D97706]', borderColor: 'border-amber-200', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800', shortLabel: 'Pertambangan', barColor: 'bg-[#D97706]', dotColor: '#D97706' },
  C: { icon: Factory, bgPastel: 'bg-[#FFEDD5]', textColor: 'text-[#EA580C]', borderColor: 'border-orange-200', badgeBg: 'bg-orange-100', badgeText: 'text-orange-800', shortLabel: 'Industri Pengolahan', barColor: 'bg-[#EA580C]', dotColor: '#EA580C' },
  D: { icon: Zap, bgPastel: 'bg-[#FEF9C3]', textColor: 'text-[#CA8A04]', borderColor: 'border-yellow-200', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-800', shortLabel: 'Listrik & Gas', barColor: 'bg-[#CA8A04]', dotColor: '#CA8A04' },
  E: { icon: Recycle, bgPastel: 'bg-[#CCFBF1]', textColor: 'text-[#0D9488]', borderColor: 'border-teal-200', badgeBg: 'bg-teal-100', badgeText: 'text-teal-800', shortLabel: 'Air & Limbah', barColor: 'bg-[#0D9488]', dotColor: '#0D9488' },
  F: { icon: HardHat, bgPastel: 'bg-[#E0F2FE]', textColor: 'text-[#0284C7]', borderColor: 'border-sky-200', badgeBg: 'bg-sky-100', badgeText: 'text-sky-800', shortLabel: 'Konstruksi', barColor: 'bg-[#0284C7]', dotColor: '#0284C7' },
  G: { icon: ShoppingBag, bgPastel: 'bg-[#EDE9FE]', textColor: 'text-[#4F46E5]', borderColor: 'border-indigo-200', badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-800', shortLabel: 'Perdagangan Besar & Eceran', barColor: 'bg-[#4F46E5]', dotColor: '#4F46E5' },
  H: { icon: Truck, bgPastel: 'bg-[#CFFAFE]', textColor: 'text-[#0891B2]', borderColor: 'border-cyan-200', badgeBg: 'bg-cyan-100', badgeText: 'text-cyan-800', shortLabel: 'Transportasi & Gudang', barColor: 'bg-[#0891B2]', dotColor: '#0891B2' },
  I: { icon: Utensils, bgPastel: 'bg-[#FFE4E6]', textColor: 'text-[#E11D48]', borderColor: 'border-rose-200', badgeBg: 'bg-rose-100', badgeText: 'text-rose-800', shortLabel: 'Akomodasi & Makan Minum', barColor: 'bg-[#E11D48]', dotColor: '#E11D48' },
  J: { icon: BookOpen, bgPastel: 'bg-[#CFFAFE]', textColor: 'text-[#0284C7]', borderColor: 'border-sky-200', badgeBg: 'bg-sky-100', badgeText: 'text-sky-800', shortLabel: 'Penerbitan & Penyiaran', barColor: 'bg-[#0284C7]', dotColor: '#0284C7' },
  K: { icon: Wifi, bgPastel: 'bg-[#EDE9FE]', textColor: 'text-[#7C3AED]', borderColor: 'border-purple-200', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800', shortLabel: 'Telekomunikasi & IT', barColor: 'bg-[#7C3AED]', dotColor: '#7C3AED' },
  L: { icon: Landmark, bgPastel: 'bg-[#F3E8FF]', textColor: 'text-[#9333EA]', borderColor: 'border-purple-200', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800', shortLabel: 'Keuangan & Asuransi', barColor: 'bg-[#9333EA]', dotColor: '#9333EA' },
  M: { icon: Building2, bgPastel: 'bg-[#DCFCE7]', textColor: 'text-[#16A34A]', borderColor: 'border-emerald-200', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800', shortLabel: 'Real Estat', barColor: 'bg-[#16A34A]', dotColor: '#16A34A' },
  N: { icon: Briefcase, bgPastel: 'bg-[#FAE8FF]', textColor: 'text-[#C026D3]', borderColor: 'border-fuchsia-200', badgeBg: 'bg-fuchsia-100', badgeText: 'text-fuchsia-800', shortLabel: 'Profesional & Ilmiah', barColor: 'bg-[#C026D3]', dotColor: '#C026D3' },
  O: { icon: ShieldCheck, bgPastel: 'bg-[#F1F5F9]', textColor: 'text-[#475569]', borderColor: 'border-slate-200', badgeBg: 'bg-slate-100', badgeText: 'text-slate-800', shortLabel: 'Penyewaan & Penunjang', barColor: 'bg-[#475569]', dotColor: '#475569' },
  P: { icon: Scale, bgPastel: 'bg-[#DBEAFE]', textColor: 'text-[#2563EB]', borderColor: 'border-blue-200', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800', shortLabel: 'Pemerintahan', barColor: 'bg-[#2563EB]', dotColor: '#2563EB' },
  Q: { icon: GraduationCap, bgPastel: 'bg-[#FEE2E2]', textColor: 'text-[#DC2626]', borderColor: 'border-red-200', badgeBg: 'bg-red-100', badgeText: 'text-red-800', shortLabel: 'Pendidikan', barColor: 'bg-[#DC2626]', dotColor: '#DC2626' },
  R: { icon: HeartPulse, bgPastel: 'bg-[#FCE7F3]', textColor: 'text-[#DB2777]', borderColor: 'border-pink-200', badgeBg: 'bg-pink-100', badgeText: 'text-pink-800', shortLabel: 'Kesehatan & Sosial', barColor: 'bg-[#DB2777]', dotColor: '#DB2777' },
  S: { icon: Palette, bgPastel: 'bg-[#FEF3C7]', textColor: 'text-[#B45309]', borderColor: 'border-amber-200', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800', shortLabel: 'Kesenian & Olahraga', barColor: 'bg-[#B45309]', dotColor: '#B45309' },
  T: { icon: Sparkles, bgPastel: 'bg-[#ECFCCB]', textColor: 'text-[#65A30D]', borderColor: 'border-lime-200', badgeBg: 'bg-lime-100', badgeText: 'text-lime-800', shortLabel: 'Jasa Lainnya & Reparasi', barColor: 'bg-[#65A30D]', dotColor: '#65A30D' },
  U: { icon: Users, bgPastel: 'bg-[#FFEDD5]', textColor: 'text-[#C2410C]', borderColor: 'border-orange-200', badgeBg: 'bg-orange-100', badgeText: 'text-orange-800', shortLabel: 'Aktivitas Rumah Tangga', barColor: 'bg-[#C2410C]', dotColor: '#C2410C' },
  V: { icon: Globe, bgPastel: 'bg-[#E0F2FE]', textColor: 'text-[#0369A1]', borderColor: 'border-sky-200', badgeBg: 'bg-sky-100', badgeText: 'text-sky-800', shortLabel: 'Badan Internasional', barColor: 'bg-[#0369A1]', dotColor: '#0369A1' }
};

const DEFAULT_VISUAL: CategoryVisual = {
  icon: BookOpen,
  bgPastel: 'bg-[#EDE9FE]',
  textColor: 'text-[#4F46E5]',
  borderColor: 'border-indigo-200',
  badgeBg: 'bg-indigo-100',
  badgeText: 'text-indigo-800',
  shortLabel: 'Klasifikasi Usaha',
  barColor: 'bg-[#4F46E5]',
  dotColor: '#4F46E5'
};

const LEVEL_BADGE_STYLES: Record<string, string> = {
  kategori: 'bg-purple-100 text-purple-800 border-purple-200',
  golongan_pokok: 'bg-sky-100 text-sky-800 border-sky-200',
  golongan: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  subgolongan: 'bg-amber-100 text-amber-800 border-amber-200',
  kelompok: 'bg-rose-100 text-rose-800 border-rose-200'
};

const QUICK_APPS_EXAMPLES = [
  { label: 'Toko Sembako Berkah', code: '47111', badge: '+KBLI 47111', badgeBg: 'bg-amber-100 text-amber-800', icon: Store },
  { label: 'Bengkel Sepeda Motor', code: '95411', badge: '+KBLI 95411', badgeBg: 'bg-sky-100 text-sky-800', icon: Wrench },
  { label: 'Warung Kopi & Kafe', code: '56303', badge: '+KBLI 56303', badgeBg: 'bg-rose-100 text-rose-800', icon: Coffee },
  { label: 'Perkebunan Kelapa Sawit', code: '01262', badge: '+KBLI 01262', badgeBg: 'bg-emerald-100 text-emerald-800', icon: Trees },
  { label: 'Penggilingan Padi & Beras', code: '10631', badge: '+KBLI 10631', badgeBg: 'bg-orange-100 text-orange-800', icon: Wheat },
  { label: 'Rumah Kos & Kontrakan', code: '68111', badge: '+KBLI 68111', badgeBg: 'bg-purple-100 text-purple-800', icon: HomeIcon }
];

const LEVEL_NAMES: Record<string, string> = {
  kategori: 'Kategori (1 Huruf)',
  golongan_pokok: 'Golongan Pokok (2 Digit)',
  golongan: 'Golongan (3 Digit)',
  subgolongan: 'Subgolongan (4 Digit)',
  kelompok: 'Kelompok (5 Digit)'
};

const CHILD_SECTION_TITLES: Record<string, string> = {
  kategori: 'Daftar Golongan Pokok (2 Digit)',
  golongan_pokok: 'Daftar Golongan (3 Digit)',
  golongan: 'Daftar Subgolongan (4 Digit)',
  subgolongan: 'Daftar Kelompok Usaha (5 Digit) - Standar Pencacahan BPS',
  kelompok: 'Klasifikasi Seinduk Terkait (Pilihan Lain)'
};

export type KbliDefinitionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; header: string; items: string[] };

// Bersihkan artefak OCR/PDF pada teks deskripsi KBLI 2025
const cleanKbliRawText = (raw?: string | null): string => {
  if (!raw) return '';
  return raw
    .replace(/\bSubdolongan\b/gi, 'Subgolongan')
    .replace(/\bGolong\s+an\b/gi, 'Golongan')
    .replace(/\bplatfo\s+rm\b/gi, 'platform')
    .replace(/\bmen\s+cakup\b/gi, 'mencakup')
    .replace(/\bSubgolongan\s+tidak\s+ini\s+mencakup\b/gi, 'Subgolongan ini tidak mencakup')
    .replace(/\bsehari\s+-\s+hari\b/gi, 'sehari-hari')
    .replace(/\bdipindah\s+-\s+pindahkan\b/gi, 'dipindah-pindahkan')
    .replace(/\bcine\s+-\s+film\b/gi, 'cine-film')
    .replace(/\bgolongan\s+pokok\s+55l\b/gi, 'golongan pokok 551')
    .replace(/\bKONTEN\s*(?:-\s*)?\d{3,4}(?:\s*-\s*[A-Z\s,]+)?\s*(?=-)/g, '')
    .replace(/\bSOSIAL\s+WAJIB\s+\d{3,4}\s*(?=-)/g, '')
    .replace(/\bLAINNYA\s*-\s*\d{3,4}\s*-?\s*$/g, '')
    .replace(/\.([A-Z])/g, '. $1')
    .replace(/\.\s*\./g, '.')
    .replace(/(\d+)\s+-\s+(\d+)/g, '$1–$2')
    .replace(/\s+/g, ' ')
    .trim();
};

const splitMainAndExclusions = (rawDesc?: string | null): { main: string; exclusions: string } => {
  const cleaned = cleanKbliRawText(rawDesc);
  if (!cleaned) return { main: '', exclusions: '' };

  const exclRegex =
    /(?:^|(?<=[.;])\s*|\s+(?=(?:Kategori|Golongan\s+pokok|Golongan|Subgolongan|Kelompok|Kegiatan\s+di\s+sini)\s+(?:ini\s+)?(?:juga\s+)?tidak\s+(?:mencakup|termasuk)))((?:Namun,\s*)?(?:(?:Kategori|Golongan\s+pokok|Golongan|Subgolongan|Kelompok|Kegiatan\s+(?:di\s+sini|pertanian))\s+(?:ini\s+)?(?:juga\s+)?)?tidak\s+(?:mencakup|termasuk)\b[\s\S]*)$/i;

  const match = cleaned.match(exclRegex);
  if (match && match.index !== undefined) {
    return {
      main: cleaned.slice(0, match.index).trim(),
      exclusions: match[1].trim()
    };
  }

  return { main: cleaned, exclusions: '' };
};

const parseSectionIntoBlocks = (sectionText: string): KbliDefinitionBlock[] => {
  if (!sectionText) return [];

  const subSections = sectionText
    .split(
      /(?<=[.;])\s+(?=(?:Kategori|Golongan\s+pokok|Golongan|Subgolongan|Kelompok)\s+ini\s+(?:juga\s+)?(?:tidak\s+)?(?:mencakup|termasuk)\b)/i
    )
    .map((s) => s.trim())
    .filter(Boolean);

  const blocks: KbliDefinitionBlock[] = [];

  for (const sub of subSections) {
    let remaining = sub;
    while (remaining.length > 0) {
      const dashMatch = remaining.match(/(?:^|\s)-\s+/);
      if (!dashMatch || dashMatch.index === undefined) {
        if (remaining.trim()) {
          blocks.push({ type: 'paragraph', text: remaining.trim() });
        }
        break;
      }

      const beforeDash = remaining.slice(0, dashMatch.index).trim();
      const afterDashStart = remaining.slice(dashMatch.index + dashMatch[0].length).trim();

      let introHeader = '';
      if (beforeDash) {
        const lastPeriodIdx = beforeDash.lastIndexOf('. ');
        if (lastPeriodIdx !== -1) {
          const prevSentences = beforeDash.slice(0, lastPeriodIdx + 1).trim();
          if (prevSentences) {
            blocks.push({ type: 'paragraph', text: prevSentences });
          }
          introHeader = beforeDash.slice(lastPeriodIdx + 2).trim();
        } else {
          introHeader = beforeDash;
        }
      }

      if (introHeader && !introHeader.endsWith(':')) {
        introHeader = introHeader.replace(/[.;,]+$/, '') + ':';
      }

      const rawItems = afterDashStart.split(/\s*(?:;|,)?\s+-\s+/);
      const cleanItems: string[] = [];
      let trailingProse = '';

      for (let i = 0; i < rawItems.length; i++) {
        const it = rawItems[i].trim();
        if (i === rawItems.length - 1) {
          const periodIdx = it.indexOf('. ');
          if (periodIdx !== -1) {
            cleanItems.push(it.slice(0, periodIdx).replace(/[;,]+$/, '').trim());
            trailingProse = it.slice(periodIdx + 2).trim();
          } else {
            cleanItems.push(it.replace(/[.;,]+$/, '').trim());
          }
        } else {
          cleanItems.push(it.replace(/[.;,]+$/, '').trim());
        }
      }

      const validItems = cleanItems.filter(Boolean);
      if (validItems.length > 0) {
        blocks.push({
          type: 'list',
          header: introHeader,
          items: validItems
        });
      }

      remaining = trailingProse;
    }
  }

  return blocks;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export const Kbli2025Module: React.FC<Kbli2025ModuleProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<KbliCategory[]>(INITIAL_KBLI_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [previewCategoryCode, setPreviewCategoryCode] = useState<string>('A');
  const [filterTag, setFilterTag] = useState<'all' | '5digit' | 'ai' | 'guide'>('all');

  const getGreeting = (fullName?: string) => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = 'Good evening';
    } else if (hour >= 21 || hour < 4) {
      timeGreeting = 'Good night';
    }
    const firstName = fullName ? fullName.split(' ')[0] : 'Sobat Data';
    return `${timeGreeting}, ${firstName}`;
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  const [currentNode, setCurrentNode] = useState<KbliDetail | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [loadingNode, setLoadingNode] = useState<boolean>(false);
  const [nodeError, setNodeError] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isExpandedDefinition, setIsExpandedDefinition] = useState<boolean>(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Trending & Recent Search state
  const [trendingSearches, setTrendingSearches] = useState<{ keyword: string; count: number; tag?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('garda_kbli_search_trends');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { keyword: 'Toko Kelontong & Sembako', count: 1420, tag: '47111' },
      { keyword: 'Warung Kopi & Kafe', count: 1180, tag: '56303' },
      { keyword: 'Bengkel Sepeda Motor', count: 960, tag: '95411' },
      { keyword: 'Perkebunan Kelapa Sawit', count: 850, tag: '01262' },
      { keyword: 'Rumah Kos & Kontrakan', count: 720, tag: '68111' },
      { keyword: 'Penggilingan Padi & Beras', count: 680, tag: '10631' },
      { keyword: 'Jasa Angkutan Barang Truk', count: 610, tag: '49431' },
      { keyword: 'Pangkas Rambut & Salon', count: 540, tag: '96112' }
    ];
  });

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('garda_kbli_recent_searches');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Toko Sembako Berkah', 'Bengkel Motor'];
  });

  // Simpan kata kunci ke tren dan riwayat
  const recordSearchTrend = (queryText: string) => {
    const q = queryText.trim();
    if (!q || q.length < 2) return;

    // Update Recent
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== q.toLowerCase());
      const updated = [q, ...filtered].slice(0, 6);
      try { localStorage.setItem('garda_kbli_recent_searches', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    // Update Trending Counts
    setTrendingSearches(prev => {
      const idx = prev.findIndex(item => item.keyword.toLowerCase() === q.toLowerCase());
      let updated;
      if (idx !== -1) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], count: updated[idx].count + 1 };
      } else {
        updated = [{ keyword: q, count: 1 }, ...prev];
      }
      updated.sort((a, b) => b.count - a.count);
      const sliced = updated.slice(0, 10);
      try { localStorage.setItem('garda_kbli_search_trends', JSON.stringify(sliced)); } catch (e) {}
      return sliced;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(item => item !== itemToRemove);
      try { localStorage.setItem('garda_kbli_recent_searches', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rekomendasi Cerdas AI Nama Usaha SE2026
  const activeRecommendation = useMemo(() => {
    if (searchResults?.recommended_kbli && searchResults.recommended_kbli.kbli) {
      return {
        kbli5Digit: searchResults.recommended_kbli.kbli,
        kbliJudul: searchResults.recommended_kbli.judul,
        kategoriKode: searchResults.recommended_kbli.kategori,
        matchedKeyword: searchResults.recommended_kbli.matchedKeyword || debouncedQuery,
        count: searchResults.recommended_kbli.count || 0
      };
    }
    if (debouncedQuery && debouncedQuery.trim().length >= 2) {
      const offlineRec = getKbliSuggestionFromBusinessName(debouncedQuery);
      if (offlineRec) {
        return {
          kbli5Digit: offlineRec.kbli,
          kbliJudul: offlineRec.judul,
          kategoriKode: offlineRec.kategori,
          matchedKeyword: offlineRec.matchedKeyword || debouncedQuery,
          count: offlineRec.count || 0
        };
      }
    }
    return null;
  }, [searchResults, debouncedQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch('/api/kbli/categories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat kategori dari backend:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults(null);
      return;
    }

    let isCancelled = false;
    const executeSearch = async () => {
      recordSearchTrend(debouncedQuery);
      setLoadingSearch(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          limit: '25'
        });
        const res = await fetch(`/api/kbli/search?${params.toString()}`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Gagal mencari KBLI:', err);
      } finally {
        if (!isCancelled) setLoadingSearch(false);
      }
    };

    executeSearch();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  // Telemetry Tracking State (Opsi 1: Copy Code, Opsi 2: Last-in-Session, Opsi 3: Dwell Time)
  const activeSessionIdRef = useRef<string>('');
  const activeViewTrackingRef = useRef<{
    sessionId: string;
    keyword: string;
    code: string;
    title: string;
    level?: string;
    openedAt: number;
  } | null>(null);

  // Buat session ID baru untuk setiap query pencarian baru
  useEffect(() => {
    if (debouncedQuery.trim()) {
      activeSessionIdRef.current = 'kbli_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    }
  }, [debouncedQuery]);

  // Simpan & perbarui status pilihan pengguna ke server
  const sendSearchTelemetry = (payload: {
    keyword: string;
    code: string;
    title?: string;
    level?: string;
    sessionId?: string;
    action?: 'view' | 'copy_code';
    isCopied?: boolean;
    dwellTimeSeconds?: number;
    isLastInSession?: boolean;
  }) => {
    const trimmedKw = (payload.keyword || '').trim();
    const trimmedCode = (payload.code || '').trim();
    if (!trimmedKw || !trimmedCode) return;

    try {
      fetch('/api/kbli/log-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: payload.sessionId || activeSessionIdRef.current || ('kbli_' + Date.now().toString(36)),
          keyword: trimmedKw,
          selected_code: trimmedCode,
          selected_title: payload.title || '',
          selected_level: payload.level || '',
          action: payload.action || 'view',
          is_copied: payload.isCopied || payload.action === 'copy_code',
          dwell_time_seconds: payload.dwellTimeSeconds || 0,
          is_last_in_session: payload.isLastInSession !== undefined ? payload.isLastInSession : true,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch (_) {}
  };

  // Simpan durasi membaca kartu yang sedang aktif sebelum berpindah atau ditutup
  const flushCurrentTracking = (isLast: boolean = true) => {
    if (activeViewTrackingRef.current) {
      const curr = activeViewTrackingRef.current;
      const dwell = Math.max(1, Math.round((Date.now() - curr.openedAt) / 1000));
      sendSearchTelemetry({
        keyword: curr.keyword,
        code: curr.code,
        title: curr.title,
        level: curr.level,
        sessionId: curr.sessionId,
        action: 'view',
        dwellTimeSeconds: dwell,
        isLastInSession: isLast
      });
      activeViewTrackingRef.current = null;
    }
  };

  // Bersihkan dan rekam dwell time saat halaman ditutup / berpindah
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushCurrentTracking(true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushCurrentTracking(true);
    };
  }, []);

  const handleSelectCode = async (kode: string, title?: string, level?: string) => {
    const activeKw = debouncedQuery || searchQuery;

    // Opsi 2 & 3: Jika ada kartu yang sedang dibaca sebelumnya dalam sesi ini, tandai bukan kartu terakhir dan kirim dwell time-nya
    if (activeViewTrackingRef.current) {
      const prev = activeViewTrackingRef.current;
      const dwell = Math.max(1, Math.round((Date.now() - prev.openedAt) / 1000));
      sendSearchTelemetry({
        keyword: prev.keyword,
        code: prev.code,
        title: prev.title,
        level: prev.level,
        sessionId: prev.sessionId,
        action: 'view',
        dwellTimeSeconds: dwell,
        isLastInSession: false
      });
      activeViewTrackingRef.current = null;
    }

    if (activeKw) {
      if (!activeSessionIdRef.current) {
        activeSessionIdRef.current = 'kbli_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      }
      const sessId = activeSessionIdRef.current;
      activeViewTrackingRef.current = {
        sessionId: sessId,
        keyword: activeKw,
        code: kode,
        title: title || '',
        level: level || '',
        openedAt: Date.now()
      };

      // Catat awal dibuka sebagai kandidat kartu terakhir
      sendSearchTelemetry({
        keyword: activeKw,
        code: kode,
        title,
        level,
        sessionId: sessId,
        action: 'view',
        dwellTimeSeconds: 0,
        isLastInSession: true
      });
    }

    setActiveCode(kode);
    setLoadingNode(true);
    setNodeError(null);
    setIsExpandedDefinition(false);
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchResults(null);

    try {
      const res = await fetch(`/api/kbli/detail/${encodeURIComponent(kode)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentNode(data);
        const descLen = (data.deskripsi || '').length;
        if (
          !data.children ||
          data.children.length === 0 ||
          data.level === 'kelompok' ||
          data.level === 'subgolongan' ||
          data.level === 'golongan' ||
          descLen <= 1200
        ) {
          setIsExpandedDefinition(true);
        } else {
          setIsExpandedDefinition(false);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(`Server merespons kode status ${res.status}`);
      }
    } catch (err: any) {
      console.error(`Gagal memuat detail KBLI ${kode}:`, err);
      setNodeError(`Gagal mengambil data dari server (${err.message || 'Network error'}).`);
    } finally {
      setLoadingNode(false);
    }
  };

  const handleBackToAllCategories = () => {
    flushCurrentTracking(true);
    setCurrentNode(null);
    setIsExpandedDefinition(false);
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchResults(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackOneLevel = () => {
    if (!currentNode || !currentNode.breadcrumb || currentNode.breadcrumb.length <= 1) {
      handleBackToAllCategories();
      return;
    }
    const parentIndex = currentNode.breadcrumb.length - 2;
    const parentNode = currentNode.breadcrumb[parentIndex];
    if (parentNode) {
      handleSelectCode(parentNode.kode, parentNode.judul);
    } else {
      handleBackToAllCategories();
    }
  };

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);

    // Opsi 1: Aksi Salin Kode -> Konfirmasi pilihan paling valid
    const activeKw = activeViewTrackingRef.current?.keyword || debouncedQuery || searchQuery;
    if (activeKw) {
      const dwell = activeViewTrackingRef.current && activeViewTrackingRef.current.code === code
        ? Math.max(1, Math.round((Date.now() - activeViewTrackingRef.current.openedAt) / 1000))
        : 0;

      sendSearchTelemetry({
        keyword: activeKw,
        code: code,
        title: currentNode?.judul || activeRecommendation?.judulUsaha || '',
        level: currentNode?.level || '5',
        sessionId: activeSessionIdRef.current || activeViewTrackingRef.current?.sessionId,
        action: 'copy_code',
        isCopied: true,
        dwellTimeSeconds: dwell,
        isLastInSession: true
      });
    }
  };

  const parsedDefinition = useMemo(() => {
    if (!currentNode?.deskripsi) {
      return {
        main: '',
        exclusions: '',
        mainBlocks: [] as KbliDefinitionBlock[],
        exclusionBlocks: [] as KbliDefinitionBlock[]
      };
    }
    const { main, exclusions } = splitMainAndExclusions(currentNode.deskripsi);
    return {
      main,
      exclusions,
      mainBlocks: parseSectionIntoBlocks(main),
      exclusionBlocks: parseSectionIntoBlocks(exclusions)
    };
  }, [currentNode]);

  const renderTextWithKbliLinks = (text: string, isExclusion = false) => {
    if (!text) return null;
    const refRegex =
      /\b((?:lihat\s+)?(?:kategori|golongan\s+pokok|subgolongan|golongan|kelompok)\s+)([A-V]|\d{2,5})\b|\b(lihat\s+)(\d{2,5})\b/gi;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = refRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const prefix = match[1] || match[3] || '';
      const codeTarget = (match[2] || match[4] || '').trim();
      parts.push(prefix);
      parts.push(
        <button
          key={`${match.index}-${codeTarget}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectCode(codeTarget);
          }}
          title={`Buka klasifikasi KBLI ${codeTarget}`}
          className={`inline-flex items-center gap-0.5 px-2 py-0.5 mx-0.5 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer ${
            isExclusion
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-200'
          }`}
        >
          <span>{codeTarget}</span>
        </button>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const formatSnippetPreview = (text?: string): string => {
    if (!text) return 'Tidak ada keterangan rincian tambahan.';
    const cleaned = cleanKbliRawText(text);
    return cleaned.length > 180 ? cleaned.slice(0, 180) + '...' : cleaned;
  };

  const activeVisual = CATEGORY_VISUALS[currentNode?.kategori_kode || ''] || DEFAULT_VISUAL;
  const ActiveIcon = activeVisual.icon;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B4B] font-sans pb-20">
      {/* ========================================================= */}
      {/* 1. MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 space-y-6">
        {/* Top Header Bar with Clean Pill Search Sesuai Gambar Referensi */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
          {/* Back button */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                if (currentNode) {
                  handleBackOneLevel();
                } else {
                  onBack();
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-indigo-600 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              title={currentNode ? "Kembali ke tingkat sebelumnya" : "Kembali ke menu Garda Data"}
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>{currentNode ? "Tingkat Sebelumnya" : "Kembali"}</span>
            </button>

            {currentNode && (
              <button
                onClick={handleBackToAllCategories}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 hover:text-indigo-600 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                title="Kembali ke semua 22 kategori"
              >
                <LayoutGrid className="w-4 h-4 text-slate-500" />
                <span>Semua Kategori</span>
              </button>
            )}
          </div>

          {/* Centered Pill Search Bar with Google-style Trending Dropdown (Sesuai Desain Gambar: Pill with Pink Search Circle & Filter Tags) */}
          <div className="relative w-full sm:flex-1 sm:max-w-3xl" ref={searchContainerRef}>
            <div className="w-full flex items-center bg-white/95 rounded-full border border-slate-200/90 p-1.5 pl-2 pr-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
              {/* Pink Search Circle Icon Button */}
              <div className="w-9 h-9 rounded-full bg-[#FCE7F3] text-[#DB2777] flex items-center justify-center shrink-0 shadow-2xs">
                <Search className="w-4 h-4" />
              </div>

              {/* Input text */}
              <input
                id="kbli-search-input"
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    recordSearchTrend(searchQuery);
                    setIsSearchFocused(false);
                  }
                }}
                placeholder="Cari kode (misal: 01111), nama usaha, atau komoditas..."
                className="w-full bg-transparent pl-3 pr-2 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />

              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedQuery('');
                    setSearchResults(null);
                  }}
                  className="p-1 mr-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  title="Bersihkan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Filter Pills Tag (In: Patients | Education | Prescriptions di gambar referensi) */}
              <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200/80 text-[11px] font-bold text-slate-500 shrink-0 select-none">
                <span className="text-slate-400">In:</span>
                <button
                  type="button"
                  onClick={() => setFilterTag('all')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    filterTag === 'all'
                      ? 'bg-[#1E1B4B] text-white shadow-2xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterTag('5digit');
                    setSearchQuery('0');
                  }}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    filterTag === '5digit'
                      ? 'bg-[#1E1B4B] text-white shadow-2xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  5-Digit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterTag('ai');
                    setSearchQuery('Toko');
                  }}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    filterTag === 'ai'
                      ? 'bg-[#1E1B4B] text-white shadow-2xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Nama Usaha
                </button>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  title="Buka panduan KBLI"
                >
                  Panduan
                </button>
              </div>
            </div>

            {/* GOOGLE-STYLE TRENDING & RECENT SEARCHES DROPDOWN */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 z-50 space-y-3.5"
                >
                  {/* Recent Searches if any */}
                  {recentSearches.length > 0 && !searchQuery && (
                    <div className="space-y-1.5 pb-2 border-b border-slate-100">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                          <History className="w-3.5 h-3.5" />
                          <span>Pencarian Terakhir</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {recentSearches.map((rec) => (
                          <button
                            key={rec}
                            type="button"
                            onClick={() => {
                              setSearchQuery(rec);
                              recordSearchTrend(rec);
                              setIsSearchFocused(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors cursor-pointer group"
                          >
                            <History className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                            <span>{rec}</span>
                            <span
                              onClick={(e) => removeRecentSearch(e, rec)}
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

                  {/* Trending KBLI Searches Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span>Trending Pencarian KBLI 2025</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Paling Sering Dicari</span>
                    </div>

                    {/* Trending Items List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {trendingSearches.map((trend, idx) => (
                        <button
                          key={trend.keyword}
                          type="button"
                          onClick={() => {
                            setSearchQuery(trend.keyword);
                            recordSearchTrend(trend.keyword);
                            setIsSearchFocused(false);
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-indigo-50/70 hover:text-indigo-900 transition-colors text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              idx < 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 truncate">
                              {trend.keyword}
                            </span>
                          </div>
                          {trend.tag ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-800 shrink-0">
                              {trend.tag}
                            </span>
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Content Body */}
        <main className="px-4 sm:px-8 pb-16 space-y-6 flex-1">
          {/* Node Error Banner */}
          {nodeError && (
            <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-rose-800 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{nodeError}</span>
              </div>
              {activeCode && (
                <button
                  onClick={() => handleSelectCode(activeCode)}
                  className="px-3 py-1.5 rounded-full font-bold bg-rose-600 text-white text-xs hover:bg-rose-700 transition-colors shrink-0 shadow-xs"
                >
                  Coba Lagi
                </button>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 1: HASIL PENCARIAN (JIKA ADA INPUT SEARCH) */}
          {/* ========================================================= */}
          {debouncedQuery ? (
            <section className="space-y-5">
              {/* BANNER REKOMENDASI AI SE2026 SESUAI STYLE HELPER */}
              {activeRecommendation && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-[28px] bg-gradient-to-r from-[#FFD8A8] via-[#FED7AA] to-[#FECBA1] text-[#1E1B4B] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1E1B4B] text-white">
                          Rekomendasi KBLI Nama Usaha
                        </span>
                        <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-full bg-white text-[#1E1B4B] shadow-xs">
                          KBLI {activeRecommendation.kbli5Digit}
                        </span>
                        {activeRecommendation.matchedKeyword && (
                          <span className="text-xs font-bold text-[#1E1B4B]/80">
                            • Cocok dengan: &ldquo;{activeRecommendation.matchedKeyword}&rdquo;
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-base sm:text-lg leading-snug">
                        {activeRecommendation.kbliJudul}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopy(activeRecommendation.kbli5Digit, activeRecommendation.kbli5Digit)}
                      className="px-4 py-2.5 rounded-full text-xs font-extrabold bg-white text-[#1E1B4B] hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {copiedCode === activeRecommendation.kbli5Digit ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-600">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-500" />
                          <span>Salin {activeRecommendation.kbli5Digit}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectCode(activeRecommendation.kbli5Digit, activeRecommendation.kbliJudul, 'kelompok')}
                      className="px-4 py-2.5 rounded-full text-xs font-black bg-[#201E50] text-white hover:bg-[#2C296B] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Buka Detail</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Status Bar Pencarian */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                <div>
                  <h2 className="text-sm font-extrabold text-[#1E1B4B]">
                    Hasil Pencarian: <span className="text-indigo-600">"{debouncedQuery}"</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Diurutkan berdasarkan relevansi Nama Usaha, Judul & Komoditas BPS
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {searchResults?.execution_time_ms !== undefined && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white text-slate-500 border border-slate-200">
                      ⚡ {searchResults.execution_time_ms} ms
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                    {searchResults?.total_kelompok ?? searchResults?.items.filter(i => i.digit === 5).length ?? 0} Kode 5-Digit
                  </span>
                </div>
              </div>

              {loadingSearch ? (
                <div className="min-h-[260px] flex flex-col items-center justify-center p-8 bg-white rounded-[28px] border border-slate-100 shadow-sm">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-600">Mencari klasifikasi KBLI 2025...</p>
                </div>
              ) : searchResults && searchResults.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.items.map((item) => {
                    const visual = CATEGORY_VISUALS[item.kategori_kode] || DEFAULT_VISUAL;
                    const ItemIcon = visual.icon;
                    const is5Digit = item.digit === 5;

                    return (
                      <motion.article
                        key={item.kode}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelectCode(item.kode, item.judul, item.level)}
                        className="bg-white rounded-[24px] border border-slate-100/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${visual.bgPastel} ${visual.textColor}`}>
                                <ItemIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                                  {item.kode}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${LEVEL_BADGE_STYLES[item.level] || 'bg-slate-100 text-slate-700'}`}>
                              {LEVEL_NAMES[item.level] || item.level}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#1E1B4B] group-hover:text-indigo-600 transition-colors leading-snug">
                              {item.judul}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {formatSnippetPreview(item.snippet)}
                            </p>
                          </div>

                          {item.se2026_match?.top_produk && item.se2026_match.top_produk.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[10px] font-bold text-slate-400">Komoditas:</span>
                              {item.se2026_match.top_produk.slice(0, 3).map((p, pIdx) => (
                                <span key={pIdx} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-slate-400">
                            Kategori {item.kategori_kode} • {visual.shortLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 font-extrabold text-indigo-600 group-hover:translate-x-1 transition-transform">
                            <span>{is5Digit ? 'Detail 5-Digit' : 'Jelajahi'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-white rounded-[28px] border border-slate-100 shadow-sm">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-700">Tidak Ada Hasil untuk "{debouncedQuery}"</h3>
                  <p className="text-xs text-slate-400 mt-1">Coba gunakan nama usaha yang lebih umum atau kode KBLI 5-digit.</p>
                </div>
              )}
            </section>
          ) : loadingNode ? (
            <div className="min-h-[280px] flex flex-col items-center justify-center p-8 bg-white rounded-[28px] border border-slate-100 shadow-sm">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <span className="text-xs font-semibold text-slate-500">Memuat rincian klasifikasi dari server...</span>
            </div>
          ) : currentNode ? (
            /* ========================================================= */
            /* VIEW 2: DETAIL KLASIFIKASI & DAFTAR TURUNAN (DRILL-DOWN) */
            /* ========================================================= */
            <section className="space-y-6">
              {/* Breadcrumb Navigation Bar Sesuai Desain Modern */}
              <nav className="flex items-center flex-wrap gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs text-xs">
                <button
                  onClick={handleBackToAllCategories}
                  className="font-extrabold px-3 py-1.5 rounded-full bg-[#201E50] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Semua Kategori</span>
                </button>

                {currentNode.breadcrumb && currentNode.breadcrumb.map((crumb, idx) => {
                  const isLast = idx === currentNode.breadcrumb.length - 1;
                  const levelColorClass =
                    LEVEL_BADGE_STYLES[crumb.level] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <React.Fragment key={crumb.kode}>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      <button
                        disabled={isLast}
                        onClick={() => handleSelectCode(crumb.kode)}
                        title={crumb.judul}
                        className={`transition-all px-3 py-1.5 rounded-full border text-xs font-extrabold ${
                          isLast
                            ? 'bg-[#201E50] text-white border-[#201E50] shadow-xs'
                            : `hover:scale-105 cursor-pointer shadow-xs ${levelColorClass}`
                        }`}
                      >
                        {crumb.level === 'kategori' ? `Kategori ${crumb.kode}` : crumb.kode}
                      </button>
                    </React.Fragment>
                  );
                })}
              </nav>

              {/* ACTIVE NODE HERO CARD */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${activeVisual.bgPastel} ${activeVisual.textColor}`}>
                      <ActiveIcon className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm px-3 py-1 rounded-full bg-[#201E50] text-white">
                          {currentNode.kode}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${LEVEL_BADGE_STYLES[currentNode.level] || 'bg-indigo-100 text-indigo-800'}`}>
                          {LEVEL_NAMES[currentNode.level] || currentNode.level}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          Kategori {currentNode.kategori_kode} • {activeVisual.shortLabel}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1E1B4B] leading-snug">
                        {currentNode.judul}
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(currentNode.kode, currentNode.kode)}
                    className="px-4 py-2.5 rounded-full text-xs font-extrabold bg-[#F4F5FA] text-[#1E1B4B] hover:bg-slate-200/80 transition-colors flex items-center gap-1.5 self-start shrink-0 cursor-pointer"
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
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                    {parsedDefinition.mainBlocks.length > 0 ? (
                      parsedDefinition.mainBlocks.map((block, bIdx) =>
                        block.type === 'paragraph' ? (
                          <p key={bIdx} className="leading-relaxed">
                            {renderTextWithKbliLinks(block.text, false)}
                          </p>
                        ) : (
                          <div key={bIdx} className="space-y-2">
                            {block.header && (
                              <div className="font-bold text-[#1E1B4B]">
                                {renderTextWithKbliLinks(block.header, false)}
                              </div>
                            )}
                            <ul className="space-y-1.5 pl-2">
                              {block.items.map((itemText, iIdx) => (
                                <li key={iIdx} className="flex items-start gap-2 text-slate-600">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                  <span>{renderTextWithKbliLinks(itemText.charAt(0).toUpperCase() + itemText.slice(1), false)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )
                    ) : (
                      <p className="italic text-slate-400">Tidak ada deskripsi rincian tambahan pada tingkat ini.</p>
                    )}
                  </div>

                  {/* Exclusions Box */}
                  {parsedDefinition.exclusionBlocks.length > 0 && isExpandedDefinition && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs sm:text-sm space-y-2.5"
                    >
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Batasan & Pengecualian Klasifikasi (Tidak Mencakup):</span>
                      </div>
                      <div className="space-y-2.5">
                        {parsedDefinition.exclusionBlocks.map((block, bIdx) =>
                          block.type === 'paragraph' ? (
                            <p key={bIdx} className="leading-relaxed text-amber-900">
                              {renderTextWithKbliLinks(block.text, true)}
                            </p>
                          ) : (
                            <div key={bIdx} className="space-y-2">
                              {block.header && (
                                <div className="font-bold text-amber-900">
                                  {renderTextWithKbliLinks(block.header, true)}
                                </div>
                              )}
                              <ul className="space-y-1.5 pl-2">
                                {block.items.map((itemText, iIdx) => (
                                  <li key={iIdx} className="flex items-start gap-2 text-amber-900">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span>{renderTextWithKbliLinks(itemText.charAt(0).toUpperCase() + itemText.slice(1), true)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Toggle Baca Lengkap */}
                  {(currentNode.deskripsi.length > 200 || parsedDefinition.exclusions) && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => setIsExpandedDefinition(!isExpandedDefinition)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        <span>{isExpandedDefinition ? 'Baca Lebih Ringkas' : 'Baca Lengkap Konsep & Definisi'}</span>
                        {isExpandedDefinition ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <a
                        href="https://oss.go.id/id/kbli"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-[#1E1B4B] transition-colors"
                      >
                        <span>Cek Perizinan OSS</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Indikator 5 Digit */}
                  {(!currentNode.children || currentNode.children.length === 0 || currentNode.level === 'kelompok') && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-black">Standar Pencacahan BPS: </span>
                        <span>Kode 5-digit ini merupakan tingkat operasional final yang wajib digunakan pada kuesioner BPS.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DAFTAR TURUNAN */}
              {currentNode.children && currentNode.children.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-base font-black text-[#1E1B4B]">
                      {CHILD_SECTION_TITLES[currentNode.level] || 'Daftar Sub-Klasifikasi'}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs bg-white text-indigo-700 border border-slate-100 font-extrabold shadow-xs">
                      {currentNode.children.length} entitas
                    </span>
                  </div>

                  <div className="space-y-3">
                    {currentNode.children.map((child) => {
                      const childVisual = CATEGORY_VISUALS[currentNode.kategori_kode] || DEFAULT_VISUAL;
                      const ChildIcon = childVisual.icon;

                      return (
                        <motion.article
                          key={child.kode}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleSelectCode(child.kode, child.judul, child.level)}
                          className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                        >
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div
                              className={`w-12 h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center shrink-0 border ${childVisual.bgPastel} ${childVisual.textColor} ${childVisual.borderColor} group-hover:scale-105 transition-transform`}
                            >
                              <ChildIcon className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-black text-xs md:text-sm px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
                                  {child.kode}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(child.kode, child.kode);
                                  }}
                                  title="Salin Kode KBLI"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                >
                                  {copiedCode === child.kode ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-600 font-bold">Tersalin</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-400" />
                                      <span>Salin Kode</span>
                                    </>
                                  )}
                                </button>
                                <h4 className="font-bold text-sm md:text-base text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                  {child.judul}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${LEVEL_BADGE_STYLES[child.level] || 'bg-slate-100 text-slate-600'}`}>
                                  {LEVEL_NAMES[child.level] || child.level}
                                </span>
                              </div>

                              <p className="text-xs md:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                {formatSnippetPreview(child.snippet || child.deskripsi)}
                              </p>

                              {child.child_count > 0 && (
                                <div className="pt-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
                                    <Layers className="w-3 h-3 text-indigo-500" />
                                    <span>{child.child_count} turunan klasifikasi</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0">
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs">
                              <span>Lihat Definisi &amp; Turunan</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          ) : (
            /* ========================================================= */
            /* VIEW 3: BERANDA KBLI 2025 (DESAIN SESUAI GAMBAR REFERENSI) */
            /* ========================================================= */
            <div className="space-y-6 flex flex-col">
              {/* GREETING HEADLINE & SUBTITLE (SESUAI GAMBAR: Good morning, Dr.Olivia) */}
              <div className="order-1 pt-2 pb-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-[#191614] tracking-tight">
                    {getGreeting(user?.name)}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                    Klasifikasi Baku Lapangan Usaha Indonesia 2025. Telusuri 22 kategori resmi BPS, 88 golongan pokok, dan 1.849 kelompok usaha secara terpadu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors self-start md:self-end shrink-0 cursor-pointer"
                >
                  <span>Buka Panduan &amp; Aturan</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 3 CARDS STATISTIK / METRIK PASTEL (PERSIS LAYOUT GAMBAR REFERENSI) */}
              {/* Pada tampilan HP (mobile) pindah ke bagian paling bawah (order-3), pada tampilan desktop tetap di atas (lg:order-2) */}
              <div className="order-3 lg:order-2 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {/* Card 1: Kuning Mustard Lembut (Patients style) */}
                <div className="p-5 rounded-[26px] bg-[#F6DE72] text-[#282208] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[168px]">
                  {/* Decorative Cross Shape in Top Right */}
                  <div className="absolute -top-3 -right-3 w-16 h-16 pointer-events-none opacity-25">
                    <div className="w-full h-full relative">
                      <div className="absolute top-1/2 left-0 w-full h-4 -translate-y-1/2 bg-[#282208] rounded-full rotate-45" />
                      <div className="absolute top-0 left-1/2 w-4 h-full -translate-x-1/2 bg-[#282208] rounded-full rotate-45" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-[#282208]">
                      Kategori Lapangan Usaha:
                    </h3>
                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      <div>
                        <div className="text-base sm:text-lg font-black leading-none">22</div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">sektor</div>
                        <div className="text-[9px] opacity-60">A - V</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-black leading-none">88</div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">pokok</div>
                        <div className="text-[9px] opacity-60">2-Digit</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-black leading-none">1.849</div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">kelompok</div>
                        <div className="text-[9px] opacity-60">5-Digit</div>
                      </div>
                    </div>
                  </div>

                  {/* Minimalist Vertical Bar Chart Decoration (Sesuai Gambar Referensi) */}
                  <div className="pt-4 flex items-end gap-1.5 h-11">
                    <div className="w-1.5 h-6 bg-[#282208]/30 rounded-full" />
                    <div className="w-1.5 h-4 bg-[#282208]/30 rounded-full" />
                    <div className="w-1.5 h-8 bg-[#282208] rounded-full" />
                    <div className="w-1.5 h-5 bg-[#282208]/40 rounded-full" />
                    <div className="w-1.5 h-10 bg-[#282208] rounded-full" />
                    <div className="w-1.5 h-6 bg-[#282208]/40 rounded-full" />
                    <div className="w-1.5 h-7 bg-[#282208] rounded-full" />
                    <div className="w-1.5 h-3 bg-[#282208]/30 rounded-full" />
                  </div>
                </div>

                {/* Card 2: Pink Lembut (Visits summary style) */}
                <div className="p-5 rounded-[26px] bg-[#F9BCD4] text-[#401227] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[168px]">
                  {/* Decorative Heart Shape */}
                  <div className="absolute top-2 right-2 w-12 h-12 pointer-events-none opacity-20">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#401227]">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-[#401227]">
                      Hierarki Struktur KBLI:
                    </h3>
                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      <div>
                        <div className="text-base sm:text-lg font-black leading-none">5 Level</div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">HIERARKI</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-black leading-none">2 Digit</div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">GOLONGAN</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-black leading-none">5 Digit</div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">KELOMPOK</div>
                      </div>
                    </div>
                  </div>

                  {/* Smooth Wave Path with Dot Peak (Sesuai Gambar Referensi) */}
                  <div className="pt-2 relative h-11 flex items-center">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 160 36" fill="none">
                      <path
                        d="M0 24 Q 25 32, 50 16 T 95 8 T 130 20 T 160 14"
                        stroke="#401227"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <circle cx="95" cy="8" r="3.5" fill="#401227" />
                    </svg>
                  </div>
                </div>

                {/* Card 3: Hijau Sage Lembut (By condition style) */}
                <div className="p-5 rounded-[26px] bg-[#B3C88D] text-[#1D2F0E] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[168px]">
                  {/* Decorative Geometric Shape */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 pointer-events-none opacity-20">
                    <div className="w-full h-full bg-[#1D2F0E] rounded-2xl rotate-12" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-[#1D2F0E]">
                      Standar Resmi KBLI 2025:
                    </h3>
                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      <div>
                        <div className="text-base sm:text-lg font-black leading-none">BPS RI</div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">RESMI</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-black leading-none">OSS-RBA</div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">TERINTEGRASI</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-lg font-black leading-none">ISIC Rev.5</div>
                        <div className="text-[10px] font-bold opacity-75 mt-0.5">INTERNASIONAL</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-2 text-[10px] font-bold opacity-70">
                    <span>Terhubung dengan Peraturan BPS No. 7 Tahun 2025</span>
                  </div>
                </div>
              </div>

              {/* BAGIAN BAWAH: DUA KOLOM LAYOUT (SESUAI GAMBAR "Patient's list" & "Visit details") */}
              {/* Pada tampilan HP (mobile) berada di atas kartu (order-2), pada tampilan desktop berada di bawah kartu (lg:order-3) */}
              <div className="order-2 lg:order-3 grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                {/* KOLOM KIRI: LIST KATEGORI KBLI (A - V) BERBENTUK BAR BERTINGKAT PASTEL (60%) */}
                <div className="lg:col-span-7 space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-black text-[#191614]">
                      Daftar Kategori KBLI
                    </h2>
                    <span className="text-xs font-bold text-slate-500 bg-white/80 border border-slate-200/80 px-3 py-1 rounded-full shadow-2xs">
                      Semua Kategori (22)
                    </span>
                  </div>

                  {loadingCategories ? (
                    <div className="min-h-[220px] flex flex-col items-center justify-center p-8 bg-white/80 rounded-[28px] border border-slate-200/80 shadow-xs">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                      <p className="text-sm font-bold text-slate-600">Memuat kategori KBLI 2025...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((cat, idx) => {
                        const visual = CATEGORY_VISUALS[cat.code] || DEFAULT_VISUAL;
                        const IconComp = visual.icon;
                        const isSelected = previewCategoryCode === cat.code;

                        // Palet pastel selang-seling baris sesuai referensi gambar
                        const pastelPalettes = [
                          { bg: 'bg-[#FCE7F3]', border: 'border-pink-200/80', text: 'text-pink-950', badge: 'bg-white/90 text-pink-900', iconColor: 'text-pink-700' },
                          { bg: 'bg-[#E0F2FE]', border: 'border-sky-200/80', text: 'text-sky-950', badge: 'bg-white/90 text-sky-900', iconColor: 'text-sky-700' },
                          { bg: 'bg-[#FFEDD5]', border: 'border-orange-200/80', text: 'text-orange-950', badge: 'bg-white/90 text-orange-900', iconColor: 'text-orange-700' },
                          { bg: 'bg-[#DCFCE7]', border: 'border-emerald-200/80', text: 'text-emerald-950', badge: 'bg-white/90 text-emerald-900', iconColor: 'text-emerald-700' },
                          { bg: 'bg-[#EDE9FE]', border: 'border-purple-200/80', text: 'text-purple-950', badge: 'bg-white/90 text-purple-900', iconColor: 'text-purple-700' },
                          { bg: 'bg-[#FEF3C7]', border: 'border-amber-200/80', text: 'text-amber-950', badge: 'bg-white/90 text-amber-900', iconColor: 'text-amber-700' },
                        ];
                        const palette = pastelPalettes[idx % pastelPalettes.length];

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
                            title={`Klik untuk melihat rincian, konsep definisi & turunan Kategori ${cat.code}`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Bulatan Putih Icon */}
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs">
                                <IconComp className={`w-5 h-5 ${palette.iconColor}`} />
                              </div>

                              <div className="min-w-0">
                                <h3 className={`font-black text-sm truncate ${palette.text}`}>
                                  {cat.code} • {cat.title}
                                </h3>
                                <p className="text-[11px] font-semibold text-slate-600 truncate">
                                  {cat.total_golongan_pokok} Golongan Pokok • {cat.total_kelompok} Kelompok
                                </p>
                              </div>
                            </div>

                            {/* Badge Pill di sebelah kanan (Sesuai 09:15 AM style di gambar) */}
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full ${palette.badge} shadow-2xs`}>
                                Kat {cat.code}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* KOLOM KANAN: CARD RINCIAN DETAIL (SESUAI "Visit details" PINK CARD DI GAMBAR REFERENSI) (40%) */}
                <div className="lg:col-span-5">
                  {(() => {
                    const selCat = categories.find(c => c.code === previewCategoryCode) || categories[0];
                    if (!selCat) return null;
                    const visual = CATEGORY_VISUALS[selCat.code] || DEFAULT_VISUAL;
                    const IconComp = visual.icon;

                    return (
                      <div className="p-6 sm:p-7 rounded-[28px] bg-[#F9BCD4] text-[#3F1125] shadow-xs space-y-5 sticky top-6">
                        {/* Header dengan Title dan Badge Kode Putih (Sesuai 1EG4-TE5-MK72 di gambar) */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="text-xl sm:text-2xl font-black text-[#3F1125] leading-snug">
                              Kategori {selCat.code}
                            </h3>
                            <p className="text-xs font-bold text-[#3F1125]/80">
                              {selCat.title}
                            </p>
                          </div>
                          <span className="font-mono text-xs font-black px-3 py-1 rounded-full bg-white text-[#3F1125] shadow-2xs shrink-0">
                            KBLI-KAT-{selCat.code}
                          </span>
                        </div>

                        {/* Tag Pill Filter (Sesuai Fever | Caught | Heart Burn di gambar) */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#3F1125]/15 text-[#3F1125]">
                            #SektorResmiBPS
                          </span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#3F1125]/15 text-[#3F1125]">
                            #KBLI2025
                          </span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#3F1125]/15 text-[#3F1125]">
                            #HierarkiKBLI
                          </span>
                        </div>

                        {/* Rincian Spesifikasi Terstruktur (Teks Sebagian dengan Tombol Expand/Collapse) */}
                        <div className="space-y-3 pt-2 border-t border-[#3F1125]/15 text-xs text-[#3F1125]/90">
                          <div>
                            <span className="font-bold opacity-75 block text-[11px]">Cakupan Lapangan Usaha:</span>
                            <p className="mt-0.5 leading-relaxed font-medium">
                              {(() => {
                                const desc = selCat.description || 'Mencakup seluruh aktivitas kegiatan ekonomi yang tergolong dalam kategori ini sesuai standar klasifikasi BPS 2025.';
                                if (isDescriptionExpanded || desc.length <= 140) {
                                  return desc;
                                }
                                return `${desc.slice(0, 140)}...`;
                              })()}
                            </p>
                            {selCat.description && selCat.description.length > 140 && (
                              <button
                                type="button"
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="mt-1.5 text-[11px] font-black underline hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>{isDescriptionExpanded ? 'Tampilkan Lebih Sedikit' : 'Lihat Selengkapnya'}</span>
                                {isDescriptionExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="p-3 rounded-2xl bg-white/50 space-y-0.5">
                              <span className="text-[10px] font-bold opacity-70 block">Golongan Pokok</span>
                              <span className="text-base font-black text-[#3F1125]">
                                {selCat.total_golongan_pokok} Golongan
                              </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/50 space-y-0.5">
                              <span className="text-[10px] font-bold opacity-70 block">Kelompok Usaha</span>
                              <span className="text-base font-black text-[#3F1125]">
                                {selCat.total_kelompok} Kode (5-Digit)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tombol Action Utama (Jelajahi Golongan Pokok) */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleSelectCode(selCat.code)}
                            className="w-full py-3.5 px-5 rounded-2xl bg-[#3F1125] text-white font-extrabold text-xs sm:text-sm hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
                          >
                            <span>Jelajahi Golongan Pokok ({selCat.total_golongan_pokok} Golongan)</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* 3. MODAL POP-UP PANDUAN PENGGUNAAN KBLI 2025 */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isGuideOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsGuideOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[88vh] bg-white rounded-[28px] border border-slate-100 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-[#201E50] px-6 py-5 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight">
                      Panduan Penggunaan KBLI 2025 Garda Data
                    </h2>
                    <p className="text-xs text-indigo-200">
                      Ringkas, akurat, dan terintegrasi dengan Rekomendasi Nama Usaha KBLI 2025
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Tutup panduan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700">
                {/* 4 Langkah Utama */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-amber-900">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shrink-0">1</span>
                      <span>Pencarian Cepat Nama Usaha</span>
                    </div>
                    <p className="text-xs leading-relaxed text-amber-950">
                      Ketik langsung <strong>nama usaha responden</strong> (misal: <em>&ldquo;Toko Sembako Berkah&rdquo;</em>, <em>&ldquo;Bengkel Motor&rdquo;</em>), <strong>komoditas</strong>, atau <strong>kode KBLI</strong>. Sistem otomatis menampilkan <strong>Rekomendasi KBLI (5-Digit)</strong> di urutan teratas.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-indigo-900">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0">2</span>
                      <span>Penelusuran Hierarki (Drill-Down)</span>
                    </div>
                    <p className="text-xs leading-relaxed text-indigo-950">
                      Klik salah satu dari <strong>22 Blok Kategori (A–V)</strong> untuk menelusuri turunan secara bertingkat hingga ke tingkat <strong>Kelompok (5-Digit)</strong>. Gunakan <strong>baris navigasi (Breadcrumb)</strong> untuk melompat antar-level dengan cepat.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-emerald-900">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center shrink-0">3</span>
                      <span>Cakupan vs Pengecualian</span>
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-950">
                      Perhatikan kotak <strong>Cakupan Utama</strong> dan <strong>Batasan / Tidak Mencakup</strong>. Jika kegiatan usaha masuk di daftar pengecualian, klik langsung <strong>badge kode rujukan</strong> untuk berpindah ke KBLI yang tepat.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-rose-900">
                      <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center shrink-0">4</span>
                      <span>Salin Kode 5-Digit (Standar KBLI 2025)</span>
                    </div>
                    <p className="text-xs leading-relaxed text-rose-950">
                      Isian kuesioner sensus/survei dan perizinan OSS wajib menggunakan <strong>Kode 5-Digit (Kelompok)</strong>. Klik tombol <strong>&ldquo;Salin Kode&rdquo;</strong> untuk menyalin kode ke <em>clipboard</em>.
                    </p>
                  </div>
                </div>

                {/* Struktur 5 Level Hierarki KBLI 2025 */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center gap-2 font-extrabold text-[#1E1B4B] text-xs sm:text-sm">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    <span>Mengenal 5 Tingkat Struktur Kode KBLI 2025:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-purple-100 text-purple-900 border border-purple-200">
                      <div className="font-black">1. Kategori</div>
                      <div className="font-mono text-xs font-bold mt-0.5">Huruf A – V</div>
                      <div className="opacity-80 mt-0.5">Sektor Utama (22 Kat)</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-100 text-sky-900 border border-sky-200">
                      <div className="font-black">2. Gol. Pokok</div>
                      <div className="font-mono text-xs font-bold mt-0.5">2 Digit (01)</div>
                      <div className="opacity-80 mt-0.5">Cabang Kegiatan</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200">
                      <div className="font-black">3. Golongan</div>
                      <div className="font-mono text-xs font-bold mt-0.5">3 Digit (011)</div>
                      <div className="opacity-80 mt-0.5">Kelompok Aktivitas</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
                      <div className="font-black">4. Subgolongan</div>
                      <div className="font-mono text-xs font-bold mt-0.5">4 Digit (0112)</div>
                      <div className="opacity-80 mt-0.5">Rincian Sub-Sektor</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-100 text-rose-900 border border-rose-200">
                      <div className="font-black">5. Kelompok ★</div>
                      <div className="font-mono text-xs font-bold mt-0.5">5 Digit (01122)</div>
                      <div className="opacity-80 mt-0.5">Kode Resmi BPS</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-semibold text-slate-500">
                  Tip: Gunakan kata kunci aktivitas utama + komoditas untuk hasil paling presisi.
                </span>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-black bg-[#201E50] text-white hover:bg-[#2C296B] transition-colors cursor-pointer shadow-sm"
                >
                  Mengerti & Mulai Cari
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
