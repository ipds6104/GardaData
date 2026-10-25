import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { HeroProfile } from './HeroProfile';
import { CalculatorForm } from './CalculatorForm';
import { ResultCard } from './ResultCard';
import { HistoryList } from './HistoryList';
import { FormulaModal } from './FormulaModal';
import { CalculatorToolModal, TargetFormField } from './CalculatorToolModal';
import { DeskLampIllustration } from './AestheticIllustrations';
import { 
  calculateNTB, 
  parseRupiah, 
  formatDecimal,
  formatInputCurrency, 
  formatIndonesianDate, 
  exportHistoryToCSV,
  KATEGORI_LAPANGAN_USAHA,
  FormDataState,
  HistoryItem
} from './formatters';
import { Table, PanelLeftOpen } from 'lucide-react';

interface RasionalitasNtbModuleProps {
  onBack: () => void;
}

const INITIAL_FORM_STATE: FormDataState = {
  namaUsaha: '',
  kategoriKode: 'C',
  nilaiProduksi: '',
  biayaBarangTerjual: '',
  biayaProduksi: '',
  biayaOperasional: '',
};

const SAMPLE_PRESETS: Record<string, FormDataState> = {
  kuliner: {
    namaUsaha: 'Restoran & Katering Mempawah Rasa',
    kategoriKode: 'I',
    nilaiProduksi: '150.000.000',
    biayaBarangTerjual: '',
    biayaProduksi: '55.000.000',
    biayaOperasional: '25.000.000',
  },
  dagang: {
    namaUsaha: 'Toko Kelontong Berkah Mempawah',
    kategoriKode: 'G',
    nilaiProduksi: '200.000.000',
    biayaBarangTerjual: '140.000.000',
    biayaProduksi: '5.000.000',
    biayaOperasional: '12.000.000',
  },
  jasa: {
    namaUsaha: 'Studio Desain & Percetakan Digital Mempawah',
    kategoriKode: 'J',
    nilaiProduksi: '85.000.000',
    biayaBarangTerjual: '',
    biayaProduksi: '12.000.000',
    biayaOperasional: '22.000.000',
  },
  manufaktur: {
    namaUsaha: 'Sentra Pengolahan Hasil Laut Mempawah',
    kategoriKode: 'C',
    nilaiProduksi: '180.000.000',
    biayaBarangTerjual: '',
    biayaProduksi: '65.000.000',
    biayaOperasional: '35.000.000',
  },
};

