import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, MapPin, Search, Layers, X, Copy, Check, ExternalLink, 
  ShieldAlert, RotateCcw, Filter, ChevronRight, Info,
  Navigation, LocateFixed, SlidersHorizontal, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AdminSLSDashboardProps {
  onBack: () => void;
}

// Helper untuk menghitung titik pusat (centroid) poligon sederhana
function getPolygonCentroid(feature: any): [number, number] | null {
  try {
    if (!feature || !feature.geometry) return null;
    const geom = feature.geometry;
    let coords: number[][] = [];
    if (geom.type === 'Polygon') {
      coords = geom.coordinates[0];
    } else if (geom.type === 'MultiPolygon') {
      coords = geom.coordinates[0][0];
    }
    if (!coords || coords.length === 0) return null;
    
    let sumX = 0;
    let sumY = 0;
    for (const pt of coords) {
      sumX += pt[0];
      sumY += pt[1];
    }
    const lng = sumX / coords.length;
    const lat = sumY / coords.length;
    return [lat, lng];
  } catch (err) {
    return null;
  }
}

// Komponen pengontrol map (FitBounds & Focus)
function MapController({ 
  targetBounds, 
  targetCenter 
}: { 
  targetBounds: L.LatLngBoundsExpression | null; 
  targetCenter: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, 17, { duration: 1.2 });
    } else if (targetBounds) {
      map.fitBounds(targetBounds, { padding: [30, 30], maxZoom: 18 });
    }
  }, [map, targetBounds, targetCenter]);

  return null;
}

// Komponen penemu lokasi GPS pengguna
function LocateUserControl() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 16 });
    map.once('locationfound', (e) => {
      setLocating(false);
      L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: '#ea580c',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map).bindPopup('<b>Lokasi Anda Saat Ini</b>').openPopup();
    });
    map.once('locationerror', (err) => {
      setLocating(false);
      alert('Tidak dapat mendeteksi lokasi GPS Anda: ' + err.message);
    });
  };

  return (
    <div className="leaflet-bottom leaflet-right mb-4 mr-3 z-[800] pointer-events-auto">
      <button
        onClick={handleLocate}
        title="Pusatkan ke Lokasi Saya"
        className="p-2.5 sm:p-3 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-2xl shadow-lg border border-orange-100 transition-all active:scale-95 flex items-center gap-1.5 font-bold text-xs"
      >
        <LocateFixed className={`w-4 h-4 sm:w-5 sm:h-5 ${locating ? 'animate-spin text-orange-600' : ''}`} />
        <span className="hidden sm:inline">Lokasi Saya</span>
      </button>
    </div>
  );
}

