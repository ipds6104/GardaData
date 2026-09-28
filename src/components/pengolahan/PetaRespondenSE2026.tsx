import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, useMapEvents, CircleMarker, Popup, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, MapPin, Search, Layers, X, Copy, Check, ExternalLink, 
  RotateCcw, Filter, ChevronRight, Info, LocateFixed, Eye, EyeOff,
  Building2, Home, Briefcase, Users, ShieldCheck, Sparkles,
  SlidersHorizontal, CheckCircle2, Clock, AlertCircle, Compass, Lock,
  Maximize2, Minimize2, ChevronDown, ChevronUp, AlertTriangle, XCircle, FileText, Phone, UserCheck
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { decryptMilitaryPayload } from '../../utils/cryptoSecurity';

// Fix Leaflet Default Icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PetaRespondenSE2026Props {
  onBack: () => void;
}

export interface RespondenPoint {
  i: string;       // safe hashed id (e.g. SE26-A1B2C3D4 or MST-...)
  k: string;       // namaKK
  lt: number;      // lat
  lg: number;      // lng
  d: string;       // desaCode
  dn?: string;     // desaName
  s: string;       // namaSls
  ks: string;      // kodeSls
  u: number;       // jmlUsaha
  nu: string;      // namaUsaha
  kb: string;      // kbli
  st: string;      // status
  sk: string;      // skala
  // Matching SE-ST attributes:
  m?: number;      // 1 if Matching SE-ST
  mKat?: string;   // Kategori: 'Sebagian Ditemukan' | 'Seluruh Usaha Prelist Tidak Ditemukan' | 'Seluruh Usaha Tutup'
  mFound?: string; // Daftar usaha ditemukan
  mNotFound?: string; // Daftar usaha tidak ditemukan
  mClosed?: string; // Daftar usaha tutup
  mFCnt?: number;  // Jml usaha ditemukan
  mNFCnt?: number; // Jml usaha tidak ditemukan
  mCCnt?: number;  // Jml usaha tutup
  mNotes?: string; // Catatan lapangan
  pml?: string;    // Nama PML
  ppl?: string;    // Nama PPL
  telp?: string;   // No Telp Responden
  resp?: string;   // Nama Responden Pemberi Informasi
}

interface KecamatanMeta {
  kecCode: string;
  kecName: string;
  rawKec: string;
  total: number;
  totalBerusaha: number;
  totalNonUsaha: number;
  fileName: string;
  desaList: {
    desaCode: string;
    desaName: string;
    total: number;
    totalBerusaha: number;
    totalNonUsaha: number;
    slsList: { kodeSls: string; namaSls: string; total: number }[];
  }[];
}

interface MetadataIndex {
  totalRawRows: number;
  totalValidPoints: number;
  totalBerusaha: number;
  totalNonUsaha: number;
  security?: {
    standard: string;
    dataProtection: string;
  };
  kecamatanList: KecamatanMeta[];
  statusCounts: Record<string, number>;
  skalaCounts: Record<string, number>;
  generatedAt: string;
}

// Mempawah Center Coordinates
const MEMPAWAH_CENTER: [number, number] = [0.354, 109.18];
const MEMPAWAH_DEFAULT_ZOOM = 11;

// Helper DMS (Degree Minute Second) Converter
function toDMS(val: number, isLat: boolean): string {
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(2);
  
  let dir = '';
  if (isLat) {
    dir = val >= 0 ? 'LU' : 'LS';
  } else {
    dir = val >= 0 ? 'BT' : 'BB';
  }
  
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

// ==========================================
// ELEGANT SEARCHABLE DROPDOWN (PENILAIAN MITRA STYLE)
// ==========================================
interface DropdownOption {
  value: string;
  label: string;
  badge?: string | number;
}

interface SearchableFilterDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  prefix?: string;
  searchPlaceholder?: string;
  className?: string;
  icon?: React.ElementType;
}

