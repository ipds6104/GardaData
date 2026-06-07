import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMapEvents, LayersControl, useMap, Marker, Circle, Popup, GeoJSON as LGeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { generateSimulationRectangle } from '../../utils/geospatial';
import { Check, Undo2, X, PenTool, MousePointer2 } from 'lucide-react';

// Fix Leaflet missing icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Injeksi CSS global untuk memperbesar area klik poligon dan titik Leaflet Draw
const injectDrawCSS = () => {
  const id = 'garda-draw-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    /* Sembunyikan toolbar Leaflet Draw bawaan, kita ganti dengan UI kustom */
    .leaflet-draw-toolbar, .leaflet-draw-section { display: none !important; }

    /* Perbesar touch/click target pada vertex poligon saat menggambar */
    .leaflet-div-icon {
      width: 20px !important;
      height: 20px !important;
      margin-left: -10px !important;
      margin-top: -10px !important;
      background: white;
      border: 3px solid #2563eb;
      border-radius: 50%;
      cursor: crosshair;
    }
    /* Titik pertama (untuk menutup poligon) lebih besar */
    .leaflet-marker-icon.leaflet-touch-icon {
      width: 28px !important;
      height: 28px !important;
      margin-left: -14px !important;
      margin-top: -14px !important;
    }
    /* Garis poligon saat menggambar */
    .leaflet-draw-guide-dash { border-color: #2563eb; }

    /* Vertex handle saat mode edit (lebih besar untuk touch) */
    .leaflet-editing-icon {
      width: 18px !important;
      height: 18px !important;
      margin-left: -9px !important;
      margin-top: -9px !important;
      border-radius: 50% !important;
      background: #f59e0b !important;
      border: 2px solid white !important;
    }
    .leaflet-editing-icon.leaflet-edit-move {
      background: #2563eb !important;
    }
  `;
  document.head.appendChild(style);
};

interface MapDigitizerProps {
  onPolygonChange: (geojson: any, mode: 'manual' | 'auto_polygon') => void;
  autoPolygonMode: boolean;
  onDrawingStateChange?: (drawing: boolean) => void;
  existingPolygons?: any[];
  userRole?: string;
}

// Komponen untuk menangani event klik peta (mode otomatis)
const MapClickHandler = ({ autoPolygonMode, onAutoGenerate }: any) => {
  useMapEvents({
    click(e) {
      if (autoPolygonMode) {
        onAutoGenerate(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Sub-komponen yang punya akses ke map instance
const DrawController = ({
  autoPolygonMode,
  featureGroupRef,
  onPolygonChange,
  onDrawingChange,
}: {
  autoPolygonMode: boolean;
  featureGroupRef: React.RefObject<L.FeatureGroup | null>;
  onPolygonChange: (geojson: any, mode: 'manual' | 'auto_polygon') => void;
  onDrawingChange: (drawing: boolean) => void;
}) => {
  const map = useMap();
  const drawHandlerRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Sinkronkan state drawing ke parent
  useEffect(() => {
    onDrawingChange(isDrawing);
  }, [isDrawing, onDrawingChange]);

  const updateGeoJSON = useCallback((mode: 'manual' | 'auto_polygon') => {
    if (featureGroupRef.current) {
      const geojson = featureGroupRef.current.toGeoJSON();
      const features = (geojson as any).features;
      if (features && features.length > 0) {
        onPolygonChange(features[features.length - 1], mode);
      } else {
        onPolygonChange(null, mode);
      }
    }
  }, [featureGroupRef, onPolygonChange]);

  // Expose fungsi global untuk trigger draw dari luar
  useEffect(() => {
    (window as any).__gardaStartDraw = () => {
      if (autoPolygonMode) return;
      // Hentikan handler yang aktif jika ada
      if (drawHandlerRef.current) {
        drawHandlerRef.current.disable();
        drawHandlerRef.current = null;
      }
      const handler = new (L as any).Draw.Polygon(map, {
        allowIntersection: false,
        repeatMode: false,
        drawError: {
          color: '#ef4444',
          message: '<strong>Error:</strong> Poligon tidak boleh memotong!',
        },
        shapeOptions: {
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.25,
          weight: 3,
        },
        touchIcon: new L.DivIcon({
          iconSize: new L.Point(28, 28),
          iconAnchor: new L.Point(14, 14),
          className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
        }),
        icon: new L.DivIcon({
          iconSize: new L.Point(20, 20),
          iconAnchor: new L.Point(10, 10),
          className: 'leaflet-div-icon'
        }),
      });
      drawHandlerRef.current = handler;
      handler.enable();
      setIsDrawing(true);

      // Event ketika poligon selesai digambar
      map.once('draw:created', (e: any) => {
        const layer = e.layer;
        featureGroupRef.current?.clearLayers();
        featureGroupRef.current?.addLayer(layer);
        updateGeoJSON('manual');
        setIsDrawing(false);
        drawHandlerRef.current = null;
      });
    };

    (window as any).__gardaUndoPoint = () => {
      if (drawHandlerRef.current && typeof drawHandlerRef.current.deleteLastVertex === 'function') {
        drawHandlerRef.current.deleteLastVertex();
      }
    };

    (window as any).__gardaFinishDraw = () => {
      if (drawHandlerRef.current) {
        drawHandlerRef.current.completeShape();
        setIsDrawing(false);
      }
    };

    (window as any).__gardaCancelDraw = () => {
      if (drawHandlerRef.current) {
        drawHandlerRef.current.disable();
        drawHandlerRef.current = null;
        setIsDrawing(false);
      }
    };

    (window as any).__gardaAutoGenerate = (lat: number, lng: number) => {
      if (!featureGroupRef.current) return;
      featureGroupRef.current.clearLayers();
      const polyGeoJSON = generateSimulationRectangle(lat, lng);
      const layer = L.geoJSON(polyGeoJSON as any).getLayers()[0] as L.Polygon;
      (layer as any).options.color = '#2563eb';
      (layer as any).options.fillColor = '#3b82f6';
      (layer as any).options.fillOpacity = 0.25;
      (layer as any).options.weight = 3;
      featureGroupRef.current.addLayer(layer);
      updateGeoJSON('auto_polygon');
    };

    (window as any).__gardaClearLayers = () => {
      featureGroupRef.current?.clearLayers();
      onPolygonChange(null, 'manual');
    };

    return () => {
      delete (window as any).__gardaStartDraw;
      delete (window as any).__gardaUndoPoint;
      delete (window as any).__gardaFinishDraw;
      delete (window as any).__gardaCancelDraw;
      delete (window as any).__gardaAutoGenerate;
      delete (window as any).__gardaClearLayers;
    };
  }, [map, autoPolygonMode, featureGroupRef, updateGeoJSON, onPolygonChange]);

  // Batalkan draw handler jika switch ke mode otomatis
  useEffect(() => {
    if (autoPolygonMode && drawHandlerRef.current) {
      drawHandlerRef.current.disable();
      drawHandlerRef.current = null;
      setIsDrawing(false);
    }
  }, [autoPolygonMode]);

  return null;
};

const UserLocationMarker = () => {
  const map = useMap();
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);

  useEffect(() => {
    const handleFound = (e: L.LocationEvent) => {
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
    };
    map.on('locationfound', handleFound);
    return () => { map.off('locationfound', handleFound); };
  }, [map]);

  if (position === null) return null;

  const userLocationIcon = L.divIcon({
    className: '',
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:20px;height:20px">
      <span style="position:absolute;width:100%;height:100%;border-radius:50%;background:#60a5fa;opacity:0.7;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></span>
      <span style="position:relative;width:14px;height:14px;border-radius:50%;background:#2563eb;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></span>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  return (
    <>
      <Circle center={position} radius={accuracy} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }} />
      <Marker position={position} icon={userLocationIcon}>
        <Popup>
          <div className="font-bold text-slate-800 text-xs">Lokasi Anda (Akurasi: {Math.round(accuracy)}m)</div>
        </Popup>
      </Marker>
    </>
  );
};

const LocateButton = () => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 19, enableHighAccuracy: true });
  };

  useEffect(() => {
    const done = () => setLocating(false);
    const err = () => { setLocating(false); };
    map.on('locationfound', done);
    map.on('locationerror', err);
    handleLocate(); // auto-locate on mount
    return () => { map.off('locationfound', done); map.off('locationerror', err); };
  }, [map]);

  return (
    <div className="absolute bottom-6 right-6 z-[1000]">
      <button
        onClick={(e) => { e.preventDefault(); handleLocate(); }}
        className="bg-white p-3.5 rounded-2xl shadow-xl text-blue-600 hover:bg-blue-50 border border-slate-100 flex items-center justify-center"
        title="Temukan Lokasi Saya"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={locating ? 'animate-pulse text-slate-400' : ''}>
          <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/>
          <path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
          <circle cx="12" cy="12" r="6"/>
        </svg>
      </button>
    </div>
  );
};

// Komponen untuk me-render poligon yang sudah ada
const ExistingPolygonsLayer = ({ polygons, userRole }: { polygons: any[], userRole?: string }) => {
  const map = useMap();

  // Memfokuskan peta ke lokasi poligon yang sudah ada
  useEffect(() => {
    if (userRole === 'admin' && polygons && polygons.length > 0) {
      const bounds = L.latLngBounds([]);
      polygons.forEach((p) => {
        if (p.latitude && p.longitude) {
          bounds.extend([p.latitude, p.longitude]);
        }
      });
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [polygons, userRole, map]);

  // Hanya tampilkan jika admin
  if (userRole !== 'admin' || !polygons || polygons.length === 0) return null;

  return (
    <>
      {polygons.map((record) => {
        if (!record.geojson) return null;
        
        // Memastikan geojson adalah object
        let geoData = record.geojson;
        if (typeof geoData === 'string') {
          try {
            geoData = JSON.parse(geoData);
          } catch (e) {
            return null;
          }
        }

        return (
          <LGeoJSON 
            key={record.id} 
            data={geoData} 
            style={{
              color: '#10b981', // Emerald
              fillColor: '#34d399',
              fillOpacity: 0.3,
              weight: 2,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              <div className="p-1 space-y-1">
                <h3 className="font-bold text-slate-800 text-sm border-b pb-1 mb-1">{record.jenisBangunan}</h3>
                <p className="text-xs text-slate-600"><b>Petugas:</b> {record.petugasName}</p>
                <p className="text-xs text-slate-600"><b>Luas Tapak:</b> {Math.round(record.luasTapak)} m²</p>
                <p className="text-xs text-slate-600"><b>Lantai:</b> {record.jumlahLantai}</p>
                <p className="text-xs text-slate-600"><b>Metode:</b> {record.metodeDigitasi === 'manual' ? 'Manual' : 'Otomatis'}</p>
              </div>
            </Popup>
          </LGeoJSON>
        );
      })}
    </>
  );
};

export const MapDigitizer: React.FC<MapDigitizerProps> = ({ onPolygonChange, autoPolygonMode, onDrawingStateChange, existingPolygons = [], userRole }) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  useEffect(() => {
    injectDrawCSS();
  }, []);

  const handleDrawingChange = useCallback((drawing: boolean) => {
    setIsDrawing(drawing);
    onDrawingStateChange?.(drawing);
  }, [onDrawingStateChange]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[-0.320448, 108.955439]}
        zoom={16}
        maxZoom={22}
        scrollWheelZoom={true}
        className="w-full h-full rounded-3xl z-0"
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
              attribution='&copy; Esri'
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

        <ExistingPolygonsLayer polygons={existingPolygons} userRole={userRole} />

        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topleft"
            draw={{
              polyline: false,
              circle: false,
              circlemarker: false,
              marker: false,
              rectangle: false,
              polygon: {
                allowIntersection: false,
                drawError: { color: '#e1e100', message: '<strong>Salah!</strong> poligon tidak boleh memotong.' },
                shapeOptions: { color: '#3b82f6' }
              }
            }}
          />
        </FeatureGroup>

        <DrawController
          autoPolygonMode={autoPolygonMode}
          featureGroupRef={featureGroupRef}
          onPolygonChange={onPolygonChange}
          onDrawingChange={handleDrawingChange}
        />

        <MapClickHandler
          autoPolygonMode={autoPolygonMode}
          onAutoGenerate={(lat: number, lng: number) => {
            (window as any).__gardaAutoGenerate?.(lat, lng);
          }}
        />

        <LocateButton />
        <UserLocationMarker />
      </MapContainer>

      {/* Floating Action Button (FAB) untuk Drawing Toolbar */}
      {isDrawing && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2">
          {/* Menu items (muncul jika isFabOpen) */}
          {isFabOpen && (
            <div className="flex flex-col items-center gap-2 mb-1 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <button
                onClick={(e) => { e.preventDefault(); (window as any).__gardaUndoPoint?.(); }}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border border-slate-700 shadow-md"
                title="Hapus titik terakhir"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Hapus Titik</span>
              </button>
              <button
                onClick={(e) => { e.preventDefault(); (window as any).__gardaCancelDraw?.(); }}
                className="flex items-center gap-2 bg-red-950 hover:bg-red-900 border border-red-900 text-red-300 hover:text-red-200 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
                title="Batalkan proses menggambar"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
              <button
                onClick={(e) => { e.preventDefault(); (window as any).__gardaFinishDraw?.(); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/30"
                title="Selesaikan gambar poligon"
              >
                <Check className="w-4 h-4 font-bold" />
                <span>Selesai</span>
              </button>
            </div>
          )}

          {/* Main FAB Toggle Button */}
          <button
            onClick={(e) => { e.preventDefault(); setIsFabOpen(!isFabOpen); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full shadow-xl transition-all duration-300 border ${
              isFabOpen 
                ? 'bg-slate-800 border-slate-600 text-slate-200' 
                : 'bg-blue-600 border-blue-500 text-white shadow-blue-500/40 animate-bounce'
            }`}
          >
            {isFabOpen ? <X className="w-4 h-4" /> : (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isFabOpen ? 'Tutup' : 'Menu'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
