import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, Edit2, Trash2, ShieldCheck, CheckCircle2, EyeOff, BookOpen, Briefcase, Users, Landmark, Wheat, Factory, Settings, Tag, Truck, BarChart2, GraduationCap, Cpu, Lock, Unlock, Link2, FolderOpen, Calendar, HelpCircle, FileCheck, ExternalLink, GripVertical, Clock, Copy, RotateCcw, Sparkles, Layers, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
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
}

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
  'distribusi': Truck,
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

// Component Sortable Item untuk Dnd-Kit
const SortableLinkItem = ({ btn, isAdmin, theme, isLocked, lockLabel, isIframe, openIframe, toggleButtonStatus, setButtonFormData, setIsCustomCategory, setShowButtonForm, handleDeleteButton, activeTrainingId, DEFAULT_CATEGORIES }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: btn.id, disabled: !isAdmin });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`group relative bg-white border-2 rounded-2xl transition-all flex flex-col overflow-hidden shadow-sm ${!isLocked ? `border-white hover:shadow-xl hover:-translate-y-1 ${theme.linkHover}` : 'border-slate-200 opacity-70'}`}>
      {isIframe ? (
        <button onClick={() => !isLocked && openIframe(btn.url)} disabled={isLocked} className="flex-grow p-4 flex items-center gap-4 text-left w-full h-full">
          <div className={`p-3 shrink-0 rounded-xl ${!isLocked ? `${theme.linkIconBg} ${theme.iconColor} ${theme.linkIconHover} group-hover:text-white transition-all` : 'bg-slate-100 text-slate-400'}`}>
            <ExternalLink className="w-5 h-5" />
          </div>
          <div className="flex flex-col flex-grow">
            <span className="font-bold text-slate-700 leading-tight pr-2 text-sm md:text-base">{btn.title}</span>
            {lockLabel && <span className="text-xs font-bold text-rose-500 mt-1 uppercase flex items-center gap-1"><Lock className="w-3 h-3 shrink-0"/> {lockLabel}</span>}
            {!lockLabel && (btn.startDate || btn.endDate) && (
              <span className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                {btn.endDate ? `Batas: ${formatIndonesianTime24(btn.endDate)}` : `Buka: ${formatIndonesianTime24(btn.startDate)}`}
              </span>
            )}
          </div>
        </button>
      ) : (
        <a href={isLocked ? '#' : btn.url} target={isLocked ? '_self' : '_blank'} rel="noreferrer" className={`flex-grow p-4 flex items-center gap-4 ${isLocked ? 'pointer-events-none' : ''}`}>
          <div className={`p-3 shrink-0 rounded-xl ${!isLocked ? `${theme.linkIconBg} ${theme.iconColor} ${theme.linkIconHover} group-hover:text-white transition-all` : 'bg-slate-100 text-slate-400'}`}>
            <ExternalLink className="w-5 h-5" />
          </div>
          <div className="flex flex-col flex-grow">
            <span className="font-bold text-slate-700 leading-tight pr-2 text-sm md:text-base">{btn.title}</span>
            {lockLabel && <span className="text-xs font-bold text-rose-500 mt-1 uppercase flex items-center gap-1"><Lock className="w-3 h-3 shrink-0"/> {lockLabel}</span>}
            {!lockLabel && (btn.startDate || btn.endDate) && (
              <span className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                {btn.endDate ? `Batas: ${formatIndonesianTime24(btn.endDate)}` : `Buka: ${formatIndonesianTime24(btn.startDate)}`}
              </span>
            )}
          </div>
        </a>
      )}
      {isAdmin && (
        <div className="flex border-t border-slate-100 bg-slate-50 shrink-0">
          <div {...attributes} {...listeners} className="p-2 flex-1 text-slate-400 hover:bg-slate-200 transition-colors border-r border-slate-100 cursor-grab flex items-center justify-center touch-none" title="Geser (Drag)">
            <GripVertical className="w-4 h-4" />
          </div>
          <button onClick={() => toggleButtonStatus(activeTrainingId, btn.id)} className={`p-2 flex-1 transition-colors border-r border-slate-100 ${btn.isActive ? 'text-emerald-600 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-200'}`} title={btn.isActive ? "Matikan Tautan" : "Aktifkan Tautan"}>
            {btn.isActive ? <Unlock className="w-4 h-4 mx-auto"/> : <Lock className="w-4 h-4 mx-auto"/>}
          </button>
          <button onClick={() => { setButtonFormData(btn); setIsCustomCategory(!DEFAULT_CATEGORIES.includes(btn.category)); setShowButtonForm(true); }} className="p-2 flex-1 text-indigo-600 hover:bg-indigo-100 transition-colors border-r border-slate-100" title="Edit"><Edit2 className="w-4 h-4 mx-auto"/></button>
          <button onClick={() => handleDeleteButton(activeTrainingId, btn.id)} className="p-2 flex-1 text-rose-600 hover:bg-rose-100 transition-colors" title="Hapus"><Trash2 className="w-4 h-4 mx-auto"/></button>
        </div>
      )}
    </div>
  );
};

