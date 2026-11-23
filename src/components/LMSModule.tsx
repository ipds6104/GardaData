import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, Edit2, Trash2, ShieldCheck, CheckCircle2, EyeOff, BookOpen, Briefcase, Users, Landmark, Wheat, Factory, Settings, Tag, Truck, BarChart2, GraduationCap, Cpu, Lock, Unlock, Link2, FolderOpen, Calendar, HelpCircle, FileCheck, ExternalLink, GripVertical, Clock, Copy, RotateCcw, Sparkles, Layers, AlertCircle, Check, Share2, CheckCheck, X, ArrowRight, ChevronRight, Target, TrendingUp, Bell, FileText, Palette, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { DistribusiIcon } from './common/DistribusiIcon';
import { IndonesianDateTimePicker } from './common/IndonesianDateTimePicker';
import { IndonesianCategorySelect } from './common/IndonesianCategorySelect';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LMSButton {
  id: string;
  title: string;
  url: string;
  category: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

interface LMSTraining {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  period?: string; // Fallback untuk data lama
  icon: string;
  isActive: boolean;
  buttons: LMSButton[];
  bgImage?: string;
  themeTone?: string;
}

// Preset Opsi Tone Warna Pelatihan untuk Admin
export const LMS_THEME_OPTIONS = [
  { id: 'indigo_twilight', name: 'Indigo Twilight Dreams', color: '#4f46e5', badgeBg: 'bg-indigo-100 text-indigo-800', desc: 'Indigo lavender & ungu senja (pin.it/20DyPHjCp)' },
  { id: 'dusty_rose', name: 'Dusty Rose & Midnight Teal', color: '#af7a80', badgeBg: 'bg-rose-100 text-rose-800', desc: 'Dusty rose mauve & midnight teal (pin.it/6OBEFCPMK)' },
  { id: 'deep_navy', name: 'Deep Navy Sapphire', color: '#1e3a8a', badgeBg: 'bg-blue-100 text-blue-900', desc: 'Midnight navy & biru safir (pin.it/1Hf5r4aYI)' },
  { id: 'botanical_green', name: 'Botanical Forest Sage', color: '#15803d', badgeBg: 'bg-emerald-100 text-emerald-800', desc: 'Forest sage & zaitun botanical (pin.it/7gm666a88)' },
  { id: 'warm_amber', name: 'Warm Amber Terracotta', color: '#d97706', badgeBg: 'bg-amber-100 text-amber-900', desc: 'Terracotta pasir amber hangat (pin.it/27vxZKqNu)' },
  { id: 'persik', name: 'Persik Segar (Peach)', color: '#8b5cf6', badgeBg: 'bg-purple-100 text-purple-800', desc: 'Ungu modern lavender dan peach lembut' },
  { id: 'greentea', name: 'Greentea / Emerald BPS', color: '#22c55e', badgeBg: 'bg-emerald-100 text-emerald-800', desc: 'Hijau segar dan teal khas statistik' },
  { id: 'sky', name: 'Sky Blue', color: '#007BFF', badgeBg: 'bg-sky-100 text-sky-800', desc: 'Biru langit cerah dan segar' },
  { id: 'auntum', name: 'Autumn Gold', color: '#eab308', badgeBg: 'bg-yellow-100 text-yellow-800', desc: 'Kuning keemasan hangat' },
  { id: 'notebook', name: 'Soft Rose / Notebook', color: '#ec4899', badgeBg: 'bg-pink-100 text-pink-800', desc: 'Merah muda pastel feminin dan ceria' },
  { id: 'original', name: 'BPS Classic Navy & Amber', color: '#f17e3a', badgeBg: 'bg-amber-100 text-amber-800', desc: 'Oranye dan biru tua klasik institusi' }
];

// Preset 5 Gambar Latar Pelatihan Pinterest & Standar Bersih
export const LMS_BACKGROUND_PRESETS = [
  { id: '/images/lms/lms-bg-1.jpg', name: '1. Indigo Twilight Dreams', preview: '/images/lms/lms-bg-1.jpg', defaultTone: 'indigo_twilight', desc: 'Ungu senja & lavender' },
  { id: '/images/lms/lms-bg-2.jpg', name: '2. Dusty Rose & Teal', preview: '/images/lms/lms-bg-2.jpg', defaultTone: 'dusty_rose', desc: 'Mawar mauve & midnight teal' },
  { id: '/images/lms/lms-bg-3.jpg', name: '3. Deep Navy Sapphire', preview: '/images/lms/lms-bg-3.jpg', defaultTone: 'deep_navy', desc: 'Biru safir & oceanic navy' },
  { id: '/images/lms/lms-bg-4.jpg', name: '4. Botanical Forest Sage', preview: '/images/lms/lms-bg-4.jpg', defaultTone: 'botanical_green', desc: 'Hijau hutan & zaitun' },
  { id: '/images/lms/lms-bg-5.jpg', name: '5. Warm Amber Terracotta', preview: '/images/lms/lms-bg-5.jpg', defaultTone: 'warm_amber', desc: 'Terracotta pasir amber' },
  { id: '', name: '6. Standar Bersih (Tanpa Latar)', preview: '', defaultTone: 'persik', desc: 'Gradien polos minimalis' }
];

const DEFAULT_CATEGORIES = ['Absensi', 'Administrasi', 'Materi dan Instrumen Pelatihan', 'Jadwal Pelatihan', 'Kuis dan Pendalaman'];

// Struktur Standar Pelatihan Statistik BPS (Template Cadangan Resmi 5 Kategori)
const STANDARD_BPS_BUTTONS: LMSButton[] = [
  { id: 'std_1', title: 'Presensi Kehadiran Peserta (Pagi / Masuk)', url: 'https://', category: 'Absensi', isActive: true },
  { id: 'std_2', title: 'Presensi Kehadiran Peserta (Sore / Pulang)', url: 'https://', category: 'Absensi', isActive: true },
  { id: 'std_3', title: 'Unggah Kelengkapan Administrasi & Surat Tugas', url: 'https://', category: 'Administrasi', isActive: true },
  { id: 'std_4', title: 'Buku Pedoman Pencacahan & Konsep Definisi', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
  { id: 'std_5', title: 'Kuesioner Lapangan & Instrumen Survei', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
  { id: 'std_6', title: 'Slide Bahan Paparan / Tayang Fasilitator', url: 'https://', category: 'Materi dan Instrumen Pelatihan', isActive: true },
  { id: 'std_7', title: 'Jadwal Agenda Pelatihan & Pembagian Kelas', url: 'https://', category: 'Jadwal Pelatihan', isActive: true },
  { id: 'std_8', title: 'Pre-Test Pemahaman Awal Peserta', url: 'https://', category: 'Kuis dan Pendalaman', isActive: true },
  { id: 'std_9', title: 'Post-Test & Evaluasi Penyelenggaraan', url: 'https://', category: 'Kuis dan Pendalaman', isActive: true }
];

const ICON_MAP: Record<string, React.ElementType> = {
  'ketenagakerjaan': Briefcase,
  'sosial': Users,
  'ekonomi': Landmark,
  'pertanian': Wheat,
  'produksi': Factory,
  'pengolahan': Settings,
  'harga': Tag,
  'distribusi': DistribusiIcon,
  'analisis': BarChart2,
  'pemerintahan': Landmark,
  'pendidikan': GraduationCap,
  'peternakan': Wheat, // Fallback
  'teknologi': Cpu
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Absensi': FileCheck,
  'Administrasi': FolderOpen,
  'Materi dan Instrumen Pelatihan': BookOpen,
  'Jadwal Pelatihan': Calendar,
  'Kuis dan Pendalaman': HelpCircle
};

const CARD_COLORS = [
  'bg-emerald-50 border-emerald-200 text-emerald-800 hover:shadow-emerald-200',
  'bg-blue-50 border-blue-200 text-blue-800 hover:shadow-blue-200',
  'bg-amber-50 border-amber-200 text-amber-800 hover:shadow-amber-200',
  'bg-orange-50 border-orange-200 text-orange-800 hover:shadow-orange-200',
  'bg-rose-50 border-rose-200 text-rose-800 hover:shadow-rose-200',
  'bg-indigo-50 border-indigo-200 text-indigo-800 hover:shadow-indigo-200'
];

// Helper format tanggal dan jam 24 jam Indonesia (WIB)
const formatIndonesianTime24 = (isoStr?: string) => {
  if (!isoStr) return '';
  try {
    const [dPart, tPart] = isoStr.split('T');
    const [y, m, d] = dPart.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const timeStr = tPart ? `${tPart} WIB` : '';
    return `${d} ${months[m - 1]} ${y}${timeStr ? `, ${timeStr}` : ''}`;
  } catch {
    return isoStr;
  }
};

// Palet warna pastel lembut untuk kartu materi (sesuai referensi desain modern)
const PASTEL_CARD_THEMES = [
  {
    bg: 'bg-[#FCE7F3]', // Soft Rose / Pink
    border: 'border-[#FBCFE8]',
    text: 'text-[#831843]',
    titleText: 'text-[#831843]',
    badgeBg: 'bg-pink-200/60 text-[#831843]',
    buttonBg: 'bg-white/95 hover:bg-white text-[#831843] hover:shadow-md',
    iconCircle: 'bg-white/80 text-[#BE185D]',
    tag: 'ABSENSI & PRESENSI'
  },
  {
    bg: 'bg-[#FEF3C7]', // Soft Warm Yellow
    border: 'border-[#FDE68A]',
    text: 'text-[#78350F]',
    titleText: 'text-[#78350F]',
    badgeBg: 'bg-amber-200/60 text-[#78350F]',
    buttonBg: 'bg-white/95 hover:bg-white text-[#78350F] hover:shadow-md',
    iconCircle: 'bg-white/80 text-[#B45309]',
    tag: 'ADMINISTRASI'
  },
  {
    bg: 'bg-[#FFEDD5]', // Soft Peach / Orange
    border: 'border-[#FED7AA]',
    text: 'text-[#7C2D12]',
    titleText: 'text-[#7C2D12]',
    badgeBg: 'bg-orange-200/60 text-[#7C2D12]',
    buttonBg: 'bg-white/95 hover:bg-white text-[#7C2D12] hover:shadow-md',
    iconCircle: 'bg-white/80 text-[#C2410C]',
    tag: 'MATERI & INSTRUMEN'
  },
  {
    bg: 'bg-[#E0F2FE]', // Soft Sky Blue
    border: 'border-[#BAE6FD]',
    text: 'text-[#0C4A6E]',
    titleText: 'text-[#0C4A6E]',
    badgeBg: 'bg-sky-200/60 text-[#0C4A6E]',
    buttonBg: 'bg-white/95 hover:bg-white text-[#0C4A6E] hover:shadow-md',
    iconCircle: 'bg-white/80 text-[#0284C7]',
    tag: 'JADWAL PELATIHAN'
  },
  {
    bg: 'bg-[#EDE9FE]', // Soft Lilac / Purple
    border: 'border-[#DDD6FE]',
    text: 'text-[#4C1D95]',
    titleText: 'text-[#4C1D95]',
    badgeBg: 'bg-purple-200/60 text-[#4C1D95]',
    buttonBg: 'bg-white/95 hover:bg-white text-[#4C1D95] hover:shadow-md',
    iconCircle: 'bg-white/80 text-[#7C3AED]',
    tag: 'KUIS & EVALUASI'
  },
  {
    bg: 'bg-[#D1FAE5]', // Soft Mint / Emerald
    border: 'border-[#A7F3D0]',
    text: 'text-[#064E3B]',
    titleText: 'text-[#064E3B]',
    badgeBg: 'bg-emerald-200/60 text-[#064E3B]',
    buttonBg: 'bg-white/95 hover:bg-white text-[#064E3B] hover:shadow-md',
    iconCircle: 'bg-white/80 text-[#059669]',
    tag: 'PANDUAN LAPANGAN'
  }
];

const getActionLabel = (category: string, isLocked: boolean) => {
  if (isLocked) return 'Tautan Terkunci';
  const cat = (category || '').toLowerCase();
  if (cat.includes('absen') || cat.includes('presensi')) return 'Isi Presensi';
  if (cat.includes('materi') || cat.includes('pedoman') || cat.includes('definisi')) return 'Buka Materi';
  if (cat.includes('jadwal') || cat.includes('agenda')) return 'Lihat Jadwal';
  if (cat.includes('kuis') || cat.includes('test')) return 'Mulai Kuis';
  if (cat.includes('admin') || cat.includes('tugas') || cat.includes('surat')) return 'Akses Berkas';
  return 'Buka Tautan';
};

const getThemeHeroStyles = (preset: string) => {
  switch (preset) {
    case 'indigo_twilight':
      return {
        cardBg: 'bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-50',
        cardBorder: 'border-indigo-300',
        badgeBg: 'bg-indigo-500/20 text-indigo-900 border-indigo-300',
        accentColor: '#4f46e5',
        activePill: 'bg-indigo-600 text-white font-black shadow-xs',
        sliderBg: 'bg-white/90 hover:bg-white text-slate-800 border border-indigo-300',
        sliderCircle: 'bg-indigo-600 text-white',
        highlightDot: 'bg-indigo-500'
      };
    case 'dusty_rose':
      return {
        cardBg: 'bg-gradient-to-br from-rose-100 via-stone-50 to-teal-50',
        cardBorder: 'border-rose-300',
        badgeBg: 'bg-rose-500/20 text-rose-900 border-rose-300',
        accentColor: '#af7a80',
        activePill: 'bg-[#af7a80] text-white font-black shadow-xs',
        sliderBg: 'bg-white/90 hover:bg-white text-slate-800 border border-rose-300',
        sliderCircle: 'bg-[#af7a80] text-white',
        highlightDot: 'bg-[#af7a80]'
      };
    case 'deep_navy':
      return {
        cardBg: 'bg-gradient-to-br from-blue-100 via-sky-50 to-indigo-50',
        cardBorder: 'border-blue-300',
        badgeBg: 'bg-blue-600/20 text-blue-900 border-blue-300',
        accentColor: '#1e3a8a',
        activePill: 'bg-blue-900 text-white font-black shadow-xs',
        sliderBg: 'bg-white/90 hover:bg-white text-slate-800 border border-blue-300',
        sliderCircle: 'bg-blue-900 text-white',
        highlightDot: 'bg-blue-600'
      };
    case 'botanical_green':
      return {
        cardBg: 'bg-gradient-to-br from-emerald-100 via-green-50 to-lime-50',
        cardBorder: 'border-emerald-300',
        badgeBg: 'bg-emerald-600/20 text-emerald-900 border-emerald-300',
        accentColor: '#15803d',
        activePill: 'bg-emerald-700 text-white font-black shadow-xs',
        sliderBg: 'bg-white/90 hover:bg-white text-slate-800 border border-emerald-300',
        sliderCircle: 'bg-emerald-700 text-white',
        highlightDot: 'bg-emerald-600'
      };
    case 'warm_amber':
    case 'pinterest_warm':
      return {
        cardBg: 'bg-gradient-to-br from-amber-100 via-orange-50 to-stone-50',
        cardBorder: 'border-amber-300',
        badgeBg: 'bg-amber-600/20 text-amber-900 border-amber-300',
        accentColor: '#d97706',
        activePill: 'bg-amber-600 text-white font-black shadow-xs',
        sliderBg: 'bg-white/90 hover:bg-white text-slate-800 border border-amber-300',
        sliderCircle: 'bg-amber-600 text-white',
        highlightDot: 'bg-amber-500'
      };
    case 'original':
      return {
        cardBg: 'bg-gradient-to-br from-amber-200 via-orange-100 to-amber-50',
        cardBorder: 'border-amber-300',
        badgeBg: 'bg-amber-400/20 text-amber-900 border-amber-300',
        accentColor: '#f17e3a',
        activePill: 'bg-amber-300 text-amber-950 font-black shadow-xs',
        sliderBg: 'bg-white/85 hover:bg-white text-slate-800',
        sliderCircle: 'bg-amber-500 text-white',
        highlightDot: 'bg-orange-500'
      };
    case 'sky':
      return {
        cardBg: 'bg-gradient-to-br from-sky-200 via-blue-100 to-sky-50',
        cardBorder: 'border-sky-300',
        badgeBg: 'bg-sky-400/20 text-sky-900 border-sky-300',
        accentColor: '#007BFF',
        activePill: 'bg-sky-300 text-sky-950 font-black shadow-xs',
        sliderBg: 'bg-white/85 hover:bg-white text-slate-800',
        sliderCircle: 'bg-sky-600 text-white',
        highlightDot: 'bg-blue-500'
      };
    case 'greentea':
      return {
        cardBg: 'bg-gradient-to-br from-emerald-200 via-green-100 to-emerald-50',
        cardBorder: 'border-emerald-300',
        badgeBg: 'bg-emerald-400/20 text-emerald-900 border-emerald-300',
        accentColor: '#22c55e',
        activePill: 'bg-emerald-300 text-emerald-950 font-black shadow-xs',
        sliderBg: 'bg-white/85 hover:bg-white text-slate-800',
        sliderCircle: 'bg-emerald-600 text-white',
        highlightDot: 'bg-emerald-500'
      };
    case 'auntum':
      return {
        cardBg: 'bg-gradient-to-br from-yellow-200 via-amber-100 to-yellow-50',
        cardBorder: 'border-yellow-300',
        badgeBg: 'bg-yellow-400/20 text-yellow-900 border-yellow-300',
        accentColor: '#eab308',
        activePill: 'bg-yellow-300 text-yellow-950 font-black shadow-xs',
        sliderBg: 'bg-white/85 hover:bg-white text-slate-800',
        sliderCircle: 'bg-yellow-500 text-white',
        highlightDot: 'bg-amber-500'
      };
    case 'notebook':
      return {
        cardBg: 'bg-gradient-to-br from-pink-200 via-rose-100 to-pink-50',
        cardBorder: 'border-pink-300',
        badgeBg: 'bg-pink-400/20 text-pink-900 border-pink-300',
        accentColor: '#ec4899',
        activePill: 'bg-pink-300 text-pink-950 font-black shadow-xs',
        sliderBg: 'bg-white/85 hover:bg-white text-slate-800',
        sliderCircle: 'bg-pink-600 text-white',
        highlightDot: 'bg-rose-500'
      };
    case 'persik':
    default:
      return {
        cardBg: 'bg-gradient-to-br from-violet-200 via-purple-100 to-rose-50',
        cardBorder: 'border-purple-300',
        badgeBg: 'bg-purple-400/20 text-purple-900 border-purple-300',
        accentColor: '#8b5cf6',
        activePill: 'bg-purple-200 text-purple-950 font-black shadow-xs',
        sliderBg: 'bg-white/85 hover:bg-white text-slate-800',
        sliderCircle: 'bg-purple-600 text-white',
        highlightDot: 'bg-purple-500'
      };
  }
};

const getAdminThemeCategoryStyles = (preset: string) => {
  switch (preset) {
    case 'indigo_twilight':
      return {
        cardBorder: 'border-indigo-200 dark:border-indigo-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-indigo-100 dark:border-indigo-800/60',
        badgeBg: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        iconBg: 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-500/20',
        eyebrowColor: 'text-indigo-700 dark:text-indigo-400',
        itemHoverTitle: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
        itemHoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
        buttonHoverBg: 'group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600',
        accentColor: '#4f46e5'
      };
    case 'dusty_rose':
      return {
        cardBorder: 'border-rose-200 dark:border-rose-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-rose-100 dark:border-rose-800/60',
        badgeBg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        iconBg: 'bg-gradient-to-tr from-[#af7a80] to-[#8d5b62] text-white shadow-rose-500/20',
        eyebrowColor: 'text-[#8d5b62] dark:text-rose-400',
        itemHoverTitle: 'group-hover:text-[#af7a80] dark:group-hover:text-rose-400',
        itemHoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
        buttonHoverBg: 'group-hover:bg-[#af7a80] group-hover:text-white group-hover:border-[#af7a80]',
        accentColor: '#af7a80'
      };
    case 'deep_navy':
      return {
        cardBorder: 'border-blue-200 dark:border-blue-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-blue-100 dark:border-blue-800/60',
        badgeBg: 'bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        iconBg: 'bg-gradient-to-tr from-blue-900 to-indigo-800 text-white shadow-blue-500/20',
        eyebrowColor: 'text-blue-900 dark:text-blue-400',
        itemHoverTitle: 'group-hover:text-blue-700 dark:group-hover:text-blue-400',
        itemHoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
        buttonHoverBg: 'group-hover:bg-blue-900 group-hover:text-white group-hover:border-blue-900',
        accentColor: '#1e3a8a'
      };
    case 'botanical_green':
      return {
        cardBorder: 'border-emerald-200 dark:border-emerald-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-emerald-100 dark:border-emerald-800/60',
        badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        iconBg: 'bg-gradient-to-tr from-emerald-700 to-teal-800 text-white shadow-emerald-500/20',
        eyebrowColor: 'text-emerald-800 dark:text-emerald-400',
        itemHoverTitle: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400',
        itemHoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
        buttonHoverBg: 'group-hover:bg-emerald-700 group-hover:text-white group-hover:border-emerald-700',
        accentColor: '#15803d'
      };
    case 'warm_amber':
    case 'pinterest_warm':
      return {
        cardBorder: 'border-amber-200 dark:border-amber-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-amber-100 dark:border-amber-800/60',
        badgeBg: 'bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        iconBg: 'bg-gradient-to-tr from-amber-600 to-orange-600 text-white shadow-amber-500/20',
        eyebrowColor: 'text-amber-800 dark:text-amber-400',
        itemHoverTitle: 'group-hover:text-amber-700 dark:group-hover:text-amber-400',
        itemHoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
        buttonHoverBg: 'group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600',
        accentColor: '#d97706'
      };
    case 'original':
      return {
        cardBorder: 'border-amber-200 dark:border-amber-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-amber-100 dark:border-amber-800/60',
        badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/20',
        eyebrowColor: 'text-amber-700 dark:text-amber-400',
        itemHoverTitle: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
        itemHoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
        buttonHoverBg: 'group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600',
        accentColor: '#f17e3a'
      };
    case 'sky':
      return {
        cardBorder: 'border-sky-200 dark:border-sky-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-sky-100 dark:border-sky-800/60',
        badgeBg: 'bg-sky-50 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        iconBg: 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sky-500/20',
        eyebrowColor: 'text-sky-700 dark:text-sky-400',
        itemHoverTitle: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
        itemHoverBorder: 'hover:border-sky-300 dark:hover:border-sky-700',
        buttonHoverBg: 'group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600',
        accentColor: '#007BFF'
      };
    case 'greentea':
      return {
        cardBorder: 'border-emerald-200 dark:border-emerald-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-emerald-100 dark:border-emerald-800/60',
        badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/20',
        eyebrowColor: 'text-emerald-700 dark:text-emerald-400',
        itemHoverTitle: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
        itemHoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
        buttonHoverBg: 'group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600',
        accentColor: '#22c55e'
      };
    case 'auntum':
      return {
        cardBorder: 'border-yellow-200 dark:border-yellow-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-yellow-100 dark:border-yellow-800/60',
        badgeBg: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
        iconBg: 'bg-gradient-to-tr from-yellow-500 to-amber-500 text-white shadow-yellow-500/20',
        eyebrowColor: 'text-yellow-700 dark:text-yellow-400',
        itemHoverTitle: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
        itemHoverBorder: 'hover:border-yellow-300 dark:hover:border-yellow-700',
        buttonHoverBg: 'group-hover:bg-yellow-500 group-hover:text-white group-hover:border-yellow-500',
        accentColor: '#eab308'
      };
    case 'notebook':
      return {
        cardBorder: 'border-pink-200 dark:border-pink-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-pink-100 dark:border-pink-800/60',
        badgeBg: 'bg-pink-50 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 border-pink-200 dark:border-pink-800',
        iconBg: 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-pink-500/20',
        eyebrowColor: 'text-pink-700 dark:text-pink-400',
        itemHoverTitle: 'group-hover:text-pink-600 dark:group-hover:text-pink-400',
        itemHoverBorder: 'hover:border-pink-300 dark:hover:border-pink-700',
        buttonHoverBg: 'group-hover:bg-pink-600 group-hover:text-white group-hover:border-pink-600',
        accentColor: '#ec4899'
      };
    case 'persik':
    default:
      return {
        cardBorder: 'border-purple-200 dark:border-purple-800/80',
        cardBg: 'bg-white dark:bg-slate-900 shadow-sm',
        headerBorder: 'border-purple-100 dark:border-purple-800/60',
        badgeBg: 'bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        iconBg: 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-purple-500/20',
        eyebrowColor: 'text-purple-700 dark:text-purple-400',
        itemHoverTitle: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
        itemHoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
        buttonHoverBg: 'group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600',
        accentColor: '#8b5cf6'
      };
  }
};

const ITEM_ICON_SCHEMES = [
  { bg: 'bg-purple-100 dark:bg-purple-950/70', text: 'text-purple-600 dark:text-purple-300', border: 'border-purple-200/80 dark:border-purple-800/60' },
  { bg: 'bg-rose-100 dark:bg-rose-950/70', text: 'text-rose-600 dark:text-rose-300', border: 'border-rose-200/80 dark:border-rose-800/60' },
  { bg: 'bg-amber-100 dark:bg-amber-950/70', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-200/80 dark:border-amber-800/60' },
  { bg: 'bg-sky-100 dark:bg-sky-950/70', text: 'text-sky-600 dark:text-sky-300', border: 'border-sky-200/80 dark:border-sky-800/60' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/70', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200/80 dark:border-emerald-800/60' },
  { bg: 'bg-indigo-100 dark:bg-indigo-950/70', text: 'text-indigo-600 dark:text-indigo-300', border: 'border-indigo-200/80 dark:border-indigo-800/60' },
];

const getCategoryDescription = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('absen') || cat.includes('presensi')) {
    return 'Pencatatan dan presensi kehadiran peserta selama kegiatan pelatihan berlangsung.';
  }
  if (cat.includes('administrasi') || cat.includes('tugas') || cat.includes('surat')) {
    return 'Kelengkapan berkas administrasi, surat tugas, dokumen kontrak, dan kelengkapan resmi.';
  }
  if (cat.includes('materi') || cat.includes('instrumen') || cat.includes('pedoman')) {
    return 'Bahan tayang presentasi narasumber, buku pedoman teknis, konsep definisi, dan instrumen.';
  }
  if (cat.includes('jadwal') || cat.includes('agenda')) {
    return 'Jadwal dan susunan agenda harian, alokasi sesi pelajaran, serta evaluasi pelatihan.';
  }
  if (cat.includes('kuis') || cat.includes('test') || cat.includes('evaluasi')) {
    return 'Pre-test, post-test, kuis pemahaman materi, serta studi kasus lapangan.';
  }
  return 'Kumpulan materi, tautan, dan berkas panduan resmi untuk mendukung kegiatan pelatihan.';
};

const getItemSubtitle = (btn: LMSButton) => {
  const cat = (btn.category || '').toLowerCase();
  const title = (btn.title || '').toLowerCase();
  
  if (title.includes('masuk') || title.includes('pagi')) return 'Presensi kehadiran sesi pagi / masuk ruangan pelatihan.';
  if (title.includes('pulang') || title.includes('sore')) return 'Presensi kehadiran sesi sore / akhir pelatihan.';
  if (cat.includes('absen') || cat.includes('presensi')) return 'Pencatatan presensi kehadiran peserta sesuai jadwal sesi.';
  if (title.includes('pre-test') || title.includes('pretest')) return 'Uji pemahaman awal sebelum materi pelatihan disampaikan.';
  if (title.includes('post-test') || title.includes('posttest')) return 'Evaluasi penguasaan materi setelah seluruh sesi selesai.';
  if (cat.includes('kuis') || cat.includes('evaluasi')) return 'Kuis pendalaman materi, latihan soal, dan lembar evaluasi.';
  if (cat.includes('jadwal') || cat.includes('agenda')) return 'Susunan jadwal agenda, alokasi jam pelajaran, dan rundown.';
  if (title.includes('pedoman') || title.includes('buku')) return 'Buku pedoman teknis pendataan dan acuan operasional resmi.';
  if (title.includes('tayang') || title.includes('slide') || title.includes('ppt')) return 'Slide bahan tayang dan presentasi materi narasumber.';
  if (cat.includes('materi') || cat.includes('instrumen')) return 'Akses berkas materi pembelajaran, panduan, dan instrumen.';
  if (cat.includes('admin') || cat.includes('tugas') || cat.includes('surat')) return 'Dokumen kelengkapan administrasi, surat tugas, dan berkas resmi.';
  return 'Akses tautan resmi kegiatan untuk mendukung kelancaran pelatihan.';
};

const getItemIcon = (btn: LMSButton, index: number) => {
  const title = (btn.title || '').toLowerCase();

  if (title.includes('jadwal') || title.includes('agenda') || title.includes('waktu') || title.includes('tanggal')) return Calendar;
  if (title.includes('target') || title.includes('absen') || title.includes('presensi') || title.includes('hadir')) return Target;
  if (title.includes('progress') || title.includes('grafik') || title.includes('evaluasi') || title.includes('nilai')) return TrendingUp;
  if (title.includes('ingat') || title.includes('notifikasi') || title.includes('reminder') || title.includes('tenggat')) return Bell;
  if (title.includes('kuis') || title.includes('test') || title.includes('ujian')) return CheckCircle2;
  if (title.includes('pedoman') || title.includes('buku') || title.includes('modul')) return BookOpen;
  if (title.includes('surat') || title.includes('tugas') || title.includes('dokumen') || title.includes('berkas')) return FileCheck;
  if (title.includes('tayang') || title.includes('slide') || title.includes('materi')) return FileText;

  const fallbackIcons = [Calendar, Target, TrendingUp, Bell, BookOpen, FileCheck];
  return fallbackIcons[index % fallbackIcons.length] || (CATEGORY_ICONS[btn.category] || Link2);
};

// Component Sortable Item untuk Dnd-Kit (Modern Clean Row Card matching reference Smart Study Planner)
const SortableLinkItem = ({ btn, index = 0, catTheme, isAdmin, isLocked, lockLabel, isIframe, openIframe, toggleButtonStatus, setButtonFormData, setIsCustomCategory, setShowButtonForm, handleDeleteButton, activeTrainingId, DEFAULT_CATEGORIES }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: btn.id, disabled: !isAdmin });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const scheme = ITEM_ICON_SCHEMES[index % ITEM_ICON_SCHEMES.length];
  const ItemIcon = getItemIcon(btn, index);
  const actionText = getActionLabel(btn.category, isLocked);
  const subtitle = getItemSubtitle(btn);

  const handleOpenMaterial = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (isLocked) return;
    if (isIframe) {
      openIframe(btn.url);
    } else if (btn.url) {
      window.open(btn.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onClick={handleOpenMaterial}
      role={!isLocked ? "button" : undefined}
      tabIndex={!isLocked ? 0 : undefined}
      onKeyDown={(e) => {
        if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleOpenMaterial(e);
        }
      }}
      className={`group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none ${
        isLocked 
          ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70 cursor-not-allowed'
          : `bg-white dark:bg-slate-850/90 hover:bg-slate-50/90 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 ${catTheme?.itemHoverBorder || 'hover:border-slate-300'} shadow-2xs hover:shadow-md cursor-pointer active:scale-[0.995]`
      }`}
      title={isLocked ? lockLabel : `Klik untuk ${actionText.toLowerCase()}`}
    >
      <div className="flex items-center gap-4 sm:gap-4.5 flex-grow min-w-0">
        {/* Soft Pastel Squircle Icon (Sesuai Referensi Gambar) */}
        <div className={`w-13 h-13 sm:w-14 h-14 rounded-2xl border ${scheme.border} ${scheme.bg} ${scheme.text} flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform`}>
          <ItemIcon className="w-6 h-6 sm:w-7 h-7" />
        </div>

        {/* Title + Subtitle */}
        <div className="min-w-0 flex-grow">
          <h4 className={`text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 leading-snug truncate transition-colors ${catTheme?.itemHoverTitle || 'group-hover:text-primary-600'}`}>
            {btn.title}
          </h4>
          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed mt-0.5 line-clamp-2">
            {subtitle}
          </p>

          {/* Schedule / Lock Indicator */}
          {lockLabel && (
            <div className="text-[11px] font-bold text-rose-600 mt-1 uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 shrink-0"/>
              <span>{lockLabel}</span>
            </div>
          )}
          {!lockLabel && (btn.startDate || btn.endDate) && (
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{btn.endDate ? `Batas: ${formatIndonesianTime24(btn.endDate)}` : `Buka: ${formatIndonesianTime24(btn.startDate)}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Action pill & Admin controls */}
      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
        <div
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
            !isLocked 
              ? `bg-slate-100 ${catTheme?.buttonHoverBg || 'group-hover:bg-primary-600 group-hover:text-white'} text-slate-700 dark:bg-slate-750 dark:text-slate-200 shadow-2xs` 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
          <span>{actionText}</span>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            onKeyDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700 shrink-0"
          >
            <div {...attributes} {...listeners} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-grab flex items-center justify-center touch-none rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" title="Geser Urutan (Drag)">
              <GripVertical className="w-4 h-4" />
            </div>
            <button onClick={() => toggleButtonStatus(activeTrainingId, btn.id)} className={`p-2 rounded-xl transition-colors ${btn.isActive ? 'text-emerald-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`} title={btn.isActive ? "Matikan Tautan" : "Aktifkan Tautan"}>
              {btn.isActive ? <Unlock className="w-4 h-4 mx-auto"/> : <Lock className="w-4 h-4 mx-auto"/>}
            </button>
            <button onClick={() => { setButtonFormData(btn); setIsCustomCategory(!DEFAULT_CATEGORIES.includes(btn.category)); setShowButtonForm(true); }} className="p-2 rounded-xl text-indigo-700 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/40 transition-colors" title="Edit Tautan"><Edit2 className="w-4 h-4 mx-auto"/></button>
            <button onClick={() => handleDeleteButton(activeTrainingId, btn.id)} className="p-2 rounded-xl text-rose-700 hover:bg-rose-100/50 dark:hover:bg-rose-950/40 transition-colors" title="Hapus"><Trash2 className="w-4 h-4 mx-auto"/></button>
          </div>
        )}
      </div>
    </div>
  );
};

export const LMSModule: React.FC<{ 
  onBack: () => void;
  directTrainingId?: string | null;
  initialTrainingId?: string | null;
  isGuestDirect?: boolean;
}> = ({ onBack, directTrainingId, initialTrainingId, isGuestDirect = false }) => {
  const { user } = useAuth();
  const { presetInfo } = useTheme();
  const isAdmin = user?.role === 'admin';
  const [trainings, setTrainings] = useState<LMSTraining[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab filter kategori aktif (untuk tombol pill horizontal)
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  // Target training ID dari direct link
  const targetTrainingId = directTrainingId || initialTrainingId;

  // View state: 'list' or 'detail' or 'iframe'
  const [view, setView] = useState<'list' | 'detail' | 'iframe'>('list');
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string>('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{ id?: string, name: string, startDate: string, endDate: string, icon: string, isActive: boolean, bgImage?: string, themeTone?: string }>({
    name: '', startDate: '', endDate: '', icon: 'pendidikan', isActive: true, bgImage: '/images/lms/lms-bg-1.jpg', themeTone: 'indigo_twilight'
  });

  // Modal Tone & Background states
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeToneSelect, setThemeToneSelect] = useState<string>('indigo_twilight');
  const [bgImageSelect, setBgImageSelect] = useState<string>('/images/lms/lms-bg-1.jpg');
  const [savingTheme, setSavingTheme] = useState(false);

  // Button form states
  const [showButtonForm, setShowButtonForm] = useState(false);
  const [buttonFormData, setButtonFormData] = useState<{ id?: string, title: string, url: string, category: string, isActive: boolean, startDate?: string, endDate?: string }>({
    title: '', url: '', category: DEFAULT_CATEGORIES[0], isActive: true, startDate: '', endDate: ''
  });
  
  // Custom Category Input mode
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Copy Template Modal state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [copyMode, setCopyMode] = useState<'merge' | 'replace'>('merge');
  const [isCopying, setIsCopying] = useState(false);

  // Share Link Modal state
  const [shareModalTraining, setShareModalTraining] = useState<LMSTraining | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const getDirectShareUrl = (trainingId: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/?page=lms&trainingId=${encodeURIComponent(trainingId)}`;
  };

  const handleOpenShareModal = (t: LMSTraining) => {
    setShareModalTraining(t);
    setCopiedLink(false);
    const url = getDirectShareUrl(t.id);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }).catch(() => {});
    }
  };

  const handleCopyShareLink = (t: LMSTraining) => {
    const url = getDirectShareUrl(t.id);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }).catch(() => {
        prompt('Salin tautan ini:', url);
      });
    } else {
      prompt('Salin tautan ini:', url);
    }
  };

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/lms/configs?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((d: any) => {
          let parsedButtons: LMSButton[] = [];
          if (typeof d.buttons === 'string') {
            try {
              parsedButtons = JSON.parse(d.buttons);
            } catch (e) {
              parsedButtons = [];
            }
          } else if (Array.isArray(d.buttons)) {
            parsedButtons = d.buttons;
          }
          let savedTheme: any = null;
          try {
            const local = localStorage.getItem(`lms_training_theme_${d.id}`);
            if (local) savedTheme = JSON.parse(local);
          } catch (e) {}

          return {
            ...d,
            startDate: d.startDate ? d.startDate.split('T')[0] : '',
            endDate: d.endDate ? d.endDate.split('T')[0] : '',
            isActive: Boolean(d.isActive),
            buttons: parsedButtons,
            bgImage: (d.bgImage && d.bgImage !== '/images/lms-training-bg.jpg') ? d.bgImage : (savedTheme?.bgImage && savedTheme.bgImage !== '/images/lms-training-bg.jpg' ? savedTheme.bgImage : '/images/lms/lms-bg-1.jpg'),
            themeTone: (d.themeTone && d.themeTone !== 'pinterest_warm') ? d.themeTone : (savedTheme?.themeTone && savedTheme.themeTone !== 'pinterest_warm' ? savedTheme.themeTone : 'indigo_twilight')
          };
        }) as LMSTraining[];
        setTrainings(formatted);

        // Jika ada targetTrainingId dari URL/direct link, langsung buka detail pelatihan tersebut
        if (targetTrainingId) {
          const found = formatted.find(t => t.id === targetTrainingId);
          if (found) {
            setSelectedTrainingId(found.id);
            setView('detail');
          }
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data pelatihan', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateFromFirebase = async () => {
    if (!confirm('Tarik semua data LMS lama dari Firebase ke MySQL sekarang?')) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'lms_trainings'), orderBy('createdAt', 'asc')));
      const oldData = snap.docs.map(d => d.data());
      
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      for (const t of oldData) {
        const payload = {
          name: t.name,
          startDate: t.startDate || null,
          endDate: t.endDate || null,
          icon: t.icon || 'pendidikan',
          isActive: t.isActive !== false,
          buttons: t.buttons || []
        };
        await fetch(`${baseUrl}/api/lms/configs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      alert(`Berhasil mengembalikan ${oldData.length} data pelatihan beserta seluruh link-nya!`);
      fetchTrainings();
    } catch (err) {
      console.error('Migration error:', err);
      alert('Gagal melakukan migrasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem('garda_lms_trainings_v2');
      localStorage.removeItem('garda_lms_cache');
    } catch {}
    fetchTrainings();
  }, []);

  const handleOpenThemeModal = (t: LMSTraining) => {
    const currentTone = (t.themeTone && t.themeTone !== 'pinterest_warm') ? t.themeTone : 'indigo_twilight';
    const currentBg = (t.bgImage && t.bgImage !== '/images/lms-training-bg.jpg') ? t.bgImage : (t.bgImage === '' ? '' : '/images/lms/lms-bg-1.jpg');
    setThemeToneSelect(currentTone);
    setBgImageSelect(currentBg);
    setShowThemeModal(true);
  };

  const handleSaveTrainingTheme = async (newTone: string, newBg: string) => {
    if (!activeTraining) return;
    setSavingTheme(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const payload: any = {
        name: activeTraining.name,
        startDate: activeTraining.startDate || null,
        endDate: activeTraining.endDate || null,
        period: activeTraining.period || '',
        icon: activeTraining.icon || 'pendidikan',
        isActive: activeTraining.isActive,
        buttons: activeTraining.buttons || [],
        themeTone: newTone,
        bgImage: newBg
      };

      await fetch(`${baseUrl}/api/lms/configs/${activeTraining.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Update state secara instan
      setTrainings(prev => prev.map(t => t.id === activeTraining.id ? { ...t, themeTone: newTone, bgImage: newBg } : t));
      try {
        localStorage.setItem(`lms_training_theme_${activeTraining.id}`, JSON.stringify({ themeTone: newTone, bgImage: newBg }));
      } catch {}
      setShowThemeModal(false);
    } catch (err) {
      console.error('Gagal menyimpan tone & background pelatihan:', err);
      // Fallback lokal
      setTrainings(prev => prev.map(t => t.id === activeTraining.id ? { ...t, themeTone: newTone, bgImage: newBg } : t));
      try {
        localStorage.setItem(`lms_training_theme_${activeTraining.id}`, JSON.stringify({ themeTone: newTone, bgImage: newBg }));
      } catch {}
      setShowThemeModal(false);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `${baseUrl}/api/lms/configs/${formData.id}` : `${baseUrl}/api/lms/configs`;
      
      const existing = trainings.find(t => t.id === formData.id);
      const payload: any = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        icon: formData.icon,
        isActive: formData.isActive,
        bgImage: formData.bgImage || existing?.bgImage || '/images/lms/lms-bg-1.jpg',
        themeTone: formData.themeTone || existing?.themeTone || 'indigo_twilight'
      };
      if (existing && existing.buttons) {
        payload.buttons = existing.buttons;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', startDate: '', endDate: '', icon: 'pendidikan', isActive: true, bgImage: '/images/lms/lms-bg-1.jpg', themeTone: 'indigo_twilight' });
        fetchTrainings();
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pelatihan');
    }
  };

  const handleDeleteTraining = async (id: string) => {
    if (!confirm('Hapus pelatihan ini secara permanen?')) return;
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/lms/configs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedTrainingId === id) setView('list');
        fetchTrainings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveButton = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainingId) return;
    const training = trainings.find(t => t.id === selectedTrainingId);
    if (!training) return;

    try {
      let newButtons = [...(training.buttons || [])];
      
      if (buttonFormData.id) {
        newButtons = newButtons.map(b => b.id === buttonFormData.id ? { ...b, ...buttonFormData } as LMSButton : b);
      } else {
        newButtons.push({
          id: Date.now().toString(),
          title: buttonFormData.title,
          url: buttonFormData.url,
          category: buttonFormData.category,
          isActive: buttonFormData.isActive,
          startDate: buttonFormData.startDate,
          endDate: buttonFormData.endDate
        });
      }

      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const payload = { ...training, buttons: newButtons };
      const res = await fetch(`${baseUrl}/api/lms/configs/${selectedTrainingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        try {
          localStorage.setItem(`garda_lms_backup_${selectedTrainingId}`, JSON.stringify(newButtons));
        } catch (e) {}
        setShowButtonForm(false);
        setButtonFormData({ title: '', url: '', category: DEFAULT_CATEGORIES[0], isActive: true });
        setIsCustomCategory(false);
        fetchTrainings();
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan tautan');
    }
  };

  const handleDeleteButton = async (trainingId: string, buttonId: string) => {
    if (!confirm('Hapus tautan ini?')) return;
    const training = trainings.find(t => t.id === trainingId);
    if (!training) return;

    try {
      const newButtons = training.buttons.filter(b => b.id !== buttonId);
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const payload = { ...training, buttons: newButtons };
      const res = await fetch(`${baseUrl}/api/lms/configs/${trainingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        try {
          localStorage.setItem(`garda_lms_backup_${trainingId}`, JSON.stringify(newButtons));
        } catch (e) {}
        fetchTrainings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTrainingStatus = async (t: LMSTraining) => {
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const payload = { ...t, isActive: !t.isActive };
      const res = await fetch(`${baseUrl}/api/lms/configs/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) fetchTrainings();
    } catch (err) {}
  };

  const toggleButtonStatus = async (trainingId: string, buttonId: string) => {
    const training = trainings.find(t => t.id === trainingId);
    if (!training) return;
    try {
      const newButtons = training.buttons.map(b => b.id === buttonId ? { ...b, isActive: !b.isActive } : b);
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const payload = { ...training, buttons: newButtons };
      const res = await fetch(`${baseUrl}/api/lms/configs/${trainingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        try {
          localStorage.setItem(`garda_lms_backup_${trainingId}`, JSON.stringify(newButtons));
        } catch (e) {}
        fetchTrainings();
      }
    } catch (err) {}
  };

  const handleCopyButtonsFromTraining = async (sourceId: string, mode: 'merge' | 'replace' = 'merge') => {
    if (!selectedTrainingId) return;
    const targetTraining = trainings.find(t => t.id === selectedTrainingId);
    if (!targetTraining) return;

    let sourceButtons: LMSButton[] = [];
    let sourceName = '';

    if (sourceId === 'template_bps_standard') {
      sourceButtons = STANDARD_BPS_BUTTONS;
      sourceName = 'Template Standar Pelatihan BPS (5 Kategori)';
    } else {
      const sourceTraining = trainings.find(t => t.id === sourceId);
      if (!sourceTraining) {
        alert('Pelatihan sumber tidak ditemukan.');
        return;
      }
      sourceButtons = sourceTraining.buttons || [];
      sourceName = sourceTraining.name;
    }

    if (sourceButtons.length === 0) {
      alert(`Pelatihan sumber "${sourceName}" tidak memiliki tautan materi.`);
      return;
    }

    const existingButtons = targetTraining.buttons || [];

    if (mode === 'replace' && existingButtons.length > 0) {
      if (!confirm(`⚠️ PERINGATAN: Anda memilih mode Ganti Semua.\n\n${existingButtons.length} tautan yang sudah ada saat ini akan diganti seluruhnya dengan ${sourceButtons.length} tautan dari "${sourceName}".\n\nLanjutkan?`)) {
        return;
      }
    }

    setIsCopying(true);
    try {
      // Salin buttons dengan ID baru unik
      const clonedButtons: LMSButton[] = sourceButtons.map(b => ({
        ...b,
        id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7)
      }));

      let finalButtons: LMSButton[] = [];

      if (mode === 'merge') {
        // PERTAHANKAN DATA YANG SUDAH ADA
        // Hindari duplikasi persis kategori + judul yang sama
        const existingKeys = new Set(existingButtons.map(b => `${(b.category || '').toLowerCase()}:::${(b.title || '').trim().toLowerCase()}`));
        const toAdd = clonedButtons.filter(b => !existingKeys.has(`${(b.category || '').toLowerCase()}:::${(b.title || '').trim().toLowerCase()}`));
        finalButtons = [...existingButtons, ...toAdd];
      } else {
        // Mode Ganti Seluruhnya
        finalButtons = clonedButtons;
      }

      // Amankan backup lokal sebelum update agar data aman 100%
      try {
        if (existingButtons.length > 0) {
          localStorage.setItem(`garda_lms_backup_precopy_${selectedTrainingId}`, JSON.stringify(existingButtons));
        }
        localStorage.setItem(`garda_lms_backup_${selectedTrainingId}`, JSON.stringify(finalButtons));
      } catch (e) {}

      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const payload = {
        name: targetTraining.name,
        startDate: targetTraining.startDate || null,
        endDate: targetTraining.endDate || null,
        period: targetTraining.period || '',
        icon: targetTraining.icon || 'pendidikan',
        isActive: targetTraining.isActive !== false,
        buttons: finalButtons
      };

      const res = await fetch(`${baseUrl}/api/lms/configs/${selectedTrainingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowCopyModal(false);
        await fetchTrainings();
        const addedCount = finalButtons.length - existingButtons.length;
        if (mode === 'merge' && existingButtons.length > 0) {
          alert(`✅ Berhasil menyalin struktur dari "${sourceName}"!\n\nData lama tetap aman: ${existingButtons.length} tautan lama dipertahankan, dan ${addedCount} tautan baru berhasil ditambahkan (Total: ${finalButtons.length} tautan).`);
        } else {
          alert(`✅ Berhasil menyalin ${finalButtons.length} tautan materi dari "${sourceName}" ke "${targetTraining.name}"!`);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(`Gagal menyalin tautan: ${errJson.error || res.statusText}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan saat menyalin struktur: ${err.message || 'Gagal'}`);
    } finally {
      setIsCopying(false);
    }
  };

  const handleRestoreFromLocalBackup = async () => {
    if (!selectedTrainingId) return;
    const targetTraining = trainings.find(t => t.id === selectedTrainingId);
    if (!targetTraining) return;

    try {
      const raw = localStorage.getItem(`garda_lms_backup_${selectedTrainingId}`);
      if (!raw) {
        alert('Tidak ditemukan cadangan lokal untuk pelatihan ini.');
        return;
      }
      const backupButtons = JSON.parse(raw);
      if (!Array.isArray(backupButtons) || backupButtons.length === 0) {
        alert('Cadangan lokal kosong.');
        return;
      }

      if (!confirm(`Pulihkan ${backupButtons.length} tautan dari cadangan lokal browser ini?`)) {
        return;
      }

      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const payload = {
        name: targetTraining.name,
        startDate: targetTraining.startDate,
        endDate: targetTraining.endDate,
        icon: targetTraining.icon,
        isActive: targetTraining.isActive,
        buttons: backupButtons
      };

      const res = await fetch(`${baseUrl}/api/lms/configs/${selectedTrainingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchTrainings();
        alert(`Berhasil memulihkan ${backupButtons.length} tautan dari cadangan lokal!`);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memulihkan cadangan');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent, trainingId: string, category: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const training = trainings.find(t => t.id === trainingId);
    if (!training) return;

    const newButtons = [...training.buttons];
    const oldIndex = newButtons.findIndex(b => b.id === active.id);
    const newIndex = newButtons.findIndex(b => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedButtons = arrayMove(newButtons, oldIndex, newIndex);
      // Optimistic update
      setTrainings(trainings.map(t => t.id === trainingId ? { ...t, buttons: reorderedButtons } : t));

      try {
        const baseUrl = (import.meta as any).env.VITE_API_URL || '';
        const payload = { ...training, buttons: reorderedButtons };
        const res = await fetch(`${baseUrl}/api/lms/configs/${trainingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
           fetchTrainings(); // Revert on failure
        } else {
          try {
            localStorage.setItem(`garda_lms_backup_${trainingId}`, JSON.stringify(reorderedButtons));
          } catch (e) {}
        }
      } catch (err) {
        console.error(err);
        fetchTrainings();
      }
    }
  };

  const getPeriodString = (t: LMSTraining) => {
    if (t.startDate && t.endDate) {
      return formatPeriod(t.startDate, t.endDate);
    }
    return t.period || 'Tidak ada periode';
  };

  const formatPeriod = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      
      const startDay = start.getDate();
      const startMonth = months[start.getMonth()];
      const startYear = start.getFullYear();
      
      const endDay = end.getDate();
      const endMonth = months[end.getMonth()];
      const endYear = end.getFullYear();

      if (startYear !== endYear) {
        return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
      } else if (startMonth !== endMonth) {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
      } else if (startDay !== endDay) {
        return `${startDay}-${endDay} ${startMonth} ${startYear}`;
      } else {
        return `${startDay} ${startMonth} ${startYear}`;
      }
    } catch (e) {
      return `${startStr} s.d ${endStr}`;
    }
  };

  const openDetail = (id: string) => {
    setSelectedTrainingId(id);
    setView('detail');
  };

  const backToList = () => {
    if (isGuestDirect) {
      onBack();
      return;
    }
    setSelectedTrainingId(null);
    setView('list');
  };

  const openIframe = (url: string) => {
    setIframeUrl(url);
    setView('iframe');
  };

  const closeIframe = () => {
    setIframeUrl('');
    setView('detail');
  };

  const visibleTrainings = trainings; // Admin sees all, Petugas sees all but inactive are labeled
  const activeTraining = trainings.find(t => t.id === selectedTrainingId);
  const activeTone = (activeTraining?.themeTone && activeTraining.themeTone !== 'pinterest_warm') ? activeTraining.themeTone : 'indigo_twilight';
  const activeBg = (activeTraining?.bgImage && activeTraining.bgImage !== '/images/lms-training-bg.jpg') ? activeTraining.bgImage : (activeTraining?.bgImage === '' ? '' : '/images/lms/lms-bg-1.jpg');
  const heroTheme = getThemeHeroStyles(activeTone);
  const catTheme = getAdminThemeCategoryStyles(activeTone);

  // Kumpulkan semua kategori unik dari pelatihan yang sedang dibuka
  let currentCategories: string[] = [...DEFAULT_CATEGORIES];
  if (activeTraining?.buttons) {
    activeTraining.buttons.forEach(b => {
      if (!currentCategories.includes(b.category)) {
        currentCategories.push(b.category);
      }
    });
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {!isGuestDirect ? (
        <button onClick={view === 'list' ? onBack : backToList} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-semibold group transition-colors cursor-pointer">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> {view === 'list' ? 'Kembali' : 'Kembali ke Daftar Pelatihan'}
        </button>
      ) : (
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Logo Garda Data" 
              className="w-8 h-8 object-contain shrink-0" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-white leading-tight">Garda Data LMS</div>
              <div className="text-[10px] text-slate-500 font-medium">Pelatihan &amp; Instrumen Lapangan BPS</div>
            </div>
          </div>
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-primary-600 font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700">
            <ChevronLeft className="w-4 h-4" /> Keluar ke Halaman Login
          </button>
        </div>
      )}

      {/* Header */}
      {view === 'list' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">
              Learning Management <span className="text-primary-600">System</span>
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium mt-2">Pusat materi, kuis, jadwal, dan instrumen pelatihan terpadu.</p>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-3">
              {trainings.length === 0 && (
                <button onClick={handleMigrateFromFirebase} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shrink-0">
                  <ShieldCheck className="w-5 h-5" /> Migrasi Firebase
                </button>
              )}
              <button onClick={() => { setFormData({ name: '', startDate: '', endDate: '', icon: 'pendidikan', isActive: true }); setShowForm(true); }} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shrink-0">
                <Plus className="w-5 h-5" /> Buat Pelatihan Baru
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Memuat data pelatihan...</div>
      ) : view === 'list' ? (
        // ======================= VIEW: LIST =======================
        <div className="space-y-8">
          {/* Admin Table View */}
          {isAdmin && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-4">Daftar Kegiatan Pelatihan Aktif dan Non Aktif</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Nama Kegiatan</th>
                      <th className="py-3 px-4 font-bold">Periode</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainings.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-6 text-slate-400">Belum ada pelatihan dibuat</td></tr>
                    ) : trainings.map(t => (
                      <tr key={`admin-list-${t.id}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-700 cursor-pointer hover:text-primary-600" onClick={() => openDetail(t.id)}>{t.name}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-slate-500">{getPeriodString(t)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${t.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {t.isActive ? 'Aktif' : 'Non Aktif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenShareModal(t); }} 
                            className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer" 
                            title="Bagikan Tautan Pelatihan Langsung"
                          >
                            <Share2 className="w-4 h-4"/>
                          </button>
                          <button onClick={() => toggleTrainingStatus(t)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors" title="Ubah Status">
                            {t.isActive ? <Unlock className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedTrainingId(t.id); handleOpenThemeModal(t); }} 
                            className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer" 
                            title="Atur Tone Warna & Latar Belakang"
                          >
                            <Palette className="w-4 h-4"/>
                          </button>
                          <button onClick={() => { setFormData({...t, startDate: t.startDate||'', endDate: t.endDate||'', bgImage: t.bgImage || '/images/lms/lms-bg-1.jpg', themeTone: t.themeTone || 'indigo_twilight'}); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Data Pelatihan">
                            <Edit2 className="w-4 h-4"/>
                          </button>
                          <button onClick={() => handleDeleteTraining(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Petugas / Admin Card Grid */}
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6 ml-2">Eksplorasi Modul Pelatihan</h2>
            {trainings.length === 0 && !isAdmin ? (
               <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                  <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-700">Belum ada pelatihan</h3>
                  <p className="text-slate-500 mt-2">Saat ini belum ada kelas pelatihan yang tersedia.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {trainings.map((t, idx) => {
                  const IconComponent = ICON_MAP[t.icon] || BookOpen;
                  const colorClass = CARD_COLORS[idx % CARD_COLORS.length];
                  
                  return (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={t.id} 
                      onClick={() => { if(t.isActive || isAdmin) openDetail(t.id); }}
                      className={`relative group p-5 md:p-6 rounded-[2rem] border-2 ${t.isActive || isAdmin ? 'cursor-pointer' : 'cursor-not-allowed'} transition-all shadow-sm flex flex-col h-full overflow-hidden ${t.isActive ? colorClass : 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'}`}
                    >
                      {/* Decorative Background Icon */}
                      <IconComponent className="absolute -right-6 -bottom-6 w-32 h-32 opacity-5 pointer-events-none" />

                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${t.isActive ? 'bg-white/60 shadow-sm' : 'bg-slate-200/50'}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenShareModal(t);
                              }}
                              className="p-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-600 hover:text-emerald-600 shadow-2xs transition-colors cursor-pointer"
                              title="Bagikan Tautan Pelatihan Langsung"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${t.isActive ? 'bg-white/60' : 'bg-slate-200'}`}>
                            {t.isActive ? 'Aktif' : 'Ditutup'}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg md:text-xl font-black mb-2 leading-tight flex-grow pr-2">
                        {t.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-auto">
                        <Calendar className="w-4 h-4 opacity-70" />
                        <span className="text-xs font-bold opacity-80 uppercase">{getPeriodString(t)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : view === 'detail' && activeTraining ? (
        // ======================= VIEW: DETAIL (Desain Sesuai Gambar Referensi & Tone Warna Admin) =======================
        <div 
          className="relative p-2 sm:p-5 md:p-7 rounded-[2.5rem] transition-all duration-300 overflow-hidden"
          style={
            activeBg 
              ? {
                  backgroundImage: `url(${activeBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  backgroundAttachment: 'local'
                }
              : undefined
          }
        >
          {activeBg && (
            <div className="absolute inset-0 bg-[#f8f6ee]/85 dark:bg-slate-950/90 backdrop-blur-[3px] rounded-[2.5rem] pointer-events-none" />
          )}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 space-y-6 md:space-y-8 max-w-6xl mx-auto">
            {(() => {
              const allAvailableButtons = isAdmin 
                ? (activeTraining.buttons || []) 
                : (activeTraining.buttons || []).filter(b => b && b.isActive);

              return (
                <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    {/* Logomark Resmi: BPS & Garda Data (Menggantikan Icon PS) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 p-2 shadow-xs flex items-center justify-center hover:scale-105 transition-transform" title="Badan Pusat Statistik (BPS)">
                        <img 
                          src="/bps-logo.svg" 
                          alt="Logo Badan Pusat Statistik (BPS)" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/2/28/Lambang_Badan_Pusat_Statistik_%28BPS%29_Indonesia.svg';
                          }}
                        />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 p-1.5 shadow-xs flex items-center justify-center hover:scale-105 transition-transform" title="Garda Data - BPS Mempawah">
                        <img 
                          src="/logo.png" 
                          alt="Logo Garda Data" 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                        Welcome to the Learning Management System of BPS Mempawah
                      </h2>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        <span>Portal Resmi Pembelajaran &amp; Instrumen Pelatihan Mandiri</span>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Admin */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => handleOpenShareModal(activeTraining)} 
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center gap-1.5 transition-colors shadow-xs text-xs cursor-pointer"
                          title="Bagikan Tautan Pelatihan Langsung ke Petugas"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Bagikan Tautan</span>
                        </button>
                        <button 
                          onClick={() => handleOpenThemeModal(activeTraining)} 
                          className="px-3.5 py-2 bg-gradient-to-r from-[#f89777] to-amber-500 hover:from-[#e77e5d] hover:to-amber-600 text-white rounded-2xl font-bold flex items-center gap-1.5 transition-all shadow-xs text-xs cursor-pointer"
                          title="Atur Tone Warna & Latar Belakang (Background) Kegiatan Pelatihan"
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span>Tone &amp; Background</span>
                        </button>
                        <button onClick={() => { setButtonFormData({ title: '', url: '', category: DEFAULT_CATEGORIES[0], isActive: true }); setIsCustomCategory(false); setShowButtonForm(true); }} className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold flex items-center gap-1.5 transition-colors shadow-xs text-xs cursor-pointer">
                          <Plus className="w-3.5 h-3.5" /> Tautan Baru
                        </button>
                        <button 
                          onClick={() => { 
                            const firstAvailable = trainings.find(t => t.id !== activeTraining.id && (t.buttons || []).length > 0);
                            setSelectedSourceId(firstAvailable ? firstAvailable.id : 'template_bps_standard');
                            setCopyMode('merge');
                            setShowCopyModal(true); 
                          }} 
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold flex items-center gap-1.5 transition-colors shadow-xs text-xs cursor-pointer" 
                          title="Salin Materi dari Pelatihan Lain"
                        >
                          <Copy className="w-3.5 h-3.5" /> Salin
                        </button>
                        <button onClick={() => { setFormData({...activeTraining, startDate: activeTraining.startDate||'', endDate: activeTraining.endDate||'', bgImage: (activeTraining.bgImage && activeTraining.bgImage !== '/images/lms-training-bg.jpg') ? activeTraining.bgImage : '/images/lms/lms-bg-1.jpg', themeTone: (activeTraining.themeTone && activeTraining.themeTone !== 'pinterest_warm') ? activeTraining.themeTone : 'indigo_twilight'}); setShowForm(true); }} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-colors cursor-pointer" title="Edit Data Pelatihan"><Edit2 className="w-4 h-4"/></button>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. JUDUL BESAR KEGIATAN & PERIODE (Welcome Title Style) */}
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {activeTraining.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                      <Calendar className="w-3.5 h-3.5 text-primary-600" />
                      <span>{getPeriodString(activeTraining)}</span>
                    </span>
                    {!activeTraining.isActive && (
                      <span className="text-rose-600 text-xs font-black bg-rose-50 px-2.5 py-1 rounded-xl uppercase flex items-center gap-1">
                        <EyeOff className="w-3.5 h-3.5"/> Pelatihan Ditutup
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. HORIZONTAL CATEGORY PILL FILTER (Welcome Offer, Wash & Iron pill buttons) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
                  <button
                    onClick={() => setActiveCategoryTab('all')}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategoryTab === 'all'
                        ? `${heroTheme.activePill} shadow-xs scale-105`
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Semua Materi ({allAvailableButtons.length})
                  </button>
                  {currentCategories.map(cat => {
                    const count = allAvailableButtons.filter(b => b.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategoryTab(cat)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          activeCategoryTab === cat
                            ? `${heroTheme.activePill} shadow-xs scale-105`
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* 4. HERO FEATURE CARD (Kartu Besar Mengikuti Tone Warna Admin Sesuai Gambar Referensi) */}
                <div className={`rounded-[2.5rem] p-6 sm:p-8 md:p-10 border-2 ${heroTheme.cardBorder} ${heroTheme.cardBg} relative overflow-hidden shadow-sm`}>
                  {/* Efek Ambient Glow */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-4 max-w-xl">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                        Akses Terpadu Materi &amp; Instrumen Pelatihan
                      </h2>

                      {/* Checklist Butir Fitur dengan Titik Oranye */}
                      <div className="space-y-2 text-xs sm:text-sm font-bold text-slate-700">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${heroTheme.highlightDot} shrink-0`}></span>
                          <span>Presensi Kehadiran Online &amp; Surat Tugas Lapangan</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${heroTheme.highlightDot} shrink-0`}></span>
                          <span>Buku Pedoman Pencacahan, Konsep Definisi &amp; Kuesioner</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${heroTheme.highlightDot} shrink-0`}></span>
                          <span>Jadwal Agenda Harian, Pre-Test &amp; Evaluasi Pelatihan</span>
                        </div>
                      </div>

                      {/* Logo BPS + Logo Garda Data + Tombol Frosted Glass Slider */}
                      <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                        {/* Logo Resmi Badan Pusat Statistik (BPS) */}
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-center p-2.5 shrink-0 hover:scale-105 transition-transform" title="Badan Pusat Statistik (BPS)">
                          <img 
                            src="/bps-logo.svg" 
                            alt="Logo Badan Pusat Statistik (BPS)" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/2/28/Lambang_Badan_Pusat_Statistik_%28BPS%29_Indonesia.svg';
                            }}
                          />
                        </div>

                        {/* Logo Resmi Garda Data */}
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-center p-2 shrink-0 hover:scale-105 transition-transform" title="Garda Data - BPS Mempawah">
                          <img 
                            src="/logo.png" 
                            alt="Logo Garda Data" 
                            className="w-full h-full object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>

                        {/* Tombol Frosted Glass Slider (Order Now Style) */}
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('lms-materials-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`rounded-full py-2 pl-2 pr-6 ${heroTheme.sliderBg} backdrop-blur-md flex items-center gap-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                        >
                          <div className={`w-9 h-9 rounded-full ${heroTheme.sliderCircle} flex items-center justify-center font-bold shadow-xs`}>
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-black text-xs sm:text-sm text-slate-800">
                            Buka Daftar Materi
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>

                    {/* Dekorasi Visual Grafis Kanan (Sesuai gambar referensi) */}
                    <div className="hidden sm:flex flex-col items-center justify-center w-40 h-40 md:w-52 md:h-52 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md p-4 text-center shrink-0">
                      <div className={`w-20 h-20 rounded-3xl ${heroTheme.cardBg} border ${heroTheme.cardBorder} flex items-center justify-center shadow-xs mb-2`}>
                        {React.createElement(ICON_MAP[activeTraining.icon] || BookOpen, { className: "w-10 h-10 text-slate-800" })}
                      </div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 justify-center">
                        <img src="/logo.png" alt="Garda Data" className="w-3.5 h-3.5 object-contain" />
                        <span>Garda Data LMS</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">{activeTraining.icon}</div>
                    </div>
                  </div>
                </div>

                {/* Banner Akses Langsung Petugas Bila Tanpa Login */}
                {isGuestDirect && (
                  <div className="p-4 md:p-5 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs shrink-0">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                          <span>Laman Pelatihan Langsung Petugas</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                            Mode Terarah Aktif
                          </span>
                        </div>
                        <div className="text-[11px] md:text-xs text-emerald-800/80 dark:text-emerald-300/90 mt-0.5 leading-relaxed">
                          Anda dapat mengakses materi, instrumen, dan jadwal kegiatan ini secara langsung. Untuk membuka fitur sistem Garda Data lainnya, silakan masuk ke akun Anda.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onBack}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-2xl shrink-0 transition-colors cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      <span>Masuk ke Garda Data</span>
                    </button>
                  </div>
                )}

                {/* Empty State bila Belum Ada Materi */}
                {!isAdmin && allAvailableButtons.length === 0 && (
                  <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto my-6 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto shadow-2xs">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Belum Ada Materi Tersedia</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Materi dan tautan kegiatan untuk pelatihan ini belum dipublikasikan oleh administrator. Silakan periksa kembali nanti atau hubungi panitia penyelenggara.
                    </p>
                  </div>
                )}
              </>
            );
          })()}

          {/* Helper Banner bila Belum Ada Materi */}
          {isAdmin && (activeTraining.buttons || []).length === 0 && (
            <div className="p-5 md:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-dashed border-amber-200 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm md:text-base">Pelatihan ini belum memiliki tautan materi</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Anda dapat menambahkan tautan baru satu per satu, menyalin dari pelatihan sebelumnya, atau memulihkan dari cadangan lokal browser.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                {(() => {
                  const backup = localStorage.getItem(`garda_lms_backup_${activeTraining.id}`);
                  if (backup) {
                    try {
                      const count = JSON.parse(backup).length;
                      if (count > 0) {
                        return (
                          <button
                            onClick={handleRestoreFromLocalBackup}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Pulihkan ({count} Tautan)
                          </button>
                        );
                      }
                    } catch (e) {}
                  }
                  return null;
                })()}
                <button
                  onClick={() => {
                    const firstAvailable = trainings.find(t => t.id !== activeTraining.id && (t.buttons || []).length > 0);
                    setSelectedSourceId(firstAvailable ? firstAvailable.id : 'template_bps_standard');
                    setCopyMode('merge');
                    setShowCopyModal(true);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin Struktur dari Pelatihan Lain
                </button>
              </div>
            </div>
          )}

          {/* Empty State Tampilan Petugas Bila Belum Ada Materi */}
          {!isAdmin && (activeTraining.buttons || []).filter(b => b && b.isActive).length === 0 && (
            <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto my-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto shadow-2xs">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Belum Ada Materi Tersedia</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Materi dan tautan kegiatan untuk pelatihan ini belum dipublikasikan oleh administrator. Silakan periksa kembali nanti atau hubungi panitia penyelenggara.
              </p>
            </div>
          )}

          {/* Grup Elemen Pelatihan (Clean Modern Stack matching Reference Image) */}
          <div id="lms-materials-section" className="space-y-8 pt-2">
            {(() => {
              const displayedCategories = activeCategoryTab === 'all'
                ? currentCategories
                : currentCategories.filter(c => c === activeCategoryTab);

              let globalCardIndex = 0;

              return displayedCategories.map((category, idx) => {
                const visibleButtons = isAdmin ? (activeTraining.buttons || []) : (activeTraining.buttons || []).filter(b => b && b.isActive);
                const btns = visibleButtons.filter(b => b && b.category === category);
                
                if (btns.length === 0 && !isAdmin) return null;
                
                const CategoryIcon = CATEGORY_ICONS[category] || Link2;

                return (
                  <div 
                    key={category} 
                    className={`rounded-[2.5rem] ${catTheme.cardBg} ${catTheme.cardBorder} shadow-sm border-2 p-6 sm:p-8 space-y-6 relative overflow-hidden`}
                  >
                    {/* Header Kategori Sesuai Gambar Referensi (Warna Sesuai Tema Admin, Tanpa Ikon ✨) */}
                    <div className={`flex items-start justify-between gap-4 pb-4 border-b ${catTheme.headerBorder}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${catTheme.eyebrowColor}`}>
                            Kategori Pelatihan
                          </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                          {category}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1.5 max-w-xl">
                          {getCategoryDescription(category)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black border shadow-2xs ${catTheme.badgeBg}`}>
                          {btns.length} Tautan
                        </span>
                        {/* Ikon Kategori Resmi Sesuai Warna Admin (Ikon ✨ Dihilangkan) */}
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${catTheme.iconBg}`}>
                          <CategoryIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Stack Kartu Item di Dalam Kategori (Sesuai Baris-Baris Pada Gambar Referensi) */}
                    {btns.length > 0 ? (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, activeTraining.id, category)}>
                        <SortableContext items={btns.map(b => b.id)} strategy={rectSortingStrategy}>
                          <div className="space-y-3 sm:space-y-3.5">
                            {btns.map(btn => {
                              const currentIdx = globalCardIndex++;
                              const now = new Date();
                              const sDate = btn.startDate ? new Date(btn.startDate) : null;
                              const eDate = btn.endDate ? new Date(btn.endDate) : null;
                              const isNotOpen = sDate && now < sDate;
                              const isClosed = eDate && now > eDate;
                              const isLocked = !isAdmin && (isNotOpen || isClosed || !btn.isActive);
                              
                              let lockLabel = '';
                              if (isNotOpen) lockLabel = `Belum Dibuka (Buka: ${formatIndonesianTime24(btn.startDate)})`;
                              else if (isClosed) lockLabel = `Sudah Ditutup (Berakhir: ${formatIndonesianTime24(btn.endDate)})`;
                              else if (!btn.isActive) lockLabel = 'Nonaktif';

                              const isIframe = (btn.url || '').trim().startsWith('<iframe');

                              return (
                                <SortableLinkItem 
                                  key={btn.id} 
                                  btn={btn} 
                                  index={currentIdx}
                                  catTheme={catTheme}
                                  isAdmin={isAdmin} 
                                  isLocked={isLocked} 
                                  lockLabel={lockLabel} 
                                  isIframe={isIframe} 
                                  openIframe={openIframe} 
                                  toggleButtonStatus={toggleButtonStatus} 
                                  setButtonFormData={setButtonFormData} 
                                  setIsCustomCategory={setIsCustomCategory} 
                                  setShowButtonForm={setShowButtonForm} 
                                  handleDeleteButton={handleDeleteButton} 
                                  activeTrainingId={activeTraining.id}
                                  DEFAULT_CATEGORIES={DEFAULT_CATEGORIES} 
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="text-center py-8 text-xs font-bold text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/40">
                        Belum ada tautan materi yang ditambahkan di kategori ini
                      </div>
                    )}
                  </div>
                );
              });
            })()}
            </div>
          </motion.div>
        </div>
      ) : view === 'iframe' ? (
        // ======================= VIEW: IFRAME =======================
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-0 z-[100] flex flex-col bg-white overflow-hidden">
           <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50 shrink-0 shadow-sm gap-4">
             <button onClick={closeIframe} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl font-bold transition-colors">
               <ChevronLeft className="w-5 h-5"/> <span className="hidden sm:inline">Kembali</span>
             </button>
             <div className="flex items-center gap-3">
               <span className="font-bold text-slate-700 hidden md:block mr-2">Tampilan Sematan</span>
               {(() => {
                 const match = iframeUrl.match(/src="([^"]+)"/);
                 const srcUrl = match ? match[1] : '';
                 if (srcUrl) {
                   return (
                     <a href={srcUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors shadow-sm text-sm">
                       Buka di Tab Baru <ExternalLink className="w-4 h-4"/>
                     </a>
                   );
                 }
                 return null;
               })()}
             </div>
           </div>
           {/* Info banner for potential blocked iframes */}
           <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs md:text-sm text-amber-800 flex items-center justify-center gap-2 shrink-0">
             <HelpCircle className="w-4 h-4 shrink-0" />
             <p>Jika layar di bawah ini kosong/error, browser Anda memblokir tampilannya. Silakan klik tombol <strong>"Buka di Tab Baru"</strong> di atas.</p>
           </div>
           {(() => {
             const match = (iframeUrl || '').match(/src="([^"]+)"/);
             const srcUrl = match ? match[1] : (iframeUrl && iframeUrl.startsWith('http') ? iframeUrl : '');
             if (srcUrl) {
               return (
                 <iframe
                   src={srcUrl}
                   title="Materi Pelatihan"
                   className="flex-1 w-full h-full border-0 bg-white"
                   sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                   loading="lazy"
                 />
               );
             }
             return (
               <div className="flex-1 w-full h-full flex items-center justify-center text-slate-400 text-sm">
                 Format sematan tidak valid. Silakan periksa URL sumber materi.
               </div>
             );
           })()}
        </motion.div>
      ) : null}

      {/* Modal Form Pelatihan (Admin) */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl my-8">
              <h3 className="text-2xl font-black text-slate-900 mb-6">{formData.id ? 'Edit Pelatihan' : 'Buat Pelatihan Baru'}</h3>
              <form onSubmit={handleSaveTraining} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Pelatihan</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold" placeholder="Contoh: Pelatihan Petugas Susenas" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <IndonesianDateTimePicker
                    label="Tanggal Mulai"
                    mode="date"
                    value={formData.startDate}
                    onChange={val => setFormData({...formData, startDate: val})}
                    required
                  />
                  <IndonesianDateTimePicker
                    label="Tanggal Selesai"
                    mode="date"
                    value={formData.endDate}
                    onChange={val => setFormData({...formData, endDate: val})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Ikon Tema</label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                    {Object.keys(ICON_MAP).map(iconName => {
                      const Icon = ICON_MAP[iconName];
                      return (
                        <button key={iconName} type="button" onClick={() => setFormData({...formData, icon: iconName})} className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-colors ${formData.icon === iconName ? 'bg-primary-50 border-primary-500 text-primary-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                          <Icon className="w-5 h-5" />
                          <span className="text-[8px] font-bold uppercase truncate w-full text-center">{iconName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tone Warna Pelatihan */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Tone Warna Pelatihan</label>
                    {(() => {
                      const activeToneObj = LMS_THEME_OPTIONS.find(o => o.id === (formData.themeTone || 'indigo_twilight'));
                      return activeToneObj ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: activeToneObj.color }} />
                          {activeToneObj.name}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <select
                    value={formData.themeTone || 'indigo_twilight'}
                    onChange={e => setFormData({ ...formData, themeTone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
                  >
                    {LMS_THEME_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name} — {opt.desc}</option>
                    ))}
                  </select>
                </div>

                {/* Gambar Latar Pelatihan */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Gambar Latar (Background)</label>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">Pilih Preset</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-1.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60">
                    {LMS_BACKGROUND_PRESETS.map(p => {
                      const isSelected = (formData.bgImage !== undefined ? formData.bgImage : '/images/lms/lms-bg-1.jpg') === p.id;
                      return (
                        <button
                          key={p.id || 'clean-bg'}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              bgImage: p.id,
                              themeTone: p.defaultTone || formData.themeTone || 'indigo_twilight'
                            });
                          }}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center gap-1.5 relative ${
                            isSelected
                              ? 'bg-amber-50/90 dark:bg-amber-950/50 border-[#f89777] ring-2 ring-[#f89777]/40 shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-full h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            {p.preview ? (
                              <img src={p.preview} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="w-full text-center">
                            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#f89777] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 mt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-md">Simpan</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Form Tautan/Tombol (Admin) */}
      <AnimatePresence>
        {showButtonForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl my-8">
              <h3 className="text-2xl font-black text-slate-900 mb-6">{buttonFormData.id ? 'Edit Tautan' : 'Tambah Tautan Kegiatan'}</h3>
              <form onSubmit={handleSaveButton} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Label Tombol</label>
                  <input type="text" value={buttonFormData.title} onChange={e => setButtonFormData({...buttonFormData, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800" placeholder="Contoh: Kuis Pre-Test" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">URL Tautan / Embed HTML</label>
                  <input type="text" value={buttonFormData.url} onChange={e => setButtonFormData({...buttonFormData, url: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-blue-600" placeholder="https://... atau <iframe src=...>" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <IndonesianDateTimePicker
                    label="Waktu Buka (Opsional)"
                    mode="datetime"
                    placeholder="Pilih tanggal & jam buka..."
                    value={buttonFormData.startDate || ''}
                    onChange={val => setButtonFormData({...buttonFormData, startDate: val})}
                  />
                  <IndonesianDateTimePicker
                    label="Waktu Tutup (Opsional)"
                    mode="datetime"
                    placeholder="Pilih tanggal & jam tutup..."
                    value={buttonFormData.endDate || ''}
                    onChange={val => setButtonFormData({...buttonFormData, endDate: val})}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Kelompok Elemen</label>
                    <button type="button" onClick={() => setIsCustomCategory(!isCustomCategory)} className="text-[10px] font-bold text-primary-600 hover:underline uppercase bg-primary-50 px-2 py-1 rounded-md">
                      {isCustomCategory ? 'Pilih dari Daftar' : 'Buat Kategori Baru'}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input type="text" value={buttonFormData.category} onChange={e => setButtonFormData({...buttonFormData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Ketik nama kategori baru..." required />
                  ) : (
                    <IndonesianCategorySelect
                      value={buttonFormData.category}
                      onChange={cat => setButtonFormData({...buttonFormData, category: cat})}
                      categories={currentCategories}
                      categoryIcons={CATEGORY_ICONS}
                    />
                  )}
                </div>
                <div className="flex gap-4 pt-4 mt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowButtonForm(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-md">Simpan Tautan</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Salin Materi dari Pelatihan Lain */}
        {showCopyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-xl shadow-2xl my-8">
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                  <Copy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Salin Struktur Materi Pelatihan</h3>
                  <p className="text-xs text-slate-500">Pilih pelatihan sumber atau template baku BPS untuk disalin ke pelatihan ini</p>
                </div>
              </div>

              {activeTraining && (
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500">Target Pelatihan:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{activeTraining.name}</span>
                    <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                      {(activeTraining.buttons || []).length} Tautan Tersedia
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" /> Pilih Sumber Struktur
                  </label>
                  <select
                    value={selectedSourceId}
                    onChange={e => setSelectedSourceId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">-- Pilih Sumber Pelatihan / Template --</option>
                    
                    {/* Daftar Pelatihan Tersimpan di Database */}
                    <optgroup label="Pelatihan Tersimpan di Database">
                      {trainings
                        .filter(t => t.id !== selectedTrainingId && (t.buttons || []).length > 0)
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({(t.buttons || []).length} tautan materi)
                          </option>
                        ))}
                      {trainings.filter(t => t.id !== selectedTrainingId && (t.buttons || []).length > 0).length === 0 && (
                        <option value="" disabled>Belum ada pelatihan lain dengan tautan di database</option>
                      )}
                    </optgroup>

                    {/* Template Baku BPS */}
                    <optgroup label="Template Baku BPS">
                      <option value="template_bps_standard">
                        Template Standar Pelatihan BPS (5 Kategori Baku: Absensi, Admin, Materi, Jadwal, Kuis)
                      </option>
                    </optgroup>
                  </select>
                </div>

                {/* Pratinjau Struktur Pelatihan yang Dipilih */}
                {(() => {
                  let previewButtons: LMSButton[] = [];
                  let title = '';
                  let isTemplate = false;

                  if (selectedSourceId === 'template_bps_standard') {
                    previewButtons = STANDARD_BPS_BUTTONS;
                    title = 'Template Standar Pelatihan BPS';
                    isTemplate = true;
                  } else if (selectedSourceId) {
                    const src = trainings.find(t => t.id === selectedSourceId);
                    if (src) {
                      previewButtons = src.buttons || [];
                      title = src.name;
                    }
                  }

                  if (previewButtons.length === 0) return null;

                  // Group by categories
                  const grouped: Record<string, string[]> = {};
                  previewButtons.forEach(b => {
                    const cat = b.category || 'Lainnya';
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(b.title);
                  });

                  return (
                    <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-2.5">
                      <div className="font-bold text-amber-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          Pratinjau: {title}
                        </span>
                        <span className="bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-lg text-[11px]">
                          {previewButtons.length} Tautan
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {Object.entries(grouped).map(([category, items]) => (
                          <div key={category} className="bg-white/80 p-2 rounded-xl border border-amber-100">
                            <span className="font-bold text-slate-800 text-[11px] block text-amber-800">{category} ({items.length})</span>
                            <span className="text-[11px] text-slate-500 truncate block">
                              {items.join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-500 italic">
                        {isTemplate 
                          ? 'Tautan standar akan disiapkan. Anda dapat mengganti link URL Google Form / Drive / Jadwal sesuai kebutuhan.'
                          : 'Struktur materi, kategori, dan tautan akan disalin. URL tautan dapat diubah kapan saja.'}
                      </p>
                    </div>
                  );
                })()}

                {/* Pilihan Mode Penyalinan (Merge vs Overwrite) */}
                {activeTraining && (activeTraining.buttons || []).length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Metode Penyalinan Data
                    </label>
                    <div className="space-y-2">
                      <label 
                        onClick={() => setCopyMode('merge')} 
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${copyMode === 'merge' ? 'bg-amber-50/50 border-amber-400 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50'}`}
                      >
                        <input
                          type="radio"
                          name="copyMode"
                          checked={copyMode === 'merge'}
                          onChange={() => setCopyMode('merge')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                            <span>Gabungkan dengan Tautan yang Ada</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-black uppercase">Direkomendasikan</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {(activeTraining.buttons || []).length} tautan yang sudah ada <strong>tidak akan hilang</strong>. Tautan baru dari sumber akan ditambahkan tanpa duplikasi.
                          </p>
                        </div>
                      </label>

                      <label 
                        onClick={() => setCopyMode('replace')} 
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${copyMode === 'replace' ? 'bg-rose-50/50 border-rose-300 text-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50'}`}
                      >
                        <input
                          type="radio"
                          name="copyMode"
                          checked={copyMode === 'replace'}
                          onChange={() => setCopyMode('replace')}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-rose-900 flex items-center gap-1">
                            <span>Ganti Seluruh Tautan (Overwrite)</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Menghapus tautan yang ada dan mengganti seluruhnya dengan struktur baru.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCopyModal(false)}
                    disabled={isCopying}
                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSourceId || isCopying}
                    onClick={() => handleCopyButtonsFromTraining(selectedSourceId, copyMode)}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-md text-sm flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    {isCopying ? 'Menyalin Struktur...' : 'Salin Sekarang'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL SHARE TAUTAN PELATIHAN LANGSUNG */}
        {shareModalTraining && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">
                      Bagikan Tautan Pelatihan
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tautan terarah untuk dibagikan kepada petugas
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShareModalTraining(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4">
                <div className="text-xs font-bold text-slate-800 mb-1">
                  {shareModalTraining.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  Periode: {getPeriodString(shareModalTraining)} • Status: {shareModalTraining.isActive ? 'Aktif' : 'Non Aktif'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold text-slate-700 block">
                  Tautan Langsung (Direct Link):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getDirectShareUrl(shareModalTraining.id)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all outline-none"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyShareLink(shareModalTraining)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary-600 hover:bg-primary-700 text-white shadow-xs'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tombol aksi cepat: WhatsApp & Buka Tab Baru */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Yth. Bapak/Ibu Petugas,\nBerikut tautan langsung materi & instrumen pelatihan *${shareModalTraining.name}*:\n\n${getDirectShareUrl(shareModalTraining.id)}\n\n(Dapat langsung diakses tanpa login untuk melihat materi kegiatan ini)`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Kirim ke WhatsApp</span>
                </a>

                <a
                  href={getDirectShareUrl(shareModalTraining.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Uji di Tab Baru</span>
                </a>
              </div>

              {/* Aturan Hak Akses Keamanan */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sky-900">Petugas Tanpa Login:</span>
                    <p className="text-[11px] text-sky-800/80 mt-0.5">
                      Hanya dapat melihat dan mengakses tautan materi pelatihan ini saja. Seluruh navigasi dan modul Garda Data lainnya tertutup otomatis.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-sky-200/50">
                  <Unlock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900">Petugas Sudah Login:</span>
                    <p className="text-[11px] text-emerald-800/80 mt-0.5">
                      Langsung membuka materi pelatihan ini sekaligus dapat membuka fitur Garda Data lainnya secara penuh sesuai hak akses akun.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-right">
                <button
                  type="button"
                  onClick={() => setShareModalTraining(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL TONE WARNA & BACKGROUND KEGIATAN PELATIHAN (ADMIN) */}
        {showThemeModal && activeTraining && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#f89777] to-amber-500 text-white flex items-center justify-center shadow-md shadow-[#f89777]/20 shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-base sm:text-lg">
                      Tone Warna &amp; Background Pelatihan
                    </h3>
                    <p className="text-xs text-slate-400">
                      Kustomisasi estetika laman kegiatan pelatihan untuk petugas
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowThemeModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Pilih Tone Warna */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  1. Pilih Tone Warna Pelatihan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {LMS_THEME_OPTIONS.map(opt => {
                    const isSelected = themeToneSelect === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setThemeToneSelect(opt.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected 
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-[#f89777] ring-2 ring-[#f89777]/30 shadow-xs' 
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span 
                          className="w-4 h-4 rounded-full mt-0.5 shrink-0 shadow-2xs" 
                          style={{ backgroundColor: opt.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                              {opt.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#f89777] shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Pilih Background Gambar */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  2. Gambar Latar Belakang (Background)
                </label>

                {/* Preset Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {LMS_BACKGROUND_PRESETS.map((preset) => {
                    const isSelected = bgImageSelect === preset.id;
                    return (
                      <button
                        key={preset.id || 'clean-bg'}
                        type="button"
                        onClick={() => {
                          setBgImageSelect(preset.id);
                          if (preset.defaultTone) {
                            setThemeToneSelect(preset.defaultTone);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-[#f89777] ring-2 ring-[#f89777]/30'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600 shadow-2xs bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          {preset.preview ? (
                            <img 
                              src={preset.preview} 
                              alt={preset.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{preset.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {preset.desc || (preset.preview ? 'Klik untuk terapkan tone & bg' : 'Gradien Polos Minimalis')}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#f89777] text-white flex items-center justify-center shadow-xs shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowThemeModal(false)}
                  className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingTheme}
                  onClick={() => handleSaveTrainingTheme(themeToneSelect, bgImageSelect)}
                  className="flex-1 py-3 bg-gradient-to-r from-[#f89777] to-amber-500 hover:from-[#e77e5d] hover:to-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#f89777]/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingTheme ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Terapkan &amp; Simpan</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
