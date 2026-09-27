import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { 
  Search, RefreshCw, ChevronRight, ChevronLeft, ChevronDown, CheckCircle2, Clock, 
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

// Smooth Dropdown Select Component for Form Entry
const PetugasSelect: React.FC<{
  value: string;
  options: string[];
  onChange: (val: string) => void;
  label: string;
  disabled?: boolean;
}> = ({ value, options, onChange, label, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 flex items-center justify-between transition-all cursor-pointer font-medium ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-dashed' : 'hover:bg-slate-100/80 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800'
        }`}
      >
        <span className="truncate">{value || `-- Pilih ${label} --`}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 space-y-1 max-h-56 overflow-y-auto custom-scrollbar ring-1 ring-black/5"
          >
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="p-2 rounded-xl text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 italic"
            >
              -- Kosongkan Pilihan --
            </div>
            {options.map((opt, i) => {
              const isSel = opt === value;
              return (
                <div
                  key={i}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-all ${
                    isSel ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-200 font-bold border border-primary-200 dark:border-primary-800' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSel && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0" />}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper to normalize and retrieve record field value safely
export const getRecordVal = (data: Record<string, any>, keyName: string): any => {
  if (!data || !keyName) return '';
  if (data[keyName] !== undefined && data[keyName] !== null) return data[keyName];
  
  const normalizedKey = keyName.trim().toLowerCase().replace(/[\s_-]+/g, '');
  for (const [k, v] of Object.entries(data)) {
    const normK = k.trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (normK === normalizedKey) {
      return v;
    }
  }
  return '';
};

interface PetugasLaporanModuleProps {
  onBack?: () => void;
  user?: any;
  initialActivityId?: string;
  isSimulator?: boolean;
  isLiveEdit?: boolean;
  activityOverride?: any;
  formsOverride?: any[];
  themeColorOverride?: string;
}

export const PetugasLaporanModule: React.FC<PetugasLaporanModuleProps> = ({ 
  onBack, 
  user,
  initialActivityId,
  isSimulator = false,
  isLiveEdit = true,
  activityOverride,
  formsOverride,
  themeColorOverride
}) => {
  const { presetInfo } = useTheme();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Activities & Forms State
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any>(activityOverride || null);
  const [forms, setForms] = useState<any[]>(formsOverride || []);
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
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState<boolean>(false);
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);

  const baseUrl = (import.meta as any).env.VITE_API_URL || '';

  // Synchronize overrides if provided
  useEffect(() => {
    if (activityOverride) setSelectedActivity(activityOverride);
  }, [activityOverride]);

  useEffect(() => {
    if (formsOverride && formsOverride.length > 0) setForms(formsOverride);
  }, [formsOverride]);

  const effectiveActivity = activityOverride || selectedActivity;
  const effectiveForms = (formsOverride && formsOverride.length > 0) ? formsOverride : forms;
  const currentForm = effectiveForms && effectiveForms.length > 0 ? (effectiveForms[activeFormIndex] || effectiveForms[0]) : null;

  // Active Theme / UX Settings from Activity
  const activityThemeColor = themeColorOverride || effectiveActivity?.settings?.themeColor || presetInfo.colors.primary;
  const isCompactLayout = effectiveActivity?.settings?.viewLayout === 'compact_list';
  const navMode = effectiveActivity?.settings?.navMode || 'bottom_bar';
  const lockOnSubmit = effectiveActivity?.settings?.lockOnSubmit !== false;
  const requireGPS = effectiveActivity?.settings?.requireGPS === true;

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

  // Grouping Levels (Up to Level 4) - Only include valid, non-empty levels
  const rawGroupings = Array.isArray(currentForm?.groupingLevels) ? currentForm.groupingLevels : [];
  const activeGroupingLevels = useMemo(() => {
    return rawGroupings
      .map((g: any) => String(g || '').trim())
      .filter((g: string) => g !== '' && g !== '-- Tidak Digunakan (Kosong) --' && g !== 'undefined' && g !== 'null');
  }, [currentForm?.groupingLevels]);

  const currentLevelIndex = drillStack.length; // 0 for Level 1, 1 for Level 2, 2 for Level 3, 3 for Level 4
  const isDeepestLevel = !isLoading && !!currentForm && (
    activeGroupingLevels.length === 0 || currentLevelIndex >= activeGroupingLevels.length
  );
  const currentGroupingKey = (!isDeepestLevel && currentLevelIndex < activeGroupingLevels.length)
    ? activeGroupingLevels[currentLevelIndex]
    : '';

  // Filter records based on active drilldown stack
  const recordsFilteredByDrill = useMemo(() => {
    return (records || []).filter(r => {
      const d = r.data || {};
      for (const step of drillStack) {
        if (!step.levelKey || step.value === 'Semua') continue;
        const cellVal = String(getRecordVal(d, step.levelKey) || '').trim().toLowerCase();
        const stepVal = step.value.trim().toLowerCase();
        if (cellVal !== stepVal) {
          return false;
        }
      }
      return true;
    });
  }, [records, drillStack]);

  // Compute Current Group Items or Samples
  const computedGroups = useMemo(() => {
    if (!selectedActivity || !currentForm || isDeepestLevel || !currentGroupingKey) {
      return [];
    }

    const groupMap: Record<string, any[]> = {};
    
    // Check if field defined in schema
    const fieldObj = (currentForm?.fields || []).find((f: any) => 
      (f.columnName && f.columnName.toLowerCase() === currentGroupingKey.toLowerCase()) || 
      (f.label && f.label.toLowerCase() === currentGroupingKey.toLowerCase())
    );
    const predefinedOptions: string[] = Array.isArray(fieldObj?.options) ? fieldObj.options : [];

    predefinedOptions.forEach(opt => {
      if (opt && String(opt).trim()) groupMap[String(opt).trim()] = [];
    });

    recordsFilteredByDrill.forEach(rec => {
      const d = rec.data || {};
      const rawVal = getRecordVal(d, currentGroupingKey) || (fieldObj?.columnName ? getRecordVal(d, fieldObj.columnName) : '');
      const strVal = (rawVal !== undefined && rawVal !== null) ? String(rawVal).trim() : '';
      const val = strVal !== '' ? strVal : 'Lainnya';
      if (!groupMap[val]) groupMap[val] = [];
      groupMap[val].push(rec);
    });

    return Object.entries(groupMap)
      .map(([name, items]) => ({
        name,
        count: items.length,
        records: items
      }))
      .filter(g => g.count > 0 || predefinedOptions.includes(g.name))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [selectedActivity, currentForm, isDeepestLevel, currentGroupingKey, recordsFilteredByDrill]);

  // Filtered samples when reaching final level
  const displayedSamples = useMemo(() => {
    return recordsFilteredByDrill.filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const d = r.data || {};
      return Object.values(d).some(v => String(v).toLowerCase().includes(q));
    });
  }, [recordsFilteredByDrill, searchQuery]);

  // Auto-save form draft to localStorage on every change (Antisipasi data hilang)
  // Dynamic GPS field discovery from schema
  const primaryGpsField = useMemo(() => {
    return (currentForm?.fields || []).find((f: any) => {
      const t = String(f.dataType || f.type || '').toLowerCase();
      return t === 'latlong' || t === 'gps' || t === 'lokasi' || t === 'koordinat';
    });
  }, [currentForm?.fields]);

  const primaryGpsColumnName = primaryGpsField?.columnName || primaryGpsField?.label || activeGpsFieldName || 'Lokasi GPS';

  useEffect(() => {
    if (viewMode === 'form_entry' && currentForm?.id && editingRecord?.id) {
      try {
        const draftKey = `garda_form_draft_${currentForm.id}_${editingRecord.id}`;
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch (e) {}
    }
  }, [formData, viewMode, currentForm?.id, editingRecord?.id]);

  // Open Interactive Map Modal
  const handleOpenMapPicker = (fieldName?: string) => {
    const targetFieldName = fieldName || primaryGpsColumnName;
    setActiveGpsFieldName(targetFieldName);
    if (gpsLocation) {
      setMapTempCoords([gpsLocation.lat, gpsLocation.lng]);
    } else {
      const existingVal = getRecordVal(formData, targetFieldName);
      if (existingVal && typeof existingVal === 'string' && existingVal.includes(',')) {
        const parts = existingVal.split(',').map(s => parseFloat(s.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          setMapTempCoords([parts[0], parts[1]]);
          setIsMapModalOpen(true);
          return;
        }
      }
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
    const targetCol = activeGpsFieldName || primaryGpsColumnName;
    setFormData(prev => ({
      ...prev,
      [targetCol]: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
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
        const targetCol = activeGpsFieldName || primaryGpsColumnName;
        setFormData(prev => ({
          ...prev,
          [targetCol]: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }));
      },
      (err) => {
        setIsLocating(false);
        alert(`Gagal mengambil titik GPS (${err.message}). Pastikan GPS aktif.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Start Form Entry (with Draft Restoration to prevent data loss)
  const handleStartFormEntry = (record?: any) => {
    if (record) {
      setEditingRecord(record);
      let initialValues = { ...(record.data || {}) };

      // Restore unsaved draft if available
      try {
        const draftKey = `garda_form_draft_${currentForm?.id}_${record.id}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          initialValues = { ...initialValues, ...parsed };
        }
      } catch (e) {}

      setFormData(initialValues);
      
      const rawGpsStr = getRecordVal(initialValues, primaryGpsColumnName);
      if (record.latitude && record.longitude) {
        setGpsLocation({ lat: Number(record.latitude), lng: Number(record.longitude) });
      } else if (rawGpsStr && typeof rawGpsStr === 'string' && rawGpsStr.includes(',')) {
        const parts = rawGpsStr.split(',').map(s => parseFloat(s.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          setGpsLocation({ lat: parts[0], lng: parts[1] });
        } else {
          setGpsLocation(null);
        }
      } else {
        setGpsLocation(null);
      }
    } else {
      const newId = `rec_${Date.now()}`;
      let emptyData: Record<string, any> = {};

      // Auto-prefill selected grouping levels into form data
      drillStack.forEach(step => {
        if (step.levelKey && step.value && step.value !== 'Semua') {
          emptyData[step.levelKey] = step.value;
        }
      });

      if (currentForm?.fields) {
        currentForm.fields.forEach((f: any) => {
          if (emptyData[f.columnName] === undefined) emptyData[f.columnName] = '';
        });
      }

      const recId = `${currentForm?.id || 'form'}_${newId}`;

      // Restore draft if available for new record
      try {
        const draftKey = `garda_form_draft_${currentForm?.id}_${recId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          emptyData = { ...emptyData, ...parsed };
        }
      } catch (e) {}

      const newRec = {
        id: recId,
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

  // State for Watermark Warnings on Uploaded Photos
  const [watermarkWarnings, setWatermarkWarnings] = useState<Record<string, string>>({});

  // Helper to Detect Third-Party Watermark / Timestamp on Uploaded Photos
  const checkImageForWatermark = (file: File, base64Url: string): Promise<{ hasWatermark: boolean; reason?: string }> => {
    return new Promise((resolve) => {
      // 1. Check file name keywords (common in third party camera apps)
      const lowerName = (file.name || '').toLowerCase();
      if (
        lowerName.includes('timestamp') ||
        lowerName.includes('gps') ||
        lowerName.includes('watermark') ||
        lowerName.includes('notecam') ||
        lowerName.includes('surveycam') ||
        lowerName.includes('stamp') ||
        lowerName.includes('geotag')
      ) {
        resolve({ 
          hasWatermark: true, 
          reason: 'Nama berkas terdeteksi dari aplikasi kamera watermark/timestamp eksternal.' 
        });
        return;
      }

      // 2. Visual Canvas Inspection on bottom/corner banner area (where GPS camera apps burn dark text strips)
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const sampleW = 320;
          const sampleH = Math.max(100, Math.round((img.height * sampleW) / img.width));
          canvas.width = sampleW;
          canvas.height = sampleH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ hasWatermark: false });
            return;
          }

          ctx.drawImage(img, 0, 0, sampleW, sampleH);

          // Check bottom 14% banner zone
          const bannerY = Math.round(sampleH * 0.86);
          const bannerH = sampleH - bannerY;
          const imgData = ctx.getImageData(0, bannerY, sampleW, bannerH).data;

          let darkCount = 0;
          let brightCount = 0;
          const totalSamplePixels = sampleW * bannerH;

          for (let i = 0; i < imgData.length; i += 4) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (lum < 40) darkCount++;
            if (lum > 215) brightCount++;
          }

          const darkRatio = darkCount / totalSamplePixels;
          const brightRatio = brightCount / totalSamplePixels;

          // Watermark banner typically has high dark background and crisp bright text
          if ((darkRatio > 0.40 && brightRatio > 0.04) || darkRatio > 0.70) {
            resolve({ 
              hasWatermark: true, 
              reason: 'Pola bilah watermark/timestamp terdeteksi di bagian bawah foto.' 
            });
            return;
          }

          resolve({ hasWatermark: false });
        } catch (err) {
          resolve({ hasWatermark: false });
        }
      };
      img.onerror = () => resolve({ hasWatermark: false });
      img.src = base64Url;
    });
  };

  // Save Record
  const handleSaveRecord = async (targetStatus: 'draft' | 'submitted') => {
    if (!currentForm || !editingRecord) return;

    // Security check: If lock on submit is active and already submitted
    if (lockOnSubmit && !isLiveEdit && editingRecord.status === 'submitted') {
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

    // Validate Custom Field Rules (Number, Date, Time, Image)
    if (targetStatus === 'submitted' && currentForm.fields) {
      const validationErrors: string[] = [];
      currentForm.fields.forEach((f: any) => {
        const val = formData[f.columnName];
        if (val === undefined || val === null || String(val).trim() === '') return;
        const vRule = f.validation;
        if (!vRule || !vRule.operator || vRule.operator === 'none') return;

        const label = f.label || f.columnName;
        const dt = String(f.dataType || f.type || '').toLowerCase();

        if (dt === 'number' || dt === 'angka') {
          const numVal = parseFloat(String(val));
          if (isNaN(numVal)) {
            validationErrors.push(`${label}: Nilai harus berupa angka valid`);
          } else if (vRule.operator === 'range') {
            const min = parseFloat(vRule.min);
            const max = parseFloat(vRule.max);
            if (!isNaN(min) && numVal < min) validationErrors.push(`${label}: Nilai (${numVal}) kurang dari batas minimum (${min})`);
            if (!isNaN(max) && numVal > max) validationErrors.push(`${label}: Nilai (${numVal}) melebihi batas maksimum (${max})`);
          } else if (vRule.operator === '>=') {
            const threshold = parseFloat(vRule.value);
            if (!isNaN(threshold) && numVal < threshold) validationErrors.push(`${label}: Nilai harus >= ${threshold}`);
          } else if (vRule.operator === '<=') {
            const threshold = parseFloat(vRule.value);
            if (!isNaN(threshold) && numVal > threshold) validationErrors.push(`${label}: Nilai harus <= ${threshold}`);
          } else if (vRule.operator === '>') {
            const threshold = parseFloat(vRule.value);
            if (!isNaN(threshold) && numVal <= threshold) validationErrors.push(`${label}: Nilai harus > ${threshold}`);
          } else if (vRule.operator === '<') {
            const threshold = parseFloat(vRule.value);
            if (!isNaN(threshold) && numVal >= threshold) validationErrors.push(`${label}: Nilai harus < ${threshold}`);
          } else if (vRule.operator === '==') {
            const threshold = parseFloat(vRule.value);
            if (!isNaN(threshold) && numVal !== threshold) validationErrors.push(`${label}: Nilai harus sama dengan ${threshold}`);
          }
        } else if (dt === 'date' || dt === 'tanggal') {
          const strVal = String(val);
          if (vRule.operator === 'range') {
            if (vRule.min && strVal < vRule.min) validationErrors.push(`${label}: Tanggal tidak boleh sebelum ${vRule.min}`);
            if (vRule.max && strVal > vRule.max) validationErrors.push(`${label}: Tanggal tidak boleh setelah ${vRule.max}`);
          } else if (vRule.operator === '>=' && vRule.value && strVal < vRule.value) {
            validationErrors.push(`${label}: Tanggal minimal ${vRule.value}`);
          } else if (vRule.operator === '<=' && vRule.value && strVal > vRule.value) {
            validationErrors.push(`${label}: Tanggal maksimal ${vRule.value}`);
          } else if (vRule.operator === '>' && vRule.value && strVal <= vRule.value) {
            validationErrors.push(`${label}: Tanggal harus setelah ${vRule.value}`);
          } else if (vRule.operator === '<' && vRule.value && strVal >= vRule.value) {
            validationErrors.push(`${label}: Tanggal harus sebelum ${vRule.value}`);
          } else if (vRule.operator === '==' && vRule.value && strVal !== vRule.value) {
            validationErrors.push(`${label}: Tanggal harus ${vRule.value}`);
          }
        } else if (dt === 'time' || dt === 'jam') {
          const strVal = String(val);
          if (vRule.operator === 'range') {
            if (vRule.min && strVal < vRule.min) validationErrors.push(`${label}: Jam tidak boleh sebelum ${vRule.min}`);
            if (vRule.max && strVal > vRule.max) validationErrors.push(`${label}: Jam tidak boleh setelah ${vRule.max}`);
          } else if (vRule.operator === '>=' && vRule.value && strVal < vRule.value) {
            validationErrors.push(`${label}: Jam paling awal adalah ${vRule.value}`);
          } else if (vRule.operator === '<=' && vRule.value && strVal > vRule.value) {
            validationErrors.push(`${label}: Jam paling akhir adalah ${vRule.value}`);
          } else if (vRule.operator === '>' && vRule.value && strVal <= vRule.value) {
            validationErrors.push(`${label}: Jam harus setelah ${vRule.value}`);
          } else if (vRule.operator === '<' && vRule.value && strVal >= vRule.value) {
            validationErrors.push(`${label}: Jam harus sebelum ${vRule.value}`);
          } else if (vRule.operator === '==' && vRule.value && strVal !== vRule.value) {
            validationErrors.push(`${label}: Jam harus ${vRule.value}`);
          }
        }
      });

      if (validationErrors.length > 0) {
        alert(`Perbaiki isian berikut sebelum mengirim laporan:\n• ${validationErrors.join('\n• ')}`);
        return;
      }
    }

    try {
      setIsSaving(true);
      const finalFormData = { ...formData };
      if (gpsLocation) {
        const gpsStr = `${gpsLocation.lat.toFixed(6)}, ${gpsLocation.lng.toFixed(6)}`;
        if (primaryGpsColumnName) {
          finalFormData[primaryGpsColumnName] = gpsStr;
        }
        (currentForm.fields || []).forEach((f: any) => {
          const t = String(f.dataType || f.type || '').toLowerCase();
          if (t === 'latlong' || t === 'gps' || t === 'lokasi' || t === 'koordinat') {
            if (!finalFormData[f.columnName] || !String(finalFormData[f.columnName]).includes(',')) {
              finalFormData[f.columnName] = gpsStr;
            }
          }
        });
      }

      const payload = {
        id: editingRecord.id,
        rowId: editingRecord.rowId,
        data: finalFormData,
        status: targetStatus,
        latitude: gpsLocation?.lat || null,
        longitude: gpsLocation?.lng || null,
        submittedBy: user?.name || user?.username || 'Petugas'
      };

      let networkSuccess = false;
      let serverErrorMsg: string | null = null;

      try {
        const res = await fetch(`${baseUrl}/api/laporan/forms/${currentForm.id}/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          networkSuccess = true;
        } else {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 403) {
            serverErrorMsg = errData.error || 'Aplikasi laporan sedang ditutup oleh Administrator.';
          } else {
            console.warn('Backend returned non-200:', res.status, errData);
          }
        }
      } catch (networkErr) {
        console.warn('Network offline or server unreachable, stored locally:', networkErr);
      }

      if (serverErrorMsg) {
        alert(serverErrorMsg);
        setIsSaving(false);
        return;
      }

      const updatedRec = {
        ...editingRecord,
        status: targetStatus,
        data: finalFormData,
        latitude: gpsLocation?.lat || null,
        longitude: gpsLocation?.lng || null
      };

      const isExisting = (records || []).some(r => r.id === editingRecord.id);
      const updatedList = isExisting
        ? records.map(r => r.id === editingRecord.id ? updatedRec : r)
        : [updatedRec, ...(records || [])];

      setRecords(updatedList);
      localStorage.setItem(`garda_laporan_records_${currentForm.id}`, JSON.stringify(updatedList));

      // Hapus draft tersimpan setelah berhasil disimpan / disubmit
      try {
        const draftKey = `garda_form_draft_${currentForm.id}_${editingRecord.id}`;
        localStorage.removeItem(draftKey);
      } catch (e) {}

      if (targetStatus === 'submitted') {
        setSaveSuccessMsg(networkSuccess ? 'Laporan berhasil dikirim ke server!' : 'Laporan tersimpan di memori lokal (Mode Offline)');
      } else {
        setSaveSuccessMsg('Draf berhasil disimpan!');
      }

      setTimeout(() => setSaveSuccessMsg(null), 3500);

      setEditingRecord(null);
      setViewMode('grouping_view');
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormLocked = !isLiveEdit && lockOnSubmit && editingRecord?.status === 'submitted';

  return (
    <div className={`flex flex-col mx-auto bg-white dark:bg-slate-900 overflow-hidden relative transition-colors duration-300 ${
      isSimulator 
        ? 'w-full h-full rounded-[36px]' 
        : 'h-[calc(100vh-6rem)] w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md'
    }`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {saveSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xl border border-slate-700/50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP APP BAR MATCHING REFERENCE SCREENSHOT */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          {!selectedActivity ? (
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
          ) : viewMode === 'form_entry' ? (
            <button
              onClick={() => setViewMode('grouping_view')}
              className="p-1 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : drillStack.length > 0 ? (
            <button
              onClick={() => {
                setDrillStack(prev => prev.slice(0, prev.length - 1));
              }}
              className="p-1 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
              title="Kembali ke level sebelumnya"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsActivityDrawerOpen(true)}
              className="p-1 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
              title="Menu & Informasi Kegiatan"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {!selectedActivity
                ? 'Pilih Kegiatan Pendataan'
                : viewMode === 'form_entry'
                ? (formData[activeGroupingLevels[1] || 'Nama KRT'] || currentForm?.title || 'Isian Formulir')
                : drillStack.length > 0
                ? drillStack[drillStack.length - 1].value
                : (currentForm?.title || selectedActivity?.title || 'Daftar Grup')}
            </h2>
            {selectedActivity && drillStack.length > 0 && viewMode === 'grouping_view' && (
              <span className="text-[10px] text-slate-400 font-medium truncate">
                Level {drillStack.length + 1}: {currentGroupingKey}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-700 dark:text-slate-300">
          {selectedActivity && isDeepestLevel && viewMode === 'grouping_view' && (
            <button
              onClick={() => handleStartFormEntry()}
              style={{ backgroundColor: activityThemeColor }}
              className="px-2.5 py-1 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer"
              title="Tambah Assignment Baru"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="text-[11px] hidden sm:inline">Tambah</span>
            </button>
          )}
          <button
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            className={`p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
              isSearchVisible ? 'bg-slate-100 dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-bold' : ''
            }`}
            title="Pencarian Data"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (selectedActivity && currentForm?.id) {
                fetchRecords(currentForm.id);
              } else {
                fetchActivities();
              }
            }}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sinkronkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collapsible Search Input Bar */}
      <AnimatePresence>
        {isSearchVisible && selectedActivity && viewMode === 'grouping_view' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-2.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 z-10"
          >
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder={isDeepestLevel ? "Cari assignment / data responden..." : `Cari ${currentGroupingKey}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary-500 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BREADCRUMB LEVEL HIERARCHY */}
      {selectedActivity && drillStack.length > 0 && viewMode !== 'form_entry' && (
        <div className="bg-slate-100/90 dark:bg-slate-800/90 px-3.5 py-1.5 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 overflow-x-auto shrink-0 font-medium">
          <span 
            onClick={() => setDrillStack([])}
            className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer font-bold"
          >
            Level 1
          </span>
          {drillStack.map((step, sIdx) => (
            <React.Fragment key={sIdx}>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span 
                onClick={() => setDrillStack(prev => prev.slice(0, sIdx + 1))}
                className={`truncate cursor-pointer ${sIdx === drillStack.length - 1 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-primary-600 dark:text-primary-400 hover:underline'}`}
              >
                {step.value}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* MAIN CONTAINER: SIDEBAR (OPTIONAL) + CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION (IF navMode === 'sidebar' || navMode === 'both') */}
        {selectedActivity && viewMode !== 'form_entry' && forms && forms.length > 0 && (navMode === 'sidebar' || navMode === 'both') && (
          <div className="w-16 sm:w-48 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-2 flex flex-col gap-1.5 shrink-0 overflow-y-auto custom-scrollbar z-20">
            <span className="hidden sm:block text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
              Daftar Formulir
            </span>
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
                  className={`flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer text-left ${
                    isActive 
                      ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-800 shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                  }`}
                  title={f.title}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>
                    <FormIcon className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:inline text-xs truncate">{f.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN CONTENT VIEW AREA */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 ${(navMode === 'sidebar' && navMode !== 'both') ? 'pb-16' : 'pb-32'} bg-slate-50 dark:bg-slate-950/80 relative`}>
        
        {/* =====================================================================
            VIEW 0: DAFTAR KEGIATAN CARD HUB (DITAMPILKAN AWAL UNTUK ROLE PETUGAS)
            ===================================================================== */}
        {!selectedActivity && (
          <div className="space-y-4">
            {/* Header banner info */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm">
                <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Kegiatan Pendataan & Survei Lapangan</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
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
                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-300 font-medium shadow-2xs"
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
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-1">
                <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-200">Tidak ada kegiatan yang ditemukan</p>
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
                        className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden"
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
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                                {act.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                {act.description || 'Formulir pendataan dan pencacahan digital lapangan.'}
                              </p>
                            </div>
                          </div>

                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/50 group-hover:text-primary-600 dark:group-hover:text-primary-400 flex items-center justify-center text-slate-400 transition-colors shrink-0 mt-0.5">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Badges and Call-to-action */}
                        <div className="flex items-center flex-wrap gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Aktif</span>
                          </span>

                          {act.connectedSheetUrl && (
                            <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                              <span>Google Sheets</span>
                            </span>
                          )}

                          <span className="ml-auto text-[11px] font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            <span>Buka E-Form</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
            <div className="h-24 w-full shrink-0" />
          </div>
        )}

        {/* =====================================================================
            VIEW 1: GROUPING LEVEL HIERARCHY (LEVEL 1 -> LEVEL 2 -> LEVEL 3 -> LEVEL 4)
            ===================================================================== */}
        {selectedActivity && viewMode === 'grouping_view' && (
          <div className="space-y-3">
            {/* If NOT at deepest level: show grouping items */}
            {!isDeepestLevel ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                {computedGroups.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Tidak ada data grup yang ditemukan.
                  </div>
                ) : (
                  <>
                    {/* "All" Option at top */}
                    <div
                      onClick={() => {
                        // Jika memilih 'All', langsung bypass level grouping ini atau drill down ke level berikutnya
                        const nextLevelIndex = currentLevelIndex + 1;
                        if (nextLevelIndex >= activeGroupingLevels.length) {
                          // Menampilkan semua assignment
                          setDrillStack(prev => [
                            ...prev,
                            { levelIndex: currentLevelIndex, levelKey: currentGroupingKey, value: 'Semua' }
                          ]);
                        } else {
                          setDrillStack(prev => [
                            ...prev,
                            { levelIndex: currentLevelIndex, levelKey: currentGroupingKey, value: 'Semua' }
                          ]);
                        }
                        setSearchQuery('');
                      }}
                      className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: activityThemeColor }}
                        >
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                          All
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    {/* Group Items */}
                    {computedGroups.map((grp, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const nextLevelIndex = currentLevelIndex + 1;
                          const isFinalGroupLevel = nextLevelIndex >= activeGroupingLevels.length;

                          // Jika grouping sudah habis di level ini
                          if (isFinalGroupLevel) {
                            if (grp.records && grp.records.length === 1) {
                              // Langsung buka form isian untuk assignment tunggal
                              handleStartFormEntry(grp.records[0]);
                              return;
                            } else if (grp.records && grp.records.length === 0) {
                              // Langsung buka form kosong baru dengan grouping terisi
                              setDrillStack(prev => [
                                ...prev,
                                { levelIndex: currentLevelIndex, levelKey: currentGroupingKey, value: grp.name }
                              ]);
                              handleStartFormEntry();
                              return;
                            }
                          }

                          setDrillStack(prev => [
                            ...prev,
                            { levelIndex: currentLevelIndex, levelKey: currentGroupingKey, value: grp.name }
                          ]);
                          setSearchQuery('');
                        }}
                        className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: activityThemeColor }}
                          >
                            {grp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                              {grp.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 block truncate">
                              {currentGroupingKey}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {grp.count}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              /* If REACHED DEEPEST LEVEL: Show assignment records with circular photo & GPS pin */
              <div className="space-y-2.5">
                {displayedSamples.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Belum Ada Assignment</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Belum ada data assignment pada kelompok ini.
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartFormEntry()}
                      style={{ backgroundColor: activityThemeColor }}
                      className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Assignment Baru</span>
                    </button>
                  </div>
                ) : (
                  displayedSamples.map((sample, idx) => {
                    const d = sample.data || {};
                    const labelField = (currentForm?.fields || []).find((f: any) => f.isLabel);
                    const labelKey = labelField?.columnName || labelField?.label;
                    const keyField = (currentForm?.fields || []).find((f: any) => f.isKey && f.columnName !== labelKey);
                    const keyCol = keyField?.columnName || keyField?.label;
                    const photoField = (currentForm?.fields || []).find((f: any) => f.dataType === 'Image' || f.type === 'Image');

                    const title = (labelKey ? getRecordVal(d, labelKey) : '') || getRecordVal(d, 'Nama KRT') || getRecordVal(d, 'Nama Responden') || getRecordVal(d, 'Nama PPL') || `Assignment #${idx + 1}`;
                    const subtitle = (keyCol ? getRecordVal(d, keyCol) : '') || getRecordVal(d, 'SLS') || getRecordVal(d, 'Desa') || getRecordVal(d, 'Kecamatan') || (sample.id ? `ID: ${sample.id}` : `Assignment #${idx + 1}`);
                    const photoUrl = (photoField ? getRecordVal(d, photoField.columnName) : '') || getRecordVal(d, 'Foto Lapangan') || getRecordVal(d, 'Foto');
                    const isSubmitted = sample.status === 'submitted';

                    return (
                      <motion.div
                        key={sample.id || idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleStartFormEntry(sample)}
                        className={`p-3 rounded-2xl border shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSubmitted 
                            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 ring-1 ring-emerald-400/30' 
                            : 'bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {!isCompactLayout && (
                            <div className={`w-11 h-11 rounded-full border overflow-hidden flex items-center justify-center shrink-0 ${
                              isSubmitted
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700'
                                : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                            }`}>
                              {photoUrl ? (
                                <img src={photoUrl} alt="Thumb" className="w-full h-full object-cover" />
                              ) : isSubmitted ? (
                                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                              ) : (
                                <Camera className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {title}
                              </h4>
                              {isSubmitted && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Terkirim Lengkap" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {subtitle}
                            </p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase mt-0.5 ${
                              isSubmitted 
                                ? 'bg-emerald-600 text-white shadow-2xs' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {isSubmitted ? '✓ Terkirim (Selesai)' : 'Draf / Belum Selesai'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (sample.latitude && sample.longitude) {
                                setMapTempCoords([sample.latitude, sample.longitude]);
                                setIsMapModalOpen(true);
                              } else {
                                alert('Assignment ini belum memiliki koordinat GPS.');
                              }
                            }}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              sample.latitude && sample.longitude 
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60' 
                                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                            title={sample.latitude ? `GPS: ${sample.latitude}, ${sample.longitude}` : 'Belum ada GPS'}
                          >
                            <MapPin className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartFormEntry(sample);
                            }}
                            className="p-2 rounded-xl text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors cursor-pointer"
                            title="Buka / Edit Isian E-Form"
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
            <div className="h-28 w-full shrink-0" />
          </div>
        )}

        {/* =====================================================================
            VIEW 2: FORM INPUT / ISIAN SCREEN (GAMBAR 5)
            ===================================================================== */}
        {viewMode === 'form_entry' && (
          <div className="space-y-4 max-w-xl mx-auto pb-10">
            {/* Lock status banner if security enabled */}
            {isFormLocked && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-bold">
                <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
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
                  onClick={() => handleOpenMapPicker(primaryGpsColumnName)}
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
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-2xs">
              {currentForm?.fields && currentForm.fields.length > 0 ? (
                currentForm.fields.map((field: any, idx: number) => {
                  const rawVal = getRecordVal(formData, field.columnName);
                  const val = rawVal !== undefined && rawVal !== null ? rawVal : '';
                  const fieldType = String(field.dataType || field.type || 'Text').toLowerCase();
                  const isFieldReadOnly = isFormLocked || field.isEditable === false || field.isReadOnly === true;

                  const fieldOptions = (Array.isArray(field.options) && field.options.length > 0)
                    ? field.options
                    : Array.from(new Set(records.map(r => String(getRecordVal(r.data, field.columnName) || '').trim()).filter(Boolean)));

                  return (
                    <div key={field.id || idx} className="space-y-1">
                      <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{field.label}</span>
                        {field.isRequired && <span className="text-rose-500">*</span>}
                        {isFieldReadOnly && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal ml-1 inline-flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>(Terkunci)</span>
                          </span>
                        )}
                      </label>

                      {(fieldType === 'enum' || fieldType === 'pilihan' || fieldType === 'dropdown' || fieldType === 'select') ? (
                        <PetugasSelect
                          disabled={isFieldReadOnly}
                          value={String(val || '')}
                          label={field.label}
                          options={fieldOptions}
                          onChange={(v) => setFormData(prev => ({ ...prev, [field.columnName]: v }))}
                        />
                      ) : fieldType === 'angka' || fieldType === 'number' ? (
                        <input
                          type="number"
                          disabled={isFieldReadOnly}
                          readOnly={isFieldReadOnly}
                          value={val}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.columnName]: e.target.value }))}
                          placeholder="0"
                          className={`w-full px-3.5 py-2 border rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 ${
                            isFieldReadOnly 
                              ? 'bg-slate-100/90 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 cursor-not-allowed border-dashed text-slate-500 dark:text-slate-400 font-medium' 
                              : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                          }`}
                        />
                      ) : fieldType === 'tanggal' || fieldType === 'date' ? (
                        <input
                          type="date"
                          disabled={isFieldReadOnly}
                          readOnly={isFieldReadOnly}
                          value={val}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.columnName]: e.target.value }))}
                          className={`w-full px-3.5 py-2 border rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 ${
                            isFieldReadOnly 
                              ? 'bg-slate-100/90 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 cursor-not-allowed border-dashed text-slate-500 dark:text-slate-400 font-medium' 
                              : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                          }`}
                        />
                      ) : fieldType === 'jam' || fieldType === 'time' ? (
                        <input
                          type="time"
                          disabled={isFieldReadOnly}
                          readOnly={isFieldReadOnly}
                          value={val}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.columnName]: e.target.value }))}
                          className={`w-full px-3.5 py-2 border rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 ${
                            isFieldReadOnly 
                              ? 'bg-slate-100/90 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 cursor-not-allowed border-dashed text-slate-500 dark:text-slate-400 font-medium' 
                              : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                          }`}
                        />
                      ) : fieldType === 'latlong' || fieldType === 'lokasi' || fieldType === 'gps' || fieldType === 'koordinat' ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={val}
                            placeholder="Belum ada koordinat..."
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 outline-none"
                          />
                          {!isFieldReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleOpenMapPicker(field.columnName)}
                              className="px-3 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 border border-rose-200 dark:border-rose-800 cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Peta</span>
                            </button>
                          )}
                        </div>
                      ) : fieldType === 'file' || fieldType === 'image' || fieldType === 'foto' ? (
                        <div className="space-y-2">
                          {!isFieldReadOnly && (
                            <label className="flex items-center justify-center gap-2 w-full p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors">
                              <Camera className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                              <span>{isUploading ? 'Mengunggah...' : 'Ambil Foto / Unggah Berkas'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    setIsUploading(true);
                                    const reader = new FileReader();
                                    reader.onload = async () => {
                                      const base64 = reader.result as string;
                                      setFormData(prev => ({ ...prev, [field.columnName]: base64 }));

                                      // Deteksi watermark jika konfigurasi laporan aktif
                                      const repSt = selectedActivity?.settings?.reportSettings;
                                      const isReportActive = repSt?.enableOfficialReport;
                                      const shouldDetect = repSt?.detectWatermark !== false;

                                      if (isReportActive && shouldDetect) {
                                        const res = await checkImageForWatermark(file, base64);
                                        if (res.hasWatermark) {
                                          setWatermarkWarnings(prev => ({
                                            ...prev,
                                            [field.columnName]: 'Foto ini terdeteksi memiliki geotagging atau timestamp. Mohon unggah foto asli yang tidak ada geotagging atau timestamp. Geotagging dan timestamp resmi akan otomatis diambil dari isian Tanggal, Lokasi, dan Jam pada e-form.'
                                          }));
                                        } else {
                                          setWatermarkWarnings(prev => {
                                            const next = { ...prev };
                                            delete next[field.columnName];
                                            return next;
                                          });
                                        }
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (imgErr) {
                                    console.error('Error handling photo upload:', imgErr);
                                  } finally {
                                    setIsUploading(false);
                                  }
                                }}
                              />
                            </label>
                          )}

                          {/* WARNING JIKA TERDETEKSI WATERMARK / TIMESTAMP */}
                          {watermarkWarnings[field.columnName] && (
                            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="font-bold block">Peringatan Integritas Foto</span>
                                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                                  {watermarkWarnings[field.columnName]}
                                </p>
                              </div>
                            </div>
                          )}

                          {val && typeof val === 'string' && (val.startsWith('data:image') || val.startsWith('http') || val.startsWith('blob:') || val.startsWith('/')) ? (
                            <div className="space-y-1.5">
                              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-36 bg-slate-100 dark:bg-slate-800">
                                <img 
                                  src={val} 
                                  alt="Dokumentasi Foto" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }} 
                                />
                                {!isFieldReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({ ...prev, [field.columnName]: '' }));
                                      setWatermarkWarnings(prev => {
                                        const next = { ...prev };
                                        delete next[field.columnName];
                                        return next;
                                      });
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-xl hover:bg-rose-600 cursor-pointer shadow-md transition-colors"
                                    title="Hapus Foto"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {!watermarkWarnings[field.columnName] && selectedActivity?.settings?.reportSettings?.enableOfficialReport && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Foto bersih: Geotagging &amp; timestamp laporan diambil dari isian form</span>
                                </span>
                              )}
                            </div>
                          ) : val && typeof val === 'string' && val.trim() !== '' && !val.startsWith('data:') && !val.startsWith('http') ? (
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 truncate">
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">{String(val)}</span>
                              </div>
                              {!isFieldReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => setFormData(prev => ({ ...prev, [field.columnName]: '' }))}
                                  className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                  title="Hapus"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <input
                          type="text"
                          disabled={isFieldReadOnly}
                          readOnly={isFieldReadOnly}
                          value={val}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.columnName]: e.target.value }))}
                          placeholder={isFieldReadOnly ? 'Data terkunci (Hanya Baca)' : `Isi ${field.label}...`}
                          className={`w-full px-3.5 py-2 border rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 ${
                            isFieldReadOnly 
                              ? 'bg-slate-100/90 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 cursor-not-allowed border-dashed text-slate-500 dark:text-slate-400 font-medium' 
                              : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                          }`}
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                Object.keys(formData).map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{k}</label>
                    <input
                      type="text"
                      disabled={isFormLocked}
                      value={formData[k] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [k]: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-60"
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
                className="py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
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

            <div className="h-28 w-full shrink-0" />
          </div>
        )}
        </div>
      </div>

      {/* FLOATING '+' ACTION BUTTON TO ADD ASSIGNMENT (Hanya muncul saat daftar assignment di grouping terakhir) */}
      {selectedActivity && isDeepestLevel && viewMode !== 'form_entry' && (
        <motion.button
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => handleStartFormEntry()}
          style={{ backgroundColor: activityThemeColor }}
          className={`absolute ${
            navMode === 'sidebar' ? 'bottom-5' : 'bottom-16'
          } right-5 z-40 p-3.5 sm:px-4 sm:py-3 rounded-full text-white flex items-center gap-2 shadow-xl shadow-primary-500/30 hover:shadow-2xl transition-all cursor-pointer ring-4 ring-white dark:ring-slate-900`}
          title="Tambah Assignment Baru"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span className="hidden sm:inline text-xs font-bold">Tambah Assignment</span>
        </motion.button>
      )}

      {/* BOTTOM FORM SELECTOR TABS (Muncul jika navMode === 'bottom_bar' atau 'both') */}
      {selectedActivity && viewMode !== 'form_entry' && forms && forms.length > 0 && (navMode === 'bottom_bar' || navMode === 'both') && (
        <div className="absolute bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around z-30 shadow-lg">
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
                className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative max-w-[180px] ${
                  isActive ? 'font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
                }`}
                style={{ color: isActive ? activityThemeColor : undefined }}
              >
                <div 
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all mb-0.5 ${
                    isActive ? 'shadow-2xs scale-105' : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={{
                    backgroundColor: isActive ? `${activityThemeColor}18` : undefined,
                    color: isActive ? activityThemeColor : undefined
                  }}
                >
                  <FormIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] leading-tight text-center line-clamp-2 max-w-[140px]">
                  {f.title}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeFormTabPetugas"
                    className="absolute -bottom-1 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: activityThemeColor }}
                  />
                )}
              </button>
            );
          })}
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
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-xl w-full p-4 sm:p-5 space-y-3 flex flex-col h-[85vh] max-h-[640px]"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pilih Titik Lokasi Lapangan</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400">Geser pin merah atau ketuk peta untuk memindahkan titik</p>
                </div>
              </div>
              <button onClick={() => setIsMapModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
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
                className="absolute top-3 right-3 z-[1000] p-2.5 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Arahkan ke Lokasi Saya Sekarang"
              >
                <LocateFixed className={`w-4 h-4 text-rose-600 dark:text-rose-400 ${isLocating ? 'animate-spin' : ''}`} />
                <span>Posisi Saya</span>
              </button>
            </div>

            {/* Coordinates Display Bar */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Koordinat Terpilih</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {mapTempCoords[0].toFixed(6)}, {mapTempCoords[1].toFixed(6)}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">Bisa digeser manual</span>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
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
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-sm w-full p-5 space-y-3 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pilih Kegiatan Lapangan</h3>
              </div>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
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
                      isSel ? 'bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-slate-900 dark:text-slate-100 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <ActIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs truncate">{act.title}</span>
                    </div>
                    {isSel && <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* ACTIVITY INFO & DESCRIPTION DRAWER / MODAL */}
      {isActivityDrawerOpen && selectedActivity && (
        <div className="fixed inset-0 z-[130] flex items-center sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-2xs"
                  style={{ backgroundColor: activityThemeColor }}
                >
                  {React.createElement(getIconComponent(selectedActivity.icon, Layers), { className: "w-5 h-5" })}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {selectedActivity.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Informasi & Deskripsi Kegiatan</span>
                </div>
              </div>
              <button 
                onClick={() => setIsActivityDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description Section ("Ini kegiatan apa") */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Tentang Kegiatan Ini
              </span>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {selectedActivity.description && selectedActivity.description.trim().length > 0 
                  ? selectedActivity.description 
                  : 'Kegiatan pendataan dan verifikasi lapangan aktif. Silakan pilih formulir dan isi assignment responden sesuai instruksi kerja.'}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 font-medium block">Formulir Terkait</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {forms.length} e-Form
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 font-medium block">Total Assignment</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {records.length} Data
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsActivityDrawerOpen(false);
                  setIsActivityModalOpen(true);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Ganti Kegiatan Lain</span>
              </button>

              <button
                type="button"
                onClick={() => setIsActivityDrawerOpen(false)}
                style={{ backgroundColor: activityThemeColor }}
                className="w-full py-2.5 px-4 text-white rounded-2xl text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer text-center"
              >
                Tutup & Lanjutkan Pendataan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
