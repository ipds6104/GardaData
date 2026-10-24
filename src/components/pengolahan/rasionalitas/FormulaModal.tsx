import React from 'react';
import { X, BookOpen, Table } from 'lucide-react';
import { KATEGORI_LAPANGAN_USAHA, formatDecimal } from './formatters';
import { MathView } from './MathView';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaModal: React.FC<FormulaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 p-6 md:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B58DE] flex items-center justify-center shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Kaidah Rumus Nilai Tambah Bruto (SE2026)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kuesioner Rincian 26 & 27 • Sensus Ekonomi 2026 • BPS Kabupaten Mempawah
            </p>
          </div>
        </div>

        {/* Formula Box Highlight with LaTeX */}
        <div className="bg-gradient-to-br from-[#2B2966] to-[#403AA8] text-white p-5 rounded-2xl shadow-md mb-6 space-y-4">
          <div>
            <span className="text-xs font-semibold text-pink-300 uppercase tracking-wider block mb-1">
              1. Rumus Nilai Tambah Bruto (NTB):
            </span>
            <div className="bg-black/25 p-3 rounded-xl border border-white/10 text-white flex justify-center text-xs md:text-sm overflow-x-auto">
              <MathView 
                math={`\\text{NTB} = \\begin{cases} (27.a - 26.c) - 26.b - 26.d & \\text{untuk Kategori G (Perdagangan)} \\\\[4pt] 27.a - 26.b - 26.d & \\text{untuk Kategori selain G} \\end{cases}`}
                block={true}
              />
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-pink-300 uppercase tracking-wider block mb-1">
              2. Rumus Rasio Kewajaran (Bentuk Desimal):
            </span>
            <div className="bg-black/25 p-3 rounded-xl border border-white/10 text-white flex justify-center text-xs md:text-sm overflow-x-auto">
              <MathView 
                math={`\\text{Rasio NTB} = \\begin{cases} \\displaystyle\\frac{\\text{NTB}}{27.a - 26.c} & \\text{untuk Kategori G} \\\\[10pt] \\displaystyle\\frac{\\text{NTB}}{27.a} & \\text{untuk Kategori selain G} \\end{cases}`}
                block={true}
              />
            </div>
          </div>
        </div>

        {/* Breakdown of each component */}
        <div className="space-y-3 mb-6 text-xs md:text-sm text-slate-700 dark:text-slate-300">
          <div className="p-3.5 rounded-2xl bg-[#FAF9FD] dark:bg-slate-800/60 border border-pink-100 dark:border-pink-900/30">
            <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-0.5">
              26. b. Biaya produksi (Wajib)
            </h5>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              Biaya bahan mentah, bahan baku pembantu, kemasan, energi listrik/bahan bakar mesin proses produksi.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9FD] dark:bg-slate-800/60 border border-purple-100 dark:border-purple-900/30">
            <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-0.5">
              26. c. Biaya pembelian barang yang terjual (Opsional)
            </h5>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              Khusus barang dagangan yang dibeli untuk langsung dijual kembali tanpa diolah (sektor perdagangan).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9FD] dark:bg-slate-800/60 border border-blue-100 dark:border-blue-900/30">
            <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-0.5">
              26. d. Biaya operasional (air, listrik, gas, internet, pulsa, pemeliharaan, biaya angkutan, dll.) (Wajib)
            </h5>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              Seluruh pengeluaran rutin operasional untuk mendukung kelangsungan usaha di luar biaya produksi langsung.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9FD] dark:bg-slate-800/60 border border-indigo-100 dark:border-indigo-900/30">
            <h5 className="font-bold text-slate-800 dark:text-slate-100 mb-0.5">
              27. a. Nilai pendapatan barang dan jasa (Wajib)
            </h5>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              Total penerimaan omzet kotor hasil penjualan produk barang dan jasa usaha.
            </p>
          </div>
        </div>

        {/* Table of Reasonable Ranges */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Table className="w-4 h-4 text-[#5B58DE]" />
              Tabel Rentang Wajar Rasio NTB per Lapangan Usaha (SE2026)
            </h4>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#B45309] text-white font-bold">
                <tr>
                  <th className="px-4 py-2.5">Kategori Lapangan Usaha</th>
                  <th className="px-4 py-2.5 text-center">MIN</th>
                  <th className="px-4 py-2.5 text-center">MAX</th>
                  <th className="px-4 py-2.5 text-center">Status SE2026</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {KATEGORI_LAPANGAN_USAHA.map((item, idx) => (
                  <tr 
                    key={item.kode} 
                    className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}
                  >
                    <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-200">
                      <strong className="text-[#5B58DE]">Kategori {item.kode}</strong> - {item.singkat}
                    </td>
                    <td className="px-4 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.dianalisis ? formatDecimal(item.min) : '—'}
                    </td>
                    <td className="px-4 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.dianalisis ? formatDecimal(item.max) : '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {item.dianalisis ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Dianalisis
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Tidak Dianalisis
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Action */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#5B58DE] text-white text-xs font-bold hover:bg-[#4C49CC] transition shadow-md"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};

