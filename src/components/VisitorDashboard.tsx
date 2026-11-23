import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, ArrowLeft, Construction, Info, ShieldAlert, Globe } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface VisitorDashboardProps {
  onBack?: () => void;
}

export const VisitorDashboard: React.FC<VisitorDashboardProps> = ({ onBack }) => {
  const { logout } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-primary-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img 
              src="/bps-logo.svg" 
              alt="Logo BPS" 
              className="w-8 h-8 object-contain drop-shadow-xs shrink-0" 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <img 
              src="/logo.png" 
              alt="Logo Garda Data" 
              className="w-8 h-8 object-contain drop-shadow-xs shrink-0" 
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <h1 className="text-sm font-black leading-tight text-slate-900 dark:text-white">
              Garda Data Mempawah
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              BPS Kabupaten Mempawah
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBack}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Login</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-10 text-center relative overflow-hidden"
        >
          {/* Subtle Decorative Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Badge Status */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 uppercase tracking-wider mb-5">
            <Construction className="w-3.5 h-3.5 animate-bounce" />
            <span>Fitur Masih Dalam Pengembangan</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Layanan Tamu Sedang Disempurnakan
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto mb-6">
            Mohon maaf, saat ini Anda <strong>belum dapat masuk sebagai Tamu</strong> karena modul penayangan data publik Garda Data masih dalam tahap pengembangan teknis oleh tim BPS Kabupaten Mempawah.
          </p>

          {/* Card Rekomendasi Portal Resmi BPS */}
          <div className="bg-gradient-to-br from-blue-50/80 via-primary-50/50 to-indigo-50/60 dark:from-slate-850 dark:via-slate-850 dark:to-slate-800 rounded-2xl p-5 sm:p-6 border border-blue-200/80 dark:border-blue-900/40 text-left mb-6 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-1">
                  Akses Data Resmi BPS Kabupaten Mempawah
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  Seluruh data publik, indikator strategis (inflasi, kemiskinan, PDRB, ketenagakerjaan), Berita Resmi Statistik (BRS), dan publikasi digital Kabupaten Mempawah dapat diakses langsung secara terbuka melalui website resmi:
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <a
                    href="https://mempawahkab.bps.go.id/id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:shadow-md cursor-pointer group"
                  >
                    <span>Kunjungi mempawahkab.bps.go.id</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  <a
                    href="https://mempawahkab.bps.go.id/id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-700 dark:text-blue-300 font-semibold underline underline-offset-2 px-2 py-1 text-center truncate hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    https://mempawahkab.bps.go.id/id
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Back Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleBack}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Login</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 font-medium border-t border-slate-200/60 dark:border-slate-850">
        &copy; {new Date().getFullYear()} BPS Kabupaten Mempawah — Badan Pusat Statistik
      </footer>
    </div>
  );
};
