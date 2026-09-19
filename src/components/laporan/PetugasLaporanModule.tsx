import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, RefreshCw, ChevronRight, ChevronLeft, CheckCircle2, Clock, 
  MapPin, Upload, FileText, Check, AlertCircle, ArrowLeft,
  Sparkles, ExternalLink
} from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { getIconComponent } from './AdminLaporanManager';

interface PetugasLaporanModuleProps {
  onBack?: () => void;
  user?: any;
}

export const PetugasLaporanModule: React.FC<PetugasLaporanModuleProps> = ({ onBack, user }) => {
  const { presetInfo } = useTheme();

  // Activities & Forms State
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [forms, setForms] = useState<any[]>([]);
  const [activeFormIndex, setActiveFormIndex] = useState<number>(0);

  // Records & Drilldown State
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted'>('all');

  // Grouping Navigation (Breadcrumbs)
  // drillStack: [{ field: 'Nama PML', value: 'Najia Helmiah' }, ...]
  const [drillStack, setDrillStack] = useState<Array<{ field: string; value: string }>>([]);

  // Form Editing State
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const baseUrl = (import.meta as any).env.VITE_API_URL || '';

  // 1. Fetch Open Activities
  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/api/laporan/activities?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const openActivities = user?.role === 'admin' ? data : data.filter((a: any) => a.isOpen);
        setActivities(openActivities);
        if (openActivities.length > 0) {
          setSelectedActivity(openActivities[0]);
        }
        return;
      }
      throw new Error('Gagal memuat kegiatan dari server');
    } catch (err) {
      const cached = localStorage.getItem('garda_laporan_activities');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const openActivities = user?.role === 'admin' ? parsed : parsed.filter((a: any) => a.isOpen);
          setActivities(openActivities);
          if (openActivities.length > 0) {
            setSelectedActivity(openActivities[0]);
          }
        } catch (e) {
          setActivities([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // 2. Fetch Forms for Selected Activity
  const fetchForms = async (actId: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities/${actId}/forms?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setForms(data);
        setActiveFormIndex(0);
        setDrillStack([]);
        setEditingRecord(null);
        return;
      }
      throw new Error('Gagal memuat formulir');
    } catch (err) {
      const cached = localStorage.getItem(`garda_laporan_forms_${actId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setForms(parsed);
          setActiveFormIndex(0);
          setDrillStack([]);
          setEditingRecord(null);
        } catch (e) {
          setForms([]);
        }
      }
    }
  };

  useEffect(() => {
    if (selectedActivity) {
      fetchForms(selectedActivity.id);
    }
  }, [selectedActivity]);

  // 3. Fetch Records for Active Form
  const currentForm = forms[activeFormIndex] || null;

  const fetchRecords = async (formId: string) => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`${baseUrl}/api/laporan/forms/${formId}/records?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
        localStorage.setItem(`garda_laporan_records_${formId}`, JSON.stringify(data));
        return;
      }
      throw new Error('Gagal memuat records');
    } catch (err) {
      const cached = localStorage.getItem(`garda_laporan_records_${formId}`);
      if (cached) {
        try {
          setRecords(JSON.parse(cached));
        } catch (e) {
          setRecords([]);
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentForm) {
      fetchRecords(currentForm.id);
      setDrillStack([]);
      setEditingRecord(null);
    }
  }, [activeFormIndex, forms]);

  // Handle GPS Capture
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      alert('Perangkat atau peramban Anda tidak mendukung sensor GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);
        setGpsLocation({ lat, lng, acc });
        
        // Simpan juga ke formData jika ada field lokasi
        if (currentForm?.fields) {
          const locField = currentForm.fields.find((f: any) => f.dataType === 'lokasi');
          if (locField) {
            setFormData(prev => ({
              ...prev,
              [locField.columnName]: `${lat}, ${lng}`
            }));
          }
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('GPS Error:', err);
        alert(`Gagal mengambil titik GPS (${err.message}). Pastikan izin lokasi telah diaktifkan pada peramban/perangkat Anda.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Handle File Upload to Server
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const res = await fetch(`${baseUrl}/api/laporan/upload`, {
        method: 'POST',
        body: uploadForm
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          [fieldName]: data.url
        }));
      } else {
        alert('Gagal mengunggah file. Pastikan ukuran file di bawah 25MB.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Terjadi kesalahan saat mengunggah file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Record in Form View
  const handleOpenRecord = (record: any) => {
    setEditingRecord(record);
    const recData = record.data || {};
    setFormData({ ...recData });
    if (record.latitude && record.longitude) {
      setGpsLocation({ lat: record.latitude, lng: record.longitude });
    } else {
      setGpsLocation(null);
    }
  };

  // Save Record (Draft or Submitted)
  const handleSaveRecord = async (targetStatus: 'draft' | 'submitted') => {
    if (!currentForm || !editingRecord) return;

    // Validasi field yang wajib jika status = submitted
    if (targetStatus === 'submitted' && currentForm.fields) {
      const missingFields = currentForm.fields.filter((f: any) => {
        if (!f.isRequired) return false;
        const val = formData[f.columnName];
        return val === undefined || val === null || String(val).trim() === '';
      });

      if (missingFields.length > 0) {
        alert(`Mohon lengkapi pertanyaan wajib berikut sebelum submit:\n• ${missingFields.map((f: any) => f.label).join('\n• ')}`);
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload = {
        id: editingRecord.id,
        rowId: editingRecord.rowId,
        data: formData,
        status: targetStatus,
        latitude: gpsLocation?.lat || null,
        longitude: gpsLocation?.lng || null,
        submittedBy: user?.name || user?.username || 'Petugas'
      };

      try {
        await fetch(`${baseUrl}/api/laporan/forms/${currentForm.id}/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (netErr) {
        console.warn('Gagal sinkron ke server, data tetap tersimpan di lokal:', netErr);
      }

      setSaveSuccessMsg(targetStatus === 'submitted' ? 'Laporan berhasil disubmit & disimpan!' : 'Draf berhasil disimpan!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);

      // Perbarui record di state & local cache
      const updatedRecord = {
        ...editingRecord,
        status: targetStatus,
        data: formData,
        latitude: gpsLocation?.lat || null,
        longitude: gpsLocation?.lng || null
      };

      setEditingRecord(updatedRecord);

      const updatedRecords = records.map(r => r.id === editingRecord.id ? updatedRecord : r);
      setRecords(updatedRecords);
      localStorage.setItem(`garda_laporan_records_${currentForm.id}`, JSON.stringify(updatedRecords));
    } catch (err) {
      console.error('Save error:', err);
      alert('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  // Grouping Logic (AppSheet drill-down up to 4 levels)
  const groupingLevels: string[] = currentForm?.groupingLevels || [];
  const currentLevelIndex = drillStack.length;
  const currentGroupingField = groupingLevels[currentLevelIndex] || null;

  // Filter records based on previous drillStack selections
  const filteredByDrill = records.filter(r => {
    const d = r.data || {};
    for (const step of drillStack) {
      if (String(d[step.field] || '').trim() !== String(step.value).trim()) {
        return false;
      }
    }
    return true;
  });

  // Filter records based on Search & Status
  const displayedRecords = filteredByDrill.filter(r => {
    // Status Filter
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;

    // Search Query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const d = r.data || {};
    return Object.values(d).some(val => String(val).toLowerCase().includes(q));
  });

  // Calculate distinct groups for the current drill level
  const groupItems: Array<{ name: string; count: number }> = [];
  if (currentGroupingField && !searchQuery.trim()) {
    const counts: Record<string, number> = {};
    filteredByDrill.forEach(r => {
      const d = r.data || {};
      const val = String(d[currentGroupingField] || 'Tanpa Kategori').trim() || 'Tanpa Kategori';
      counts[val] = (counts[val] || 0) + 1;
    });

    Object.keys(counts).sort().forEach(key => {
      groupItems.push({ name: key, count: counts[key] });
    });
  }

  // Completeness indicator calculation for the active form
  const calculateCompleteness = () => {
    if (!currentForm?.fields || currentForm.fields.length === 0) return { filled: 0, total: 0, percent: 100 };
    const total = currentForm.fields.length;
    let filled = 0;
    currentForm.fields.forEach((f: any) => {
      const val = formData[f.columnName];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        filled++;
      }
    });
    return { filled, total, percent: Math.round((filled / total) * 100) };
  };

  const completeness = calculateCompleteness();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-sm font-semibold">Memuat formulir laporan pendataan...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Belum Ada Kegiatan Terbuka</h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          Saat ini belum ada formulir kegiatan pendataan yang dibuka oleh Administrator. Silakan hubungi admin atau periksa kembali nanti.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-6 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
      {/* ==========================================
          TOP HEADER (APPSHEET STYLE)
          ========================================== */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {editingRecord ? (
            <button
              onClick={() => setEditingRecord(null)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Kembali ke Daftar Sampel"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : drillStack.length > 0 ? (
            <button
              onClick={() => setDrillStack(prev => prev.slice(0, -1))}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Kembali ke Tingkat Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : onBack ? (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : null}

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
              {selectedActivity?.title || 'Laporan Pendataan'}
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate flex items-center gap-1.5">
              {editingRecord ? (
                `Form: ${editingRecord.data?.['Nama KRT'] || editingRecord.data?.['ID'] || 'Isian Sampel'}`
              ) : (
                <>
                  {(() => {
                    const CurrentFormIcon = getIconComponent(currentForm?.icon, FileText);
                    return <CurrentFormIcon className="w-4 h-4 text-primary-600 shrink-0" />;
                  })()}
                  <span>{currentForm?.title || 'Formulir'}</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!editingRecord && (
            <div className="relative">
              <input
                type="text"
                placeholder="Cari sampel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 sm:w-56 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          )}

          <button
            onClick={() => currentForm && fetchRecords(currentForm.id)}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Segarkan data dari server"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {saveSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MAIN BODY: DRILL-DOWN LIST OR EDIT FORM
          ========================================== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 bg-slate-50/60">
        {editingRecord ? (
          /* ----------------------------------------------------
             VIEW 1: FORM PENGISIAN PETUGAS (ACTIVE RECORD)
             ---------------------------------------------------- */
          <div className="max-w-2xl mx-auto space-y-4 pb-20">
            {/* Completion Indicator Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  Kelengkapan Pertanyaan
                </span>
                <span className="font-black text-primary-600">
                  {completeness.filled} / {completeness.total} ({completeness.percent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${completeness.percent}%`,
                    backgroundColor: completeness.percent === 100 ? '#10b981' : presetInfo.colors.primary
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Status Saat Ini:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  editingRecord.status === 'submitted'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {editingRecord.status === 'submitted' ? '✔ Submitted' : '✎ Draf'}
                </span>
              </div>
            </div>

            {/* Predefined Reference Data (Read-only pills) */}
            <div className="bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                Data Sasaran / Predefined Data
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                {Object.entries(editingRecord.data || {}).map(([key, val]) => {
                  const isDynamicField = currentForm?.fields?.some((f: any) => f.columnName === key);
                  if (isDynamicField && String(val).length > 30) return null;
                  return (
                    <div key={key} className="bg-white p-2 rounded-xl border border-slate-200/60 truncate">
                      <span className="text-[10px] text-slate-400 block truncate">{key}</span>
                      <span className="font-bold text-slate-800 truncate block">{String(val) || '-'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Form Questions */}
            <div className="space-y-3.5">
              {currentForm?.fields?.map((field: any, idx: number) => {
                const val = formData[field.columnName] ?? '';
                const isComplete = val !== undefined && val !== null && String(val).trim() !== '';

                return (
                  <div 
                    key={field.id || idx}
                    className={`bg-white p-4 rounded-2xl border transition-all ${
                      field.isRequired && !isComplete 
                        ? 'border-amber-300 ring-1 ring-amber-100' 
                        : 'border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      {field.label}
                      {field.isRequired && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </label>

                    {/* INPUT RENDERING BASED ON DATA TYPE */}
                    {field.dataType === 'angka' ? (
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => setFormData({ ...formData, [field.columnName]: e.target.value })}
                        placeholder="Ketikkan angka..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all"
                      />
                    ) : field.dataType === 'tanggal' ? (
                      <input
                        type="date"
                        value={val}
                        onChange={(e) => setFormData({ ...formData, [field.columnName]: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all cursor-pointer"
                      />
                    ) : field.dataType === 'jam' ? (
                      <input
                        type="time"
                        value={val}
                        onChange={(e) => setFormData({ ...formData, [field.columnName]: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all cursor-pointer"
                      />
                    ) : field.dataType === 'lokasi' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCaptureGPS}
                            disabled={isLocating}
                            style={{ backgroundColor: presetInfo.colors.primary }}
                            className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce' : ''}`} />
                            <span>{isLocating ? 'Mendeteksi GPS...' : 'Ambil Titik Lokasi Sekarang'}</span>
                          </button>

                          {gpsLocation && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ±{gpsLocation.acc || 10}m
                            </span>
                          )}
                        </div>

                        <input
                          type="text"
                          value={val || (gpsLocation ? `${gpsLocation.lat}, ${gpsLocation.lng}` : '')}
                          onChange={(e) => setFormData({ ...formData, [field.columnName]: e.target.value })}
                          placeholder="Latitude, Longitude (contoh: -0.024512, 109.123456)"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all"
                        />
                      </div>
                    ) : field.dataType === 'file' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploading ? 'Mengunggah...' : 'Pilih Foto / Dokumen'}</span>
                            <input
                              type="file"
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => handleFileUpload(e, field.columnName)}
                              disabled={isUploading}
                              className="hidden"
                            />
                          </label>

                          {val && (
                            <a
                              href={val}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-bold bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-200"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Lihat Berkas
                            </a>
                          )}
                        </div>

                        {/* Thumbnail Preview jika gambar */}
                        {val && (val.endsWith('.jpg') || val.endsWith('.jpeg') || val.endsWith('.png') || val.endsWith('.webp')) && (
                          <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                            <img src={val} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <textarea
                        rows={2}
                        value={val}
                        onChange={(e) => setFormData({ ...formData, [field.columnName]: e.target.value })}
                        placeholder="Ketikkan isian laporan..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all resize-y"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Floating Save Buttons */}
            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveRecord('draft')}
                disabled={isSaving}
                className="flex-1 py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Draf'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveRecord('submitted')}
                disabled={isSaving}
                style={{ backgroundColor: presetInfo.colors.primary }}
                className="flex-1 py-3 px-4 rounded-2xl text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Submit Laporan'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ----------------------------------------------------
             VIEW 2: HIERARCHICAL DRILL-DOWN / RECORD LIST
             ---------------------------------------------------- */
          <div className="space-y-3 pb-16">
            {/* Status Tabs Filter */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs max-w-sm mx-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-100 text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({filteredByDrill.length})
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'draft' ? 'bg-amber-100 text-amber-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Draf ({filteredByDrill.filter(r => r.status === 'draft').length})
              </button>
              <button
                onClick={() => setStatusFilter('submitted')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'submitted' ? 'bg-emerald-100 text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Submit ({filteredByDrill.filter(r => r.status === 'submitted').length})
              </button>
            </div>

            {/* Breadcrumb path if drilled down */}
            {drillStack.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 px-1 overflow-x-auto py-1">
                <button 
                  onClick={() => setDrillStack([])}
                  className="font-bold text-primary-600 hover:underline cursor-pointer"
                >
                  Semua
                </button>
                {drillStack.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      onClick={() => setDrillStack(prev => prev.slice(0, idx + 1))}
                      className={`truncate max-w-[120px] font-bold ${
                        idx === drillStack.length - 1 ? 'text-slate-900' : 'text-primary-600 hover:underline'
                      }`}
                    >
                      {step.value}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* IF AT GROUPING LEVEL (Sesuai Screenshot AppSheet: All, Contoh PML 1, Najia 90, Syarifah 60) */}
            {groupItems.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
                {/* Opsi 'All' untuk melihat semua sampel sekaligus */}
                <button
                  onClick={() => {
                    // Masuk langsung ke tampilan daftar tanpa filter grup
                    setDrillStack(groupingLevels.map(f => ({ field: f, value: '' })));
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <span className="text-sm font-bold text-slate-800">All</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {groupItems.map(item => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setDrillStack([...drillStack, { field: currentGroupingField!, value: item.name }]);
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-800 truncate pr-2">{item.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-extrabold border border-slate-200/60">
                        {item.count}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* IF AT LEAF LEVEL: LIST OF RECORD SAMPLES */
              <div className="space-y-2">
                {displayedRecords.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                    Tidak ada data sampel yang sesuai.
                  </div>
                ) : (
                  displayedRecords.map(rec => {
                    const d = rec.data || {};
                    const title = d['Nama KRT'] || d['Nama Sampel'] || d['Nama'] || `Sampel #${rec.rowId}`;
                    const subtitle = [d['SLS'], d['Desa'], d['Kecamatan']].filter(Boolean).join(', ');
                    const ppl = d['Nama PPL'] || d['PPL'] || '';

                    return (
                      <div
                        key={rec.id}
                        onClick={() => handleOpenRecord(rec)}
                        className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-primary-300 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-black text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                              {title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${
                              rec.status === 'submitted'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {rec.status === 'submitted' ? 'Submitted' : 'Draf'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate">{subtitle || 'Data Sampel Kegiatan'}</p>
                          {ppl && <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">PPL: {ppl}</p>}
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors shrink-0" />
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==========================================
          BOTTOM FORM TABS BAR (SESUAI GAMBAR APPSHEET)
          ========================================== */}
      {!editingRecord && forms.length > 0 && (
        <div className="bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shrink-0 z-20 shadow-lg">
          {forms.map((f, idx) => {
            const isActive = activeFormIndex === idx;
            const FormTabIcon = getIconComponent(f.icon, FileText);
            return (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFormIndex(idx);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer relative min-w-[70px] max-w-[120px] ${
                  isActive ? 'text-primary-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div 
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-primary-50 text-primary-600 shadow-2xs' : 'text-slate-400'
                  }`}
                >
                  <FormTabIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] leading-tight text-center truncate w-full mt-0.5">
                  {f.title}
                </span>

                {/* Underline Indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute -bottom-1 w-8 h-1 rounded-full bg-primary-600"
                    style={{ backgroundColor: presetInfo.colors.primary }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

