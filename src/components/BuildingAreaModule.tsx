import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, MapPin, Calculator, MousePointer2, AlertCircle, CheckCircle2, WifiOff, Wifi, PenTool, Edit3, Trash2 } from 'lucide-react';
import { MapDigitizer } from './map/MapDigitizer';
import { calculateAreaSqMeters, getCentroid } from '../utils/geospatial';
import { saveMeasurementOffline, getPendingMeasurements, markMeasurementAsSynced, MeasurementRecord } from '../services/indexeddb';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';

interface BuildingAreaModuleProps {
  onBack: () => void;
}

export const BuildingAreaModule: React.FC<BuildingAreaModuleProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [autoPolygonMode, setAutoPolygonMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [polygonData, setPolygonData] = useState<any>(null);
  const [luasAtap, setLuasAtap] = useState<number>(0);
  const [metodeDigitasi, setMetodeDigitasi] = useState<'manual' | 'auto_polygon'>('manual');

  const [formData, setFormData] = useState({
    jumlahLantai: 1,
    jenisBangunan: 'Rumah Tinggal',
    perkiraanLuasLantai: 0
  });

  const [existingMeasurements, setExistingMeasurements] = useState<MeasurementRecord[]>([]);

  useEffect(() => {
    // Muat semua poligon yang ada (terutama untuk Admin)
    const loadData = async () => {
      try {
        const { getAllMeasurementsLocal } = await import('../services/indexeddb');
        const data = await getAllMeasurementsLocal();
        setExistingMeasurements(data);
      } catch (err) {
        console.error('Failed to load existing measurements:', err);
      }
    };
    loadData();
  }, []);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Pantau konektivitas untuk offline mode
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync
    if (navigator.onLine) syncOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    try {
      const pending = await getPendingMeasurements();
      if (pending.length === 0) return;

      const token = localStorage.getItem('navigasi_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = pending.map(record => ({
        ...record,
        // Ensure geojson is object for the API (server stringifies it for DB)
        geojson: typeof record.geojson === 'string' ? JSON.parse(record.geojson) : record.geojson
      }));

      const baseUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${baseUrl}/api/measurements/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        for (const record of pending) {
          await markMeasurementAsSynced(record.id);
        }
        console.log(`Synced ${pending.length} records to MySQL API`);
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    } catch (error) {
      console.error('Error syncing offline data to MySQL API:', error);
    }
  };

  const handlePolygonChange = (geojson: any, mode: 'manual' | 'auto_polygon') => {
    setPolygonData(geojson);
    setMetodeDigitasi(mode);
    if (geojson) {
      const area = calculateAreaSqMeters(geojson);
      setLuasAtap(area);
      // Auto perbarui estimasi
      setFormData(prev => ({
        ...prev,
        perkiraanLuasLantai: area * 0.7
      }));
    } else {
      setLuasAtap(0);
    }
  };

  const handleSave = async () => {
    if (!polygonData) {
      setMessage({ type: 'error', text: 'Silakan gambar atau klik poligon pada peta terlebih dahulu.' });
      return;
    }
    if (formData.jumlahLantai <= 0 || formData.perkiraanLuasLantai <= 0) {
      setMessage({ type: 'error', text: 'Harap isi jumlah lantai dan perkiraan luas lantai dengan benar.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const centroid = getCentroid(polygonData) || [0, 0];
      const recordId = `meas_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const record: MeasurementRecord = {
        id: recordId,
        petugasId: user?.username || 'unknown',
        petugasName: user?.username || 'Petugas',
        timestamp: Date.now(),
        geojson: polygonData,
        luasAtap: luasAtap,
        jumlahLantai: formData.jumlahLantai,
        jenisBangunan: formData.jenisBangunan,
        perkiraanLuasLantai: formData.perkiraanLuasLantai,
        longitude: centroid[0],
        latitude: centroid[1],
        metodeDigitasi,
        syncStatus: 'pending'
      };

      // Simpan ke IndexedDB dulu
      await saveMeasurementOffline(record);

      // Coba sinkronisasi langsung jika online
      if (isOnline) {
        await syncOfflineData();
      }

      setMessage({
        type: 'success',
        text: isOnline
          ? 'Data berhasil disimpan dan disinkronisasi ke server.'
          : 'Offline! Data disimpan lokal dan akan disinkronisasi saat terhubung.'
      });

      // Reset form
      setPolygonData(null);
      setLuasAtap(0);
      setFormData({ jumlahLantai: 1, jenisBangunan: 'Rumah Tinggal', perkiraanLuasLantai: 0 });
      // Note: Map layer reset logic is inside MapDigitizer but difficult to trigger externally without ref.
      // We rely on the user clearing it or reloading, but ideally we'd pass a prop to clear.

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menyimpan data.' });
    } finally {
      setIsSaving(false);
    }
  };

  const triggerLeafletAction = (action: 'draw' | 'edit' | 'delete' | 'save' | 'cancel') => {
    if (action === 'draw') {
      (window as any).__gardaStartDraw?.();
    } else if (action === 'edit') {
      const editBtn = document.querySelector('.leaflet-draw-edit-edit') as HTMLElement;
      if (editBtn) editBtn.click();
    } else if (action === 'delete') {
      const delBtn = document.querySelector('.leaflet-draw-edit-remove') as HTMLElement;
      if (delBtn) delBtn.click();
    } else if (action === 'save') {
      (window as any).__gardaFinishDraw?.();
    } else if (action === 'cancel') {
      (window as any).__gardaCancelDraw?.();
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      const saveBtn = document.querySelector('.leaflet-draw-edit-save') as HTMLElement;
      if (saveBtn) saveBtn.click();
      setIsEditing(false);
    } else {
      const editBtn = document.querySelector('.leaflet-draw-edit-edit') as HTMLElement;
      if (editBtn) editBtn.click();
      setIsEditing(true);
    }
  };

  const handleClearMap = () => {
    (window as any).__gardaClearLayers?.();
    setPolygonData(null);
    setLuasAtap(0);
    setFormData(prev => ({ ...prev, perkiraanLuasLantai: 0 }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex flex-col min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-500 hover:text-primary-600 transition-colors font-semibold group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Kembali</span>
        </button>

        <div className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold ${isOnline ? 'bg-secondary-50 text-secondary-600' : 'bg-accent-50 text-accent-600'}`}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="hidden sm:inline">{isOnline ? 'Online Sync Active' : 'Offline Mode (Local)'}</span>
          <span className="sm:hidden">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 pb-8">
        {/* Kolom Peta & Kontrol */}
        <div className="w-full lg:flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Panel Kontrol di Luar Kotak Peta */}
          <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Mode Switcher */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl w-full md:w-auto border border-slate-100">
              <button
                onClick={() => setAutoPolygonMode(false)}
                className={`flex-1 md:flex-initial px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  !autoPolygonMode ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100/50'
                }`}
              >
                <MousePointer2 className="w-4 h-4 shrink-0" />
                <span>Manual</span>
              </button>
              <button
                onClick={() => setAutoPolygonMode(true)}
                className={`flex-1 md:flex-initial px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  autoPolygonMode ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100/50'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Otomatis</span>
              </button>
            </div>

            {/* Drawing Tools (Hanya tampil di mode Manual) */}
            {!autoPolygonMode && (
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => triggerLeafletAction('draw')}
                  className={`flex-1 md:flex-initial px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-sm ${
                    isDrawing 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-inner' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Mulai menggambar poligon baru"
                >
                  <PenTool className={`w-4 h-4 shrink-0 ${isDrawing ? 'text-blue-600' : 'text-primary-500'}`} />
                  <span>{isDrawing ? 'Menggambar...' : 'Gambar'}</span>
                </button>
                <button
                  onClick={toggleEdit}
                  className={`flex-1 md:flex-initial px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-sm ${
                    isEditing 
                      ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-inner' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={isEditing ? "Simpan perubahan poligon" : "Ubah bentuk poligon yang ada"}
                >
                  {isEditing ? <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> : <Edit3 className="w-4 h-4 text-amber-500 shrink-0" />}
                  <span>{isEditing ? 'Selesai Edit' : 'Edit'}</span>
                </button>
                <button
                  onClick={handleClearMap}
                  className="flex-1 md:flex-initial px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors shadow-sm cursor-pointer"
                  title="Hapus semua gambar poligon"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>Hapus</span>
                </button>
              </div>
            )}

            {/* Keterangan Mode Otomatis */}
            {autoPolygonMode && (
              <div className="text-xs font-bold text-slate-500 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 w-full md:w-auto text-center md:text-left flex items-center gap-1.5 justify-center">
                <span className="text-primary-600 font-extrabold">💡 Mode Otomatis:</span> Klik pada area bangunan untuk membuat poligon instan.
              </div>
            )}
          </div>

          {/* Kotak Peta */}
          <div className="w-full h-[400px] lg:h-[600px] bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden relative shrink-0">
            <MapDigitizer 
              onPolygonChange={handlePolygonChange} 
              autoPolygonMode={autoPolygonMode} 
              onDrawingStateChange={setIsDrawing}
              existingPolygons={existingMeasurements}
              userRole={user?.role}
            />
          </div>
        </div>

        {/* Kolom Form */}
        <div className="lg:w-[400px] shrink-0 bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 flex flex-col space-y-6 overflow-y-auto lg:h-[600px]">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary-600" /> Form Data
            </h2>
            <p className="text-slate-500 text-sm mt-1">Isi rincian parameter bangunan hasil digitasi.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Luas Atap (m²)</span>
              <span className="text-2xl font-black text-primary-600">{luasAtap} m²</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Bangunan</label>
              <select
                value={formData.jenisBangunan}
                onChange={(e) => setFormData({ ...formData, jenisBangunan: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-900"
              >
                <option value="Rumah Tinggal">Rumah Tinggal</option>
                <option value="Ruko">Ruko</option>
                <option value="Gudang">Gudang</option>
                <option value="Kantor">Kantor</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Lantai</label>
              <input
                type="number"
                min="1"
                value={formData.jumlahLantai}
                onChange={(e) => {
                  const lantai = parseInt(e.target.value) || 1;
                  setFormData({ ...formData, jumlahLantai: lantai, perkiraanLuasLantai: luasAtap * 0.7 });
                }}
                className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-secondary-600">Perkiraan Luas Lantai Total (m²)</label>
              <input
                type="number"
                value={formData.perkiraanLuasLantai}
                onChange={(e) => setFormData({ ...formData, perkiraanLuasLantai: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3.5 bg-secondary-50 rounded-2xl border border-secondary-100 focus:ring-2 focus:ring-secondary-500 outline-none font-black text-secondary-700 text-lg"
              />
              <p className="text-[10px] text-slate-400 font-medium ml-1">Nilai ini digunakan sebagai data training perkalian faktor admin di masa depan.</p>
            </div>
          </div>

          <div className="mt-auto pt-6 space-y-4">
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`p-4 rounded-xl flex items-start gap-3 text-sm font-bold ${message.type === 'success' ? 'bg-secondary-50 text-secondary-700 border border-secondary-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                >
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <p>{message.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-primary-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary-600/20"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Menyimpan...' : 'Simpan Data Pengukuran'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
