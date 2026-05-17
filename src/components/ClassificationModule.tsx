import React, { useState, useEffect } from 'react';
import { Search, Download, Upload, Loader2, AlertCircle, CheckCircle2, ChevronLeft, Info, FileSpreadsheet, Briefcase, Boxes, Factory } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit, serverTimestamp, writeBatch, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { OperationType, handleFirestoreError } from '../lib/errorUtils';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface ClassificationEntry {
  id: string;
  mjj_occtle: string;
  mjj_occmtd: string;
  mjj_bidang: string;
  mjj_kbji_label: string;
  mjj_kbli_label: string;
  createdAt: any;
}

interface ClassificationModuleProps {
  onBack: () => void;
}

export const ClassificationModule: React.FC<ClassificationModuleProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'manage'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ClassificationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [manualForm, setManualForm] = useState({
    mjj_occtle: '',
    mjj_occmtd: '',
    mjj_bidang: '',
    mjj_kbji_label: '',
    mjj_kbli_label: ''
  });
  const [savingManual, setSavingManual] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') return;
    if (!manualForm.mjj_occtle || !manualForm.mjj_kbji_label) {
      setMessage({ type: 'error', text: 'Kegiatan Pekerjaan dan Kode KBJI wajib diisi.' });
      return;
    }

    setSavingManual(true);
    setMessage(null);

    try {
      const docIdStr = `${manualForm.mjj_occtle}-${manualForm.mjj_kbji_label}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newDocRef = doc(collection(db, 'classifications'), docIdStr);
      
      await setDoc(newDocRef, {
        mjj_occtle: manualForm.mjj_occtle.toUpperCase(),
        mjj_occmtd: manualForm.mjj_occmtd.toUpperCase(),
        mjj_bidang: manualForm.mjj_bidang.toUpperCase(),
        mjj_kbji_label: manualForm.mjj_kbji_label.toUpperCase(),
        mjj_kbli_label: manualForm.mjj_kbli_label.toUpperCase(),
        updatedAt: serverTimestamp(),
        updatedBy: user.username
      }, { merge: true });

      setMessage({ type: 'success', text: 'Data KBLI/KBJI berhasil ditambahkan secara manual.' });
      setManualForm({ mjj_occtle: '', mjj_occmtd: '', mjj_bidang: '', mjj_kbji_label: '', mjj_kbli_label: '' });
      handleSearch();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Gagal menyimpan data: ${err.message}` });
    } finally {
      setSavingManual(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const classRef = collection(db, 'classifications');
      const q = query(classRef, orderBy('createdAt', 'desc'), limit(1000));
      const snapshot = await getDocs(q);
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClassificationEntry[];
      
      const tokens = searchQuery.toLowerCase().split(' ').filter(Boolean);

      const filtered = all.filter(entry => {
        const combinedText = [
          entry.mjj_occtle,
          entry.mjj_occmtd,
          entry.mjj_bidang,
          entry.mjj_kbji_label,
          entry.mjj_kbli_label
        ].filter(Boolean).join(' ').toLowerCase();
        
        return tokens.length === 0 || tokens.every(t => combinedText.includes(t));
      });
      
      // Deduplikasi hasil pencarian untuk membersihkan data lama yang ganda di UI
      const uniqueResults = [];
      const seenKeys = new Set();
      
      for (const item of filtered) {
        const key = `${item.mjj_occtle}|${item.mjj_kbji_label}|${item.mjj_kbli_label}`.toLowerCase();
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueResults.push(item);
        }
      }
      
      setResults(uniqueResults);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'classifications', { currentUser: { uid: user?.username } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const downloadTemplate = () => {
    const templateData = [
      { 
        mjj_occtle: 'KARYAWAN KAFE', 
        mjj_occmtd: 'MAKANAN DAN MINUMAN', 
        mjj_bidang: 'PENYEDIA MAKANAN DAN MINUMAN',
        mjj_kbji_label: '[5131] PRAMUSAJI',
        mjj_kbli_label: '[56303] AKTIVITAS RUMAH MINUM/KAFE'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `Template_Navigasi_KBLI_KBJI.xlsx`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || user.role !== 'admin') return;

    setUploading(true);
    setMessage(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        let data: any[] = [];
        
        // 1. Excel Parsing Phase
        try {
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          data = XLSX.utils.sheet_to_json(ws) as any[];

          if (!data || data.length === 0) {
            throw new Error('File Excel kosong.');
          }

          const firstRow = data[0];
          if (!('mjj_occtle' in firstRow) || !('mjj_kbji_label' in firstRow)) {
            throw new Error('Kolom mjj_occtle atau mjj_kbji_label tidak ditemukan.');
          }
        } catch (excelErr: any) {
          setMessage({ 
            type: 'error', 
            text: `Format file tidak sesuai atau kolom yang diperlukan hilang. Pastikan anda menggunakan template Excel yang benar. (${excelErr.message})` 
          });
          setUploading(false);
          return;
        }

        // 2. Database Write Phase
        const batchSize = 100;
        let count = 0;
        
        try {
          for (let i = 0; i < data.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = data.slice(i, i + batchSize);
            
            chunk.forEach((item) => {
              if (item.mjj_occtle && item.mjj_kbji_label) {
                const docIdStr = `${item.mjj_occtle}-${item.mjj_kbji_label}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const newDocRef = doc(collection(db, 'classifications'), docIdStr);
                batch.set(newDocRef, {
                  mjj_occtle: String(item.mjj_occtle),
                  mjj_occmtd: String(item.mjj_occmtd || ''),
                  mjj_bidang: String(item.mjj_bidang || ''),
                  mjj_kbji_label: String(item.mjj_kbji_label),
                  mjj_kbli_label: String(item.mjj_kbli_label || ''),
                  updatedAt: serverTimestamp(),
                  updatedBy: user.username
                }, { merge: true });
                count++;
              }
            });
            await batch.commit();
          }
        } catch (dbErr: any) {
          console.error('Firestore Upload Error:', dbErr);
          const isPermissionError = dbErr?.message?.toLowerCase().includes('permission') || dbErr?.code === 'permission-denied';
          setMessage({ 
            type: 'error', 
            text: isPermissionError 
              ? 'Gagal menyimpan ke database: Izin ditolak. Pastikan aturan keamanan Firestore sudah dikonfigurasi dengan benar.' 
              : `Gagal menyimpan ke database: ${dbErr.message || 'Terjadi masalah teknis.'}`
          });
          setUploading(false);
          return;
        }

        setMessage({ type: 'success', text: `Berhasil mengupload ${count} data ke database.` });
        handleSearch();
      } catch (err) {
        setMessage({ type: 'error', text: 'Terjadi kesalahan sistem yang tidak terduga.' });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors font-semibold group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Landing Page
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight text-6xl">KBLI & KBJI <span className="text-primary-600">Explorer</span></h1>
          <p className="text-slate-500 font-medium mt-2">Cari KBLI 2025 dan KBJI 2014 yang sering muncul di Kabupaten Mempawah dengan deskripsi pekerjaan, komoditas yang diproduksi, dan bidang usaha/perusahaan/kantor.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveSubTab('search')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-tighter ${activeSubTab === 'search' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pencarian
          </button>
          <button 
            onClick={() => setActiveSubTab('manage')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-tighter ${activeSubTab === 'manage' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Update Database
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'search' ? (
          <motion.div key="search-ui" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-12">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative h-full flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ketikkan kata kunci pencarian (contoh: panen sawit 5131)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-full pl-14 pr-6 py-5 bg-slate-50 rounded-[1.25rem] border border-slate-100 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-lg text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>
                <button type="submit" className="bg-primary-600 text-white px-10 py-5 rounded-[1.25rem] font-black text-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 shrink-0">
                  CARI KLASIFIKASI
                </button>
              </form>
            </div>

            <div className="grid gap-8">
              {loading ? (
                <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-primary-600" /></div>
              ) : results.length > 0 ? (
                results.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.id} 
                    className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/40 transition-all group overflow-hidden"
                  >
                    <div className="grid md:grid-cols-12 gap-8 items-center">
                      <div className="md:col-span-12 lg:col-span-5 space-y-4">
                        <div className="flex gap-2">
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">Reference #{idx + 1}</span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <Briefcase className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Kegiatan Pekerjaan</span>
                              <p className="text-slate-900 font-bold leading-tight uppercase tracking-tighter">{item.mjj_occtle}</p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <Boxes className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Komoditas yang Dihasilkan</span>
                              <p className="text-slate-500 text-sm font-medium">{item.mjj_occmtd}</p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <Factory className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Bidang Usaha/Perusahaan/Kantor</span>
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{item.mjj_bidang}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-primary-50/50 p-6 rounded-2xl border border-primary-100">
                          <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest block mb-2">Kode KBJI</span>
                          <p className="text-primary-700 font-black text-lg leading-tight">{item.mjj_kbji_label}</p>
                        </div>
                        <div className="bg-secondary-50/50 p-6 rounded-2xl border border-secondary-100">
                          <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest block mb-2">Kode KBLI</span>
                          <p className="text-secondary-700 font-black text-lg leading-tight">{item.mjj_kbli_label}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center text-slate-400 font-medium bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                  <Search className="w-16 h-16 mx-auto mb-6 opacity-10" />
                  Gunakan parameter di atas untuk mencari referensi kode.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="manage-ui" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-4xl mx-auto">
            {user?.role !== 'admin' ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-16 text-center space-y-8">
                <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Akses Terbatas</h2>
                  <p className="text-slate-500 max-w-sm mx-auto">Hanya akun <span className="font-black text-slate-900">ADMIN</span> yang dapat melakukan pembaruan database pusat.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 md:p-16 space-y-12">
                <div className="text-center space-y-4">
                  <div className="bg-primary-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-primary-600">
                    <FileSpreadsheet className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sinkronisasi Database</h2>
                  <p className="text-slate-500 max-w-lg mx-auto">Upload data referensi KBLI & KBJI baru melalui file Excel.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-10 rounded-[2rem] space-y-6 flex flex-col items-center text-center">
                    <Download className="w-10 h-10 text-slate-300" />
                    <div>
                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter">1. Download Template</h4>
                      <p className="text-sm text-slate-500 mt-2">Gunakan kolom yang sesuai dengan format database.</p>
                    </div>
                    <button 
                      onClick={downloadTemplate}
                      className="mt-auto w-full bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
                    >
                      Download Template
                    </button>
                  </div>

                  <div className="bg-primary-50 p-10 rounded-[2rem] space-y-6 flex flex-col items-center text-center">
                    <Upload className="w-10 h-10 text-primary-400" />
                    <div>
                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter">2. Upload File</h4>
                      <p className="text-sm text-slate-500 mt-2">Sistem akan melakukan merge data secara otomatis.</p>
                    </div>
                    <label className="mt-auto w-full bg-primary-600 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-700 transition-all cursor-pointer shadow-xl shadow-primary-100 flex items-center justify-center gap-2">
                       {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /> Unggah Excel</>}
                      <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-12 mt-12">
                  <div className="text-center space-y-4 mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tambah Data Manual</h3>
                    <p className="text-slate-500 max-w-lg mx-auto">Masukkan referensi baru secara langsung tanpa melalui file Excel.</p>
                  </div>
                  
                  <form onSubmit={handleManualSubmit} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kegiatan Pekerjaan *</label>
                        <input
                          type="text"
                          required
                          value={manualForm.mjj_occtle}
                          onChange={(e) => setManualForm({ ...manualForm, mjj_occtle: e.target.value })}
                          placeholder="Cth: BURUH BANGUNAN"
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none uppercase text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Komoditas yang Dihasilkan</label>
                        <input
                          type="text"
                          value={manualForm.mjj_occmtd}
                          onChange={(e) => setManualForm({ ...manualForm, mjj_occmtd: e.target.value })}
                          placeholder="Cth: JASA TUKANG"
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none uppercase text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Bidang Usaha/Perusahaan/Kantor</label>
                        <input
                          type="text"
                          value={manualForm.mjj_bidang}
                          onChange={(e) => setManualForm({ ...manualForm, mjj_bidang: e.target.value })}
                          placeholder="Cth: KONSTRUKSI"
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none uppercase text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kode KBJI 2014 *</label>
                        <input
                          type="text"
                          required
                          value={manualForm.mjj_kbji_label}
                          onChange={(e) => setManualForm({ ...manualForm, mjj_kbji_label: e.target.value })}
                          placeholder="Cth: [9313] BURUH BANGUNAN"
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none uppercase text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kode KBLI 2025</label>
                        <input
                          type="text"
                          value={manualForm.mjj_kbli_label}
                          onChange={(e) => setManualForm({ ...manualForm, mjj_kbli_label: e.target.value })}
                          placeholder="Cth: [41014] KONSTRUKSI KONVENSIONAL"
                          className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none uppercase text-sm font-bold"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={savingManual}
                      className="w-full bg-primary-600 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                      {savingManual ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      {savingManual ? 'Menyimpan...' : 'Simpan Data Manual'}
                    </button>
                  </form>
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`p-6 rounded-[1.5rem] flex items-center gap-4 ${message.type === 'success' ? 'bg-secondary-50 text-secondary-700 border border-secondary-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                    >
                      {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                      <p className="font-bold">{message.text}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
