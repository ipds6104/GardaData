import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMapEvents, LayersControl, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { generateSimulationRectangle } from '../../utils/geospatial';

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

const LocateControl = () => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    map.on('locationfound', (e) => {
      setLocating(false);
      // Optional: tambahkan marker di lokasi user jika perlu
    });
    map.on('locationerror', (e) => {
      setLocating(false);
      alert('Tidak dapat mendeteksi lokasi Anda. Pastikan GPS/Location menyala.');
    });
  }, [map]);

  const handleLocate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 18, enableHighAccuracy: true });
  };

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
        
        <LocateControl />
      </MapContainer>
    </div>
  );
};
