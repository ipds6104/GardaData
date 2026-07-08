import React, { useState } from 'react';
import { Save, Edit2, X, Plus, Database, AlertCircle, Trash2, Search } from 'lucide-react';
import { useImputationStore } from '../../store/imputationStore';
import { batchUpsertImputationData } from '../../services/imputationService';
import { ImputationData, ImputationType, NilaiImputation, BansosImputation, WajibImputation, WajibTransferImputation } from '../../types/imputation';

type TabType = 'NILAI_IMPUTASI' | 'BANSOS' | 'WAJIB_IMPUTASI' | 'WAJIB_TRANSFER';

export const ImputationAdminDashboard: React.FC = () => {
  const { data, setData } = useImputationStore();
  const [activeTab, setActiveTab] = useState<TabType>('NILAI_IMPUTASI');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ImputationData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [popupItem, setPopupItem] = useState<ImputationData | null>(null);

  const generateKeywordText = (item: ImputationData) => {
    switch(item.type) {
      case 'NILAI_IMPUTASI': return `${(item as NilaiImputation).kategori} ${(item as NilaiImputation).keterangan}`;
      case 'BANSOS': return `${(item as BansosImputation).jenisBantuan} ${(item as BansosImputation).pengelompokanJenisBantuan} bansos pkh bpnt`;
      case 'WAJIB_IMPUTASI': return `Blok V wajib imputasi ${(item as WajibImputation).kategori} ${(item as WajibImputation).kuesioner} ${(item as WajibImputation).rincianPertanyaan} ${(item as WajibImputation).keterangan}`;
      case 'WAJIB_TRANSFER': return `Blok V wajib transfer ${(item as WajibTransferImputation).penerimaan} ${(item as WajibTransferImputation).transferDiterimaUang} ${(item as WajibTransferImputation).transferDiterimaBarang}`;
      default: return '';
    }
  };

  const filteredData = data.filter(d => {
    if (d.type !== activeTab) return false;
    if (!searchQuery) return true;
    return generateKeywordText(d).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const startEdit = (item: ImputationData) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const cancelEdit = () => {
    if (editingId?.startsWith('new_')) {
      setData(data.filter(d => d.id !== editingId));
    }
    setEditingId(null);
    setEditForm({});
  };

  const openPopup = (item: ImputationData) => {
    setPopupItem(item);
    setEditForm(item);
  };

  const closePopup = () => {
    setPopupItem(null);
    setEditForm({});
  };

  const handleAddNew = () => {
    const newId = `new_${Date.now()}`;
    const newItem: Partial<ImputationData> = {
      id: newId,
      type: activeTab,
      aktif: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      keywordText: ''
    };
    
    if (activeTab === 'NILAI_IMPUTASI') {
      Object.assign(newItem, { kategori: 'Kategori Baru', keterangan: '', nilaiPengeluaran: '', nilaiOOP: '', nilaiPendapatan: '', sumberPendapatan: '' });
    } else if (activeTab === 'BANSOS') {
      Object.assign(newItem, { jenisBantuan: 'Jenis Baru', pengelompokanJenisBantuan: '', nilai: '', periodePenerimaan: '' });
    } else if (activeTab === 'WAJIB_IMPUTASI') {
      Object.assign(newItem, { kategori: 'Kategori Baru', kuesioner: 'KP', rincianPertanyaan: '', keterangan: '', sumberPendanaan: '' });
    } else if (activeTab === 'WAJIB_TRANSFER') {
      Object.assign(newItem, { penerimaan: 'Penerimaan Baru', transferDiterimaUang: '', transferDiterimaBarang: '', transferDibayarUang: '', transferDibayarBarang: '' });
    }

    setData([newItem as ImputationData, ...data]);
    setEditingId(newId);
    setEditForm(newItem as ImputationData);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const updatedItem = {
        ...editForm,
        updatedAt: Date.now(),
        keywordText: generateKeywordText(editForm as ImputationData)
      } as ImputationData;

      await batchUpsertImputationData([updatedItem]);
      
      // If it's a new item, the ID remains new_... which is fine, but we just update the data array.
      // Since we already prepended it in handleAddNew, we just need to map the updated form over it.
      const newData = data.map(d => d.id === updatedItem.id ? updatedItem : d);
      setData(newData);

      setMessage({ type: 'success', text: 'Data berhasil disimpan!' });
      setEditingId(null);
      setPopupItem(null);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Gagal menyimpan: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const renderPopupFormFields = () => {
    if (!popupItem) return null;
    const type = popupItem.type;

    if (type === 'NILAI_IMPUTASI') {
      return (
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-slate-500">Kategori</label><input className="w-full border p-2 rounded" value={(editForm as NilaiImputation).kategori || ''} onChange={e => setEditForm({...editForm, kategori: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Keterangan</label><input className="w-full border p-2 rounded" value={(editForm as NilaiImputation).keterangan || ''} onChange={e => setEditForm({...editForm, keterangan: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Nilai Pengeluaran</label><input className="w-full border p-2 rounded" value={(editForm as NilaiImputation).nilaiPengeluaran || ''} onChange={e => setEditForm({...editForm, nilaiPengeluaran: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Nilai OOP</label><input className="w-full border p-2 rounded" value={(editForm as NilaiImputation).nilaiOOP || ''} onChange={e => setEditForm({...editForm, nilaiOOP: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Nilai Pendapatan</label><input className="w-full border p-2 rounded" value={(editForm as NilaiImputation).nilaiPendapatan || ''} onChange={e => setEditForm({...editForm, nilaiPendapatan: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Sumber Pendapatan</label><input className="w-full border p-2 rounded" value={(editForm as NilaiImputation).sumberPendapatan || ''} onChange={e => setEditForm({...editForm, sumberPendapatan: e.target.value})} /></div>
        </div>
      );
    } else if (type === 'BANSOS') {
      return (
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-slate-500">Jenis Bantuan</label><input className="w-full border p-2 rounded" value={(editForm as BansosImputation).jenisBantuan || ''} onChange={e => setEditForm({...editForm, jenisBantuan: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Pengelompokan Jenis Bantuan</label><input className="w-full border p-2 rounded" value={(editForm as BansosImputation).pengelompokanJenisBantuan || ''} onChange={e => setEditForm({...editForm, pengelompokanJenisBantuan: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Nilai</label><input className="w-full border p-2 rounded" value={(editForm as BansosImputation).nilai || ''} onChange={e => setEditForm({...editForm, nilai: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Periode Penerimaan</label><input className="w-full border p-2 rounded" value={(editForm as BansosImputation).periodePenerimaan || ''} onChange={e => setEditForm({...editForm, periodePenerimaan: e.target.value})} /></div>
        </div>
      );
    } else if (type === 'WAJIB_IMPUTASI') {
      return (
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-slate-500">Kategori</label><input className="w-full border p-2 rounded" value={(editForm as WajibImputation).kategori || ''} onChange={e => setEditForm({...editForm, kategori: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Kuesioner</label><input className="w-full border p-2 rounded" value={(editForm as WajibImputation).kuesioner || ''} onChange={e => setEditForm({...editForm, kuesioner: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Rincian Pertanyaan</label><input className="w-full border p-2 rounded" value={(editForm as WajibImputation).rincianPertanyaan || ''} onChange={e => setEditForm({...editForm, rincianPertanyaan: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Keterangan</label><input className="w-full border p-2 rounded" value={(editForm as WajibImputation).keterangan || ''} onChange={e => setEditForm({...editForm, keterangan: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Sumber Pendanaan</label><input className="w-full border p-2 rounded" value={(editForm as WajibImputation).sumberPendanaan || ''} onChange={e => setEditForm({...editForm, sumberPendanaan: e.target.value})} /></div>
        </div>
      );
    } else if (type === 'WAJIB_TRANSFER') {
      return (
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-slate-500">Penerimaan</label><input className="w-full border p-2 rounded" value={(editForm as WajibTransferImputation).penerimaan || ''} onChange={e => setEditForm({...editForm, penerimaan: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Transfer Diterima (Uang)</label><input className="w-full border p-2 rounded" value={(editForm as WajibTransferImputation).transferDiterimaUang || ''} onChange={e => setEditForm({...editForm, transferDiterimaUang: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Transfer Diterima (Barang/Jasa)</label><input className="w-full border p-2 rounded" value={(editForm as WajibTransferImputation).transferDiterimaBarang || ''} onChange={e => setEditForm({...editForm, transferDiterimaBarang: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Transfer Dibayar (Uang)</label><input className="w-full border p-2 rounded" value={(editForm as WajibTransferImputation).transferDibayarUang || ''} onChange={e => setEditForm({...editForm, transferDibayarUang: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-slate-500">Transfer Dibayar (Barang/Jasa)</label><input className="w-full border p-2 rounded" value={(editForm as WajibTransferImputation).transferDibayarBarang || ''} onChange={e => setEditForm({...editForm, transferDibayarBarang: e.target.value})} /></div>
        </div>
      );
    }
    return null;
  };



  const renderNilaiTable = () => (
    <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black text-[10px] sticky top-0 z-10 shadow-sm border-b border-slate-200">
          <tr>
            <th className="p-4">Aksi</th>
            <th className="p-4">Kategori</th>
            <th className="p-4">Keterangan</th>
            <th className="p-4">Nilai Pengeluaran</th>
            <th className="p-4">Nilai OOP</th>
            <th className="p-4">Nilai Pendapatan</th>
            <th className="p-4">Sumber Pendapatan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredData.map((row) => {
            const item = row as NilaiImputation;
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => !isEditing && openPopup(item)}>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={isSaving} className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"><Save className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(item)} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-primary-600 hover:border-primary-200 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                  )}
                </td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as NilaiImputation).kategori || ''} onChange={e => setEditForm({...editForm, kategori: e.target.value})} /> : <span className="font-bold text-slate-700">{item.kategori}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as NilaiImputation).keterangan || ''} onChange={e => setEditForm({...editForm, keterangan: e.target.value})} /> : item.keterangan}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as NilaiImputation).nilaiPengeluaran || ''} onChange={e => setEditForm({...editForm, nilaiPengeluaran: e.target.value})} /> : <span className="text-secondary-600 font-bold bg-secondary-50 px-2 py-1 rounded">{item.nilaiPengeluaran}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as NilaiImputation).nilaiOOP || ''} onChange={e => setEditForm({...editForm, nilaiOOP: e.target.value})} /> : item.nilaiOOP}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as NilaiImputation).nilaiPendapatan || ''} onChange={e => setEditForm({...editForm, nilaiPendapatan: e.target.value})} /> : item.nilaiPendapatan}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as NilaiImputation).sumberPendapatan || ''} onChange={e => setEditForm({...editForm, sumberPendapatan: e.target.value})} /> : <span className="text-xs text-slate-500 truncate max-w-[200px] block">{item.sumberPendapatan}</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderBansosTable = () => (
    <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black text-[10px] sticky top-0 z-10 shadow-sm border-b border-slate-200">
          <tr>
            <th className="p-4">Aksi</th>
            <th className="p-4">Jenis Bantuan</th>
            <th className="p-4">Pengelompokan</th>
            <th className="p-4">Nilai</th>
            <th className="p-4">Periode Penerimaan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredData.map((row) => {
            const item = row as BansosImputation;
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => !isEditing && openPopup(item)}>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={isSaving} className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"><Save className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(item)} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-primary-600 hover:border-primary-200 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                  )}
                </td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as BansosImputation).jenisBantuan || ''} onChange={e => setEditForm({...editForm, jenisBantuan: e.target.value})} /> : <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{item.jenisBantuan}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as BansosImputation).pengelompokanJenisBantuan || ''} onChange={e => setEditForm({...editForm, pengelompokanJenisBantuan: e.target.value})} /> : <span className="font-medium text-slate-600">{item.pengelompokanJenisBantuan}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as BansosImputation).nilai || ''} onChange={e => setEditForm({...editForm, nilai: e.target.value})} /> : <span className="text-secondary-600 font-bold bg-secondary-50 px-2 py-1 rounded">{item.nilai}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as BansosImputation).periodePenerimaan || ''} onChange={e => setEditForm({...editForm, periodePenerimaan: e.target.value})} /> : <span className="text-xs text-slate-500">{item.periodePenerimaan}</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderWajibImpTable = () => (
    <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black text-[10px] sticky top-0 z-10 shadow-sm border-b border-slate-200">
          <tr>
            <th className="p-4">Aksi</th>
            <th className="p-4">Kategori</th>
            <th className="p-4">Kuesioner</th>
            <th className="p-4">Rincian Pertanyaan</th>
            <th className="p-4">Keterangan</th>
            <th className="p-4">Sumber Pendanaan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredData.map((row) => {
            const item = row as WajibImputation;
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => !isEditing && openPopup(item)}>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={isSaving} className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"><Save className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(item)} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-primary-600 hover:border-primary-200 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                  )}
                </td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibImputation).kategori || ''} onChange={e => setEditForm({...editForm, kategori: e.target.value})} /> : <span className="font-bold text-slate-700">{item.kategori}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibImputation).kuesioner || ''} onChange={e => setEditForm({...editForm, kuesioner: e.target.value})} /> : <span className="bg-slate-800 text-white px-2 py-1 rounded text-xs font-black">{item.kuesioner}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibImputation).rincianPertanyaan || ''} onChange={e => setEditForm({...editForm, rincianPertanyaan: e.target.value})} /> : <span className="text-secondary-600 font-bold">{item.rincianPertanyaan}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibImputation).keterangan || ''} onChange={e => setEditForm({...editForm, keterangan: e.target.value})} /> : item.keterangan}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibImputation).sumberPendanaan || ''} onChange={e => setEditForm({...editForm, sumberPendanaan: e.target.value})} /> : <span className="text-xs text-slate-500 truncate max-w-[200px] block">{item.sumberPendanaan}</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderWajibTransTable = () => (
    <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-black text-[10px] sticky top-0 z-10 shadow-sm border-b border-slate-200">
          <tr>
            <th className="p-4">Aksi</th>
            <th className="p-4">Penerimaan</th>
            <th className="p-4">Diterima (Uang)</th>
            <th className="p-4">Diterima (Barang/Jasa)</th>
            <th className="p-4">Dibayar (Uang)</th>
            <th className="p-4">Dibayar (Barang/Jasa)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredData.map((row) => {
            const item = row as WajibTransferImputation;
            const isEditing = editingId === item.id;
            return (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => !isEditing && openPopup(item)}>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={isSaving} className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"><Save className="w-4 h-4" /></button>
                      <button onClick={cancelEdit} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(item)} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-primary-600 hover:border-primary-200 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                  )}
                </td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibTransferImputation).penerimaan || ''} onChange={e => setEditForm({...editForm, penerimaan: e.target.value})} /> : <span className="font-bold text-slate-700">{item.penerimaan}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibTransferImputation).transferDiterimaUang || ''} onChange={e => setEditForm({...editForm, transferDiterimaUang: e.target.value})} /> : <span className="text-secondary-600 font-medium bg-secondary-50 px-2 py-1 rounded truncate max-w-[200px] block">{item.transferDiterimaUang}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibTransferImputation).transferDiterimaBarang || ''} onChange={e => setEditForm({...editForm, transferDiterimaBarang: e.target.value})} /> : <span className="text-secondary-600 font-medium bg-secondary-50 px-2 py-1 rounded truncate max-w-[200px] block">{item.transferDiterimaBarang}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibTransferImputation).transferDibayarUang || ''} onChange={e => setEditForm({...editForm, transferDibayarUang: e.target.value})} /> : <span className="text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded truncate max-w-[200px] block">{item.transferDibayarUang}</span>}</td>
                <td className="p-4">{isEditing ? <input className="border rounded p-1 w-full text-xs" value={(editForm as WajibTransferImputation).transferDibayarBarang || ''} onChange={e => setEditForm({...editForm, transferDibayarBarang: e.target.value})} /> : <span className="text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded truncate max-w-[200px] block">{item.transferDibayarBarang}</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 lg:p-10 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Manajemen Data</h2>
          <p className="text-slate-500 font-medium">Ubah referensi data imputasi secara langsung.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-secondary-50 text-secondary-700' : 'bg-red-50 text-red-700'}`}>
          <AlertCircle className="w-5 h-5" />
          <p className="font-bold text-sm">{message.text}</p>
        </div>
      )}

      {/* TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {[
          { id: 'NILAI_IMPUTASI', label: 'Nilai Imputasi' },
          { id: 'BANSOS', label: 'Bantuan Sosial' },
          { id: 'WAJIB_IMPUTASI', label: 'Wajib Imputasi (V)' },
          { id: 'WAJIB_TRANSFER', label: 'Wajib Transfer (V)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-200' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <Database className="w-5 h-5 text-slate-400" />
             <h3 className="font-bold text-slate-700 uppercase tracking-widest text-sm whitespace-nowrap">
               Tabel {activeTab.replace('_', ' ')}
             </h3>
           </div>
           
           <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Pencarian cepat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all shadow-sm"
              />
           </div>

           <div className="flex items-center gap-3">
             <div className="text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm whitespace-nowrap">
               {filteredData.length} Baris
             </div>
             <button
               onClick={handleAddNew}
               className="flex items-center gap-1 bg-secondary-500 hover:bg-secondary-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-md transition-colors whitespace-nowrap"
             >
               <Plus className="w-4 h-4" /> Tambah
             </button>
           </div>
        </div>

        {activeTab === 'NILAI_IMPUTASI' && renderNilaiTable()}
        {activeTab === 'BANSOS' && renderBansosTable()}
        {activeTab === 'WAJIB_IMPUTASI' && renderWajibImpTable()}
        {activeTab === 'WAJIB_TRANSFER' && renderWajibTransTable()}
      </div>

      {popupItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-800">Edit Data Imputasi</h3>
                <p className="text-slate-500 text-sm">Sesuaikan detail baris secara mendalam.</p>
              </div>
              <button onClick={closePopup} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              {renderPopupFormFields()}
            </div>
            
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={closePopup}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200 transition-colors flex items-center gap-2"
              >
                {isSaving ? 'Menyimpan...' : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