export const AdminSLSDashboard: React.FC<AdminSLSDashboardProps> = ({ onBack }) => {
  const { user } = useAuth();

  // State data GeoJSON
  const [slsGeoJson, setSlsGeoJson] = useState<any>(null);
  const [kecGeoJson, setKecGeoJson] = useState<any>(null);
  const [desaGeoJson, setDesaGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'mysql' | 'local'>('local');
  const [error, setError] = useState<string | null>(null);

  // State filter & pencarian
  const [selectedKec, setSelectedKec] = useState<string>('all');
  const [selectedDesa, setSelectedDesa] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showListSidebar, setShowListSidebar] = useState<boolean>(false);
  const [showMobileFilter, setShowMobileFilter] = useState<boolean>(false);

  // State layer visibility
  const [layerConfig, setLayerConfig] = useState({
    showSls: true,
    showDesa: true,
    showKecamatan: true,
  });

  // State detail SLS yang dipilih
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  // State map target
  const [targetBounds, setTargetBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);

  // Muat data dari Backend MySQL (dengan fallback lokal)
  useEffect(() => {
    let isMounted = true;
    const loadGeoData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('navigasi_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const baseUrl = (import.meta as any).env.VITE_API_URL || '';

        // 1. Muat SLS: Coba dari MySQL Backend API terlebih dahulu
        let slsData = null;
        try {
          const slsApiRes = await fetch(`${baseUrl}/api/sls`, { headers });
          if (slsApiRes.ok) {
            slsData = await slsApiRes.json();
            if (slsData?.features && slsData.features.length > 0) {
              setDataSource('mysql');
              console.log(`✅ Dimuat dari MySQL Backend: ${slsData.features.length} SLS`);
            } else {
              throw new Error('Data MySQL kosong');
            }
          } else {
            throw new Error('API status: ' + slsApiRes.status);
          }
        } catch (apiErr) {
          console.warn('⚠️ Gagal memuat dari MySQL Backend API, fallback ke GeoJSON lokal:', apiErr);
          const fallbackRes = await fetch('/data/batas_sls_6104.geojson');
          if (!fallbackRes.ok) throw new Error(`Gagal memuat batas SLS (${fallbackRes.status})`);
          slsData = await fallbackRes.json();
          setDataSource('local');
        }

        // 2. Muat Batas Kecamatan dan Desa
        const [kecRes, desaRes] = await Promise.all([
          fetch('/data/batas_kecamatan_6104.geojson'),
          fetch('/data/batas_desa_6104.geojson')
        ]);

        const kecData = kecRes.ok ? await kecRes.json() : null;
        const desaData = desaRes.ok ? await desaRes.json() : null;

        if (isMounted) {
          setSlsGeoJson(slsData);
          setKecGeoJson(kecData);
          setDesaGeoJson(desaData);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading geo data:', err);
        if (isMounted) {
          setError(err.message || 'Gagal memuat data geospasial.');
          setLoading(false);
        }
      }
    };

    loadGeoData();
    return () => { isMounted = false; };
  }, []);

  // Proteksi hak akses role admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-orange-50 text-orange-600 rounded-3xl mb-4 border border-orange-100 shadow-sm">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Akses Terbatas</h2>
        <p className="text-slate-500 max-w-md text-sm mb-6">
          Fitur Peta Batas SLS Live hanya dapat diakses oleh akun dengan peran <strong>Administrator</strong>.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all shadow-md"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Ekstraksi daftar kecamatan unik
  const kecamatanList = useMemo(() => {
    if (!slsGeoJson?.features) return [];
    const kecSet = new Set<string>();
    slsGeoJson.features.forEach((f: any) => {
      if (f.properties?.nmkec) kecSet.add(f.properties.nmkec.trim());
    });
    return Array.from(kecSet).sort();
  }, [slsGeoJson]);

  // Ekstraksi daftar desa unik
  const desaList = useMemo(() => {
    if (!slsGeoJson?.features) return [];
    const desaSet = new Set<string>();
    slsGeoJson.features.forEach((f: any) => {
      const kec = f.properties?.nmkec?.trim();
      const desa = f.properties?.nmdesa?.trim();
      if (!desa) return;
      if (selectedKec === 'all' || kec === selectedKec) {
        desaSet.add(desa);
      }
    });
    return Array.from(desaSet).sort();
  }, [slsGeoJson, selectedKec]);

  // Filter fitur SLS
  const filteredFeatures = useMemo(() => {
    if (!slsGeoJson?.features) return [];
    return slsGeoJson.features.filter((f: any) => {
      const p = f.properties || {};
      const matchKec = selectedKec === 'all' || p.nmkec?.trim().toUpperCase() === selectedKec.toUpperCase();
      const matchDesa = selectedDesa === 'all' || p.nmdesa?.trim().toUpperCase() === selectedDesa.toUpperCase();
      
      let matchQuery = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nmsls = (p.nmsls || '').toLowerCase();
        const idsls = (p.idsls || '').toLowerCase();
        const kdsls = (p.kdsls || '').toLowerCase();
        const nmdesa = (p.nmdesa || '').toLowerCase();
        const nmkec = (p.nmkec || '').toLowerCase();
        matchQuery = nmsls.includes(q) || idsls.includes(q) || kdsls.includes(q) || nmdesa.includes(q) || nmkec.includes(q);
      }

      return matchKec && matchDesa && matchQuery;
    });
  }, [slsGeoJson, selectedKec, selectedDesa, searchQuery]);

  // Hitung jumlah filter aktif
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedKec !== 'all') count++;
    if (selectedDesa !== 'all') count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [selectedKec, selectedDesa, searchQuery]);

  // Handle perubahan filter Kecamatan
  const handleKecChange = (kec: string) => {
    setSelectedKec(kec);
    setSelectedDesa('all');
    setSelectedFeature(null);
    setTargetCenter(null);

    if (kec === 'all') {
      setTargetBounds([
        [0.008, 108.599],
        [0.690, 109.371]
      ]);
    } else {
      if (kecGeoJson?.features) {
        const kecFeat = kecGeoJson.features.find((f: any) => 
          f.properties?.nmkec?.trim().toUpperCase() === kec.toUpperCase()
        );
        if (kecFeat) {
          const lGeo = L.geoJSON(kecFeat);
          setTargetBounds(lGeo.getBounds());
          return;
        }
      }
      const slsInKec = slsGeoJson.features.filter((f: any) => f.properties?.nmkec?.trim().toUpperCase() === kec.toUpperCase());
      if (slsInKec.length > 0) {
        const lGeo = L.geoJSON({ type: 'FeatureCollection', features: slsInKec } as any);
        setTargetBounds(lGeo.getBounds());
      }
    }
  };

  // Handle perubahan filter Desa
  const handleDesaChange = (desa: string) => {
    setSelectedDesa(desa);
    setSelectedFeature(null);
    setTargetCenter(null);

    if (desa === 'all') {
      handleKecChange(selectedKec);
    } else {
      if (desaGeoJson?.features) {
        const desaFeat = desaGeoJson.features.find((f: any) => 
          f.properties?.nmdesa?.trim().toUpperCase() === desa.toUpperCase() &&
          (selectedKec === 'all' || f.properties?.nmkec?.trim().toUpperCase() === selectedKec.toUpperCase())
        );
        if (desaFeat) {
          const lGeo = L.geoJSON(desaFeat);
          setTargetBounds(lGeo.getBounds());
          return;
        }
      }
      const slsInDesa = slsGeoJson.features.filter((f: any) => f.properties?.nmdesa?.trim().toUpperCase() === desa.toUpperCase());
      if (slsInDesa.length > 0) {
        const lGeo = L.geoJSON({ type: 'FeatureCollection', features: slsInDesa } as any);
        setTargetBounds(lGeo.getBounds());
      }
    }
  };

  // Handle klik/pilih SLS
  const handleSelectSLS = useCallback((feature: any) => {
    setSelectedFeature(feature);
    const centroid = getPolygonCentroid(feature);
    if (centroid) {
      setTargetCenter(centroid);
    } else {
      const lGeo = L.geoJSON(feature);
      setTargetBounds(lGeo.getBounds());
    }
  }, []);

  // Salin ID SLS
  const handleCopyId = (id?: string) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Format luas area
  const formatLuas = (val?: string | number) => {
    if (val === undefined || val === null || val === '') return '-';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '-';
    const ha = num * 100;
    const m2 = num * 1000000;
    if (ha < 1) {
      return `${m2.toLocaleString('id-ID', { maximumFractionDigits: 1 })} m² (${ha.toFixed(2)} Ha)`;
    }
    return `${ha.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha (${num.toFixed(3)} km²)`;
  };

  // GeoJSON data terfilter
  const filteredGeoJsonData = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
  }, [filteredFeatures]);

  return (
    <div className="relative flex flex-col h-[calc(100dvh-5rem)] -mx-4 -mt-6 sm:-mx-6 sm:-mt-8 overflow-hidden bg-stone-100">
      
      {/* TOP FLOATING NAV BAR - Responsif Mobile & Desktop */}
      <header className="absolute top-2 left-2 right-2 sm:top-3 sm:left-4 sm:right-4 z-[900] pointer-events-auto flex items-center justify-between gap-2">
        {/* Tombol Kembali & Judul Singkat */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-md border border-orange-100 shrink-0">
          <button
            onClick={onBack}
            className="p-1 hover:bg-orange-50 rounded-lg text-slate-600 hover:text-orange-600 transition-colors"
            title="Kembali"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-black text-slate-800 tracking-tight leading-none">
                Batas SLS Live
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                MySQL {dataSource === 'mysql' ? '● Live' : '● Local'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              Kab. Mempawah ({filteredFeatures.length} SLS)
            </p>
          </div>
        </div>

        {/* Search Bar Tengah (Desktop & Tablet) */}
        <div className="hidden md:flex items-center bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-orange-100 flex-grow max-w-md mx-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Cari nama SLS (RT/Dusun), ID SLS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-0.5 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Kanan: Tombol Filter, Daftar, & Reset */}
        <div className="flex items-center gap-1.5">
          {/* Tombol Buka Filter Mobile */}
          <button
            onClick={() => setShowMobileFilter(true)}
            className={`px-3 py-2 rounded-2xl shadow-md border text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFiltersCount > 0
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white/95 backdrop-blur-md text-slate-700 border-orange-100 hover:bg-orange-50'
            }`}
            title="Filter Wilayah & Layer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-orange-600 text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Tombol Buka List Sidebar */}
          <button
            onClick={() => setShowListSidebar(!showListSidebar)}
            className={`px-3 py-2 rounded-2xl shadow-md border text-xs font-bold transition-all flex items-center gap-1.5 ${
              showListSidebar
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white/95 backdrop-blur-md text-slate-700 border-orange-100 hover:bg-orange-50'
            }`}
            title="Daftar Wilayah SLS"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Daftar</span>
            <span className="text-[10px] opacity-80">({filteredFeatures.length})</span>
          </button>

          {/* Tombol Reset Zoom */}
          <button
            onClick={() => {
              setSelectedKec('all');
              setSelectedDesa('all');
              setSearchQuery('');
              setSelectedFeature(null);
              setTargetBounds([
                [0.008, 108.599],
                [0.690, 109.371]
              ]);
              setTargetCenter(null);
            }}
            className="p-2 bg-white/95 backdrop-blur-md hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-2xl shadow-md border border-orange-100 transition-colors"
            title="Reset Peta ke Seluruh Mempawah"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* FILTER DRAWER / MODAL UNTUK HP DAN DESKTOP */}
      <AnimatePresence>
        {showMobileFilter && (
          <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="w-full sm:max-w-lg bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl border border-orange-100 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Filter Modal Header */}
              <div className="p-4 border-b border-orange-100/60 bg-[#fff7ed] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-orange-600" />
                  <h3 className="font-black text-slate-800 text-sm tracking-tight">Filter Wilayah & Lapisan</h3>
                </div>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="p-1.5 rounded-xl hover:bg-orange-100/60 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Body */}
              <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar text-xs">
                
                {/* Search Bar Input (terutama untuk mobile) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Pencarian Teks SLS
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ketik RT, RW, Dusun, atau ID SLS..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 focus:bg-white focus:border-orange-500 outline-none"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdown Kecamatan */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Kecamatan
                  </label>
                  <select
                    value={selectedKec}
                    onChange={(e) => handleKecChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-500"
                  >
                    <option value="all">Semua Kecamatan ({kecamatanList.length})</option>
                    {kecamatanList.map(kec => (
                      <option key={kec} value={kec}>{kec}</option>
                    ))}
                  </select>
                </div>

                {/* Dropdown Desa */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Desa / Kelurahan
                  </label>
                  <select
                    value={selectedDesa}
                    onChange={(e) => handleDesaChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 font-bold text-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-500"
                  >
                    <option value="all">Semua Desa ({desaList.length})</option>
                    {desaList.map(desa => (
                      <option key={desa} value={desa}>{desa}</option>
                    ))}
                  </select>
                </div>

                {/* Toggle Layer */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Visibilitas Garis Batas
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setLayerConfig(p => ({ ...p, showKecamatan: !p.showKecamatan }))}
                      className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                        layerConfig.showKecamatan 
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="w-3 h-1 bg-indigo-600 rounded-full mx-auto mb-1"></div>
                      Kecamatan
                    </button>
                    <button
                      onClick={() => setLayerConfig(p => ({ ...p, showDesa: !p.showDesa }))}
                      className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                        layerConfig.showDesa 
                          ? 'bg-amber-50 border-amber-300 text-amber-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="w-3 h-1 bg-amber-600 rounded-full mx-auto mb-1"></div>
                      Desa
                    </button>
                    <button
                      onClick={() => setLayerConfig(p => ({ ...p, showSls: !p.showSls }))}
                      className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                        layerConfig.showSls 
                          ? 'bg-orange-50 border-orange-300 text-orange-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="w-3 h-1 bg-orange-600 rounded-full mx-auto mb-1"></div>
                      Batas SLS
                    </button>
                  </div>
                </div>

              </div>

              {/* Filter Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setSelectedKec('all');
                    setSelectedDesa('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Reset Filter
                </button>
                <button
                  onClick={() => setShowMobileFilter(false)}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition-all"
                >
                  Terapkan ({filteredFeatures.length} SLS)
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEWPORT PETA */}
      <div className="relative flex-grow w-full h-full">
        
        {/* Loading Indicator */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[1100] flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="mt-4 font-black text-slate-800 tracking-tight text-sm">Memuat Data SLS dari MySQL...</p>
            <p className="text-xs text-slate-500 mt-1">Menyiapkan 1.327 batas wilayah Kabupaten Mempawah</p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="absolute top-16 left-4 right-4 max-w-md mx-auto bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl shadow-lg z-[1100] flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-grow">
              <p className="font-bold text-xs">Peringatan Data</p>
              <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Leaflet Interactive Map */}
        <MapContainer
          center={[0.35, 108.95]}
          zoom={11}
          minZoom={9}
          maxZoom={22}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          {/* Base Layer Switcher */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Google Satellite (Hybrid)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution='&copy; Google Maps'
                maxNativeZoom={20}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Google Satellite (Polos)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                attribution='&copy; Google Maps'
                maxNativeZoom={20}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Google Streets (Jalan)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                attribution='&copy; Google Maps'
                maxNativeZoom={20}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Esri World Imagery">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; Esri'
                maxNativeZoom={18}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
                maxNativeZoom={18}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Map Controllers */}
          <MapController targetBounds={targetBounds} targetCenter={targetCenter} />
          <LocateUserControl />

          {/* Layer Batas Kecamatan */}
          {layerConfig.showKecamatan && kecGeoJson && (
            <GeoJSON
              key={`kec-${kecGeoJson.features?.length}`}
              data={kecGeoJson}
              style={() => ({
                color: '#4338ca',
                weight: 3,
                opacity: 0.85,
                dashArray: '8, 6',
                fillColor: 'transparent',
                fillOpacity: 0
              })}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                layer.bindTooltip(`Kecamatan ${p.nmkec || ''}`, {
                  sticky: true,
                  className: 'bg-indigo-950 text-white font-black text-xs px-2 py-1 rounded-lg shadow-md border border-indigo-400'
                });
              }}
            />
          )}

          {/* Layer Batas Desa */}
          {layerConfig.showDesa && desaGeoJson && (
            <GeoJSON
              key={`desa-${desaGeoJson.features?.length}`}
              data={desaGeoJson}
              style={() => ({
                color: '#d97706',
                weight: 2,
                opacity: 0.8,
                dashArray: '5, 5',
                fillColor: '#f59e0b',
                fillOpacity: 0.04
              })}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                layer.bindTooltip(`Desa ${p.nmdesa || ''} (${p.nmkec || ''})`, {
                  sticky: true,
                  className: 'bg-amber-950 text-white font-bold text-xs px-2 py-1 rounded-lg shadow-md border border-amber-400'
                });
              }}
            />
          )}

          {/* Layer Batas SLS */}
          {layerConfig.showSls && filteredGeoJsonData && (
            <GeoJSON
              key={`sls-${filteredFeatures.length}-${selectedFeature?.properties?.idsls || ''}`}
              data={filteredGeoJsonData as any}
              style={(feature) => {
                const isSelected = selectedFeature?.properties?.idsls === feature?.properties?.idsls;
                if (isSelected) {
                  return {
                    color: '#c2410c', // Dark warm peach/terracotta border
                    weight: 3.5,
                    fillColor: '#fdba74', // Soft peach highlight
                    fillOpacity: 0.7,
                    dashArray: ''
                  };
                }
                return {
                  color: '#0284c7',
                  weight: 1.5,
                  opacity: 0.85,
                  fillColor: '#38bdf8',
                  fillOpacity: 0.2,
                  dashArray: ''
                };
              }}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};

                layer.on({
                  click: () => {
                    handleSelectSLS(feature);
                  },
                  mouseover: (e: any) => {
                    const l = e.target;
                    if (selectedFeature?.properties?.idsls !== p.idsls) {
                      l.setStyle({
                        weight: 2.5,
                        fillOpacity: 0.5,
                        color: '#0369a1'
                      });
                    }
                  },
                  mouseout: (e: any) => {
                    const l = e.target;
                    if (selectedFeature?.properties?.idsls !== p.idsls) {
                      l.setStyle({
                        weight: 1.5,
                        fillOpacity: 0.2,
                        color: '#0284c7'
                      });
                    }
                  }
                });

                layer.bindTooltip(
                  `<div class="text-left font-sans">
                    <p class="font-black text-xs text-slate-900 leading-tight">${p.nmsls || 'Tanpa Nama SLS'}</p>
                    <p class="text-[10px] text-slate-500 font-bold">${p.nmdesa || ''} • ${p.nmkec || ''}</p>
                  </div>`, 
                  { sticky: true, className: 'rounded-xl shadow-lg border border-slate-200' }
                );
              }}
            />
          )}

        </MapContainer>

        {/* FLOATING SIDEBAR: DAFTAR SLS (Kiri di Desktop, Bottom/Full di Mobile) */}
        <AnimatePresence>
          {showListSidebar && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="absolute left-2 right-2 sm:right-auto sm:left-4 top-16 sm:top-20 bottom-4 sm:w-88 md:w-96 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-100 z-[1000] flex flex-col overflow-hidden"
            >
              {/* Header List */}
              <div className="p-4 border-b border-orange-100/70 flex items-center justify-between bg-[#fff7ed]">
                <div>
                  <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    Daftar SLS Terfilter
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {filteredFeatures.length} SLS ditemukan
                  </p>
                </div>
                <button
                  onClick={() => setShowListSidebar(false)}
                  className="p-1.5 hover:bg-orange-100/60 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List Content */}
              <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {filteredFeatures.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <p className="text-slate-400 text-xs">Tidak ada SLS yang cocok dengan filter.</p>
                  </div>
                ) : (
                  filteredFeatures.map((feat: any, idx: number) => {
                    const p = feat.properties || {};
                    const isSelected = selectedFeature?.properties?.idsls === p.idsls;
                    return (
                      <div
                        key={p.idsls || idx}
                        onClick={() => {
                          handleSelectSLS(feat);
                          // Di mobile, tutup list setelah memilih agar peta dan detail terlihat
                          if (window.innerWidth < 640) {
                            setShowListSidebar(false);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ffedd5] border-[#fdba74] shadow-xs'
                            : 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-grow">
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 bg-orange-100/80 text-orange-900 rounded-md">
                              {p.idsls || p.kdsls}
                            </span>
                            <h4 className="font-bold text-slate-800 text-xs mt-1 leading-snug">
                              {p.nmsls || 'Tanpa Nama'}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {p.nmdesa}, Kec. {p.nmkec}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-orange-600' : 'text-slate-300'}`} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* DETAIL POPUP SLS - DESAIN WARNA PEACH KALEM (SOLID, NO GRADIENT, BOTTOM-SHEET ON MOBILE) */}
        <AnimatePresence>
          {selectedFeature && (
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="fixed sm:absolute bottom-0 inset-x-0 sm:inset-x-auto sm:right-4 sm:top-16 sm:bottom-4 w-full sm:w-96 max-h-[75vh] sm:max-h-none bg-white rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl border border-[#fed7aa] z-[1050] flex flex-col overflow-hidden"
            >
              
              {/* Drag Handle Bar untuk Mobile */}
              <div className="sm:hidden w-12 h-1.5 bg-orange-200 rounded-full mx-auto my-2 shrink-0"></div>

              {/* Detail Header: Solid Peach Kalem (No Gradient) */}
              <div className="px-5 py-4 border-b border-[#fed7aa] bg-[#ffedd5] relative shrink-0">
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="absolute top-4 right-4 p-1.5 bg-white/70 hover:bg-white text-[#7c2d12] rounded-xl transition-colors shadow-xs"
                  title="Tutup Detail"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="pr-8">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#fed7aa] text-[#7c2d12] uppercase tracking-wider mb-1.5 border border-[#fdba74]">
                    Detail Satuan Lingkungan Setempat
                  </span>
                  <h3 className="font-black text-sm sm:text-base text-[#431407] leading-tight tracking-tight">
                    {selectedFeature.properties?.nmsls || 'SLS Tanpa Nama'}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs font-bold text-[#9a3412] bg-white/80 px-2 py-0.5 rounded-md border border-[#fed7aa]">
                      ID: {selectedFeature.properties?.idsls || '-'}
                    </span>
                    <button
                      onClick={() => handleCopyId(selectedFeature.properties?.idsls)}
                      className="p-1 hover:bg-white/90 text-[#7c2d12] rounded-md transition-colors"
                      title="Salin ID SLS"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detail Body Content */}
              <div className="flex-grow overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar text-xs">
                
                {/* Wilayah Administrasi Card */}
                <div className="bg-[#fff7ed] p-3.5 rounded-2xl border border-[#fed7aa] space-y-2">
                  <p className="font-black text-[#9a3412] uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" /> Wilayah Administrasi BPS
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <p className="text-[10px] text-[#9a3412]/80 font-bold">Kecamatan</p>
                      <p className="font-black text-[#431407] text-xs">
                        {selectedFeature.properties?.nmkec || '-'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">Kode: {selectedFeature.properties?.kdkec || '-'}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#9a3412]/80 font-bold">Desa / Kelurahan</p>
                      <p className="font-black text-[#431407] text-xs">
                        {selectedFeature.properties?.nmdesa || '-'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono">Kode: {selectedFeature.properties?.kddesa || '-'}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#fed7aa]/60 pt-2 grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Kabupaten</p>
                      <p className="font-bold text-slate-800 text-xs">
                        {selectedFeature.properties?.nmkab || 'MEMPAWAH'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Provinsi</p>
                      <p className="font-bold text-slate-800 text-xs">
                        {selectedFeature.properties?.nmprov || 'KALIMANTAN BARAT'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Luas & Muatan Card */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/60">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Perkiraan Luas</p>
                    <p className="font-black text-emerald-950 text-xs sm:text-sm mt-1">
                      {formatLuas(selectedFeature.properties?.luas)}
                    </p>
                  </div>

                  <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/60">
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Muatan SLS</p>
                    <p className="font-black text-amber-950 text-xs sm:text-sm mt-1">
                      {selectedFeature.properties?.muatan || selectedFeature.properties?.kk || 'Standar'}
                    </p>
                  </div>
                </div>

                {/* Informasi Teknis */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Kode SLS:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedFeature.properties?.kdsls || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Sub SLS:</span>
                    <span className="font-bold text-slate-800">{selectedFeature.properties?.subsls || '0'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Sumber Data:</span>
                    <span className="font-bold text-slate-800">{selectedFeature.properties?.sumber || 'BPS Kabupaten Mempawah'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Tahun / Periode:</span>
                    <span className="font-bold text-slate-800">{selectedFeature.properties?.periode || '2024'}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons: Solid Peach / Terracotta, No Gradient */}
              <div className="p-4 border-t border-[#fed7aa] bg-[#fff7ed] flex flex-col gap-2 shrink-0">
                {(() => {
                  const centroid = getPolygonCentroid(selectedFeature);
                  if (!centroid) return null;
                  const [lat, lng] = centroid;
                  const gmapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                  return (
                    <a
                      href={gmapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 shadow-sm transition-all text-xs active:scale-[0.98]"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Buka Rute di Google Maps Live</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  );
                })()}

                <button
                  onClick={() => {
                    const centroid = getPolygonCentroid(selectedFeature);
                    if (centroid) {
                      setTargetCenter(centroid);
                    }
                  }}
                  className="w-full py-2 px-4 bg-white hover:bg-orange-50 text-[#7c2d12] border border-[#fed7aa] font-bold rounded-xl text-center text-xs transition-colors"
                >
                  Pusatkan Peta ke SLS Ini
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
};
