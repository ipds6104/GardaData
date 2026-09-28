import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Plus, Trash2, Save, Download, RefreshCw, Eye, 
  Layers, Power, Settings,
  FileSpreadsheet, ChevronRight, ChevronDown, ChevronUp, ChevronLeft, CheckCircle2,
  AlertCircle, Copy, Info, BarChart3, Check, Type, Hash,
  MapPin, UploadCloud, Calendar, Clock, Sparkles,
  Pencil, Edit3, BookOpen, HelpCircle, ArrowLeft,
  FileText, ClipboardList, CheckSquare, Building2, Home, Users,
  Wheat, Truck, Folder, HeartPulse, GraduationCap, DollarSign,
  Search, MoreVertical, ShieldAlert, Sliders, Play, Smartphone,
  ExternalLink, X, Shield, Bell, Palette, Globe, Lock, SlidersHorizontal,
  FileCheck2, Database, Wifi, KeyRound, AlertTriangle, Send, LayoutTemplate,
  Sidebar, Briefcase, Landmark, Factory, Tag, Cpu, Award, Lightbulb,
  Tablet, Monitor, Undo2, Redo2
} from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { getIconComponent, AVAILABLE_ICONS, DATA_TYPES, getRecordVal, cleanText, normalizeKey, normalizeStringVal } from './laporanConstants';
import { PetugasLaporanModule } from './PetugasLaporanModule';

// Helper to sanitize and clean options array (strip brackets, empty tokens, stringified JSON)
export function sanitizeOptions(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map(item => String(item || '').trim())
      .filter(item => item !== '' && item !== '[' && item !== ']' && item !== '[,]' && item !== 'null' && item !== 'undefined');
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return sanitizeOptions(parsed);
        }
      } catch (e) {}
    }
    return trimmed
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '' && item !== '[' && item !== ']' && item !== '[,]' && item !== 'null' && item !== 'undefined');
  }
  return [];
}

// Custom Smooth Dropdown Component
interface DropdownOption {
  value: string;
  label: string;
  icon?: any;
  desc?: string;
}

