import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, Save, AlertCircle, CheckCircle2, Search, Users, 
  MapPin, Tag, Calendar, Filter, PlusCircle, Bookmark, Compass, 
  Trash2, Edit3, Sparkles, Copy, FileText, Lock, ChevronRight,
  RefreshCw, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth';
import { MEMPAWAH_REGIONS, KECAMATAN_LIST } from '../data/regions';

interface SocialPhenomenonModuleProps {
  onBack: () => void;
}

interface PhenomenonRecord {
  id: string;
  judul: string;
  kategori: 'Ketenagakerjaan' | 'Konsumsi Rumah Tangga';
  kecamatan: string;
  desa: string;
  sls: string;
  petugas_name: string;
  tanggal: string;
  deskripsi: string;
  created_at?: string;
}

interface AISummaryResult {
  ringkasan: string;
  fenomenaDominan: string;
  polaSeringMuncul: string;
  kesimpulan: string;
}

const PROMPTING_QUESTIONS = {
  'Ketenagakerjaan': [
    'Kalau melihat warga di sini sehari-hari, biasanya mereka bekerja apa saja? Ceritakan yang paling sering ditemui',
    'Menurut Bapak/Ibu, sekarang mencari kerja di sini gampang atau susah? Biasanya kenapa bisa begitu',
    'Apakah ada perubahan pekerjaan warga dibanding dulu? Misalnya dulu banyak bertani, sekarang jadi apa?'
  ],
  'Konsumsi Rumah Tangga': [
    'Kalau kebutuhan rumah tangga sekarang dibanding beberapa tahun lalu, bagian mana yang paling terasa naik atau berubah pengeluarannya? Bisa diceritakan contohnya?',
    'Biasanya kalau penghasilan sedang berkurang atau harga naik, pengeluaran apa yang paling dulu dikurangi atau ditahan oleh keluarga di sini',
    'Menurut Bapak/Ibu, sekarang warga di sini lebih banyak membeli kebutuhan pokok, kebutuhan sekolah, cicilan, atau kebutuhan lain? Kenapa bisa begitu?'
  ]
};

// Client-side capitalize sentences utility
function capitalizeSentences(text: string): string {
  if (!text) return '';
  return text.trim().replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, letter) => {
    return separator + letter.toUpperCase();
  });
}

