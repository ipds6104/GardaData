import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMapEvents, LayersControl, useMap, Marker, Circle, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { generateSimulationRectangle } from '../../utils/geospatial';
import { Check, Undo2, X } from 'lucide-react';

// Fix Leaflet missing icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapDigitizerProps {
  onPolygonChange: (geojson: any, mode: 'manual' | 'auto_polygon') => void;
  autoPolygonMode: boolean;
}

// Komponen untuk menangani event klik pada peta
const MapEvents = ({ autoPolygonMode, featureGroupRef, onAutoGenerate }: any) => {
  useMapEvents({
    click(e) {
      if (autoPolygonMode && featureGroupRef.current) {
        onAutoGenerate(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Komponen untuk mendeteksi event menggambar poligon manual
const DrawEvents = ({ onDrawStart, onDrawStop }: any) => {
  const map = useMap();
  useEffect(() => {
    const handleStart = () => onDrawStart();
    const handleStop = () => onDrawStop();
    
    map.on('draw:drawstart' as any, handleStart);
    map.on('draw:drawstop' as any, handleStop);
    map.on('draw:created' as any, handleStop);
    
    return () => {
      map.off('draw:drawstart' as any, handleStart);
      map.off('draw:drawstop' as any, handleStop);
      map.off('draw:created' as any, handleStop);
    };
  }, [map, onDrawStart, onDrawStop]);
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
    return () => {
      map.off('locationfound', handleFound);
    };
  }, [map]);

  if (position === null) return null;

  const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div class="relative flex items-center justify-center h-5 w-5">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white shadow-md"></span>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  return (
    <>
      <Circle center={position} radius={accuracy} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }} />
      <Marker position={position} icon={userLocationIcon}>
        <Popup>
          <div className="font-bold text-slate-800 text-xs">Lokasi Anda (Akurasi: {Math.round(accuracy)}m)</div>
        </Popup>
      </Marker>
    </>
  );
};

const LocateControl = () => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const handleFound = () => {
      setLocating(false);
    };
    const handleError = (e: any) => {
      setLocating(false);
      alert('Tidak dapat mendeteksi lokasi Anda. Pastikan GPS/Location menyala.');
    };
    map.on('locationfound', handleFound);
    map.on('locationerror', handleError);
    return () => {
      map.off('locationfound', handleFound);
      map.off('locationerror', handleError);
    };
  }, [map]);

  const handleLocate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 18, enableHighAccuracy: true });
  };

  useEffect(() => {
    // Auto-locate once on map load
    handleLocate();
  }, [map]);

  return (
    <div className="absolute bottom-6 right-6 z-[1000]">
      <button 
        onClick={(e) => { e.preventDefault(); handleLocate(); }}
        className="bg-white p-3.5 rounded-2xl shadow-xl text-blue-600 hover:bg-blue-50 transition-colors border border-slate-100 flex items-center justify-center group"
        title="Temukan Lokasi Saya"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`group-hover:scale-110 transition-transform ${locating ? 'animate-pulse text-slate-400' : ''}`}><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><circle cx="12" cy="12" r="6"/></svg>
      </button>
    </div>
  );
};

