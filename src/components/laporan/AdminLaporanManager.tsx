import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Plus, Trash2, Save, Download, RefreshCw, Eye, 
  Layers, Power, Settings,
  FileSpreadsheet, ChevronRight, ChevronDown, CheckCircle2,
  AlertCircle, Copy, Info, BarChart3, Check, Type, Hash,
  MapPin, UploadCloud, Calendar, Clock, Sparkles,
  Pencil, BookOpen, HelpCircle, ArrowLeft,
  FileText, ClipboardList, CheckSquare, Building2, Home, Users,
  Wheat, Truck, Folder, HeartPulse, GraduationCap, DollarSign,
  Search, MoreVertical, ShieldAlert, Sliders, Play, Smartphone,
  ExternalLink, X, Shield, Bell, Palette, Globe, Lock, SlidersHorizontal,
  FileCheck2, Database, Wifi, KeyRound, AlertTriangle, Send
} from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { getIconComponent, AVAILABLE_ICONS, DATA_TYPES } from './laporanConstants';
import { PetugasLaporanModule } from './PetugasLaporanModule';

// Custom Smooth Dropdown Component
const CustomDropdown: React.FC<{
  value: string;
  options: Array<{ value: string; label: string; icon?: any; desc?: string }>;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, options, onChange, placeholder = 'Pilih...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const selectedOpt = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 flex items-center justify-between transition-all cursor-pointer shadow-2xs font-medium"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOpt?.icon && <selectedOpt.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
          <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-1 max-h-56 overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => {
              const isSel = opt.value === value;
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
                      ? 'bg-primary-50 text-primary-900 font-bold border border-primary-200' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {OptIcon && <OptIcon className={`w-3.5 h-3.5 ${isSel ? 'text-primary-600' : 'text-slate-400'}`} />}
                    <div className="truncate">
                      <span className="block truncate">{opt.label}</span>
                      {opt.desc && <span className="text-[10px] text-slate-400 font-normal block truncate">{opt.desc}</span>}
                    </div>
                  </div>
                  {isSel && <Check className="w-3.5 h-3.5 text-primary-600 shrink-0 ml-2" />}
                </div>
              );
            })}
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

  // Studio Subtab: 'data' | 'ux' | 'automation' | 'security' | 'settings'
  const [studioTab, setStudioTab] = useState<'data' | 'ux' | 'automation' | 'security' | 'settings'>('data');

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

  // UX, Automation & Security Settings State
  const [uxSettings, setUxSettings] = useState({
    themeColor: '#0ea5e9',
    viewLayout: 'card_list',
    showBadges: true,
    compactMode: false
  });

  const [autoSettings, setAutoSettings] = useState({
    syncFrequency: 'realtime',
    webhookUrl: '',
    notifyWhatsapp: false,
    enableGeofence: true,
    maxRadiusMeters: 250
  });

  const [securitySettings, setSecuritySettings] = useState({
    lockOnSubmit: true,
    allowPetugasDelete: false,
    requireGPS: true,
    requirePhoto: false
  });

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

  // 1. Fetch Activities
  const fetchActivities = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const actList = Array.isArray(data) ? data : [];
        setActivities(actList);
        localStorage.setItem('garda_laporan_activities', JSON.stringify(actList));
        return;
      }
    } catch (err) {
      const cached = localStorage.getItem('garda_laporan_activities');
      if (cached) {
        try { setActivities(JSON.parse(cached)); } catch(e){}
      }
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // 2. Fetch Forms for selected activity
  const fetchForms = async (actId: string) => {
    if (!actId) return;
    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities/${actId}/forms?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const formArray = Array.isArray(data) ? data : [];
        setForms(formArray);
        localStorage.setItem(`garda_laporan_forms_${actId}`, JSON.stringify(formArray));
        if (formArray.length > 0) {
          setSelectedFormId(formArray[0].id);
        } else {
          createDefaultFormForActivity(actId);
        }
        return;
      }
    } catch (err) {
      const cached = localStorage.getItem(`garda_laporan_forms_${actId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setForms(parsed);
          if (parsed.length > 0) setSelectedFormId(parsed[0].id);
        } catch(e){}
      }
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
      if (selectedActivity.settings) {
        setUxSettings(prev => ({ ...prev, ...(selectedActivity.settings.ux || {}) }));
        setAutoSettings(prev => ({ ...prev, ...(selectedActivity.settings.auto || {}) }));
        setSecuritySettings(prev => ({ ...prev, ...(selectedActivity.settings.security || {}) }));
      }
    }
  }, [selectedActivity?.id]);

  // 3. Populate Form Config & Fields when selected form changes
  useEffect(() => {
    if (selectedForm) {
      const gl = Array.isArray(selectedForm.groupingLevels) ? selectedForm.groupingLevels : [];
      setFormConfig({
        title: selectedForm.title || '',
        sheetUrl: selectedForm.sheetUrl || selectedActivity?.sheetUrl || '',
        sheetName: selectedForm.sheetName || 'Sheet1',
        groupingLevels: [
          gl[0] || 'Nama PPL',
          gl[1] || 'Kecamatan',
          gl[2] || 'Desa',
          gl[3] || 'SLS / RT'
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
  }, [selectedFormId, selectedForm]);

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

  // Sync Columns from Google Sheet
  const handleSyncFromGoogleSheet = async () => {
    if (!formConfig.sheetUrl) {
      alert('Masukkan Tautan Google Sheet terlebih dahulu.');
      return;
    }

    try {
      setIsSyncingSheet(true);
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
        if (data.fields && Array.isArray(data.fields) && data.fields.length > 0) {
          setFields(data.fields);
          setSyncAlert({ type: 'success', message: `Berhasil sinkronisasi ${data.fields.length} kolom dari Google Sheet!` });
        } else {
          setSyncAlert({ type: 'success', message: 'Struktur kolom berhasil disinkronkan!' });
        }
      } else {
        setSyncAlert({ type: 'success', message: 'Tautan Google Sheet terhubung.' });
      }
    } catch (err) {
      setSyncAlert({ type: 'error', message: 'Gagal terhubung ke Google Sheet. Periksa izin sharing dokumen.' });
    } finally {
      setIsSyncingSheet(false);
      setTimeout(() => setSyncAlert(null), 3500);
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
    setFields([...fields, newField]);
  };

  // Remove Column Row
  const handleRemoveColumnRow = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Update Column Row
  const handleUpdateColumnRow = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    
    if (key === 'label' && !updated[index].columnName) {
      updated[index].columnName = value;
    }
    setFields(updated);
  };

  // Save All Settings (Schema, UX, Auto, Security)
  const handleSaveAllSettings = async () => {
    if (!selectedActivity) return;

    try {
      setIsSavingSchema(true);
      const cleanGroupings = (formConfig.groupingLevels || []).filter(g => g && String(g).trim() !== '');

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
            fields: fields
          })
        });
      }

      // 2. Update Activity Settings (UX, Auto, Security) in Backend
      const updatedActivityObj = {
        ...selectedActivity,
        title: selectedActivity.title,
        settings: {
          themeColor: uxSettings.themeColor,
          viewLayout: uxSettings.viewLayout,
          showBadges: uxSettings.showBadges,
          compactMode: uxSettings.compactMode,
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
        const updatedForms = forms.map(f => {
          if (f.id === selectedFormId) {
            return {
              ...f,
              title: formConfig.title || f.title,
              sheetUrl: formConfig.sheetUrl,
              sheetName: formConfig.sheetName,
              groupingLevels: cleanGroupings,
              fields: fields
            };
          }
          return f;
        });
        setForms(updatedForms);
        localStorage.setItem(`garda_laporan_forms_${selectedActivity.id}`, JSON.stringify(updatedForms));
      }

      setSimulatorKey(Date.now());
      setSyncAlert({ type: 'success', message: 'Seluruh konfigurasi skema, UX, otomatisasi, dan keamanan berhasil disimpan!' });
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
      <div className="flex flex-col h-[calc(100vh-4.5rem)] w-full bg-slate-50 overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search apps and databases..."
                value={homeSearchQuery}
                onChange={(e) => setHomeSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary-300 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {homeSearchQuery && (
                <button onClick={() => setHomeSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Subheader Switcher [ Apps | Databases ] */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveMainTab('apps')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'apps' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Apps
            </button>
            <button 
              onClick={() => setActiveMainTab('databases')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'databases' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
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
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar (Only 'Owned by me' and 'Templates') */}
          <div className="w-60 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 space-y-4">
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
                    homeSidebarFilter === 'owned' && activeMainTab === 'apps' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>Owned by me</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.2 rounded-full">
                    {activities.length}
                  </span>
                </button>

                <button
                  onClick={() => setHomeSidebarFilter('templates')}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    homeSidebarFilter === 'templates' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Templates</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Garda Data Studio</span>
              <p className="leading-tight">Platform integrasi e-form survei terhubung Google Sheets.</p>
            </div>
          </div>

          {/* Right Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            
            {/* TAB 1: DATABASES REGISTRY */}
            {activeMainTab === 'databases' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Daftar Database &amp; Tautan Google Sheets ({activities.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kelola status keaktifan aplikasi dan koneksi spreadsheet Google Sheets yang terhubung.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Nama Kegiatan / Aplikasi</th>
                          <th className="py-3 px-4">Tautan Google Sheets</th>
                          <th className="py-3 px-3">Worksheet</th>
                          <th className="py-3 px-3 text-center">Status Aplikasi</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
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
                              <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
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
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                                    {act.sheetName || 'Sheet1'}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleActivityOpen(act)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                      act.isOpen 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' 
                                        : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                                    }`}
                                  >
                                    {act.isOpen ? '🟢 Aktif (Dibuka)' : '🔴 Nonaktif (Ditutup)'}
                                  </button>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenStudio(act)}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
                    <h3 className="text-sm font-bold text-slate-900">
                      Katalog Template E-Form Siap Pakai
                    </h3>
                    <p className="text-xs text-slate-500">
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
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                            <TplIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-primary-600 tracking-wider block">
                              {tpl.category}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {tpl.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {tpl.desc}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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
                  <h3 className="text-sm font-bold text-slate-900">
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
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between p-5 group min-h-[175px] relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${act.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Kegiatan (Wajib Unduh Cadangan Excel)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="my-3 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:scale-105 group-hover:border-primary-200 transition-all shadow-2xs">
                            <ActIcon className="w-8 h-8 text-slate-700 group-hover:text-primary-600 transition-colors" />
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
                              {act.title}
                            </h4>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {act.category || 'Survei Lapangan'}
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                            Shared
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* + Create New App Card */}
                  <div
                    onClick={() => setIsNewActivityModalOpen(true)}
                    className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary-400 bg-white/60 hover:bg-white p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[175px] group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-primary-50 text-slate-400 group-hover:text-primary-600 flex items-center justify-center mb-2 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-700 group-hover:text-primary-700">
                      Buat Aplikasi Baru
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
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
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Buat Aplikasi Baru</h3>
                    <p className="text-[11px] text-slate-500">Integrasikan dengan Google Sheets</p>
                  </div>
                </div>
                <button onClick={() => setIsNewActivityModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateActivity} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Aplikasi / Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newActivityForm.title}
                    onChange={(e) => setNewActivityForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Contoh: SNLIK 2026 atau Susenas"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Statistik
                  </label>
                  <CustomDropdown
                    value={newActivityForm.category}
                    options={CATEGORY_OPTIONS}
                    onChange={(val) => setNewActivityForm(prev => ({ ...prev, category: val }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tautan Google Sheet (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newActivityForm.sheetUrl}
                    onChange={(e) => setNewActivityForm(prev => ({ ...prev, sheetUrl: e.target.value }))}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewActivityModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
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
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Hapus {deleteBackupModal.type === 'activity' ? 'Kegiatan' : 'Formulir'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Pemberian ruang penyimpanan database</p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">Wajib Mengunduh File Cadangan:</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Sebelum menghapus data untuk mengosongkan database, Anda <b>wajib mengunduh arsip Excel (.xlsx)</b> terlebih dahulu.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Item target:</span>
                <span className="font-bold text-slate-900 block">{deleteBackupModal.item?.title}</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Langkah 1: Unduh Arsip Excel
                </label>
                <button
                  type="button"
                  onClick={() => handleDownloadExcelBackup(deleteBackupModal.item, deleteBackupModal.type)}
                  disabled={deleteBackupModal.downloading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                    deleteBackupModal.hasDownloaded 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  {deleteBackupModal.downloading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : deleteBackupModal.hasDownloaded ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{deleteBackupModal.hasDownloaded ? 'File Excel Telah Berhasil Diunduh' : 'Unduh Cadangan Excel (.xlsx)'}</span>
                </button>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Langkah 2: Hapus dari Database
                </label>
                <button
                  type="button"
                  disabled={!deleteBackupModal.hasDownloaded || deleteBackupModal.isDeleting}
                  onClick={handleExecuteDelete}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                    deleteBackupModal.hasDownloaded 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer' 
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
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
                  className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
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
    <div className="flex flex-col h-[calc(100vh-4.5rem)] w-full bg-slate-100 overflow-hidden font-sans">
      {/* Top App Studio Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setAdminScreen('apps_home')}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Kembali ke Daftar Aplikasi"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Apps</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {selectedActivity?.title || 'Studio Editor'}
            </h2>
            <button
              onClick={() => handleToggleActivityOpen()}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                selectedActivity?.isOpen 
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
              }`}
            >
              {selectedActivity?.isOpen ? '🟢 Live / Terbuka' : '🔴 Ditutup'}
            </button>
          </div>
        </div>

        {/* Center Studio Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStudioTab('data')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'data' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data</span>
          </button>
          <button
            onClick={() => setStudioTab('ux')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'ux' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>UX</span>
          </button>
          <button
            onClick={() => setStudioTab('automation')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'automation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automation</span>
          </button>
          <button
            onClick={() => setStudioTab('security')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'security' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
          <button
            onClick={() => setStudioTab('settings')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Right Studio Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRightSimulator(!showRightSimulator)}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showRightSimulator 
                ? 'bg-primary-50 text-primary-700 border-primary-200' 
                : 'bg-white text-slate-600 border-slate-200'
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
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{syncAlert.message}</span>
            </div>
            <button onClick={() => setSyncAlert(null)} className="text-slate-400 hover:text-slate-700">✕</button>
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
            <div className="w-72 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Tabel / Formulir
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewFormModalOpen(true)}
                    className="p-1 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
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
                            ? 'bg-slate-900 text-white shadow-xs font-bold' 
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FIcon className={`w-4 h-4 ${isSel ? 'text-white' : 'text-slate-500'}`} />
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
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Sumber Data Google Sheet
                  </span>
                  <div>
                    <input
                      type="text"
                      placeholder="URL Google Sheet..."
                      value={formConfig.sheetUrl}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, sheetUrl: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 outline-none focus:ring-1 focus:ring-primary-300"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Nama Tab (e.g. Sheet1)"
                      value={formConfig.sheetName}
                      onChange={(e) => setFormConfig(prev => ({ ...prev, sheetName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 outline-none focus:ring-1 focus:ring-primary-300"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncFromGoogleSheet}
                    disabled={isSyncingSheet}
                    className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin text-primary-600' : ''}`} />
                    <span>Sinkronkan dari Sheet</span>
                  </button>
                </div>

                {/* Grouping Hierarchy Configuration (Level 1 s.d. Level 4) */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Struktur Grouping (Max 4 Level)
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Level 1 - 4</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Level 1 (Grup Utama):</label>
                      <input
                        type="text"
                        placeholder="Contoh: Nama PPL"
                        value={formConfig.groupingLevels?.[0] || ''}
                        onChange={(e) => {
                          const updated = [...(formConfig.groupingLevels || [])];
                          updated[0] = e.target.value;
                          setFormConfig(prev => ({ ...prev, groupingLevels: updated }));
                        }}
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Level 2 (Wilayah / Kategori):</label>
                      <input
                        type="text"
                        placeholder="Contoh: Kecamatan"
                        value={formConfig.groupingLevels?.[1] || ''}
                        onChange={(e) => {
                          const updated = [...(formConfig.groupingLevels || [])];
                          updated[1] = e.target.value;
                          setFormConfig(prev => ({ ...prev, groupingLevels: updated }));
                        }}
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Level 3 (Sub-Wilayah):</label>
                      <input
                        type="text"
                        placeholder="Contoh: Desa / Kelurahan"
                        value={formConfig.groupingLevels?.[2] || ''}
                        onChange={(e) => {
                          const updated = [...(formConfig.groupingLevels || [])];
                          updated[2] = e.target.value;
                          setFormConfig(prev => ({ ...prev, groupingLevels: updated }));
                        }}
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Level 4 (Blok / RT / SLS):</label>
                      <input
                        type="text"
                        placeholder="Contoh: SLS / RT / Blok Sensus"
                        value={formConfig.groupingLevels?.[3] || ''}
                        onChange={(e) => {
                          const updated = [...(formConfig.groupingLevels || [])];
                          updated[3] = e.target.value;
                          setFormConfig(prev => ({ ...prev, groupingLevels: updated }));
                        }}
                        className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER PANEL: SCHEMA COLUMNS & DATA TYPES EDITOR */}
            <div className="flex-1 bg-white p-5 overflow-y-auto custom-scrollbar flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedForm?.title || 'Formulir'} - Definisi Kolom &amp; Tipe Data
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {fields.length} Kolom
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddColumnRow}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Column</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3 min-w-[170px]">NAME</th>
                          <th className="py-2.5 px-3 min-w-[140px]">TYPE</th>
                          <th className="py-2.5 px-2 text-center w-14">KEY?</th>
                          <th className="py-2.5 px-2 text-center w-14">LABEL?</th>
                          <th className="py-2.5 px-2 text-center w-14">REQ?</th>
                          <th className="py-2.5 px-3 min-w-[200px]">OPTIONS / FORMULA</th>
                          <th className="py-2.5 px-2 text-center w-10"></th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {fields.map((field, idx) => (
                          <tr key={field.id || idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={field.label || field.columnName || ''}
                                onChange={(e) => handleUpdateColumnRow(idx, 'label', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-primary-300"
                              />
                            </td>

                            <td className="py-2 px-3">
                              <select
                                value={field.dataType || 'Text'}
                                onChange={(e) => handleUpdateColumnRow(idx, 'dataType', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:bg-white"
                              >
                                {DATA_TYPES.map((dt) => (
                                  <option key={dt.id} value={dt.id}>
                                    {dt.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!field.isKey}
                                onChange={(e) => handleUpdateColumnRow(idx, 'isKey', e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-400 cursor-pointer"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!field.isLabel}
                                onChange={(e) => handleUpdateColumnRow(idx, 'isLabel', e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-400 cursor-pointer"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!field.isRequired}
                                onChange={(e) => handleUpdateColumnRow(idx, 'isRequired', e.target.checked)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-400 cursor-pointer"
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
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-1 focus:ring-primary-300 placeholder-slate-400"
                                />
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  {field.dataType === 'LatLong' ? 'Geotagging GPS' : field.dataType === 'Image' ? 'Upload Kamera' : '-'}
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveColumnRow(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
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
            TAB CONTENT: UX (ANTARMUKA & TEMA PETUGAS)
            ===================================================================== */}
        {studioTab === 'ux' && (
          <div className="flex-1 bg-white p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Konfigurasi UX &amp; Antarmuka Aplikasi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur tampilan visual, tema warna, dan gaya kartu isian yang akan dilihat petugas di lapangan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">Tema Warna Utama (Brand Color)</label>
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
                      onClick={() => setUxSettings(prev => ({ ...prev, themeColor: t.color }))}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform cursor-pointer ${
                        uxSettings.themeColor === t.color ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: t.color }}
                      title={t.name}
                    >
                      {uxSettings.themeColor === t.color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">Tampilan Daftar Sampel</label>
                <div className="space-y-2">
                  {[
                    { id: 'card_list', label: 'Kartu Sampel dengan Foto (Gambar 4)', desc: 'Menampilkan thumbnail foto dan tombol aksi cepat GPS/Edit' },
                    { id: 'compact_list', label: 'Daftar Ramping (Compact Rows)', desc: 'Menampilkan lebih banyak data per layar tanpa thumbnail foto' }
                  ].map((lay) => (
                    <div
                      key={lay.id}
                      onClick={() => setUxSettings(prev => ({ ...prev, viewLayout: lay.id }))}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        uxSettings.viewLayout === lay.id ? 'bg-white border-primary-400 shadow-2xs font-bold' : 'bg-slate-100/60 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div>
                        <span className="text-xs block text-slate-800">{lay.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal block">{lay.desc}</span>
                      </div>
                      {uxSettings.viewLayout === lay.id && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAllSettings}
                style={{ backgroundColor: presetInfo.colors.primary }}
                className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
              >
                Simpan Pengaturan UX
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB CONTENT: AUTOMATION (OTOMATISASI & NOTIFIKASI)
            ===================================================================== */}
        {studioTab === 'automation' && (
          <div className="flex-1 bg-white p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Otomatisasi &amp; Notifikasi Data Lapangan</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi jadwal sinkronisasi otomatis ke Google Sheets, webhook API, dan validasi radius GPS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">Jadwal Sinkronisasi Google Sheets</label>
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
                        autoSettings.syncFrequency === freq.id ? 'bg-white border-primary-400 shadow-2xs font-bold' : 'bg-slate-100/60 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div>
                        <span className="text-xs block text-slate-800">{freq.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal block">{freq.desc}</span>
                      </div>
                      {autoSettings.syncFrequency === freq.id && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Validasi Radius Lokasi GPS Lapangan</label>
                  <input
                    type="checkbox"
                    checked={autoSettings.enableGeofence}
                    onChange={(e) => setAutoSettings(prev => ({ ...prev, enableGeofence: e.target.checked }))}
                    className="rounded text-primary-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Peringatkan petugas jika titik koordinat pengisian berada di luar batas toleransi wilayah target.
                </p>
                {autoSettings.enableGeofence && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Toleransi Radius Maksimal:</label>
                    <input
                      type="number"
                      value={autoSettings.maxRadiusMeters}
                      onChange={(e) => setAutoSettings(prev => ({ ...prev, maxRadiusMeters: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                      placeholder="250 (Meter)"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
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
          <div className="flex-1 bg-white p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Hak Akses &amp; Proteksi Data Petugas</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi integritas data, kunci edit setelah pengiriman, dan kewajiban verifikasi GPS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Kunci Edit Data Setelah Submit</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
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

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Wajib Geotagging GPS untuk Submit</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
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

            <div className="pt-4 border-t border-slate-100 flex justify-end">
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
          <div className="flex-1 bg-white p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Pengaturan Umum Kegiatan</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola informasi nama survei, kategori, saklar status buka/tutup aplikasi, dan arsip data.
              </p>
            </div>

            <div className="max-w-2xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Aplikasi / Kegiatan Survei</label>
                <input
                  type="text"
                  value={selectedActivity?.title || ''}
                  onChange={(e) => {
                    const updated = { ...selectedActivity, title: e.target.value };
                    setSelectedActivity(updated);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Keaktifan Petugas</label>
                <button
                  type="button"
                  onClick={() => handleToggleActivityOpen()}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedActivity?.isOpen 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                      : 'bg-rose-50 text-rose-700 border border-rose-300'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{selectedActivity?.isOpen ? 'Aplikasi Dibuka untuk Seluruh Petugas' : 'Aplikasi Ditutup Sementara (Maintenance)'}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
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
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Kegiatan &amp; Unduh Cadangan Excel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            RIGHT PANEL: BEZEL-LESS LIVE INTERACTIVE MOBILE SIMULATOR
            ===================================================================== */}
        {showRightSimulator && (
          <div className="w-[360px] bg-slate-900/95 border-l border-slate-800 p-3.5 flex flex-col items-center justify-center shrink-0 overflow-hidden relative shadow-2xl">
            <div className="absolute top-2 left-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Frameless Live Simulator</span>
            </div>

            {/* Ultra-Modern Flagship Smartphone Container */}
            <div className="w-[340px] h-[610px] bg-slate-950 rounded-[42px] p-2 shadow-2xl ring-1 ring-white/10 relative flex flex-col overflow-hidden border border-slate-800">
              {/* Sleek Flagship Top Status Bar */}
              <div className="h-5 px-5 flex items-center justify-between text-[10px] font-bold text-white/80 shrink-0 z-30 select-none bg-slate-950">
                <span>09:41</span>
                <div className="w-14 h-2.5 bg-slate-900 rounded-full flex items-center justify-center gap-1 shadow-inner">
                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                </div>
                <div className="flex items-center gap-1.5 text-[9px]">
                  <span>5G</span>
                  <div className="w-3.5 h-2 rounded-xs border border-white/60 p-0.5 flex items-center">
                    <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-white rounded-[30px] overflow-hidden relative shadow-inner flex flex-col">
                {selectedActivity && (
                  <PetugasLaporanModule
                    key={simulatorKey}
                    user={user}
                    initialActivityId={selectedActivity.id}
                    isSimulator={true}
                  />
                )}
              </div>

              {/* Bottom Home Indicator */}
              <div className="w-24 h-1 bg-slate-700/80 rounded-full mx-auto mt-1.5 mb-0.5 shrink-0" />
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
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus {deleteBackupModal.type === 'activity' ? 'Kegiatan' : 'Formulir'}
                </h3>
                <p className="text-[11px] text-slate-500">Pemberian ruang penyimpanan database</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Wajib Mengunduh File Cadangan:</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Sebelum menghapus data untuk mengosongkan database, Anda <b>wajib mengunduh arsip Excel (.xlsx)</b> terlebih dahulu.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Item target:</span>
              <span className="font-bold text-slate-900 block">{deleteBackupModal.item?.title}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Langkah 1: Unduh Arsip Excel
              </label>
              <button
                type="button"
                onClick={() => handleDownloadExcelBackup(deleteBackupModal.item, deleteBackupModal.type)}
                disabled={deleteBackupModal.downloading}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  deleteBackupModal.hasDownloaded 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                {deleteBackupModal.downloading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : deleteBackupModal.hasDownloaded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{deleteBackupModal.hasDownloaded ? 'File Excel Telah Berhasil Diunduh' : 'Unduh Cadangan Excel (.xlsx)'}</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Langkah 2: Hapus dari Database
              </label>
              <button
                type="button"
                disabled={!deleteBackupModal.hasDownloaded || deleteBackupModal.isDeleting}
                onClick={handleExecuteDelete}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                  deleteBackupModal.hasDownloaded 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
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
                className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Batal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
