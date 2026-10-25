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
  Layers,
  HelpCircle,
  Lightbulb,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_KBLI_CATEGORIES } from './kbliCategoriesData';
import { getKbliSuggestionFromBusinessName } from '../pengolahan/rasionalitas/kbliRecommender';

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
// ==========================================

interface CategoryVisual {
  icon: React.ElementType;
  bgPastel: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  shortLabel: string;
  accentBar: string;
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  A: { icon: Sprout, bgPastel: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800/60', badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70', badgeText: 'text-emerald-800 dark:text-emerald-300', shortLabel: 'Pertanian & Perikanan', accentBar: 'from-emerald-500 to-teal-500' },
  B: { icon: Mountain, bgPastel: 'bg-amber-50 dark:bg-amber-950/40', textColor: 'text-amber-800 dark:text-amber-400', borderColor: 'border-amber-200 dark:border-amber-800/60', badgeBg: 'bg-amber-100 dark:bg-amber-950/70', badgeText: 'text-amber-900 dark:text-amber-300', shortLabel: 'Pertambangan', accentBar: 'from-amber-500 to-orange-500' },
  C: { icon: Factory, bgPastel: 'bg-orange-50 dark:bg-orange-950/40', textColor: 'text-orange-700 dark:text-orange-400', borderColor: 'border-orange-200 dark:border-orange-800/60', badgeBg: 'bg-orange-100 dark:bg-orange-950/70', badgeText: 'text-orange-800 dark:text-orange-300', shortLabel: 'Industri Pengolahan', accentBar: 'from-orange-500 to-red-500' },
  D: { icon: Zap, bgPastel: 'bg-yellow-50 dark:bg-yellow-950/40', textColor: 'text-yellow-800 dark:text-yellow-400', borderColor: 'border-yellow-200 dark:border-yellow-800/60', badgeBg: 'bg-yellow-100 dark:bg-yellow-950/70', badgeText: 'text-yellow-900 dark:text-yellow-300', shortLabel: 'Listrik & Gas', accentBar: 'from-yellow-400 to-amber-500' },
  E: { icon: Recycle, bgPastel: 'bg-teal-50 dark:bg-teal-950/40', textColor: 'text-teal-700 dark:text-teal-400', borderColor: 'border-teal-200 dark:border-teal-800/60', badgeBg: 'bg-teal-100 dark:bg-teal-950/70', badgeText: 'text-teal-800 dark:text-teal-300', shortLabel: 'Air & Pengelolaan Limbah', accentBar: 'from-teal-500 to-cyan-500' },
  F: { icon: HardHat, bgPastel: 'bg-sky-50 dark:bg-sky-950/40', textColor: 'text-sky-700 dark:text-sky-400', borderColor: 'border-sky-200 dark:border-sky-800/60', badgeBg: 'bg-sky-100 dark:bg-sky-950/70', badgeText: 'text-sky-800 dark:text-sky-300', shortLabel: 'Konstruksi', accentBar: 'from-sky-500 to-blue-500' },
  G: { icon: ShoppingBag, bgPastel: 'bg-blue-50 dark:bg-blue-950/40', textColor: 'text-blue-700 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800/60', badgeBg: 'bg-blue-100 dark:bg-blue-950/70', badgeText: 'text-blue-800 dark:text-blue-300', shortLabel: 'Perdagangan Besar & Eceran', accentBar: 'from-blue-500 to-indigo-500' },
  H: { icon: Truck, bgPastel: 'bg-indigo-50 dark:bg-indigo-950/40', textColor: 'text-indigo-700 dark:text-indigo-400', borderColor: 'border-indigo-200 dark:border-indigo-800/60', badgeBg: 'bg-indigo-100 dark:bg-indigo-950/70', badgeText: 'text-indigo-800 dark:text-indigo-300', shortLabel: 'Transportasi & Gudang', accentBar: 'from-indigo-500 to-violet-500' },
  I: { icon: Utensils, bgPastel: 'bg-rose-50 dark:bg-rose-950/40', textColor: 'text-rose-700 dark:text-rose-400', borderColor: 'border-rose-200 dark:border-rose-800/60', badgeBg: 'bg-rose-100 dark:bg-rose-950/70', badgeText: 'text-rose-800 dark:text-rose-300', shortLabel: 'Akomodasi & Makan Minum', accentBar: 'from-rose-500 to-pink-500' },
  J: { icon: BookOpen, bgPastel: 'bg-cyan-50 dark:bg-cyan-950/40', textColor: 'text-cyan-700 dark:text-cyan-400', borderColor: 'border-cyan-200 dark:border-cyan-800/60', badgeBg: 'bg-cyan-100 dark:bg-cyan-950/70', badgeText: 'text-cyan-800 dark:text-cyan-300', shortLabel: 'Penerbitan & Penyiaran', accentBar: 'from-cyan-500 to-sky-500' },
  K: { icon: Wifi, bgPastel: 'bg-violet-50 dark:bg-violet-950/40', textColor: 'text-violet-700 dark:text-violet-400', borderColor: 'border-violet-200 dark:border-violet-800/60', badgeBg: 'bg-violet-100 dark:bg-violet-950/70', badgeText: 'text-violet-800 dark:text-violet-300', shortLabel: 'Telekomunikasi & IT', accentBar: 'from-violet-500 to-purple-500' },
  L: { icon: Landmark, bgPastel: 'bg-purple-50 dark:bg-purple-950/40', textColor: 'text-purple-700 dark:text-purple-400', borderColor: 'border-purple-200 dark:border-purple-800/60', badgeBg: 'bg-purple-100 dark:bg-purple-950/70', badgeText: 'text-purple-800 dark:text-purple-300', shortLabel: 'Keuangan & Asuransi', accentBar: 'from-purple-500 to-fuchsia-500' },
  M: { icon: Building2, bgPastel: 'bg-emerald-50 dark:bg-emerald-950/40', textColor: 'text-emerald-800 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800/60', badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70', badgeText: 'text-emerald-800 dark:text-emerald-300', shortLabel: 'Real Estat', accentBar: 'from-emerald-600 to-green-500' },
  N: { icon: Briefcase, bgPastel: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', textColor: 'text-fuchsia-700 dark:text-fuchsia-400', borderColor: 'border-fuchsia-200 dark:border-fuchsia-800/60', badgeBg: 'bg-fuchsia-100 dark:bg-fuchsia-950/70', badgeText: 'text-fuchsia-800 dark:text-fuchsia-300', shortLabel: 'Profesional & Ilmiah', accentBar: 'from-fuchsia-500 to-pink-500' },
  O: { icon: ShieldCheck, bgPastel: 'bg-slate-100 dark:bg-slate-800', textColor: 'text-slate-700 dark:text-slate-300', borderColor: 'border-slate-300 dark:border-slate-700', badgeBg: 'bg-slate-200 dark:bg-slate-800', badgeText: 'text-slate-800 dark:text-slate-200', shortLabel: 'Penyewaan & Penunjang', accentBar: 'from-slate-500 to-indigo-500' },
  P: { icon: Scale, bgPastel: 'bg-blue-50 dark:bg-blue-950/40', textColor: 'text-blue-800 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-800/60', badgeBg: 'bg-blue-100 dark:bg-blue-950/70', badgeText: 'text-blue-900 dark:text-blue-300', shortLabel: 'Pemerintahan', accentBar: 'from-blue-600 to-cyan-500' },
  Q: { icon: GraduationCap, bgPastel: 'bg-red-50 dark:bg-red-950/40', textColor: 'text-red-700 dark:text-red-400', borderColor: 'border-red-200 dark:border-red-800/60', badgeBg: 'bg-red-100 dark:bg-red-950/70', badgeText: 'text-red-800 dark:text-red-300', shortLabel: 'Pendidikan', accentBar: 'from-red-500 to-rose-500' },
  R: { icon: HeartPulse, bgPastel: 'bg-pink-50 dark:bg-pink-950/40', textColor: 'text-pink-700 dark:text-pink-400', borderColor: 'border-pink-200 dark:border-pink-800/60', badgeBg: 'bg-pink-100 dark:bg-pink-950/70', badgeText: 'text-pink-800 dark:text-pink-300', shortLabel: 'Kesehatan & Sosial', accentBar: 'from-pink-500 to-rose-500' },
  S: { icon: Palette, bgPastel: 'bg-amber-50 dark:bg-amber-950/40', textColor: 'text-amber-700 dark:text-amber-400', borderColor: 'border-amber-200 dark:border-amber-800/60', badgeBg: 'bg-amber-100 dark:bg-amber-950/70', badgeText: 'text-amber-800 dark:text-amber-300', shortLabel: 'Kesenian & Olahraga', accentBar: 'from-amber-500 to-yellow-500' },
  T: { icon: Sparkles, bgPastel: 'bg-lime-50 dark:bg-lime-950/40', textColor: 'text-lime-800 dark:text-lime-400', borderColor: 'border-lime-200 dark:border-lime-800/60', badgeBg: 'bg-lime-100 dark:bg-lime-950/70', badgeText: 'text-lime-900 dark:text-lime-300', shortLabel: 'Jasa Lainnya & Reparasi', accentBar: 'from-lime-500 to-emerald-500' },
  U: { icon: Users, bgPastel: 'bg-orange-50 dark:bg-orange-950/40', textColor: 'text-orange-800 dark:text-orange-300', borderColor: 'border-orange-200 dark:border-orange-800/60', badgeBg: 'bg-orange-100 dark:bg-orange-950/70', badgeText: 'text-orange-900 dark:text-orange-300', shortLabel: 'Aktivitas Rumah Tangga', accentBar: 'from-orange-500 to-amber-500' },
  V: { icon: Globe, bgPastel: 'bg-sky-50 dark:bg-sky-950/40', textColor: 'text-sky-800 dark:text-sky-300', borderColor: 'border-sky-200 dark:border-sky-800/60', badgeBg: 'bg-sky-100 dark:bg-sky-950/70', badgeText: 'text-sky-900 dark:text-sky-300', shortLabel: 'Badan Internasional', accentBar: 'from-sky-500 to-indigo-500' }
};

const DEFAULT_VISUAL: CategoryVisual = {
  icon: BookOpen,
  bgPastel: 'bg-indigo-50 dark:bg-slate-800',
  textColor: 'text-indigo-700 dark:text-slate-300',
  borderColor: 'border-indigo-200 dark:border-slate-700',
  badgeBg: 'bg-indigo-100 dark:bg-slate-800',
  badgeText: 'text-indigo-800 dark:text-slate-300',
  shortLabel: 'Klasifikasi Usaha',
  accentBar: 'from-indigo-500 to-violet-500'
};

// Variasi warna pill untuk setiap tingkat hierarki pada Breadcrumb & Kartu
const LEVEL_BADGE_STYLES: Record<string, string> = {
  kategori: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
  golongan_pokok: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800',
  golongan: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-800',
  subgolongan: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  kelompok: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800'
};

const QUICK_SEARCH_EXAMPLES = [
  { label: 'Toko Sembako Berkah', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' },
  { label: 'Warung Kopi', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800' },
  { label: 'Bengkel Motor', color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  { label: 'UTP Tanaman Pangan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' },
  { label: 'Angkutan Sawit', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800' },
  { label: 'Penggilingan Padi', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800' },
  { label: 'Rumah Kontrakan', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800' }
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

  // Modal Pop-up Panduan Penggunaan Web KBLI 2025
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Rekomendasi Cerdas Nama Usaha SE2026 (Lokal Instan + Server)
  const localNamaSuggestion = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return null;
    // Jangan jalankan saran nama usaha bila input murni angka kode KBLI
    if (/^\d+$/.test(debouncedQuery.trim())) return null;
    return getKbliSuggestionFromBusinessName(debouncedQuery);
  }, [debouncedQuery]);

  const activeRecommendation = useMemo(() => {
    const serverRec = searchResults?.recommended_kbli;
    if (serverRec && serverRec.kbli) {
      return {
        kbli5Digit: serverRec.kbli,
        kbliJudul: serverRec.judul || localNamaSuggestion?.kbliJudul || '',
        kategoriKode: serverRec.kategori || localNamaSuggestion?.kode || '',
        matchedKeyword: serverRec.matchedKeyword || localNamaSuggestion?.matchedKeyword || '',
        count: serverRec.count || localNamaSuggestion?.count || 0,
        confidence: serverRec.confidence || localNamaSuggestion?.confidence || 90
      };
    }
    if (localNamaSuggestion && localNamaSuggestion.kbli5Digit) {
      return {
        kbli5Digit: localNamaSuggestion.kbli5Digit,
        kbliJudul: localNamaSuggestion.kbliJudul || localNamaSuggestion.nama,
        kategoriKode: localNamaSuggestion.kode,
        matchedKeyword: localNamaSuggestion.matchedKeyword,
        count: localNamaSuggestion.count,
        confidence: localNamaSuggestion.confidence || 88
      };
    }
    return null;
  }, [searchResults, localNamaSuggestion]);

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
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100">
      {/* ========================================================= */}
      {/* HEADER BERWARNA DINAMIS & KAYA VARIASI VISUAL */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#3730A3] via-[#4F46E5] to-[#6D28D9] dark:from-indigo-950 dark:via-slate-900 dark:to-violet-950 text-white border-b border-indigo-400/30 dark:border-indigo-800/60 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (currentNode) {
                  handleBackOneLevel();
                } else {
                  onBack();
                }
              }}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all shadow-2xs shrink-0 cursor-pointer"
              title={currentNode ? 'Kembali ke Tingkat Sebelumnya' : 'Kembali ke Beranda'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight truncate">
                  Klasifikasi Baku Lapangan Usaha Indonesia 2025
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-200 border border-amber-300/40">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>AI Nama Usaha SE2026</span>
                </span>
              </div>
              <p className="text-[11px] text-indigo-100/90 hidden sm:block truncate">
                Pencarian Cerdas Nama Usaha, Komoditas & Hierarki Resmi BPS (Kategori A – V)
              </p>
            </div>
          </div>

          {/* Right Header Actions: Panduan & Lihat Semua Kategori */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-xs cursor-pointer"
              title="Buka Panduan Penggunaan Web KBLI 2025"
            >
              <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Panduan</span>
            </button>

            {currentNode && (
              <button
                type="button"
                onClick={handleBackToAllCategories}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-white/15 hover:bg-white/25 border border-white/25 transition-all shadow-2xs cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lihat Semua Kategori</span>
              </button>
            )}
          </div>
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

        {/* Global Search Bar dengan Variasi Warna & Chip Contoh Nama Usaha SE2026 */}
        <section className="bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/90 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 rounded-2xl p-4 md:p-5 border-2 border-indigo-200/80 dark:border-indigo-800/70 shadow-xs space-y-3">
          <div className="relative flex items-center">
            <div className="absolute left-2.5 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-2xs pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama usaha (misal: Toko Sembako Berkah, Bengkel Motor), komoditas, atau kode KBLI (01122)..."
              className="w-full pl-12 pr-10 py-3 rounded-xl border border-indigo-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  setSearchResults(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 dark:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Bersihkan pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Contoh Cepat Pencarian Berwarna */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 mr-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Coba cari nama usaha:</span>
            </span>
            {QUICK_SEARCH_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setSearchQuery(ex.label)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${ex.color}`}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* VIEW 1: SEARCH RESULTS VIEW (IF USER TYPES A SEARCH QUERY) */}
        {/* ========================================================= */}
        {debouncedQuery ? (
          <section className="space-y-4">
            {/* BANNER REKOMENDASI CERDAS NAMA USAHA SE2026 */}
            {activeRecommendation && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/80 to-yellow-50 dark:from-amber-950/50 dark:via-slate-900 dark:to-orange-950/40 border-2 border-amber-300/90 dark:border-amber-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-white">
                        Saran AI Nama Usaha SE2026
                      </span>
                      <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        KBLI {activeRecommendation.kbli5Digit}
                      </span>
                      {activeRecommendation.kategoriKode && (
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                          Kategori {activeRecommendation.kategoriKode}
                        </span>
                      )}
                      {activeRecommendation.matchedKeyword && (
                        <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                          • Pola terdeteksi: <strong>&ldquo;{activeRecommendation.matchedKeyword}&rdquo;</strong>
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-sm md:text-base text-slate-900 dark:text-white leading-snug">
                      {activeRecommendation.kbliJudul}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleCopy(activeRecommendation.kbli5Digit, activeRecommendation.kbli5Digit)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-amber-300 dark:border-slate-700 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedCode === activeRecommendation.kbli5Digit ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-600" />
                        <span>Salin {activeRecommendation.kbli5Digit}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCode(activeRecommendation.kbli5Digit)}
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>Buka KBLI {activeRecommendation.kbli5Digit}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Hasil Pencarian Kata Kunci: <span className="text-primary-600 font-extrabold">"{debouncedQuery}"</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Diurutkan berdasarkan kecocokan Nama Usaha SE2026, Kode, Judul & Komoditas BPS
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {searchResults?.execution_time_ms !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-slate-300 border border-indigo-200 dark:border-slate-700">
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
                  const isTopRecommended = activeRecommendation?.kbli5Digit === item.kode;

                  return (
                    <article
                      key={`${item.level}-${item.kode}`}
                      onClick={() => handleSelectCode(item.kode)}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                        isTopRecommended
                          ? 'border-2 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20 shadow-sm'
                          : is5Digit
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
                            {isTopRecommended && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
                                ★ Rekomendasi Terbaik Nama Usaha
                              </span>
                            )}
                            {is5Digit ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                5 Digit (Kelompok)
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${LEVEL_BADGE_STYLES[item.level] || 'bg-slate-100 text-slate-600'}`}>
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
            {/* Breadcrumb Navigation Bar dengan Variasi Warna per Level Hierarki */}
            <nav className="flex items-center flex-wrap gap-1.5 p-3 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/90 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border-2 border-indigo-200/80 dark:border-indigo-800/60 text-xs shadow-xs">
              <button
                onClick={handleBackToAllCategories}
                className="font-extrabold px-2.5 py-1 rounded-xl bg-indigo-100/90 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-200 border border-indigo-300/80 dark:border-indigo-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Semua Kategori</span>
              </button>

              {currentNode.breadcrumb && currentNode.breadcrumb.map((crumb, idx) => {
                const isLast = idx === currentNode.breadcrumb.length - 1;
                const levelColorClass =
                  LEVEL_BADGE_STYLES[crumb.level] ||
                  'bg-slate-100 text-slate-700 border-slate-300';

                return (
                  <React.Fragment key={crumb.kode}>
                    <ChevronRight className="w-4 h-4 text-indigo-400 dark:text-slate-500 shrink-0" />
                    <button
                      disabled={isLast}
                      onClick={() => handleSelectCode(crumb.kode)}
                      title={crumb.judul}
                      className={`transition-all px-2.5 py-1 rounded-xl border text-xs ${
                        isLast
                          ? 'font-black bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300/50 dark:ring-indigo-800/50'
                          : `font-bold hover:scale-105 cursor-pointer shadow-2xs ${levelColorClass}`
                      }`}
                    >
                      {crumb.level === 'kategori' ? `Kategori ${crumb.kode}` : crumb.kode}
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>

            {/* HERO CARD: KONSEP DAN DEFINISI LEVEL AKTIF DENGAN FITUR BACA LENGKAP / BACA SEBAGIAN */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
              {/* Top Accent Color Strip sesuai Kategori */}
              <div className={`h-2 w-full bg-gradient-to-r ${activeVisual.accentBar}`} />

              <div className="p-6 md:p-8 space-y-5">
                {/* Header Hero */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 ${activeVisual.bgPastel} ${activeVisual.textColor} ${activeVisual.borderColor} shadow-xs`}
                    >
                      <ActiveIcon className="w-7 h-7 md:w-8 md:h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white dark:from-white dark:to-indigo-100 dark:text-slate-900 shadow-2xs">
                          {currentNode.kode}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${LEVEL_BADGE_STYLES[currentNode.level] || 'bg-primary-50 text-primary-700 border-primary-200'}`}>
                          {LEVEL_NAMES[currentNode.level] || currentNode.level}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${activeVisual.badgeBg} ${activeVisual.badgeText} ${activeVisual.borderColor}`}>
                          Kategori {currentNode.kategori_kode} • {activeVisual.shortLabel}
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
                    className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-700 dark:text-slate-200 border border-indigo-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copiedCode === currentNode.kode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Kode KBLI Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-indigo-500" />
                        <span>Salin Kode KBLI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* BOX PENJELASAN KONSEP & DEFINISI DENGAN FITUR BACA LENGKAP / BACA SEBAGIAN */}
                <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-850/60 dark:via-slate-900 dark:to-indigo-950/20 border border-slate-200/90 dark:border-slate-800 space-y-4">
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
                              className="rounded-xl bg-emerald-50/50 dark:bg-slate-900/90 border border-emerald-200/80 dark:border-emerald-900/50 p-3.5 md:p-4 space-y-2.5 shadow-2xs"
                            >
                              {block.header && (
                                <div className="font-bold text-emerald-950 dark:text-emerald-200 text-xs md:text-sm">
                                  {renderTextWithKbliLinks(block.header, false)}
                                </div>
                              )}
                              <ul className="space-y-2 pl-1">
                                {block.items.map((itemText, iIdx) => (
                                  <li
                                    key={iIdx}
                                    className="flex items-start gap-2.5 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                                  >
                                    <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
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
                                      <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
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
            </div>

            {/* ========================================================= */}
            {/* DAFTAR TURUNANNYA PADA BAGIAN BAWAH */}
            {/* ========================================================= */}
            {currentNode.children && currentNode.children.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-5 bg-gradient-to-b ${activeVisual.accentBar} rounded-full`}></span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {CHILD_SECTION_TITLES[currentNode.level] || 'Daftar Sub-Klasifikasi'}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-slate-300 border border-indigo-200 dark:border-slate-700 font-bold">
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
                          <div
                            className={`w-12 h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center shrink-0 border ${childVisual.bgPastel} ${childVisual.textColor} ${childVisual.borderColor} group-hover:scale-105 transition-transform`}
                          >
                            <ChildIcon className="w-6 h-6" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-xs md:text-sm px-2.5 py-0.5 rounded-lg bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
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
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${LEVEL_BADGE_STYLES[child.level] || 'bg-slate-100 text-slate-600'}`}>
                                {LEVEL_NAMES[child.level] || child.level}
                              </span>
                            </div>

                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {formatSnippetPreview(child.snippet || child.deskripsi)}
                            </p>

                            {child.child_count > 0 && (
                              <div className="pt-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-slate-800 text-[11px] font-semibold text-indigo-700 dark:text-slate-300 border border-indigo-200/60 dark:border-slate-700">
                                  <Layers className="w-3 h-3 text-indigo-500" />
                                  <span>{child.child_count} turunan klasifikasi</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCode(child.kode);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-slate-200 bg-indigo-50 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Kategori Klasifikasi Lapangan Usaha (A – V)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih salah satu blok kategori di bawah ini untuk menjelajahi konsep, definisi, dan golongan pokoknya
                </p>
              </div>

              {/* Badge 22 Kategori + Tombol Pop-Up Panduan Penggunaan di Sampingnya */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  22 Kategori
                </span>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs transition-all cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Cara Penggunaan KBLI 2025</span>
                </button>
              </div>
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
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-lg hover:border-primary-400 dark:hover:border-primary-500/60 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      {/* Top Color Accent Strip per Card */}
                      <div className={`h-1.5 w-full bg-gradient-to-r ${visual.accentBar}`} />

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${visual.bgPastel} ${visual.textColor} ${visual.borderColor} group-hover:scale-105 transition-transform duration-200`}
                            >
                              <IconComp className="w-6 h-6" />
                            </div>
                            <span className={`font-mono font-black text-xs px-2.5 py-1 rounded-xl border ${visual.badgeBg} ${visual.badgeText} ${visual.borderColor}`}>
                              Kategori {cat.code}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug line-clamp-2">
                              {cat.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {cat.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {cat.total_golongan_pokok} Gol. Pokok • {cat.total_kelompok} Kelompok
                          </span>
                          <span className={`inline-flex items-center gap-1 font-bold ${visual.textColor} group-hover:translate-x-1 transition-transform`}>
                            <span>Jelajahi</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL POP-UP PANDUAN PENGGUNAAN WEB KBLI 2025 */}
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
              className="w-full max-w-2xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#3730A3] via-[#4F46E5] to-[#6D28D9] px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight">
                      Panduan Penggunaan KBLI 2025 Garda Data
                    </h2>
                    <p className="text-xs text-indigo-100">
                      Ringkas, akurat, dan terintegrasi dengan AI Nama Usaha SE2026
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="Tutup panduan"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {/* 4 Langkah Utama */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs flex items-center justify-center shrink-0">1</span>
                      <span>Pencarian Cerdas Nama Usaha</span>
                    </div>
                    <p className="text-xs leading-relaxed text-amber-950/90 dark:text-amber-200/90">
                      Ketik langsung <strong>nama usaha responden</strong> (misal: <em>&ldquo;Toko Sembako Berkah&rdquo;</em>, <em>&ldquo;Bengkel Motor&rdquo;</em>, <em>&ldquo;Angkutan Sawit&rdquo;</em>), <strong>komoditas</strong>, atau <strong>kode KBLI</strong>. Sistem otomatis menampilkan <strong>Saran AI Nama Usaha SE2026 (5-Digit)</strong> paling relevan di urutan teratas.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/70 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-indigo-900 dark:text-indigo-300">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0">2</span>
                      <span>Penelusuran Hierarki (Drill-Down)</span>
                    </div>
                    <p className="text-xs leading-relaxed text-indigo-950/90 dark:text-indigo-200/90">
                      Klik salah satu dari <strong>22 Blok Kategori (A–V)</strong> untuk menelusuri turunan secara bertingkat hingga ke tingkat <strong>Kelompok (5-Digit)</strong>. Gunakan <strong>baris navigasi berwarna (Breadcrumb)</strong> di atas untuk melompat antar-level dengan cepat.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-emerald-900 dark:text-emerald-300">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center shrink-0">3</span>
                      <span>Cakupan vs Pengecualian</span>
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-950/90 dark:text-emerald-200/90">
                      Perhatikan kotak <strong>Cakupan Utama (Hijau)</strong> dan <strong>Batasan / Tidak Mencakup (Kuning)</strong>. Jika kegiatan usaha masuk di daftar pengecualian, klik langsung <strong>badge kode rujukan</strong> (contoh: <code className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 font-mono font-bold">4730</code>) untuk berpindah ke KBLI yang tepat.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/70 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-rose-900 dark:text-rose-300">
                      <span className="w-6 h-6 rounded-lg bg-rose-600 text-white text-xs flex items-center justify-center shrink-0">4</span>
                      <span>Salin Kode 5-Digit (Standar SE2026)</span>
                    </div>
                    <p className="text-xs leading-relaxed text-rose-950/90 dark:text-rose-200/90">
                      Isian kuesioner SE2026 dan perizinan OSS wajib menggunakan <strong>Kode 5-Digit (Kelompok)</strong>. Klik tombol <strong>&ldquo;Salin Kode&rdquo;</strong> pada kartu hasil pencarian atau halaman detail untuk menyalin kode ke <em>clipboard</em>.
                    </p>
                  </div>
                </div>

                {/* Struktur 5 Level Hierarki KBLI 2025 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    <span>Mengenal 5 Tingkat Struktur Kode KBLI 2025:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                      <div className="font-black">1. Kategori</div>
                      <div className="font-mono text-xs font-bold mt-0.5">Huruf A – V</div>
                      <div className="opacity-80 mt-0.5">Sektor Utama (22 Kat)</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-100/80 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200">
                      <div className="font-black">2. Gol. Pokok</div>
                      <div className="font-mono text-xs font-bold mt-0.5">2 Digit (01)</div>
                      <div className="opacity-80 mt-0.5">Cabang Kegiatan</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-violet-100/80 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-800 text-violet-900 dark:text-violet-200">
                      <div className="font-black">3. Golongan</div>
                      <div className="font-mono text-xs font-bold mt-0.5">3 Digit (011)</div>
                      <div className="opacity-80 mt-0.5">Kelompok Aktivitas</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                      <div className="font-black">4. Subgolongan</div>
                      <div className="font-mono text-xs font-bold mt-0.5">4 Digit (0112)</div>
                      <div className="opacity-80 mt-0.5">Rincian Sub-Sektor</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                      <div className="font-black">5. Kelompok ★</div>
                      <div className="font-mono text-xs font-bold mt-0.5">5 Digit (01122)</div>
                      <div className="opacity-80 mt-0.5">Wajib Isian SE2026</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Tip: Gunakan kata kunci aktivitas utama + komoditas untuk hasil paling presisi.
                </span>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
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
