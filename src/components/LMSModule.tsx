import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, Edit2, Trash2, ShieldCheck, CheckCircle2, EyeOff, BookOpen, Briefcase, Users, Landmark, Wheat, Factory, Settings, Tag, Truck, BarChart2, GraduationCap, Cpu, Lock, Unlock, Link2, FolderOpen, Calendar, HelpCircle, FileCheck, ExternalLink } from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';

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

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'lms_trainings'), orderBy('createdAt', 'desc')));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as LMSTraining[];
      setTrainings(data);
    } catch (err) {
      console.error('Gagal mengambil data pelatihan', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateDoc(doc(db, 'lms_trainings', formData.id), {
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          icon: formData.icon,
          isActive: formData.isActive
        });
      } else {
        await addDoc(collection(db, 'lms_trainings'), {
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          icon: formData.icon,
          isActive: formData.isActive,
          buttons: [],
          createdAt: serverTimestamp()
        });
      }
      setShowForm(false);
      setFormData({ name: '', startDate: '', endDate: '', icon: 'pendidikan', isActive: true });
      fetchTrainings();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pelatihan');
    }
  };

  const handleDeleteTraining = async (id: string) => {
    if (!confirm('Hapus pelatihan ini secara permanen?')) return;
    try {
      await deleteDoc(doc(db, 'lms_trainings', id));
      if (selectedTrainingId === id) setView('list');
      fetchTrainings();
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
          isActive: buttonFormData.isActive
        });
      }

      await updateDoc(doc(db, 'lms_trainings', selectedTrainingId), { buttons: newButtons });
      setShowButtonForm(false);
      setButtonFormData({ title: '', url: '', category: DEFAULT_CATEGORIES[0], isActive: true });
      setIsCustomCategory(false);
      fetchTrainings();
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
      await updateDoc(doc(db, 'lms_trainings', trainingId), { buttons: newButtons });
      fetchTrainings();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTrainingStatus = async (t: LMSTraining) => {
    try {
      await updateDoc(doc(db, 'lms_trainings', t.id), { isActive: !t.isActive });
      fetchTrainings();
    } catch (err) {}
  };

  const toggleButtonStatus = async (trainingId: string, buttonId: string) => {
    const training = trainings.find(t => t.id === trainingId);
    if (!training) return;
    try {
      const newButtons = training.buttons.map(b => b.id === buttonId ? { ...b, isActive: !b.isActive } : b);
      await updateDoc(doc(db, 'lms_trainings', trainingId), { buttons: newButtons });
      fetchTrainings();
    } catch (err) {}
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
            <button onClick={() => { setFormData({ name: '', startDate: '', endDate: '', icon: 'pendidikan', isActive: true }); setShowForm(true); }} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shrink-0">
              <Plus className="w-5 h-5" /> Buat Pelatihan Baru
            </button>
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
                  <button onClick={() => { setButtonFormData({ title: '', url: '', category: DEFAULT_CATEGORIES[0], isActive: true }); setIsCustomCategory(false); setShowButtonForm(true); }} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md text-sm">
                    <Plus className="w-4 h-4" /> Tautan Baru
                  </button>
                  <button onClick={() => { setFormData({...activeTraining, startDate: activeTraining.startDate||'', endDate: activeTraining.endDate||''}); setShowForm(true); }} className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors"><Edit2 className="w-5 h-5"/></button>
                </div>
              )}
            </div>
          </div>

          {/* Grup Elemen Pelatihan */}
          <div className="space-y-6 md:space-y-8">
            {currentCategories.map((category, idx) => {
              const visibleButtons = isAdmin ? (activeTraining.buttons || []) : (activeTraining.buttons || []).filter(b => b.isActive);
              const btns = visibleButtons.filter(b => b.category === category);
              
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {btns.map(btn => {
                        const now = new Date();
                        const sDate = btn.startDate ? new Date(btn.startDate) : null;
                        const eDate = btn.endDate ? new Date(btn.endDate) : null;
                        const isNotOpen = sDate && now < sDate;
                        const isClosed = eDate && now > eDate;
                        const isLocked = !isAdmin && (isNotOpen || isClosed || !btn.isActive);
                        
                        let lockLabel = '';
                        if (isNotOpen) lockLabel = 'Belum Dibuka';
                        else if (isClosed) lockLabel = 'Sudah Ditutup';
                        else if (!btn.isActive) lockLabel = 'Nonaktif';

                        const isIframe = btn.url.trim().startsWith('<iframe');

                        return (
                        <div key={btn.id} className={`group relative bg-white border-2 rounded-2xl transition-all flex flex-col overflow-hidden shadow-sm ${!isLocked ? `border-white hover:shadow-xl hover:-translate-y-1 ${theme.linkHover}` : 'border-slate-200 opacity-70'}`}>
                          {isIframe ? (
                            <button onClick={() => !isLocked && openIframe(btn.url)} disabled={isLocked} className="flex-grow p-4 flex items-center gap-4 text-left w-full h-full">
                              <div className={`p-3 shrink-0 rounded-xl ${!isLocked ? `${theme.linkIconBg} ${theme.iconColor} ${theme.linkIconHover} group-hover:text-white transition-all` : 'bg-slate-100 text-slate-400'}`}>
                                <ExternalLink className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col flex-grow">
                                <span className="font-bold text-slate-700 leading-tight pr-2 text-sm md:text-base">{btn.title}</span>
                                {lockLabel && <span className="text-xs font-bold text-rose-500 mt-1 uppercase flex items-center gap-1"><Lock className="w-3 h-3"/> {lockLabel}</span>}
                              </div>
                            </button>
                          ) : (
                            <a href={isLocked ? '#' : btn.url} target={isLocked ? '_self' : '_blank'} rel="noreferrer" className={`flex-grow p-4 flex items-center gap-4 ${isLocked ? 'pointer-events-none' : ''}`}>
                              <div className={`p-3 shrink-0 rounded-xl ${!isLocked ? `${theme.linkIconBg} ${theme.iconColor} ${theme.linkIconHover} group-hover:text-white transition-all` : 'bg-slate-100 text-slate-400'}`}>
                                <ExternalLink className="w-5 h-5" />
                              </div>
                              <div className="flex flex-col flex-grow">
                                <span className="font-bold text-slate-700 leading-tight pr-2 text-sm md:text-base">{btn.title}</span>
                                {lockLabel && <span className="text-xs font-bold text-rose-500 mt-1 uppercase flex items-center gap-1"><Lock className="w-3 h-3"/> {lockLabel}</span>}
                              </div>
                            </a>
                          )}
                          {isAdmin && (
                            <div className="flex border-t border-slate-100 bg-slate-50 shrink-0">
                              <button onClick={() => toggleButtonStatus(activeTraining.id, btn.id)} className={`p-2 flex-1 transition-colors border-r border-slate-100 ${btn.isActive ? 'text-emerald-600 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-200'}`} title={btn.isActive ? "Matikan Tautan" : "Aktifkan Tautan"}>
                                {btn.isActive ? <Unlock className="w-4 h-4 mx-auto"/> : <Lock className="w-4 h-4 mx-auto"/>}
                              </button>
                              <button onClick={() => { setButtonFormData(btn); setIsCustomCategory(!DEFAULT_CATEGORIES.includes(btn.category)); setShowButtonForm(true); }} className="p-2 flex-1 text-indigo-600 hover:bg-indigo-100 transition-colors border-r border-slate-100" title="Edit"><Edit2 className="w-4 h-4 mx-auto"/></button>
                              <button onClick={() => handleDeleteButton(activeTraining.id, btn.id)} className="p-2 flex-1 text-rose-600 hover:bg-rose-100 transition-colors" title="Hapus"><Trash2 className="w-4 h-4 mx-auto"/></button>
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
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
         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-[85vh] bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl">
           <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50 shrink-0">
             <button onClick={closeIframe} className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl font-bold transition-colors">
               <ChevronLeft className="w-5 h-5"/> Kembali ke Pelatihan
             </button>
             <h3 className="font-bold text-slate-700 hidden sm:block">Pratinjau Sematan</h3>
           </div>
           <div className="flex-1 w-full h-full overflow-y-auto iframe-container bg-slate-50/50" style={{ WebkitOverflowScrolling: 'touch' }} dangerouslySetInnerHTML={{ __html: iframeUrl.replace(/width="[^"]*"/, 'width="100%"') }} />
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tanggal Mulai</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tanggal Selesai</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700" required />
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Waktu Buka (Opsional)</label>
                    <input type="datetime-local" value={buttonFormData.startDate || ''} onChange={e => setButtonFormData({...buttonFormData, startDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Waktu Tutup (Opsional)</label>
                    <input type="datetime-local" value={buttonFormData.endDate || ''} onChange={e => setButtonFormData({...buttonFormData, endDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700" />
                  </div>
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
                    <select value={buttonFormData.category} onChange={e => setButtonFormData({...buttonFormData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-primary-500">
                      {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
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
      </AnimatePresence>
    </div>
  );
};
