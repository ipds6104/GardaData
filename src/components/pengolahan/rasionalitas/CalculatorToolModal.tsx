import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  Calculator, 
  Delete, 
  Copy, 
  Check, 
  ArrowRight, 
  History,
  Trash2,
  CornerDownLeft
} from 'lucide-react';
import { formatRupiah } from './formatters';

export type TargetFormField = 'nilaiProduksi' | 'biayaBarangTerjual' | 'biayaProduksi' | 'biayaOperasional' | null;

interface CalculatorToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetField?: TargetFormField;
  initialValue?: string;
  kategoriKode?: string;
  onApplyToField: (field: TargetFormField, value: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  nilaiProduksi: '27. a. Nilai pendapatan barang dan jasa',
  biayaProduksi: '26. b. Biaya produksi',
  biayaBarangTerjual: '26. c. Biaya pembelian barang terjual',
  biayaOperasional: '26. d. Biaya operasional',
};

const CACHE_KEY_HISTORY = 'se2026_calculator_cache_history';
const CACHE_KEY_LAST = 'se2026_calculator_cache_last';

/**
 * Format angka ke standar Indonesia:
 * - Pemisah ribuan titik (.)
 * - Pemisah desimal koma (,)
 */
export const formatIndonesianDisplayNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 4,
  }).format(num);
};

/**
 * Evaluator Matematika Murni (Pure Math Parser):
 * - 100% Bebas eval() & new Function() -> 100% Kebal terhadap blokir CSP ('unsafe-eval') browser
 * - Mendukung format Indonesia: titik ribuan (10.000 / 1.000.000) & koma desimal (40,4 / 0,1)
 * - Mendukung operator: +, -, × (*), ÷ (/ atau :), %
 * - Mendukung tanda kurung ()
 */
