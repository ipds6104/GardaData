import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  RotateCcw, 
  Download, 
  Clock, 
  Database, 
  FileCheck, 
  X, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Play
} from 'lucide-react';

interface BackupItem {
  id: string;
  backupType: string;
  scope: string;
  tablesIncluded: string[];
  totalRecords: number;
  filePath: string;
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

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterTable?: string; // e.g. 'lms_trainings' if opened from LMS
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  isOpen,
  onClose,
  filterTable
}) => {
  const [activeTab, setActiveTab] = useState<'backups' | 'revisions'>('backups');
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [monitoredTables, setMonitoredTables] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    if (isOpen) {
      fetchBackupData();
    }
  }, [isOpen]);

  const handleCreateManualBackup = async () => {
    setCreatingBackup(true);
    setMessage(null);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/backups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'all' })
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: json.message || 'Cadangan manual berhasil dibuat!' });
        fetchBackupData();
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
        fetchBackupData();
      } else {
        setMessage({ type: 'error', text: json.error || 'Gagal memulihkan data' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memulihkan revisi' });
    } finally {
      setRestoringId(null);
    }
  };

  const filteredRevisions = filterTable 
    ? revisions.filter(r => r.tableName === filterTable)
    : revisions;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.95, opacity: 0 }} 
          className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 md:p-6 bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-950 text-white shrink-0 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                  <ShieldCheck className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight">Sistem Cadangan & Keamanan Data</h3>
                  <p className="text-xs text-primary-200 mt-0.5 font-medium">
                    Pencadangan periodik otomatis & pemulihan riwayat versi untuk mencegah data hilang atau tertimpa
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Schedule Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 text-xs">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-300 shrink-0" />
                <div>
                  <div className="font-bold text-white">Otomatis Setiap 6 Jam</div>
                  <div className="text-[10px] text-primary-200">00:00, 06:00, 12:00, 18:00 WIB</div>
                </div>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-amber-300 shrink-0" />
                <div>
                  <div className="font-bold text-white">Per Jam (Jam Kerja)</div>
                  <div className="text-[10px] text-primary-200">Snapshot Cepat LMS & Monitoring</div>
                </div>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-sky-300 shrink-0" />
                <div>
                  <div className="font-bold text-white">Pre-Update Revision</div>
                  <div className="text-[10px] text-primary-200">Snapshot instan sebelum data diubah</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 md:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('backups')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'backups' 
                    ? 'bg-primary-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" /> File Cadangan ({backups.length})
              </button>
              <button
                onClick={() => setActiveTab('revisions')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'revisions' 
                    ? 'bg-primary-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Riwayat Revisi ({filteredRevisions.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchBackupData}
                disabled={loading}
                className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Perbarui Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleCreateManualBackup}
                disabled={creatingBackup}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {creatingBackup ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencadangkan...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Backup Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Alert */}
          {message && (
            <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center gap-2.5 text-xs font-bold ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
            {activeTab === 'backups' ? (
              // TAB 1: BACKUPS
              backups.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Database className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 font-bold text-sm">Belum ada file cadangan yang tersimpan</p>
                  <p className="text-slate-400 text-xs mt-1">Klik tombol "Backup Sekarang" untuk membuat cadangan pertama Anda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map(item => {
                    const isHourly = item.backupType === 'hourly';
                    const isManual = item.backupType === 'manual';
                    const dateFormatted = new Date(item.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    });

                    return (
                      <div 
                        key={item.id} 
                        className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-primary-300 transition-all shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            isHourly 
                              ? 'bg-amber-50 text-amber-600' 
                              : isManual 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : 'bg-primary-50 text-primary-600'
                          }`}>
                            <Database className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-800 truncate">
                                {item.filePath || item.id}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isHourly 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : isManual 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-primary-100 text-primary-800'
                              }`}>
                                {item.backupType}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {dateFormatted} WIB
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">
                                {item.totalRecords} Baris Data
                              </span>
                              <span>•</span>
                              <span>{item.tablesIncluded?.length || 0} Tabel</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {item.filePath && (
                            <a
                              href={`${(import.meta as any).env.VITE_API_URL || ''}/api/backups/download/${item.filePath}`}
                              download
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Unduh
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // TAB 2: REVISIONS (POINT-IN-TIME ROLLBACK)
              filteredRevisions.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <RotateCcw className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500 font-bold text-sm">Belum ada riwayat revisi data</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Setiap kali Anda mengedit atau menghapus data pelatihan/monitoring, versi sebelumnya otomatis disimpan di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Di bawah ini adalah data asli sebelum diubah atau dihapus. Klik <b>"Pulihkan Data"</b> untuk mengembalikan data tersebut ke database.
                    </span>
                  </div>

                  {filteredRevisions.map(rev => {
                    const dateFormatted = new Date(rev.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    });
                    const recordName = rev.previousData?.name || rev.previousData?.title || rev.previousData?.kegiatan || `ID: ${rev.recordId.slice(0, 8)}`;
                    const hasButtons = Array.isArray(rev.previousData?.buttons) && rev.previousData.buttons.length > 0;

                    return (
                      <div 
                        key={rev.id} 
                        className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            rev.action === 'DELETE' 
                              ? 'bg-rose-50 text-rose-600' 
                              : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            <RotateCcw className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-800 truncate">
                                {recordName}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                rev.action === 'DELETE' 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                Versi Sebelum {rev.action}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                {rev.tableName}
                              </span>
                              <span>•</span>
                              <span>{dateFormatted} WIB</span>
                              {hasButtons && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                    {rev.previousData.buttons.length} Tautan
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
                              <span>Pulihkan Data Ini</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Proteksi 15 Tabel Terenkripsi & Terintegrasi Otomatis</span>
            </div>
            <button 
              onClick={onClose} 
              className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
