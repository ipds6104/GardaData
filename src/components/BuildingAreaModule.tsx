import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, MapPin, Calculator, MousePointer2, AlertCircle, CheckCircle2, WifiOff, Wifi } from 'lucide-react';
import { MapDigitizer } from './map/MapDigitizer';
import { calculateAreaSqMeters, getCentroid } from '../utils/geospatial';
import { saveMeasurementOffline, getPendingMeasurements, markMeasurementAsSynced, MeasurementRecord } from '../services/indexeddb';
import { useAuth } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BuildingAreaModuleProps {
  onBack: () => void;
}

export const BuildingAreaModule: React.FC<BuildingAreaModuleProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [autoPolygonMode, setAutoPolygonMode] = useState(false);
  const [polygonData, setPolygonData] = useState<any>(null);
  const [luasTapak, setLuasTapak] = useState<number>(0);
  const [metodeDigitasi, setMetodeDigitasi] = useState<'manual' | 'auto_polygon'>('manual');

  const [formData, setFormData] = useState({
    jumlahLantai: 1,
    jenisBangunan: 'Rumah Tinggal',
    perkiraanLuasLantai: 0
  });

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

      const response = await fetch('/api/measurements/sync', {
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
      console.error('Error syncing offline data to API:', error);
    }
  };

  const handlePolygonChange = (geojson: any, mode: 'manual' | 'auto_polygon') => {
    setPolygonData(geojson);
    setMetodeDigitasi(mode);
    if (geojson) {
      const area = calculateAreaSqMeters(geojson);
      setLuasTapak(area);
      // Auto perbarui estimasi
      setFormData(prev => ({
        ...prev,
        perkiraanLuasLantai: area * prev.jumlahLantai
      }));
    } else {
      setLuasTapak(0);
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
        luasTapak: luasTapak,
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
      setLuasTapak(0);
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto lg:h-[calc(100vh-8rem)] flex flex-col">
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

      <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:min-h-[600px] pb-8">
        {/* Kolom Peta */}
        <div className="w-full h-[55vh] min-h-[300px] lg:h-auto lg:flex-grow bg-white rounded-[1.5rem] lg:rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden relative shrink-0">

          <div className="absolute top-4 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-4 z-[1000] bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl flex gap-1 w-max max-w-[95%]">
            <button
              onClick={() => setAutoPolygonMode(false)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${!autoPolygonMode ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <MousePointer2 className="w-4 h-4 shrink-0" /> <span className="truncate">Manual</span>
            </button>
            <button
              onClick={() => setAutoPolygonMode(true)}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${autoPolygonMode ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <MapPin className="w-4 h-4 shrink-0" /> <span className="truncate">Auto</span>
            </button>
          </div>

          <MapDigitizer onPolygonChange={handlePolygonChange} autoPolygonMode={autoPolygonMode} />
        </div>

        {/* Kolom Form */}
        <div className="lg:w-[400px] shrink-0 bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 flex flex-col space-y-6 h-full overflow-y-auto">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary-600" /> Form Data
            </h2>
            <p className="text-slate-500 text-sm mt-1">Isi rincian parameter bangunan hasil digitasi.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Luas Tapak (m²)</span>
              <span className="text-2xl font-black text-primary-600">{luasTapak} m²</span>
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
                  setFormData({ ...formData, jumlahLantai: lantai, perkiraanLuasLantai: luasTapak * lantai });
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
