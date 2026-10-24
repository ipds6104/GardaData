import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Layers, 
  BadgePercent, 
  Coins, 
  Edit3, 
  Share2, 
  Sparkles,
  Calculator
} from 'lucide-react';

interface HeroProfileProps {
  historyCount?: number;
  onOpenFormula: () => void;
  onLoadPreset: (presetKey: string) => void;
  onOpenCalculator?: () => void;
}

export const HeroProfile: React.FC<HeroProfileProps> = ({ 
  historyCount = 0, 
  onOpenFormula, 
  onLoadPreset,
  onOpenCalculator
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-soft border border-slate-100 dark:border-slate-800 mb-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
        {/* Profile Avatar / Logo with pastel circle background */}
        <div className="relative shrink-0">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-[#E9D5FF] via-[#DDD6FE] to-[#FCE7F3] p-1.5 shadow-inner flex items-center justify-center relative overflow-hidden">
            {/* Background floral aura */}
            <div className="absolute inset-0 bg-[radial-gradient(#c084fc_1px,transparent_1px)] [background-size:12px_12px] opacity-40"></div>
            
            {/* Main Avatar Graphic */}
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center p-2 relative z-10 shadow-xs border border-purple-100 dark:border-purple-900/40">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5B58DE] to-[#EC4899] text-white flex items-center justify-center shadow-purple-glow mb-1">
                <Coins className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">SE2026</span>
              <span className="text-[9px] font-semibold text-[#5B58DE] -mt-0.5">BPS MEMPAWAH</span>
            </div>
          </div>

          {/* Active status bubble */}
          <div className="absolute bottom-1 right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-xs flex items-center justify-center" title="Sistem Aktif">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="flex-1 text-center md:text-left">
          {/* Header & Quick Rumus Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-indigo-950/60 text-[#5B58DE] text-xs font-semibold mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Modul Validasi Data Ekonomi Sensus</span>
              </div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                Rasionalitas Nilai Tambah Bruto
              </h2>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center justify-center md:justify-end gap-2">
              {onOpenCalculator && (
                <button
                  type="button"
                  onClick={onOpenCalculator}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-[#5B58DE] text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1.5 shadow-xs"
                  title="Buka Kalkulator Bantu"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Kalkulator Cepat</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenFormula}
                className="p-2 text-slate-400 hover:text-[#5B58DE] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-100 dark:border-slate-800"
                title="Lihat Detail Rumus"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-xs md:text-sm text-slate-600 dark:text-slate-300 mb-5">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Sensus Ekonomi : <strong className="text-slate-800 dark:text-slate-100 font-semibold">2026 (SE2026)</strong></span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Wilayah : <strong className="text-slate-800 dark:text-slate-100 font-semibold">BPS Kabupaten Mempawah</strong></span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <Layers className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Metode : <strong className="text-slate-800 dark:text-slate-100 font-semibold">(27.a - 26.c) - 26.b - 26.d</strong></span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <Coins className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Satuan : <strong className="text-slate-800 dark:text-slate-100 font-semibold">Rupiah (IDR)</strong></span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5 sm:col-span-2">
              <BadgePercent className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Riwayat Tersimpan : <strong className="text-[#5B58DE] font-bold">{historyCount} Perhitungan</strong></span>
            </div>
          </div>

          {/* Social / Quick Action Circular Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onLoadPreset('kuliner')}
              className="w-8 h-8 rounded-full bg-[#5B58DE] text-white flex items-center justify-center hover:bg-[#4C49CC] transition shadow-xs"
              title="Muat Contoh Restoran / Kuliner"
            >
              <span className="text-xs font-bold">🍔</span>
            </button>

            <button
              type="button"
              onClick={() => onLoadPreset('dagang')}
              className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center hover:bg-blue-600 transition shadow-xs"
              title="Muat Contoh Toko Kelontong / Dagang"
            >
              <span className="text-xs font-bold">🛒</span>
            </button>

            <button
              type="button"
              onClick={() => onLoadPreset('jasa')}
              className="w-8 h-8 rounded-full bg-[#06B6D4] text-white flex items-center justify-center hover:bg-cyan-600 transition shadow-xs"
              title="Muat Contoh Jasa / Desain"
            >
              <span className="text-xs font-bold">💻</span>
            </button>

            <button
              type="button"
              onClick={() => onLoadPreset('manufaktur')}
              className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center hover:bg-purple-600 transition shadow-xs"
              title="Muat Contoh Pabrik / Kerajinan"
            >
              <span className="text-xs font-bold">🏭</span>
            </button>

            <a
              href="https://github.com/ahmadrahman79"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-black transition shadow-xs"
              title="GitHub Ahmad Rahman"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>

            <button
              type="button"
              onClick={onOpenFormula}
              className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition shadow-xs"
              title="Kaidah Rumus Lengkap"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
              ← Klik icon untuk memuat contoh data simulasi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

