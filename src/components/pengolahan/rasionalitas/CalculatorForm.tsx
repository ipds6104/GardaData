import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2,
  Factory, 
  ShoppingCart, 
  Briefcase, 
  DollarSign, 
  ArrowRight, 
  RotateCcw, 
  RotateCw,
  Save, 
  Check, 
  AlertCircle,
  FileText,
  Layers,
  Search,
  ChevronDown,
  X,
  Calculator,
  Undo2,
  Redo2,
  Sparkles,
  ExternalLink,
  BookOpenCheck
} from 'lucide-react';
import { 
  parseRupiah, 
  KATEGORI_LAPANGAN_USAHA, 
  formatDecimal,
  FormDataState 
} from './formatters';
import { TargetFormField } from './CalculatorToolModal';
import { CurrencyInputField } from './CurrencyInputField';
import { getKbliSuggestionFromBusinessName, KbliSuggestion } from './kbliRecommender';

interface CalculatorFormProps {
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  onCalculateAndSave: () => void;
  onReset: () => void;
  onOpenCalculatorForField?: (field: TargetFormField) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ 
  formData, 
  setFormData, 
  onCalculateAndSave, 
  onReset,
  onOpenCalculatorForField 
}) => {
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isKbliOpen, setIsKbliOpen] = useState(false);
  const [kbliSearch, setKbliSearch] = useState('');
  const kbliDropdownRef = useRef<HTMLDivElement>(null);
  const kbliInputRef = useRef<HTMLInputElement>(null);

  // Rekomendasi KBLI Cerdas
  const [suggestion, setSuggestion] = useState<KbliSuggestion | null>(null);

  // Undo / Redo history stack
  const [historyStack, setHistoryStack] = useState<FormDataState[]>([formData]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isInternalUndoRedo = useRef(false);

  // Push new snapshot to history stack
  const pushHistory = (newState: FormDataState) => {
    setHistoryStack(prev => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      const current = upToCurrent[upToCurrent.length - 1];
      if (
        current &&
        current.namaUsaha === newState.namaUsaha &&
        current.kategoriKode === newState.kategoriKode &&
        current.nilaiProduksi === newState.nilaiProduksi &&
        current.biayaBarangTerjual === newState.biayaBarangTerjual &&
        current.biayaProduksi === newState.biayaProduksi &&
        current.biayaOperasional === newState.biayaOperasional
      ) {
        return prev;
      }
      const newStack = [...upToCurrent, newState].slice(-50);
      setHistoryIndex(newStack.length - 1);
      return newStack;
    });
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    const targetIdx = historyIndex - 1;
    const targetState = historyStack[targetIdx];
    isInternalUndoRedo.current = true;
    setHistoryIndex(targetIdx);
    setFormData(targetState);
  };

  const handleRedo = () => {
    if (!canRedo) return;
    const targetIdx = historyIndex + 1;
    const targetState = historyStack[targetIdx];
    isInternalUndoRedo.current = true;
    setHistoryIndex(targetIdx);
    setFormData(targetState);
  };

  // Listen for Ctrl+Z and Ctrl+Y shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, historyStack]);

  // Sync external changes (preset loads, reset) to history
  useEffect(() => {
    if (isInternalUndoRedo.current) {
      isInternalUndoRedo.current = false;
      return;
    }
    pushHistory(formData);
  }, [formData.namaUsaha, formData.kategoriKode, formData.nilaiProduksi, formData.biayaBarangTerjual, formData.biayaProduksi, formData.biayaOperasional]);

  // Close KBLI dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kbliDropdownRef.current && !kbliDropdownRef.current.contains(event.target as Node)) {
        setIsKbliOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldChange = (field: keyof FormDataState, formattedValue: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Rule: 26. c HANYA jika Kategori G (Perdagangan)
  const isKbliG = (formData.kategoriKode || 'C').toUpperCase() === 'G';

  const selectedKategori = KATEGORI_LAPANGAN_USAHA.find(k => k.kode === (formData.kategoriKode || 'C')) || KATEGORI_LAPANGAN_USAHA[2];

  // Rekomendasi otomatis KBLI berdasarkan Nama Usaha
  useEffect(() => {
    const cleanName = (formData.namaUsaha || '').trim();
    if (cleanName.length < 2) {
      setSuggestion(null);
      return;
    }

    const found = getKbliSuggestionFromBusinessName(cleanName);
    setSuggestion(found);

    // Otomatis terapkan saran KBLI saat user memasukkan atau mengedit nama usaha
    // (Bahkan jika user sebelumnya salah mengklik kategori lain)
    if (found) {
      if (formData.kategoriKode !== found.kode) {
        setFormData(prev => ({
          ...prev,
          kategoriKode: found.kode,
          biayaBarangTerjual: found.kode === 'G' ? prev.biayaBarangTerjual : ''
        }));
      }
    }
  }, [formData.namaUsaha]);

  // Alphabet list for quick 1-click KBLI selection (A sampai U)
  const alphabetList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'];

  // Handle category selection
  const handleSelectKbli = (letterCode: string) => {
    const target = KATEGORI_LAPANGAN_USAHA.find(k => k.kode === letterCode);
    if (target) {
      setFormData(prev => ({ 
        ...prev, 
        kategoriKode: letterCode,
        // Jika berganti dari G ke kategori lain, bersihkan 26.c agar tidak ikut dihitung
        biayaBarangTerjual: letterCode === 'G' ? prev.biayaBarangTerjual : ''
      }));
      setIsKbliOpen(false);
      setKbliSearch('');
    }
  };

  // Terapkan saran KBLI jika user ingin menggunakan saran yang sempat di-override
  const applySuggestion = (kode: string) => {
    handleSelectKbli(kode);
  };

  // Handle Form Reset - kembalikan state form ke awal yang bersih
  const handleResetForm = () => {
    setSuggestion(null);
    setErrors({});
    setIsKbliOpen(false);
    setKbliSearch('');
    setHistoryStack([{
      namaUsaha: '',
      kategoriKode: 'C',
      nilaiProduksi: '',
      biayaBarangTerjual: '',
      biayaProduksi: '',
      biayaOperasional: '',
    }]);
    setHistoryIndex(0);
    onReset();
  };

  // Filter KBLI list in dropdown search
  const filteredKbli = KATEGORI_LAPANGAN_USAHA.filter((kat) => {
    if (!kbliSearch) return true;
    const clean = kbliSearch.toLowerCase().trim();
    if (clean.length === 1) {
      return kat.kode.toLowerCase() === clean;
    }
    return (
      kat.kode.toLowerCase() === clean ||
      kat.nama.toLowerCase().includes(clean) ||
      kat.singkat.toLowerCase().includes(clean)
    );
  });

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const prodVal = parseRupiah(formData.nilaiProduksi);

    if (!formData.biayaProduksi && formData.biayaProduksi !== '0') {
      newErrors.biayaProduksi = '26. b. Biaya produksi wajib diisi.';
    }
    if (!formData.biayaOperasional && formData.biayaOperasional !== '0') {
      newErrors.biayaOperasional = '26. d. Biaya operasional wajib diisi.';
    }
    if (!formData.nilaiProduksi || prodVal <= 0) {
      newErrors.nilaiProduksi = '27. a. Nilai pendapatan barang dan jasa wajib diisi lebih dari 0.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onCalculateAndSave();
  };

  // Rincian 26: 26.c HANYA ditampilkan jika KBLI G (Perdagangan)
  const rincian26List: Array<{
    id: TargetFormField;
    code: string;
    title: string;
    field: 'biayaProduksi' | 'biayaBarangTerjual' | 'biayaOperasional';
    icon: typeof Factory;
    iconBg: string;
    badge: string;
    badgeClass: string;
    placeholder: string;
    isRequired: boolean;
  }> = [
    {
      id: 'biayaProduksi',
      code: '26. b.',
      title: '26. b. Biaya produksi',
      field: 'biayaProduksi',
      icon: Factory,
      iconBg: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400',
      badge: 'Wajib',
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
      placeholder: '0',
      isRequired: true,
    },
    ...(isKbliG ? [{
      id: 'biayaBarangTerjual' as TargetFormField,
      code: '26. c.',
      title: '26. c. Biaya pembelian barang yang terjual',
      field: 'biayaBarangTerjual' as const,
      icon: ShoppingCart,
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
      badge: 'Khusus Kategori G',
      badgeClass: 'bg-indigo-50 text-[#5B58DE] border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
      placeholder: '0',
      isRequired: false,
    }] : []),
    {
      id: 'biayaOperasional',
      code: '26. d.',
      title: '26. d. Biaya operasional (air, listrik, gas, internet, pulsa, pemeliharaan, biaya angkutan, dll.)',
      field: 'biayaOperasional',
      icon: Briefcase,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
      badge: 'Wajib',
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
      placeholder: '0',
      isRequired: true,
    },
  ];

  const rincian27List: Array<{
    id: TargetFormField;
    code: string;
    title: string;
    field: 'nilaiProduksi';
    icon: typeof DollarSign;
    iconBg: string;
    badge: string;
    badgeClass: string;
    placeholder: string;
    isRequired: boolean;
  }> = [
    {
      id: 'nilaiProduksi',
      code: '27. a.',
      title: '27. a. Nilai pendapatan barang dan jasa',
      field: 'nilaiProduksi',
      icon: DollarSign,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      badge: 'Wajib',
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
      placeholder: '0',
      isRequired: true,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-soft border border-slate-100 dark:border-slate-800">
      {/* Title & Section Header with Undo / Redo Toolbar */}
      <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5B58DE]" />
            <span>Komponen Nilai Tambah Bruto</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Isi identitas usaha, tentukan KBLI, lalu masukkan nilai pengeluaran dan pendapatan dalam Rupiah (Rp).
          </p>
        </div>

        {/* Undo and Redo Action Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              canUndo
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs hover:text-[#5B58DE]'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Batal perubahan terakhir (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              canRedo
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs hover:text-[#5B58DE]'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Ulangi perubahan (Ctrl+Y atau Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span>Redo</span>
          </button>
        </div>
      </div>

      <form onSubmit={validateAndSubmit} className="space-y-6">
        {/* BAGIAN 1: IDENTITAS USAHA (OPSIONAL) */}
        <div className="bg-[#FAF9FE] dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-indigo-100/70 dark:border-indigo-900/30">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#5B58DE]" />
              <span>Nama Usaha / Responden</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400 normal-case">(Opsional)</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: Rumah Makan Rasa Mempawah, Toko Berkah, dll."
            value={formData.namaUsaha || ''}
            onChange={(e) => handleFieldChange('namaUsaha', e.target.value)}
            className="w-full px-4 py-2.5 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B58DE]/20 focus:border-[#5B58DE] text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          {suggestion && (
            <div className="mt-2 flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200 animate-fadeIn">
              <span className="flex items-center gap-1.5 font-medium truncate">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                <span>Saran SE2026: <strong>Kategori {suggestion.kode}</strong> – {suggestion.singkat}</span>
                {suggestion.matchedKeyword && (
                  <span className="text-amber-600 dark:text-amber-400 font-normal truncate hidden sm:inline">
                    (cocok kata "{suggestion.matchedKeyword}")
                  </span>
                )}
              </span>
              {formData.kategoriKode !== suggestion.kode ? (
                <button
                  type="button"
                  onClick={() => applySuggestion(suggestion.kode)}
                  className="ml-2 px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shrink-0 transition shadow-xs cursor-pointer"
                >
                  Terapkan ({suggestion.kode})
                </button>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider shrink-0 bg-amber-100/80 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-md">
                  Aktif
                </span>
              )}
            </div>
          )}
        </div>

        {/* BAGIAN 2: KATEGORI LAPANGAN USAHA (KBLI) - BISA DI-KLIK & BISA DI-SEARCH DENGAN MENGETIK */}
        <div className="bg-[#FAF9FE] dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-indigo-100/70 dark:border-indigo-900/30" ref={kbliDropdownRef}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#5B58DE]" />
                <span>Kategori Lapangan Usaha (KBLI)</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Rentang Wajar SE2026: <strong className="text-[#5B58DE] font-mono">{formatDecimal(selectedKategori.min)} – {formatDecimal(selectedKategori.max)}</strong>
              </span>
            </div>

            {/* Shortcut Buka KBLI 2025 di New Tab */}
            <a
              href="/?page=kbli-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/80 text-[#5B58DE] hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-300 text-xs font-bold shadow-2xs transition-all shrink-0 self-start sm:self-auto group cursor-pointer"
              title="Buka Modul Pencarian KBLI 2025 Garda Data di Tab Baru"
            >
              <BookOpenCheck className="w-3.5 h-3.5 text-[#5B58DE] group-hover:scale-110 transition-transform" />
              <span>Buka KBLI 2025</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#5B58DE] transition-colors" />
            </a>
          </div>

          {/* Quick Click Alphabet Row */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Pilih Cepat Abjad Kategori:
              </span>
              <span className="text-[10px] text-slate-400 italic">
                (Klik abjad atau ketik nama pada kotak pencarian)
              </span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
              {alphabetList.map((letter) => {
                const isCurrent = (formData.kategoriKode || 'C') === letter;
                const isSuggested = suggestion?.kode === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleSelectKbli(letter, true)}
                    className={`relative w-8 h-8 rounded-xl font-bold text-xs transition-all shrink-0 flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'bg-[#5B58DE] text-white shadow-md ring-2 ring-[#5B58DE]/30 scale-105'
                        : isSuggested
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400 hover:bg-amber-100 font-extrabold'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-[#5B58DE] border border-slate-200 dark:border-slate-700'
                    }`}
                    title={
                      isSuggested
                        ? `Kategori ${letter} disarankan berdasarkan data SE2026 (Kata kunci: "${suggestion.matchedKeyword}")`
                        : `Pilih Kategori ${letter}`
                    }
                  >
                    {letter}
                    {/* Titik Aksen Orange pada Kode KBLI yang Disarankan */}
                    {isSuggested && (
                      <span 
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs" 
                        title={`Saran SE2026: Kategori ${letter}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Searchable & Clickable Combobox Input */}
          <div className="relative">
            <div 
              className={`w-full bg-white dark:bg-slate-900 border rounded-2xl px-3 py-2 flex items-center gap-2.5 transition-all ${
                isKbliOpen
                  ? 'border-[#5B58DE] ring-2 ring-[#5B58DE]/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 shadow-xs'
              }`}
            >
              {/* Category Badge Pill with Orange Accent Dot if suggested */}
              <div className="relative shrink-0">
                <span className="w-8 h-8 rounded-xl bg-[#5B58DE] text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
                  {selectedKategori.kode}
                </span>
                {suggestion && suggestion.kode === selectedKategori.kode && (
                  <span 
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs animate-pulse" 
                    title={`Saran data SE2026: Kategori ${suggestion.kode} - ${suggestion.singkat}`}
                  />
                )}
              </div>

              {/* Direct Search & Typing Input */}
              <div className="flex-1 min-w-0">
                <input
                  ref={kbliInputRef}
                  type="text"
                  placeholder="Ketik kode (misal: G, C, I) atau nama usaha (misal: dagang, resto, jasa) untuk mencari..."
                  value={isKbliOpen ? kbliSearch : selectedKategori.nama}
                  onFocus={() => {
                    setIsKbliOpen(true);
                    setKbliSearch('');
                  }}
                  onChange={(e) => {
                    setIsKbliOpen(true);
                    setKbliSearch(e.target.value);
                  }}
                  className="w-full text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none placeholder-slate-400"
                />
                {!isKbliOpen && (
                  <span className="text-[10px] text-slate-400 block truncate font-normal">
                    {suggestion && suggestion.kode === selectedKategori.kode ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1 mr-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                        Saran SE2026: Kat. {suggestion.kode} ({suggestion.matchedKeyword}) •
                      </span>
                    ) : suggestion ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          applySuggestion(suggestion.kode);
                        }}
                        className="text-amber-600 dark:text-amber-400 font-semibold inline-flex items-center gap-1 mr-1 hover:underline cursor-pointer"
                        title="Klik untuk menerapkan saran KBLI"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                        Saran SE2026: Kat. {suggestion.kode} (Klik untuk terapkan) •
                      </button>
                    ) : null}
                    Standar SE2026: MIN {formatDecimal(selectedKategori.min)} | MAX {formatDecimal(selectedKategori.max)}
                  </span>
                )}
              </div>

              {/* Action Buttons: Clear & Chevron */}
              <div className="flex items-center gap-1 shrink-0">
                {isKbliOpen && kbliSearch && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setKbliSearch('');
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsKbliOpen(!isKbliOpen)}
                  className="p-1 text-slate-400 hover:text-[#5B58DE]"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isKbliOpen ? 'rotate-180 text-[#5B58DE]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Dropdown Menu List */}
            {isKbliOpen && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Hasil pencarian ({filteredKbli.length} kategori):</span>
                  <span className="text-[10px] text-slate-400">Pilih salah satu untuk menerapkan</span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1.5">
                  {filteredKbli.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Tidak ada kategori KBLI yang cocok dengan "{kbliSearch}"
                    </div>
                  ) : (
                    filteredKbli.map((kat) => {
                      const isSelected = kat.kode === (formData.kategoriKode || 'C');
                      const isSuggested = suggestion?.kode === kat.kode;
                      const canAnalyze = kat.dianalisis;

                      return (
                        <button
                          key={kat.kode}
                          type="button"
                          disabled={!canAnalyze}
                          onClick={() => {
                            if (canAnalyze) {
                              handleSelectKbli(kat.kode);
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                            !canAnalyze 
                              ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40' 
                              : isSelected 
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-semibold' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                              !canAnalyze 
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                : isSelected 
                                ? 'bg-[#5B58DE] text-white shadow-xs' 
                                : 'bg-indigo-100 dark:bg-indigo-950 text-[#5B58DE]'
                            }`}>
                              {kat.kode}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs sm:text-sm font-semibold truncate">
                                  {kat.nama}
                                </p>
                                {isSuggested && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/80 shrink-0">
                                    💡 Saran
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">
                                {canAnalyze ? kat.singkat : 'Dikecualikan dalam Sensus Ekonomi 2026'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {canAnalyze ? (
                              <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  MIN {formatDecimal(kat.min)}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">-</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  MAX {formatDecimal(kat.max)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold">
                                Dikecualikan
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#5B58DE] stroke-[3]" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Shortcut Footer ke Fitur KBLI 2025 di New Tab */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Butuh cari rincian kode KBLI 5-digit?
                  </span>
                  <a
                    href="/?page=kbli-2025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#5B58DE] hover:underline cursor-pointer"
                  >
                    <span>Buka KBLI 2025</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BAGIAN 3: 26. RINCIAN PENGELUARAN */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5B58DE]"></span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                26. Rincian Pengeluaran
              </h4>
            </div>

            {/* Indicator khusus Kategori G */}
            {isKbliG && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B58DE] border border-indigo-200 dark:border-indigo-800">
                Mode Perdagangan: Rincian 26.c Aktif
              </span>
            )}
          </div>

          <div className="space-y-3">
            {rincian26List.map((step) => {
              const Icon = step.icon;
              const hasError = errors[step.field];
              const isFilled = formData[step.field] && formData[step.field].length > 0;

              return (
                <div 
                  key={step.id} 
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    hasError 
                      ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-100' 
                      : isFilled 
                      ? 'border-indigo-100 dark:border-indigo-900/50 bg-[#FAF9FF] dark:bg-slate-800/40 shadow-xs' 
                      : 'border-slate-100 dark:border-slate-800 bg-[#F9FAFD] dark:bg-slate-800/20 hover:border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl ${step.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                          {step.title}
                        </span>
                        {step.isRequired ? (
                          <span className="text-rose-500 font-bold">*</span>
                        ) : (
                          <span className="text-xs text-slate-400 font-normal">(opsional)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center ml-10 sm:ml-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.badgeClass}`}>
                        {step.badge}
                      </span>

                      {/* Calculator Trigger Button */}
                      {onOpenCalculatorForField && (
                        <button
                          type="button"
                          onClick={() => onOpenCalculatorForField(step.id)}
                          className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-[#5B58DE] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1"
                          title={`Buka kalkulator bantu untuk ${step.code}`}
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Hitung</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bulletproof Currency Input Field (Cursor-safe) */}
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-xs font-bold text-slate-400">Rp</span>
                    </div>
                    <CurrencyInputField
                      id={`input-${step.field}`}
                      placeholder={step.placeholder}
                      value={formData[step.field] || ''}
                      onChange={(val) => handleFieldChange(step.field, val)}
                      hasError={Boolean(hasError)}
                    />
                  </div>

                  {hasError && (
                    <p className="flex items-center gap-1 text-xs text-rose-600 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {hasError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BAGIAN 4: 27. RINCIAN NILAI PENDAPATAN */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              27. Rincian Nilai Pendapatan
            </h4>
          </div>

          <div className="space-y-3">
            {rincian27List.map((step) => {
              const Icon = step.icon;
              const hasError = errors[step.field];
              const isFilled = formData[step.field] && formData[step.field].length > 0;

              return (
                <div 
                  key={step.id} 
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    hasError 
                      ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 ring-2 ring-rose-100' 
                      : isFilled 
                      ? 'border-emerald-100 dark:border-emerald-900/50 bg-[#F5FCF8] dark:bg-slate-800/40 shadow-xs' 
                      : 'border-slate-100 dark:border-slate-800 bg-[#F9FAFD] dark:bg-slate-800/20 hover:border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl ${step.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                          {step.title}
                        </span>
                        <span className="text-rose-500 font-bold">*</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center ml-10 sm:ml-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.badgeClass}`}>
                        {step.badge}
                      </span>

                      {/* Calculator Trigger Button */}
                      {onOpenCalculatorForField && (
                        <button
                          type="button"
                          onClick={() => onOpenCalculatorForField(step.id)}
                          className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-[#5B58DE] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1"
                          title={`Buka kalkulator bantu untuk ${step.code}`}
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Hitung</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bulletproof Currency Input Field (Cursor-safe) */}
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <span className="text-xs font-bold text-slate-400">Rp</span>
                    </div>
                    <CurrencyInputField
                      id={`input-${step.field}`}
                      placeholder={step.placeholder}
                      value={formData[step.field] || ''}
                      onChange={(val) => handleFieldChange(step.field, val)}
                      hasError={Boolean(hasError)}
                    />
                  </div>

                  {hasError && (
                    <p className="flex items-center gap-1 text-xs text-rose-600 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {hasError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Isian</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#5B58DE] to-[#716EED] hover:from-[#4C49CC] hover:to-[#5B58DE] shadow-purple-glow transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Hitung & Simpan Riwayat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