export const LMSModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [trainings, setTrainings] = useState<LMSTraining[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: 'list' or 'detail' or 'iframe'
  const [view, setView] = useState<'list' | 'detail' | 'iframe'>('list');
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string>('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{ id?: string, name: string, startDate: string, endDate: string, icon: string, isActive: boolean }>({
    name: '', startDate: '', endDate: '', icon: 'pendidikan', isActive: true
  });

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
          return {
            ...d,
            startDate: d.startDate ? d.startDate.split('T')[0] : '',
            endDate: d.endDate ? d.endDate.split('T')[0] : '',
            isActive: Boolean(d.isActive),
            buttons: parsedButtons
          };
        }) as LMSTraining[];
        setTrainings(formatted);
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
        isActive: formData.isActive
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
        setFormData({ name: '', startDate: '', endDate: '', icon: 'pendidikan', isActive: true });
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
      <button onClick={view === 'list' ? onBack : backToList} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-semibold group transition-colors">
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> {view === 'list' ? 'Kembali' : 'Kembali ke Daftar Pelatihan'}
      </button>

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
                          <button onClick={() => toggleTrainingStatus(t)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors" title="Ubah Status">
                            {t.isActive ? <Unlock className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
                          </button>
                          <button onClick={() => { setFormData({...t, startDate: t.startDate||'', endDate: t.endDate||''}); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
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
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${t.isActive ? 'bg-white/60' : 'bg-slate-200'}`}>
                          {t.isActive ? 'Aktif' : 'Ditutup'}
                        </span>
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
        // ======================= VIEW: DETAIL =======================
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
          {/* Header Pelatihan */}
          <div className={`bg-white border rounded-[2.5rem] p-6 md:p-10 transition-all relative overflow-hidden ${activeTraining.isActive ? 'border-primary-100 shadow-xl shadow-primary-50/50' : 'border-slate-200 opacity-90'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className={`p-5 rounded-3xl ${activeTraining.isActive ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-400'}`}>
                  {React.createElement(ICON_MAP[activeTraining.icon] || BookOpen, { className: "w-10 h-10" })}
                </div>
                <div>
                  <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">{activeTraining.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="text-primary-600 font-bold bg-primary-50 px-3 py-1.5 rounded-xl text-xs md:text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> {getPeriodString(activeTraining)}
                    </span>
                    {!activeTraining.isActive && <span className="text-rose-500 text-xs font-black bg-rose-50 px-3 py-1.5 rounded-xl uppercase flex items-center gap-1"><EyeOff className="w-4 h-4"/> Pelatihan Ditutup</span>}
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button onClick={() => { setButtonFormData({ title: '', url: '', category: DEFAULT_CATEGORIES[0], isActive: true }); setIsCustomCategory(false); setShowButtonForm(true); }} className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md text-xs sm:text-sm">
                    <Plus className="w-4 h-4" /> Tautan Baru
                  </button>
                  <button 
                    onClick={() => { 
                      const firstAvailable = trainings.find(t => t.id !== activeTraining.id && (t.buttons || []).length > 0);
                      setSelectedSourceId(firstAvailable ? firstAvailable.id : 'template_bps_standard');
                      setCopyMode('merge');
                      setShowCopyModal(true); 
                    }} 
                    className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm text-xs sm:text-sm" 
                    title="Salin Materi dari Pelatihan Lain"
                  >
                    <Copy className="w-4 h-4" /> Salin Materi
                  </button>
                  <button onClick={() => { setFormData({...activeTraining, startDate: activeTraining.startDate||'', endDate: activeTraining.endDate||''}); setShowForm(true); }} className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors" title="Edit Data Pelatihan"><Edit2 className="w-5 h-5"/></button>
                </div>
              )}
            </div>
          </div>

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

          {/* Grup Elemen Pelatihan */}
          <div className="space-y-6 md:space-y-8">
            {currentCategories.map((category, idx) => {
              const visibleButtons = isAdmin ? (activeTraining.buttons || []) : (activeTraining.buttons || []).filter(b => b && b.isActive);
              const btns = visibleButtons.filter(b => b && b.category === category);
              
              if (btns.length === 0 && !isAdmin) return null;
              
              const CategoryIcon = CATEGORY_ICONS[category] || Link2;
              
              // Tentukan variasi warna berdasarkan index kategori
              const colorSchemes = [
                { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', linkHover: 'hover:border-emerald-300 hover:shadow-emerald-200', linkIconBg: 'bg-emerald-50', linkIconHover: 'group-hover:bg-emerald-500' },
                { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', linkHover: 'hover:border-blue-300 hover:shadow-blue-200', linkIconBg: 'bg-blue-50', linkIconHover: 'group-hover:bg-blue-500' },
                { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', linkHover: 'hover:border-amber-300 hover:shadow-amber-200', linkIconBg: 'bg-amber-50', linkIconHover: 'group-hover:bg-amber-500' },
                { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', linkHover: 'hover:border-rose-300 hover:shadow-rose-200', linkIconBg: 'bg-rose-50', linkIconHover: 'group-hover:bg-rose-500' },
                { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', linkHover: 'hover:border-indigo-300 hover:shadow-indigo-200', linkIconBg: 'bg-indigo-50', linkIconHover: 'group-hover:bg-indigo-500' },
              ];
              const theme = colorSchemes[idx % colorSchemes.length];

              return (
                <div key={category} className={`${theme.bg} rounded-[2rem] p-5 md:p-8 border ${theme.border}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className={`font-black ${theme.text} uppercase tracking-widest text-sm md:text-base flex items-center gap-3`}>
                      <div className={`p-2 rounded-xl shadow-sm border border-white/50 ${theme.iconBg}`}>
                        <CategoryIcon className={`w-5 h-5 ${theme.iconColor}`} />
                      </div>
                      {category}
                    </h3>
                  </div>

                  {btns.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, activeTraining.id, category)}>
                      <SortableContext items={btns.map(b => b.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                          {btns.map(btn => {
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
                                isAdmin={isAdmin} 
                                theme={theme} 
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
                    <div className="text-center py-8 text-sm text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">Belum ada tautan yang ditambahkan di elemen ini</div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
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
           <div className="flex-1 w-full h-full overflow-y-auto iframe-container bg-slate-50/50" style={{ WebkitOverflowScrolling: 'touch' }} dangerouslySetInnerHTML={{ __html: (iframeUrl || '').replace(/width="[^"]*"/, 'width="100%"') }} />
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
      </AnimatePresence>
    </div>
  );
};
