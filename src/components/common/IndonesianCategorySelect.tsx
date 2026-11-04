import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Check, 
  Folder, 
  BookOpen, 
  CheckCircle2, 
  Calendar, 
  FileText 
} from 'lucide-react';

interface IndonesianCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  categoryIcons?: Record<string, React.ElementType>;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_ICONS: Record<string, React.ElementType> = {
  'Materi & Pembelajaran': BookOpen,
  'Kuis & Evaluasi': CheckCircle2,
  'Jadwal & Absensi': Calendar,
  'Dokumen & Instrumen': FileText,
};

export const IndonesianCategorySelect: React.FC<IndonesianCategorySelectProps> = ({
  value,
  onChange,
  categories,
  categoryIcons = DEFAULT_ICONS,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const CurrentIcon = categoryIcons[value] || Folder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl font-semibold text-slate-800 text-left flex items-center justify-between transition-all cursor-pointer select-none group ${
          isOpen
            ? 'border-primary-500 bg-white ring-2 ring-primary-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-3 truncate">
          <div className="p-1.5 rounded-lg bg-primary-50 text-primary-600 shrink-0">
            <CurrentIcon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800 truncate">
            {value || 'Pilih Kategori...'}
          </span>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto space-y-1 p-0.5">
              {categories.map(cat => {
                const IconComponent = categoryIcons[cat] || Folder;
                const isSelected = cat === value;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onChange(cat);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`p-1 rounded-md shrink-0 ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{cat}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-primary-600 shrink-0 ml-2" />
                    )}
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
