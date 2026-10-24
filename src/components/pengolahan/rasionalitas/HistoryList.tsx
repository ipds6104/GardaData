import React from 'react';
import { 
  Trash2, 
  FileSpreadsheet, 
  ChevronRight, 
  RotateCcw, 
  TrendingDown, 
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  History
} from 'lucide-react';
import { formatRupiah, formatDecimal, HistoryItem } from './formatters';

interface HistoryListProps {
  history: HistoryItem[];
  searchQuery?: string;
  onLoadHistoryItem: (item: HistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
  onExportCSV: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ 
  history, 
  searchQuery = '', 
  onLoadHistoryItem, 
  onDeleteHistoryItem, 
  onClearAllHistory,
  onExportCSV 
}) => {
  // Filter history based on search query
  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.namaUsaha && item.namaUsaha.toLowerCase().includes(q)) ||
      (item.kategoriNama && item.kategoriNama.toLowerCase().includes(q)) ||
      (item.kategoriKode && item.kategoriKode.toLowerCase().includes(q)) ||
      (item.statusLabel && item.statusLabel.toLowerCase().includes(q)) ||
      (item.timestampFormatted && item.timestampFormatted.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-soft border border-slate-100 dark:border-slate-800 relative overflow-hidden">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B58DE] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Riwayat Perhitungan & Uji Kewajaran
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {history.length} data
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Daftar kalkulasi Nilai Tambah Bruto dan status kewajaran terhadap rentang MIN - MAX kategori usaha SE2026.
          </p>
        </div>

        {/* Action Buttons */}
        {history.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40 transition border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-xs"
              title="Unduh CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onClearAllHistory}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/40 transition border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 shadow-xs"
              title="Hapus Semua Riwayat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus Semua</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout - Full Width List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
            <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada riwayat perhitungan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Isi form kalkulator di atas lalu klik "Hitung & Simpan Riwayat" untuk menyimpan analisis.
            </p>
          </div>
        ) : (
          filteredHistory.map((item, index) => {
            const isWajar = item.statusColor === 'green';
            const isNegative = item.nilaiTambah < 0;
            const ratioDisplay = item.rasioFormatted || formatDecimal(item.rasio);

            return (
              <div
                key={item.id || index}
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#FAF9FD] dark:bg-slate-800/50 hover:bg-[#F3F1FD] dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-200"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                    isNegative 
                      ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400' 
                      : isWajar 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                  }`}>
                    {isNegative ? (
                      <TrendingDown className="w-5 h-5" />
                    ) : isWajar ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.namaUsaha || `Perhitungan #${history.length - index}`}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-indigo-950/60 text-[#5B58DE]">
                        Kategori {item.kategoriKode || 'C'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isWajar
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : isNegative
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        Rasio {ratioDisplay}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        NTB: {formatRupiah(item.nilaiTambah)}
                      </span>
                      <span>•</span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {item.statusLabel}
                      </span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400">
                        {item.timestampFormatted || 'Hari ini'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={() => onLoadHistoryItem(item)}
                    className="px-2.5 py-1 text-xs font-semibold text-[#5B58DE] hover:bg-white dark:hover:bg-slate-700 rounded-lg transition shadow-xs hidden sm:flex items-center gap-1 border border-indigo-100 dark:border-slate-700"
                    title="Muat kembali data ini ke form"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Muat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Hapus riwayat ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onLoadHistoryItem(item)}
                    className="p-1 text-slate-400 group-hover:text-[#5B58DE] transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

