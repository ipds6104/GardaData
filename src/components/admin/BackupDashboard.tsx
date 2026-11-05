import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ShieldCheck, 
  RotateCcw, 
  Download, 
  Clock, 
  Database, 
  FileCheck, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Play, 
  Archive, 
  FileSpreadsheet, 
  FileCode, 
  Activity, 
  Lock
} from 'lucide-react';
import { useAuth, isAhmadAuliaUser } from '../../lib/auth';

interface BackupItem {
  id: string;
  backupType: string;
  scope: string;
  tablesIncluded: string[];
  totalRecords: number;
  filePath: string;
  fileSize?: string;
  createdAt: string;
}

interface RevisionItem {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  changedBy: string;
  createdAt: string;
  previousData: any;
}

export const BackupDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'backups' | 'revisions'>('backups');
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupScope, setBackupScope] = useState<'all' | 'lms-monitoring' | 'laporan'>('all');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [monitoredTables, setMonitoredTables] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verifikasi otorisasi eksklusif akun ahmad.aulia
  const isAuthorized = isAhmadAuliaUser(user);

  const fetchBackupData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/backups?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
        setRevisions(data.revisions || []);
        setMonitoredTables(data.monitoredTables || []);
      }
    } catch (err: any) {
      console.error('Gagal mengambil data backup:', err);
      setMessage({ type: 'error', text: 'Gagal terhubung ke endpoint cadangan data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchBackupData();
    }
  }, [isAuthorized]);

  const handleCreateManualBackup = async () => {
    setCreatingBackup(true);
    setMessage(null);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/backups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: backupScope })
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: json.message || 'Cadangan manual berhasil dibuat!' });
        await fetchBackupData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Gagal membuat cadangan' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memicu cadangan manual' });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreRevision = async (rev: RevisionItem) => {
    const tableLabel = rev.tableName.replace(/_/g, ' ');
    if (!confirm(`Pulihkan data "${tableLabel}" (ID: ${rev.recordId.slice(0, 8)}...) ke versi sebelum ${rev.action}?`)) {
      return;
    }

    setRestoringId(rev.id);
    setMessage(null);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/backups/restore-revision/${rev.id}`, {
        method: 'POST'
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: json.message || 'Data berhasil dipulihkan!' });
        await fetchBackupData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Gagal memulihkan data' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memulihkan revisi' });
    } finally {
      setRestoringId(null);
    }
  };

  // Proteksi Akses: Jika bukan ahmad.aulia, tolak akses secara elegan
  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Akses Khusus Terbatas</h2>
        <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
          Halaman Pengelolaan Cadangan & Pemulihan Sistem berada di bawah rumpun <b>Halaman Developer</b> dan hanya dapat diakses oleh akun <b>ahmad.aulia</b>.
        </p>
        <button 
          onClick={onBack} 
          className="mt-6 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const baseUrl = (import.meta as any).env.VITE_API_URL || '';

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold group transition-colors cursor-pointer text-sm"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          Kembali ke Beranda
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 font-mono">
            Halaman Developer: ahmad.aulia
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-primary-950 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  Pencadangan Data Otomatis & Manual
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                Cadangan & Log Pemulihan Sistem
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Pusat pengawasan cadangan berkala otomatis (setiap 6 jam & per jam), eksekusi cadangan manual, log riwayat audit, serta unduh arsip data dalam format <b>ZIP</b> atau <b>JSON</b>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={fetchBackupData}
              disabled={loading}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/15 cursor-pointer backdrop-blur-sm"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Perbarui</span>
            </button>
          </div>
        </div>

        {/* Schedule Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-xs">Cadangan Periodik 6 Jam</div>
              <div className="text-[11px] text-slate-300 font-mono">00:00, 06:00, 12:00, 18:00 WIB (15 Tabel)</div>
            </div>
          </div>
          <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-xs">Snapshot Cepat 1 Jam</div>
              <div className="text-[11px] text-slate-300 font-mono">07:00 - 21:00 WIB (LMS & Monitoring)</div>
            </div>
          </div>
          <div className="p-3.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-xs">Pre-Update Revision</div>
              <div className="text-[11px] text-slate-300">Data lama tersimpan otomatis sebelum diubah</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Trigger Action Banner */}
      <div className="p-5 md:p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-600" />
            Picu Pencadangan Manual Sekarang
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Amankan kondisi database saat ini secara instan sebelum melakukan pembaruan massal atau konfigurasi data penting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={backupScope}
            onChange={e => setBackupScope(e.target.value as any)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Cakupan: Semua Tabel (15 Tabel)</option>
            <option value="lms-monitoring">Cakupan: LMS & Monitoring Saja</option>
            <option value="laporan">Cakupan: Sistem Laporan Saja</option>
          </select>

          <button
            onClick={handleCreateManualBackup}
            disabled={creatingBackup}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {creatingBackup ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mencadangkan...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Eksekusi Backup</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-xs ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* Main Content Tabs */}
      <div className="space-y-4">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <button
            onClick={() => setActiveTab('backups')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'backups'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Archive className="w-4 h-4" /> 
            Log & Riwayat Cadangan Data ({backups.length})
          </button>
          <button
            onClick={() => setActiveTab('revisions')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'revisions'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" /> 
            Riwayat Snapshot Revisi ({revisions.length})
          </button>
        </div>

        {/* Tab 1: Log Cadangan Arsip ZIP/JSON */}
        {activeTab === 'backups' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-base">
                  Log Arsip Cadangan Database
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Setiap cadangan dapat diunduh langsung dalam arsip kompresi <b>ZIP</b> (berisi manifest ringkasan & JSON per tabel) atau file <b>JSON</b> mentah.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">
                {backups.length} Entri Tersimpan
              </span>
            </div>

            {backups.length === 0 ? (
              <div className="text-center py-20">
                <Database className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-bold text-sm">Belum ada file cadangan yang tersimpan</p>
                <p className="text-slate-400 text-xs mt-1">Picu "Eksekusi Backup" di atas untuk membuat cadangan pertama Anda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[11px] font-black bg-slate-50/60 dark:bg-slate-900/40">
                      <th className="py-3.5 px-5">Waktu Pencadangan</th>
                      <th className="py-3.5 px-4">Tipe Cadangan</th>
                      <th className="py-3.5 px-4">Cakupan</th>
                      <th className="py-3.5 px-4">Volume Data</th>
                      <th className="py-3.5 px-4">Ukuran Fisik</th>
                      <th className="py-3.5 px-5 text-right">Opsi Unduhan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                    {backups.map(item => {
                      const dateObj = new Date(item.createdAt);
                      const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      const timeFormatted = dateObj.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) + ' WIB';

                      const isHourly = item.backupType === 'hourly';
                      const isManual = item.backupType === 'manual';
                      const isStartup = item.backupType === 'startup';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{dateFormatted}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{timeFormatted}</div>
                          </td>

                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${
                              isHourly 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                                : isManual 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                  : isStartup 
                                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {isHourly ? 'Otomatis 1 Jam' : isManual ? 'Manual User' : isStartup ? 'Sistem Start' : 'Otomatis 6 Jam'}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                              {item.scope}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {item.tablesIncluded?.length || 0} Tabel Terangkum
                            </div>
                          </td>

                          <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">
                            {item.totalRecords.toLocaleString('id-ID')} Baris
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {item.fileSize || 'Database'}
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Download as ZIP Archive */}
                              <a
                                href={`${baseUrl}/api/backups/download-zip/${item.id}`}
                                download
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                                title="Unduh Arsip ZIP (Termasuk Manifest & JSON per Tabel)"
                              >
                                <Archive className="w-3.5 h-3.5" /> Unduh ZIP
                              </a>

                              {/* Download as raw JSON */}
                              {item.filePath && (
                                <a
                                  href={`${baseUrl}/api/backups/download/${item.filePath}`}
                                  download
                                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors"
                                  title="Unduh File JSON Mentah"
                                >
                                  <FileCode className="w-3.5 h-3.5" /> JSON
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Snapshot Revisi (Point-in-Time Rollback) */}
        {activeTab === 'revisions' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-base">
                  Riwayat Snapshot Revisi Data Sebelum Diubah
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Setiap kali ada perubahan (`PUT`) atau penghapusan (`DELETE`) pada LMS, Monitoring, Laporan, atau Penilaian Mitra, data sebelum diubah disimpan di sini dan dapat dipulihkan kapan saja.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">
                {revisions.length} Snapshot
              </span>
            </div>

            {revisions.length === 0 ? (
              <div className="text-center py-20">
                <RotateCcw className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-bold text-sm">Belum ada riwayat revisi data</p>
                <p className="text-slate-400 text-xs mt-1">
                  Saat Anda mengedit atau menghapus data di Garda Data, versi sebelumnya otomatis muncul di sini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {revisions.map(rev => {
                  const dateFormatted = new Date(rev.createdAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  });
                  const recordName = rev.previousData?.name || rev.previousData?.title || rev.previousData?.kegiatan || `ID: ${rev.recordId.slice(0, 8)}`;
                  const hasButtons = Array.isArray(rev.previousData?.buttons) && rev.previousData.buttons.length > 0;

                  return (
                    <div 
                      key={rev.id} 
                      className="p-4 md:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`p-2.5 rounded-2xl shrink-0 ${
                          rev.action === 'DELETE' 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400' 
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                        }`}>
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 truncate">
                              {recordName}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              rev.action === 'DELETE' 
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              Sebelum {rev.action}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                              {rev.tableName}
                            </span>
                            <span>•</span>
                            <span>{dateFormatted} WIB</span>
                            <span>•</span>
                            <span>Oleh: {rev.changedBy || 'system'}</span>
                            {hasButtons && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                  {rev.previousData.buttons.length} Tautan Tersimpan
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRestoreRevision(rev)}
                        disabled={restoringId === rev.id}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs self-end sm:self-auto cursor-pointer"
                      >
                        {restoringId === rev.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Memulihkan...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Pulihkan Data Ini (Rollback)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