export const SocialPhenomenonModule: React.FC<SocialPhenomenonModuleProps> = ({ onBack }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Active view tab (especially for admin: 'input' or 'dashboard')
  const [activeTab, setActiveTab] = useState<'input' | 'dashboard'>(isAdmin ? 'dashboard' : 'input');

  // List Data & Filters State
  const [records, setRecords] = useState<PhenomenonRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 5;

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('Semua');
  const [filterDesa, setFilterDesa] = useState('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [filterMonth, setFilterMonth] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'Ketenagakerjaan' as 'Ketenagakerjaan' | 'Konsumsi Rumah Tangga',
    kecamatan: KECAMATAN_LIST[0] || 'Mempawah Hilir',
    desa: '',
    sls: '',
    petugas_name: user?.name || user?.username || 'Petugas',
    tanggal: new Date().toISOString().split('T')[0],
    deskripsi: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        petugas_name: user.name || user.username || 'Petugas'
      }));
    }
  }, [user]);

  const [agreement, setAgreement] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editing state for Admin
  const [editingRecord, setEditingRecord] = useState<PhenomenonRecord | null>(null);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<AISummaryResult | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [copiedAI, setCopiedAI] = useState(false);

  // Load desa options based on chosen kecamatan in form
  const desaOptions = useMemo(() => {
    return MEMPAWAH_REGIONS[formData.kecamatan] || [];
  }, [formData.kecamatan]);

  // Set default desa when kecamatan changes
  useEffect(() => {
    if (desaOptions.length > 0 && !desaOptions.includes(formData.desa)) {
      setFormData(prev => ({ ...prev, desa: desaOptions[0] }));
    }
  }, [formData.kecamatan, desaOptions]);

  // Load desa options for filters
  const filterDesaOptions = useMemo(() => {
    if (filterKecamatan === 'Semua') return [];
    return MEMPAWAH_REGIONS[filterKecamatan] || [];
  }, [filterKecamatan]);

  useEffect(() => {
    setFilterDesa('Semua');
  }, [filterKecamatan]);

  // Fetch from Server API
  const fetchRecords = async () => {
    setIsLoadingList(true);
    try {
      const token = localStorage.getItem('navigasi_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams({
        kecamatan: filterKecamatan,
        desa: filterDesa,
        kategori: filterKategori,
        search: searchTerm,
        month: filterMonth,
        limit: String(limit),
        offset: String((page - 1) * limit)
      });

      const response = await fetch(`/api/phenomena?${params.toString()}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
        setTotalRecords(data.total);
      } else {
        throw new Error('Server returned error response');
      }
    } catch (error) {
      console.error('Failed to fetch from API, falling back to LocalStorage', error);
      // Fallback to local storage mock data for offline support
      const saved = localStorage.getItem('local_social_phenomena');
      if (saved) {
        try {
          const allLocal: PhenomenonRecord[] = JSON.parse(saved);
          let filtered = allLocal;
          if (filterKecamatan !== 'Semua') filtered = filtered.filter(r => r.kecamatan === filterKecamatan);
          if (filterDesa !== 'Semua') filtered = filtered.filter(r => r.desa === filterDesa);
          if (filterKategori !== 'Semua') filtered = filtered.filter(r => r.kategori === filterKategori);
          if (filterMonth) filtered = filtered.filter(r => r.tanggal.startsWith(filterMonth));
          if (searchTerm) {
            const st = searchTerm.toLowerCase();
            filtered = filtered.filter(r => 
              r.judul.toLowerCase().includes(st) || 
              r.deskripsi.toLowerCase().includes(st) || 
              r.sls.toLowerCase().includes(st)
            );
          }
          setTotalRecords(filtered.length);
          setRecords(filtered.slice((page - 1) * limit, page * limit));
        } catch (e) {
          console.error(e);
        }
      }
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filterKecamatan, filterDesa, filterKategori, filterMonth, searchTerm, page]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreement) {
      setMessage({ type: 'error', text: 'Anda harus mencentang pernyataan kesesuaian kondisi lapangan.' });
      return;
    }

    if (!formData.judul.trim() || !formData.deskripsi.trim() || !formData.desa.trim() || !formData.sls.trim() || !formData.petugas_name.trim()) {
      setMessage({ type: 'error', text: 'Harap lengkapi semua kolom wajib (*) sebelum mengirim.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const payload = {
      ...formData,
      judul: capitalizeSentences(formData.judul),
      deskripsi: capitalizeSentences(formData.deskripsi),
      dampak: '-', // Empty filler for DB constraint compatibility
      rekomendasi: '',
      agreement
    };

    try {
      const token = localStorage.getItem('navigasi_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/phenomena', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: 'Laporan fenomena sosial ekonomi berhasil disimpan dan dikirim ke server.' });
        
        // Reset form
        setFormData(prev => ({
          ...prev,
          judul: '',
          deskripsi: '',
          sls: ''
        }));
        setAgreement(false);
        
        // If offline fallback, update localStorage too
        const saved = localStorage.getItem('local_social_phenomena') || '[]';
        const localList = JSON.parse(saved);
        localStorage.setItem('local_social_phenomena', JSON.stringify([result.record, ...localList]));

        fetchRecords();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menyimpan ke server.');
      }
    } catch (error: any) {
      console.error(error);
      // Offline implementation save to local storage
      const newLocalRecord: PhenomenonRecord = {
        id: `ph_local_${Date.now()}`,
        judul: capitalizeSentences(formData.judul),
        kategori: formData.kategori,
        kecamatan: formData.kecamatan,
        desa: formData.desa,
        sls: formData.sls,
        petugas_name: formData.petugas_name,
        tanggal: formData.tanggal,
        deskripsi: capitalizeSentences(formData.deskripsi)
      };

      const saved = localStorage.getItem('local_social_phenomena') || '[]';
      const localList = JSON.parse(saved);
      const updatedList = [newLocalRecord, ...localList];
      localStorage.setItem('local_social_phenomena', JSON.stringify(updatedList));

      setMessage({ 
        type: 'success', 
        text: 'Laporan disimpan secara LOKAL (Offline). Data akan disinkronkan otomatis saat terhubung kembali.' 
      });

      setFormData(prev => ({
        ...prev,
        judul: '',
        deskripsi: '',
        sls: ''
      }));
      setAgreement(false);
      
      fetchRecords();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Edit Submission (Admin Only)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setIsSaving(true);
    setMessage(null);

    // Keep fields for DB validation
    const recordToSave = {
      ...editingRecord,
      dampak: '-',
      rekomendasi: ''
    };

    try {
      const token = localStorage.getItem('navigasi_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/phenomena/${editingRecord.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(recordToSave)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Laporan berhasil diperbarui.' });
        setEditingRecord(null);
        fetchRecords();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengubah data.');
      }
    } catch (error: any) {
      console.error(error);
      setMessage({ type: 'error', text: error.message || 'Koneksi gagal. Perubahan tidak dapat disimpan.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete (Admin Only)
  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus permanen laporan fenomena ini?')) return;

    try {
      const token = localStorage.getItem('navigasi_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/phenomena/${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        // Remove from local storage list too
        const saved = localStorage.getItem('local_social_phenomena') || '[]';
        const localList = JSON.parse(saved).filter((r: any) => r.id !== id);
        localStorage.setItem('local_social_phenomena', JSON.stringify(localList));

        fetchRecords();
      } else {
        throw new Error('Gagal menghapus dari server');
      }
    } catch (err) {
      console.error(err);
      // Fallback local delete
      const saved = localStorage.getItem('local_social_phenomena') || '[]';
      const localList = JSON.parse(saved).filter((r: any) => r.id !== id);
      localStorage.setItem('local_social_phenomena', JSON.stringify(localList));
      fetchRecords();
    }
  };

  // Generate Gemini AI Summary
  const handleGenerateAISummary = async () => {
    setIsLoadingAI(true);
    setAiSummary(null);
    setCopiedAI(false);

    try {
      const token = localStorage.getItem('navigasi_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/phenomena/ai-summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          kecamatan: filterKecamatan,
          desa: filterDesa,
          kategori: filterKategori,
          month: filterMonth
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data);
      } else {
        throw new Error('Gagal menghasilkan analisis AI');
      }
    } catch (err) {
      console.error(err);
      setAiSummary({
        ringkasan: 'Gagal memanggil asisten AI Gemini. Terjadi anomali saat pemrosesan ringkasan.',
        fenomenaDominan: 'Silakan periksa konfigurasi kunci API BPS atau coba sesaat lagi.',
        polaSeringMuncul: 'Koneksi dibatasi atau habis waktu.',
        kesimpulan: 'Analisis manual disarankan untuk sementara waktu.'
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleCopyAISummary = () => {
    if (!aiSummary) return;
    const textToCopy = `=== RINGKASAN EKSEKUTIF FENOMENA SOSIAL EKONOMI ===
1. Ringkasan Umum:
${aiSummary.ringkasan}

2. Fenomena Dominan:
${aiSummary.fenomenaDominan}

3. Pola yang Sering Muncul:
${aiSummary.polaSeringMuncul}

4. Kesimpulan Strategis:
${aiSummary.kesimpulan}
===================================================`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedAI(true);
      setTimeout(() => setCopiedAI(false), 2000);
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col px-4 sm:px-6">
      
      {/* Header Info Area */}
      <div className="flex items-center justify-between gap-4 shrink-0 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors font-bold group cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Dashboard Utama</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-black border border-blue-100 shadow-sm">
          <Compass className="w-4 h-4" />
          <span>MODUL FENOMENA SOSIAL EKONOMI</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2 sm:gap-3 flex-wrap">
            <Users className="w-6 h-6 sm:w-8 h-8 text-blue-600 shrink-0" />
            <span>Pemantauan <span className="text-blue-600">Fenomena Sosek</span></span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Penjaringan fenomena Ketenagakerjaan (Sakernas) & Konsumsi (Susenas-Seruti) di Kabupaten Mempawah.
          </p>
        </div>

        {/* Access controls & View Switch */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => { setActiveTab('input'); setEditingRecord(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'input' 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 inline mr-1" /> Input Laporan
          </button>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1" /> Recap Data {isAdmin && <span className="ml-1 bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase">Admin</span>}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'input' ? (
          <motion.div
            key="input-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full opacity-40 blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  Formulir Input Laporan
                </h2>
                <p className="text-xs text-slate-400 mt-1">Harap isi fenomena sosial atau anomali ekonomi rill yang dijumpai di lapangan.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                {/* Kecamatan & Desa Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan *</label>
                    <select
                      value={formData.kecamatan}
                      onChange={(e) => setFormData(prev => ({ ...prev, kecamatan: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-bold text-slate-800 text-sm transition-all"
                    >
                      {KECAMATAN_LIST.map((kec) => (
                        <option key={kec} value={kec}>{kec}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Desa / Kelurahan *</label>
                    <select
                      value={formData.desa}
                      onChange={(e) => setFormData(prev => ({ ...prev, desa: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-bold text-slate-800 text-sm transition-all"
                    >
                      {desaOptions.map((des) => (
                        <option key={des} value={des}>{des}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SLS & Petugas (Free Text for efficiency) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama SLS / Dusun *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: RT 001 RW 002 Dusun Melati"
                      value={formData.sls}
                      onChange={(e) => setFormData(prev => ({ ...prev, sls: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-bold text-slate-800 text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Petugas *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ketik Nama Anda"
                      value={formData.petugas_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, petugas_name: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-bold text-slate-800 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Topic & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Topik Fenomena *</label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData(prev => ({ ...prev, kategori: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-bold text-slate-800 text-sm transition-all"
                    >
                      <option value="Ketenagakerjaan">Ketenagakerjaan</option>
                      <option value="Konsumsi Rumah Tangga">Konsumsi Rumah Tangga</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Fenomena Terjadi *</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggal}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-bold text-slate-800 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Nama Fenomena / Judul Singkat */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Fenomena / Judul Singkat *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kenaikan harga bahan pokok mendasar di Desa..."
                    value={formData.judul}
                    onChange={(e) => setFormData(prev => ({ ...prev, judul: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-bold text-slate-800 text-sm transition-all"
                  />
                </div>

                {/* Dynamic Reference Interview Guide Card */}
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 space-y-3">
                  <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Panduan Pertanyaan Pancingan ({formData.kategori === 'Ketenagakerjaan' ? 'Ketenagakerjaan' : 'Konsumsi RT'})
                  </h4>
                  <ul className="space-y-2.5">
                    {PROMPTING_QUESTIONS[formData.kategori].map((q, idx) => (
                      <li key={idx} className="text-xs text-slate-600 leading-relaxed font-medium flex gap-2">
                        <span className="text-blue-500 font-extrabold shrink-0">{idx + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Penjelasan Fenomena (textarea panjang) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Penjelasan Fenomena *</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Uraikan kondisi riil secara utuh, latar belakang kejadian, dan bagaimana perkembangannya..."
                    value={formData.deskripsi}
                    onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-medium text-slate-800 text-sm transition-all resize-none"
                  />
                </div>

                {/* Checkbox pernyataan */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreement}
                    onChange={(e) => setAgreement(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    Saya menyatakan fenomena yang ditulis sesuai kondisi sebenarnya di lapangan.
                  </span>
                </label>

                {/* Message & Actions */}
                <div className="pt-2 space-y-3">
                  <AnimatePresence>
                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className={`p-4 rounded-xl flex items-start gap-3 text-xs font-bold ${
                          message.type === 'success' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}
                      >
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <p>{message.text}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isSaving || !agreement}
                    className={`w-full px-6 py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl text-sm cursor-pointer ${
                      agreement && !isSaving
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Memproses Laporan...' : 'Kirim Laporan Fenomena'}
                  </button>
                </div>

              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="recap-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Filter controls panel */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-500" /> Filter Pencarian Cepat
                </h3>
                <button
                  onClick={() => {
                    setFilterKecamatan('Semua');
                    setFilterDesa('Semua');
                    setFilterKategori('Semua');
                    setFilterMonth('');
                    setSearchTerm('');
                    setPage(1);
                  }}
                  className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-wider transition-colors"
                >
                  Reset Filter
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {/* Search Term */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pencarian Kata Kunci</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari judul, sls, petugas..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 text-xs transition-all"
                    />
                  </div>
                </div>

                {/* Kecamatan Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                  <select
                    value={filterKecamatan}
                    onChange={(e) => { setFilterKecamatan(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 text-xs transition-all"
                  >
                    <option value="Semua">Semua Kecamatan</option>
                    {KECAMATAN_LIST.map((kec) => (
                      <option key={kec} value={kec}>{kec}</option>
                    ))}
                  </select>
                </div>

                {/* Desa Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desa / Kelurahan</label>
                  <select
                    value={filterDesa}
                    disabled={filterKecamatan === 'Semua'}
                    onChange={(e) => { setFilterDesa(e.target.value); setPage(1); }}
                    className={`w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 text-xs transition-all ${
                      filterKecamatan === 'Semua' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="Semua">Semua Desa</option>
                    {filterDesaOptions.map((des) => (
                      <option key={des} value={des}>{des}</option>
                    ))}
                  </select>
                </div>

                {/* Topic Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Topik Fenomena</label>
                  <select
                    value={filterKategori}
                    onChange={(e) => { setFilterKategori(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 text-xs transition-all"
                  >
                    <option value="Semua">Semua Topik</option>
                    <option value="Ketenagakerjaan">Ketenagakerjaan</option>
                    <option value="Konsumsi Rumah Tangga">Konsumsi Rumah Tangga</option>
                  </select>
                </div>

                {/* Month Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulan Terjadi</label>
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-700 text-xs transition-all"
                  />
                </div>
              </div>
            </div>

            {/* AI Summary Engine Section (Admin Only) */}
            {isAdmin && (
              <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-blue-800">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 rounded-full opacity-10 blur-3xl" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 border-b border-white/10 pb-5 mb-5">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-blue-200">
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                      Gemini AI Executive Summary Engine
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      Hasilkan ringkasan dinamika sosial ekonomi otomatis menggunakan kecerdasan buatan Google Gemini berdasarkan data laporan terfilter di atas.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateAISummary}
                    disabled={isLoadingAI}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-900 disabled:text-slate-400 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shrink-0 transition-all cursor-pointer border border-blue-500"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                    {isLoadingAI ? 'Menganalisis...' : 'Hasilkan Ringkasan AI'}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {isLoadingAI ? (
                    <motion.div
                      key="ai-loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-10 space-y-3"
                    >
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                      <p className="text-xs text-blue-200 font-black uppercase tracking-widest">Menjaring data laporan, menyusun prompt analisis BPS, dan memproses via Gemini AI...</p>
                    </motion.div>
                  ) : aiSummary ? (
                    <motion.div
                      key="ai-results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 relative z-10"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                          <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1.5">1. Ringkasan Eksekutif Umum</p>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">{aiSummary.ringkasan}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                          <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1.5">2. Fenomena Dominan Terkini</p>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">{aiSummary.fenomenaDominan}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                          <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1.5">3. Pola Spasial & Temporal yang Terbentuk</p>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">{aiSummary.polaSeringMuncul}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                          <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1.5">4. Kesimpulan Strategis / Kebijakan BPS</p>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">{aiSummary.kesimpulan}</p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleCopyAISummary}
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {copiedAI ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-blue-300" />
                              <span>Salin Ringkasan Eksekutif</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )}

            {/* Editing Record Modal / Form (Admin Only) */}
            {editingRecord && (
              <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200 pb-3 mb-2">
                  <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> Edit Laporan (Administrator Mode)
                  </h3>
                  <button
                    onClick={() => setEditingRecord(null)}
                    className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                  >
                    Batal
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Nama Fenomena / Judul Singkat</label>
                      <input
                        type="text"
                        required
                        value={editingRecord.judul}
                        onChange={(e) => setEditingRecord({ ...editingRecord, judul: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 outline-none font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Nama SLS / Dusun</label>
                      <input
                        type="text"
                        required
                        value={editingRecord.sls}
                        onChange={(e) => setEditingRecord({ ...editingRecord, sls: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 outline-none font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Penjelasan Fenomena</label>
                    <textarea
                      required
                      rows={5}
                      value={editingRecord.deskripsi}
                      onChange={(e) => setEditingRecord({ ...editingRecord, deskripsi: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 outline-none font-medium text-xs resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingRecord(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List / Recap Table Cards */}
            <div className="space-y-4">
              {isLoadingList ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat daftar data...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm space-y-3">
                  <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-bold">Tidak ada laporan fenomena sosial ekonomi yang cocok.</p>
                  <p className="text-xs text-slate-400">Silakan ubah filter pencarian Anda atau buat laporan baru.</p>
                </div>
              ) : (
                records.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] border border-slate-100 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden"
                  >
                    {/* Topic Indicator Accent */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${
                      item.kategori === 'Ketenagakerjaan' ? 'bg-indigo-500' : 'bg-rose-500'
                    }`} />
                    
                    {/* Card Header metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-tight flex items-center gap-1 ${
                          item.kategori === 'Ketenagakerjaan'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          <Tag className="w-3 h-3" /> {item.kategori}
                        </span>

                        <span className="text-[10px] font-black px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 uppercase tracking-tight">
                          SLS: {item.sls}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.tanggal}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-black text-slate-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                      {item.judul}
                    </h3>

                    {/* Location & Petugas details */}
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>Kec. {item.kecamatan}, Desa {item.desa}</span>
                      </div>
                      <div className="h-3 w-px bg-slate-200 hidden sm:block" />
                      <div className="text-[10px] text-slate-400">
                        Oleh: <strong className="text-slate-600 font-extrabold">{item.petugas_name}</strong>
                      </div>
                    </div>

                    {/* Content lists */}
                    <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 mb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Penjelasan Fenomena</p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.deskripsi}</p>
                      </div>
                    </div>

                    {/* Actions panel (Delete & Edit only for Admin) */}
                    {isAdmin && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setEditingRecord(item)}
                          className="px-3.5 py-2 bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-transparent hover:border-amber-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit Laporan
                        </button>
                        
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3.5 py-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-transparent hover:border-rose-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus Laporan
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalRecords > limit && (
              <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 disabled:cursor-not-allowed border border-slate-200 transition-colors"
                >
                  Sebelumnya
                </button>

                <span className="text-xs font-bold text-slate-500">
                  Halaman <strong className="text-slate-900 font-extrabold">{page}</strong> dari <strong className="text-slate-900 font-extrabold">{Math.ceil(totalRecords / limit)}</strong> ({totalRecords} Laporan)
                </span>

                <button
                  disabled={page >= Math.ceil(totalRecords / limit)}
                  onClick={() => setPage(prev => prev + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 border border-slate-200 transition-colors"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
