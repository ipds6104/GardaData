import React from 'react';
import { 
  Calculator, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  FileSpreadsheet,
  Binary
} from 'lucide-react';
import { formatRupiah, formatDecimal, CalculationResult } from './formatters';
import { MathView } from './MathView';

interface ResultCardProps {
  calculationResult: CalculationResult;
  onExportCSV?: () => void;
  historyLength?: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  calculationResult, 
  onExportCSV, 
  historyLength = 0 
}) => {
  const {
    nilaiProduksi,
    biayaBarangTerjual,
    biayaProduksi,
    biayaOperasional,
    pendapatanBersihBarang,
    totalBiaya,
    nilaiTambah,
    rasio,
    rasioFormatted,
    kategoriKode,
    kategoriInfo,
    statusLabel,
    statusColor,
    statusDesc,
  } = calculationResult;

  const isCalculated = nilaiProduksi > 0;
  const isAnalyzed = kategoriInfo && kategoriInfo.dianalisis;
  const isKbliG = (kategoriKode || '').toUpperCase() === 'G';

  // Status visual configurations
  const statusStyles = {
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
      badge: 'bg-emerald-500 text-white',
    },
    yellow: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: AlertTriangle,
      badge: 'bg-amber-500 text-white',
    },
    red: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: TrendingDown,
      badge: 'bg-rose-500 text-white',
    },
    gray: {
      bg: 'bg-slate-50 dark:bg-slate-800/50',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
      icon: Info,
      badge: 'bg-slate-400 text-white',
    }
  };

  const currentStyle = statusStyles[statusColor] || statusStyles.gray;
  const StatusIcon = currentStyle.icon;

  // Visual Range Meter Calculations
  const minVal = kategoriInfo?.min ?? 0;
  const maxVal = kategoriInfo?.max ?? 1;
  const barMin = 0;
  const barMax = 1.1;

  const getPercentPos = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 0;
    const clamped = Math.max(0, Math.min(barMax, val));
    return ((clamped - barMin) / (barMax - barMin)) * 100;
  };

  const minPos = getPercentPos(minVal);
  const maxPos = getPercentPos(maxVal);
  const currentPos = getPercentPos(rasio);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-7 shadow-soft border border-slate-100 dark:border-slate-800">
      {/* Title Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B58DE] flex items-center justify-center shrink-0">
          <Calculator className="w-4.5 h-4.5" />
        </div>
        <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          Hasil Nilai Tambah Bruto
        </h3>
      </div>

      {/* Main Result Display Box */}
      <div className="bg-[#F8F9FD] dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-4">
        <span className="text-xs font-medium text-slate-400 block mb-1">
          Estimasi Nilai Tambah Bruto (NTB)
        </span>
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            nilaiTambah < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'
          }`}>
            {formatRupiah(nilaiTambah)}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            IDR
          </span>
        </div>
      </div>

      {/* Rasio (Desimal Murni) & Status Kewajaran */}
      <div className={`p-4 rounded-2xl border ${currentStyle.bg} ${currentStyle.border} mb-4 transition-all`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <StatusIcon className={`w-4 h-4 ${currentStyle.text} shrink-0`} />
            <span className={`text-xs font-bold ${currentStyle.text} truncate`}>
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl shadow-xs text-xs font-black text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold">Rasio:</span>
            <span className="font-mono text-sm text-[#5B58DE]">{rasioFormatted}</span>
          </div>
        </div>

        <p className={`text-xs ${currentStyle.text} leading-relaxed opacity-90`}>
          {statusDesc}
        </p>

        {/* Meteran Visual Rentang Wajar (MIN - MAX) */}
        {isAnalyzed && isCalculated && (
          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold mb-1.5">
              <span>Min: <strong className="font-mono text-slate-800 dark:text-slate-100">{formatDecimal(minVal)}</strong></span>
              <span className="text-[#5B58DE] text-[10px] uppercase font-bold tracking-wider">
                Rentang Wajar Kat. {kategoriInfo.kode}
              </span>
              <span>Max: <strong className="font-mono text-slate-800 dark:text-slate-100">{formatDecimal(maxVal)}</strong></span>
            </div>

            {/* Range Bar Indicator */}
            <div className="relative h-5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-inner">
              {/* Red Zone (Under Min) */}
              <div 
                className="absolute left-0 top-0 bottom-0 bg-rose-200 dark:bg-rose-900/60 border-r border-rose-300"
                style={{ width: `${minPos}%` }}
              />

              {/* Green Zone (Healthy Range) */}
              <div 
                className="absolute top-0 bottom-0 bg-emerald-400 dark:bg-emerald-500 border-x-2 border-emerald-600"
                style={{ 
                  left: `${minPos}%`, 
                  width: `${Math.max(2, maxPos - minPos)}%` 
                }}
              />

              {/* Yellow Zone (Over Max) */}
              <div 
                className="absolute top-0 bottom-0 bg-amber-200 dark:bg-amber-900/60 border-l border-amber-300"
                style={{ 
                  left: `${maxPos}%`, 
                  right: 0 
                }}
              />

              {/* Needle Indicator for current ratio */}
              <div 
                className="absolute top-0 bottom-0 w-1.5 bg-slate-900 dark:bg-white shadow-md z-10 transition-all duration-300 rounded-full"
                style={{ left: `calc(${currentPos}% - 3px)` }}
              >
                <div className="w-2.5 h-2.5 -top-0.5 -left-[2px] bg-slate-900 dark:bg-white rounded-full absolute"></div>
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0,00</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                Posisi Rasio: <span className="text-[#5B58DE]">{rasioFormatted}</span>
              </span>
              <span>≥ 1,10</span>
            </div>
          </div>
        )}
      </div>

      {/* GAMBAR 2: Mini Financial Breakdown Summary */}
      <div className="space-y-2 text-xs mb-4">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
          <span className="truncate pr-2">27. a. Pendapatan Barang & Jasa :</span>
          <span className="font-semibold text-slate-800 dark:text-slate-100 shrink-0">{formatRupiah(nilaiProduksi)}</span>
        </div>

        {/* 26. c HANYA jika Kategori G */}
        {isKbliG && biayaBarangTerjual > 0 && (
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="truncate pr-2">26. c. Pembelian Barang Terjual :</span>
            <span className="font-semibold text-rose-600 shrink-0">- {formatRupiah(biayaBarangTerjual)}</span>
          </div>
        )}

        {/* Output Bersih hanya ditampilkan jika Kategori G memiliki potongan 26.c */}
        {isKbliG && (
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/30 px-2 rounded-lg font-semibold">
            <span className="text-indigo-900 dark:text-indigo-300">Output Bersih (27.a - 26.c) :</span>
            <span className="text-indigo-950 dark:text-indigo-200 shrink-0">{formatRupiah(pendapatanBersihBarang)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
          <span className="truncate pr-2">26. b. Biaya Produksi :</span>
          <span className="font-semibold text-rose-600 shrink-0">- {formatRupiah(biayaProduksi)}</span>
        </div>

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-800">
          <span className="truncate pr-2">26. d. Biaya Operasional :</span>
          <span className="font-semibold text-rose-600 shrink-0">- {formatRupiah(biayaOperasional)}</span>
        </div>

        <div className="flex items-center justify-between pt-1 font-bold text-slate-800 dark:text-slate-100">
          <span>Nilai Tambah Bruto (NTB) :</span>
          <span className={nilaiTambah < 0 ? 'text-rose-600' : 'text-[#5B58DE]'}>
            {formatRupiah(nilaiTambah)}
          </span>
        </div>
      </div>

      {/* DIBAWAH GAMBAR 2: Live Rumus Perhitungan Matematis (LaTeX) - Multi-line agar tidak terpotong */}
      {isCalculated && (
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-br from-[#F5F4FE] to-[#FDF4FF] dark:from-slate-800/80 dark:to-slate-800/50 border border-indigo-100 dark:border-indigo-900/40 text-xs shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-indigo-100/70 dark:border-slate-700">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
              <Binary className="w-3.5 h-3.5 text-[#5B58DE]" />
              <span>Live Rumus Matematis (LaTeX)</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-[#5B58DE] border border-indigo-200 dark:border-slate-700">
              {isKbliG ? 'Kategori G (Perdagangan)' : `Kategori ${kategoriInfo.kode}`}
            </span>
          </div>

          {/* 1. Rumus NTB - Multi-line aligned LaTeX equation agar tidak terpotong */}
          <div className="mb-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span>1. Perhitungan Nilai Tambah Bruto (NTB):</span>
              <span className="font-mono text-[9px] text-[#5B58DE]">
                {isKbliG ? 'Kaidah Kategori G' : 'Kaidah Umum'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-indigo-100 dark:border-slate-700 shadow-xs">
              {/* Formula Definition in LaTeX */}
              <div className="text-slate-600 dark:text-slate-400 pb-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] text-center">
                <MathView 
                  math={isKbliG 
                    ? `\\text{NTB} = (27.a - 26.c) - 26.b - 26.d`
                    : `\\text{NTB} = 27.a - 26.b - 26.d`}
                  block={true}
                />
              </div>

              {/* Substituted Live Calculation in multi-line LaTeX - Pas di dalam card tanpa terpotong */}
              <div className="text-slate-800 dark:text-slate-100 font-medium text-xs py-1 flex justify-center">
                <MathView
                  math={isKbliG
                    ? `\\begin{aligned}