export const RasionalitasNtbModule: React.FC<RasionalitasNtbModuleProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<FormDataState>(INITIAL_FORM_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'calculator' | 'table'>('calculator');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isCalculatorToolOpen, setIsCalculatorToolOpen] = useState(false);
  const [calculatorTargetField, setCalculatorTargetField] = useState<TargetFormField>(null);

  // History state loaded from localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ntb_history_se2026_mempawah');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ntb_history_se2026_mempawah', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  // Live calculation based on current form & selected category
  const currentCalculation = calculateNTB({
    nilaiProduksi: parseRupiah(formData.nilaiProduksi),
    biayaBarangTerjual: parseRupiah(formData.biayaBarangTerjual),
    biayaProduksi: parseRupiah(formData.biayaProduksi),
    biayaOperasional: parseRupiah(formData.biayaOperasional),
    kategoriKode: formData.kategoriKode || 'C',
  });

  // Handle Calculate & Save
  const handleCalculateAndSave = () => {
    const calc = currentCalculation;

    const newHistoryItem: HistoryItem = {
      id: `hist-${Date.now()}`,
      namaUsaha: formData.namaUsaha || `Perhitungan #${history.length + 1}`,
      kategoriKode: calc.kategoriKode,
      kategoriNama: calc.kategoriInfo?.nama || `Kategori ${calc.kategoriKode}`,
      kategoriMin: calc.kategoriInfo?.min,
      kategoriMax: calc.kategoriInfo?.max,
      nilaiProduksi: calc.nilaiProduksi,
      biayaBarangTerjual: calc.biayaBarangTerjual,
      biayaProduksi: calc.biayaProduksi,
      biayaOperasional: calc.biayaOperasional,
      nilaiTambah: calc.nilaiTambah,
      rasio: calc.rasio,
      rasioFormatted: calc.rasioFormatted,
      statusLabel: calc.statusLabel,
      statusColor: calc.statusColor,
      timestamp: new Date().toISOString(),
      timestampFormatted: formatIndonesianDate(),
    };

    setHistory(prev => [newHistoryItem, ...prev]);

    // Trigger celebratory confetti if calculation is valid & in reasonable range
    if (calc.statusColor === 'green') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#5B58DE', '#F472B6', '#34D399', '#60A5FA']
        });
      } catch (e) {
        // ignore
      }
    }
  };

  // Handle Form Reset - kembalikan seluruh isian dan halaman ke kondisi awal yang bersih
  const handleResetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setSearchQuery('');
    setActiveTab('calculator');
    setIsFormulaOpen(false);
    setIsCalculatorToolOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load Preset
  const handleLoadPreset = (presetKey: string) => {
    if (SAMPLE_PRESETS[presetKey]) {
      setFormData(SAMPLE_PRESETS[presetKey]);
      setActiveTab('calculator');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Load History Item back to Form
  const handleLoadHistoryItem = (item: HistoryItem) => {
    const katKode = item.kategoriKode || 'C';
    const isKatG = katKode.toUpperCase() === 'G';
    setFormData({
      namaUsaha: item.namaUsaha || '',
      kategoriKode: katKode,
      nilaiProduksi: formatInputCurrency(item.nilaiProduksi?.toString() || ''),
      biayaBarangTerjual: isKatG && item.biayaBarangTerjual ? formatInputCurrency(item.biayaBarangTerjual.toString()) : '',
      biayaProduksi: formatInputCurrency(item.biayaProduksi?.toString() || ''),
      biayaOperasional: formatInputCurrency(item.biayaOperasional?.toString() || ''),
    });
    setActiveTab('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete single history item
  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat perhitungan?')) {
      setHistory([]);
    }
  };

  // Open Calculator tool for specific field or generic
  const handleOpenCalculatorForField = (field: TargetFormField) => {
    setCalculatorTargetField(field);
    setIsCalculatorToolOpen(true);
  };

  // Apply calculated value into formData field
  const handleApplyCalculatorResult = (field: TargetFormField, value: string) => {
    if (field) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#EFF2F9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex relative -m-4 sm:-m-6 md:-m-8">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as 'calculator' | 'table')}
        historyCount={history.length}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenFormula={() => setIsFormulaOpen(true)}
        onOpenCalculator={() => {
          setCalculatorTargetField(null);
          setIsCalculatorToolOpen(true);
        }}
        onBackToGarda={onBack}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'lg:pl-72' : 'lg:pl-0'
      }`}>
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full pb-20">
          {/* Header Bar */}
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenFormula={() => setIsFormulaOpen(true)}
            onOpenCalculator={() => {
              setCalculatorTargetField(null);
              setIsCalculatorToolOpen(true);
            }}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
            onBack={onBack}
          />

          {/* Hero Profile / Overview Card */}
          <HeroProfile
            historyCount={history.length}
            onOpenFormula={() => setIsFormulaOpen(true)}
            onLoadPreset={handleLoadPreset}
            onOpenCalculator={() => {
              setCalculatorTargetField(null);
              setIsCalculatorToolOpen(true);
            }}
          />

          {/* Conditional Views based on Tab */}
          {activeTab === 'table' ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-soft border border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B58DE] flex items-center justify-center">
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Tabel Standar Rentang Wajar Rasio NTB (SE2026)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Rentang nilai batas MIN & MAX per Kategori Lapangan Usaha (KBLI) • BPS Kabupaten Mempawah
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('calculator')}
                  className="px-4 py-2 bg-[#5B58DE] text-white rounded-xl text-xs font-bold hover:bg-[#4C49CC] transition self-start sm:self-auto shadow-xs"
                >
                  Kembali ke Kalkulator
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#B45309] text-white font-bold">
                    <tr>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Nama Lapangan Usaha</th>
                      <th className="px-4 py-3 text-center">MIN</th>
                      <th className="px-4 py-3 text-center">MAX</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {KATEGORI_LAPANGAN_USAHA.map((kat, idx) => (
                      <tr 
                        key={kat.kode} 
                        className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}
                      >
                        <td className="px-4 py-3 font-bold text-[#5B58DE]">
                          Kategori {kat.kode}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {kat.nama}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {kat.dianalisis ? formatDecimal(kat.min) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {kat.dianalisis ? formatDecimal(kat.max) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {kat.dianalisis ? (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, kategoriKode: kat.kode }));
                                setActiveTab('calculator');
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-[#5B58DE] hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800 transition"
                            >
                              Gunakan
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Dikecualikan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* All-in-One Dashboard: Form Input (Left) & Floating Result Card (Right) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* Left Column: Form Input */}
              <div className="lg:col-span-7 xl:col-span-8">
                <CalculatorForm
                  formData={formData}
                  setFormData={setFormData}
                  onCalculateAndSave={handleCalculateAndSave}
                  onReset={handleResetForm}
                  onOpenCalculatorForField={handleOpenCalculatorForField}
                />
              </div>

              {/* Right Column: Sticky Floating Result Card */}
              <div className="lg:col-span-5 xl:col-span-4 relative">
                <div className="sticky top-6">
                  <ResultCard 
                    calculationResult={currentCalculation} 
                    onExportCSV={() => exportHistoryToCSV(history)}
                    historyLength={history.length}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Card: History List */}
          <HistoryList
            history={history}
            searchQuery={searchQuery}
            onLoadHistoryItem={handleLoadHistoryItem}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearAllHistory={handleClearAllHistory}
            onExportCSV={() => exportHistoryToCSV(history)}
          />

          {/* Footer branding */}
          <footer className="mt-8 text-center text-xs text-slate-400 py-4">
            <p>Modul Simulasi Perhitungan Nilai Tambah Bruto • BPS Kabupaten Mempawah • SE2026</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Dibuat oleh{' '}
              <a 
                href="https://github.com/ahmadrahman79" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[#5B58DE] font-semibold hover:underline"
              >
                Ahmad Rahman (@ahmadrahman79)
              </a>
            </p>
          </footer>
        </main>
      </div>

      {/* Persistent Floating Desk Lamp in bottom-right corner */}
      <div 
        className="fixed bottom-0 right-3 sm:right-6 pointer-events-none select-none z-30 hidden md:block"
        title="BPS Mempawah"
      >
        <DeskLampIllustration className="w-28 sm:w-32 lg:w-36 h-auto drop-shadow-xl opacity-90 transition-opacity" />
      </div>

      {/* Formula Explanation Modal */}
      <FormulaModal
        isOpen={isFormulaOpen}
        onClose={() => setIsFormulaOpen(false)}
      />

      {/* Dedicated Interactive Calculator Tool Modal */}
      <CalculatorToolModal
        isOpen={isCalculatorToolOpen}
        onClose={() => setIsCalculatorToolOpen(false)}
        targetField={calculatorTargetField}
        initialValue={calculatorTargetField ? formData[calculatorTargetField] : ''}
        kategoriKode={formData.kategoriKode}
        onApplyToField={handleApplyCalculatorResult}
      />
    </div>
  );
};