export function evaluatePureMath(expr: string): number | null {
  if (!expr || typeof expr !== 'string') return 0;
  const raw = expr.trim();
  if (!raw) return 0;

  try {
    // 1. Pra-pemrosesan: Normalisasi simbol & format Indonesia
    let s = raw
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/:/g, '/')
      .replace(/%/g, '/100')
      .replace(/[–—−]/g, '-')
      .replace(/=/g, '');

    // Normalisasi awalan koma/titik tanpa angka depan, misal ",5" atau ".5" -> "0.5"
    s = s.replace(/(^|[+\-*/(\s])[,.](\d+)/g, '$10.$2');

    // Normalisasi token angka berformat Indonesia
    s = s.replace(/[0-9]+(?:[.,][0-9]+)*/g, (token) => {
      let cleanToken = token.replace(/[.,]+$/, '');
      if (!cleanToken) return '0';

      if (cleanToken.includes(',')) {
        // Ada koma = format Indonesia desimal: titik ribuan dibuang, koma jadi titik desimal
        cleanToken = cleanToken.replace(/\./g, '').replace(/,/g, '.');
      } else if ((cleanToken.match(/\./g) || []).length > 1) {
        // Banyak titik = titik ribuan, dibuang
        cleanToken = cleanToken.replace(/\./g, '');
      } else if (/\.\d{3}$/.test(cleanToken)) {
        // 1 titik diikuti 3 digit = titik ribuan, dibuang
        cleanToken = cleanToken.replace(/\./g, '');
      }

      return cleanToken;
    });

    // Bersihkan sisa koma liar
    s = s.replace(/,/g, '.');

    // Bersihkan operator atau titik yang menggantung di ujung saat pengetikan live
    s = s.trim().replace(/[+\-*/.\s]+$/, '').trim();
    if (!s) return 0;

    // 2. Tokenizer
    type TokenType = 'NUMBER' | 'OP' | 'PAREN' | 'UNARY_MINUS';
    interface Token {
      type: TokenType;
      value: string | number;
    }

    const tokens: Token[] = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      if (/[0-9.]/.test(ch)) {
        let numStr = '';
        while (i < s.length && /[0-9.]/.test(s[i])) {
          numStr += s[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) || 0 });
        continue;
      }
      if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '(' || ch === ')') {
        // Deteksi unary minus (negatif di awal atau setelah operator/kurung buka)
        if (ch === '-') {
          const prev = tokens[tokens.length - 1];
          if (!prev || prev.type === 'OP' || (prev.type === 'PAREN' && prev.value === '(')) {
            tokens.push({ type: 'UNARY_MINUS', value: '-' });
            i++;
            continue;
          }
        }
        tokens.push({ type: ch === '(' || ch === ')' ? 'PAREN' : 'OP', value: ch });
        i++;
        continue;
      }
      i++;
    }

    if (tokens.length === 0) return 0;

    // 3. Shunting-Yard Algorithm: Konversi Infix ke RPN (Reverse Polish Notation)
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, 'UNARY_MINUS': 3 };
    const outputQueue: Token[] = [];
    const opStack: Token[] = [];

    for (const token of tokens) {
      if (token.type === 'NUMBER') {
        outputQueue.push(token);
      } else if (token.type === 'OP' || token.type === 'UNARY_MINUS') {
        const valStr = String(token.value);
        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1].value !== '(' &&
          (precedence[String(opStack[opStack.length - 1].value)] || 0) >= (precedence[valStr] || 0)
        ) {
          outputQueue.push(opStack.pop()!);
        }
        opStack.push(token);
      } else if (token.type === 'PAREN' && token.value === '(') {
        opStack.push(token);
      } else if (token.type === 'PAREN' && token.value === ')') {
        while (opStack.length > 0 && opStack[opStack.length - 1].value !== '(') {
          outputQueue.push(opStack.pop()!);
        }
        if (opStack.length > 0 && opStack[opStack.length - 1].value === '(') {
          opStack.pop();
        }
      }
    }

    while (opStack.length > 0) {
      const op = opStack.pop()!;
      if (op.value !== '(') {
        outputQueue.push(op);
      }
    }

    // 4. Evaluasi RPN Stack
    const evalStack: number[] = [];
    for (const token of outputQueue) {
      if (token.type === 'NUMBER') {
        evalStack.push(Number(token.value));
      } else if (token.type === 'UNARY_MINUS') {
        const val = evalStack.pop() || 0;
        evalStack.push(-val);
      } else if (token.type === 'OP') {
        const b = evalStack.pop() ?? 0;
        const a = evalStack.pop() ?? 0;
        switch (token.value) {
          case '+': evalStack.push(a + b); break;
          case '-': evalStack.push(a - b); break;
          case '*': evalStack.push(a * b); break;
          case '/': evalStack.push(b !== 0 ? a / b : 0); break;
        }
      }
    }

    const finalResult = evalStack.pop();
    if (typeof finalResult === 'number' && !isNaN(finalResult) && isFinite(finalResult)) {
      // Bulatkan desimal jika presisi floating point berlebih (misal 40.50000000000001 -> 40.5)
      return parseFloat(finalResult.toFixed(6));
    }
    return null;
  } catch {
    return null;
  }
}

interface CacheHistoryItem {
  id: string;
  expr: string;
  result: number;
  formatted: string;
  timestamp: string;
}

