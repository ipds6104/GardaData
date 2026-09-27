import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, PRESET_LIST, ThemePreset } from '../lib/theme';

export const ThemeSelector: React.FC = () => {
  const { preset, setPreset, presetInfo, mode, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button to the left of profile */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all shadow-xs cursor-pointer ${
          isOpen
            ? 'bg-primary-50 dark:bg-primary-950/60 border-primary-400 ring-4 ring-primary-100 dark:ring-primary-900/50 text-primary-700 dark:text-primary-300'
            : 'bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Pilih Tema & Mode Tampilan"
      >
        <div className="flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-primary-500" />
          <div className="flex -space-x-1 items-center">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 shadow-xs"
              style={{ backgroundColor: presetInfo.colors.primary }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 shadow-xs"
              style={{ backgroundColor: presetInfo.colors.secondary }}
            />
          </div>
        </div>
        <span className="hidden md:inline text-xs font-black tracking-tight">
          {presetInfo.name}
        </span>
        <span className="text-[10px] opacity-75">
          {mode === 'dark' ? '🌙' : '☀️'}
        </span>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[88px] left-4 right-4 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-3 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/20 p-5 z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-50 dark:bg-primary-950/60 rounded-xl text-primary-600 dark:text-primary-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none">Pengaturan Tema &amp; Mode</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Diterapkan ke seluruh fitur Garda Data</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dark Mode vs Light Mode Switcher */}
            <div className="mb-3.5 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Mode Tampilan:
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mode === 'light'
                      ? 'bg-white text-amber-600 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mode === 'dark'
                      ? 'bg-slate-900 text-primary-300 shadow-xs border border-slate-700'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-4 h-4 text-primary-400" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>

            {/* Default Theme Notice Info Box */}
            <div className="mb-3 px-3 py-2 bg-violet-50/90 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/60 rounded-2xl flex items-center justify-between text-[11px] text-violet-900 dark:text-violet-200 shadow-2xs">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                Preset Warna:
              </span>
              <span className="font-extrabold bg-violet-200/80 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 px-2.5 py-0.5 rounded-lg border border-violet-300/60 dark:border-violet-700">
                {presetInfo.name}
              </span>
            </div>

            {/* Presets List */}
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {PRESET_LIST.map((item) => {
                const isSelected = preset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPreset(item.id);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 group cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50/50 dark:bg-primary-950/40 border-primary-500 ring-2 ring-primary-200 dark:ring-primary-900/60 shadow-xs'
                        : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-black tracking-tight ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.name}
                        </span>
                        {item.id === 'persik' && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-md">
                            Default
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">
                          {item.font}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                        {item.description}
                      </p>

                      {/* Swatches Bar */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">Palet:</span>
                        <div
                          className="w-5 h-5 rounded-lg border border-white dark:border-slate-800 shadow-xs"
                          style={{ backgroundColor: item.colors.primary }}
                          title="Primary"
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-white dark:border-slate-800 shadow-xs"
                          style={{ backgroundColor: item.colors.secondary }}
                          title="Secondary"
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-white dark:border-slate-800 shadow-xs"
                          style={{ backgroundColor: item.colors.accent }}
                          title="Accent"
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs"
                          style={{ backgroundColor: item.colors.bg }}
                          title="Background"
                        />
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div className="pt-1 shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-slate-300 transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