export const MapDigitizer: React.FC<MapDigitizerProps> = ({ onPolygonChange, autoPolygonMode }) => {
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const [currentMode, setCurrentMode] = useState<'manual' | 'auto_polygon'>('manual');
  const [isDrawing, setIsDrawing] = useState(false);

  const triggerLeafletDrawAction = (action: 'undo' | 'finish' | 'cancel') => {
    let selector = '';
    if (action === 'undo') {
      selector = '.leaflet-draw-actions a[title="Delete last point drawn"], .leaflet-draw-actions a:contains("Delete")';
    } else if (action === 'finish') {
      selector = '.leaflet-draw-actions a[title="Finish drawing"], .leaflet-draw-actions a:contains("Save")';
    } else if (action === 'cancel') {
      selector = '.leaflet-draw-actions a[title="Cancel drawing"], .leaflet-draw-actions a:last-child';
    }
    
    // Fallback: search all links in .leaflet-draw-actions
    const links = document.querySelectorAll('.leaflet-draw-actions a');
    let target: HTMLElement | null = null;
    links.forEach((link: any) => {
      const txt = link.textContent.toLowerCase();
      const title = (link.title || '').toLowerCase();
      if (action === 'undo' && (txt.includes('delete') || txt.includes('hapus') || title.includes('delete') || title.includes('last'))) {
        target = link;
      } else if (action === 'cancel' && (txt.includes('cancel') || txt.includes('batal') || title.includes('cancel'))) {
        target = link;
      }
    });

    if (target) {
      (target as HTMLElement).click();
    } else {
      const btn = document.querySelector(selector) as HTMLElement;
      if (btn) btn.click();
    }

    // Leaflet Draw finish fallback: click the first point to close
    if (action === 'finish' && !target) {
      const firstMarker = document.querySelector('.leaflet-marker-icon.leaflet-div-icon') as HTMLElement;
      if (firstMarker) firstMarker.click();
    }
  };


  const updateGeoJSON = (mode: 'manual' | 'auto_polygon') => {
    if (featureGroupRef.current) {
      const geojson = featureGroupRef.current.toGeoJSON();
      // Hanya ambil layer terakhir jika ada multiple (biar 1 bangunan per entri)
      const features = geojson.features;
      if (features.length > 0) {
        onPolygonChange(features[features.length - 1], mode);
      } else {
        onPolygonChange(null, mode);
      }
    }
  };

  const handleCreated = (e: any) => {
    setCurrentMode('manual');
    // Clear previous layers to only keep one polygon
    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((layer) => {
        if (layer !== e.layer) featureGroupRef.current?.removeLayer(layer);
      });
    }
    updateGeoJSON('manual');
  };

  const handleEdited = () => {
    updateGeoJSON(currentMode); // Tetap simpan mode awal
  };

  const handleDeleted = () => {
    onPolygonChange(null, currentMode);
  };

  const handleAutoGenerate = (lat: number, lng: number) => {
    if (!featureGroupRef.current) return;
    
    // Clear old layers
    featureGroupRef.current.clearLayers();

    // Buat rectangle 6x6 simulasi
    const polyGeoJSON = generateSimulationRectangle(lat, lng);
    
    // Convert GeoJSON ke Leaflet Layer
    const layer = L.geoJSON(polyGeoJSON).getLayers()[0] as L.Polygon;
    
    // Tambahkan layer ke FeatureGroup agar bisa diedit oleh EditControl
    featureGroupRef.current.addLayer(layer);
    setCurrentMode('auto_polygon');
    updateGeoJSON('auto_polygon');
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[-0.320448, 108.955439]} // Default Mempawah
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

        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topleft"
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            draw={{
              polyline: false,
              circle: false,
              circlemarker: false,
              marker: false,
              rectangle: false, // Kita hanya izinkan Polygon manual bebas
              polygon: !autoPolygonMode ? {
                allowIntersection: false,
                drawError: { color: '#e1e100', message: '<strong>Salah!</strong> poligon tidak boleh memotong.' },
                shapeOptions: { color: '#3b82f6' }
              } : false // Nonaktifkan draw saat auto-polygon aktif
            }}
          />
        </FeatureGroup>

        <MapEvents 
          autoPolygonMode={autoPolygonMode} 
          featureGroupRef={featureGroupRef} 
          onAutoGenerate={handleAutoGenerate} 
        />
        
        <DrawEvents 
          onDrawStart={() => setIsDrawing(true)} 
          onDrawStop={() => setIsDrawing(false)} 
        />
        
        <LocateControl />
        <UserLocationMarker />
      </MapContainer>

      {isDrawing && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-slate-700/50 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="text-white text-[10px] font-black uppercase tracking-widest mr-2 flex items-center gap-1.5 shrink-0">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            Menggambar
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              triggerLeafletDrawAction('undo');
            }}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border border-slate-700"
            title="Hapus titik terakhir yang dibuat"
          >
            <Undo2 className="w-3 h-3" />
            <span>Hapus Titik</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              triggerLeafletDrawAction('finish');
            }}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-blue-500/20"
            title="Selesaikan gambar poligon"
          >
            <Check className="w-3 h-3 font-bold" />
            <span>Selesai</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              triggerLeafletDrawAction('cancel');
            }}
            className="flex items-center gap-1 bg-red-950 hover:bg-red-900 border border-red-900 text-red-300 hover:text-red-200 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
            title="Batalkan proses menggambar"
          >
            <X className="w-3 h-3" />
            <span>Batal</span>
          </button>
        </div>
      )}
    </div>
  );
};

