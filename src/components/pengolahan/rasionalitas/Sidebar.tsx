import React from 'react';
import { 
  Calculator, 
  Table, 
  BookOpen, 
  ExternalLink,
  PanelLeftClose,
  ArrowLeft
} from 'lucide-react';
import { FlowerVaseIllustration } from './AestheticIllustrations';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  historyCount?: number;
  isOpen?: boolean;
  onClose: () => void;
  onOpenFormula: () => void;
  onOpenCalculator?: () => void;
  onBackToGarda?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  historyCount = 0, 
  isOpen = true, 
  onClose, 
  onOpenFormula,
  onOpenCalculator,
  onBackToGarda 
}) => {
  const menuItems = [
    {
      id: 'calculator',
      label: 'Simulasi Nilai Tambah',
      desc: 'All-in-One Dashboard',
      icon: Calculator,
      badge: historyCount > 0 ? `${historyCount}` : null,
      isActive: activeTab === 'calculator',
      action: () => setActiveTab('calculator')
    },
    {
      id: 'table',
      label: 'Tabel Standar Rasio',
      desc: 'Rentang Wajar Kategori A–U',
      icon: Table,
      badge: null,
      isActive: activeTab === 'table',
      action: () => setActiveTab('table')
    },
    {
      id: 'calc-tool',
      label: 'Kalkulator Bantu',
      desc: 'Hitung Subtotal Kuesioner',
      icon: Calculator,
      badge: 'Alat',
      isActive: false,
      action: () => {
        if (onOpenCalculator) onOpenCalculator();
      }
    },
    {
      id: 'formula',
      label: 'Panduan & Rumus',
      desc: 'Kaidah Konsep NTB',
      icon: BookOpen,
      badge: null,
      isActive: false,
      action: () => {
        onOpenFormula();
      }
    },
  ];

  const handleItemClick = (action: () => void) => {
    action();
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop when sidebar is open on smaller screens */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-label="Tutup Sidebar"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#5B58DE] text-white flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-y-auto overflow-x-hidden`}
      >
        {/* Top Section */}
        <div className="p-4 sm:p-5 pb-1">
          {/* Back to Garda Data Navigation Button */}
          {onBackToGarda && (
            <button
              onClick={onBackToGarda}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda Garda</span>
            </button>
          )}

          {/* Header Dashboard */}
          <div className="flex items-start justify-between mb-3.5 pb-2.5 border-b border-white/15">
            <div className="min-w-0 pr-1">
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest block mb-0.5">
                DASHBOARD
              </span>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-snug">
                Rasionalitas Nilai Tambah Bruto
              </h1>
              <div className="mt-1.5 pt-1.5 border-t border-white/10">
                <p className="text-xs text-white/95 font-bold tracking-wide">
                  BPS Kabupaten Mempawah
                </p>
                <p className="text-[10px] text-white/70 font-medium">
                  Sensus Ekonomi 2026
                </p>
              </div>
            </div>

            {/* Collapse / Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition shrink-0"
              title="Sembunyikan Sidebar"
              aria-label="Sembunyikan Sidebar"
            >
              <PanelLeftClose className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.action)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 text-left ${
                    item.isActive
                      ? 'bg-white text-[#5B58DE] shadow-md font-bold translate-x-1'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${item.isActive ? 'bg-indigo-50 text-[#5B58DE]' : 'bg-white/10 text-white'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block leading-tight text-xs">{item.label}</span>
                      <span className={`text-[10px] block mt-0.5 font-normal ${item.isActive ? 'text-indigo-400 font-medium' : 'text-white/60'}`}>
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ml-1.5 ${
                        item.isActive
                          ? 'bg-[#5B58DE]/15 text-[#5B58DE]'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Media Direct Link Section: YouTube & Spotify (Keep Chilled) */}
          <div className="mt-3.5 pt-2.5 border-t border-white/15">
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider px-1 mb-1.5 block">
              Keep Chilled
            </span>
            <div className="space-y-1.5">
              {/* YouTube Direct Link */}
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-slate-900 transition-all duration-200 group shadow-xs"
                title="Buka YouTube"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5.5 h-5.5 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-xs p-1">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="block text-xs font-bold leading-tight">YouTube</span>
                    <span className="text-[9px] text-white/70 group-hover:text-slate-500 block leading-tight">Tonton Video</span>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 text-white group-hover:text-slate-700" />
              </a>

              {/* Spotify Direct Link */}
              <a
                href="https://open.spotify.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-slate-900 transition-all duration-200 group shadow-xs"
                title="Buka Spotify"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5.5 h-5.5 rounded-lg bg-[#1DB954] flex items-center justify-center text-white shrink-0 shadow-xs p-1">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.497 17.307a.75.75 0 0 1-1.03.247c-2.822-1.724-6.375-2.114-10.56-1.157a.75.75 0 1 1-.335-1.462c4.582-1.047 8.52-.607 11.678 1.342a.75.75 0 0 1 .247 1.03zm1.467-3.264a.938.938 0 0 1-1.288.309c-3.23-1.986-8.156-2.56-11.977-1.4a.937.937 0 1 1-.546-1.794c4.372-1.328 9.8-.687 13.502 1.597a.938.938 0 0 1 .309 1.288zm.126-3.41c-3.873-2.3-10.266-2.512-13.98-1.38a1.125 1.125 0 0 1-.652-2.155c4.27-1.296 11.33-1.048 15.8 1.606a1.125 1.125 0 1 1-1.168 1.93z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="block text-xs font-bold leading-tight">Spotify</span>
                    <span className="text-[9px] text-white/70 group-hover:text-slate-500 block leading-tight">Musik & Podcast</span>
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 text-white group-hover:text-slate-700" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Aesthetic Plant / Flower Vase Illustration */}
        <div className="relative pt-1 flex flex-col items-center justify-end select-none mt-auto shrink-0">
          <FlowerVaseIllustration className="w-24 sm:w-28 h-auto drop-shadow-md opacity-90" />
          <div className="w-full text-center py-1.5 bg-[#4D4AC7]/80 text-[10px] font-bold text-white/90 tracking-wider uppercase border-t border-white/10">
            BPS Kab Mempawah
          </div>
        </div>
      </aside>
    </>
  );
};