\\text{NTB} &= (\\text{${formatRupiah(nilaiProduksi, false)}} - \\text{${formatRupiah(biayaBarangTerjual, false)}}) \\\\
&\\quad - \\text{${formatRupiah(biayaProduksi, false)}} - \\text{${formatRupiah(biayaOperasional, false)}} \\\\[4pt]
&= \\text{${formatRupiah(pendapatanBersihBarang, false)}} - \\text{${formatRupiah(totalBiaya, false)}} \\\\[4pt]
&= \\mathbf{\\text{Rp } ${formatRupiah(nilaiTambah, false)}}
\\end{aligned}`
                    : `\\begin{aligned}
\\text{NTB} &= \\text{${formatRupiah(nilaiProduksi, false)}} - \\text{${formatRupiah(biayaProduksi, false)}} \\\\
&\\quad - \\text{${formatRupiah(biayaOperasional, false)}} \\\\[4pt]
&= \\text{${formatRupiah(nilaiProduksi, false)}} - \\text{${formatRupiah(totalBiaya, false)}} \\\\[4pt]
&= \\mathbf{\\text{Rp } ${formatRupiah(nilaiTambah, false)}}
\\end{aligned}`}
                  block={true}
                />
              </div>
            </div>
          </div>

          {/* 2. Rumus Rasio NTB - Multi-line LaTeX Fraction */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span>2. Rasio NTB Terhadap Output Bersih:</span>
              <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                Pecahan Matematis
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900/90 border border-emerald-100 dark:border-slate-700 shadow-xs">
              {/* Formula Definition in LaTeX */}
              <div className="text-slate-600 dark:text-slate-400 pb-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] text-center">
                <MathView 
                  math={isKbliG 
                    ? `\\text{Rasio} = \\frac{\\text{NTB}}{27.a - 26.c}`
                    : `\\text{Rasio} = \\frac{\\text{NTB}}{27.a}`}
                  block={true}
                />
              </div>

              {/* Substituted Live Calculation in LaTeX with Fraction */}
              <div className="text-slate-800 dark:text-slate-100 font-medium text-xs py-1 flex justify-center">
                <MathView
                  math={`\\begin{aligned}
\\text{Rasio} &= \\frac{\\text{${formatRupiah(nilaiTambah, false)}}}{\\text{${formatRupiah(pendapatanBersihBarang, false)}}} \\\\[5pt]
&= \\mathbf{${rasioFormatted.replace(',', '{,}')}}
\\end{aligned}`}
                  block={true}
                />
              </div>

              {kategoriInfo.dianalisis && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-sans text-[10px] font-semibold">Rentang Standar:</span>
                  <MathView 
                    math={`[${formatDecimal(minVal).replace(',', '{,}')} \\;\\dots\\; ${formatDecimal(maxVal).replace(',', '{,}')}]`}
                    block={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export CSV quick button if history exists */}
      {historyLength > 0 && onExportCSV && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onExportCSV}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 text-xs font-semibold border border-slate-200 hover:border-emerald-200 dark:border-slate-700 dark:hover:border-emerald-800 transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Riwayat ({historyLength} CSV)</span>
          </button>
        </div>
      )}
    </div>
  );
};
