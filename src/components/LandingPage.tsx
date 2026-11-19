import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, BookOpenCheck, Briefcase, Ruler, Map, FileEdit, Users, 
  TrendingUp, MonitorPlay, ArrowRight, Activity, MapPin, ScanLine, 
  Award, Calculator, BarChart3, ShieldCheck, LayoutGrid, List, 
  SlidersHorizontal, Check, Eye, EyeOff, X, Sparkles
} from 'lucide-react';
import { useAuth, isAhmadAuliaUser } from '../lib/auth';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  badge?: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, iconColor, bgColor, badge, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-white dark:bg-slate-850 dark:bg-slate-800/90 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/50 hover:-translate-y-1 active:scale-[0.99] transition-all duration-200 text-left flex flex-col h-full cursor-pointer group"
  >
    <div className="flex items-start justify-between gap-2 mb-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${bgColor} dark:bg-slate-700/50`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
          {title}
        </h3>
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
          {badge}
        </span>
      )}
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 flex-grow">
      {description}
    </p>
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all mt-auto uppercase tracking-widest">
      <span>{badge ? 'Fitur Pengembangan' : 'Buka Aplikasi'}</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);

const FeatureListItem: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, iconColor, bgColor, badge, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-white dark:bg-slate-850 dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-primary-200 dark:hover:border-primary-500/50 transition-all duration-200 text-left flex items-center justify-between gap-4 cursor-pointer group w-full"
  >
    <div className="flex items-center gap-3.5 min-w-0 flex-1">
      <div className={`p-2.5 rounded-xl ${bgColor} dark:bg-slate-700/50 shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
            {title}
          </h3>
          {badge && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
          {description}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all shrink-0">
      <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Buka</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Mode Tampilan: 'card' (Grid) atau 'list' (Daftar)
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('garda_landing_view_mode');
      if (saved === 'card' || saved === 'list') return saved;
    }
    return 'card';
  });

  // Pengaturan visibilitas aplikasi untuk role Petugas (disimpan oleh admin)
  const [hiddenAppsForPetugas, setHiddenAppsForPetugas] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('garda_hidden_apps_petugas');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Sync perubahan viewMode ke localStorage
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('garda_landing_view_mode', mode);
  };

  // Toggle visibilitas aplikasi untuk petugas
  const toggleAppVisibilityForPetugas = (appId: string) => {
    const updated = hiddenAppsForPetugas.includes(appId)
      ? hiddenAppsForPetugas.filter(id => id !== appId)
      : [...hiddenAppsForPetugas, appId];
    
    setHiddenAppsForPetugas(updated);
    localStorage.setItem('garda_hidden_apps_petugas', JSON.stringify(updated));
    window.dispatchEvent(new Event('garda_app_visibility_updated'));
  };

  // Cek apakah suatu aplikasi dimunculkan untuk user saat ini
  const isAppVisible = (appId: string) => {
    if (user?.role === 'petugas') {
      return !hiddenAppsForPetugas.includes(appId);
    }
    return true;
  };

  // Daftar aplikasi yang dapat diatur visibilitasnya untuk Petugas
  const configurablePetugasApps = [
    { id: 'lms', name: 'Learning Management System', desc: 'Pelatihan & Kuis' },
    { id: 'kbli-2025', name: 'KBLI 2025', desc: 'Klasifikasi Baku Lapangan Usaha' },
    { id: 'kbji-2014', name: 'KBJI 2026', desc: 'Klasifikasi Baku Jabatan Indonesia' },
    { id: 'imputation', name: 'Imputasi Susenas-Seruti', desc: 'Panduan batas nilai lapangan' },
    { id: 'infrastructure', name: 'Infrastruktur Desa', desc: 'Monitoring infrastruktur desa' },
    { id: 'monitoring', name: 'Dashboad Monitoing', desc: 'Pantau akumulasi progres lapangan' },
    { id: 'kbli-kbji', name: 'KBLI dan KBJI Mempawah', desc: 'Klasifikasi kode lokal Mempawah' },
    { id: 'building-area', name: 'Pengukuran Luas Bangunan', desc: 'Kalkulator atap via satelit' },
    { id: 'laporan-pendataan', name: 'Laporan Pendataan', desc: 'Pelaporan survei lapangan' },
    { id: 'social-phenomenon', name: 'Fenomena Sosial Ekonomi', desc: 'Pencatatan dinamika ekonomi' },
    { id: 'admin-strategic-data', name: 'Data Strategis BPS', desc: 'Indikator makro ekonomi' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner - Lightweight, GPU-friendly gradient & smooth dark mode */}
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-slate-900 dark:via-slate-850 dark:via-slate-800/90 dark:to-slate-900 rounded-[2.5rem] p-8 md:p-14 lg:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[400px] shadow-md border border-primary-100/90 dark:border-slate-800">
        
        {/* Subtle decorative background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-100/40 dark:bg-primary-900/10 rounded-full pointer-events-none -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary-100/35 dark:bg-secondary-900/10 rounded-full pointer-events-none -ml-16 -mb-16"></div>

        {/* Left Column (Text & Quote) */}
        <div className="relative z-10 flex flex-col items-start text-left space-y-6 w-full md:w-1/2 max-w-xl mx-auto md:mx-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-300 text-xs font-black uppercase tracking-wider border border-primary-200 dark:border-slate-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
            BPS Kabupaten Mempawah
          </div>

          <h1 className="text-slate-800 dark:text-slate-100 text-[26px] sm:text-3xl md:text-4xl lg:text-5xl leading-[1.25] font-serif font-bold tracking-tight break-words hyphens-auto">
            Portal Integrasi Menjaga Kualitas Data & <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 italic block mt-1 md:mt-0 md:inline">
              Akuntabilitas Proses Pendataan
            </span>
          </h1>

          <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-primary-100 dark:border-slate-700 max-w-md shadow-2xs space-y-1">
            <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed italic font-serif">
              "Kesempurnaan tidak datang dengan sendirinya. Kesempurnaan harus diupayakan."
            </p>
            <span className="font-bold not-italic block text-xs text-slate-800 dark:text-slate-200 tracking-tight">
              — Prof. Dr. Ing. B.J. Habibie
            </span>
          </div>
        </div>

        {/* Right Column (Logo) */}
        <div className="relative z-10 w-full md:w-1/2 flex justify-center md:justify-end mt-10 md:mt-0">
          <div className="relative flex items-center justify-center p-4">
            <img 
              src="/logo.png" 
              alt="Garda Data Logo" 
              className="relative z-10 w-auto h-52 md:h-64 lg:h-72 object-contain drop-shadow-lg transition-transform duration-300 hover:scale-102" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
          </div>
        </div>

      </div>

      {/* Control Bar: View Mode (Card vs Daftar) & Admin App Config */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tampilan Aplikasi:
          </span>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleViewModeChange('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
          </div>
        </div>

        {user?.role === 'admin' && (
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Atur Tampilan & Akses Petugas</span>
          </button>
        )}
      </div>

      {/* Categories Grid or List */}
      <div className="space-y-10 pt-2">
        
        {/* Kategori Khusus: Halaman Developer Akun ahmad.aulia */}
        {isAhmadAuliaUser(user) && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                Halaman Developer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide border border-indigo-200 dark:border-indigo-800/60">
                Khusus Akun ahmad.aulia
              </span>
            </div>

            <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
              {viewMode === 'card' ? (
                <>
                  <FeatureCard
                    title="Statistik & Analisis Pengunjung"
                    description="Pantau berapa kali Garda Data dibuka, pengunjung unik, popularitas fitur, serta visualisasi analitis menurut hari dan jam operasional."
                    icon={BarChart3}
                    iconColor="text-indigo-600 dark:text-indigo-400"
                    bgColor="bg-indigo-50"
                    badge="Analitik Live"
                    onClick={() => onNavigate('analytics-ahmad')}
                  />
                  <FeatureCard
                    title="Cadangan & Pemulihan Sistem"
                    description="Pencadangan database berkala (6 jam & per jam), eksekusi backup manual, riwayat log audit, dan unduh arsip data ZIP/JSON."
                    icon={ShieldCheck}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    bgColor="bg-emerald-50 dark:bg-emerald-950/40"
                    badge="Auto-Backup & ZIP"
                    onClick={() => onNavigate('backup-system')}
                  />
                </>
              ) : (
                <>
                  <FeatureListItem
                    title="Statistik & Analisis Pengunjung"
                    description="Pantau berapa kali Garda Data dibuka, pengunjung unik, popularitas fitur, serta visualisasi analitis."
                    icon={BarChart3}
                    iconColor="text-indigo-600 dark:text-indigo-400"
                    bgColor="bg-indigo-50"
                    badge="Analitik Live"
                    onClick={() => onNavigate('analytics-ahmad')}
                  />
                  <FeatureListItem
                    title="Cadangan & Pemulihan Sistem"
                    description="Pencadangan database berkala, eksekusi backup manual, riwayat log audit, dan arsip ZIP."
                    icon={ShieldCheck}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    bgColor="bg-emerald-50 dark:bg-emerald-950/40"
                    badge="Auto-Backup & ZIP"
                    onClick={() => onNavigate('backup-system')}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Kategori: Persiapan Kegiatan (Khusus Admin) */}
        {user?.role === 'admin' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                Persiapan Kegiatan
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 uppercase tracking-wide border border-rose-200 dark:border-rose-800/60">
                Khusus Admin
              </span>
            </div>

            <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
              {viewMode === 'card' ? (
                <>
                  <FeatureCard
                    title="Peta Batas SLS Live"
                    description="Visualisasi batas SLS 2024, Desa, dan Kecamatan secara live via Google Maps & detail wilayah."
                    icon={MapPin}
                    iconColor="text-rose-600"
                    bgColor="bg-rose-50"
                    onClick={() => onNavigate('admin-sls')}
                  />
                  <FeatureCard
                    title="Identifikasi SLS"
                    description="Modul identifikasi, verifikasi, dan pemantauan kondisi batas SLS di lapangan."
                    icon={ScanLine}
                    iconColor="text-amber-600"
                    bgColor="bg-amber-50"
                    badge="Dalam Pengembangan"
                    onClick={() => onNavigate('identifikasi-sls')}
                  />
                  <FeatureCard
                    title="Penilaian Kinerja Mitra Statistik"
                    description="Sistem evaluasi performa dan pembobotan mutu kerja mitra statistik BPS SE2026."
                    icon={Award}
                    iconColor="text-indigo-600"
                    bgColor="bg-indigo-50"
                    onClick={() => onNavigate('penilaian-mitra')}
                  />
                </>
              ) : (
                <>
                  <FeatureListItem
                    title="Peta Batas SLS Live"
                    description="Visualisasi batas SLS 2024, Desa, dan Kecamatan secara live via Google Maps."
                    icon={MapPin}
                    iconColor="text-rose-600"
                    bgColor="bg-rose-50"
                    onClick={() => onNavigate('admin-sls')}
                  />
                  <FeatureListItem
                    title="Identifikasi SLS"
                    description="Modul identifikasi, verifikasi, dan pemantauan kondisi batas SLS di lapangan."
                    icon={ScanLine}
                    iconColor="text-amber-600"
                    bgColor="bg-amber-50"
                    badge="Dalam Pengembangan"
                    onClick={() => onNavigate('identifikasi-sls')}
                  />
                  <FeatureListItem
                    title="Penilaian Kinerja Mitra Statistik"
                    description="Sistem evaluasi performa dan pembobotan mutu kerja mitra statistik BPS SE2026."
                    icon={Award}
                    iconColor="text-indigo-600"
                    bgColor="bg-indigo-50"
                    onClick={() => onNavigate('penilaian-mitra')}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Kategori: Pelatihan */}
        {isAppVisible('lms') && (
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
              Pelatihan
            </h2>
            <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
              {viewMode === 'card' ? (
                <FeatureCard
                  title="Learning Management System"
                  description="Pusat materi, jadwal, instrumen dan kuis pelatihan petugas pendataan yang terstruktur."
                  icon={MonitorPlay}
                  iconColor="text-sky-600 dark:text-sky-400"
                  bgColor="bg-sky-50"
                  onClick={() => onNavigate('lms')}
                />
              ) : (
                <FeatureListItem
                  title="Learning Management System"
                  description="Pusat materi, jadwal, instrumen dan kuis pelatihan petugas pendataan yang terstruktur."
                  icon={MonitorPlay}
                  iconColor="text-sky-600 dark:text-sky-400"
                  bgColor="bg-sky-50"
                  onClick={() => onNavigate('lms')}
                />
              )}
            </div>
          </div>
        )}

        {/* Kategori: Pendataan Lapangan */}
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary-600 rounded-full"></span>
            Pendataan Lapangan
          </h2>
          <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
            {(user?.role === 'admin' || user?.role === 'petugas' || user?.role === 'petugas_pengolahan') && (
              <>
                {isAppVisible('kbli-2025') && (
                  viewMode === 'card' ? (
                    <FeatureCard
                      title="KBLI 2025"
                      description="Eksplorasi hierarki kategori, konsep, dan definisi klasifikasi lapangan usaha standar BPS."
                      icon={BookOpenCheck}
                      iconColor="text-blue-600 dark:text-blue-400"
                      bgColor="bg-blue-50"
                      onClick={() => onNavigate('kbli-2025')}
                    />
                  ) : (
                    <FeatureListItem
                      title="KBLI 2025"
                      description="Eksplorasi hierarki kategori, konsep, dan definisi klasifikasi lapangan usaha standar BPS."
                      icon={BookOpenCheck}
                      iconColor="text-blue-600 dark:text-blue-400"
                      bgColor="bg-blue-50"
                      onClick={() => onNavigate('kbli-2025')}
                    />
                  )
                )}
                {isAppVisible('kbji-2014') && (
                  viewMode === 'card' ? (
                    <FeatureCard
                      title="KBJI 2026"
                      description="Navigasi cerdas konsep, definisi, dan kode jabatan dengan rekomendasi pekerjaan lapangan Mempawah."
                      icon={Briefcase}
                      iconColor="text-emerald-600 dark:text-emerald-400"
                      bgColor="bg-emerald-50"
                      onClick={() => onNavigate('kbji-2014')}
                    />
                  ) : (
                    <FeatureListItem
                      title="KBJI 2026"
                      description="Navigasi cerdas konsep, definisi, dan kode jabatan dengan rekomendasi pekerjaan lapangan Mempawah."
                      icon={Briefcase}
                      iconColor="text-emerald-600 dark:text-emerald-400"
                      bgColor="bg-emerald-50"
                      onClick={() => onNavigate('kbji-2014')}
                    />
                  )
                )}
              </>
            )}
            {isAppVisible('imputation') && (
              viewMode === 'card' ? (
                <FeatureCard
                  title="Imputasi Susenas-Seruti"
                  description="Mesin pencari pintar untuk panduan nilai imputasi lapangan secara instan."
                  icon={FileEdit}
                  iconColor="text-purple-600 dark:text-purple-400"
                  bgColor="bg-purple-50"
                  onClick={() => onNavigate('imputation')}
                />
              ) : (
                <FeatureListItem
                  title="Imputasi Susenas-Seruti"
                  description="Mesin pencari pintar untuk panduan nilai imputasi lapangan secara instan."
                  icon={FileEdit}
                  iconColor="text-purple-600 dark:text-purple-400"
                  bgColor="bg-purple-50"
                  onClick={() => onNavigate('imputation')}
                />
              )
            )}
            {isAppVisible('infrastructure') && (
              viewMode === 'card' ? (
                <FeatureCard
                  title="Infrastruktur Desa"
                  description="Monitoring dan update data infrastruktur pendukung desa secara real-time."
                  icon={Map}
                  iconColor="text-accent-600 dark:text-accent-400"
                  bgColor="bg-accent-50"
                  onClick={() => onNavigate('infrastructure')}
                />
              ) : (
                <FeatureListItem
                  title="Infrastruktur Desa"
                  description="Monitoring dan update data infrastruktur pendukung desa secara real-time."
                  icon={Map}
                  iconColor="text-accent-600 dark:text-accent-400"
                  bgColor="bg-accent-50"
                  onClick={() => onNavigate('infrastructure')}
                />
              )
            )}
            {isAppVisible('monitoring') && (
              viewMode === 'card' ? (
                <FeatureCard
                  title="Dashboad Monitoing"
                  description="Pantau akumulasi progres lapangan, pencapaian target, dan performa petugas secara real-time."
                  icon={Activity}
                  iconColor="text-emerald-600 dark:text-emerald-400"
                  bgColor="bg-emerald-50"
                  onClick={() => onNavigate('monitoring')}
                />
              ) : (
                <FeatureListItem
                  title="Dashboad Monitoing"
                  description="Pantau akumulasi progres lapangan, pencapaian target, dan performa petugas secara real-time."
                  icon={Activity}
                  iconColor="text-emerald-600 dark:text-emerald-400"
                  bgColor="bg-emerald-50"
                  onClick={() => onNavigate('monitoring')}
                />
              )
            )}
            {isAppVisible('kbli-kbji') && (
              viewMode === 'card' ? (
                <FeatureCard
                  title="KBLI dan KBJI Mempawah"
                  description="Akses cepat klasifikasi KBLI 2025 dan KBJI untuk penentuan kode yang akurat."
                  icon={BookOpen}
                  iconColor="text-primary-600 dark:text-primary-400"
                  bgColor="bg-primary-50"
                  onClick={() => onNavigate('kbli-kbji')}
                />
              ) : (
                <FeatureListItem
                  title="KBLI dan KBJI Mempawah"
                  description="Akses cepat klasifikasi KBLI 2025 dan KBJI untuk penentuan kode yang akurat."
                  icon={BookOpen}
                  iconColor="text-primary-600 dark:text-primary-400"
                  bgColor="bg-primary-50"
                  onClick={() => onNavigate('kbli-kbji')}
                />
              )
            )}
            {isAppVisible('building-area') && (
              viewMode === 'card' ? (
                <FeatureCard
                  title="Pengukuran Luas Bangunan"
                  description="Kalkulator validasi luas atap bangunan berbasis citra satelit dan geospasial."
                  icon={Ruler}
                  iconColor="text-primary-600 dark:text-primary-400"
                  bgColor="bg-primary-50"
                  onClick={() => onNavigate('building-area')}
                />
              ) : (
                <FeatureListItem
                  title="Pengukuran Luas Bangunan"
                  description="Kalkulator validasi luas atap bangunan berbasis citra satelit dan geospasial."
                  icon={Ruler}
                  iconColor="text-primary-600 dark:text-primary-400"
                  bgColor="bg-primary-50"
                  onClick={() => onNavigate('building-area')}
                />
              )
            )}
            {isAppVisible('laporan-pendataan') && (
              viewMode === 'card' ? (
                <FeatureCard
                  title="Laporan Pendataan"
                  description="Aplikasi pelaporan dan monitoring progres pendataan lapangan secara real-time."
                  icon={FileEdit}
                  iconColor="text-indigo-600 dark:text-indigo-400"
                  bgColor="bg-indigo-50"
                  badge="Dev"
                  onClick={() => onNavigate('laporan-pendataan')}
                />
              ) : (
                <FeatureListItem
                  title="Laporan Pendataan"
                  description="Aplikasi pelaporan dan monitoring progres pendataan lapangan secara real-time."
                  icon={FileEdit}
                  iconColor="text-indigo-600 dark:text-indigo-400"
                  bgColor="bg-indigo-50"
                  badge="Dev"
                  onClick={() => onNavigate('laporan-pendataan')}
                />
              )
            )}
          </div>
        </div>

        {/* Kategori: Pengolahan Data (Admin & Petugas Pengolahan) */}
        {(user?.role === 'admin' || user?.role === 'petugas_pengolahan') && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-6 bg-cyan-600 rounded-full"></span>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                Pengolahan Data
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 uppercase tracking-wide border border-cyan-200 dark:border-cyan-800/60">
                SE2026
              </span>
            </div>
            <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
              {viewMode === 'card' ? (
                <>
                  <FeatureCard
                    title="Peta Responden SE2026"
                    description="Visualisasi sebaran koordinat 84.000+ responden SE2026 di Kabupaten Mempawah dengan overlay batas SLS, Desa, dan Kecamatan."
                    icon={MapPin}
                    iconColor="text-cyan-600 dark:text-cyan-400"
                    bgColor="bg-cyan-50"
                    onClick={() => onNavigate('peta-responden-se2026')}
                  />
                  {user?.role === 'admin' && (
                    <FeatureCard
                      title="Rasionalitas NTB SE2026"
                      description="Simulasi dan uji kewajaran rasio Nilai Tambah Bruto SE2026 terhadap batas standar KBLI BPS dilengkapi kalkulator bantu hitung subtotal."
                      icon={Calculator}
                      iconColor="text-[#5B58DE] dark:text-indigo-400"
                      bgColor="bg-indigo-50"
                      badge="Admin"
                      onClick={() => onNavigate('rasionalitas-ntb')}
                    />
                  )}
                </>
              ) : (
                <>
                  <FeatureListItem
                    title="Peta Responden SE2026"
                    description="Visualisasi sebaran koordinat 84.000+ responden SE2026 di Kabupaten Mempawah."
                    icon={MapPin}
                    iconColor="text-cyan-600 dark:text-cyan-400"
                    bgColor="bg-cyan-50"
                    onClick={() => onNavigate('peta-responden-se2026')}
                  />
                  {user?.role === 'admin' && (
                    <FeatureListItem
                      title="Rasionalitas NTB SE2026"
                      description="Simulasi dan uji kewajaran rasio Nilai Tambah Bruto SE2026 standar KBLI BPS."
                      icon={Calculator}
                      iconColor="text-[#5B58DE] dark:text-indigo-400"
                      bgColor="bg-indigo-50"
                      badge="Admin"
                      onClick={() => onNavigate('rasionalitas-ntb')}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Kategori: Analisis dan Diseminasi */}
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
            Analisis dan Diseminasi
          </h2>
          <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
            {isAppVisible('social-phenomenon') && (
              viewMode === 'card' ? (
                <FeatureCard
                  title="Fenomena Sosial Ekonomi"
                  description="Modul pemantauan, analisis, dan pencatatan dinamika fenomena sosial ekonomi."
                  icon={Users}
                  iconColor="text-rose-600 dark:text-rose-400"
                  bgColor="bg-rose-50"
                  onClick={() => onNavigate('social-phenomenon')}
                />
              ) : (
                <FeatureListItem
                  title="Fenomena Sosial Ekonomi"
                  description="Modul pemantauan, analisis, dan pencatatan dinamika fenomena sosial ekonomi."
                  icon={Users}
                  iconColor="text-rose-600 dark:text-rose-400"
                  bgColor="bg-rose-50"
                  onClick={() => onNavigate('social-phenomenon')}
                />
              )
            )}
            {isAppVisible('admin-strategic-data') && (
              viewMode === 'card' ? (
                <FeatureCard
                  title="Data Strategis BPS"
                  description="Dashboard indikator makro ekonomi, sosial, dan produksi daerah. (Masih dalam pengembangan)"
                  icon={TrendingUp}
                  iconColor="text-amber-600 dark:text-amber-400"
                  bgColor="bg-amber-50"
                  onClick={() => onNavigate('admin-strategic-data')}
                />
              ) : (
                <FeatureListItem
                  title="Data Strategis BPS"
                  description="Dashboard indikator makro ekonomi, sosial, dan produksi daerah."
                  icon={TrendingUp}
                  iconColor="text-amber-600 dark:text-amber-400"
                  bgColor="bg-amber-50"
                  onClick={() => onNavigate('admin-strategic-data')}
                />
              )
            )}
          </div>
        </div>

      </div>

      {/* Modal Admin Pengaturan Tampilan & Visibilitas Aplikasi untuk Petugas */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Pengaturan Beranda & Akses Petugas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Atur mode tampilan dan aplikasi yang ditampilkan untuk role Petugas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opsi 1: Mode Tampilan Default */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                1. Mode Tampilan Daftar Aplikasi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('card')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                    viewMode === 'card'
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 text-primary-800 dark:text-primary-300 ring-2 ring-primary-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold">Bentuk Card</span>
                    <span className="text-[10px] text-slate-500">Grid kotak lebar</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('list')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                    viewMode === 'list'
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 text-primary-800 dark:text-primary-300 ring-2 ring-primary-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <List className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold">Bentuk Daftar</span>
                    <span className="text-[10px] text-slate-500">List ringkas memanjang</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Opsi 2: Visibilitas Aplikasi untuk Role Petugas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                  2. Visibilitas Menu Petugas
                </label>
                <span className="text-[10px] text-slate-400">
                  {configurablePetugasApps.length - hiddenAppsForPetugas.length} dari {configurablePetugasApps.length} aktif
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pilih aplikasi mana saja yang ditampilkan di beranda dan sidebar petugas lapangan:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50 dark:bg-slate-850">
                {configurablePetugasApps.map(app => {
                  const isVisible = !hiddenAppsForPetugas.includes(app.id);
                  return (
                    <div
                      key={app.id}
                      onClick={() => toggleAppVisibilityForPetugas(app.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        isVisible
                          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          : 'bg-slate-100/60 dark:bg-slate-900/60 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isVisible ? (
                          <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="min-w-0 truncate">
                          <span className="font-bold block truncate">{app.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">{app.desc}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                        isVisible
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isVisible ? 'Ditampilkan' : 'Disembunyikan'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Simpan & Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
