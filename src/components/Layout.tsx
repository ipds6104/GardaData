import React, { useState } from 'react';
import { LogOut, User, Menu, X, Home, BookOpen, Map, FileEdit, Users, TrendingUp, MonitorPlay, Ruler, Search, Moon, Bell } from 'lucide-react';
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
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
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
                      <motion.div layoutId="activeNav" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                    )}
                    <button
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-sm ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
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
      <div className="hidden lg:block h-screen sticky top-0 z-40">
        <SidebarContent />
      </div>

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
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-full border border-slate-200 w-80">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari fitur atau aplikasi..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors hidden sm:block">
              <Moon className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />

            {user && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md">
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
          
          <footer className="py-8 border-t border-slate-200/60 mt-auto">
            <div className="max-w-7xl mx-auto px-8 text-center">
              <p className="text-slate-400 text-sm font-medium">© 2026 Garda Data - Platform Terpadu Menjaga Kualitas Data.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

