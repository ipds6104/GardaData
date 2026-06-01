import React from 'react';
import { LogOut, ShieldCheck, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-12">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-1.5">
            <button onClick={() => window.location.href = '/'} className="flex items-center gap-1 sm:gap-3 hover:opacity-80 transition-opacity text-left cursor-pointer shrink-0">
              <img src="/logo.png" alt="Garda Data Logo" className="w-7 h-7 sm:w-12 sm:h-12 object-contain shrink-0" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="bg-primary-600 p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-lg shadow-primary-200"><svg class="w-4 h-4 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>';
              }} />
              <span className="text-sm min-[360px]:text-base sm:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-500 select-none">
                GARDA DATA
              </span>
            </button>
            
            <div className="flex items-center gap-1 sm:gap-6 shrink-0">
              {user && (
                <div className="flex items-center gap-1 sm:gap-4 bg-white p-0.5 sm:p-1.5 pr-2 sm:pr-4 rounded-full border border-slate-100 shadow-sm">
                  <div className="w-6.5 h-6.5 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-col hidden sm:flex">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{user.role}</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-700 leading-none">{user.username}</span>
                  </div>
                  <div className="flex-col sm:hidden flex justify-center max-w-[45px] min-[360px]:max-w-[65px]">
                    <span className="text-[11px] font-bold text-slate-700 leading-none truncate">{user.username}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1" />
                  <button
                    onClick={() => logout()}
                    className="p-1 sm:p-1.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
 
      <main className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-12 pb-24 pt-6 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      <footer className="py-16 border-t border-slate-200 bg-white">
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
    </div>
  );
};
