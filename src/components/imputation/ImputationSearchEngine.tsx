import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Search, Bookmark, History, Calculator, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useImputationStore } from '../../store/imputationStore';
import { ImputationData, ImputationType, NilaiImputation, BansosImputation, WajibImputation, WajibTransferImputation } from '../../types/imputation';

const CATEGORIES = ['Semua', 'BPJS', 'BOS', 'MBG', 'Listrik', 'Bansos', 'Wajib Imputasi'];

const formatRupiah = (value: string) => {
  if (!value) return '-';
  return value.replace(/\b(\d+)\b/g, (match) => {
    const num = parseInt(match, 10);
    if (num >= 100) return `Rp ${num.toLocaleString('id-ID')}`;
    return match;
  });
};

export const ImputationSearchEngine: React.FC = () => {
  const { data, favorites, toggleFavorite } = useImputationStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

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

  // handleSearchCommit is not used since recent searches were removed per user request

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
               <div className="flex gap-2">
                 <div className="bg-secondary-50 p-2 rounded-xl border border-secondary-100 flex-1">
                   <p className="text-[9px] font-bold text-secondary-400 uppercase tracking-widest mb-1">OOP</p>
                   <p className="text-xs font-black text-secondary-700 truncate">{formatRupiah(d.nilaiOOP)}</p>
                 </div>
                 <div className="bg-primary-50 p-2 rounded-xl border border-primary-100 flex-1">
                   <p className="text-[9px] font-bold text-primary-400 uppercase tracking-widest mb-1">Pendapatan</p>
                   <p className="text-xs font-black text-primary-700 truncate">{formatRupiah(d.nilaiPendapatan)}</p>
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
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Recent & Favs */}
        <div className="lg:col-span-1 space-y-8 hidden lg:block">
          {/* Recent searches removed per user request */}
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-3 w-full min-w-0 overflow-hidden">
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
              <div className="grid sm:grid-cols-2 gap-4">
                {results.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-slate-300 hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden">
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
