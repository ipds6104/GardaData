import React, { useState, useEffect, useMemo } from 'react';
import {
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
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_KBLI_CATEGORIES } from './kbliCategoriesData';

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

interface SearchResponse {
  total: number;
  total_kelompok?: number;
  execution_time_ms?: number;
  page: number;
  limit: number;
  totalPages: number;
  items: SearchResultItem[];
}

interface Kbli2025ModuleProps {
  onBack: () => void;
}

// ==========================================
// CATEGORY VISUAL CONFIGURATION (PASTEL CARDS)
// ==========================================

interface CategoryVisual {
  icon: React.ElementType;
  bgPastel: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  shortLabel: string;
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  A: { icon: Sprout, bgPastel: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800/60', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50', badgeText: 'text-emerald-700 dark:text-emerald-300', shortLabel: 'Pertanian & Perikanan' },
  B: { icon: Mountain, bgPastel: 'bg-amber-50 dark:bg-amber-950/40', textColor: 'text-amber-800 dark:text-amber-400', borderColor: 'border-amber-200 dark:border-amber-800/60', badgeBg: 'bg-amber-50 dark:bg-amber-950/50', badgeText: 'text-amber-800 dark:text-amber-300', shortLabel: 'Pertambangan' },
  C: { icon: Factory, bgPastel: 'bg-orange-50 dark:bg-orange-950/40', textColor: 'text-orange-700 dark:text-orange-400', borderColor: 'border-orange-200 dark:border-orange-800/60', badgeBg: 'bg-orange-50 dark:bg-orange-950/50', badgeText: 'text-orange-700 dark:text-orange-300', shortLabel: 'Industri Pengolahan' },
  D: { icon: Zap, bgPastel: 'bg-yellow-50 dark:bg-yellow-950/40', textColor: 'text-yellow-800 dark:text-yellow-400', borderColor: 'border-yellow-200 dark:border-yellow-800/60', badgeBg: 'bg-yellow-50 dark:bg-yellow-950/50', badgeText: 'text-yellow-800 dark:text-yellow-300', shortLabel: 'Listrik & Gas' },
  E: { icon: Recycle, bgPastel: 'bg-teal-50 dark:bg-teal-950/40', textColor: 'text-teal-700 dark:text-teal-400', borderColor: 'border-teal-200 dark:border-teal-800/60', badgeBg: 'bg-teal-50 dark:bg-teal-950/50', badgeText: 'text-teal-700 dark:text-teal-300', shortLabel: 'Air & Pengolahan Sampah' },
  F: { icon: HardHat, bgPastel: 'bg-sky-50 dark:bg-sky-950/40', textColor: 'text-sky-700 dark:text-sky-400', borderColor: 'border-sky-200 dark:border-sky-800/60', badgeBg: 'bg-sky-50 dark:bg-sky-950/50', badgeText: 'text-sky-700 dark:text-sky-300', shortLabel: 'Konstruksi' },
  G: { icon: ShoppingBag, bgPastel: 'bg-blue-50 dark:bg-blue-950/40', textColor: 'text-blue-700 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800/60', badgeBg: 'bg-blue-50 dark:bg-blue-950/50', badgeText: 'text-blue-700 dark:text-blue-300', shortLabel: 'Perdagangan & Reparasi' },
  H: { icon: Truck, bgPastel: 'bg-indigo-50 dark:bg-indigo-950/40', textColor: 'text-indigo-700 dark:text-indigo-400', borderColor: 'border-indigo-200 dark:border-indigo-800/60', badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50', badgeText: 'text-indigo-700 dark:text-indigo-300', shortLabel: 'Pengangkutan & Gudang' },
  I: { icon: Utensils, bgPastel: 'bg-rose-50 dark:bg-rose-950/40', textColor: 'text-rose-700 dark:text-rose-400', borderColor: 'border-rose-200 dark:border-rose-800/60', badgeBg: 'bg-rose-50 dark:bg-rose-950/50', badgeText: 'text-rose-700 dark:text-rose-300', shortLabel: 'Akomodasi & Kuliner' },
  J: { icon: Wifi, bgPastel: 'bg-cyan-50 dark:bg-cyan-950/40', textColor: 'text-cyan-700 dark:text-cyan-400', borderColor: 'border-cyan-200 dark:border-cyan-800/60', badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50', badgeText: 'text-cyan-700 dark:text-cyan-300', shortLabel: 'Informasi & Komunikasi' },
  K: { icon: Landmark, bgPastel: 'bg-purple-50 dark:bg-purple-950/40', textColor: 'text-purple-700 dark:text-purple-400', borderColor: 'border-purple-200 dark:border-purple-800/60', badgeBg: 'bg-purple-50 dark:bg-purple-950/50', badgeText: 'text-purple-700 dark:text-purple-300', shortLabel: 'Keuangan & Asuransi' },
  L: { icon: Building2, bgPastel: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-800 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800/60', badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50', badgeText: 'text-emerald-800 dark:text-emerald-300', shortLabel: 'Real Estat' },
  M: { icon: Briefcase, bgPastel: 'bg-violet-50 dark:bg-violet-950/40', textColor: 'text-violet-700 dark:text-violet-400', borderColor: 'border-violet-200 dark:border-violet-800/60', badgeBg: 'bg-violet-50 dark:bg-violet-950/50', badgeText: 'text-violet-700 dark:text-violet-300', shortLabel: 'Profesional & Ilmiah' },
  N: { icon: ShieldCheck, bgPastel: 'bg-slate-100 dark:bg-slate-800', textColor: 'text-slate-700 dark:text-slate-300', borderColor: 'border-slate-200 dark:border-slate-700', badgeBg: 'bg-slate-100 dark:bg-slate-800', badgeText: 'text-slate-700 dark:text-slate-300', shortLabel: 'Penunjang Usaha' },
  O: { icon: Scale, bgPastel: 'bg-blue-50 dark:bg-blue-950/40', textColor: 'text-blue-800 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-800/60', badgeBg: 'bg-blue-50 dark:bg-blue-950/50', badgeText: 'text-blue-800 dark:text-blue-300', shortLabel: 'Pemerintahan & Sos' },
  P: { icon: GraduationCap, bgPastel: 'bg-red-50 dark:bg-red-950/40', textColor: 'text-red-700 dark:text-red-400', borderColor: 'border-red-200 dark:border-red-800/60', badgeBg: 'bg-red-50 dark:bg-red-950/50', badgeText: 'text-red-700 dark:text-red-300', shortLabel: 'Pendidikan' },
  Q: { icon: HeartPulse, bgPastel: 'bg-pink-50 dark:bg-pink-950/40', textColor: 'text-pink-700 dark:text-pink-400', borderColor: 'border-pink-200 dark:border-pink-800/60', badgeBg: 'bg-pink-50 dark:bg-pink-950/50', badgeText: 'text-pink-700 dark:text-pink-300', shortLabel: 'Kesehatan & Sosial' },
  R: { icon: Palette, bgPastel: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', textColor: 'text-fuchsia-700 dark:text-fuchsia-400', borderColor: 'border-fuchsia-200 dark:border-fuchsia-800/60', badgeBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/50', badgeText: 'text-fuchsia-700 dark:text-fuchsia-300', shortLabel: 'Kesenian & Rekreasi' },
  S: { icon: Sparkles, bgPastel: 'bg-lime-50 dark:bg-lime-950/40', textColor: 'text-lime-800 dark:text-lime-400', borderColor: 'border-lime-200 dark:border-lime-800/60', badgeBg: 'bg-lime-50 dark:bg-lime-950/50', badgeText: 'text-lime-800 dark:text-lime-300', shortLabel: 'Jasa Lainnya' },
  T: { icon: Users, bgPastel: 'bg-orange-50 dark:bg-orange-950/40', textColor: 'text-orange-800 dark:text-orange-300', borderColor: 'border-orange-200 dark:border-orange-800/60', badgeBg: 'bg-orange-50 dark:bg-orange-950/50', badgeText: 'text-orange-800 dark:text-orange-300', shortLabel: 'Rumah Tangga' },
  U: { icon: Globe, bgPastel: 'bg-sky-50 dark:bg-sky-950/40', textColor: 'text-sky-800 dark:text-sky-300', borderColor: 'border-sky-200 dark:border-sky-800/60', badgeBg: 'bg-sky-50 dark:bg-sky-950/50', badgeText: 'text-sky-800 dark:text-sky-300', shortLabel: 'Badan Internasional' }
};

const DEFAULT_VISUAL: CategoryVisual = {
  icon: BookOpen,
  bgPastel: 'bg-slate-50 dark:bg-slate-800',
  textColor: 'text-slate-700 dark:text-slate-300',
  borderColor: 'border-slate-200 dark:border-slate-700',
  badgeBg: 'bg-slate-100 dark:bg-slate-800',
  badgeText: 'text-slate-700 dark:text-slate-300',
  shortLabel: 'Klasifikasi Usaha'
};

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

// Pisahkan bagian cakupan utama (main) dan bagian batasan/pengecualian (exclusions) secara utuh per kalimat
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

// Ubah teks deskripsi menjadi blok-blok paragraf dan daftar butir (list) terstruktur
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
        let itemText = rawItems[i].trim();
        if (i === rawItems.length - 1) {
          const proseSplit = itemText.match(/^([\s\S]+?\.)\s+([A-Z][\s\S]+)$/);
          if (proseSplit) {
            itemText = proseSplit[1].trim();
            trailingProse = proseSplit[2].trim();
          }
        }
        itemText = itemText.replace(/[;,\s]+$/, '').trim();
        if (itemText) {
          cleanItems.push(itemText);
        }
      }

