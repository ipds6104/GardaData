import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { 
  Search, RefreshCw, ChevronRight, ChevronLeft, CheckCircle2, Clock, 
  MapPin, Upload, FileText, Check, AlertCircle, ArrowLeft, ArrowRight,
  ExternalLink, Plus, Layers, FileSpreadsheet, X, ClipboardList,
  Building2, Home, Users, Wheat, Truck, DollarSign, Calendar,
  Trash2, Settings, Edit3, Type, Hash, UploadCloud, Save, Sliders,
  HelpCircle, MoreVertical, Download, ShieldAlert, CheckSquare,
  Compass, Eye, ArrowUpRight, BookOpen, Menu, User, Image, Camera,
  Lock, LocateFixed, Navigation
} from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { getIconComponent, AVAILABLE_ICONS, DATA_TYPES } from './laporanConstants';

// Custom Pin Icon for Leaflet
const customDraggableIcon = L.divIcon({
  className: 'custom-gps-pin',
  html: `<div style="background-color: #e11d48; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; cursor: grab;"><div style="width: 10px; height: 10px; background-color: white; border-radius: 50%; transform: rotate(45deg);"></div></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34]
});

// Helper component for handling map click & dragging
const MapLocationPicker: React.FC<{
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}> = ({ position, onPositionChange }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    }
  });

  return (
    <Marker
      position={position}
      draggable={true}
      icon={customDraggableIcon}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onPositionChange([pos.lat, pos.lng]);
        }
      }}
    />
  );
};

// Component to recenter map when position changes programmatically
const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() > 15 ? map.getZoom() : 16);
  }, [center, map]);
  return null;
};

interface PetugasLaporanModuleProps {
  onBack?: () => void;
  user?: any;
  initialActivityId?: string;
  isSimulator?: boolean;
}

export const PetugasLaporanModule: React.FC<PetugasLaporanModuleProps> = ({ 
  onBack, 
  user,
  initialActivityId,
  isSimulator = false
}) => {
  const { presetInfo } = useTheme();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Activities & Forms State
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [forms, setForms] = useState<any[]>([]);
  const [activeFormIndex, setActiveFormIndex] = useState<number>(0);

  // Grouping Navigation Drill Stack (Supports up to Level 4)
  // Each entry: { levelIndex: number, levelKey: string, value: string }
  const [drillStack, setDrillStack] = useState<Array<{ levelIndex: number; levelKey: string; value: string }>>([]);

  // Mode: 'grouping_view' vs 'form_entry'
  const [viewMode, setViewMode] = useState<'grouping_view' | 'form_entry'>('grouping_view');

  // Records State
  const [records, setRecords] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; acc?: number } | null>(null);

  // Interactive Geotagging Map Modal State
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [mapTempCoords, setMapTempCoords] = useState<[number, number]>([-0.0263, 109.3425]); // Default Mempawah Kalbar
  const [activeGpsFieldName, setActiveGpsFieldName] = useState<string>('Lokasi GPS');

  // UI / Action States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);

  const baseUrl = (import.meta as any).env.VITE_API_URL || '';
  const currentForm = forms && forms.length > 0 ? (forms[activeFormIndex] || forms[0]) : null;

  // Active Theme / UX Settings from Activity
  const activityThemeColor = selectedActivity?.settings?.themeColor || presetInfo.colors.primary;
  const isCompactLayout = selectedActivity?.settings?.viewLayout === 'compact_list';
  const lockOnSubmit = selectedActivity?.settings?.lockOnSubmit !== false;
  const requireGPS = selectedActivity?.settings?.requireGPS === true;

  // 1. Fetch Activities
  const fetchActivities = async (preferredActId?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/api/laporan/activities?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const openActivities = isAdmin ? data : data.filter((a: any) => a.isOpen !== false);
        setActivities(openActivities);
        
        if (openActivities.length > 0) {
          const targetId = preferredActId || initialActivityId;
          if (targetId) {
            const found = openActivities.find((a: any) => a.id === targetId);
            if (found) {
              setSelectedActivity(found);
            }
          }
        }
      }
    } catch (err) {
      const cached = localStorage.getItem('garda_laporan_activities');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const open = isAdmin ? parsed : parsed.filter((a: any) => a.isOpen !== false);
          setActivities(open);
          const targetId = preferredActId || initialActivityId;
          if (targetId) {
            const found = open.find((a: any) => a.id === targetId);
            if (found) {
              setSelectedActivity(found);
            }
          }
        } catch (e) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(initialActivityId);
  }, [initialActivityId]);

  // 2. Fetch Forms when Activity Changes
  const fetchForms = async (actId: string) => {
    if (!actId) return;
    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities/${actId}/forms?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setForms(data);
        localStorage.setItem(`garda_laporan_forms_${actId}`, JSON.stringify(data));
        setActiveFormIndex(0);
        setDrillStack([]);
        setViewMode('grouping_view');
        return;
      }
    } catch (err) {
      const cached = localStorage.getItem(`garda_laporan_forms_${actId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setForms(parsed);
          setActiveFormIndex(0);
          setDrillStack([]);
          setViewMode('grouping_view');
        } catch (e) {
          setForms([]);
        }
      } else {
        setForms([]);
      }
    }
  };

  useEffect(() => {
    if (selectedActivity?.id) {
      fetchForms(selectedActivity.id);
    }
  }, [selectedActivity?.id]);

  // 3. Fetch Records when Current Form Changes
  const fetchRecords = async (formId: string) => {
    if (!formId) {
      setRecords([]);
      return;
    }
    try {
      setIsRefreshing(true);
      const res = await fetch(`${baseUrl}/api/laporan/forms/${formId}/records?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
        localStorage.setItem(`garda_laporan_records_${formId}`, JSON.stringify(data));
      } else {
        const cached = localStorage.getItem(`garda_laporan_records_${formId}`);
        if (cached) setRecords(JSON.parse(cached));
      }
    } catch (err) {
      const cached = localStorage.getItem(`garda_laporan_records_${formId}`);
      if (cached) {
        try { setRecords(JSON.parse(cached)); } catch(e){}
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentForm?.id) {
      fetchRecords(currentForm.id);
    } else {
      setRecords([]);
    }
  }, [currentForm?.id]);

  // Grouping Levels (Up to Level 4)
  const rawGroupings = Array.isArray(currentForm?.groupingLevels) ? currentForm.groupingLevels : [];
  const groupingLevels: string[] = rawGroupings.filter((g: any) => g && String(g).trim() !== '');
  const activeGroupingLevels = groupingLevels.length > 0 ? groupingLevels : ['Nama PPL', 'Kecamatan', 'Desa'];

  const currentLevelIndex = drillStack.length; // 0 for Level 1, 1 for Level 2, 2 for Level 3, 3 for Level 4
  const isDeepestLevel = currentLevelIndex >= activeGroupingLevels.length - 1;
  const currentGroupingKey = activeGroupingLevels[currentLevelIndex] || activeGroupingLevels[0];

  // Filter records based on active drilldown stack
  const recordsFilteredByDrill = useMemo(() => {
    return (records || []).filter(r => {
      const d = r.data || {};
      for (const step of drillStack) {
        const val = String(d[step.levelKey] || '').trim().toLowerCase();
        if (val !== step.value.trim().toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [records, drillStack]);

  // Compute Current Group Items or Samples
  const computedGroups = useMemo(() => {
    const groupMap: Record<string, any[]> = {};
    
    // Check if options defined in schema
    const fieldObj = (currentForm?.fields || []).find((f: any) => 
      f.columnName?.toLowerCase() === currentGroupingKey.toLowerCase() || 
      f.label?.toLowerCase() === currentGroupingKey.toLowerCase()
    );
    const predefinedOptions: string[] = Array.isArray(fieldObj?.options) ? fieldObj.options : [];

    predefinedOptions.forEach(opt => {
      if (opt && String(opt).trim()) groupMap[String(opt).trim()] = [];
    });

    recordsFilteredByDrill.forEach(rec => {
      const d = rec.data || {};
      const val = String(d[currentGroupingKey] || d[fieldObj?.columnName || ''] || 'Lainnya').trim();
      if (!groupMap[val]) groupMap[val] = [];
      groupMap[val].push(rec);
    });

    if (Object.keys(groupMap).length === 0 && drillStack.length === 0) {
      ['Dandy', 'Sefty Eca Putri', 'Rendi Pratama', 'Muhammad Irfan'].forEach(name => {
        groupMap[name] = [];
      });
    }

    return Object.entries(groupMap)
      .map(([name, items]) => ({
        name,
        count: items.length,
        records: items
      }))
      .filter(g => !searchQuery.trim() || g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [recordsFilteredByDrill, currentGroupingKey, currentForm, searchQuery, drillStack]);

  // Filtered samples when reaching final level
  const displayedSamples = useMemo(() => {
    return recordsFilteredByDrill.filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const d = r.data || {};
      return Object.values(d).some(v => String(v).toLowerCase().includes(q));
    });
  }, [recordsFilteredByDrill, searchQuery]);

  // Open Interactive Map Modal
  const handleOpenMapPicker = (fieldName: string) => {
    setActiveGpsFieldName(fieldName);
    if (gpsLocation) {
      setMapTempCoords([gpsLocation.lat, gpsLocation.lng]);
    } else {
      // Try to get current position
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setMapTempCoords([pos.coords.latitude, pos.coords.longitude]);
          },
          () => {
            setMapTempCoords([-0.0263, 109.3425]); // Mempawah fallback
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }
    setIsMapModalOpen(true);
  };

  // Lock Chosen Coordinates from Map
  const handleApplyMapCoordinates = () => {
    const [lat, lng] = mapTempCoords;
    setGpsLocation({ lat, lng });
    setFormData(prev => ({
      ...prev,
      [activeGpsFieldName]: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }));
    setIsMapModalOpen(false);
  };

  // Quick Locate GPS
  const handleQuickLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung pada browser ini.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        setMapTempCoords([latitude, longitude]);
        setGpsLocation({ lat: latitude, lng: longitude, acc: accuracy });
        setFormData(prev => ({
          ...prev,
          [activeGpsFieldName]: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }));
      },
      (err) => {
        setIsLocating(false);
        alert(`Gagal mengambil titik GPS (${err.message}). Pastikan GPS aktif.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Start Form Entry
  const handleStartFormEntry = (record?: any) => {
    if (record) {
      setEditingRecord(record);
      setFormData({ ...(record.data || {}) });
      if (record.latitude && record.longitude) {
        setGpsLocation({ lat: record.latitude, lng: record.longitude });
      } else {
        setGpsLocation(null);
      }
    } else {
      const newId = `rec_${Date.now()}`;
      const emptyData: Record<string, any> = {};

      // Auto-prefill selected grouping levels into form data
      drillStack.forEach(step => {
        emptyData[step.levelKey] = step.value;
      });

      if (currentForm?.fields) {
        currentForm.fields.forEach((f: any) => {
          if (emptyData[f.columnName] === undefined) emptyData[f.columnName] = '';
        });
      }

      const newRec = {
        id: `${currentForm?.id || 'form'}_${newId}`,
        rowId: newId,
        formId: currentForm?.id,
        activityId: selectedActivity?.id,
        data: emptyData,
        status: 'draft',
        createdAt: new Date().toISOString()
      };

      setEditingRecord(newRec);
      setFormData(emptyData);
      setGpsLocation(null);
    }

    setViewMode('form_entry');
  };

  // Save Record
  const handleSaveRecord = async (targetStatus: 'draft' | 'submitted') => {
    if (!currentForm || !editingRecord) return;

    // Security check: If lock on submit is active and already submitted
    if (lockOnSubmit && editingRecord.status === 'submitted') {
      alert('Laporan ini telah disubmit dan dikunci oleh kebijakan keamanan.');
      return;
    }

    // Security check: GPS Required
    if (targetStatus === 'submitted' && requireGPS && !gpsLocation) {
      alert('Kebijakan Keamanan: Anda diwajibkan mengunci titik lokasi GPS sebelum mengirimkan laporan.');
      return;
    }

    // Validate Required Fields
    if (targetStatus === 'submitted' && currentForm.fields) {
      const missing = currentForm.fields.filter((f: any) => {
        if (!f.isRequired) return false;
        const val = formData[f.columnName];
        return val === undefined || val === null || String(val).trim() === '';
      });

      if (missing.length > 0) {
        alert(`Lengkapi isian wajib berikut:\n• ${missing.map((f: any) => f.label).join('\n• ')}`);
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
      } catch (e) {}

      const updatedRec = {
        ...editingRecord,
        status: targetStatus,
        data: formData,
        latitude: gpsLocation?.lat || null,
        longitude: gpsLocation?.lng || null
      };

      const isExisting = (records || []).some(r => r.id === editingRecord.id);
      const updatedList = isExisting
        ? records.map(r => r.id === editingRecord.id ? updatedRec : r)
        : [updatedRec, ...(records || [])];

      setRecords(updatedList);
      localStorage.setItem(`garda_laporan_records_${currentForm.id}`, JSON.stringify(updatedList));

      setSaveSuccessMsg(targetStatus === 'submitted' ? 'Data berhasil dikirim!' : 'Draf berhasil disimpan!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);

      setEditingRecord(null);
      setViewMode('grouping_view');
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormLocked = lockOnSubmit && editingRecord?.status === 'submitted';

  return (
    <div className={`flex flex-col mx-auto bg-white overflow-hidden relative ${
      isSimulator 
        ? 'w-full h-full rounded-[36px]' 
        : 'h-[calc(100vh-6rem)] w-full rounded-2xl border border-slate-200 shadow-md'
    }`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {saveSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP APP BAR */}
      <div 
        className="px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-xs z-20"
        style={{ backgroundColor: activityThemeColor }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {!selectedActivity ? (
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
          ) : viewMode === 'form_entry' ? (
            <button
              onClick={() => setViewMode('grouping_view')}
              className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : drillStack.length > 0 ? (
            <button
              onClick={() => {
                setDrillStack(prev => prev.slice(0, prev.length - 1));
              }}
              className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
              title="Kembali ke level sebelumnya"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedActivity(null);
                setForms([]);
                setRecords([]);
              }}
              className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-1 text-white font-bold text-xs"
              title="Kembali ke Daftar Kegiatan"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kegiatan</span>
            </button>
          )}

          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider truncate">
              {!selectedActivity
                ? 'Portal Petugas'
                : viewMode === 'form_entry' 
                ? (currentForm?.title || 'Formulir')
                : (selectedActivity?.title || 'Dynamic Forms')}
            </span>
            <h2 className="text-xs sm:text-sm font-bold truncate">
              {!selectedActivity
                ? 'Pilih Kegiatan Pendataan'
                : viewMode === 'form_entry'
                ? (formData[activeGroupingLevels[1] || 'Nama KRT'] || 'Isian Formulir')
                : drillStack.length > 0
                ? drillStack[drillStack.length - 1].value
                : (currentForm?.title || 'Daftar Grup')}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              if (selectedActivity && currentForm?.id) {
                fetchRecords(currentForm.id);
              } else {
                fetchActivities();
              }
            }}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer text-white"
            title="Sinkronkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* BREADCRUMB LEVEL HIERARCHY */}
      {selectedActivity && drillStack.length > 0 && viewMode !== 'form_entry' && (
        <div className="bg-slate-100/90 px-3.5 py-1.5 border-b border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5 overflow-x-auto shrink-0 font-medium">
          <span 
            onClick={() => setDrillStack([])}
            className="text-primary-600 hover:underline cursor-pointer font-bold"
          >
            Level 1
          </span>
          {drillStack.map((step, sIdx) => (
            <React.Fragment key={sIdx}>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span 
                onClick={() => setDrillStack(prev => prev.slice(0, sIdx + 1))}
                className={`truncate cursor-pointer ${sIdx === drillStack.length - 1 ? 'font-bold text-slate-900' : 'text-primary-600 hover:underline'}`}
              >
                {step.value}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* MAIN CONTENT VIEW AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 pb-20 bg-slate-50">
        
        {/* =====================================================================
            VIEW 0: DAFTAR KEGIATAN CARD HUB (DITAMPILKAN AWAL UNTUK ROLE PETUGAS)
            ===================================================================== */}
        {!selectedActivity && (
          <div className="space-y-4">
            {/* Header banner info */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                <Layers className="w-4 h-4 text-primary-600" />
                <span>Kegiatan Pendataan & Survei Lapangan</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pilih salah satu kegiatan di bawah ini untuk membuka e-form pendataan dan memulai pengisian data.
              </p>
            </div>

            {/* Search Box Kegiatan */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari kegiatan survei / pendataan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-300 font-medium shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* List / Grid Card Kegiatan */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
                <span>Memuat kegiatan aktif...</span>
              </div>
            ) : activities.filter(a => !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || (a.description || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-1">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">Tidak ada kegiatan yang ditemukan</p>
                <p className="text-[11px] text-slate-400">Pastikan kegiatan telah diaktifkan oleh admin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {activities
                  .filter(a => !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) || (a.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((act) => {
                    const ActIcon = getIconComponent(act.icon, ClipboardList);
                    const actColor = act.settings?.themeColor || '#10b981';

                    return (
                      <motion.div
                        key={act.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setSelectedActivity(act);
                          setDrillStack([]);
                          setViewMode('grouping_view');
                        }}
                        className="p-4 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden"
                      >
                        {/* Accent Top Bar */}
                        <div 
                          className="absolute top-0 left-0 right-0 h-1.5"
                          style={{ backgroundColor: actColor }}
                        />

                        <div className="flex items-start justify-between gap-3 pt-1">
                          <div className="flex items-start gap-3 min-w-0">
                            <div 
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                              style={{ backgroundColor: actColor }}
                            >
                              <ActIcon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-snug">
                                {act.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                                {act.description || 'Formulir pendataan dan pencacahan digital lapangan.'}
                              </p>
                            </div>
                          </div>

                          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-primary-50 group-hover:text-primary-600 flex items-center justify-center text-slate-400 transition-colors shrink-0 mt-0.5">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Badges and Call-to-action */}
                        <div className="flex items-center flex-wrap gap-2 pt-2.5 border-t border-slate-100 text-[10px]">
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Aktif</span>
                          </span>

                          {act.connectedSheetUrl && (
                            <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                              <span>Google Sheets</span>
                            </span>
                          )}

                          <span className="ml-auto text-[11px] font-bold text-primary-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            <span>Buka E-Form</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW 1: GROUPING LEVEL HIERARCHY (LEVEL 1 -> LEVEL 2 -> LEVEL 3 -> LEVEL 4)
            ===================================================================== */}
        {selectedActivity && viewMode === 'grouping_view' && (
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder={`Cari ${currentGroupingKey}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-300 font-medium shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* If NOT at deepest level: show grouping items */}
            {!isDeepestLevel ? (
              <div className="space-y-2">
                {computedGroups.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    Tidak ada data grup yang ditemukan.
                  </div>
                ) : (
                  computedGroups.map((grp, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setDrillStack(prev => [
                          ...prev,
                          { levelIndex: currentLevelIndex, levelKey: currentGroupingKey, value: grp.name }
                        ]);
                        setSearchQuery('');
                      }}
                      className="p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: activityThemeColor }}
                        >
                          {grp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {grp.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {currentGroupingKey} • Level {currentLevelIndex + 1}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          {grp.count}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              /* If REACHED DEEPEST LEVEL: Show sample records with circular photo & GPS pin (Gambar 4) */
              <div className="space-y-2.5">
                {displayedSamples.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">Belum Ada Sampel</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Belum ada data sampel pada kelompok ini.
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartFormEntry()}
                      style={{ backgroundColor: activityThemeColor }}
                      className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Sampel Baru</span>
                    </button>
                  </div>
                ) : (
                  displayedSamples.map((sample, idx) => {
                    const d = sample.data || {};
                    const title = d[activeGroupingLevels[activeGroupingLevels.length - 1]] || d['Nama KRT'] || d['Alamat'] || `Sampel #${idx + 1}`;
                    const subtitle = d['Catatan'] || d['Perjalanan Ke'] || `Perjalanan Ke - ${idx + 1}`;
                    const photoUrl = d['Foto Lapangan'] || d['Foto'] || d['Dokumentasi'];
                    const isSubmitted = sample.status === 'submitted';

                    return (
                      <motion.div
                        key={sample.id || idx}
                        whileHover={{ scale: 1.01 }}
                        className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {!isCompactLayout && (
                            <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {photoUrl ? (
                                <img src={photoUrl} alt="Thumb" className="w-full h-full object-cover" />
                              ) : (
                                <Camera className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate">
                              {subtitle}
                            </p>
                            <span className={`inline-block px-2 py-0.2 rounded text-[9px] font-bold uppercase mt-0.5 ${
                              isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isSubmitted ? 'Selesai' : 'Draf'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (sample.latitude && sample.longitude) {
                                setMapTempCoords([sample.latitude, sample.longitude]);
                                setIsMapModalOpen(true);
                              } else {
                                alert('Sampel ini belum memiliki koordinat GPS.');
                              }
                            }}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              sample.latitude && sample.longitude 
                                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' 
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title={sample.latitude ? `GPS: ${sample.latitude}, ${sample.longitude}` : 'Belum ada GPS'}
                          >
                            <MapPin className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartFormEntry(sample)}
                            className="p-2 rounded-xl text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer"
                            title="Edit Isian Formulir"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW 2: FORM INPUT / ISIAN SCREEN (GAMBAR 5)
            ===================================================================== */}
        {viewMode === 'form_entry' && (
          <div className="space-y-4 max-w-xl mx-auto pb-10">
            {/* Lock status banner if security enabled */}
            {isFormLocked && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-2 text-xs text-amber-900 font-bold">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Laporan ini telah dikirim dan dikunci oleh kebijakan administrator.</span>
              </div>
            )}

            {/* GPS Geotagging Card with Clean Spacious Layout */}
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    gpsLocation 
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' 
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Titik Koordinat GPS</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block font-mono">
                      {gpsLocation 
                        ? `${gpsLocation.lat.toFixed(6)}, ${gpsLocation.lng.toFixed(6)}` 
                        : 'Belum ditentukan'}
                    </span>
                  </div>
                </div>

                {gpsLocation && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    Terkunci
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleQuickLocate}
                  disabled={isLocating || isFormLocked}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  title="Ambil GPS Otomatis"
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-primary-600' : ''}`} />
                  <span>Ambil GPS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenMapPicker('Lokasi GPS')}
                  disabled={isFormLocked}
                  className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                  title="Buka Peta Geser Titik Lokasi"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Pilih di Peta</span>
                </button>
              </div>
            </div>

            {/* Vertical Input Fields */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-2xs">
              {currentForm?.fields && currentForm.fields.length > 0 ? (
                currentForm.fields.map((field: any, idx: number) => {
                  const val = formData[field.columnName] !== undefined ? formData[field.columnName] : '';
                  const fieldType = String(field.dataType || 'Text').toLowerCase();

                  return (
                    <div key={field.id || idx} className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                      </label>

                      {(fieldType === 'enum' || fieldType === 'pilihan' || (Array.isArray(field.options) && field.options.length > 0)) ? (
                        <select
                          disabled={isFormLocked}
                          value={val}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.columnName]: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer font-medium disabled:opacity-60"
                        >
                          <option value="">-- Pilih {field.label} --</option>
                          {(field.options || []).map((opt: string, i: number) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : fieldType === 'angka' || fieldType === 'number' ? (
                        <input
                          type="number"
                          disabled={isFormLocked}
                          value={val}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.columnName]: e.target.value }))}
                          placeholder="0"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60"
                        />
                      ) : fieldType === 'tanggal' || fieldType === 'date' ? (
                        <input
                          type="date"
                          disabled={isFormLocked}
                          value={val}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.columnName]: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60"
                        />
                      ) : fieldType === 'jam' || fieldType === 'time' ? (
                        <input
                          type="time"
                          disabled={isFormLocked}
                          value={val}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.columnName]: e.target.value }))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60"
                        />
                      ) : fieldType === 'latlong' || fieldType === 'lokasi' ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={val}
                            placeholder="Belum ada koordinat..."
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenMapPicker(field.columnName)}
                            disabled={isFormLocked}
                            className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 border border-rose-200 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Peta</span>
                          </button>
                        </div>
                      ) : fieldType === 'file' || fieldType === 'image' || fieldType === 'foto' ? (
                        <div className="space-y-2">
                          {!isFormLocked && (
                            <label className="flex items-center justify-center gap-2 w-full p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer text-xs font-bold text-slate-600 transition-colors">
                              <Camera className="w-4 h-4 text-slate-500" />
                              <span>{isUploading ? 'Mengunggah...' : 'Ambil Foto / Unggah Berkas'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setFormData(prev => ({ ...prev, [field.columnName]: reader.result as string }));
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          )}

                          {val && (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-32 bg-slate-100">
                              <img src={val} alt="Preview" className="w-full h-full object-cover" />
                              {!isFormLocked && (
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, [field.columnName]: '' }))}
                                  className="absolute top-2 right-2 p-1 bg-slate-900/70 text-white rounded-lg hover:bg-rose-600 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          disabled={isFormLocked}
                          value={val}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.columnName]: e.target.value }))}
                          placeholder={`Isi ${field.label}...`}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60"
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                Object.keys(formData).map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">{k}</label>
                    <input
                      type="text"
                      disabled={isFormLocked}
                      value={formData[k] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [k]: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Bottom Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewMode('grouping_view')}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSaving || isFormLocked}
                onClick={() => handleSaveRecord('submitted')}
                style={{ backgroundColor: activityThemeColor }}
                className="py-2.5 px-4 text-white rounded-2xl text-xs font-bold shadow-md shadow-primary-500/20 hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM FORM SELECTOR TABS */}
      {selectedActivity && viewMode !== 'form_entry' && forms && forms.length > 0 && (
        <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around z-30 shadow-lg">
          {forms.map((f, idx) => {
            const isActive = idx === activeFormIndex;
            const FormIcon = getIconComponent(f.icon, FileText);

            return (
              <button
                key={f.id || idx}
                onClick={() => {
                  setActiveFormIndex(idx);
                  setDrillStack([]);
                  setViewMode('grouping_view');
                }}
                className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer relative min-w-[60px] max-w-[90px] ${
                  isActive ? 'text-primary-600 font-bold' : 'text-slate-400 hover:text-slate-700 font-medium'
                }`}
              >
                <div 
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-primary-50 text-primary-600 shadow-2xs scale-105' : 'text-slate-400'
                  }`}
                >
                  <FormIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] leading-tight text-center truncate w-full mt-0.5">
                  {f.title}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeFormTabPetugas"
                    className="absolute -bottom-1 w-5 h-0.5 rounded-full"
                    style={{ backgroundColor: activityThemeColor }}
                  />
                )}
              </button>
            );
          })}

          {/* Floating '+' Button to Add Sample directly at deepest level */}
          {isDeepestLevel && (
            <button
              onClick={() => handleStartFormEntry()}
              style={{ backgroundColor: activityThemeColor }}
              className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg shadow-primary-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 -translate-y-2 ring-4 ring-white"
              title="Tambah Sampel Baru"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE GEOTAGGING LEAFLET MAP MODAL (TITIK BISA DIGESER)
          ========================================================================= */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-4 sm:p-5 space-y-3 flex flex-col h-[85vh] max-h-[640px]"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pilih Titik Lokasi Lapangan</h3>
                  <p className="text-[10px] text-slate-400">Geser pin merah atau ketuk peta untuk memindahkan titik</p>
                </div>
              </div>
              <button onClick={() => setIsMapModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 relative">
              <MapContainer
                center={mapTempCoords}
                zoom={16}
                scrollWheelZoom={true}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapLocationPicker
                  position={mapTempCoords}
                  onPositionChange={(pos) => setMapTempCoords(pos)}
                />
                <RecenterMap center={mapTempCoords} />
              </MapContainer>

              {/* Floating Quick Action: Auto Detect GPS */}
              <button
                type="button"
                onClick={handleQuickLocate}
                className="absolute top-3 right-3 z-[1000] p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Arahkan ke Lokasi Saya Sekarang"
              >
                <LocateFixed className={`w-4 h-4 text-rose-600 ${isLocating ? 'animate-spin' : ''}`} />
                <span>Posisi Saya</span>
              </button>
            </div>

            {/* Coordinates Display Bar */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Koordinat Terpilih</span>
                <span className="font-mono font-bold text-slate-800">
                  {mapTempCoords[0].toFixed(6)}, {mapTempCoords[1].toFixed(6)}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 italic">Bisa digeser manual</span>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyMapCoordinates}
                style={{ backgroundColor: activityThemeColor }}
                className="px-5 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Kunci Titik Koordinat Ini</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ACTIVITY SELECTOR MODAL */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-5 space-y-3 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Pilih Kegiatan Lapangan</h3>
              </div>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {(activities || []).map((act) => {
                const isSel = act.id === selectedActivity?.id;
                const ActIcon = getIconComponent(act.icon, Layers);

                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      setSelectedActivity(act);
                      setIsActivityModalOpen(false);
                      setDrillStack([]);
                      setViewMode('grouping_view');
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                      isSel ? 'bg-primary-50 border border-primary-200 text-slate-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <ActIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs truncate">{act.title}</span>
                    </div>
                    {isSel && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