export const CalculatorToolModal: React.FC<CalculatorToolModalProps> = ({
  isOpen,
  onClose,
  targetField = null,
  initialValue = '',
  kategoriKode = 'C',
  onApplyToField,
}) => {
  const isKbliG = (kategoriKode || '').toUpperCase() === 'G';
  const [expression, setExpression] = useState('');
  const [displayResult, setDisplayResult] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [appliedField, setAppliedField] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Riwayat perhitungan kalkulator yang disimpan di Cache Browser (localStorage)
  const [calcHistory, setCalcHistory] = useState<CacheHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Gagal memuat cache kalkulator:', e);
    }
    return [];
  });

  // Simpan riwayat perhitungan ke Cache Browser
  const saveHistoryToCache = (newHistory: CacheHistoryItem[]) => {
    setCalcHistory(newHistory);
    try {
      localStorage.setItem(CACHE_KEY_HISTORY, JSON.stringify(newHistory.slice(0, 30)));
    } catch (e) {
      console.warn('Gagal menyimpan cache kalkulator:', e);
    }
  };

  // Bersihkan cache riwayat perhitungan
  const handleClearHistoryCache = () => {
    setCalcHistory([]);
    try {
      localStorage.removeItem(CACHE_KEY_HISTORY);
      localStorage.removeItem(CACHE_KEY_LAST);
    } catch (e) {
      console.warn('Gagal membersihkan cache kalkulator:', e);
    }
  };

  // Set initial value when opened & auto-focus input
  useEffect(() => {
    if (isOpen) {
      if (initialValue) {
        const clean = initialValue.replace(/[^0-9]/g, '');
        if (clean) {
          const num = parseInt(clean, 10);
          const formatted = formatIndonesianDisplayNumber(num);
          setExpression(formatted);
          setDisplayResult(num);
        } else {
          setExpression('');
          setDisplayResult(0);
        }
      } else {
        // Coba muat state terakhir dari cache jika ada
        try {
          const lastSaved = localStorage.getItem(CACHE_KEY_LAST);
          if (lastSaved) {
            const parsed = JSON.parse(lastSaved);
            if (parsed && typeof parsed.result === 'number') {
              setExpression(parsed.formatted || formatIndonesianDisplayNumber(parsed.result));
              setDisplayResult(parsed.result);
            } else {
              setExpression('');
              setDisplayResult(0);
            }
          } else {
            setExpression('');
            setDisplayResult(0);
          }
        } catch {
          setExpression('');
          setDisplayResult(0);
        }
      }
      setCopied(false);
      setAppliedField(null);

      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen, initialValue]);

  // Update live preview whenever expression changes (Menggunakan Pure Math Evaluator tanpa new Function/eval)
  useEffect(() => {
    const res = evaluatePureMath(expression);
    if (res !== null) {
      setDisplayResult(res);
    }
  }, [expression]);

  const handleApply = useCallback((field: TargetFormField, overrideVal?: number) => {
    if (!field) return;
    const valToUse = overrideVal !== undefined ? overrideVal : displayResult;
    const finalVal = valToUse !== null ? Math.round(valToUse) : 0;
    // Format to Rupiah string format for form input (e.g. 15000000 -> 15.000.000)
    const formatted = new Intl.NumberFormat('id-ID').format(Math.max(0, finalVal));
    onApplyToField(field, formatted);
    setAppliedField(field);
    setTimeout(() => {
      onClose();
    }, 500);
  }, [displayResult, onApplyToField, onClose]);

  // Hitung hasil (= sebagai Enter, koma dengan , dan titik .)
  const handleEqual = useCallback(() => {
    const cleanExpr = expression.replace(/=+$/, '').trim();
    if (!cleanExpr) return;

    const res = evaluatePureMath(cleanExpr);
    if (res !== null) {
      const formattedResult = formatIndonesianDisplayNumber(res);
      
      const newHistoryItem: CacheHistoryItem = {
        id: Date.now().toString(),
        expr: cleanExpr,
        result: res,
        formatted: formattedResult,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      const updatedHistory = [newHistoryItem, ...calcHistory.slice(0, 29)];
      saveHistoryToCache(updatedHistory);

      try {
        localStorage.setItem(CACHE_KEY_LAST, JSON.stringify({
          expr: cleanExpr,
          result: res,
          formatted: formattedResult,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        console.warn('Gagal menyimpan cache perhitungan terakhir:', e);
      }

      setExpression(formattedResult);
      setDisplayResult(res);
      inputRef.current?.focus();
    }
  }, [expression, calcHistory]);

  // Input dari pengetikan keyboard langsung (Laptop, Komputer, & HP)
  const handleExpressionChange = (val: string) => {
    // Jika ada karakter = yang masuk via ketikan atau paste, eksekusi perhitungan
    if (val.includes('=')) {
      const withoutEqual = val.replace(/=/g, '');
      const normalized = withoutEqual
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/x/gi, '×')
        .replace(/:/g, '÷');
      const clean = normalized.replace(/[^0-9+\-×÷%().,\s]/g, '');
      setExpression(clean);
      const res = evaluatePureMath(clean);
      if (res !== null) {
        setDisplayResult(res);
      }
      return;
    }

    // Normalisasi operator keyboard umum: * -> ×, / -> ÷, x/X -> ×, : -> ÷
    const normalized = val
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/x/gi, '×')
      .replace(/:/g, '÷');

    // Filter karakter yang diizinkan saja (angka, operator, kurung, %, titik ribuan, koma desimal, spasi)
    const clean = normalized.replace(/[^0-9+\-×÷%().,\s]/g, '');
    setExpression(clean);
  };

  const handleInput = (val: string) => {
    setExpression(prev => prev + val);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setExpression('');
    setDisplayResult(0);
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  // Salin angka hasil perhitungan dalam format Indonesia
  const handleCopy = () => {
    if (displayResult === null) return;
    const val = formatIndonesianDisplayNumber(displayResult);
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard shortcut listener untuk komputer & laptop ketika fokus di luar input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Jika input sedang difokuskan, event keydown ditangani langsung oleh onKeyDown pada elemen <input>
      if (document.activeElement === inputRef.current) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleInput(e.key);
      } else if (e.key === '+') {
        e.preventDefault();
        handleInput('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleInput('-');
      } else if (e.key === '*' || e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleInput('×');
      } else if (e.key === '/' || e.key === ':') {
        e.preventDefault();
        handleInput('÷');
      } else if (e.key === '.') {
        e.preventDefault();
        handleInput('.');
      } else if (e.key === ',') {
        e.preventDefault();
        handleInput(',');
      } else if (e.key === '(' || e.key === ')') {
        e.preventDefault();
        handleInput(e.key);
      } else if (e.key === '%') {
        e.preventDefault();
        handleInput('%');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cleanExpr = expression.replace(/=+$/, '').trim();
        const hasOperator = /[+\-×÷*/%]/.test(cleanExpr);
        if (!hasOperator && targetField) {
          handleApply(targetField);
        } else {
          handleEqual();
        }
      } else if (e.key === '=') {
        e.preventDefault();
        handleEqual();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, expression, calcHistory, targetField, handleApply, handleEqual]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-7 relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Tutup Kalkulator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B58DE] flex items-center justify-center shadow-xs">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                Kalkulator Rincian SE2026
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-[#5B58DE] border border-indigo-200 dark:border-indigo-800">
                Alat Bantu
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {targetField 
                ? `Menghitung nilai untuk: ${FIELD_LABELS[targetField] || targetField}`
                : 'Hitung subtotal kuesioner dan masukkan langsung ke isian form'}
            </p>
          </div>
        </div>

        {/* Display Screen Box (Tampilan Warna Kontras / Berbeda dengan Frame Kalkulator & Format Indonesia) */}
        <div 
          onClick={() => inputRef.current?.focus()}
          className="cursor-text bg-gradient-to-br from-[#EEF2FF] via-[#F4F3FF] to-[#E9E7FE] dark:from-[#201D47] dark:via-[#262259] dark:to-[#1B193D] border-2 border-[#5B58DE]/35 dark:border-indigo-500/40 p-4 sm:p-5 rounded-2xl shadow-inner mb-3 flex flex-col justify-between transition-all focus-within:border-[#5B58DE] focus-within:ring-2 focus-within:ring-[#5B58DE]/20"
        >
          {/* Top Line: Interactive Calculation Input Field (Dukung keyboard laptop =, enter, koma, titik) */}
          <div className="relative flex items-center mb-1">
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck="false"
              value={expression}
              onChange={(e) => handleExpressionChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const cleanExpr = expression.replace(/=+$/, '').trim();
                  const hasOperator = /[+\-×÷*/%]/.test(cleanExpr);
                  if (!hasOperator && targetField) {
                    handleApply(targetField);
                  } else {
                    handleEqual();
                  }
                } else if (e.key === '=') {
                  e.preventDefault();
                  handleEqual();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onClose();
                }
              }}
              placeholder="0 (ketik rumus angka atau klik keypad)"
              className="w-full bg-transparent text-right font-mono text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400/80 dark:placeholder:text-slate-500 focus:outline-none tracking-wider pr-1"
            />
          </div>

          {/* Bottom Line: Live Evaluated Amount in Rupiah, Salin Angka, and Big Numbers (Format Indonesia) */}
          <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-indigo-200/70 dark:border-indigo-800/60">
            {/* Left: Rupiah Badge & Tombol Salin Angka (Rapi & Tidak Terpotong) */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#5B58DE] dark:text-indigo-300 bg-white/90 dark:bg-slate-900/80 px-2.5 py-1 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs tracking-tight">
                {displayResult !== null && displayResult >= 0 ? formatRupiah(displayResult) : '—'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                title="Salin angka hasil ke clipboard"
                className="hover:text-[#5B58DE] dark:hover:text-indigo-300 transition flex items-center gap-1.5 font-bold text-xs text-[#5B58DE] dark:text-indigo-400 bg-white/90 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 px-2.5 py-1 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Angka</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Big Bold Indonesian Formatted Result */}
            <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-slate-900 dark:text-white text-right overflow-x-auto">
              {displayResult !== null ? formatIndonesianDisplayNumber(displayResult) : '0'}
            </span>
          </div>
        </div>

        {/* Target Field Primary Action: Tampil mencolok tepat di bawah layar */}
        {targetField && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => handleApply(targetField)}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer"
            >
              {appliedField === targetField ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Berhasil Diterapkan ke {FIELD_LABELS[targetField]}!</span>
                </>
              ) : (
                <>
                  <CornerDownLeft className="w-4 h-4" />
                  <span>Gunakan Hasil ({formatRupiah(displayResult || 0)}) ke {FIELD_LABELS[targetField]}</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-mono font-normal">Tekan Enter</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Keypad Grid (Format Indonesia: Titik Ribuan . dan Koma Desimal ,) */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Row 1 */}
          <button
            type="button"
            onClick={handleClear}
            className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm transition active:scale-95 border border-rose-200 dark:border-rose-900/60 cursor-pointer"
          >
            AC
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition active:scale-95 flex items-center justify-center border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Hapus Satu Karakter"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleInput('%')}
            className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#5B58DE] font-bold text-xs sm:text-sm transition active:scale-95 border border-indigo-100 dark:border-slate-700 cursor-pointer"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => handleInput('÷')}
            className="p-3 rounded-xl bg-[#5B58DE]/10 hover:bg-[#5B58DE]/20 text-[#5B58DE] font-bold text-base transition active:scale-95 border border-indigo-200 cursor-pointer"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => handleInput('(')}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            (
          </button>
          <button
            type="button"
            onClick={() => handleInput(')')}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            )
          </button>
          <button
            type="button"
            onClick={() => handleInput('000')}
            className="p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 text-[#5B58DE] font-bold text-xs transition cursor-pointer"
            title="Tambah Ribuan (000)"
          >
            000
          </button>
          <button
            type="button"
            onClick={() => handleInput('×')}
            className="p-3 rounded-xl bg-[#5B58DE]/10 hover:bg-[#5B58DE]/20 text-[#5B58DE] font-bold text-base transition active:scale-95 border border-indigo-200 cursor-pointer"
          >
            ×
          </button>

          {/* Numbers: 7, 8, 9, - */}
          <button
            type="button"
            onClick={() => handleInput('7')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleInput('8')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleInput('9')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleInput('-')}
            className="p-3 rounded-xl bg-[#5B58DE]/10 hover:bg-[#5B58DE]/20 text-[#5B58DE] font-bold text-base transition active:scale-95 border border-indigo-200 cursor-pointer"
          >
            -
          </button>

          {/* Numbers: 4, 5, 6, + */}
          <button
            type="button"
            onClick={() => handleInput('4')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleInput('5')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleInput('6')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleInput('+')}
            className="p-3 rounded-xl bg-[#5B58DE]/10 hover:bg-[#5B58DE]/20 text-[#5B58DE] font-bold text-base transition active:scale-95 border border-indigo-200 cursor-pointer"
          >
            +
          </button>

          {/* Numbers: 1, 2, 3, = (Enter) */}
          <button
            type="button"
            onClick={() => handleInput('1')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleInput('2')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleInput('3')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleEqual()}
            className="p-3 rounded-xl bg-gradient-to-r from-[#5B58DE] to-[#716EED] hover:from-[#4C49CC] hover:to-[#5B58DE] text-white font-extrabold text-base shadow-purple-glow transition active:scale-95 row-span-2 flex items-center justify-center cursor-pointer"
            title="Hitung Hasil (= atau Enter)"
          >
            =
          </button>

          {/* Row: 0, Titik Ribuan (.), Koma Desimal (,) */}
          <button
            type="button"
            onClick={() => handleInput('0')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleInput('.')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer flex flex-col items-center justify-center"
            title="Titik Ribuan (format Indonesia: 10.000)"
          >
            <span>.</span>
            <span className="text-[9px] font-normal text-slate-400 -mt-1">ribu</span>
          </button>
          <button
            type="button"
            onClick={() => handleInput(',')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-base shadow-xs border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer flex flex-col items-center justify-center"
            title="Koma Desimal (format Indonesia: 0,85)"
          >
            <span>,</span>
            <span className="text-[9px] font-normal text-slate-400 -mt-1">desimal</span>
          </button>
        </div>

        {/* Quick Transfer to Any Form Field */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Pindahkan Hasil Perhitungan Ke Form:
          </span>
          <div className={`grid ${isKbliG ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
            <button
              type="button"
              onClick={() => handleApply('nilaiProduksi')}
              className="p-2 text-left rounded-xl bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/60 transition group cursor-pointer"
            >
              <span className="text-[10px] font-bold text-[#5B58DE] block">27. a. Nilai Pendapatan</span>
              <span className="text-[9px] text-slate-500 truncate block">Omzet barang & jasa</span>
            </button>

            <button
              type="button"
              onClick={() => handleApply('biayaProduksi')}
              className="p-2 text-left rounded-xl bg-pink-50/70 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/40 border border-pink-100 dark:border-pink-900/60 transition group cursor-pointer"
            >
              <span className="text-[10px] font-bold text-pink-600 block">26. b. Biaya Produksi</span>
              <span className="text-[9px] text-slate-500 truncate block">Bahan mentah, kemasan</span>
            </button>

            {isKbliG && (
              <button
                type="button"
                onClick={() => handleApply('biayaBarangTerjual')}
                className="p-2 text-left rounded-xl bg-purple-50/70 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 border border-purple-100 dark:border-purple-900/60 transition group cursor-pointer"
              >
                <span className="text-[10px] font-bold text-purple-600 block">26. c. Barang Terjual</span>
                <span className="text-[9px] text-slate-500 truncate block">Khusus perdagangan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleApply('biayaOperasional')}
              className="p-2 text-left rounded-xl bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-900/60 transition group cursor-pointer"
            >
              <span className="text-[10px] font-bold text-blue-600 block">26. d. Biaya Operasional</span>
              <span className="text-[9px] text-slate-500 truncate block">Air, listrik, pulsa</span>
            </button>
          </div>
        </div>

        {/* Calculation History Mini Tape (Browser Cache) */}
        {calcHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <History className="w-3 h-3 text-[#5B58DE]" />
                <span>Riwayat Perhitungan (Tersimpan di Cache Browser)</span>
              </span>
              <button
                type="button"
                onClick={handleClearHistoryCache}
                className="text-[10px] font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                title="Hapus semua cache riwayat hitungan"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus Cache</span>
              </button>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1 text-xs pr-1">
              {calcHistory.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setExpression(h.formatted || formatIndonesianDisplayNumber(h.result));
                    setDisplayResult(h.result);
                    inputRef.current?.focus();
                  }}
                  className="w-full text-left p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-600 dark:text-slate-300 font-mono transition group cursor-pointer"
                  title="Klik untuk memuat kembali hitungan ini"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {h.timestamp && (
                      <span className="text-[10px] text-slate-400 shrink-0 font-sans">
                        {h.timestamp}
                      </span>
                    )}
                    <span className="text-slate-400 truncate">{h.expr} =</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 shrink-0 group-hover:text-[#5B58DE]">
                    {formatRupiah(h.result)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
