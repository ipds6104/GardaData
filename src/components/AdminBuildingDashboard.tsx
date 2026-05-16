import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, LayersControl } from 'react-leaflet';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MeasurementRecord } from '../services/indexeddb';
import { ChevronLeft, BarChart3, MapPin, Loader2, Maximize2, Building2, Database, User } from 'lucide-react';
import { motion } from 'motion/react';
import 'leaflet/dist/leaflet.css';

interface AdminBuildingDashboardProps {
  onBack: () => void;
}

export const AdminBuildingDashboard: React.FC<AdminBuildingDashboardProps> = ({ onBack }) => {
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'building_measurements'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => doc.data() as MeasurementRecord);
      setMeasurements(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching data:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalLuasTapak = measurements.reduce((sum, item) => sum + (item.luasTapak || 0), 0);
  const totalEstimasi = measurements.reduce((sum, item) => sum + (item.perkiraanLuasLantai || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors font-semibold group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Kembali
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Monitoring Luas Bangunan</h1>
          <p className="text-slate-500 text-sm">Dashboard Admin Pemantauan Digitalisasi Bangunan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl"><Building2 className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Bangunan</p>
            <p className="text-3xl font-black text-slate-900">{measurements.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-secondary-50 text-secondary-600 rounded-2xl"><MapPin className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Luas Tapak</p>
            <p className="text-3xl font-black text-slate-900">{totalLuasTapak.toFixed(2)} m²</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><BarChart3 className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Perkiraan Lantai</p>
            <p className="text-3xl font-black text-slate-900">{totalEstimasi.toFixed(2)} m²</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow overflow-hidden pb-8">
        
        {/* Kolom Daftar Data (Tabel) */}
        <div className="w-full lg:w-1/3 bg-white rounded-[2rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden shrink-0 h-[400px] lg:h-auto">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-primary-600" /> Log Pengukuran
            </h2>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {measurements.length === 0 && !loading && (
              <div className="text-center text-slate-400 py-8 text-sm font-medium">Belum ada data masuk.</div>
            )}
            {measurements.map((record) => (
              <div key={record.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-primary-200 hover:shadow-md transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">{record.jenisBangunan}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{new Date(record.timestamp).toLocaleDateString('id-ID')}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400"/> {record.petugasName}</p>
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">L. Tapak</p>
                    <p className="text-sm font-bold text-primary-600">{record.luasTapak.toFixed(1)} m²</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Lantai</p>
                    <p className="text-sm font-bold text-secondary-600">{record.perkiraanLuasLantai.toFixed(1)} m²</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Peta */}
        <div className="w-full lg:flex-grow bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden relative shrink-0 h-[50vh] lg:h-auto">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
            </div>
          ) : null}
          
          <MapContainer 
            center={[-0.320448, 108.955439]} 
            zoom={14} 
            maxZoom={22}
            scrollWheelZoom={true} 
            className="w-full h-full z-0"
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Google Satellite">
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                  attribution='&copy; Google'
                  maxNativeZoom={20}
                  maxZoom={22}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Esri World Imagery">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  maxNativeZoom={18}
                  maxZoom={22}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                  maxNativeZoom={18}
                  maxZoom={22}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {measurements.map((record) => (
              record.geojson && (
                <GeoJSON 
                  key={record.id} 
                  data={record.geojson}
                  pathOptions={{ 
                    color: record.syncStatus === 'synced' ? '#10b981' : '#f59e0b',
                    fillColor: record.syncStatus === 'synced' ? '#34d399' : '#fbbf24',
                    weight: 2,
                    fillOpacity: 0.4
                  }}
                >
                  <Popup className="rounded-xl">
                    <div className="space-y-2 p-1 min-w-[200px]">
                      <div className="border-b border-slate-100 pb-2 mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Petugas</p>
                        <p className="font-bold text-slate-900">{record.petugasName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis</p>
                          <p className="font-bold text-sm text-slate-700">{record.jenisBangunan}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lantai</p>
                          <p className="font-bold text-sm text-slate-700">{record.jumlahLantai}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">L. Tapak</p>
                          <p className="font-bold text-sm text-primary-600">{record.luasTapak.toFixed(1)} m²</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Lantai</p>
                          <p className="font-bold text-sm text-secondary-600">{record.perkiraanLuasLantai.toFixed(1)} m²</p>
                        </div>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 text-center">{new Date(record.timestamp).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </Popup>
                </GeoJSON>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
