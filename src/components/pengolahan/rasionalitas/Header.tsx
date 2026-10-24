import React from 'react';
import { 
  Search, 
  HelpCircle, 
  PanelLeftClose, 
  PanelLeftOpen, 
  ArrowLeft,
  Calculator,
  Bell
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenFormula: () => void;
  onOpenCalculator?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar: () => void;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  onOpenFormula, 
  onOpenCalculator,
  isSidebarOpen = true,
  onToggleSidebar,
  onBack 
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:px-7 md:py-4 shadow-soft border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 mb-6">
      {/* Left Title & Toggle Button */}
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#5B58DE] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700 transition flex items-center justify-center shrink-0"
            title="Kembali ke Beranda Garda Data"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#5B58DE] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700 transition shadow-xs flex items-center justify-center shrink-0"
          title={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-slate-700 dark:text-slate-200 hover:text-[#5B58DE]" />
          ) : (
            <PanelLeftOpen className="w-5 h-5 text-[#5B58DE]" />
          )}
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-snug truncate sm:overflow-visible">
            Modul Simulasi Perhitungan Nilai Tambah Bruto
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block truncate">
            Uji Rasionalitas Nilai Tambah Bruto • BPS Kabupaten Mempawah • SE2026
          </p>
        </div>
      </div>

      {/* Right Search Bar & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Cari riwayat atau KBLI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-36 sm:w-52 md:w-64 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-full py-2 pl-4 pr-10 text-xs md:text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B58DE]/30 focus:border-[#5B58DE] transition-all"
          />
          <button 
            type="button"
            className="absolute right-1.5 w-7 h-7 bg-[#5B58DE] hover:bg-[#4C49CC] text-white rounded-full flex items-center justify-center transition-colors shadow-xs"
            title="Cari"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Calculator Tool Button */}
        {onOpenCalculator && (
          <button
            type="button"
            onClick={onOpenCalculator}
            className="p-2 sm:px-3 sm:py-2 rounded-full sm:rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-[#5B58DE] transition border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-xs"
            title="Buka Kalkulator Bantu"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden md:inline">Kalkulator</span>
          </button>
        )}

        {/* Quick Help / Rumus Button */}
        <button
          type="button"
          onClick={onOpenFormula}
          className="p-2.5 rounded-full text-slate-500 hover:text-[#5B58DE] hover:bg-brand-50 dark:hover:bg-slate-800 transition border border-slate-100 dark:border-slate-800 hidden sm:flex items-center gap-1.5 text-xs font-semibold shrink-0"
          title="Panduan Rumus NTB"
        >
          <HelpCircle className="w-4 h-4 text-[#5B58DE]" />
          <span>Rumus</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            type="button"
            className="p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

