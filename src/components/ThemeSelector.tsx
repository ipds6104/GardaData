import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, PRESET_LIST, ThemePreset } from '../lib/theme';

export const ThemeSelector: React.FC = () => {
  const { preset, setPreset, presetInfo } = useTheme();
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
        className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all shadow-sm ${
          isOpen
            ? 'bg-primary-50 border-primary-400 ring-4 ring-primary-100 text-primary-700'
            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
        }`}
        title="Pilih Tema / Preset Desain"
      >
        <div className="flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-primary-500" />
          <div className="flex -space-x-1 items-center">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: presetInfo.colors.primary }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: presetInfo.colors.secondary }}
            />
          </div>
        </div>
        <span className="hidden md:inline text-xs font-black tracking-tight">
          {presetInfo.name}
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
            className="fixed top-[88px] left-4 right-4 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-3 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/10 p-5 z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-none">Preset Tema & Warna</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Pilih gaya palet warna dan tipografi</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets List */}
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
              {PRESET_LIST.map((item) => {
                const isSelected = preset === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPreset(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 group ${
                      isSelected
                        ? 'bg-primary-50/50 border-primary-500 ring-2 ring-primary-200 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black tracking-tight ${isSelected ? 'text-primary-700' : 'text-slate-800'}`}>
                          {item.name}
                        </span>
                        {item.id === 'original' && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            Default
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          {item.font}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {item.description}
                      </p>

                      {/* Swatches Bar */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">Palet:</span>
                        <div
                          className="w-5 h-5 rounded-lg border border-white shadow-xs"
                          style={{ backgroundColor: item.colors.primary }}
                          title="Primary"
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-white shadow-xs"
                          style={{ backgroundColor: item.colors.secondary }}
                          title="Secondary"
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-white shadow-xs"
                          style={{ backgroundColor: item.colors.accent }}
                          title="Accent"
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-slate-200 shadow-xs"
                          style={{ backgroundColor: item.colors.bg }}
                          title="Background"
                        />
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div className="pt-1 shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-slate-300 transition-colors" />
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