const CustomDropdown: React.FC<{
  value: string;
  options: DropdownOption[];
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  size?: 'sm' | 'md';
}> = ({
  value,
  options,
  onChange,
  placeholder = 'Pilih...',
  className = '',
  disabled = false,
  searchable = false,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If space below is less than 240px and space above is greater, open upward
      if (spaceBelow < 250 && spaceAbove > 200) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  const selectedOpt = options.find(o => 
    o.value === value || 
    (typeof value === 'string' && typeof o.value === 'string' && o.value.trim().toLowerCase() === value.trim().toLowerCase())
  );

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const q = searchTerm.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, searchTerm]);

  const isSmall = size === 'sm';

  return (
    <div ref={ref} className={`relative ${className} ${isOpen ? 'z-[60]' : ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        className={`w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 flex items-center justify-between transition-all cursor-pointer shadow-2xs font-medium ${
          isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2.5 text-xs'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOpt?.icon && <selectedOpt.icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />}
          <span className="truncate font-semibold">{selectedOpt ? selectedOpt.label : placeholder}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? -4 : 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? -3 : 3, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute left-0 right-0 ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-1.5 space-y-1 max-h-56 overflow-y-auto custom-scrollbar ring-1 ring-black/10 min-w-[130px]`}
          >
            {(searchable || options.length > 7) && (
              <div className="p-1 pb-1.5 border-b border-slate-100 dark:border-slate-700/60 sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs z-10">
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Cari..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary-400"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-400 text-xs">
                Tidak ada opsi yang cocok.
              </div>
            ) : (
              filteredOptions.map((opt: DropdownOption) => {
                const isSel = opt.value === value || 
                  (typeof value === 'string' && typeof opt.value === 'string' && opt.value.trim().toLowerCase() === value.trim().toLowerCase());
                const OptIcon = opt.icon;

                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`p-2 rounded-xl text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSel 
                        ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-200 font-bold border border-primary-200 dark:border-primary-800' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {OptIcon && <OptIcon className={`w-3.5 h-3.5 ${isSel ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.desc && <span className="text-[10px] text-slate-400 font-normal block truncate">{opt.desc}</span>}
                      </div>
                    </div>
                    {isSel && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AdminLaporanManagerProps {
  onBack?: () => void;
  user?: any;
}

export const AdminLaporanManager: React.FC<AdminLaporanManagerProps> = ({ onBack, user }) => {
  const { presetInfo } = useTheme();

  // Screen State: 'apps_home' (Gambar 1) vs 'studio' (Gambar 2)
  const [adminScreen, setAdminScreen] = useState<'apps_home' | 'studio'>('apps_home');

  // Subheader View Toggle: 'apps' vs 'databases'
  const [activeMainTab, setActiveMainTab] = useState<'apps' | 'databases'>('apps');

  // Studio Subtab: 'data' | 'ui' | 'automation' | 'security' | 'settings'
  const [studioTab, setStudioTab] = useState<'data' | 'ui' | 'automation' | 'security' | 'settings'>('data');

  // Sidebar Filter in Home (Gambar 1): 'owned' | 'templates'
  const [homeSidebarFilter, setHomeSidebarFilter] = useState<'owned' | 'templates'>('owned');
  const [homeSearchQuery, setHomeSearchQuery] = useState<string>('');
  const [homeSortOrder, setHomeSortOrder] = useState<string>('recent');

  // Activities State
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState<boolean>(false);
  const [newActivityForm, setNewActivityForm] = useState({
    title: '',
    description: '',
    category: 'Statistik Distribusi & Harga',
    sheetUrl: '',
    sheetName: 'Sheet1',
    isOpen: true,
    icon: 'Layers'
  });

  // Forms of Selected Activity
  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState<boolean>(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormSheetUrl, setNewFormSheetUrl] = useState('');
  const [newFormSheetName, setNewFormSheetName] = useState('');
  const [newFormIcon, setNewFormIcon] = useState('FileText');
  const [simulatorDevice, setSimulatorDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [isLiveEdit, setIsLiveEdit] = useState<boolean>(true);
  const [showActivityInfoModal, setShowActivityInfoModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Schema Columns of Selected Form
  const [fields, setFields] = useState<any[]>([]);
  const [isSavingSchema, setIsSavingSchema] = useState<boolean>(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);

  // Form Config (Supports up to Level 4 Grouping)
  const selectedForm = (forms || []).find(f => f.id === selectedFormId) || (forms && forms.length > 0 ? forms[0] : null);
  const [formConfig, setFormConfig] = useState({
    title: '',
    sheetUrl: '',
    sheetName: 'Sheet1',
    groupingLevels: ['Nama PPL', 'Kecamatan', 'Desa', 'SLS / RT']
  });

  // UI, Automation & Security Settings State
  const [uxSettings, setUxSettings] = useState<{
    themeColor: string;
    viewLayout: string;
    showBadges: boolean;
    compactMode: boolean;
    navMode: 'bottom_bar' | 'sidebar' | 'both';
  }>({
    themeColor: '#0ea5e9',
    viewLayout: 'card_list',
    showBadges: true,
    compactMode: false,
    navMode: 'bottom_bar'
  });

  // Move Form Order (Bottom Bar / Sidebar Navigation Order)
  const handleMoveForm = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= forms.length) return;
    const updated = [...forms];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setForms(updated);
    if (selectedActivity?.id) {
      localStorage.setItem(`garda_laporan_forms_${selectedActivity.id}`, JSON.stringify(updated));
    }
  };

  const [autoSettings, setAutoSettings] = useState({
    syncFrequency: 'realtime',
    webhookUrl: '',
    notifyWhatsapp: false,
    enableGeofence: true,
    maxRadiusMeters: 250
  });

  const [securitySettings, setSecuritySettings] = useState({
    lockOnSubmit: false,
    allowPetugasDelete: false,
    requireGPS: false,
    requirePhoto: false
  });

  const [reportSettings, setReportSettings] = useState<{
    enableOfficialReport: boolean;
    targetFormId: string;
    dateColumn: string;
    timeColumn: string;
    gpsColumn: string;
    photoColumn: string;
    detectWatermark: boolean;
  }>({
    enableOfficialReport: false,
    targetFormId: '',
    dateColumn: '',
    timeColumn: '',
    gpsColumn: '',
    photoColumn: '',
    detectWatermark: true
  });

  // Undo & Redo History Management
  interface StudioHistoryState {
    fields: any[];
    formConfig: {
      title: string;
      sheetUrl: string;
      sheetName: string;
      groupingLevels: string[];
    };
    uxSettings: any;
    autoSettings: any;
    securitySettings: any;
    reportSettings: any;
  }

  const [historyStack, setHistoryStack] = useState<StudioHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryActionRef = useRef<boolean>(false);

  // Helper to push history snapshot
  const pushHistorySnapshot = (
    newFields = fields,
    newFormConfig = formConfig,
    newUx = uxSettings,
    newAuto = autoSettings,
    newSec = securitySettings,
    newRep = reportSettings
  ) => {
    if (isHistoryActionRef.current) return;
    const snapshot: StudioHistoryState = {
      fields: JSON.parse(JSON.stringify(newFields)),
      formConfig: JSON.parse(JSON.stringify(newFormConfig)),
      uxSettings: JSON.parse(JSON.stringify(newUx)),
      autoSettings: JSON.parse(JSON.stringify(newAuto)),
      securitySettings: JSON.parse(JSON.stringify(newSec)),
      reportSettings: JSON.parse(JSON.stringify(newRep))
    };

    setHistoryStack(prev => {
      const sliced = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : [];
      const updated = [...sliced, snapshot].slice(-30);
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isHistoryActionRef.current = true;
      const targetState = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      
      setFields(JSON.parse(JSON.stringify(targetState.fields)));
      setFormConfig(JSON.parse(JSON.stringify(targetState.formConfig)));
      setUxSettings(JSON.parse(JSON.stringify(targetState.uxSettings)));
      setAutoSettings(JSON.parse(JSON.stringify(targetState.autoSettings)));
      setSecuritySettings(JSON.parse(JSON.stringify(targetState.securitySettings)));
      setReportSettings(JSON.parse(JSON.stringify(targetState.reportSettings)));

      if (selectedFormId) {
        setForms(prev => prev.map(f => f.id === selectedFormId ? { 
          ...f, 
          fields: targetState.fields, 
          groupingLevels: targetState.formConfig.groupingLevels,
          sheetUrl: targetState.formConfig.sheetUrl,
          sheetName: targetState.formConfig.sheetName
        } : f));
      }

      setSyncAlert({ type: 'success', message: 'Perubahan berhasil di-Undo' });
      setTimeout(() => setSyncAlert(null), 1500);

      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 50);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1 && historyIndex >= 0) {
      isHistoryActionRef.current = true;
      const targetState = historyStack[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);

      setFields(JSON.parse(JSON.stringify(targetState.fields)));
      setFormConfig(JSON.parse(JSON.stringify(targetState.formConfig)));
      setUxSettings(JSON.parse(JSON.stringify(targetState.uxSettings)));
      setAutoSettings(JSON.parse(JSON.stringify(targetState.autoSettings)));
      setSecuritySettings(JSON.parse(JSON.stringify(targetState.securitySettings)));
      setReportSettings(JSON.parse(JSON.stringify(targetState.reportSettings)));

      if (selectedFormId) {
        setForms(prev => prev.map(f => f.id === selectedFormId ? { 
          ...f, 
          fields: targetState.fields, 
          groupingLevels: targetState.formConfig.groupingLevels,
          sheetUrl: targetState.formConfig.sheetUrl,
          sheetName: targetState.formConfig.sheetName
        } : f));
      }

      setSyncAlert({ type: 'success', message: 'Perubahan berhasil di-Redo' });
      setTimeout(() => setSyncAlert(null), 1500);

      setTimeout(() => {
        isHistoryActionRef.current = false;
      }, 50);
    }
  };

  // Global Keyboard shortcut for Undo / Redo (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    if (adminScreen !== 'studio') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is actively typing in a standard input or textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !isInput) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminScreen, historyIndex, historyStack]);

  // Simulator Toggle
  const [showRightSimulator, setShowRightSimulator] = useState<boolean>(true);
  const [simulatorKey, setSimulatorKey] = useState<number>(0);

  // Status Alerts
  const [syncAlert, setSyncAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mandatory Excel Backup Modal Before Delete
  const [deleteBackupModal, setDeleteBackupModal] = useState<{
    isOpen: boolean;
    type: 'activity' | 'form';
    item: any;
    hasDownloaded: boolean;
    isDeleting: boolean;
    downloading: boolean;
  } | null>(null);

  const baseUrl = (import.meta as any).env.VITE_API_URL || '';

  // 1. Fetch Activities with strong localStorage fallback
  const fetchActivities = async () => {
    const cached = localStorage.getItem('garda_laporan_activities');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActivities(parsed);
        }
      } catch (e) {}
    }

    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const actList = Array.isArray(data) ? data : [];
        if (actList.length > 0 || !cached) {
          setActivities(actList);
          localStorage.setItem('garda_laporan_activities', JSON.stringify(actList));
        }
      }
    } catch (err) {
      // Network offline - cached version already active
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // 2. Fetch Forms for selected activity with strong localStorage fallback
  const fetchForms = async (actId: string) => {
    if (!actId) return;
    const cached = localStorage.getItem(`garda_laporan_forms_${actId}`);
    let hasCached = false;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setForms(parsed);
          setSelectedFormId(prev => prev || parsed[0].id);
          hasCached = true;
        }
      } catch (e) {}
    }

    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities/${actId}/forms?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const formArray = Array.isArray(data) ? data : [];
        if (formArray.length > 0) {
          setForms(formArray);
          localStorage.setItem(`garda_laporan_forms_${actId}`, JSON.stringify(formArray));
          setSelectedFormId(prev => prev || formArray[0].id);
          return;
        }
      }
    } catch (err) {
      // Network error - keep cached
    }

    if (!hasCached) {
      createDefaultFormForActivity(actId);
    }
  };

  // Helper to create initial default form if empty
  const createDefaultFormForActivity = async (actId: string) => {
    const defaultFormObj = {
      id: `form_${Date.now()}`,
      activityId: actId,
      title: 'Formulir Pendataan',
      icon: 'FileText',
      orderIndex: 0,
      sheetUrl: selectedActivity?.sheetUrl || '',
      sheetName: 'Sheet1',
      groupingLevels: ['Nama PPL', 'Kecamatan', 'Desa', 'SLS / RT'],
      fields: [
        { id: 'f1', columnName: 'Nama PPL', label: 'Nama PPL', dataType: 'Enum', isKey: false, isLabel: true, isRequired: true, options: ['Dandy', 'Sefty Eca Putri', 'Rendi Pratama', 'Muhammad Irfan'] },
        { id: 'f2', columnName: 'Jabatan Petugas', label: 'Jabatan Petugas', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
        { id: 'f3', columnName: 'Kabupaten', label: 'Kabupaten / Kota', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
        { id: 'f4', columnName: 'Kecamatan', label: 'Kecamatan', dataType: 'Text', isKey: false, isLabel: true, isRequired: true, options: [] },
        { id: 'f5', columnName: 'Desa', label: 'Desa / Kelurahan', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
        { id: 'f6', columnName: 'Lokasi GPS', label: 'Titik Lokasi GPS', dataType: 'LatLong', isKey: false, isLabel: false, isRequired: false, options: [] },
        { id: 'f7', columnName: 'Foto Lapangan', label: 'Foto Lapangan / Dokumen', dataType: 'Image', isKey: false, isLabel: false, isRequired: false, options: [] },
      ]
    };

    try {
      await fetch(`${baseUrl}/api/laporan/activities/${actId}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultFormObj)
      });
    } catch (e) {}

    setForms([defaultFormObj]);
    setSelectedFormId(defaultFormObj.id);
    setFields(defaultFormObj.fields);
  };

  useEffect(() => {
    if (selectedActivity?.id) {
      fetchForms(selectedActivity.id);
      const st = selectedActivity.settings || {};
      setUxSettings({
        themeColor: st.themeColor || st.ux?.themeColor || '#0ea5e9',
        viewLayout: st.viewLayout || st.ux?.viewLayout || 'card_list',
        showBadges: st.showBadges !== undefined ? st.showBadges : (st.ux?.showBadges !== false),
        compactMode: st.compactMode || st.ux?.compactMode || false,
        navMode: st.navMode || st.ux?.navMode || 'bottom_bar'
      });
      setAutoSettings(prev => ({
        ...prev,
        syncFrequency: st.syncFrequency || st.auto?.syncFrequency || 'realtime',
        webhookUrl: st.webhookUrl || st.auto?.webhookUrl || '',
        notifyWhatsapp: st.notifyWhatsapp || st.auto?.notifyWhatsapp || false,
        enableGeofence: st.enableGeofence !== undefined ? st.enableGeofence : true,
        maxRadiusMeters: st.maxRadiusMeters || 250
      }));
      setSecuritySettings(prev => ({
        ...prev,
        lockOnSubmit: st.lockOnSubmit !== undefined ? st.lockOnSubmit : false,
        allowPetugasDelete: st.allowPetugasDelete || false,
        requireGPS: st.requireGPS !== undefined ? st.requireGPS : false,
        requirePhoto: st.requirePhoto || false
      }));
      const rep = st.reportSettings || {};
      setReportSettings({
        enableOfficialReport: rep.enableOfficialReport ?? false,
        targetFormId: rep.targetFormId || '',
        dateColumn: rep.dateColumn || '',
        timeColumn: rep.timeColumn || '',
        gpsColumn: rep.gpsColumn || '',
        photoColumn: rep.photoColumn || '',
        detectWatermark: rep.detectWatermark ?? true
      });
    }
  }, [selectedActivity?.id]);

  const activeFormIdTrackerRef = useRef<string | null>(null);

  // 3. Populate Form Config & Fields ONLY when active selected form actually changes
  useEffect(() => {
    if (selectedForm && activeFormIdTrackerRef.current !== selectedForm.id) {
      activeFormIdTrackerRef.current = selectedForm.id;
      const gl = Array.isArray(selectedForm.groupingLevels) ? selectedForm.groupingLevels : [];
      setFormConfig({
        title: selectedForm.title || '',
        sheetUrl: selectedForm.sheetUrl || selectedActivity?.sheetUrl || '',
        sheetName: selectedForm.sheetName || 'Sheet1',
        groupingLevels: [
          gl[0] !== undefined ? gl[0] : '',
          gl[1] !== undefined ? gl[1] : '',
          gl[2] !== undefined ? gl[2] : '',
          gl[3] !== undefined ? gl[3] : ''
        ]
      });

      const existingFields = Array.isArray(selectedForm.fields) ? selectedForm.fields : [];
      if (existingFields.length > 0) {
        setFields(existingFields);
      } else {
        setFields([
          { id: 'f1', columnName: 'Nama PPL', label: 'Nama PPL', dataType: 'Enum', isKey: false, isLabel: true, isRequired: true, options: ['Dandy', 'Sefty Eca Putri', 'Rendi Pratama', 'Muhammad Irfan'] },
          { id: 'f2', columnName: 'Jabatan Petugas', label: 'Jabatan Petugas', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
          { id: 'f3', columnName: 'Kabupaten', label: 'Kabupaten / Kota', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
          { id: 'f4', columnName: 'Kecamatan', label: 'Kecamatan', dataType: 'Text', isKey: false, isLabel: true, isRequired: true, options: [] },
          { id: 'f5', columnName: 'Desa', label: 'Desa / Kelurahan', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
          { id: 'f6', columnName: 'Lokasi GPS', label: 'Titik Lokasi GPS', dataType: 'LatLong', isKey: false, isLabel: false, isRequired: false, options: [] },
          { id: 'f7', columnName: 'Foto Lapangan', label: 'Foto Lapangan / Dokumen', dataType: 'Image', isKey: false, isLabel: false, isRequired: false, options: [] },
        ]);
      }
    }
  }, [selectedFormId, selectedForm?.id]);

  // Enter Studio for an Activity
  const handleOpenStudio = (act: any) => {
    setSelectedActivity(act);
    setAdminScreen('studio');
    setStudioTab('data');
    setSimulatorKey(Date.now());
  };

  // Toggle Activity Status
  const handleToggleActivityOpen = async (targetAct?: any) => {
    const act = targetAct || selectedActivity;
    if (!act) return;
    const newStatus = !act.isOpen;
    try {
      await fetch(`${baseUrl}/api/laporan/activities/${act.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newStatus })
      });
    } catch (err) {}

    const updatedAct = { ...act, isOpen: newStatus };
    if (selectedActivity?.id === act.id) setSelectedActivity(updatedAct);
    const updatedList = activities.map(a => a.id === act.id ? updatedAct : a);
    setActivities(updatedList);
    localStorage.setItem('garda_laporan_activities', JSON.stringify(updatedList));

    setSyncAlert({
      type: 'success',
      message: `Status kegiatan "${act.title}" diubah menjadi ${newStatus ? 'AKTIF (Dibuka)' : 'NONAKTIF (Ditutup)'}`
    });
    setTimeout(() => setSyncAlert(null), 3000);
  };

  // Create New Activity / App
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityForm.title.trim()) return;

    const newId = `act_${Date.now()}`;
    const newAct = {
      id: newId,
      title: newActivityForm.title.trim(),
      description: newActivityForm.description || newActivityForm.category,
      category: newActivityForm.category,
      sheetUrl: newActivityForm.sheetUrl || '',
      sheetName: newActivityForm.sheetName || 'Sheet1',
      isOpen: true,
      icon: newActivityForm.icon || 'Layers',
      forms: [],
      settings: {
        themeColor: presetInfo.colors.primary,
        viewLayout: 'card_list',
        lockOnSubmit: true,
        requireGPS: true
      },
      stats: { totalRecords: 0, totalDraft: 0, totalSubmitted: 0 }
    };

    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAct)
      });
      if (res.ok) {
        const data = await res.json();
        newAct.id = data.id || newId;
      }
    } catch (err) {}

    const updated = [newAct, ...activities];
    setActivities(updated);
    localStorage.setItem('garda_laporan_activities', JSON.stringify(updated));

    setIsNewActivityModalOpen(false);
    setNewActivityForm({
      title: '',
      description: '',
      category: 'Statistik Distribusi & Harga',
      sheetUrl: '',
      sheetName: 'Sheet1',
      isOpen: true,
      icon: 'Layers'
    });

    handleOpenStudio(newAct);
  };

  // Create New Table/Form in Studio
  const handleCreateFormInStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim() || !selectedActivity) return;

    const newId = `form_${Date.now()}`;
    const effectiveSheetUrl = newFormSheetUrl.trim() || selectedActivity.sheetUrl || selectedActivity.connectedSheetUrl || '';
    const effectiveSheetName = newFormSheetName.trim() || newFormTitle.trim() || 'Sheet1';

    const newFormObj = {
      id: newId,
      activityId: selectedActivity.id,
      title: newFormTitle.trim(),
      icon: newFormIcon || 'FileText',
      orderIndex: forms.length,
      sheetUrl: effectiveSheetUrl,
      sheetName: effectiveSheetName,
      groupingLevels: ['Nama PPL', 'Kecamatan', 'Desa', 'SLS / RT'],
      fields: [
        { id: 'f1', columnName: 'Nama PPL', label: 'Nama PPL', dataType: 'Enum', isKey: false, isLabel: true, isRequired: true, options: ['Dandy', 'Sefty Eca Putri', 'Rendi Pratama'] },
        { id: 'f2', columnName: 'Jabatan Petugas', label: 'Jabatan Petugas', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
        { id: 'f3', columnName: 'Kecamatan', label: 'Kecamatan', dataType: 'Text', isKey: false, isLabel: true, isRequired: true, options: [] },
        { id: 'f4', columnName: 'Desa', label: 'Desa / Kelurahan', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
        { id: 'f5', columnName: 'Lokasi GPS', label: 'Titik Lokasi GPS', dataType: 'LatLong', isKey: false, isLabel: false, isRequired: false, options: [] },
        { id: 'f6', columnName: 'Foto Lapangan', label: 'Foto Lapangan', dataType: 'Image', isKey: false, isLabel: false, isRequired: false, options: [] },
      ]
    };

    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities/${selectedActivity.id}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFormObj)
      });
      if (res.ok) {
        const data = await res.json();
        newFormObj.id = data.id || newId;
      }
    } catch (err) {}

    const updatedForms = [...forms, newFormObj];
    setForms(updatedForms);
    localStorage.setItem(`garda_laporan_forms_${selectedActivity.id}`, JSON.stringify(updatedForms));
    setSelectedFormId(newFormObj.id);
    setIsNewFormModalOpen(false);
    setNewFormTitle('');
    setNewFormSheetName('');

    setSyncAlert({ type: 'success', message: `Formulir "${newFormObj.title}" berhasil ditambahkan!` });
    setTimeout(() => setSyncAlert(null), 3000);
  };

  // Client-side Direct Google Sheet Parser Fallback
  const parseGoogleSheetDirectly = async (sheetUrl: string, sheetName: string = 'Sheet1') => {
    if (!sheetUrl) throw new Error('URL Google Sheet kosong');
    let docId = sheetUrl.trim();
    if (sheetUrl.includes('/d/')) {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) docId = match[1];
    }

    const cleanSheetName = cleanText(sheetName) || 'Sheet1';
    const targetUrl = `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(cleanSheetName)}`;

    const res = await fetch(targetUrl);
    if (!res.ok) {
      throw new Error('Gagal mengunduh Google Sheet. Pastikan sharing diatur: "Anyone with the link can view/edit"');
    }

    const csvText = await res.text();
    const cleanCsv = csvText.replace(/^\uFEFF/, '');
    const workbook = XLSX.read(cleanCsv, { type: 'string' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawJsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    // Clean all row keys and values to eliminate BOM, NBSP, trailing spaces
    const jsonRows = rawJsonRows.map((row: any) => {
      const cleanRow: Record<string, any> = {};
      Object.entries(row).forEach(([k, v]) => {
        const cleanK = cleanText(k);
        if (cleanK) {
          cleanRow[cleanK] = cleanText(v);
        }
      });
      return cleanRow;
    });

    let headers: string[] = [];
    if (jsonRows.length > 0) {
      headers = Object.keys(jsonRows[0]);
    } else {
      const rawData: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (rawData.length > 0) headers = rawData[0].map(c => cleanText(c)).filter(Boolean);
    }

    if (headers.length === 0) {
      throw new Error('Google Sheet tidak memiliki header kolom yang terbaca.');
    }

    const schema = headers.map((h, i) => {
      let type = 'Text';
      const hLower = h.toLowerCase();
      if (hLower.includes('foto') || hLower.includes('gambar') || hLower.includes('image') || hLower.includes('dokumen')) type = 'Image';
      else if (hLower.includes('gps') || hLower.includes('lokasi') || hLower.includes('lat') || hLower.includes('long') || hLower.includes('koordinat')) type = 'LatLong';
      else if (hLower.includes('tgl') || hLower.includes('tanggal') || hLower.includes('date')) type = 'Date';
      else if (hLower.includes('jam') || hLower.includes('waktu') || hLower.includes('time')) type = 'Time';
      else if (hLower.includes('jumlah') || hLower.includes('total') || hLower.includes('nilai') || hLower.includes('luas') || hLower.includes('umur') || hLower.includes('harga') || hLower.includes('pendapatan') || hLower.includes('kapasitas')) type = 'Number';
      else if (hLower.includes('status') || hLower.includes('jenis') || hLower.includes('kategori')) type = 'Enum';

      const uniqueVals = Array.from(new Set(jsonRows.map(r => cleanText(r[h])).filter(Boolean)));
      const options = uniqueVals.length > 0 && uniqueVals.length <= 100 ? uniqueVals : [];
      if (options.length > 0 && options.length <= 15 && type === 'Text') type = 'Enum';

      return {
        id: `fld_${Date.now()}_${i}`,
        columnName: h,
        label: h,
        dataType: type,
        isRequired: i === 0 || hLower.includes('nama') || hLower.includes('krt'),
        isLabel: i === 0 || hLower.includes('nama') || hLower.includes('krt'),
        isKey: i === 0 && (hLower.includes('id') || hLower.includes('kode')),
        options
      };
    });

    return { headers, schema, records: jsonRows, totalRows: jsonRows.length };
  };

  // Helper to intelligently merge incoming sheet schema while strictly preserving existing data types & configurations
  const mergeFieldsPreservingConfig = (currentFields: any[], incomingSchema: any[]) => {
    if (!currentFields || currentFields.length === 0) return incomingSchema;

    const matchedIncomingNames = new Set<string>();

    const merged = incomingSchema.map((newField: any) => {
      const colNameLower = (newField.columnName || '').trim().toLowerCase();
      const labelLower = (newField.label || '').trim().toLowerCase();

      // Find existing match
      const existing = currentFields.find((f: any) => {
        const exCol = (f.columnName || '').trim().toLowerCase();
        const exLabel = (f.label || '').trim().toLowerCase();
        return (exCol && exCol === colNameLower) || (exLabel && exLabel === labelLower);
      });

      if (existing) {
        matchedIncomingNames.add((existing.columnName || existing.label || '').trim().toLowerCase());
        // PRESERVE ALL EXISTING CONFIGURED TYPES & VALIDATIONS
        return {
          ...newField,
          id: existing.id || newField.id,
          columnName: newField.columnName || existing.columnName,
          label: existing.label || newField.label,
          dataType: existing.dataType || newField.dataType, // Type is strictly preserved!
          isKey: existing.isKey !== undefined ? existing.isKey : newField.isKey,
          isLabel: existing.isLabel !== undefined ? existing.isLabel : newField.isLabel,
          isRequired: existing.isRequired !== undefined ? existing.isRequired : newField.isRequired,
          isEditable: existing.isEditable !== undefined ? existing.isEditable : newField.isEditable,
          isPredefined: existing.isPredefined !== undefined ? existing.isPredefined : newField.isPredefined,
          validation: existing.validation ? { ...existing.validation } : newField.validation,
          options: (existing.options && Array.isArray(existing.options) && existing.options.length > 0)
            ? sanitizeOptions(existing.options)
            : sanitizeOptions(newField.options || [])
        };
      }

      // Brand new column from sheet
      return {
        ...newField,
        isEditable: newField.isEditable ?? true,
        isPredefined: newField.isPredefined ?? false
      };
    });

    // Also preserve any custom columns created manually by admin that were not in the sheet
    const unmatchedCustomFields = currentFields.filter((f: any) => {
      const exCol = (f.columnName || '').trim().toLowerCase();
      const exLabel = (f.label || '').trim().toLowerCase();
      return !matchedIncomingNames.has(exCol) && !matchedIncomingNames.has(exLabel);
    });

    return [...merged, ...unmatchedCustomFields];
  };

  // Sync Columns & Records from Google Sheet (Hybrid: Backend API + Direct Fallback)
  const handleSyncFromGoogleSheet = async () => {
    if (!formConfig.sheetUrl) {
      alert('Masukkan Tautan Google Sheet terlebih dahulu.');
      return;
    }

    try {
      setIsSyncingSheet(true);
      let syncSuccess = false;

      // 1. Coba lewat backend server
      try {
        const res = await fetch(`${baseUrl}/api/laporan/forms/${selectedFormId}/sync-sheet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetUrl: formConfig.sheetUrl,
            sheetName: formConfig.sheetName || 'Sheet1'
          })
        });

        if (res.ok) {
          const data = await res.json();
          const extractedFields = data.fields || data.schema || [];
          if (Array.isArray(extractedFields) && extractedFields.length > 0) {
            const merged = mergeFieldsPreservingConfig(fields, extractedFields);
            setFields(merged);
            syncSuccess = true;
            setSyncAlert({ 
              type: 'success', 
              message: `Berhasil sinkronisasi ${merged.length} kolom dari Google Sheet (Tipe data lama tetap dipertahankan)!` 
            });
          }
        }
      } catch (backendErr) {
        console.warn('Backend sync unreachable, falling back to direct client-side fetch:', backendErr);
      }

      // 2. Fallback: Ekstraksi langsung di browser (Client-Side) jika backend offline/localhost
      if (!syncSuccess) {
        const clientResult = await parseGoogleSheetDirectly(formConfig.sheetUrl, formConfig.sheetName || 'Sheet1');
        if (clientResult.schema.length > 0) {
          const merged = mergeFieldsPreservingConfig(fields, clientResult.schema);
          setFields(merged);
          
          // Filter hanya baris yang valid (tidak sepenuhnya kosong)
          const validRecords = (clientResult.records || []).filter((r: any) => {
            return Object.values(r).some(v => v !== null && v !== undefined && cleanText(v) !== '');
          });

          // Simpan record data sampel ke penyimpanan lokal (Preserve all columns!)
          if (validRecords.length > 0) {
            const formattedRecords = validRecords.map((r, idx) => {
              const cleanData: Record<string, any> = { ...r };
              merged.forEach((f: any) => {
                const rawVal = getRecordVal(r, f.columnName) || getRecordVal(r, f.label);
                if (f.dataType === 'Image' && (!rawVal || (!String(rawVal).startsWith('http') && !String(rawVal).startsWith('data:') && !String(rawVal).startsWith('blob:')))) {
                  cleanData[f.columnName] = '';
                } else if (rawVal !== undefined && rawVal !== '') {
                  cleanData[f.columnName] = rawVal;
                }
              });

              // Discover GPS coordinates
              const gpsVal = getRecordVal(cleanData, 'gps');
              let lat: number | null = null;
              let lng: number | null = null;
              if (gpsVal && typeof gpsVal === 'string' && gpsVal.includes(',')) {
                const parts = gpsVal.split(',').map(s => parseFloat(s.trim()));
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  lat = parts[0];
                  lng = parts[1];
                }
              }

              return {
                id: `${selectedFormId || 'form'}_row_${idx + 1}`,
                rowId: `row_${idx + 1}`,
                formId: selectedFormId,
                activityId: selectedActivity?.id,
                data: cleanData,
                latitude: lat,
                longitude: lng,
                status: 'draft',
                createdAt: new Date().toISOString()
              };
            });
            localStorage.setItem(`garda_laporan_records_${selectedFormId}`, JSON.stringify(formattedRecords));
          }

          setSyncAlert({ 
            type: 'success', 
            message: `Berhasil sinkronisasi ${merged.length} kolom & ${validRecords.length} baris data sampel! (Konfigurasi tipe data tidak berubah)` 
          });

          // Sync Sheet URL to Activity
          if (selectedActivity) {
            const updatedAct = {
              ...selectedActivity,
              sheetUrl: formConfig.sheetUrl,
              sheetName: formConfig.sheetName || 'Sheet1'
            };
            setSelectedActivity(updatedAct);
            const updatedActs = activities.map(a => a.id === selectedActivity.id ? updatedAct : a);
            setActivities(updatedActs);
            localStorage.setItem('garda_laporan_activities', JSON.stringify(updatedActs));
          }
        }
      }
    } catch (err: any) {
      console.error('Error syncing Google Sheet:', err);
      setSyncAlert({ 
        type: 'error', 
        message: err.message || 'Gagal terhubung ke Google Sheet. Pastikan sharing dokumen "Anyone with the link can view".' 
      });
    } finally {
      setIsSyncingSheet(false);
      setTimeout(() => setSyncAlert(null), 4000);
    }
  };


  // Add Column Row
  const handleAddColumnRow = () => {
    const newField = {
      id: `field_${Date.now()}`,
      columnName: `Kolom_${fields.length + 1}`,
      label: `Kolom ${fields.length + 1}`,
      dataType: 'Text',
      isKey: false,
      isLabel: false,
      isRequired: false,
      options: []
    };
    const nextFields = [...fields, newField];
    setFields(nextFields);
    pushHistorySnapshot(nextFields);
  };

  // Remove Column Row
  const handleRemoveColumnRow = (index: number) => {
    const nextFields = fields.filter((_, i) => i !== index);
    setFields(nextFields);
    pushHistorySnapshot(nextFields);
  };

  // Update Column Row
  const handleUpdateColumnRow = (index: number, key: string, value: any) => {
    const updated = [...fields];
    let sanitizedVal = value;
    if (key === 'options') {
      sanitizedVal = sanitizeOptions(value);
    }
    updated[index] = { ...updated[index], [key]: sanitizedVal };
    
    if (key === 'label' && !updated[index].columnName) {
      updated[index].columnName = sanitizedVal;
    }
    setFields(updated);
    pushHistorySnapshot(updated);

    // Live sync into forms state so simulator updates in real time
    if (selectedFormId) {
      setForms(prev => prev.map(f => {
        if (f.id === selectedFormId) {
          return { ...f, fields: updated };
        }
        return f;
      }));
    }
  };

  // Update Grouping Level
  const handleUpdateGroupingLevel = (levelIdx: number, val: string) => {
    const updated = [...(formConfig.groupingLevels || ['', '', '', ''])];
    if (!val) {
      for (let i = levelIdx; i < 4; i++) {
        updated[i] = '';
      }
    } else {
      updated[levelIdx] = val;
    }
    const cleanGroupings = updated.filter(g => g && String(g).trim() !== '');
    const nextConfig = { ...formConfig, groupingLevels: updated };
    setFormConfig(nextConfig);
    pushHistorySnapshot(fields, nextConfig);

    // Live sync into forms state
    if (selectedFormId) {
      setForms(prev => prev.map(f => {
        if (f.id === selectedFormId) {
          return { ...f, groupingLevels: cleanGroupings };
        }
        return f;
      }));
    }
  };

  // Update Sheet URL or Sheet Name with immediate persistent form sync
  const handleUpdateSheetConfig = (key: 'sheetUrl' | 'sheetName', val: string) => {
    const nextConfig = { ...formConfig, [key]: val };
    setFormConfig(nextConfig);
    pushHistorySnapshot(fields, nextConfig);

    if (selectedFormId) {
      setForms(prev => {
        const updated = prev.map(f => {
          if (f.id === selectedFormId) {
            return { ...f, [key]: val };
          }
          return f;
        });
        if (selectedActivity) {
          localStorage.setItem(`garda_laporan_forms_${selectedActivity.id}`, JSON.stringify(updated));
        }
        return updated;
      });
    }
  };

  // Save All Settings (Schema, UX, Auto, Security)
  const handleSaveAllSettings = async () => {
    if (!selectedActivity) return;

    try {
      setIsSavingSchema(true);
      const cleanGroupings = (formConfig.groupingLevels || []).filter(g => g && String(g).trim() !== '');
      const sanitizedFields = fields.map(f => ({
        ...f,
        options: sanitizeOptions(f.options)
      }));

      // 1. Update Form in Backend
      if (selectedFormId) {
        await fetch(`${baseUrl}/api/laporan/forms/${selectedFormId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formConfig.title || selectedForm?.title,
            sheetUrl: formConfig.sheetUrl,
            sheetName: formConfig.sheetName,
            groupingLevels: cleanGroupings,
            fields: sanitizedFields
          })
        });
      }

      // 2. Update Activity Settings (UI, Auto, Security) in Backend
      const updatedActivityObj = {
        ...selectedActivity,
        title: selectedActivity.title,
        description: selectedActivity.description || '',
        icon: selectedActivity.icon || 'Layers',
        sheetUrl: formConfig.sheetUrl || selectedActivity.sheetUrl || '',
        sheetName: formConfig.sheetName || selectedActivity.sheetName || 'Sheet1',
        settings: {
          themeColor: uxSettings.themeColor,
          viewLayout: uxSettings.viewLayout,
          showBadges: uxSettings.showBadges,
          compactMode: uxSettings.compactMode,
          navMode: uxSettings.navMode,
          syncFrequency: autoSettings.syncFrequency,
          webhookUrl: autoSettings.webhookUrl,
          enableGeofence: autoSettings.enableGeofence,
          maxRadiusMeters: autoSettings.maxRadiusMeters,
          lockOnSubmit: securitySettings.lockOnSubmit,
          requireGPS: securitySettings.requireGPS,
          requirePhoto: securitySettings.requirePhoto
        }
      };

      await fetch(`${baseUrl}/api/laporan/activities/${selectedActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedActivityObj)
      });

      setSelectedActivity(updatedActivityObj);

      const updatedActs = activities.map(a => a.id === selectedActivity.id ? updatedActivityObj : a);
      setActivities(updatedActs);
      localStorage.setItem('garda_laporan_activities', JSON.stringify(updatedActs));

      if (selectedFormId) {
        const updatedForms = forms.map((f, fIdx) => {
          if (f.id === selectedFormId) {
            return {
              ...f,
              title: formConfig.title || f.title,
              icon: f.icon || 'FileText',
              sheetUrl: formConfig.sheetUrl,
              sheetName: formConfig.sheetName,
              groupingLevels: cleanGroupings,
              fields: sanitizedFields,
              orderIndex: fIdx
            };
          }
          return { ...f, orderIndex: fIdx };
        });
        setForms(updatedForms);
        localStorage.setItem(`garda_laporan_forms_${selectedActivity.id}`, JSON.stringify(updatedForms));
        setFields(sanitizedFields);
      }

      setSimulatorKey(Date.now());
      setSyncAlert({ type: 'success', message: 'Seluruh konfigurasi skema, UI, otomatisasi, dan keamanan berhasil disimpan!' });
    } catch (err) {
      setSyncAlert({ type: 'success', message: 'Konfigurasi disimpan secara lokal.' });
    } finally {
      setIsSavingSchema(false);
      setTimeout(() => setSyncAlert(null), 3000);
    }
  };

  // Mandatory Excel Download Backup Before Delete
  const handleDownloadExcelBackup = async (item: any, type: 'activity' | 'form') => {
    if (!deleteBackupModal) return;
    try {
      setDeleteBackupModal(prev => prev ? { ...prev, downloading: true } : null);
      const wb = XLSX.utils.book_new();

      if (type === 'activity') {
        const formsRes = await fetch(`${baseUrl}/api/laporan/activities/${item.id}/forms?t=${Date.now()}`);
        const formList = formsRes.ok ? await formsRes.json() : forms;

        if (!formList || formList.length === 0) {
          const ws = XLSX.utils.json_to_sheet([{ Info: `Kegiatan: ${item.title}`, Catatan: 'Tidak ada data formulir.' }]);
          XLSX.utils.book_append_sheet(wb, ws, 'Ringkasan');
        } else {
          for (const f of formList) {
            try {
              const recRes = await fetch(`${baseUrl}/api/laporan/forms/${f.id}/records?t=${Date.now()}`);
              const recList = recRes.ok ? await recRes.json() : [];
              const exportRows = (recList || []).map((r: any, i: number) => ({
                'No': i + 1,
                'ID Data': r.rowId || r.id,
                'Status': r.status || 'draft',
                'Petugas': r.submittedBy || '-',
                'Waktu Input': r.submittedAt || r.createdAt || '-',
                'Latitude': r.latitude || '',
                'Longitude': r.longitude || '',
                ...r.data
              }));
              const ws = XLSX.utils.json_to_sheet(exportRows.length > 0 ? exportRows : [{ Info: 'Belum ada data' }]);
              const sheetName = (f.title || 'Form').slice(0, 30).replace(/[^a-zA-Z0-9_ -]/g, '');
              XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Data');
            } catch (e) {}
          }
        }
        const cleanAct = (item.title || 'Kegiatan').replace(/[^a-zA-Z0-9_-]/g, '_');
        XLSX.writeFile(wb, `Cadangan_Kegiatan_${cleanAct}_${Date.now()}.xlsx`);
      } else {
        const recRes = await fetch(`${baseUrl}/api/laporan/forms/${item.id}/records?t=${Date.now()}`);
        const recList = recRes.ok ? await recRes.json() : [];
        const exportRows = (recList || []).map((r: any, i: number) => ({
          'No': i + 1,
          'ID': r.rowId || r.id,
          'Status': r.status,
          'Petugas': r.submittedBy,
          ...r.data
        }));
        const ws = XLSX.utils.json_to_sheet(exportRows.length > 0 ? exportRows : [{ Info: 'Belum ada data' }]);
        XLSX.utils.book_append_sheet(wb, ws, 'Records');
        XLSX.writeFile(wb, `Cadangan_Form_${item.title || 'Form'}_${Date.now()}.xlsx`);
      }

      setDeleteBackupModal(prev => prev ? { ...prev, hasDownloaded: true, downloading: false } : null);
    } catch (err) {
      alert('Gagal mengunduh file cadangan Excel.');
      setDeleteBackupModal(prev => prev ? { ...prev, downloading: false } : null);
    }
  };

  // Execute Delete After Download
  const handleExecuteDelete = async () => {
    if (!deleteBackupModal || !deleteBackupModal.hasDownloaded) return;
    const { type, item } = deleteBackupModal;

    try {
      setDeleteBackupModal(prev => prev ? { ...prev, isDeleting: true } : null);

      if (type === 'activity') {
        await fetch(`${baseUrl}/api/laporan/activities/${item.id}`, { method: 'DELETE' });
        const remaining = activities.filter(a => a.id !== item.id);
        setActivities(remaining);
        localStorage.setItem('garda_laporan_activities', JSON.stringify(remaining));
        setAdminScreen('apps_home');
        setSelectedActivity(null);
      } else {
        await fetch(`${baseUrl}/api/laporan/forms/${item.id}`, { method: 'DELETE' });
        if (selectedActivity?.id) fetchForms(selectedActivity.id);
      }

      setDeleteBackupModal(null);
      setSyncAlert({ type: 'success', message: 'Item berhasil dihapus dari database.' });
      setTimeout(() => setSyncAlert(null), 3000);
    } catch (err) {
      alert('Gagal menghapus item.');
      setDeleteBackupModal(null);
    }
  };

  // Filter Activities
  const filteredActivities = (activities || [])
    .filter(a => {
      if (!homeSearchQuery.trim()) return true;
      const q = homeSearchQuery.toLowerCase();
      return a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (homeSortOrder === 'name') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

  // Prebuilt Templates List
  const TEMPLATES_LIST = [
    {
      id: 'tpl_1',
      title: 'Survei Harga Konsumen Pasar (SHK)',
      category: 'Statistik Distribusi & Harga',
      desc: 'Formulir pemantauan komoditas pangan pokok, pasar tradisional, dan distributor harian.',
      icon: DollarSign,
      fieldsCount: 8
    },
    {
      id: 'tpl_2',
      title: 'Listing Bangunan & Sensus Ekonomi 2026',
      category: 'Sensus Ekonomi & Bisnis',
      desc: 'Pencatatan usaha mikro kecil, identifikasi sektor KBLI, geotagging, dan foto tempat usaha.',
      icon: Building2,
      fieldsCount: 12
    },
    {
      id: 'tpl_3',
      title: 'Pemutakhiran SLS & Susenas Sosial',
      category: 'Statistik Sosial & Kependudukan',
      desc: 'Verifikasi sampel rumah tangga, identifikasi keluarga rawan, dan status sanitasi.',
      icon: Home,
      fieldsCount: 10
    },
    {
      id: 'tpl_4',
      title: 'Survei Pertanian Ubinan Padi & Palawija',
      category: 'Statistik Produksi & Pertanian',
      desc: 'Plot petak ubinan, kadar air, estimasi produksi gabah kering giling dan pupuk.',
      icon: Wheat,
      fieldsCount: 7
    }
  ];

  const CATEGORY_OPTIONS = [
    { value: 'Statistik Distribusi & Harga', label: 'Statistik Distribusi & Harga', icon: DollarSign },
    { value: 'Statistik Sosial & Kependudukan', label: 'Statistik Sosial & Kependudukan', icon: Users },
    { value: 'Statistik Produksi & Pertanian', label: 'Statistik Produksi & Pertanian', icon: Wheat },
    { value: 'Sensus Ekonomi & Bisnis', label: 'Sensus Ekonomi & Bisnis', icon: Building2 },
    { value: 'Neraca Wilayah & Analisis', label: 'Neraca Wilayah & Analisis', icon: BarChart3 },
  ];

  const SORT_OPTIONS = [
    { value: 'recent', label: 'Recent' },
    { value: 'name', label: 'Name (A-Z)' },
  ];

  // =========================================================================
  // VIEW 1: GAMBAR 1 - ADMIN HOME OVERVIEW
  // =========================================================================
  if (adminScreen === 'apps_home') {
    return (
      <div className="flex flex-col h-[calc(100vh-4.5rem)] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search apps and databases..."
                value={homeSearchQuery}
                onChange={(e) => setHomeSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-300 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {homeSearchQuery && (
                <button onClick={() => setHomeSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Subheader Switcher [ Apps | Databases ] */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveMainTab('apps')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'apps' 
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              Apps
            </button>
            <button 
              onClick={() => setActiveMainTab('databases')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'databases' 
                  ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Databases</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Quick sort:</span>
            <div className="w-36">
              <CustomDropdown
                value={homeSortOrder}
                options={SORT_OPTIONS}
                onChange={(val) => setHomeSortOrder(val)}
              />
            </div>
          </div>
        </div>

        {/* Main Body (Left Sidebar + Content Grid) */}
        <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950">
          {/* Left Sidebar (Only 'Owned by me' and 'Templates') */}
          <div className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shrink-0 space-y-4">
            <div className="space-y-4">
              {/* Primary + Create Button */}
              <button
                onClick={() => setIsNewActivityModalOpen(true)}
                style={{ backgroundColor: presetInfo.colors.primary }}
                className="w-full py-2.5 px-4 text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>

              {/* Nav Items (Only 'Owned by me' & 'Templates') */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setHomeSidebarFilter('owned');
                    setActiveMainTab('apps');
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    homeSidebarFilter === 'owned' && activeMainTab === 'apps' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Owned by me</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.2 rounded-full">
                    {activities.length}
                  </span>
                </button>

                <button
                  onClick={() => setHomeSidebarFilter('templates')}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    homeSidebarFilter === 'templates' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Templates</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-200 block">Garda Data Studio</span>
              <p className="leading-tight">Platform integrasi e-form survei terhubung Google Sheets.</p>
            </div>
          </div>

          {/* Right Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4 bg-slate-50 dark:bg-slate-950">
            
            {/* TAB 1: DATABASES REGISTRY */}
            {activeMainTab === 'databases' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Daftar Database &amp; Tautan Google Sheets ({activities.length})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kelola status keaktifan aplikasi dan koneksi spreadsheet Google Sheets yang terhubung.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Nama Kegiatan / Aplikasi</th>
                          <th className="py-3 px-4">Tautan Google Sheets</th>
                          <th className="py-3 px-3">Worksheet</th>
                          <th className="py-3 px-3 text-center">Status Aplikasi</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {activities.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              Belum ada database yang terdaftar.
                            </td>
                          </tr>
                        ) : (
                          activities.map((act) => {
                            const ActIcon = getIconComponent(act.icon, Layers);
                            const hasSheet = !!act.sheetUrl;

                            return (
                              <tr key={act.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                                      <ActIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <span className="block">{act.title}</span>
                                      <span className="text-[10px] text-slate-400 font-normal">{act.category || 'Survei'}</span>
                                    </div>
                                  </div>
                                </td>


                                <td className="py-3 px-4 font-mono text-[11px]">
                                  {hasSheet ? (
                                    <a
                                      href={act.sheetUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1.5 truncate max-w-xs"
                                    >
                                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span className="truncate">{act.sheetUrl}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 italic">Belum ditautkan ke Google Sheet</span>
                                  )}
                                </td>

                                <td className="py-3 px-3">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                    {act.sheetName || 'Sheet1'}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleActivityOpen(act)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                      act.isOpen 
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100' 
                                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100'
                                    }`}
                                  >
                                    {act.isOpen ? '🟢 Aktif (Dibuka)' : '🔴 Nonaktif (Ditutup)'}
                                  </button>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenStudio(act)}
                                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    Buka Studio
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : homeSidebarFilter === 'templates' ? (
              /* TAB 2: TEMPLATES GRID */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Katalog Template E-Form Siap Pakai
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gunakan template survei resmi BPS yang telah dikonfigurasi variabel dan skemanya.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {TEMPLATES_LIST.map((tpl) => {
                    const TplIcon = tpl.icon;
                    return (
                      <div
                        key={tpl.id}
                        className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                            <TplIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-primary-600 dark:text-primary-400 tracking-wider block">
                              {tpl.category}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                              {tpl.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {tpl.desc}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {tpl.fieldsCount} Variabel Standar
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewActivityForm({
                                title: tpl.title,
                                description: tpl.desc,
                                category: tpl.category,
                                sheetUrl: '',
                                sheetName: 'Sheet1',
                                isOpen: true,
                                icon: 'Layers'
                              });
                              setIsNewActivityModalOpen(true);
                            }}
                            style={{ backgroundColor: presetInfo.colors.primary }}
                            className="px-3.5 py-1.5 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Gunakan Template</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* TAB 3: OWNED APPS GRID */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Owned ({filteredActivities.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredActivities.map((act) => {
                    const ActIcon = getIconComponent(act.icon, Layers);

                    return (
                      <motion.div
                        key={act.id}
                        whileHover={{ y: -3 }}
                        onClick={() => handleOpenStudio(act)}
                        className="bg-white dark:bg-slate-800/95 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between p-5 group min-h-[175px] relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${act.isOpen ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
                            {act.isOpen ? 'Live' : 'Closed'}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteBackupModal({
                                isOpen: true,
                                type: 'activity',
                                item: act,
                                hasDownloaded: false,
                                isDeleting: false,
                                downloading: false
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Kegiatan (Wajib Unduh Cadangan Excel)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="my-3 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:scale-105 group-hover:border-primary-200 transition-all shadow-2xs">
                            <ActIcon className="w-8 h-8 text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {act.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                              {act.category || 'Survei Lapangan'}
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                            Shared
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* + Create New App Card */}
                  <div
                    onClick={() => setIsNewActivityModalOpen(true)}
                    className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[175px] group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/60 text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 flex items-center justify-center mb-2 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary-700 dark:group-hover:text-primary-400">
                      Buat Aplikasi Baru
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Dari Google Sheet / Template
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Tambah Kegiatan Baru */}
        {isNewActivityModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Buat Aplikasi Baru</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Integrasikan dengan Google Sheets</p>
                  </div>
                </div>
                <button onClick={() => setIsNewActivityModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateActivity} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Aplikasi / Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newActivityForm.title}
                    onChange={(e) => setNewActivityForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Contoh: SNLIK 2026 atau Susenas"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Statistik
                  </label>
                  <CustomDropdown
                    value={newActivityForm.category}
                    options={CATEGORY_OPTIONS}
                    onChange={(val) => setNewActivityForm(prev => ({ ...prev, category: val }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tautan Google Sheet (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newActivityForm.sheetUrl}
                    onChange={(e) => setNewActivityForm(prev => ({ ...prev, sheetUrl: e.target.value }))}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsNewActivityModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: presetInfo.colors.primary }}
                    className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Lanjut ke Studio Editor</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Wajib Unduh Excel Cadangan Sebelum Hapus */}
        {deleteBackupModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Hapus {deleteBackupModal.type === 'activity' ? 'Kegiatan' : 'Formulir'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Pemberian ruang penyimpanan database</p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">Wajib Mengunduh File Cadangan:</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Sebelum menghapus data untuk mengosongkan database, Anda <b>wajib mengunduh arsip Excel (.xlsx)</b> terlebih dahulu.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Item target:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">{deleteBackupModal.item?.title}</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Langkah 1: Unduh Arsip Excel
                </label>
                <button
                  type="button"
                  onClick={() => handleDownloadExcelBackup(deleteBackupModal.item, deleteBackupModal.type)}
                  disabled={deleteBackupModal.downloading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    deleteBackupModal.hasDownloaded 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                      : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white'
                  }`}
                >
                  {deleteBackupModal.downloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : deleteBackupModal.hasDownloaded ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{deleteBackupModal.hasDownloaded ? 'File Excel Telah Berhasil Diunduh' : 'Unduh Cadangan Excel (.xlsx)'}</span>
                </button>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Langkah 2: Hapus dari Database
                </label>
                <button
                  type="button"
                  disabled={!deleteBackupModal.hasDownloaded || deleteBackupModal.isDeleting}
                  onClick={handleExecuteDelete}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                    deleteBackupModal.hasDownloaded 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  {deleteBackupModal.isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{deleteBackupModal.hasDownloaded ? 'Hapus Permanen Dari Database' : 'Unduh Excel Dahulu untuk Mengaktifkan'}</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteBackupModal(null)}
                  className="px-4 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: GAMBAR 2 - APPSHEET STUDIO & BEZEL-LESS LIVE SIMULATOR
  // =========================================================================
  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] w-full bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Top App Studio Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setAdminScreen('apps_home')}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Kembali ke Daftar Aplikasi"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Apps</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {selectedActivity?.title || 'Studio Editor'}
            </h2>
            <button
              onClick={() => handleToggleActivityOpen()}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                selectedActivity?.isOpen 
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200' 
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
              }`}
            >
              {selectedActivity?.isOpen ? '🟢 Live / Terbuka' : '🔴 Ditutup'}
            </button>
          </div>
        </div>

        {/* Center Studio Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setStudioTab('data')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'data' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data</span>
          </button>
          <button
            onClick={() => setStudioTab('ui')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'ui' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>UI</span>
          </button>
          <button
            onClick={() => setStudioTab('automation')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'automation' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automation</span>
          </button>
          <button
            onClick={() => setStudioTab('security')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'security' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
          <button
            onClick={() => setStudioTab('settings')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'settings' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Right Studio Actions */}
        <div className="flex items-center gap-2">
          {/* Undo & Redo Action Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                historyIndex > 0
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs cursor-pointer'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Undo perubahan konfigurasi form (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Undo</span>
            </button>

            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= historyStack.length - 1 || historyIndex < 0}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                historyIndex < historyStack.length - 1 && historyIndex >= 0
                  ? 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xs cursor-pointer'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Redo perubahan konfigurasi form (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Redo</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowRightSimulator(!showRightSimulator)}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showRightSimulator 
                ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title="Tampilkan / Sembunyikan Simulator HP"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden lg:inline">Live Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAllSettings}
            disabled={isSavingSchema}
            style={{ backgroundColor: presetInfo.colors.primary }}
            className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSavingSchema ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* Sync Alert Banner */}
      <AnimatePresence>
        {syncAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 text-xs font-bold flex items-center justify-between shadow-xs border-b ${
              syncAlert.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{syncAlert.message}</span>
            </div>
            <button onClick={() => setSyncAlert(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-Column Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* =====================================================================
            TAB CONTENT: DATA (TABLES + SCHEMA COLUMNS TABLE)
            ===================================================================== */}
        {studioTab === 'data' && (
          <>
            {/* LEFT PANEL: TABLES / FORMS NAVIGATION */}
            <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Tabel / Formulir
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewFormModalOpen(true)}
                    className="p-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Tambah Formulir / Tabel Baru"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(forms || []).map((f) => {
                    const isSel = f.id === selectedFormId;
                    const FIcon = getIconComponent(f.icon, FileText);

                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFormId(f.id)}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                          isSel 
                            ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs font-bold border border-slate-700/50' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FIcon className={`w-4 h-4 ${isSel ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                          <span className="text-xs truncate">{f.title}</span>
                        </div>

                        {isSel && forms.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteBackupModal({
                                isOpen: true,
                                type: 'form',
                                item: f,
                                hasDownloaded: false,
                                isDeleting: false,
                                downloading: false
                              });
                            }}
                            className="p-1 hover:bg-white/20 rounded-lg text-rose-300 transition-colors"
                            title="Hapus Formulir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Google Sheets Data Source Settings */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Sumber Data Google Sheet
                  </span>
                  <div>
                    <input
                      type="text"
                      placeholder="URL Google Sheet..."
                      value={formConfig.sheetUrl}
                      onChange={(e) => handleUpdateSheetConfig('sheetUrl', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-primary-300"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Nama Tab (e.g. Sheet1)"
                      value={formConfig.sheetName}
                      onChange={(e) => handleUpdateSheetConfig('sheetName', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-primary-300"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncFromGoogleSheet}
                    disabled={isSyncingSheet}
                    className="w-full py-1.5 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin text-primary-600 dark:text-primary-400' : ''}`} />
                    <span>Sinkronkan dari Sheet</span>
                  </button>
                </div>

                {/* Grouping Hierarchy Configuration (Level 1 s.d. Level 4) with Column Dropdowns */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Struktur Grouping (Max 4 Level)
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Level 1 - 4</span>
                  </div>

                  {fields.length === 0 ? (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[10px] text-amber-800 dark:text-amber-300">
                      Sinkronkan Google Sheet di atas untuk memuat daftar kolom grouping.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* LEVEL 1 */}
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">
                          Level 1 (Grup Utama):
                        </label>
                        <CustomDropdown
                          size="sm"
                          searchable={fields.length > 5}
                          value={formConfig.groupingLevels?.[0] || ''}
                          options={[
                            { value: '', label: '-- Tidak Digunakan (Kosong) --' },
                            ...fields.map(f => ({
                              value: f.columnName || f.label,
                              label: f.label || f.columnName,
                              desc: `Tipe: ${f.dataType || 'Text'}`
                            }))
                          ]}
                          onChange={(val) => handleUpdateGroupingLevel(0, val)}
                        />
                      </div>

                      {/* LEVEL 2 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                            Level 2 (Sub-Grup):
                          </label>
                          {!formConfig.groupingLevels?.[0] && (
                            <span className="text-[9px] text-slate-400 italic">Pilih Level 1 dulu</span>
                          )}
                        </div>
                        <CustomDropdown
                          size="sm"
                          disabled={!formConfig.groupingLevels?.[0]}
                          searchable={fields.length > 5}
                          value={formConfig.groupingLevels?.[1] || ''}
                          options={[
                            { value: '', label: '-- Tidak Digunakan (Kosong) --' },
                            ...fields.map(f => ({
                              value: f.columnName || f.label,
                              label: f.label || f.columnName,
                              desc: `Tipe: ${f.dataType || 'Text'}`
                            }))
                          ]}
                          onChange={(val) => handleUpdateGroupingLevel(1, val)}
                        />
                      </div>

                      {/* LEVEL 3 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                            Level 3 (Wilayah / Kategori):
                          </label>
                          {!formConfig.groupingLevels?.[1] && (
                            <span className="text-[9px] text-slate-400 italic">Pilih Level 2 dulu</span>
                          )}
                        </div>
                        <CustomDropdown
                          size="sm"
                          disabled={!formConfig.groupingLevels?.[1]}
                          searchable={fields.length > 5}
                          value={formConfig.groupingLevels?.[2] || ''}
                          options={[
                            { value: '', label: '-- Tidak Digunakan (Kosong) --' },
                            ...fields.map(f => ({
                              value: f.columnName || f.label,
                              label: f.label || f.columnName,
                              desc: `Tipe: ${f.dataType || 'Text'}`
                            }))
                          ]}
                          onChange={(val) => handleUpdateGroupingLevel(2, val)}
                        />
                      </div>

                      {/* LEVEL 4 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                            Level 4 (Blok / RT / SLS):
                          </label>
                          {!formConfig.groupingLevels?.[2] && (
                            <span className="text-[9px] text-slate-400 italic">Pilih Level 3 dulu</span>
                          )}
                        </div>
                        <CustomDropdown
                          size="sm"
                          disabled={!formConfig.groupingLevels?.[2]}
                          searchable={fields.length > 5}
                          value={formConfig.groupingLevels?.[3] || ''}
                          options={[
                            { value: '', label: '-- Tidak Digunakan (Kosong) --' },
                            ...fields.map(f => ({
                              value: f.columnName || f.label,
                              label: f.label || f.columnName,
                              desc: `Tipe: ${f.dataType || 'Text'}`
                            }))
                          ]}
                          onChange={(val) => handleUpdateGroupingLevel(3, val)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CENTER PANEL: SCHEMA COLUMNS & DATA TYPES EDITOR */}
            <div className="flex-1 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between overflow-hidden">
              <div className="space-y-4 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {selectedForm?.title || 'Formulir'} - Definisi Kolom &amp; Tipe Data
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {fields.length} Kolom
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddColumnRow}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Column</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex-1 overflow-auto custom-scrollbar relative max-h-[calc(100vh-270px)] min-h-[380px] pb-40">
                  <table className="w-full text-left text-xs border-collapse relative">
                    <thead className="sticky top-0 z-30 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase font-black tracking-wider text-[10px] shadow-sm">
                      <tr>
                        <th className="sticky top-0 z-30 py-3 px-3 w-10 text-center bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-xs">#</th>
                        <th className="sticky top-0 z-30 py-3 px-3 min-w-[160px] bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-xs">NAME</th>
                        <th className="sticky top-0 z-30 py-3 px-3 min-w-[150px] bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-xs">TYPE</th>
                        <th className="sticky top-0 z-30 py-3 px-2 text-center w-14 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-xs" title="Primary Key unik baris">KEY?</th>
                        <th className="sticky top-0 z-30 py-3 px-2 text-center w-14 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-xs" title="Judul kartu sampel">LABEL?</th>
                        <th className="sticky top-0 z-30 py-3 px-2 text-center w-14 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-xs" title="Wajib diisi petugas">REQ?</th>
                        <th className="sticky top-0 z-30 py-3 px-2 text-center w-14 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-xs" title="Bisa diedit petugas di lapangan">EDIT?</th>
                        <th className="sticky top-0 z-30 py-3 px-3 min-w-[280px] bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-xs">OPTIONS / VALIDASI</th>
                        <th className="sticky top-0 z-30 py-3 px-2 text-center w-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-xs"></th>
                      </tr>
                    </thead>

                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {fields.map((field, idx) => (
                          <tr key={field.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={field.label || field.columnName || ''}
                                onChange={(e) => handleUpdateColumnRow(idx, 'label', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-primary-300"
                              />
                            </td>

                            <td className="py-2 px-3">
                              <CustomDropdown
                                size="sm"
                                value={field.dataType || 'Text'}
                                options={DATA_TYPES.map(dt => ({ value: dt.id, label: dt.label }))}
                                onChange={(val) => handleUpdateColumnRow(idx, 'dataType', val)}
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!field.isKey}
                                onChange={(e) => handleUpdateColumnRow(idx, 'isKey', e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-400 cursor-pointer"
                                title="Primary Key baris data"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!field.isLabel}
                                onChange={(e) => handleUpdateColumnRow(idx, 'isLabel', e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-400 cursor-pointer"
                                title="Judul tampilan utama kartu"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!field.isRequired}
                                onChange={(e) => handleUpdateColumnRow(idx, 'isRequired', e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-400 cursor-pointer"
                                title="Wajib diisi sebelum kirim"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={field.isEditable !== false}
                                onChange={(e) => handleUpdateColumnRow(idx, 'isEditable', e.target.checked)}
                                className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-400 cursor-pointer"
                                title="Bisa diedit oleh petugas di lapangan"
                              />
                            </td>

                            <td className="py-2 px-3">
                              {field.dataType === 'Enum' ? (
                                <input
                                  type="text"
                                  placeholder="Opsi 1, Opsi 2, Opsi 3"
                                  value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
                                  onChange={(e) => {
                                    const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    handleUpdateColumnRow(idx, 'options', list);
                                  }}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-primary-300 placeholder-slate-400"
                                />
                              ) : field.dataType === 'Number' ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <CustomDropdown
                                    size="sm"
                                    value={field.validation?.operator || 'none'}
                                    options={[
                                      { value: 'none', label: 'Tanpa Batas' },
                                      { value: 'range', label: 'Rentang (Min - Max)' },
                                      { value: '>=', label: '>= (Minimal)' },
                                      { value: '<=', label: '<= (Maksimal)' },
                                      { value: '>', label: '> (Lebih Dari)' },
                                      { value: '<', label: '< (Kurang Dari)' },
                                      { value: '==', label: '== (Sama Dengan)' }
                                    ]}
                                    onChange={(op) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), operator: op })}
                                    className="w-36"
                                  />

                                  {field.validation?.operator === 'range' ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        placeholder="Min"
                                        value={field.validation?.min ?? ''}
                                        onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), min: e.target.value })}
                                        className="w-16 px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-200 outline-none"
                                      />
                                      <span className="text-slate-400 text-xs font-bold">-</span>
                                      <input
                                        type="number"
                                        placeholder="Max"
                                        value={field.validation?.max ?? ''}
                                        onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), max: e.target.value })}
                                        className="w-16 px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-200 outline-none"
                                      />
                                    </div>
                                  ) : field.validation?.operator && field.validation?.operator !== 'none' ? (
                                    <input
                                      type="number"
                                      placeholder="Nilai Patokan"
                                      value={field.validation?.value ?? ''}
                                      onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), value: e.target.value })}
                                      className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-200 outline-none"
                                    />
                                  ) : null}
                                </div>
                              ) : field.dataType === 'Date' ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <CustomDropdown
                                    size="sm"
                                    value={field.validation?.operator || 'none'}
                                    options={[
                                      { value: 'none', label: 'Bebas' },
                                      { value: 'range', label: 'Rentang Tanggal' },
                                      { value: '>=', label: '>= (Mulai Dari)' },
                                      { value: '<=', label: '<= (Sampai)' },
                                      { value: '>', label: '> (Setelah)' },
                                      { value: '<', label: '< (Sebelum)' },
                                      { value: '==', label: '== (Tepat)' }
                                    ]}
                                    onChange={(op) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), operator: op })}
                                    className="w-36"
                                  />

                                  {field.validation?.operator === 'range' ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="date"
                                        value={field.validation?.min ?? ''}
                                        onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), min: e.target.value })}
                                        className="px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 outline-none"
                                      />
                                      <span className="text-slate-400 text-xs font-bold">-</span>
                                      <input
                                        type="date"
                                        value={field.validation?.max ?? ''}
                                        onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), max: e.target.value })}
                                        className="px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 outline-none"
                                      />
                                    </div>
                                  ) : field.validation?.operator && field.validation?.operator !== 'none' ? (
                                    <input
                                      type="date"
                                      value={field.validation?.value ?? ''}
                                      onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), value: e.target.value })}
                                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 outline-none"
                                    />
                                  ) : null}
                                </div>
                              ) : field.dataType === 'Time' ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <CustomDropdown
                                    size="sm"
                                    value={field.validation?.operator || 'none'}
                                    options={[
                                      { value: 'none', label: 'Bebas' },
                                      { value: 'range', label: 'Rentang Jam' },
                                      { value: '>=', label: '>= (Paling Awal)' },
                                      { value: '<=', label: '<= (Paling Akhir)' },
                                      { value: '>', label: '> (Setelah Jam)' },
                                      { value: '<', label: '< (Sebelum Jam)' },
                                      { value: '==', label: '== (Tepat Jam)' }
                                    ]}
                                    onChange={(op) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), operator: op })}
                                    className="w-36"
                                  />

                                  {field.validation?.operator === 'range' ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="time"
                                        value={field.validation?.min ?? ''}
                                        onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), min: e.target.value })}
                                        className="px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 outline-none"
                                      />
                                      <span className="text-slate-400 text-xs font-bold">-</span>
                                      <input
                                        type="time"
                                        value={field.validation?.max ?? ''}
                                        onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), max: e.target.value })}
                                        className="px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 outline-none"
                                      />
                                    </div>
                                  ) : field.validation?.operator && field.validation?.operator !== 'none' ? (
                                    <input
                                      type="time"
                                      value={field.validation?.value ?? ''}
                                      onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), value: e.target.value })}
                                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 outline-none"
                                    />
                                  ) : null}
                                </div>
                              ) : field.dataType === 'Image' ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <label className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={field.validation?.requireGeotag ?? true}
                                      onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), requireGeotag: e.target.checked })}
                                      className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-400 cursor-pointer"
                                    />
                                    <span>Mark Geotag</span>
                                  </label>
                                  <label className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={field.validation?.requireTimestamp ?? true}
                                      onChange={(e) => handleUpdateColumnRow(idx, 'validation', { ...(field.validation || {}), requireTimestamp: e.target.checked })}
                                      className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-400 cursor-pointer"
                                    />
                                    <span>Timestamp</span>
                                  </label>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  {field.dataType === 'LatLong' ? 'Geotagging GPS' : '-'}
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveColumnRow(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Kolom"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Perubahan skema akan otomatis disinkronkan ke aplikasi petugas di simulator.
                  </span>

                  <button
                    type="button"
                    onClick={handleSaveAllSettings}
                    disabled={isSavingSchema}
                    style={{ backgroundColor: presetInfo.colors.primary }}
                    className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingSchema ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Simpan Perubahan Skema</span>
                  </button>
                </div>
              </div>
            </>
          )}

        {/* =====================================================================
            TAB CONTENT: UI (ANTARMUKA & TEMA PETUGAS)
            ===================================================================== */}
        {studioTab === 'ui' && (
          <div className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Konfigurasi UI &amp; Antarmuka Aplikasi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Atur nama kegiatan, deskripsi, tema warna, icon, judul e-form, posisi dan mode navigasi (bottom bar / sidebar), serta tata letak daftar assignment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              {/* CARD 1: IDENTITAS KEGIATAN LAPANGAN */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                    Identitas &amp; Tampilan Kegiatan
                  </label>
                </div>

                {/* Nama Kegiatan */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Nama Kegiatan Pendataan</label>
                  <input
                    type="text"
                    value={selectedActivity?.title || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedActivity((prev: any) => ({ ...prev, title: val }));
                    }}
                    placeholder="Contoh: Survei Angkatan Kerja Nasional (Sakernas)..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Deskripsi Kegiatan */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Deskripsi Singkat Kegiatan</label>
                  <textarea
                    rows={2}
                    value={selectedActivity?.description || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedActivity((prev: any) => ({ ...prev, description: val }));
                    }}
                    placeholder="Deskripsi kegiatan untuk petunjuk petugas di lapangan..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {/* Icon Kegiatan Lapangan */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Icon Kegiatan (Sama dengan LMS &amp; Monitoring)</label>
                  <CustomDropdown
                    size="sm"
                    searchable={true}
                    value={selectedActivity?.icon || 'Layers'}
                    options={AVAILABLE_ICONS.map(ic => ({
                      value: ic.id,
                      label: ic.label,
                      icon: ic.icon
                    }))}
                    onChange={(val) => {
                      setSelectedActivity((prev: any) => ({ ...prev, icon: val }));
                    }}
                  />
                </div>
              </div>

              {/* CARD 2: TEMA WARNA & BRAND COLOR */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700">
                    <Palette className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                      Tema Warna Kegiatan &amp; Formulir
                    </label>
                  </div>

                  <div className="mt-3 space-y-3">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Pilihan Palet Warna Utama</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        { name: 'Sky Blue (Default BPS)', color: '#0ea5e9' },
                        { name: 'Navy Blue', color: '#1e3a8a' },
                        { name: 'Emerald Green', color: '#059669' },
                        { name: 'Violet Purple', color: '#7c3aed' },
                        { name: 'Amber Gold', color: '#d97706' },
                        { name: 'Rose Red', color: '#e11d48' },
                      ].map((t) => (
                        <button
                          key={t.color}
                          type="button"
                          onClick={() => {
                            setUxSettings(prev => ({ ...prev, themeColor: t.color }));
                            setSelectedActivity((prev: any) => ({
                              ...prev,
                              settings: {
                                ...(prev?.settings || {}),
                                themeColor: t.color
                              }
                            }));
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform cursor-pointer ${
                            uxSettings.themeColor === t.color ? 'scale-110 ring-2 ring-offset-2 ring-slate-800 dark:ring-white' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: t.color }}
                          title={t.name}
                        >
                          {uxSettings.themeColor === t.color && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2 text-xs">
                      <span className="text-slate-400 text-[11px]">Kode Hex Warna:</span>
                      <input
                        type="text"
                        value={uxSettings.themeColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUxSettings(prev => ({ ...prev, themeColor: val }));
                          setSelectedActivity((prev: any) => ({
                            ...prev,
                            settings: {
                              ...(prev?.settings || {}),
                              themeColor: val
                            }
                          }));
                        }}
                        className="w-24 px-2 py-1 font-mono text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-primary-500 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/60 rounded-xl text-[10px] text-primary-800 dark:text-primary-300">
                  Warna ini akan diterapkan ke tombol aksi, status aktif, navigasi, dan banner formulir petugas.
                </div>
              </div>

              {/* CARD 3: IDENTITAS & ICON FORMULIR AKTIF */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <Edit3 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                    Identitas Formulir / E-Form Aktif
                  </label>
                </div>

                {/* Nama Formulir */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Nama Formulir Aktif</label>
                  <input
                    type="text"
                    value={selectedForm?.title || ''}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      if (!selectedForm) return;
                      setForms(prev => prev.map(f => f.id === selectedForm.id ? { ...f, title: newTitle } : f));
                    }}
                    placeholder="Nama Formulir..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Icon Formulir */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Icon Formulir di Navigasi</label>
                  <CustomDropdown
                    size="sm"
                    searchable={true}
                    value={selectedForm?.icon || 'FileText'}
                    options={AVAILABLE_ICONS.map(ic => ({
                      value: ic.id,
                      label: ic.label,
                      icon: ic.icon
                    }))}
                    onChange={(val) => {
                      if (!selectedForm) return;
                      setForms(prev => prev.map(f => f.id === selectedForm.id ? { ...f, icon: val } : f));
                    }}
                  />
                </div>
              </div>

              {/* CARD 4: URUTAN FORMULIR DI NAVIGASI */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                      Urutan Formulir di Navigasi
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">{forms.length} Formulir</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {forms.map((f, idx) => {
                    const FormIcon = getIconComponent(f.icon, FileText);
                    return (
                      <div 
                        key={f.id || idx}
                        className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <FormIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {f.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveForm(idx, 'up')}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Pindah ke atas"
                          >
                            <ChevronLeft className="w-3.5 h-3.5 rotate-90" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === forms.length - 1}
                            onClick={() => handleMoveForm(idx, 'down')}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Pindah ke bawah"
                          >
                            <ChevronLeft className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CARD 5: MODE NAVIGASI (BOTTOM BAR / SIDEBAR / BOTH) */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 md:col-span-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Mode Navigasi Formulir Petugas</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'bottom_bar', label: 'Bottom Bar Saja', desc: 'Navigasi bawah, cocok untuk smartphone' },
                    { id: 'sidebar', label: 'Sidebar Saja', desc: 'Navigasi samping kiri, cocok untuk tablet/desktop' },
                    { id: 'both', label: 'Dua-duanya (Both)', desc: 'Menampilkan bottom bar dan menu sidebar sekaligus' }
                  ].map((nav) => (
                    <div
                      key={nav.id}
                      onClick={() => setUxSettings(prev => ({ ...prev, navMode: nav.id as any }))}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        uxSettings.navMode === nav.id 
                          ? 'bg-white dark:bg-slate-700 border-primary-400 shadow-2xs font-bold' 
                          : 'bg-slate-100/60 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="text-xs block text-slate-800 dark:text-slate-100">{nav.label}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal block">{nav.desc}</span>
                      </div>
                      {uxSettings.navMode === nav.id && <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 6: TAMPILAN DAFTAR ASSIGNMENT */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 md:col-span-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Tampilan Daftar Assignment Petugas</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: 'card_list', label: 'Kartu Assignment dengan Foto', desc: 'Menampilkan thumbnail foto dan tombol aksi cepat GPS/Edit di setiap item' },
                    { id: 'compact_list', label: 'Daftar Ramping (Compact Rows)', desc: 'Menampilkan lebih banyak data per layar dalam format baris padat tanpa thumbnail foto' }
                  ].map((lay) => (
                    <div
                      key={lay.id}
                      onClick={() => setUxSettings(prev => ({ ...prev, viewLayout: lay.id }))}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        uxSettings.viewLayout === lay.id ? 'bg-white dark:bg-slate-700 border-primary-400 shadow-2xs font-bold' : 'bg-slate-100/60 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="text-xs block text-slate-800 dark:text-slate-100">{lay.label}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal block">{lay.desc}</span>
                      </div>
                      {uxSettings.viewLayout === lay.id && <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAllSettings}
                style={{ backgroundColor: presetInfo.colors.primary }}
                className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan UI</span>
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB CONTENT: AUTOMATION (OTOMATISASI & NOTIFIKASI)
            ===================================================================== */}
        {studioTab === 'automation' && (
          <div className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Otomatisasi &amp; Notifikasi Data Lapangan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Konfigurasi jadwal sinkronisasi otomatis ke Google Sheets, webhook API, dan validasi radius GPS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Jadwal Sinkronisasi Google Sheets</label>
                <div className="space-y-2">
                  {[
                    { id: 'realtime', label: 'Real-time (Instan Saat Petugas Submit)', desc: 'Data langsung terkirim ke baris Google Sheets secara simultan' },
                    { id: 'batch_15m', label: 'Periodik Setiap 15 Menit', desc: 'Menghemat kuota Google Sheets API untuk ratusan petugas aktif' },
                    { id: 'manual', label: 'Manual oleh Admin', desc: 'Sinkronisasi hanya berjalan saat tombol refresh diklik' }
                  ].map((freq) => (
                    <div
                      key={freq.id}
                      onClick={() => setAutoSettings(prev => ({ ...prev, syncFrequency: freq.id }))}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        autoSettings.syncFrequency === freq.id ? 'bg-white dark:bg-slate-700 border-primary-400 shadow-2xs font-bold' : 'bg-slate-100/60 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <span className="text-xs block text-slate-800 dark:text-slate-100">{freq.label}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal block">{freq.desc}</span>
                      </div>
                      {autoSettings.syncFrequency === freq.id && <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Validasi Radius Lokasi GPS Lapangan</label>
                  <input
                    type="checkbox"
                    checked={autoSettings.enableGeofence}
                    onChange={(e) => setAutoSettings(prev => ({ ...prev, enableGeofence: e.target.checked }))}
                    className="rounded text-primary-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Peringatkan petugas jika titik koordinat pengisian berada di luar batas toleransi wilayah target.
                </p>
                {autoSettings.enableGeofence && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Toleransi Radius Maksimal:</label>
                    <input
                      type="number"
                      value={autoSettings.maxRadiusMeters}
                      onChange={(e) => setAutoSettings(prev => ({ ...prev, maxRadiusMeters: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100"
                      placeholder="250 (Meter)"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAllSettings}
                style={{ backgroundColor: presetInfo.colors.primary }}
                className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
              >
                Simpan Otomatisasi
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB CONTENT: SECURITY (HAK AKSES & KEAMANAN)
            ===================================================================== */}
        {studioTab === 'security' && (
          <div className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Hak Akses &amp; Proteksi Data Petugas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Konfigurasi integritas data, kunci edit setelah pengiriman, dan kewajiban verifikasi GPS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Kunci Edit Data Setelah Submit</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Mencegah perubahan data isian setelah status diubah menjadi <i>Terkirim</i> oleh petugas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.lockOnSubmit}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockOnSubmit: e.target.checked }))}
                  className="rounded text-primary-600 cursor-pointer mt-1"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Wajib Geotagging GPS untuk Submit</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Petugas tidak dapat mengirimkan laporan tanpa menyalakan titik koordinat GPS lokasi.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.requireGPS}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireGPS: e.target.checked }))}
                  className="rounded text-primary-600 cursor-pointer mt-1"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAllSettings}
                style={{ backgroundColor: presetInfo.colors.primary }}
                className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
              >
                Simpan Konfigurasi Keamanan
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB CONTENT: SETTINGS (PENGATURAN UMUM)
            ===================================================================== */}
        {studioTab === 'settings' && (
          <div className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Pengaturan Umum Kegiatan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kelola informasi nama survei, kategori, saklar status buka/tutup aplikasi, dan arsip data.
              </p>
            </div>

            <div className="max-w-2xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Aplikasi / Kegiatan Survei</label>
                <input
                  type="text"
                  value={selectedActivity?.title || ''}
                  onChange={(e) => {
                    const updated = { ...selectedActivity, title: e.target.value };
                    setSelectedActivity(updated);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Keaktifan Petugas</label>
                <button
                  type="button"
                  onClick={() => handleToggleActivityOpen()}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedActivity?.isOpen 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{selectedActivity?.isOpen ? 'Aplikasi Dibuka untuk Seluruh Petugas' : 'Aplikasi Ditutup Sementara (Maintenance)'}</span>
                </button>
              </div>

              {/* CARD: KONFIGURASI PEMBUATAN LAPORAN RESMI & INTEGRITAS FOTO */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Konfigurasi Pembuatan Laporan Resmi Dinas
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Atur form target untuk mencetak berkas laporan per PPL dan integritas foto lapangan.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportSettings.enableOfficialReport}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        const defaultTargetForm = reportSettings.targetFormId || (forms[0]?.id || '');
                        const targetF = forms.find(f => f.id === defaultTargetForm) || forms[0];
                        const tFields = targetF?.fields || [];
                        const dCol = tFields.find((f: any) => String(f.dataType || f.type).toLowerCase() === 'date')?.columnName || '';
                        const tCol = tFields.find((f: any) => String(f.dataType || f.type).toLowerCase() === 'time')?.columnName || '';
                        const gCol = tFields.find((f: any) => ['latlong', 'gps', 'lokasi'].includes(String(f.dataType || f.type).toLowerCase()))?.columnName || '';
                        const pCol = tFields.find((f: any) => ['image', 'foto'].includes(String(f.dataType || f.type).toLowerCase()))?.columnName || '';

                        const updated = {
                          ...reportSettings,
                          enableOfficialReport: enabled,
                          targetFormId: defaultTargetForm,
                          dateColumn: reportSettings.dateColumn || dCol,
                          timeColumn: reportSettings.timeColumn || tCol,
                          gpsColumn: reportSettings.gpsColumn || gCol,
                          photoColumn: reportSettings.photoColumn || pCol
                        };
                        setReportSettings(updated);
                        if (selectedActivity?.id) {
                          const updatedAct = {
                            ...selectedActivity,
                            settings: { ...(selectedActivity.settings || {}), reportSettings: updated }
                          };
                          setSelectedActivity(updatedAct);
                          localStorage.setItem(`garda_report_settings_${selectedActivity.id}`, JSON.stringify(updated));
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {!reportSettings.enableOfficialReport ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Fitur pembuatan laporan dinas non-aktif untuk kegiatan ini. Aturan deteksi watermark foto dinonaktifkan.</span>
                  </div>
                ) : (
                  <div className="bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-4 space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Formulir Wadah Laporan
                      </label>
                      <CustomDropdown
                        value={reportSettings.targetFormId || (forms[0]?.id || '')}
                        options={forms.map(f => ({
                          value: f.id,
                          label: f.title || f.name || 'Formulir',
                          icon: FileText
                        }))}
                        onChange={(formId) => {
                          const targetF = forms.find(f => f.id === formId) || forms[0];
                          const tFields = targetF?.fields || [];
                          const dCol = tFields.find((f: any) => String(f.dataType || f.type).toLowerCase() === 'date')?.columnName || '';
                          const tCol = tFields.find((f: any) => String(f.dataType || f.type).toLowerCase() === 'time')?.columnName || '';
                          const gCol = tFields.find((f: any) => ['latlong', 'gps', 'lokasi'].includes(String(f.dataType || f.type).toLowerCase()))?.columnName || '';
                          const pCol = tFields.find((f: any) => ['image', 'foto'].includes(String(f.dataType || f.type).toLowerCase()))?.columnName || '';

                          const updated = {
                            ...reportSettings,
                            targetFormId: formId,
                            dateColumn: dCol || reportSettings.dateColumn,
                            timeColumn: tCol || reportSettings.timeColumn,
                            gpsColumn: gCol || reportSettings.gpsColumn,
                            photoColumn: pCol || reportSettings.photoColumn
                          };
                          setReportSettings(updated);
                          if (selectedActivity?.id) {
                            const updatedAct = {
                              ...selectedActivity,
                              settings: { ...(selectedActivity.settings || {}), reportSettings: updated }
                            };
                            setSelectedActivity(updatedAct);
                            localStorage.setItem(`garda_report_settings_${selectedActivity.id}`, JSON.stringify(updated));
                          }
                        }}
                        placeholder="Pilih Formulir..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Kolom Tanggal Pendataan
                        </label>
                        <CustomDropdown
                          size="sm"
                          searchable
                          value={reportSettings.dateColumn || ''}
                          options={[
                            { value: '', label: '(Otomatis dari isian Date)', icon: Calendar },
                            ...((forms.find(f => f.id === reportSettings.targetFormId) || forms[0])?.fields || []).map((f: any) => ({
                              value: f.columnName,
                              label: f.label || f.columnName,
                              icon: Calendar
                            }))
                          ]}
                          onChange={(val) => {
                            const updated = { ...reportSettings, dateColumn: val };
                            setReportSettings(updated);
                            if (selectedActivity?.id) {
                              const updatedAct = {
                                ...selectedActivity,
                                settings: { ...(selectedActivity.settings || {}), reportSettings: updated }
                              };
                              setSelectedActivity(updatedAct);
                              localStorage.setItem(`garda_report_settings_${selectedActivity.id}`, JSON.stringify(updated));
                            }
                          }}
                          placeholder="Pilih Kolom Tanggal..."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Kolom Jam/Waktu Kunjungan
                        </label>
                        <CustomDropdown
                          size="sm"
                          searchable
                          value={reportSettings.timeColumn || ''}
                          options={[
                            { value: '', label: '(Otomatis dari isian Time)', icon: Clock },
                            ...((forms.find(f => f.id === reportSettings.targetFormId) || forms[0])?.fields || []).map((f: any) => ({
                              value: f.columnName,
                              label: f.label || f.columnName,
                              icon: Clock
                            }))
                          ]}
                          onChange={(val) => {
                            const updated = { ...reportSettings, timeColumn: val };
                            setReportSettings(updated);
                            if (selectedActivity?.id) {
                              const updatedAct = {
                                ...selectedActivity,
                                settings: { ...(selectedActivity.settings || {}), reportSettings: updated }
                              };
                              setSelectedActivity(updatedAct);
                              localStorage.setItem(`garda_report_settings_${selectedActivity.id}`, JSON.stringify(updated));
                            }
                          }}
                          placeholder="Pilih Kolom Jam..."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Kolom Geotagging GPS
                        </label>
                        <CustomDropdown
                          size="sm"
                          searchable
                          value={reportSettings.gpsColumn || ''}
                          options={[
                            { value: '', label: '(Otomatis dari isian GPS/LatLong)', icon: MapPin },
                            ...((forms.find(f => f.id === reportSettings.targetFormId) || forms[0])?.fields || []).map((f: any) => ({
                              value: f.columnName,
                              label: f.label || f.columnName,
                              icon: MapPin
                            }))
                          ]}
                          onChange={(val) => {
                            const updated = { ...reportSettings, gpsColumn: val };
                            setReportSettings(updated);
                            if (selectedActivity?.id) {
                              const updatedAct = {
                                ...selectedActivity,
                                settings: { ...(selectedActivity.settings || {}), reportSettings: updated }
                              };
                              setSelectedActivity(updatedAct);
                              localStorage.setItem(`garda_report_settings_${selectedActivity.id}`, JSON.stringify(updated));
                            }
                          }}
                          placeholder="Pilih Kolom GPS..."
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Kolom Foto Dokumentasi
                        </label>
                        <CustomDropdown
                          size="sm"
                          searchable
                          value={reportSettings.photoColumn || ''}
                          options={[
                            { value: '', label: '(Otomatis dari isian Image)', icon: UploadCloud },
                            ...((forms.find(f => f.id === reportSettings.targetFormId) || forms[0])?.fields || []).map((f: any) => ({
                              value: f.columnName,
                              label: f.label || f.columnName,
                              icon: UploadCloud
                            }))
                          ]}
                          onChange={(val) => {
                            const updated = { ...reportSettings, photoColumn: val };
                            setReportSettings(updated);
                            if (selectedActivity?.id) {
                              const updatedAct = {
                                ...selectedActivity,
                                settings: { ...(selectedActivity.settings || {}), reportSettings: updated }
                              };
                              setSelectedActivity(updatedAct);
                              localStorage.setItem(`garda_report_settings_${selectedActivity.id}`, JSON.stringify(updated));
                            }
                          }}
                          placeholder="Pilih Kolom Foto..."
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="detectWatermarkToggle"
                        checked={reportSettings.detectWatermark}
                        onChange={(e) => {
                          const updated = { ...reportSettings, detectWatermark: e.target.checked };
                          setReportSettings(updated);
                          if (selectedActivity?.id) {
                            const updatedAct = {
                              ...selectedActivity,
                              settings: { ...(selectedActivity.settings || {}), reportSettings: updated }
                            };
                            setSelectedActivity(updatedAct);
                            localStorage.setItem(`garda_report_settings_${selectedActivity.id}`, JSON.stringify(updated));
                          }
                        }}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 cursor-pointer"
                      />
                      <label htmlFor="detectWatermarkToggle" className="text-xs cursor-pointer select-none">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          Aktifkan Deteksi Watermark / Timestamp Eksternal
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
                          Memberikan peringatan pada penugasan bila foto terdeteksi memiliki cap watermark/timestamp dari aplikasi kamera pihak ketiga. Geotagging dan waktu laporan akan disematkan murni dari isian e-form resmi.
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteBackupModal({
                      isOpen: true,
                      type: 'activity',
                      item: selectedActivity,
                      hasDownloaded: false,
                      isDeleting: false,
                      downloading: false
                    });
                  }}
                  className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Kegiatan &amp; Unduh Cadangan Excel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            RIGHT PANEL: BEZEL-LESS LIVE INTERACTIVE SIMULATOR (ADAPTIVE LIGHT/DARK)
            ===================================================================== */}
        {showRightSimulator && (
          <div className="w-[340px] lg:w-[370px] bg-slate-50/90 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-800 p-2 flex flex-col items-center justify-between shrink-0 overflow-hidden relative">
            {/* Top Toolbar: Device Switcher, Live Edit Toggle, Popout */}
            <div className="w-full pb-2 flex items-center justify-between text-xs border-b border-slate-200 dark:border-slate-800 shrink-0">
              {/* Device Selector Buttons */}
              <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/90 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSimulatorDevice('mobile')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    simulatorDevice === 'mobile' ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Tampilan Smartphone (Mobile)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatorDevice('tablet')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    simulatorDevice === 'tablet' ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Tampilan Tablet"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatorDevice('desktop')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    simulatorDevice === 'desktop' ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Tampilan Desktop / Laptop"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right: Live Edit Toggle with Info & Popout */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsLiveEdit(!isLiveEdit)}
                    className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                      isLiveEdit ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    title={isLiveEdit ? "Live Interactive Mode Aktif" : "Mode Pratinjau Terkunci"}
                  >
                    <motion.div
                      animate={{ x: isLiveEdit ? 14 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-3 h-3 rounded-full bg-white shadow-xs"
                    />
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Edit</span>
                  <button
                    type="button"
                    onClick={() => setShowActivityInfoModal(true)}
                    className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-0.5 transition-colors cursor-pointer"
                    title="Informasi / Deskripsi Kegiatan"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/?activityId=${selectedActivity?.id}`;
                    window.open(url, '_blank');
                  }}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Buka Pratinjau di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Responsive Device Container - Full Width with No Wasted Side Margin */}
            <div className="w-full flex-1 max-h-[calc(100vh-130px)] bg-white dark:bg-slate-900 rounded-2xl shadow-md ring-1 ring-slate-200/80 dark:ring-slate-800 relative flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300 my-1">
              {/* Clean Status Bar */}
              <div className="h-5 px-3 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 z-30 select-none bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
                <span className="font-mono">09:41</span>
                <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="flex items-center gap-1 text-[9px]">
                  <span>5G</span>
                  <div className="w-3 h-1.5 rounded-xs border border-slate-400 dark:border-slate-500 p-0.5 flex items-center">
                    <div className="w-full h-full bg-emerald-500 rounded-2xs" />
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-900 overflow-hidden relative flex flex-col">
                {selectedActivity && (
                  <PetugasLaporanModule
                    key={`${selectedActivity.id}_${uxSettings.themeColor}_${simulatorKey}`}
                    user={user}
                    initialActivityId={selectedActivity.id}
                    isSimulator={true}
                    isLiveEdit={isLiveEdit}
                    activityOverride={{
                      ...selectedActivity,
                      settings: {
                        ...(selectedActivity.settings || {}),
                        themeColor: uxSettings.themeColor,
                        viewLayout: uxSettings.viewLayout,
                        navMode: uxSettings.navMode
                      }
                    }}
                    formsOverride={forms}
                    themeColorOverride={uxSettings.themeColor}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Formulir Baru */}
      {isNewFormModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tambah Formulir / Tabel Baru</h3>
              </div>
              <button onClick={() => setIsNewFormModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFormInStudio} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Formulir / E-Form <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFormTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewFormTitle(val);
                    if (!newFormSheetName || newFormSheetName === newFormTitle) {
                      setNewFormSheetName(val);
                    }
                  }}
                  placeholder="Contoh: Pencacahan atau Pemeriksaan"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Tab Sheet (Worksheet Name)
                </label>
                <input
                  type="text"
                  value={newFormSheetName}
                  onChange={(e) => setNewFormSheetName(e.target.value)}
                  placeholder="Contoh: Pencacahan, Sheet1, atau Pemadanan"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Nama tab lembar kerja di dalam file Google Spreadsheet yang sama.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tautan Google Spreadsheet Database
                </label>
                <input
                  type="url"
                  value={newFormSheetUrl}
                  onChange={(e) => setNewFormSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-300 font-medium"
                />
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  ✓ Otomatis terhubung ke Google Spreadsheet kegiatan ini (1 Spreadsheet bisa untuk banyak sheet).
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewFormModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: presetInfo.colors.primary }}
                  className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
                >
                  Tambah Formulir
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Wajib Unduh Excel Cadangan Sebelum Hapus */}
      {deleteBackupModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Hapus {deleteBackupModal.type === 'activity' ? 'Kegiatan' : 'Formulir'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Pemberian ruang penyimpanan database</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">Wajib Mengunduh File Cadangan:</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Sebelum menghapus data untuk mengosongkan database, Anda <b>wajib mengunduh arsip Excel (.xlsx)</b> terlebih dahulu.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Item target:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">{deleteBackupModal.item?.title}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Langkah 1: Unduh Arsip Excel
              </label>
              <button
                type="button"
                onClick={() => handleDownloadExcelBackup(deleteBackupModal.item, deleteBackupModal.type)}
                disabled={deleteBackupModal.downloading}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  deleteBackupModal.hasDownloaded 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                    : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white'
                }`}
              >
                {deleteBackupModal.downloading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : deleteBackupModal.hasDownloaded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{deleteBackupModal.hasDownloaded ? 'File Excel Telah Berhasil Diunduh' : 'Unduh Cadangan Excel (.xlsx)'}</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Langkah 2: Hapus dari Database
              </label>
              <button
                type="button"
                disabled={!deleteBackupModal.hasDownloaded || deleteBackupModal.isDeleting}
                onClick={handleExecuteDelete}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                  deleteBackupModal.hasDownloaded 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                {deleteBackupModal.isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{deleteBackupModal.hasDownloaded ? 'Hapus Permanen Dari Database' : 'Unduh Excel Dahulu untuk Mengaktifkan'}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDeleteBackupModal(null)}
                className="px-4 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
              >
                Batal
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Panduan & SOP Pembuatan E-Form (Business Process Guide) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Panduan &amp; SOP Pembuatan E-Form Terintegrasi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Alur standar pembuatan form survei lapangan terhubung Google Sheets
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              {/* Step 1 */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Persiapkan Dokumen Google Spreadsheet</h4>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] pl-7 leading-relaxed">
                  Buat Google Spreadsheet baru. Pastikan baris pertama (Row 1) berisi nama kolom header yang jelas (contoh: <i>Nama PPL, Kecamatan, Desa, SLS, Nama KRT, Foto Lapangan, Titik GPS</i>). Atur hak akses sharing menjadi <b>"Anyone with the link can view/edit"</b>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Buat E-Form &amp; Sinkronkan Data Awal</h4>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] pl-7 leading-relaxed">
                  Klik <b>+ Create</b> atau pilih template. Masukkan URL Google Sheet dan nama Sheet (misal: <i>Sheet1</i>), lalu klik <b>Sinkronkan dari Sheet</b> untuk menarik seluruh kolom dan sampel awal secara instan.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Konfigurasi Tipe Data &amp; Hak Edit Petugas</h4>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] pl-7 leading-relaxed">
                  Di tabel skema (tengah), tentukan tipe data kolom: <b>Text</b>, <b>Number</b>, <b>Date</b>, <b>Enum (Dropdown)</b>, <b>LatLong (GPS)</b>, atau <b>Image (Foto)</b>. Centang <b>EDIT?</b> jika kolom tersebut boleh diisi/diubah petugas di lapangan, atau kosongkan jika kolom hanya berupa data prelist (Terkunci/Read-only).
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Struktur Grouping Berjenjang (Level 1 s.d. 4)</h4>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] pl-7 leading-relaxed">
                  Pilih hirarki grouping di panel kiri (misal: <i>Level 1: Nama PPL &rarr; Level 2: Kecamatan &rarr; Level 3: Desa &rarr; Level 4: SLS</i>). Di level terdalam, petugas akan melihat daftar assignment target dan tombol <b>+ Tambah Assignment</b>.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">5</span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Kustomisasi UI, Keamanan &amp; Publikasi Live</h4>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] pl-7 leading-relaxed">
                  Atur warna tema form di tab <b>UI</b>, kebijakan proteksi di tab <b>Security</b>, lalu pastikan saklar berstatus <b>🟢 Live / Terbuka</b>. Bagikan tautan aplikasi kepada seluruh petugas pencacah di lapangan.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowGuideModal(false);
                  setHomeSidebarFilter('templates');
                  setActiveMainTab('apps');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                📋 Lihat Template
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGuideModal(false);
                    setIsNewActivityModalOpen(true);
                  }}
                  style={{ backgroundColor: presetInfo.colors.primary }}
                  className="px-5 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Buat E-Form Baru Sekarang</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
