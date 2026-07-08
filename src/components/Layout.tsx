import React, { useState } from 'react';
import { LogOut, User, Menu, X, Home, BookOpen, Map, FileEdit, Users, TrendingUp, MonitorPlay, Ruler, Search, Moon, Bell, Activity, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage = 'landing', onNavigate }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchIndex = [
    { id: 'lms', title: 'Learning Management System', desc: 'Pelatihan, e-learning, materi, sakernas agustus', keywords: ['lms', 'pelatihan', 'sakernas', 'susenas', 'agustus', 'materi', 'kuis', 'jadwal'] },
    { id: 'cerdas-form', title: 'Laporan Pendataan', desc: 'Laporan progres pendataan lapangan', keywords: ['laporan', 'pendataan', 'cerdas', 'progress', 'progres', 'lapangan'] },
    { id: 'kbli-kbji', title: 'KBLI 2025 & KBJI 2014', desc: 'Pencarian kode klasifikasi KBLI/KBJI', keywords: ['kbli', 'kbji', 'klasifikasi', 'kode', 'industri', 'pekerjaan'] },
    { id: 'building-area', title: 'Pengukuran Luas Bangunan', desc: 'Kalkulator area bangunan via satelit', keywords: ['bangunan', 'luas', 'atap', 'pengukuran', 'peta', 'satelit', 'geospasial'] },
    { id: 'imputation', title: 'Imputasi Susenas-Seruti', desc: 'Panduan nilai imputasi lapangan', keywords: ['imputasi', 'susenas', 'seruti', 'nilai', 'batas'] },
    { id: 'infrastructure', title: 'Infrastruktur Desa', desc: 'Monitoring infrastruktur pendukung desa', keywords: ['infrastruktur', 'desa', 'fasilitas', 'pasar', 'sekolah'] },
    { id: 'social-phenomenon', title: 'Fenomena Sosial Ekonomi', desc: 'Pencatatan dinamika fenomena sosial ekonomi', keywords: ['fenomena', 'sosial', 'ekonomi', 'analisis', 'berita'] },
    { id: 'admin-strategic-data', title: 'Data Strategis BPS', desc: 'Indikator makro ekonomi daerah', keywords: ['strategis', 'makro', 'ekonomi', 'inflasi', 'kemiskinan', 'pdrb'] },
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
        { id: 'building-area', label: 'Pengukuran Luas Bangunan', icon: Ruler },
        { id: 'cerdas-form', label: 'Laporan Pendataan', icon: FileEdit },
        { id: 'kbli-kbji', label: 'KBLI 2025 & KBJI 2014', icon: BookOpen },
        { id: 'imputation', label: 'Imputasi Susenas-Seruti', icon: FileEdit },
        { id: 'infrastructure', label: 'Infrastruktur Desa', icon: Map }
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

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 w-64 md:w-72 shrink-0">
      {/* Sidebar Header (Logo) - Only visible on Desktop or inside Drawer */}
      <div className="h-20 flex items-center px-6 border-b border-transparent shrink-0">
        <button onClick={() => handleNav('landing')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="Garda Data Logo" className="w-8 h-8 object-contain" onError={(e) => {
            e.currentTarget.style.display = 'none';
          }} />
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500">
            GARDA DATA
          </span>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto py-6 px-4 custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="px-2 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map(item => {
                const isActive = currentPage === item.id;
                return (
                  <li key={item.id} className="relative">
                    {isActive && (
                      <motion.div layoutId="activeNav" className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full" />
                    )}
                    <button
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-sm ${
                        isActive 
                          ? 'bg-primary-50 text-primary-700 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {/* Desktop Sidebar */}
      <AnimatePresence initial={false}>
        {isDesktopSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="hidden lg:block h-screen sticky top-0 z-40 overflow-hidden"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

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
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <nav className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              className="hidden lg:block p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex relative w-80">
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200 w-full focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Cari fitur atau aplikasi (mis: pelatihan sakernas)..." 
                  className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
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

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />

            {user && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <User className="w-5 h-5" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-bold text-slate-700 leading-tight">{user.username}</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">{user.role}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="ml-2 p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
          
          <footer className="py-16 border-t border-slate-200/60 bg-white mt-auto">
            <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <div className="h-px w-8 bg-slate-200" />
                <img src="/logo.png" alt="Logo" className="w-5 h-5 opacity-50 grayscale" onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }} />
                <div className="h-px w-8 bg-slate-200" />
              </div>
              <p className="text-slate-400 text-sm font-medium">© 2026 Garda Data - Platform Terpadu Menjaga Kualitas Data.</p>
              <p className="text-sm font-bold text-primary-600">Created by Tim Sosial BPS Kabupaten Mempawah</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