const SearchableFilterDropdown: React.FC<SearchableFilterDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  prefix = '',
  searchPlaceholder = 'Cari opsi...',
  className = '',
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value);
  const isDefaultOrAll = value === 'all' || value === 'ALL' || value === 'none' || !value;
  const displayLabel = selectedOpt 
    ? (isDefaultOrAll ? selectedOpt.label : `${prefix}${selectedOpt.label}`) 
    : placeholder;

  const filtered = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
        className={`flex items-center justify-between gap-2 min-w-[145px] sm:min-w-[170px] bg-white border rounded-2xl px-3.5 py-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none shadow-2xs ${
          isOpen 
            ? 'border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-950 shadow-sm' 
            : !isDefaultOrAll
              ? 'border-cyan-300 bg-cyan-50/40 text-cyan-900 hover:border-cyan-400'
              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span className="truncate max-w-[160px]">{displayLabel}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-600' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 top-full left-0 mt-1.5 min-w-[220px] max-w-[320px] w-max bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden flex flex-col"
          >
            {options.length > 5 && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    type="text" 
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-7 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    autoFocus
                  />
                  {search && (
                    <button 
                      type="button" 
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
              {filtered.map(opt => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { 
                      onChange(opt.value); 
                      setIsOpen(false); 
                      setSearch(''); 
                    }}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-50 text-cyan-800 font-extrabold' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span className="truncate mr-2">{opt.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge !== undefined && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-400 italic">Tidak ditemukan</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Map Movement Controller Helper
function MapController({
  targetCenter,
  targetZoom,
  targetBounds
}: {
  targetCenter: [number, number] | null;
  targetZoom?: number;
  targetBounds: L.LatLngBoundsExpression | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, targetZoom || 18, { duration: 1.2 });
    } else if (targetBounds) {
      map.fitBounds(targetBounds, { padding: [30, 30], maxZoom: 18 });
    }
  }, [map, targetCenter, targetZoom, targetBounds]);

  return null;
}

// Locate User GPS
function LocateUserControl() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true });
    map.once('locationfound', (e) => {
      setLocating(false);
      L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: '#0ea5e9',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map).bindPopup('<b>Lokasi Anda Saat Ini</b>').openPopup();
    });
    map.once('locationerror', (err) => {
      setLocating(false);
      alert('Tidak dapat mendeteksi lokasi GPS: ' + err.message);
    });
  };

  return (
    <div className="leaflet-bottom leaflet-right mb-4 mr-3 z-[800] pointer-events-auto">
      <button
        onClick={handleLocate}
        title="Pusatkan ke Lokasi Saya"
        className="p-2.5 sm:p-3 bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 rounded-2xl shadow-lg border border-cyan-100 transition-all active:scale-95 flex items-center gap-1.5 font-bold text-xs cursor-pointer"
      >
        <LocateFixed className={`w-4 h-4 sm:w-5 sm:h-5 ${locating ? 'animate-spin text-cyan-600' : ''}`} />
        <span className="hidden sm:inline">Lokasi Saya</span>
      </button>
    </div>
  );
}

// Super-Fast Viewport Spatial Culling & Dynamic LOD
function ViewportPointsLayer({
  points,
  onSelectPoint,
  selectedPointId,
  onCopyCoord,
  copiedId
}: {
  points: RespondenPoint[];
  onSelectPoint: (p: RespondenPoint) => void;
  selectedPointId?: string;
  onCopyCoord?: (text: string, id: string) => void;
  copiedId?: string | null;
}) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [bounds, setBounds] = useState(map.getBounds());

  // Debounced map bounds updates to keep 60 FPS silky smooth
  useMapEvents({
    zoomend: () => {
      setCurrentZoom(map.getZoom());
      setBounds(map.getBounds());
    },
    moveend: () => {
      setBounds(map.getBounds());
    }
  });

  // Calculate visible points inside viewport bounds
  const visiblePoints = useMemo(() => {
    if (!bounds || points.length === 0) return [];
    
    const south = bounds.getSouth() - 0.01;
    const north = bounds.getNorth() + 0.01;
    const west = bounds.getWest() - 0.01;
    const east = bounds.getEast() + 0.01;

    const visible: RespondenPoint[] = [];
    const len = points.length;

    for (let i = 0; i < len; i++) {
      const p = points[i];
      if (p.lt >= south && p.lt <= north && p.lg >= west && p.lg <= east) {
        visible.push(p);
        if (visible.length >= 3500) break;
      }
    }
    return visible;
  }, [bounds, points]);

  // When zoomed out (< 12), group by desa clusters for lightning-fast summary rendering
  const desaClusters = useMemo(() => {
    if (currentZoom >= 12 || points.length === 0) return [];
    
    const groups: Record<string, { name: string; count: number; usaha: number; latSum: number; lngSum: number }> = {};
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const key = p.d || 'unknown';
      if (!groups[key]) {
        groups[key] = {
          name: p.dn || `Desa ${p.d}`,
          count: 0,
          usaha: 0,
          latSum: 0,
          lngSum: 0
        };
      }
      groups[key].count++;
      if (p.u > 0) groups[key].usaha++;
      groups[key].latSum += p.lt;
      groups[key].lngSum += p.lg;
    }

    return Object.entries(groups).map(([code, g]) => ({
      code,
      name: g.name,
      total: g.count,
      usaha: g.usaha,
      lat: g.latSum / g.count,
      lng: g.lngSum / g.count
    }));
  }, [points, currentZoom]);

  // Zoomed out mode: Render lightweight custom HTML cluster badges
  if (currentZoom < 12) {
    return (
      <>
        {desaClusters.map((cluster) => {
          const customBadge = L.divIcon({
            className: '',
            html: `<div style="transform:translate(-50%, -50%);background:#0891b2;color:white;padding:5px 10px;border-radius:14px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 4px 14px rgba(8,145,178,0.4);border:2px solid white;cursor:pointer;display:flex;align-items:center;gap:5px;">
              <span style="width:7px;height:7px;border-radius:50%;background:#34d399;"></span>
              <span>${cluster.name} (${cluster.total.toLocaleString('id-ID')})</span>
            </div>`,
            iconSize: [0, 0]
          });

          return (
            <Marker
              key={cluster.code}
              position={[cluster.lat, cluster.lng]}
              icon={customBadge}
              eventHandlers={{
                click: () => {
                  map.flyTo([cluster.lat, cluster.lng], 14, { duration: 1 });
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <div className="font-bold text-xs">
                  <p className="text-cyan-900 font-extrabold">{cluster.name}</p>
                  <p className="text-slate-600">Total: {cluster.total} Responden</p>
                  <p className="text-emerald-700 font-semibold">Ada Usaha: {cluster.usaha} ({Math.round(cluster.usaha / cluster.total * 100)}%)</p>
                  <p className="text-[10px] text-cyan-600 mt-0.5">Klik untuk zoom detail</p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </>
    );
  }

  // Zoomed in mode: Crisp Canvas hardware-accelerated circle markers
  return (
    <>
      {visiblePoints.map((point) => {
        const isSelected = selectedPointId === point.i;
        const isMatching = point.m === 1 || !!point.mKat;

        // COLOR RULES:
        // Yellow/Amber (#f59e0b) = Usaha Tidak/Sebagian Ditemukan / Tutup (Matching SE-ST)
        // Green (#059669) = Ada Usaha SE2026
        // Blue (#2563eb) = Tidak Ada Usaha SE2026
        const fillColor = isMatching ? '#f59e0b' : point.u > 0 ? '#059669' : '#2563eb';
        const strokeColor = isSelected ? '#ffffff' : isMatching ? '#d97706' : point.u > 0 ? '#047857' : '#1d4ed8';

        const latDMS = toDMS(point.lt, true);
        const lngDMS = toDMS(point.lg, false);
        const decimalStr = `Long: ${point.lg.toFixed(6)}°, Lat: ${point.lt.toFixed(6)}°`;
        const dmsStr = `${lngDMS}, ${latDMS}`;

        // Helper to format itemized list of businesses
        const renderBusinessList = (raw: string) => {
          if (!raw || raw === '-') return [];
          return raw.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
        };

        const foundList = renderBusinessList(point.mFound || '');
        const notFoundList = renderBusinessList(point.mNotFound || '');
        const closedList = renderBusinessList(point.mClosed || '');

        return (
          <CircleMarker
            key={point.i}
            center={[point.lt, point.lg]}
            radius={isSelected ? 11 : isMatching ? 7.5 : 6}
            pathOptions={{
              fillColor: fillColor,
              color: strokeColor,
              weight: isSelected ? 3.5 : isMatching ? 2 : 1,
              fillOpacity: isSelected ? 1 : 0.88,
            }}
            eventHandlers={{
              click: () => {
                onSelectPoint(point);
              },
            }}
          />
        );
      })}
    </>
  );
}

export const PetaRespondenSE2026: React.FC<PetaRespondenSE2026Props> = ({ onBack }) => {
  const { user } = useAuth();

  // Fullscreen toggle state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Data State
  const [metadata, setMetadata] = useState<MetadataIndex | null>(null);
  const [pointsByKec, setPointsByKec] = useState<Record<string, RespondenPoint[]>>({});
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);
  const [loadingPoints, setLoadingPoints] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // GeoJSON Boundaries State
  const [slsGeoJson, setSlsGeoJson] = useState<any>(null);
  const [desaGeoJson, setDesaGeoJson] = useState<any>(null);
  const [kecGeoJson, setKecGeoJson] = useState<any>(null);

  // Boundary Mode Selection State
  // Options: 'all' | 'kec_desa' | 'kec' | 'desa' | 'sls' | 'none'
  const [boundaryMode, setBoundaryMode] = useState<string>('all');

  // Filters State
  const [selectedKec, setSelectedKec] = useState<string>('all');
  const [selectedDesa, setSelectedDesa] = useState<string>('all');
  const [selectedSls, setSelectedSls] = useState<string>('all');
  const [filterUsaha, setFilterUsaha] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  // Filter Toolbar Collapsible State (Allows hiding filters on Mobile / Desktop to expand map view)
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  // UI Panels
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<RespondenPoint | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Map Movement Target
  const [targetCenter, setTargetCenter] = useState<[number, number] | null>(null);
  const [targetZoom, setTargetZoom] = useState<number>(11);
  const [targetBounds, setTargetBounds] = useState<L.LatLngBoundsExpression | null>(null);

  // 1. Load Metadata Index on Mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoadingMeta(true);
        setLoadError(null);
        const res = await fetch('/data/se2026_responden/metadata_index.json');
        if (!res.ok) throw new Error('Gagal memuat indeks metadata responden.');
        const rawData = await res.json();
        const data: MetadataIndex = await decryptMilitaryPayload<MetadataIndex>(rawData);
        setMetadata(data);

        // Preload default selected kecamatan data (e.g. 100 Mempawah Hilir)
        if (data.kecamatanList && data.kecamatanList.length > 0) {
          const defaultKec = data.kecamatanList[0].kecCode;
          loadKecamatanPoints(defaultKec);
        }
      } catch (err: any) {
        console.error('Metadata load error:', err);
        setLoadError(err.message || 'Gagal memuat metadata.');
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMetadata();
  }, []);

  // 2. Load Boundary GeoJSONs in Background
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const [resKec, resDesa, resSls] = await Promise.all([
          fetch('/data/batas_kecamatan_6104.geojson'),
          fetch('/data/batas_desa_6104.geojson'),
          fetch('/data/batas_sls_6104.geojson')
        ]);

        if (resKec.ok) setKecGeoJson(await resKec.json());
        if (resDesa.ok) setDesaGeoJson(await resDesa.json());
        if (resSls.ok) setSlsGeoJson(await resSls.json());
      } catch (err) {
        console.warn('Failed to load boundary GeoJSONs:', err);
      }
    };

    fetchGeoData();
  }, []);

  // 3. Helper to Load & Decrypt Points for a specific Kecamatan (AES-256-GCM)
  const loadKecamatanPoints = async (kecCode: string) => {
    if (pointsByKec[kecCode]) return pointsByKec[kecCode];

    try {
      setLoadingPoints(true);
      const res = await fetch(`/data/se2026_responden/responden_kec_${kecCode}.json`);
      if (!res.ok) throw new Error(`Gagal memuat data responden kecamatan ${kecCode}`);
      const rawEncrypted = await res.json();
      
      const decryptedData = await decryptMilitaryPayload(rawEncrypted);
      const loadedPoints: RespondenPoint[] = decryptedData.points || [];

      setPointsByKec(prev => ({
        ...prev,
        [kecCode]: loadedPoints
      }));
      return loadedPoints;
    } catch (err: any) {
      console.error(`Error decrypting points for kec ${kecCode}:`, err);
      return [];
    } finally {
      setLoadingPoints(false);
    }
  };

  // 4. Load points when selectedKec changes
  useEffect(() => {
    if (selectedKec !== 'all') {
      loadKecamatanPoints(selectedKec);
    } else if (metadata?.kecamatanList) {
      metadata.kecamatanList.forEach(k => {
        if (!pointsByKec[k.kecCode]) {
          loadKecamatanPoints(k.kecCode);
        }
      });
    }
  }, [selectedKec, metadata]);

  // 5. Active Kecamatan Info & Available Desas
  const activeKecMeta = useMemo(() => {
    if (!metadata || selectedKec === 'all') return null;
    return metadata.kecamatanList.find(k => k.kecCode === selectedKec) || null;
  }, [metadata, selectedKec]);

  const availableDesasList = useMemo(() => {
    if (!activeKecMeta) {
      if (!metadata) return [];
      const allDesas: { desaCode: string; desaName: string; total: number; slsList: any[] }[] = [];
      metadata.kecamatanList.forEach(k => {
        k.desaList.forEach(d => {
          allDesas.push(d);
        });
      });
      return allDesas;
    }
    return activeKecMeta.desaList;
  }, [activeKecMeta, metadata]);

  const availableSlsList = useMemo(() => {
    if (selectedDesa === 'all') return [];
    const desaObj = availableDesasList.find(d => d.desaCode === selectedDesa);
    return desaObj ? desaObj.slsList : [];
  }, [availableDesasList, selectedDesa]);

  // All points combined
  const allLoadedPoints = useMemo(() => {
    let list: RespondenPoint[] = [];
    Object.values(pointsByKec).forEach(subList => {
      list = list.concat(subList);
    });
    return list;
  }, [pointsByKec]);

  // 6. Filtered Points Calculation
  const displayedPoints = useMemo(() => {
    let sourcePoints: RespondenPoint[] = [];

    if (selectedKec === 'all') {
      sourcePoints = allLoadedPoints;
    } else {
      sourcePoints = pointsByKec[selectedKec] || [];
    }

    if (sourcePoints.length === 0) return [];

    let result = sourcePoints;

    // Filter Desa
    if (selectedDesa !== 'all') {
      result = result.filter(p => p.d === selectedDesa);
    }

    // Filter SLS
    if (selectedSls !== 'all') {
      result = result.filter(p => p.ks === selectedSls || p.s === selectedSls);
    }

    // Filter Usaha & Matching SE-ST
    if (filterUsaha === 'ada_usaha') {
      result = result.filter(p => p.u > 0 && !p.m);
    } else if (filterUsaha === 'matching_sest') {
      result = result.filter(p => p.m === 1 || !!p.mKat);
    } else if (filterUsaha === 'non_usaha') {
      result = result.filter(p => p.u === 0 && !p.m);
    }

    // Filter Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p => 
        (p.k && p.k.toLowerCase().includes(q)) ||
        (p.nu && p.nu.toLowerCase().includes(q)) ||
        (p.s && p.s.toLowerCase().includes(q)) ||
        (p.i && p.i.toLowerCase().includes(q)) ||
        (p.kb && p.kb.toLowerCase().includes(q)) ||
        (p.dn && p.dn.toLowerCase().includes(q)) ||
        (p.mKat && p.mKat.toLowerCase().includes(q)) ||
        (p.mFound && p.mFound.toLowerCase().includes(q)) ||
        (p.mNotFound && p.mNotFound.toLowerCase().includes(q)) ||
        (p.mClosed && p.mClosed.toLowerCase().includes(q)) ||
        (p.ppl && p.ppl.toLowerCase().includes(q)) ||
        (p.pml && p.pml.toLowerCase().includes(q)) ||
        (p.resp && p.resp.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allLoadedPoints, pointsByKec, selectedKec, selectedDesa, selectedSls, filterUsaha, searchQuery]);

  // Instant Search Suggestions Dropdown (Top 8 Matches)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const q = searchQuery.trim().toLowerCase();
    
    const matches: RespondenPoint[] = [];
    for (let i = 0; i < allLoadedPoints.length; i++) {
      const p = allLoadedPoints[i];
      if (
        (p.k && p.k.toLowerCase().includes(q)) ||
        (p.nu && p.nu.toLowerCase().includes(q)) ||
        (p.s && p.s.toLowerCase().includes(q)) ||
        (p.i && p.i.toLowerCase().includes(q)) ||
        (p.mKat && p.mKat.toLowerCase().includes(q)) ||
        (p.resp && p.resp.toLowerCase().includes(q))
      ) {
        matches.push(p);
        if (matches.length >= 8) break;
      }
    }
    return matches;
  }, [allLoadedPoints, searchQuery]);

  // Fly to point on select & open popup
  const handleSelectAndZoomToPoint = (pt: RespondenPoint) => {
    setSelectedPoint(pt);
    setTargetCenter([pt.lt, pt.lg]);
    setTargetZoom(19);
    setShowSearchDropdown(false);
  };

  // Handle Enter on Search Bar -> Immediately zoom to first match
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchSuggestions.length > 0) {
        handleSelectAndZoomToPoint(searchSuggestions[0]);
      } else if (displayedPoints.length > 0) {
        handleSelectAndZoomToPoint(displayedPoints[0]);
      }
    }
  };

  // Compute live filtered stats
  const filteredStats = useMemo(() => {
    let total = displayedPoints.length;
    let berUsaha = 0;
    let matchingSEST = 0;
    let nonUsaha = 0;

    for (let i = 0; i < total; i++) {
      const p = displayedPoints[i];
      if (p.m === 1 || p.mKat) matchingSEST++;
      else if (p.u > 0) berUsaha++;
      else nonUsaha++;
    }

    return { total, berUsaha, matchingSEST, nonUsaha };
  }, [displayedPoints]);

  // Handle Copy Helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fly to Mempawah Reset
  const handleResetView = () => {
    setTargetCenter(MEMPAWAH_CENTER);
    setTargetZoom(MEMPAWAH_DEFAULT_ZOOM);
    setSelectedPoint(null);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  // Options for Dropdowns
  const kecamatanOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { value: 'all', label: 'Semua Kecamatan', badge: metadata?.totalValidPoints }
    ];
    if (metadata?.kecamatanList) {
      metadata.kecamatanList.forEach(k => {
        list.push({
          value: k.kecCode,
          label: `[${k.kecCode}] ${k.kecName}`,
          badge: k.total
        });
      });
    }
    return list;
  }, [metadata]);

  const desaOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { value: 'all', label: 'Semua Desa/Kelurahan' }
    ];
    availableDesasList.forEach(d => {
      list.push({
        value: d.desaCode,
        label: `[${d.desaCode}] ${d.desaName}`,
        badge: d.total
      });
    });
    return list;
  }, [availableDesasList]);

  const slsOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { value: 'all', label: 'Semua SLS' }
    ];
    availableSlsList.forEach(s => {
      list.push({
        value: s.kodeSls || s.namaSls,
        label: s.namaSls,
        badge: s.total
      });
    });
    return list;
  }, [availableSlsList]);

  const boundaryOptions: DropdownOption[] = [
    { value: 'all', label: 'Semua Batas (Kec + Desa + SLS)' },
    { value: 'kec_desa', label: 'Batas Kecamatan & Desa' },
    { value: 'kec', label: 'Hanya Batas Kecamatan' },
    { value: 'desa', label: 'Hanya Batas Desa/Kelurahan' },
    { value: 'sls', label: 'Hanya Batas SLS' },
    { value: 'none', label: 'Tanpa Batas Wilayah' },
  ];

  const usahaOptions: DropdownOption[] = [
    { value: 'all', label: 'Semua Responden' },
    { value: 'ada_usaha', label: '🟢 Ada Usaha (SE2026)', badge: metadata?.totalBerusaha },
    { value: 'matching_sest', label: '🟡 Usaha Tidak/Sebagian Ditemukan (Matching SE-ST)', badge: 16524 },
    { value: 'non_usaha', label: '🔵 Tidak Ada Usaha', badge: metadata?.totalNonUsaha },
  ];

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedKec !== 'all') count++;
    if (selectedDesa !== 'all') count++;
    if (selectedSls !== 'all') count++;
    if (filterUsaha !== 'all') count++;
    if (searchQuery.trim() !== '') count++;
    if (boundaryMode !== 'all') count++;
    return count;
  }, [selectedKec, selectedDesa, selectedSls, filterUsaha, searchQuery, boundaryMode]);

  // Active Boundary Layer States based on boundaryMode
  const showKec = boundaryMode === 'all' || boundaryMode === 'kec_desa' || boundaryMode === 'kec';
  const showDesa = boundaryMode === 'all' || boundaryMode === 'kec_desa' || boundaryMode === 'desa';
  const showSls = boundaryMode === 'all' || boundaryMode === 'sls';

  return (
    <div className={`flex flex-col w-full bg-slate-900/5 overflow-hidden select-none transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-[9999] w-screen h-screen bg-slate-900' 
        : 'h-[calc(100vh-5.5rem)] min-h-[620px] rounded-3xl border border-slate-200/80 shadow-lg relative'
    }`}>
      {/* 1. TOP HEADER & STREAMLINED TOOLBAR */}
      <div className="bg-white/95 backdrop-blur-md px-3.5 sm:px-5 py-2.5 border-b border-slate-200/80 flex items-center justify-between gap-2.5 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-slate-800 tracking-tight leading-none">
                  Peta Responden SE2026
                </h1>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-cyan-700" />
                  AES-256
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Fullscreen Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
          {/* Toggle Filter Button (Collapsible / Expandable for Mobile / Desktop) */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
              isFilterOpen
                ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80'
            }`}
            title={isFilterOpen ? 'Sembunyikan Filter & Perluas Peta' : 'Buka Panel Filter'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden xs:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white text-[9px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            {isFilterOpen ? (
              <ChevronUp className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            )}
          </button>

          <button
            onClick={() => setShowStatsModal(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/60 shadow-2xs"
            title="Statistik Sebaran Responden"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Statistik</span>
          </button>

          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border ${
              showDrawer 
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
            }`}
            title="Daftar Responden"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Daftar</span>
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 rounded-xl transition-all border border-slate-200/80 cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Perbesar / Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-700" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. NEAT SEARCHABLE FILTER TOOLBAR (Collapsible / Expandable for Full Map View) */}
      <AnimatePresence initial={false}>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden bg-slate-50/95 px-3.5 sm:px-5 py-2 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0"
          >
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* 1. Kecamatan Dropdown */}
              <SearchableFilterDropdown
                options={kecamatanOptions}
                value={selectedKec}
                onChange={(val) => {
                  setSelectedKec(val);
                  setSelectedDesa('all');
                  setSelectedSls('all');
                }}
                placeholder="Pilih Kecamatan"
                prefix="Kec: "
                searchPlaceholder="Cari Kecamatan..."
                icon={Building2}
              />

              {/* 2. Desa Dropdown */}
              <SearchableFilterDropdown
                options={desaOptions}
                value={selectedDesa}
                onChange={(val) => {
                  setSelectedDesa(val);
                  setSelectedSls('all');
                }}
                placeholder="Pilih Desa"
                prefix="Desa: "
                searchPlaceholder="Cari Desa/Kel..."
                icon={Home}
              />

              {/* 3. SLS Dropdown (jika desa terpilih) */}
              {selectedDesa !== 'all' && availableSlsList.length > 0 && (
                <SearchableFilterDropdown
                  options={slsOptions}
                  value={selectedSls}
                  onChange={setSelectedSls}
                  placeholder="Pilih SLS"
                  prefix="SLS: "
                  searchPlaceholder="Cari SLS..."
                  icon={MapPin}
                />
              )}

              {/* 4. Dropdown Batas Wilayah */}
              <SearchableFilterDropdown
                options={boundaryOptions}
                value={boundaryMode}
                onChange={setBoundaryMode}
                placeholder="Pilih Batas Wilayah"
                prefix="Batas: "
                searchPlaceholder="Pilih opsi batas..."
                icon={Layers}
              />

              {/* 5. Dropdown Status Usaha */}
              <SearchableFilterDropdown
                options={usahaOptions}
                value={filterUsaha}
                onChange={setFilterUsaha}
                placeholder="Status Usaha"
                prefix="Usaha: "
                searchPlaceholder="Filter usaha..."
                icon={Briefcase}
              />
            </div>

            {/* INSTANT SEARCH & AUTO-ZOOM TO COORDINATE */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto relative">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari Nama KK (Tekan Enter utk Zoom)..."
                  className="w-full pl-8 pr-7 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-2xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none shadow-2xs transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Instant Search Suggestions Dropdown with Auto-Zoom on Click */}
                <AnimatePresence>
                  {showSearchDropdown && searchSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[9999] max-h-72 overflow-y-auto custom-scrollbar"
                    >
                      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Hasil Pencarian ({searchSuggestions.length})</span>
                        <span>Klik utk Zoom</span>
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {searchSuggestions.map((item) => (
                          <li key={item.i}>
                            <button
                              onClick={() => handleSelectAndZoomToPoint(item)}
                              className="w-full text-left p-2.5 hover:bg-cyan-50/70 flex items-start justify-between gap-2 transition-colors cursor-pointer group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-xs text-slate-900 group-hover:text-cyan-700 truncate">
                                    👤 {item.k || 'Responden SE2026'}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                                    item.u > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {item.u > 0 ? 'Ada Usaha' : 'Non-Usaha'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  📍 {item.s} • {item.dn || item.d}
                                </p>
                                {item.nu && (
                                  <p className="text-[10px] font-bold text-emerald-700 truncate">
                                    💼 {item.nu}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleResetView}
                className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
                title="Reset Peta ke Mempawah"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN MAP WORKSPACE (Large & Immersion Mode) */}
      <div className="flex-1 w-full h-full relative z-0">
        {/* Floating Quick Open Filter Pill when filter toolbar is hidden */}
        {!isFilterOpen && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => setIsFilterOpen(true)}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[990] bg-white/95 hover:bg-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-slate-200/90 flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-cyan-700 transition-all cursor-pointer group"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600 group-hover:rotate-45 transition-transform" />
            <span>Buka Filter</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-600 text-white text-[10px] font-black leading-none">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
        )}
        {/* Decryption status indicator */}
        {(loadingMeta || loadingPoints) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-2.5 text-xs font-bold text-slate-700">
            <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <span>Memproses data geospasial mikro SE2026...</span>
          </div>
        )}

        <MapContainer
          center={MEMPAWAH_CENTER}
          zoom={MEMPAWAH_DEFAULT_ZOOM}
          maxZoom={22}
          preferCanvas={true}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          {/* Base Layers with MaxZoom up to 22 */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Google Satellite (Detail Tinggi)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                attribution="&copy; Google Maps"
                maxNativeZoom={20}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Google Hybrid (Satelit + Jalan)">
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                attribution="&copy; Google Maps"
                maxNativeZoom={20}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="OpenStreetMap Standard">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
                maxNativeZoom={19}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Esri World Imagery">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri"
                maxNativeZoom={18}
                maxZoom={22}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Dynamic Boundary Overlays controlled by Dropdown */}
          {showKec && kecGeoJson && (
            <GeoJSON
              key={`layer-kecamatan-${boundaryMode}`}
              data={kecGeoJson}
              style={() => ({
                color: '#dc2626',
                weight: 2.5,
                fillOpacity: 0.03,
                dashArray: '4, 4',
              })}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                layer.bindTooltip(`<b>Kecamatan: ${p.nmkec || '-'}</b>`, { sticky: true });
              }}
            />
          )}

          {showDesa && desaGeoJson && (
            <GeoJSON
              key={`layer-desa-${boundaryMode}`}
              data={desaGeoJson}
              style={() => ({
                color: '#f97316',
                weight: 1.5,
                fillOpacity: 0.04,
                dashArray: '2, 3',
              })}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                layer.bindTooltip(`<b>Desa: ${p.nmdesa || '-'}</b><br/>Kecamatan: ${p.nmkec || '-'}`, { sticky: true });
              }}
            />
          )}

          {showSls && slsGeoJson && (
            <GeoJSON
              key={`layer-sls-${boundaryMode}`}
              data={slsGeoJson}
              style={() => ({
                color: '#8b5cf6',
                weight: 1.2,
                fillOpacity: 0.08,
              })}
              onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                layer.bindTooltip(`<b>${p.nmsls || 'SLS'}</b><br/>Desa: ${p.nmdesa || '-'}`, { sticky: true });
              }}
            />
          )}

          {/* Map Movement & GPS Controller */}
          <MapController
            targetCenter={targetCenter}
            targetZoom={targetZoom}
            targetBounds={targetBounds}
          />
          <LocateUserControl />

          {/* High-Performance Viewport Points Layer */}
          <ViewportPointsLayer
            points={displayedPoints}
            onSelectPoint={(p) => setSelectedPoint(p)}
            selectedPointId={selectedPoint?.i}
            onCopyCoord={handleCopy}
            copiedId={copiedId}
          />
        </MapContainer>

        {/* 4. SIMPLIFIED 3-ITEM MAP LEGEND */}
        <div className="absolute bottom-6 left-6 z-[800] bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200/80 max-w-[260px] space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-600" />
              Legenda Peta
            </span>
          </div>
          <div className="space-y-1.5 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 shadow-2xs shrink-0 ring-2 ring-emerald-200"></span>
              <span>🟢 Ada Usaha (SE2026)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-2xs shrink-0 ring-2 ring-amber-200"></span>
              <span>🟡 Usaha Tidak/Sebagian Ditemukan (Matching SE-ST)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-2xs shrink-0 ring-2 ring-blue-200"></span>
              <span>🔵 Tidak Ada Usaha (SE2026)</span>
            </div>
          </div>
        </div>

        {/* 5. SLIDE-OUT DRAWER FOR RESPONDENTS LIST */}
        <AnimatePresence>
          {showDrawer && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-white z-[900] shadow-2xl border-l border-slate-200 flex flex-col pointer-events-auto"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-black">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">Daftar Responden</h3>
                    <p className="text-[11px] text-slate-400">{displayedPoints.length} titik terfilter</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {displayedPoints.slice(0, 150).map((pt) => {
                  const isSelected = selectedPoint?.i === pt.i;
                  const isMatching = pt.m === 1 || !!pt.mKat;
                  return (
                    <button
                      key={pt.i}
                      onClick={() => handleSelectAndZoomToPoint(pt)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-cyan-500 bg-cyan-50/60 ring-2 ring-cyan-200 shadow-sm' 
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        {isMatching ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            🟡 {pt.mKat || 'Matching SE-ST'}
                          </span>
                        ) : (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            pt.u > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {pt.u > 0 ? `Ada Usaha (${pt.u})` : 'Tidak Ada Usaha'}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {pt.lt.toFixed(4)}, {pt.lg.toFixed(4)}
                        </span>
                      </div>

                      <h5 className="font-extrabold text-xs text-slate-900 mt-1.5 truncate">
                        👤 {pt.k || 'Responden'}
                      </h5>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        📍 {pt.s} {pt.dn ? `(${pt.dn})` : ''}
                      </p>

                      {isMatching ? (
                        <div className="mt-1 space-y-0.5 text-[10px]">
                          {pt.mFound && <p className="text-emerald-700 font-bold truncate">✅ Ditemukan: {pt.mFound}</p>}
                          {pt.mNotFound && <p className="text-rose-700 font-bold truncate">❌ Tdk Ditemukan: {pt.mNotFound}</p>}
                          {pt.mClosed && <p className="text-amber-700 font-bold truncate">⚠️ Tutup: {pt.mClosed}</p>}
                        </div>
                      ) : pt.nu ? (
                        <p className="text-[11px] font-bold text-emerald-700 truncate mt-1">
                          💼 {pt.nu}
                        </p>
                      ) : null}
                    </button>
                  );
                })}

                {displayedPoints.length > 150 && (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                    Menampilkan 150 responden pertama dari {displayedPoints.length} responden.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. SWIPEABLE BOTTOM SHEET / MOBILE DRAWER FOR SELECTED RESPONDENT */}
        <AnimatePresence>
          {selectedPoint && (
            <div className="fixed sm:absolute inset-x-0 bottom-0 z-[950] pointer-events-none flex justify-center p-0 sm:p-4">
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.25}
                onDragEnd={(e, info) => {
                  if (info.offset.y > 80 || info.velocity.y > 400) {
                    setSelectedPoint(null);
                  }
                }}
                className="w-full sm:max-w-lg bg-white/95 backdrop-blur-xl border-t sm:border border-slate-200/90 sm:rounded-3xl shadow-2xl pointer-events-auto max-h-[82vh] flex flex-col rounded-t-3xl overflow-hidden touch-pan-y ring-1 ring-black/5"
              >
                {/* Drag Handle Bar for Touch Gestures on Mobile/HP */}
                <div className="pt-2.5 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing bg-slate-50/80 border-b border-slate-100">
                  <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mb-1" />
                  <span className="text-[10px] text-slate-400 font-bold tracking-tight">Geser ke bawah untuk menutup</span>
                </div>

                {/* Header */}
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${
                      (selectedPoint.m === 1 || selectedPoint.mKat)
                        ? 'bg-amber-500 ring-2 ring-amber-200' 
                        : selectedPoint.u > 0 
                        ? 'bg-emerald-500 ring-2 ring-emerald-200' 
                        : 'bg-blue-500 ring-2 ring-blue-200'
                    }`} />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        {selectedPoint.k || 'Responden'}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">ID: {selectedPoint.i}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1 text-slate-800">
                  {/* Status Banner */}
                  {(selectedPoint.m === 1 || selectedPoint.mKat) ? (
                    <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🟡</span>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">Status Matching SE-ST:</span>
                          <span className="text-xs font-extrabold text-amber-950">{selectedPoint.mKat || 'Sebagian Ditemukan'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Matching
                      </span>
                    </div>
                  ) : (
                    <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                      selectedPoint.u > 0 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                        : 'bg-blue-50 border-blue-200 text-blue-950'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{selectedPoint.u > 0 ? '🟢' : '🔵'}</span>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Status Responden SE2026:</span>
                          <span className="text-xs font-extrabold">{selectedPoint.u > 0 ? `Ada Usaha (${selectedPoint.u})` : 'Tidak Ada Usaha'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wilayah */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span className="truncate"><b>SLS:</b> {selectedPoint.s || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pl-5">
                      <span><b>Desa/Kel:</b> {selectedPoint.dn || selectedPoint.d || '-'}</span>
                      {selectedPoint.ks && <span><b>Kode SLS:</b> {selectedPoint.ks}</span>}
                    </div>
                  </div>

                  {/* DETAIL USAHA MATCHING SE-ST */}
                  {(selectedPoint.m === 1 || selectedPoint.mKat) ? (
                    <div className="space-y-2 text-xs">
                      {/* 1. Usaha Ditemukan */}
                      {selectedPoint.mFound && selectedPoint.mFound !== '-' && (
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              Daftar Usaha Ditemukan ({selectedPoint.mFCnt || 1})
                            </span>
                          </div>
                          <div className="space-y-1 pl-5">
                            {selectedPoint.mFound.split(/[;\n]/).map((item, idx) => item.trim() && (
                              <p key={idx} className="text-xs font-bold text-emerald-950 leading-relaxed">
                                • {item.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Usaha Tidak Ditemukan */}
                      {selectedPoint.mNotFound && selectedPoint.mNotFound !== '-' && (
                        <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              Daftar Usaha Tidak Ditemukan ({selectedPoint.mNFCnt || 1})
                            </span>
                          </div>
                          <div className="space-y-1 pl-5">
                            {selectedPoint.mNotFound.split(/[;\n]/).map((item, idx) => item.trim() && (
                              <p key={idx} className="text-xs font-bold text-rose-950 leading-relaxed">
                                • {item.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Usaha Tutup */}
                      {selectedPoint.mClosed && selectedPoint.mClosed !== '-' && (
                        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Daftar Usaha Tutup ({selectedPoint.mCCnt || 1})
                            </span>
                          </div>
                          <div className="space-y-1 pl-5">
                            {selectedPoint.mClosed.split(/[;\n]/).map((item, idx) => item.trim() && (
                              <p key={idx} className="text-xs font-bold text-amber-950 leading-relaxed">
                                • {item.trim()}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Catatan Lapangan */}
                      {selectedPoint.mNotes && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                          <span className="font-bold text-[10px] uppercase text-slate-500 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            Catatan Lapangan:
                          </span>
                          <p className="italic text-slate-800 leading-relaxed">{selectedPoint.mNotes}</p>
                        </div>
                      )}

                      {/* Informasi Petugas Lapangan & Responden */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Petugas Pendataan (PPL):</span>
                          <span className="font-bold text-slate-800">{selectedPoint.ppl || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Petugas Pengawas (PML):</span>
                          <span className="font-bold text-slate-800">{selectedPoint.pml || '-'}</span>
                        </div>
                        {selectedPoint.resp && (
                          <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-slate-600">Pemberi Info: <b>{selectedPoint.resp}</b></span>
                            {selectedPoint.telp && <span className="font-mono text-[11px] text-cyan-700">📞 {selectedPoint.telp}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Info Usaha Biasa (SE2026) */
                    selectedPoint.nu && (
                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                        <p className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-emerald-700" />
                          {selectedPoint.nu}
                        </p>
                        {selectedPoint.kb && <p className="text-[11px] text-emerald-700">{selectedPoint.kb}</p>}
                        {selectedPoint.sk && <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Skala: {selectedPoint.sk}</p>}
                      </div>
                    )
                  )}

                  {/* Geospasial Coordinates Card */}
                  <div className="p-3 bg-cyan-50/60 rounded-2xl border border-cyan-100 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-cyan-700" />
                      Koordinat Geospasial
                    </span>

                    {/* Format Desimal */}
                    <div className="space-y-0.5 text-xs">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Format Desimal (Long, Lat):</span>
                      <div className="font-mono text-slate-800 font-bold bg-white px-2.5 py-1.5 rounded-xl border border-cyan-100 flex items-center justify-between">
                        <span className="truncate">Long: {selectedPoint.lg.toFixed(6)}°, Lat: {selectedPoint.lt.toFixed(6)}°</span>
                        <button
                          onClick={() => handleCopy(`${selectedPoint.lg}, ${selectedPoint.lt}`, selectedPoint.i + '_dec_drawer')}
                          className="text-cyan-600 hover:text-cyan-800 p-1 cursor-pointer ml-1"
                          title="Salin Desimal"
                        >
                          {copiedId === selectedPoint.i + '_dec_drawer' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Format DMS */}
                    <div className="space-y-0.5 text-xs pt-1 border-t border-cyan-100/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Format DMS:</span>
                      <div className="font-mono text-slate-800 font-bold bg-white px-2.5 py-1.5 rounded-xl border border-cyan-100 flex items-center justify-between">
                        <div className="space-y-0.5 text-[11px] truncate">
                          <div><b>Long:</b> {toDMS(selectedPoint.lg, false)}</div>
                          <div><b>Lat:</b> {toDMS(selectedPoint.lt, true)}</div>
                        </div>
                        <button
                          onClick={() => handleCopy(`${toDMS(selectedPoint.lg, false)}, ${toDMS(selectedPoint.lt, true)}`, selectedPoint.i + '_dms_drawer')}
                          className="text-cyan-600 hover:text-cyan-800 p-1 cursor-pointer ml-1 shrink-0"
                          title="Salin DMS"
                        >
                          {copiedId === selectedPoint.i + '_dms_drawer' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Google Maps Link */}
                    <div className="pt-1">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.lt},${selectedPoint.lg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Buka Rute di Google Maps</span>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 7. STATS MODAL DIALOG */}
      <AnimatePresence>
        {showStatsModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatsModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full p-6 sm:p-8 overflow-hidden z-10 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Ringkasan Sebaran Responden SE2026</h3>
                    <p className="text-xs text-slate-500">Statistik agregat se-Kabupaten Mempawah & Matching SE-ST</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Overall Statistics Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-wide">
                    Ringkasan Keseluruhan (Kabupaten Mempawah)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      Ada Usaha (SE2026)
                    </span>
                    <p className="text-2xl font-black text-emerald-900 mt-2">
                      {metadata?.totalBerusaha.toLocaleString('id-ID') || '41.599'}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      Populasi SE2026
                    </span>
                  </div>

                  <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      Matching SE-ST
                    </span>
                    <p className="text-2xl font-black text-amber-900 mt-2">
                      16.524
                    </p>
                    <span className="text-[10px] text-amber-800 font-bold mt-0.5">
                      Sebagian / Tdk Ditemukan / Tutup
                    </span>
                  </div>

                  <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 flex flex-col justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Tidak Ada Usaha
                    </span>
                    <p className="text-2xl font-black text-blue-900 mt-2">
                      {metadata?.totalNonUsaha.toLocaleString('id-ID') || '42.525'}
                    </p>
                    <span className="text-[10px] text-blue-700 font-medium mt-0.5">
                      Non-Usaha Rumah Tangga
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown Matching SE-ST Categories */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  Rincian Kategori Matching SE-ST (16.524 Responden)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 block">Sebagian Ditemukan:</span>
                    <span className="text-sm font-black text-amber-950">7.809 (47,3%)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 block">Seluruh Tutup:</span>
                    <span className="text-sm font-black text-amber-950">5.958 (36,1%)</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 block">Prelist Tdk Ditemukan:</span>
                    <span className="text-sm font-black text-amber-950">2.757 (16,7%)</span>
                  </div>
                </div>
              </div>

              {/* Filtered Active State (If Filter is applied) */}
              {(selectedKec !== 'all' || selectedDesa !== 'all' || selectedSls !== 'all' || filterUsaha !== 'all' || searchQuery) && (
                <div className="p-3.5 bg-cyan-50/60 rounded-2xl border border-cyan-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-cyan-900 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-cyan-700" />
                      Hasil Filter Aktif Saat Ini
                    </span>
                    <span className="font-mono font-bold text-cyan-800">
                      {filteredStats.total.toLocaleString('id-ID')} Responden Terfilter
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-white/90 rounded-xl border border-cyan-100 flex items-center justify-between">
                      <span className="text-emerald-800 font-bold">🟢 Ada Usaha:</span>
                      <span className="font-extrabold text-emerald-950">{filteredStats.berUsaha.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-xl border border-amber-200 flex items-center justify-between bg-amber-50/60">
                      <span className="text-amber-800 font-bold">🟡 Matching:</span>
                      <span className="font-extrabold text-amber-950">{filteredStats.matchingSEST.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="p-2 bg-white/90 rounded-xl border border-cyan-100 flex items-center justify-between">
                      <span className="text-blue-800 font-bold">🔵 Non-Usaha:</span>
                      <span className="font-extrabold text-blue-950">{filteredStats.nonUsaha.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
