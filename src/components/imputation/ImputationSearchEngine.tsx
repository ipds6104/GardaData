import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Search, Bookmark, History, Calculator, ArrowRight, X, AlertCircle, ChevronDown, RotateCcw, Users, Plus, Trash2, CheckCircle, Sparkles } from 'lucide-react';
import { useImputationStore } from '../../store/imputationStore';
import { ImputationData, ImputationType, NilaiImputation, BansosImputation, WajibImputation, WajibTransferImputation } from '../../types/imputation';

const CATEGORIES = ['Semua', 'BPJS', 'BOS', 'MBG', 'Listrik', 'Bansos', 'Wajib Imputasi'];

const formatRupiah = (value: string | number) => {
  if (!value && value !== 0) return '-';
  const str = value.toString();
  return str.replace(/\b(\d+)\b/g, (match) => {
    const num = parseInt(match, 10);
    if (num >= 100) return `Rp ${num.toLocaleString('id-ID')}`;
    return match;
  });
};

interface SimulationItem {
  id: string;
  category: string;
  itemId: string;
  count: string;
}

export const ImputationSearchEngine: React.FC = () => {
  const { data, favorites, toggleFavorite } = useImputationStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  // Multi-item simulation state
  const [simItems, setSimItems] = useState<SimulationItem[]>([
    { id: 'init-1', category: 'BPJS', itemId: '', count: '1' }
  ]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState<string>('');

  // Configure Fuse.js
  const fuse = useMemo(() => new Fuse(data, {
    keys: ['keywordText'],
    threshold: 0.3,
    ignoreLocation: true
  }), [data]);

  // Execute Search
  const results = useMemo(() => {
    let filtered = query ? fuse.search(query).map(r => r.item) : data;
    
    if (activeCategory !== 'Semua') {
      filtered = filtered.filter(item => {
        const kt = item.keywordText.toLowerCase();
        const cat = activeCategory.toLowerCase();
        if (cat === 'wajib imputasi') return item.type === 'WAJIB_IMPUTASI' || item.type === 'WAJIB_TRANSFER';
        if (cat === 'bansos') return item.type === 'BANSOS';
        return kt.includes(cat);
      });
    }
    return filtered.slice(0, 30); // show top 30
  }, [query, activeCategory, fuse, data]);

  // Available options for current tab's simulation
  const currentTabSimOptions = useMemo(() => {
    if (!['BPJS', 'BOS', 'MBG'].includes(activeCategory)) return [];
    return data.filter(item => {
      if (item.type !== 'NILAI_IMPUTASI') return false;
      const kt = (item.keywordText || '').toLowerCase();
      const kat = ((item as NilaiImputation).kategori || '').toLowerCase();
      const cat = activeCategory.toLowerCase();
      return kt.includes(cat) || kat.includes(cat);
    }) as NilaiImputation[];
  }, [data, activeCategory]);

  // Rows for the active tab (or if empty, we ensure at least 1 row ready when user wants to simulate)
  const activeSimRows = useMemo(() => {
    return simItems.filter(item => item.category === activeCategory);
  }, [simItems, activeCategory]);

  const handleAddSimRow = () => {
    const newId = 'sim-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    setSimItems(prev => [...prev, { id: newId, category: activeCategory, itemId: '', count: '1' }]);
    setOpenDropdownId(newId);
    setDropdownSearch('');
  };

  const handleUpdateSimRow = (id: string, field: 'itemId' | 'count', val: string) => {
    setSimItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  const handleDeleteSimRow = (id: string) => {
    setSimItems(prev => prev.filter(item => item.id !== id));
  };

  const handleResetCurrentSim = () => {
    setSimItems(prev => prev.filter(item => item.category !== activeCategory));
  };

  // Grand Total Calculation for active category
  const activeGrandTotal = useMemo(() => {
    let total = 0;
    activeSimRows.forEach(row => {
      if (!row.itemId || !row.count) return;
      const found = data.find(d => d.id === row.itemId) as NilaiImputation;
      if (found) {
        const pend = found.nilaiPendapatan;
        const p = typeof pend === 'string' ? parseFloat(pend.replace(/[^0-9]/g, '')) : (pend || 0);
        total += (Number(row.count) || 0) * (p || 0);
      }
    });
    return total;
  }, [activeSimRows, data]);

  const totalRecipients = useMemo(() => {
    return activeSimRows.reduce((acc, row) => acc + (row.itemId ? (Number(row.count) || 0) : 0), 0);
  }, [activeSimRows]);

  const renderCardContent = (item: ImputationData) => {
    switch (item.type) {
      case 'NILAI_IMPUTASI': {
        const d = item as NilaiImputation;
        return (
          <>
            <div className="flex justify-between items-start mb-4">
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter truncate max-w-[150px]">
                {d.kategori}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-primary-600 transition-colors">
              {d.keterangan}
            </h3>
            <div className="mt-auto space-y-3">
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengeluaran</span>
                 <span className="text-sm font-black text-slate-800">{formatRupiah(d.nilaiPengeluaran)}</span>
               </div>
               <div className="flex flex-col sm:flex-row gap-2">
                 <div className="bg-secondary-50 p-3 rounded-xl border border-secondary-100 flex-1 min-w-0">
                   <p className="text-[9px] font-bold text-secondary-400 uppercase tracking-widest mb-1">OOP</p>
                   <p className="text-xs font-black text-secondary-700 whitespace-normal break-words leading-snug">{formatRupiah(d.nilaiOOP)}</p>
                 </div>
                 <div className="bg-primary-50 p-3 rounded-xl border border-primary-100 flex-1 min-w-0">
                   <p className="text-[9px] font-bold text-primary-400 uppercase tracking-widest mb-1">Pendapatan</p>
                   <p className="text-xs font-black text-primary-700 whitespace-normal break-words leading-snug">{formatRupiah(d.nilaiPendapatan)}</p>
                 </div>
               </div>
            </div>
          </>
        );
      }
      case 'BANSOS': {
        const d = item as BansosImputation;
        return (
          <>
            <div className="flex justify-between items-start mb-4">
              <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                {d.jenisBantuan}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 group-hover:text-purple-600 transition-colors">
              {d.pengelompokanJenisBantuan}
            </h3>
            <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nilai Bantuan</p>
                 <p className="text-sm font-black text-purple-700">{formatRupiah(d.nilai)}</p>
               </div>
               <div className="bg-slate-50 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 border border-slate-100">
                 Periode: <strong>{d.periodePenerimaan}</strong>
               </div>
            </div>
          </>
        );
      }
      case 'WAJIB_IMPUTASI': {
        const d = item as WajibImputation;
        return (
          <>
            <div className="flex justify-between items-start mb-4">
              <span className="bg-slate-800 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                Blok V - {d.kuesioner}
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 leading-tight mb-2 group-hover:text-primary-600 transition-colors">
              {d.keterangan}
            </h3>
            <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
               <div className="flex gap-2 items-center">
                 <AlertCircle className="w-4 h-4 text-secondary-500 shrink-0" />
                 <span className="text-xs font-bold text-secondary-700">{d.rincianPertanyaan}</span>
               </div>
               <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sumber Pendanaan</p>
                 <p className="text-[10px] font-medium text-slate-600 leading-snug">{d.sumberPendanaan}</p>
               </div>
            </div>
          </>
        );
      }
      case 'WAJIB_TRANSFER': {
        const d = item as WajibTransferImputation;
        return (
          <>
            <div className="flex justify-between items-start mb-4">
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                Transfer - {d.penerimaan}
              </span>
            </div>
            <div className="space-y-4 mt-auto">
               <div className="bg-secondary-50 p-3 rounded-xl border border-secondary-100">
                 <p className="text-[10px] font-black text-secondary-600 uppercase tracking-widest mb-2 border-b border-secondary-100 pb-1">Diterima</p>
                 <div className="space-y-1">
                   <p className="text-xs font-medium text-secondary-800"><span className="font-bold">Uang:</span> {formatRupiah(d.transferDiterimaUang)}</p>
                   <p className="text-xs font-medium text-secondary-800"><span className="font-bold">Brg:</span> {formatRupiah(d.transferDiterimaBarang)}</p>
                 </div>
               </div>
               <div className="bg-primary-50 p-3 rounded-xl border border-primary-100">
                 <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2 border-b border-primary-100 pb-1">Dibayar</p>
                 <div className="space-y-1">
                   <p className="text-xs font-medium text-primary-800"><span className="font-bold">Uang:</span> {formatRupiah(d.transferDibayarUang)}</p>
                   <p className="text-xs font-medium text-primary-800"><span className="font-bold">Brg:</span> {formatRupiah(d.transferDibayarBarang)}</p>
                 </div>
               </div>
            </div>
          </>
        );
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24">
      {/* Hero Search Area */}
      <div className="text-center space-y-8">
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
          Cari <span className="text-primary-500">Imputasi</span>
        </h1>
        <div className="relative max-w-3xl mx-auto group">
          <div className="absolute inset-0 bg-primary-500 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative bg-white border-2 border-slate-100 rounded-[2rem] p-4 flex items-center shadow-lg focus-within:border-primary-500 transition-colors">
            <Search className="w-8 h-8 text-primary-500 ml-4 shrink-0" />
              <input
              type="text"
              className="w-full bg-transparent px-6 py-4 text-xl font-bold text-slate-900 outline-none placeholder:text-slate-300 placeholder:font-medium"
              placeholder="Cari rubini, listrik, pkh, wajib imputasi..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-4 text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3 w-full justify-start sm:justify-center scrollbar-none snap-x whitespace-nowrap px-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border shrink-0 snap-align-start ${
                activeCategory === cat 
                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full">
        {/* Results Grid */}
        <div className="w-full min-w-0 pb-12">
          
          {/* Multi-Item Simulation Box (Modern Vibrant Emerald Green Theme) */}
          {['BPJS', 'BOS', 'MBG'].includes(activeCategory) && (
            <div className="bg-gradient-to-br from-emerald-500/5 via-white to-teal-500/5 rounded-3xl p-5 sm:p-7 mb-8 border-2 border-emerald-500/20 shadow-xl shadow-emerald-500/5 space-y-6">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-100/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl shadow-md shadow-emerald-500/20 shrink-0">
                    <Calculator className="w-5 h-5"/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-slate-900 font-extrabold text-base sm:text-lg">Simulasi Imputasi {activeCategory}</h3>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {activeCategory}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
                      Tambahkan jenis imputasi dalam 1 Rumah Tangga untuk menghitung akumulasi total.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={handleAddSimRow}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Jenis
                  </button>
                  {activeSimRows.length > 0 && (
                    <button
                      onClick={handleResetCurrentSim}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl text-xs font-bold transition-colors border border-slate-200"
                      title="Reset simulasi kategori ini"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Rows List */}
              <div className="space-y-3">
                {activeSimRows.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-emerald-200/60 rounded-2xl bg-white/60">
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mb-3">Belum ada item simulasi untuk tab {activeCategory}.</p>
                    <button
                      onClick={handleAddSimRow}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all border border-emerald-200"
                    >
                      <Plus className="w-4 h-4" /> Mulai Simulasi {activeCategory}
                    </button>
                  </div>
                ) : (
                  activeSimRows.map((row, idx) => {
                    const selectedItem = data.find(d => d.id === row.itemId) as NilaiImputation | undefined;
                    const pend = selectedItem?.nilaiPendapatan;
                    const unitPrice = typeof pend === 'string' ? (parseFloat(pend.replace(/[^0-9]/g, '')) || 0) : (pend || 0);
                    const subtotal = (Number(row.count) || 0) * unitPrice;
                    const isDropdownOpen = openDropdownId === row.id;

                    return (
                      <div 
                        key={row.id} 
                        className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm hover:border-emerald-300 transition-all flex flex-col md:flex-row items-stretch md:items-center gap-3"
                      >
                        {/* Row Number Badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-400 md:hidden uppercase tracking-wider">Item Imputasi</span>
                        </div>

                        {/* Dropdown for item selection */}
                        <div className="relative flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (isDropdownOpen) {
                                setOpenDropdownId(null);
                              } else {
                                setOpenDropdownId(row.id);
                                setDropdownSearch('');
                              }
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all outline-none text-left ${
                              isDropdownOpen 
                                ? 'bg-white border-emerald-500 ring-4 ring-emerald-500/20' 
                                : 'bg-slate-50/80 border-slate-200 hover:bg-slate-50'
                            } ${selectedItem ? 'text-slate-900 font-bold' : 'text-slate-400'}`}
                          >
                            <span className="truncate">
                              {selectedItem ? selectedItem.keterangan : `Pilih Jenis ${activeCategory}...`}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-emerald-600 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Dropdown Menu */}
                          {isDropdownOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-emerald-200 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                              <div className="p-2 border-b border-slate-100 bg-emerald-50/40">
                                <input
                                  type="text"
                                  value={dropdownSearch}
                                  onChange={e => setDropdownSearch(e.target.value)}
                                  placeholder="Ketik untuk mencari jenis..."
                                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-emerald-200 outline-none font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/30"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                                {currentTabSimOptions
                                  .filter(opt => (opt.keterangan || '').toLowerCase().includes(dropdownSearch.toLowerCase()))
                                  .map(opt => {
                                    const optPend = opt.nilaiPendapatan;
                                    const optPrice = typeof optPend === 'string' ? (parseFloat(optPend.replace(/[^0-9]/g, '')) || 0) : (optPend || 0);

                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateSimRow(row.id, 'itemId', opt.id);
                                          setOpenDropdownId(null);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between gap-2 ${
                                          row.itemId === opt.id
                                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                                            : 'text-slate-700 hover:bg-emerald-50/50'
                                        }`}
                                      >
                                        <span className="truncate">{opt.keterangan}</span>
                                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md shrink-0">
                                          {formatRupiah(optPrice)}/org
                                        </span>
                                      </button>
                                    );
                                  })
                                }
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Count Input */}
                        <div className="flex items-center gap-2 md:w-36 shrink-0">
                          <div className="relative w-full">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <input
                              type="number"
                              value={row.count}
                              onChange={(e) => handleUpdateSimRow(row.id, 'count', e.target.value)}
                              placeholder="Jml Orang"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-800 transition-all outline-none text-xs sm:text-sm text-center"
                              min="0"
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 shrink-0">org</span>
                        </div>

                        {/* Subtotal Display */}
                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl px-4 py-2 flex items-center justify-between md:justify-end gap-3 md:min-w-[140px] shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase md:hidden">Subtotal:</span>
                          <span className="text-xs sm:text-sm font-black text-emerald-700">
                            {formatRupiah(subtotal)}
                          </span>
                        </div>

                        {/* Delete Row Button */}
                        <button
                          onClick={() => handleDeleteSimRow(row.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end md:self-center shrink-0"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Grand Total Summary Card */}
              {activeSimRows.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-emerald-600/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                      <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-100">
                        Total Estimasi Imputasi {activeCategory}
                      </p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {formatRupiah(activeGrandTotal)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">Total Penerima</p>
                      <p className="text-sm sm:text-base font-black text-white">{totalRecipients} Orang</p>
                    </div>
                    <div className="h-6 w-px bg-white/20" />
                    <div className="text-left">
                      <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">Jenis Dipilih</p>
                      <p className="text-sm sm:text-base font-black text-white">
                        {activeSimRows.filter(r => r.itemId).length} Jenis
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {results.length > 0 ? (
            activeCategory === 'Wajib Imputasi' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Wajib Imputasi Grouped */}
                {Object.entries(
                  results
                    .filter(r => r.type === 'WAJIB_IMPUTASI')
                    .reduce((acc, item) => {
                      const d = item as WajibImputation;
                      if (!acc[d.kategori]) acc[d.kategori] = [];
                      acc[d.kategori].push(d);
                      return acc;
                    }, {} as Record<string, WajibImputation[]>)
                ).map(([kategori, items]) => (
                  <div key={kategori} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40">
                    <div className="bg-slate-800 px-6 py-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary-400"></div>
                      <h3 className="font-black text-white uppercase tracking-widest text-sm">{kategori}</h3>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50">
                      {(items as WajibImputation[]).map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-50 pb-2">
                            <span className="bg-slate-800 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0">
                              Kuesioner: {item.kuesioner}
                            </span>
                            <span className="text-xs font-black text-secondary-600 bg-secondary-50 px-2.5 py-1 rounded-lg border border-secondary-100">
                              {item.rincianPertanyaan}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan / Panduan</p>
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.keterangan}</p>
                          </div>
                          {item.sumberPendanaan && (
                            <div className="bg-primary-50/50 p-3 rounded-xl border border-primary-100/50 space-y-0.5">
                              <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest">Sumber Pendanaan Imputasi</p>
                              <p className="text-[11px] font-bold text-primary-700 leading-relaxed">{item.sumberPendanaan}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Wajib Transfer Grouped */}
                {(() => {
                  const transferItems = results.filter(r => r.type === 'WAJIB_TRANSFER') as WajibTransferImputation[];
                  if (transferItems.length === 0) return null;
                  
                  return (
                    <div className="bg-white rounded-[2rem] border border-primary-200 overflow-hidden shadow-xl shadow-primary-100/40 mt-8">
                      <div className="bg-primary-600 px-6 py-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        <h3 className="font-black text-white uppercase tracking-widest text-sm">Wajib Transfer</h3>
                      </div>
                      <div className="p-4 sm:p-6 space-y-4 bg-slate-50/50">
                        {transferItems.map(item => (
                          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                              <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                                Penerimaan: {item.penerimaan}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-secondary-50 p-3 rounded-xl border border-secondary-100">
                                <p className="text-[9px] font-black text-secondary-500 uppercase tracking-widest mb-1.5">Transfer Diterima</p>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-slate-700">
                                    <strong className="font-extrabold text-secondary-700">Uang:</strong> {formatRupiah(item.transferDiterimaUang)}
                                  </p>
                                  <p className="text-xs font-medium text-slate-700">
                                    <strong className="font-extrabold text-secondary-700">Barang/Jasa:</strong> {formatRupiah(item.transferDiterimaBarang)}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-primary-50 p-3 rounded-xl border border-primary-100">
                                <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-1.5">Transfer Dibayar</p>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-slate-700">
                                    <strong className="font-extrabold text-primary-700">Uang:</strong> {formatRupiah(item.transferDibayarUang)}
                                  </p>
                                  <p className="text-xs font-medium text-slate-700">
                                    <strong className="font-extrabold text-primary-700">Barang/Jasa:</strong> {formatRupiah(item.transferDibayarBarang)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {results.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-slate-300 hover:shadow-xl transition-all group flex flex-col relative">
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} className="absolute top-6 right-6 text-slate-300 hover:text-secondary-500 transition-colors z-10">
                      <Bookmark className={`w-5 h-5 ${favorites.includes(item.id) ? 'fill-secondary-500 text-secondary-500' : ''}`} />
                    </button>
                    {renderCardContent(item)}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-[3rem]">
              <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Tidak ditemukan</h3>
              <p className="text-slate-500">Coba gunakan kata kunci lain untuk mencari panduan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