      if (cleanItems.length > 0) {
        blocks.push({
          type: 'list',
          header: introHeader,
          items: cleanItems
        });
      } else if (introHeader) {
        blocks.push({ type: 'paragraph', text: introHeader });
      }

      remaining = trailingProse;
    }
  }

  return blocks;
};

// Rapikan snippet ringkas pada kartu pencarian/turunan agar tanda "- " menjadi bullet "• "
const formatSnippetPreview = (raw?: string | null): string => {
  if (!raw) return '';
  return cleanKbliRawText(raw)
    .replace(/\s*;\s*-\s+/g, ' • ')
    .replace(/(?<=mencakup|termasuk|seperti|meliputi|berikut|lain|:)\s*-\s+/gi, ': • ')
    .replace(/\s+-\s+/g, ' • ');
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export const Kbli2025Module: React.FC<Kbli2025ModuleProps> = ({ onBack }) => {
  // Navigation / Hierarchical View State
  // When currentNode is null -> View = Root (22 Category Blocks)
  // When currentNode is loaded -> View = Current Level detail + list of children below it!
  const [currentNode, setCurrentNode] = useState<KbliDetail | null>(null);
  const [loadingNode, setLoadingNode] = useState<boolean>(false);

  // Initial Root Categories
  const [categories, setCategories] = useState<KbliCategory[]>(INITIAL_KBLI_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [nodeError, setNodeError] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  // Search Mode State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  // "Baca Lengkap" vs "Baca Sebagian" State for the active definition card
  const [isExpandedDefinition, setIsExpandedDefinition] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load root categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch('/api/kbli/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.warn('Gagal memuat kategori KBLI:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Debounce search query (Ultra-responsive)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 180);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle search when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults(null);
      return;
    }

    let isCancelled = false;
    const executeSearch = async () => {
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

  // Navigate to a specific code (drill-down or jump via breadcrumb)
  const handleSelectCode = async (kode: string) => {
    setActiveCode(kode);
    setLoadingNode(true);
    setNodeError(null);
    setIsExpandedDefinition(false);
    // Clear search if selecting an item
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchResults(null);

    try {
      const res = await fetch(`/api/kbli/detail/${encodeURIComponent(kode)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentNode(data);
        // Buka deskripsi penuh secara otomatis untuk kelompok (5-digit), subgolongan, golongan, atau bila memiliki rincian list/pengecualian yang ringkas
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
        // Scroll smoothly to top of content
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

  // Back to Root (22 Category Blocks)
  const handleBackToAllCategories = () => {
    setCurrentNode(null);
    setIsExpandedDefinition(false);
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchResults(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back one level in the hierarchy
  const handleBackOneLevel = () => {
    if (!currentNode || !currentNode.breadcrumb || currentNode.breadcrumb.length <= 1) {
      handleBackToAllCategories();
      return;
    }
    // Previous parent node in breadcrumb
    const parentIndex = currentNode.breadcrumb.length - 2;
    const parentNode = currentNode.breadcrumb[parentIndex];
    if (parentNode) {
      handleSelectCode(parentNode.kode);
    } else {
      handleBackToAllCategories();
    }
  };

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Separate definition into structured blocks of main scope and exclusions ("Tidak mencakup..." / "Tidak termasuk...")
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

  // Render teks dengan tautan otomatis ke kode KBLI rujukan (misal: "lihat subgolongan 4730", "lihat golongan 953", "lihat kategori C")
  const renderTextWithKbliLinks = (text: string, isExclusion = false) => {
    if (!text) return null;
    const refRegex =
      /\b((?:lihat\s+)?(?:kategori|golongan\s+pokok|subgolongan|golongan|kelompok)\s+)([A-U]|\d{2,5})\b|\b(lihat\s+)(\d{2,5})\b/gi;

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
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md font-mono font-bold text-xs transition-all cursor-pointer underline decoration-dotted underline-offset-2 ${
            isExclusion
              ? 'bg-amber-200/70 hover:bg-amber-300 text-amber-950 dark:bg-amber-900/60 dark:hover:bg-amber-800 dark:text-amber-100'
              : 'bg-primary-100/80 hover:bg-primary-200 text-primary-800 dark:bg-primary-900/50 dark:hover:bg-primary-800 dark:text-primary-200'
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

  // Visual style for current active node
  const activeVisual = CATEGORY_VISUALS[currentNode?.kategori_kode || ''] || DEFAULT_VISUAL;
  const ActiveIcon = activeVisual.icon;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100">
      {/* ========================================================= */}
      {/* HEADER: CLEAN TITLE (EXACT USER REQUIREMENT) */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                if (currentNode) {
                  handleBackOneLevel();
                } else {
                  onBack();
                }
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={currentNode ? 'Kembali ke Tingkat Sebelumnya' : 'Kembali ke Beranda'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Klasifikasi Baku Lapangan Usaha Indonesia 2025
            </h1>
          </div>

          {/* Quick Root Reset if inside a category */}
          {currentNode && (
            <button
              onClick={handleBackToAllCategories}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lihat Semua Kategori</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* Node Error Banner if any */}
        {nodeError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{nodeError}</span>
            </div>
            {activeCode && (
              <button
                onClick={() => handleSelectCode(activeCode)}
                className="px-3 py-1.5 rounded-xl font-bold bg-rose-600 text-white text-xs hover:bg-rose-700 transition-colors shrink-0 shadow-2xs"
              >
                Coba Lagi
              </button>
            )}
          </div>
        )}

        {/* Global Search Bar */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-3 md:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode (misal: 01111), nama kegiatan usaha, atau kata kunci konsep & definisi..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  setSearchResults(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* VIEW 1: SEARCH RESULTS VIEW (IF USER TYPES A SEARCH QUERY) */}
        {/* ========================================================= */}
        {debouncedQuery ? (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Hasil Pencarian Kata Kunci: <span className="text-primary-600 font-extrabold">"{debouncedQuery}"</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mencari pada kode, judul, serta deskripsi & contoh komoditas BPS
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {searchResults?.execution_time_ms !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    ⚡ {searchResults.execution_time_ms} ms
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  {searchResults?.total_kelompok ?? searchResults?.items.filter(i => i.digit === 5).length ?? 0} Kategori 5-Digit (Prioritas Teratas)
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Total {searchResults?.total || 0} entitas
                </span>
              </div>
            </div>

            {loadingSearch ? (
              <div className="min-h-[240px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Loader2 className="w-7 h-7 text-primary-600 animate-spin mb-2" />
                <span className="text-xs text-slate-500">Mencari klasifikasi di server...</span>
              </div>
            ) : searchResults && searchResults.items.length > 0 ? (
              <div className="space-y-3">
                {searchResults.items.map((item) => {
                  const visual = CATEGORY_VISUALS[item.kategori_kode] || DEFAULT_VISUAL;
                  const IconComp = visual.icon;
                  const is5Digit = item.digit === 5 || item.level === 'kelompok';

                  return (
                    <article
                      key={`${item.level}-${item.kode}`}
                      onClick={() => handleSelectCode(item.kode)}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                        is5Digit 
                          ? 'border-emerald-200/90 dark:border-emerald-900/60 shadow-xs' 
                          : 'border-slate-200/80 dark:border-slate-800 shadow-2xs'
                      } p-4 md:p-5 hover:shadow-md hover:border-primary-400 dark:hover:border-primary-600 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group`}
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${visual.bgPastel} ${visual.textColor} ${visual.borderColor} group-hover:scale-105 transition-transform`}
                        >
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                              {item.kode}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(item.kode, item.kode);
                              }}
                              title="Salin Kode KBLI"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              {copiedCode === item.kode ? (
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
                            <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                              {item.judul}
                            </h3>
                            {is5Digit ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                5 Digit (Kelompok)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {LEVEL_NAMES[item.level] || item.level}
                              </span>
                            )}
                            {item.se2026_match && item.se2026_match.count > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/80 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>Data SE2026: {item.se2026_match.count.toLocaleString('id-ID')} Usaha</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {formatSnippetPreview(item.snippet)}
                          </p>
                          {item.se2026_match && item.se2026_match.top_produk && item.se2026_match.top_produk.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[10px] font-semibold text-slate-400">Komoditas Lapangan SE2026:</span>
                              {item.se2026_match.top_produk.slice(0, 4).map((p, pIdx) => (
                                <span key={pIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50/70 dark:bg-slate-800 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-slate-700 font-medium">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                          <span>{is5Digit ? 'Buka Definisi 5-Digit' : 'Buka Definisi & Hierarki'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tidak Ada Hasil untuk "{debouncedQuery}"
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Coba gunakan istilah yang lebih umum atau cari berdasarkan digit kode.
                </p>
              </div>
            )}
          </section>
        ) : loadingNode ? (
          <div className="min-h-[280px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
            <span className="text-xs font-semibold text-slate-500">Memuat rincian klasifikasi dari server...</span>
          </div>
        ) : currentNode ? (
          /* ========================================================= */
          /* VIEW 2: DRILL-DOWN LEVEL VIEW (DETAIL + DAFTAR TURUNAN) */
          /* ========================================================= */
          <section className="space-y-6">
            {/* Breadcrumb Navigation Bar */}
            <nav className="flex items-center flex-wrap gap-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs shadow-2xs">
              <button
                onClick={handleBackToAllCategories}
                className="font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 flex items-center gap-1 transition-colors"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Semua Kategori</span>
              </button>

              {currentNode.breadcrumb && currentNode.breadcrumb.map((crumb, idx) => {
                const isLast = idx === currentNode.breadcrumb.length - 1;
                return (
                  <React.Fragment key={crumb.kode}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    <button
                      disabled={isLast}
                      onClick={() => handleSelectCode(crumb.kode)}
                      className={`font-semibold transition-colors px-1.5 py-0.5 rounded-md ${
                        isLast
                          ? 'font-black text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60'
                          : 'text-slate-600 dark:text-slate-300 hover:text-primary-600'
                      }`}
                    >
                      {crumb.level === 'kategori' ? `Kategori ${crumb.kode}` : crumb.kode}
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>

            {/* HERO CARD: KONSEP DAN DEFINISI LEVEL AKTIF DENGAN FITUR BACA LENGKAP / BACA SEBAGIAN */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-xs space-y-5">
              {/* Header Hero */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 border ${activeVisual.bgPastel} ${activeVisual.textColor} ${activeVisual.borderColor} shadow-xs`}
                  >
                    <ActiveIcon className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs">
                        {currentNode.kode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                        {LEVEL_NAMES[currentNode.level] || currentNode.level}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Kat. {currentNode.kategori_kode}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                      {currentNode.judul}
                    </h2>
                  </div>
                </div>

                {/* Quick Copy KBLI Code */}
                <button
                  onClick={() => handleCopy(currentNode.kode, currentNode.kode)}
                  title="Salin kode KBLI ini"
                  className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedCode === currentNode.kode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Kode KBLI Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Salin Kode KBLI</span>
                    </>
                  )}
                </button>
              </div>

              {/* BOX PENJELASAN KONSEP & DEFINISI DENGAN FITUR BACA LENGKAP / BACA SEBAGIAN */}
              <div className="p-5 md:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Uraian Konsep & Definisi Resmi
                  </h3>
                </div>

                <div className="relative text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3.5">
                  {/* Definition blocks (Structured Paragraphs & Lists) */}
                  <div className={!isExpandedDefinition ? 'line-clamp-4 overflow-hidden' : 'space-y-3.5'}>
                    {parsedDefinition.mainBlocks.length > 0 ? (
                      parsedDefinition.mainBlocks.map((block, bIdx) =>
                        block.type === 'paragraph' ? (
                          <p key={bIdx} className="leading-relaxed text-slate-700 dark:text-slate-300">
                            {renderTextWithKbliLinks(block.text, false)}
                          </p>
                        ) : (
                          <div
                            key={bIdx}
                            className="rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-3.5 md:p-4 space-y-2.5 shadow-2xs"
                          >
                            {block.header && (
                              <div className="font-bold text-slate-800 dark:text-slate-100 text-xs md:text-sm">
                                {renderTextWithKbliLinks(block.header, false)}
                              </div>
                            )}
                            <ul className="space-y-2 pl-1">
                              {block.items.map((itemText, iIdx) => (
                                <li
                                  key={iIdx}
                                  className="flex items-start gap-2.5 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                                >
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
                                  <span className="flex-1">
                                    {renderTextWithKbliLinks(
                                      itemText.charAt(0).toUpperCase() + itemText.slice(1),
                                      false
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )
                    ) : (
                      <p className="leading-relaxed text-slate-500 italic">
                        Tidak ada deskripsi rincian tambahan pada tingkat ini.
                      </p>
                    )}
                  </div>

                  {/* Exclusions highlighted as structured list */}
                  {parsedDefinition.exclusionBlocks.length > 0 && isExpandedDefinition && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 md:p-5 rounded-xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-200/90 dark:border-amber-800/70 text-amber-950 dark:text-amber-100 text-xs md:text-sm leading-relaxed space-y-2.5 mt-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Batasan & Pengecualian Klasifikasi (Tidak Mencakup):</span>
                      </div>
                      <div className="space-y-2.5">
                        {parsedDefinition.exclusionBlocks.map((block, bIdx) =>
                          block.type === 'paragraph' ? (
                            <p key={bIdx} className="leading-relaxed text-amber-900 dark:text-amber-200">
                              {renderTextWithKbliLinks(block.text, true)}
                            </p>
                          ) : (
                            <div key={bIdx} className="space-y-2">
                              {block.header && (
                                <div className="font-semibold text-amber-900/90 dark:text-amber-200/90 text-xs md:text-sm">
                                  {renderTextWithKbliLinks(block.header, true)}
                                </div>
                              )}
                              <ul className="space-y-2 pl-1">
                                {block.items.map((itemText, iIdx) => (
                                  <li
                                    key={iIdx}
                                    className="flex items-start gap-2.5 text-xs md:text-sm text-amber-900 dark:text-amber-100 leading-relaxed"
                                  >
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
                                    <span className="flex-1">
                                      {renderTextWithKbliLinks(
                                        itemText.charAt(0).toUpperCase() + itemText.slice(1),
                                        true
                                      )}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Tombol Baca Lengkap vs Baca Sebagian */}
                {(currentNode.deskripsi.length > 200 || parsedDefinition.exclusions) && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750 flex items-center justify-between">
                    <button
                      onClick={() => setIsExpandedDefinition(!isExpandedDefinition)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors cursor-pointer"
                    >
                      <span>{isExpandedDefinition ? 'Baca Sebagian' : 'Baca Lengkap Konsep & Definisi'}</span>
                      {isExpandedDefinition ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <a
                      href="https://oss.go.id/id/kbli"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      <span>Cek Perizinan di OSS</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {/* Indikator Kategori Terbawah (5-Digit) */}
                {(!currentNode.children || currentNode.children.length === 0 || currentNode.level === 'kelompok') && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Klasifikasi Tingkat Terbawah (5-Digit): </span>
                        <span>Ini adalah kode kelompok operasional paling terperinci standar BPS yang digunakan langsung dalam pencatatan kuesioner survei BPS dan perizinan berusaha OSS.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* DAFTAR TURUNANNYA PADA BAGIAN BAWAH (HANYA DITAMPILKAN JIKA MASIH MEMILIKI TURUNAN) */}
            {/* JIKA TURUNAN SUDAH HABIS, HANYA MENAMPILKAN DESKRIPSI KATEGORI TERBAWAH DI ATAS */}
            {/* ========================================================= */}
            {currentNode.children && currentNode.children.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-primary-600 rounded-full"></span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {CHILD_SECTION_TITLES[currentNode.level] || 'Daftar Sub-Klasifikasi'}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {currentNode.children.length} entitas turunan
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
                        onClick={() => handleSelectCode(child.kode)}
                        className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-5 shadow-2xs hover:shadow-md hover:border-primary-400 dark:hover:border-primary-600 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Left icon tile */}
                          <div
                            className={`w-12 h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center shrink-0 border ${childVisual.bgPastel} ${childVisual.textColor} ${childVisual.borderColor} group-hover:scale-105 transition-transform`}
                          >
                            <ChildIcon className="w-6 h-6" />
                          </div>

                          {/* Middle: Code, Title, Snippet, Child Counts */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-xs md:text-sm px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                                {child.kode}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(child.kode, child.kode);
                                }}
                                title="Salin Kode KBLI"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
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
                              <h4 className="font-bold text-sm md:text-base text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                                {child.judul}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {LEVEL_NAMES[child.level] || child.level}
                              </span>
                            </div>

                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {formatSnippetPreview(child.snippet || child.deskripsi)}
                            </p>

                            {/* Sub-item count badge */}
                            {child.child_count > 0 && (
                              <div className="pt-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                  <Layers className="w-3 h-3 text-primary-500" />
                                  <span>{child.child_count} turunan klasifikasi</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Drill down button */}
                        <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCode(child.kode);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-2xs"
                          >
                            <span>Lihat Definisi & Turunan</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </button>
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
          /* VIEW 3: TAMPILAN AWAL MENAMPILKAN BLOK-BLOK SEMUA KATEGORI */
          /* ========================================================= */
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Kategori Klasifikasi Lapangan Usaha (A – U)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih salah satu blok kategori di bawah ini untuk menjelajahi konsep, definisi, dan golongan pokoknya
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                22 Kategori
              </span>
            </div>

            {loadingCategories ? (
              <div className="min-h-[300px] flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Memuat blok kategori dari server...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categories.map((cat) => {
                  const visual = CATEGORY_VISUALS[cat.code] || DEFAULT_VISUAL;
                  const IconComp = visual.icon;

                  return (
                    <motion.div
                      key={cat.code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSelectCode(cat.code)}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs hover:shadow-lg hover:border-primary-400 dark:hover:border-primary-500/60 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Top: Icon + Badge */}
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-13 h-13 rounded-2xl flex items-center justify-center border ${visual.bgPastel} ${visual.textColor} ${visual.borderColor} group-hover:scale-105 transition-transform duration-200`}
                          >
                            <IconComp className="w-6 h-6" />
                          </div>
                          <span className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            Kategori {cat.code}
                          </span>
                        </div>

                        {/* Title */}
                        <div>
                          <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug line-clamp-2">
                            {cat.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Footer Meta & Call-to-action */}
                      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                          {cat.total_golongan_pokok} Gol. Pokok • {cat.total_kelompok} Kelompok
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                          <span>Jelajahi</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
