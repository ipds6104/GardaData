import React, { useState, useEffect } from 'react';
import { 
  LogOut, User, Menu, X, Home, BookOpen, Map, FileEdit, Users, TrendingUp, 
  MonitorPlay, Ruler, Search, Moon, Bell, Activity, Database, WifiOff, RefreshCw, 
  MapPin, ScanLine, Award, ChevronLeft, ChevronRight, HelpCircle, Sun, Palette, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';
import { useTheme, PRESET_LIST } from '../lib/theme';
import { ThemeSelector } from './ThemeSelector';
import { clearAppCacheAndReload } from '../lib/pwaUpdater';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage = 'landing', onNavigate }) => {
  const { user, logout } = useAuth();
  const { preset, setPreset, presetInfo } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('garda_sidebar_collapsed') === 'true';
  });
  const [showHelpModal, setShowHelpModal] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('garda_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isServerDisconnected, setIsServerDisconnected] = useState(false);
  const [isCheckingServer, setIsCheckingServer] = useState(false);
  const [isUpdatingApp, setIsUpdatingApp] = useState(false);

  const checkServerConnection = async () => {
    setIsCheckingServer(true);
    if (!navigator.onLine) {
      setIsServerDisconnected(true);
      setIsCheckingServer(false);
      return;
    }

    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${baseUrl}/api/status`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        // If HTTP 429 (rate limited), the server is online and running
        if (res.status === 429) {
          setIsServerDisconnected(false);
        } else {
          setIsServerDisconnected(true);
        }
      } else {
        setIsServerDisconnected(false);
      }
    } catch (err) {
      setIsServerDisconnected(true);
    } finally {
      setIsCheckingServer(false);
    }
  };

  const handleRefreshApp = async () => {
    if (isUpdatingApp) return;
    setIsUpdatingApp(true);
    await clearAppCacheAndReload();
  };

  useEffect(() => {
    checkServerConnection();

    const handleOnline = () => checkServerConnection();
    const handleOffline = () => setIsServerDisconnected(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const searchIndex = [
    { id: 'lms', title: 'Learning Management System', desc: 'Pelatihan, e-learning, materi, sakernas agustus', keywords: ['lms', 'pelatihan', 'sakernas', 'susenas', 'agustus', 'materi', 'kuis', 'jadwal'] },
    { id: 'cerdas-form', title: 'Laporan Pendataan', desc: 'Laporan progres pendataan lapangan', keywords: ['laporan', 'pendataan', 'cerdas', 'progress', 'progres', 'lapangan'] },
    { id: 'kbli-kbji', title: 'KBLI 2025 & KBJI 2014', desc: 'Pencarian kode klasifikasi KBLI/KBJI', keywords: ['kbli', 'kbji', 'klasifikasi', 'kode', 'industri', 'pekerjaan'] },
    { id: 'building-area', title: 'Pengukuran Luas Bangunan', desc: 'Kalkulator area bangunan via satelit', keywords: ['bangunan', 'luas', 'atap', 'pengukuran', 'peta', 'satelit', 'geospasial'] },
    { id: 'imputation', title: 'Imputasi Susenas-Seruti', desc: 'Panduan nilai imputasi lapangan', keywords: ['imputasi', 'susenas', 'seruti', 'nilai', 'batas'] },
    { id: 'infrastructure', title: 'Infrastruktur Desa', desc: 'Monitoring infrastruktur pendukung desa', keywords: ['infrastruktur', 'desa', 'fasilitas', 'pasar', 'sekolah'] },
    { id: 'social-phenomenon', title: 'Fenomena Sosial Ekonomi', desc: 'Pencatatan dinamika fenomena sosial ekonomi', keywords: ['fenomena', 'sosial', 'ekonomi', 'analisis', 'berita'] },
    { id: 'admin-strategic-data', title: 'Data Strategis BPS', desc: 'Indikator makro ekonomi daerah', keywords: ['strategis', 'makro', 'ekonomi', 'inflasi', 'kemiskinan', 'pdrb'] },
    ...(user?.role === 'admin' ? [
      { id: 'admin-sls', title: 'Peta Batas SLS Live', desc: 'Peta live batas SLS 2024, Desa, dan Kecamatan Kabupaten Mempawah', keywords: ['sls', 'batas', 'wilayah', 'peta', 'google maps', 'mempawah', 'desa', 'kecamatan', 'geospasial', 'persiapan'] },
      { id: 'identifikasi-sls', title: 'Identifikasi SLS', desc: 'Identifikasi dan verifikasi SLS di lapangan (Dalam pengembangan)', keywords: ['identifikasi', 'sls', 'verifikasi', 'persiapan'] },
      { id: 'penilaian-mitra', title: 'Penilaian Kinerja Mitra Statistik', desc: 'Sistem penilaian dan evaluasi mutu kinerja mitra lapangan (PML & PPL)', keywords: ['penilaian', 'kinerja', 'mitra', 'statistik', 'persiapan', 'se2026', 'ppl', 'pml'] }
    ] : []),
  ];

  const searchResults = searchIndex.filter(item => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(query) || 
           item.desc.toLowerCase().includes(query) || 
           item.keywords.some(k => k.includes(query));
  });

  const menuGroups = [
    {
      title: 'UMUM',
      items: [
        { id: 'landing', label: 'Beranda', icon: Home }
      ]
    },
    ...(user?.role === 'admin' ? [{
      title: 'PERSIAPAN KEGIATAN',
      items: [
        { id: 'admin-sls', label: 'Peta Batas SLS Live', icon: MapPin },
        { id: 'identifikasi-sls', label: 'Identifikasi SLS', icon: ScanLine, isDev: true },
        { id: 'penilaian-mitra', label: 'Penilaian Kinerja Mitra', icon: Award }
      ]
    }] : []),
    {
      title: 'PELATIHAN',
      items: [
        { id: 'lms', label: 'Learning Management System', icon: MonitorPlay }
      ]
    },
    {
      title: 'PENDATAAN LAPANGAN',
      items: [
        { id: 'monitoring', label: 'Monitoring Dashboard', icon: Activity },
        { id: 'cerdas-form', label: 'Laporan Pendataan', icon: FileEdit },
        { id: 'kbli-kbji', label: 'KBLI 2025 & KBJI 2014', icon: BookOpen },
        { id: 'imputation', label: 'Imputasi Susenas-Seruti', icon: FileEdit },
        { id: 'infrastructure', label: 'Infrastruktur Desa', icon: Map },
        { id: 'building-area', label: 'Pengukuran Luas Bangunan', icon: Ruler }
      ]
    },
    {
      title: 'ANALISIS DAN DISEMINASI',
      items: [
        { id: 'social-phenomenon', label: 'Fenomena Sosial Ekonomi', icon: Users },
        { id: 'admin-strategic-data', label: 'Data Strategis BPS', icon: TrendingUp }
      ]
    }
  ];

  const handleNav = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
      setIsSidebarOpen(false);
    }
  };

  const SidebarCard = ({ 
    isCollapsed, 
    onToggle, 
    isMobile = false, 
    onClose 
  }: { 
    isCollapsed: boolean; 
    onToggle?: () => void; 
    isMobile?: boolean; 
    onClose?: () => void; 
  }) => {
    const [showThemePopover, setShowThemePopover] = useState(false);

    return (
      <div 
        className={`h-full flex flex-col justify-between bg-white/95 backdrop-blur-md rounded-[28px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden relative transition-all duration-300 ${
          isCollapsed ? 'w-[76px]' : 'w-full'
        }`}
      >
        {/* TOP HEADER */}
        {isCollapsed ? (
          <div className="p-3 pt-4 pb-2 flex flex-col items-center gap-2.5 shrink-0">
            <button 
              onClick={() => handleNav('landing')} 
              className="flex items-center justify-center p-1 rounded-2xl hover:opacity-85 transition-transform hover:scale-105 focus:outline-none cursor-pointer"
              title="Beranda Garda Data"
            >
              <img 
                src="/logo.png" 
                alt="Garda Data Logo" 
                className="w-10 h-10 object-contain drop-shadow-xs" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
              />
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="w-7 h-7 rounded-full bg-slate-100/90 hover:bg-slate-200 border border-slate-200/70 shadow-2xs flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="px-4.5 pt-4 pb-3 flex items-center justify-between shrink-0">
            <button 
              onClick={() => handleNav('landing')} 
              className="flex items-center gap-3 hover:opacity-85 transition-opacity focus:outline-none min-w-0 cursor-pointer"
              title="Beranda Garda Data"
            >
              <img 
                src="/logo.png" 
                alt="Garda Data Logo" 
                className="h-9 w-auto object-contain max-h-10 drop-shadow-xs shrink-0" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
              />
              <div className="flex flex-col text-left truncate">
                <span className="font-extrabold text-slate-900 text-base leading-tight tracking-tight truncate">
                  Garda Data
                </span>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider">
                  BPS MEMPAWAH
                </span>
              </div>
            </button>

            {isMobile ? (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggle}
                className="w-7 h-7 rounded-full bg-slate-100/90 hover:bg-slate-200 border border-slate-200/70 shadow-2xs flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                title="Perkecil Sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* MIDDLE: SCROLLABLE MENU ITEMS (Clean without bulky Windows scrollbar) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 no-scrollbar space-y-3 select-none">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {!isCollapsed && (
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                  {group.title}
                </h4>
              )}
              {isCollapsed && gIdx > 0 && (
                <div className="w-8 h-px bg-slate-200/60 mx-auto my-2" />
              )}
              <ul className={isCollapsed ? 'space-y-1.5' : 'space-y-1'}>
                {group.items.map(item => {
                  const isActive = currentPage === item.id;
                  
                  if (isCollapsed) {
                    return (
                      <li key={item.id} className="flex justify-center">
                        <button
                          onClick={() => handleNav(item.id)}
                          style={isActive ? {
                            backgroundColor: presetInfo.colors.primary,
                            boxShadow: `0 8px 18px -3px ${presetInfo.colors.primary}60`
                          } : undefined}
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                          }`}
                          title={item.label}
                        >
                          <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNav(item.id)}
                        style={isActive ? {
                          backgroundColor: presetInfo.colors.primary,
                          boxShadow: `0 8px 20px -4px ${presetInfo.colors.primary}55`
                        } : undefined}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'text-white font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`}
                        title={item.label}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {(item as any).isDev && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Dev
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* BOTTOM PINNED SECTION */}
        {isCollapsed ? (
          <div className="p-2 pt-2 border-t border-slate-100/80 shrink-0 space-y-1.5 flex flex-col items-center relative">
            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all cursor-pointer"
              title="Bantuan & Panduan"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Logout Button */}
            {user && (
              <button
                onClick={() => logout()}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                title={`Keluar (${user.username})`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}

            {/* Collapsed Theme Button (Matching the purple sun pill in FinSet reference image) */}
            <button
              onClick={() => {
                const nextIdx = (PRESET_LIST.findIndex(p => p.id === preset) + 1) % PRESET_LIST.length;
                setPreset(PRESET_LIST[nextIdx].id);
              }}
              style={{ 
                backgroundColor: presetInfo.colors.primary,
                boxShadow: `0 6px 16px -2px ${presetInfo.colors.primary}60`
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer mt-1"
              title={`Ganti Tema Warna (Saat ini: ${presetInfo.name})`}
            >
              <Sun className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 pt-2 border-t border-slate-100/80 shrink-0 space-y-1 relative">
            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />
              <span>Bantuan</span>
            </button>

            {/* Logout Button */}
            {user && (
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5 text-slate-400 hover:text-rose-600 shrink-0" />
                <span className="truncate">Keluar ({user.username})</span>
              </button>
            )}

            {/* Segmented Theme Switcher (Matching bottom pill in reference screenshot) */}
            <div className="pt-2 px-1 flex items-center justify-between relative">
              <div className="p-1 bg-slate-100/90 rounded-full inline-flex items-center gap-1 border border-slate-200/50 shadow-2xs">
                {/* Segment 1: Active Theme Color Dot with Sun */}
                <button
                  type="button"
                  onClick={() => setShowThemePopover(!showThemePopover)}
                  style={{ backgroundColor: presetInfo.colors.primary }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-xs cursor-pointer hover:scale-105 transition-transform"
                  title={`Tema Aktif: ${presetInfo.name} (Klik untuk ganti)`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                
                {/* Segment 2: Palette / Mode Icon */}
                <button
                  type="button"
                  onClick={() => setShowThemePopover(!showThemePopover)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer"
                  title="Pilih Preset Tema Warna"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowThemePopover(!showThemePopover)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 truncate mr-1 cursor-pointer flex items-center gap-1.5"
              >
                <span 
                  className="w-2 h-2 rounded-full shadow-2xs" 
                  style={{ backgroundColor: presetInfo.colors.primary }} 
                />
                <span className="truncate">{presetInfo.name}</span>
              </button>

              {/* Compact Theme Preset Popover */}
              <AnimatePresence>
                {showThemePopover && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full mb-3 left-0 right-0 bg-white rounded-3xl p-3 border border-slate-200 shadow-2xl shadow-slate-900/15 z-50 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-xs font-black text-slate-800">Pilih Warna Tema</span>
                      <button 
                        onClick={() => setShowThemePopover(false)} 
                        className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PRESET_LIST.map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setPreset(item.id);
                            setShowThemePopover(false);
                          }}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                            preset === item.id 
                              ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-200 shadow-xs' 
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div 
                            className="w-5 h-5 rounded-full shadow-xs border border-white"
                            style={{ backgroundColor: item.colors.primary }}
                          />
                          <span className="truncate w-full text-center">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen font-sans text-slate-900 flex overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: presetInfo.colors.bg || '#f8fafc' }}
    >
      {/* Desktop Floating Sidebar (Matching FinSet design in reference image) */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 76 : 280 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className="hidden lg:flex flex-col shrink-0 my-3 ml-3 z-40 h-[calc(100vh-1.5rem)] sticky top-3 select-none"
      >
        <SidebarCard 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebarCollapse} 
        />
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="fixed inset-y-0 left-0 z-50 p-3 w-72 max-w-[85vw] h-full lg:hidden"
            >
              <SidebarCard 
                isCollapsed={false} 
                isMobile 
                onClose={() => setIsSidebarOpen(false)} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-screen lg:h-[calc(100vh-1.5rem)] lg:my-3 lg:mr-3 lg:ml-2.5 bg-white/95 backdrop-blur-md lg:rounded-[28px] lg:border lg:border-slate-200/80 lg:shadow-xl lg:shadow-slate-200/40 overflow-hidden">
        {/* Offline / Server Disconnection Banner */}
        <AnimatePresence>
          {isServerDisconnected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between shrink-0 z-50 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
                  <WifiOff className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold block sm:inline">Web sedang tidak tersambung ke server</span>
                  <span className="hidden md:inline text-xs text-rose-100 ml-2">
                    (Beberapa fitur real-time atau sinkronisasi backend mungkin tidak dapat diakses)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={checkServerConnection}
                  disabled={isCheckingServer}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 font-bold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingServer ? 'animate-spin' : ''}`} />
                  {isCheckingServer ? 'Mengecek...' : 'Coba Lagi'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Navbar */}
        <nav className="h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 border-b border-slate-100/90 bg-white/80 backdrop-blur-xs sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Drawer Hamburger */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Buka Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex relative w-72 lg:w-80">
              <div className="flex items-center gap-2.5 bg-slate-50/80 px-3.5 py-2 rounded-full border border-slate-200/80 w-full focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Cari fitur atau aplikasi..." 
                  className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-700 placeholder-slate-400"
                />
              </div>
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                  >
                    {searchResults.length > 0 ? (
                      <ul className="max-h-64 overflow-y-auto custom-scrollbar py-2">
                        {searchResults.map((result) => (
                          <li key={result.id}>
                            <button
                              onClick={() => {
                                handleNav(result.id);
                                setSearchQuery('');
                                setIsSearchFocused(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col transition-colors"
                            >
                              <span className="text-sm font-bold text-slate-800">{result.title}</span>
                              <span className="text-xs text-slate-500 line-clamp-1">{result.desc}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center text-sm text-slate-500">
                        Pencarian <span className="font-bold text-slate-800">"{searchQuery}"</span> tidak ditemukan.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tombol Segarkan / Bersihkan Cache Aplikasi */}
            <button
              type="button"
              onClick={handleRefreshApp}
              disabled={isUpdatingApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-primary-700 transition-all shadow-2xs text-xs font-bold cursor-pointer disabled:opacity-50"
              title="Perbarui versi aplikasi & bersihkan cache"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary-600 ${isUpdatingApp ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline">{isUpdatingApp ? 'Memperbarui...' : 'Perbarui Web'}</span>
            </button>

            {/* Theme / Preset Selector Button */}
            <ThemeSelector />

            <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {user && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-slate-800 leading-tight">{user.username}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{user.role}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="ml-1 p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/40 custom-scrollbar">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
          
          <footer className="py-12 border-t border-slate-200/60 bg-white/70 mt-auto">
            <div className="w-full px-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <div className="h-px w-8 bg-slate-200" />
                <img src="/logo.png" alt="Logo" className="w-4 h-4 opacity-50 grayscale" onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }} />
                <div className="h-px w-8 bg-slate-200" />
              </div>
              <p className="text-slate-400 text-xs font-medium">© 2026 Garda Data - Platform Terpadu Menjaga Kualitas Data.</p>
              <p className="text-xs font-bold text-primary-600">Created by Tim Sosial BPS Kabupaten Mempawah</p>
            </div>
          </footer>
        </main>
      </div>

      {/* Help & Guide Modal Dialog */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelpModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-7 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: presetInfo.colors.primary }}
                  >
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Pusat Bantuan Garda Data</h3>
                    <p className="text-xs text-slate-500">Platform Terpadu Manajemen & Kualitas Data</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: presetInfo.colors.primary }} />
                    Tentang Aplikasi
                  </h4>
                  <p>
                    Garda Data adalah sistem kolaborasi internal BPS Kabupaten Mempawah untuk monitoring kegiatan pendataan lapangan, evaluasi kualitas kinerja mitra statistik (PPL/PML), pelatihan LMS, dan diseminasi data strategis.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: presetInfo.colors.secondary }} />
                    Kontak Bantuan Teknis
                  </h4>
                  <p>
                    Jika Anda mengalami kendala teknis atau memiliki pertanyaan terkait pendataan, silakan hubungi tim pengelola:
                  </p>
                  <div className="text-[11px] font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                    <p>📍 Tim Sosial & IPDS BPS Kabupaten Mempawah</p>
                    <p>📧 Email: digitalofficer79@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  style={{ backgroundColor: presetInfo.colors.primary }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 transition-all cursor-pointer"
                >
                  Tutup Panduan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

