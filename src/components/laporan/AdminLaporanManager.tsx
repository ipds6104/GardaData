import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Save, Download, RefreshCw, Eye, 
  Layers, Power, Settings,
  FileSpreadsheet, ChevronRight, ChevronDown, CheckCircle2,
  AlertCircle, Copy, Info, BarChart3, Check, Type, Hash,
  MapPin, UploadCloud, Calendar, Clock, Sparkles,
  Pencil, BookOpen, HelpCircle,
  FileText, ClipboardList, CheckSquare, Building2, Home, Users,
  Wheat, Truck, Folder, HeartPulse, GraduationCap, DollarSign
} from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { PetugasLaporanModule } from './PetugasLaporanModule';

export const DATA_TYPES = [
  {
    id: 'teks',
    label: 'Teks',
    desc: 'Jawaban bebas, uraian kalimat, atau keterangan singkat',
    icon: Type,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'angka',
    label: 'Angka',
    desc: 'Nilai bilangan bulat, desimal, kuantitas, atau rupiah',
    icon: Hash,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'lokasi',
    label: 'Lokasi (GPS)',
    desc: 'Geotagging koordinat Latitude & Longitude otomatis',
    icon: MapPin,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  {
    id: 'file',
    label: 'File / Foto Dokumen',
    desc: 'Upload foto kamera lapangan atau berkas (PDF, DOC, XLS)',
    icon: UploadCloud,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    id: 'tanggal',
    label: 'Tanggal (Date Picker)',
    desc: 'Pilihan kalender tanggal pelaksanaan atau observasi',
    icon: Calendar,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'jam',
    label: 'Jam (Time Picker)',
    desc: 'Pilihan waktu pelaksanaan (format 24 jam)',
    icon: Clock,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
];

export const AVAILABLE_ICONS = [
  { id: 'Layers', label: 'Layers / Kegiatan', icon: Layers },
  { id: 'FileText', label: 'Formulir / Berkas', icon: FileText },
  { id: 'ClipboardList', label: 'Pencacahan', icon: ClipboardList },
  { id: 'CheckSquare', label: 'Pemeriksaan', icon: CheckSquare },
  { id: 'Building2', label: 'Bangunan', icon: Building2 },
  { id: 'Home', label: 'Rumah Tangga', icon: Home },
  { id: 'Users', label: 'Penduduk / Mitra', icon: Users },
  { id: 'MapPin', label: 'Lokasi / Geospasial', icon: MapPin },
  { id: 'BarChart3', label: 'Statistik / Ekonomi', icon: BarChart3 },
  { id: 'Wheat', label: 'Pertanian / Pangan', icon: Wheat },
  { id: 'Truck', label: 'Distribusi / Logistik', icon: Truck },
  { id: 'Folder', label: 'Berkas / Arsip', icon: Folder },
  { id: 'Calendar', label: 'Jadwal / Periode', icon: Calendar },
  { id: 'HeartPulse', label: 'Kesehatan / Sosial', icon: HeartPulse },
  { id: 'GraduationCap', label: 'Pendidikan', icon: GraduationCap },
  { id: 'DollarSign', label: 'Harga / Keuangan', icon: DollarSign },
  { id: 'Sparkles', label: 'Khusus / Tematik', icon: Sparkles },
];

export const getIconComponent = (name?: string, fallback = Layers) => {
  if (!name) return fallback;
  const match = AVAILABLE_ICONS.find(i => i.id.toLowerCase() === name.toLowerCase());
  return match ? match.icon : fallback;
};

// Reusable Icon Picker Grid
export const IconPicker: React.FC<{
  selectedIcon: string;
  onSelect: (iconId: string) => void;
  label?: string;
}> = ({ selectedIcon, onSelect, label = "Pilih Ikon Visual:" }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-700 block text-xs">{label}</label>
        <span className="text-[10px] text-slate-400">
          Ikon aktif: <b>{selectedIcon || 'Layers'}</b>
        </span>
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto custom-scrollbar">
        {AVAILABLE_ICONS.map((item) => {
          const IconComp = item.icon;
          const isSel = (selectedIcon || '').toLowerCase() === item.id.toLowerCase();
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              title={item.label}
              className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isSel
                  ? 'bg-slate-900 text-white shadow-xs ring-2 ring-primary-400 scale-105'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 hover:text-slate-900'
              }`}
            >
              <IconComp className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface AdminLaporanManagerProps {
  onBack?: () => void;
  user?: any;
}

export const AdminLaporanManager: React.FC<AdminLaporanManagerProps> = ({ user }) => {
  const { presetInfo } = useTheme();

  // Navigation Tab in Admin
  const [adminTab, setAdminTab] = useState<'forms' | 'monitoring' | 'preview'>('forms');

  // Activities
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState<boolean>(false);
  const [newActivityForm, setNewActivityForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isOpen: true,
    icon: 'Layers'
  });

  // Forms of Selected Activity
  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState<boolean>(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormIcon, setNewFormIcon] = useState('FileText');

  // Selected Form Details & Fields
  const selectedForm = forms.find(f => f.id === selectedFormId) || null;
  const [formConfig, setFormConfig] = useState({
    title: '',
    sheetUrl: '',
    sheetName: '',
    webhookUrl: '',
    groupingLevels: ['', '', '', '']
  });

  const [fields, setFields] = useState<any[]>([]);
  const [isAddingField, setIsAddingField] = useState<boolean>(false);
  const [newField, setNewField] = useState({
    label: '',
    columnName: '',
    dataType: 'teks',
    isRequired: false,
    groupSection: ''
  });

  // Monitoring Stats
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [monitoringSearch, setMonitoringSearch] = useState('');

  // States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncAlert, setSyncAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWebhookGuide, setShowWebhookGuide] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isDataTypeDropdownOpen, setIsDataTypeDropdownOpen] = useState<boolean>(false);

  // Guide and Edit Modal States
  const [showWorkflowGuide, setShowWorkflowGuide] = useState<boolean>(true);
  const [isActivityDropdownOpen, setIsActivityDropdownOpen] = useState<boolean>(false);
  const [isEditActivityModalOpen, setIsEditActivityModalOpen] = useState<boolean>(false);
  const [editActivityForm, setEditActivityForm] = useState({
    id: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isOpen: true,
    icon: 'Layers'
  });
  const [isEditFormModalOpen, setIsEditFormModalOpen] = useState<boolean>(false);
  const [editingFormObj, setEditingFormObj] = useState<{ id: string; title: string; icon: string } | null>(null);

  const baseUrl = (import.meta as any).env.VITE_API_URL || '';

  // 1. Fetch Activities
  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${baseUrl}/api/laporan/activities?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
        localStorage.setItem('garda_laporan_activities', JSON.stringify(data));
        if (data.length > 0 && !selectedActivityId) {
          setSelectedActivityId(data[0].id);
        }
        return;
      }
      throw new Error('Gagal memuat kegiatan dari server');
    } catch (err) {
      console.warn('Menggunakan cache lokal untuk kegiatan:', err);
      const cached = localStorage.getItem('garda_laporan_activities');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setActivities(parsed);
          if (parsed.length > 0 && !selectedActivityId) {
            setSelectedActivityId(parsed[0].id);
          }
        } catch (e) {
          setActivities([]);
        }
      }
    } finally {
      setIsLoading(false);
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
        setForms(data);
        localStorage.setItem(`garda_laporan_forms_${actId}`, JSON.stringify(data));
        if (data.length > 0) {
          setSelectedFormId(data[0].id);
        } else {
          setSelectedFormId('');
        }
        return;
      }
      throw new Error('Gagal memuat formulir dari server');
    } catch (err) {
      console.warn('Menggunakan cache lokal untuk formulir:', err);
      const cached = localStorage.getItem(`garda_laporan_forms_${actId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setForms(parsed);
          if (parsed.length > 0) {
            setSelectedFormId(parsed[0].id);
          } else {
            setSelectedFormId('');
          }
        } catch (e) {
          setForms([]);
        }
      } else {
        setForms([]);
      }
    }
  };

  useEffect(() => {
    if (selectedActivityId) {
      fetchForms(selectedActivityId);
      fetchMonitoring(selectedActivityId);
    }
  }, [selectedActivityId]);

  // 3. Populate form config and fields when selectedForm changes
  useEffect(() => {
    if (selectedForm) {
      const gl = Array.isArray(selectedForm.groupingLevels) ? selectedForm.groupingLevels : [];
      setFormConfig({
        title: selectedForm.title || '',
        sheetUrl: selectedForm.sheetUrl || '',
        sheetName: selectedForm.sheetName || '',
        webhookUrl: selectedForm.webhookUrl || '',
        groupingLevels: [gl[0] || '', gl[1] || '', gl[2] || '', gl[3] || '']
      });
      setFields(selectedForm.fields || []);
    }
  }, [selectedFormId, forms]);

  // 4. Fetch Monitoring Data
  const fetchMonitoring = async (actId: string) => {
    if (!actId) return;
    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities/${actId}/monitoring?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setMonitoringData(data);
      }
    } catch (err) {
      console.warn('Gagal memuat data monitoring dari server:', err);
    }
  };

  // Toggle Activity Status (Open/Close for Petugas)
  const handleToggleActivityOpen = async (act: any) => {
    try {
      await fetch(`${baseUrl}/api/laporan/activities/${act.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !act.isOpen })
      });
    } catch (err) {
      console.warn('Gagal update status kegiatan di server:', err);
    }
    
    // Perbarui state lokal & cache
    const updated = activities.map(a => a.id === act.id ? { ...a, isOpen: !a.isOpen } : a);
    setActivities(updated);
    localStorage.setItem('garda_laporan_activities', JSON.stringify(updated));
  };

  // Create New Activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityForm.title.trim()) return;

    const newId = `act_${Date.now()}`;
    const newAct = {
      id: newId,
      title: newActivityForm.title.trim(),
      description: newActivityForm.description || '',
      startDate: newActivityForm.startDate || null,
      endDate: newActivityForm.endDate || null,
      isOpen: newActivityForm.isOpen !== false,
      icon: newActivityForm.icon || 'Layers',
      forms: [],
      stats: { totalRecords: 0, totalDraft: 0, totalSubmitted: 0 }
    };

    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivityForm)
      });
      if (res.ok) {
        const data = await res.json();
        newAct.id = data.id || newId;
      }
    } catch (err) {
      console.warn('Server belum terhubung, menyimpan kegiatan secara lokal:', err);
    }

    const updated = [newAct, ...activities.filter(a => a.id !== newAct.id)];
    setActivities(updated);
    localStorage.setItem('garda_laporan_activities', JSON.stringify(updated));
    setSelectedActivityId(newAct.id);
    setIsNewActivityModalOpen(false);
    setNewActivityForm({ title: '', description: '', startDate: '', endDate: '', isOpen: true, icon: 'Layers' });
    setSyncAlert({ type: 'success', message: `Kegiatan "${newAct.title}" berhasil dibuat!` });
    setTimeout(() => setSyncAlert(null), 3500);
  };

  // Create New Form in Activity
  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) return;

    // Jika belum ada kegiatan yang dipilih
    if (!selectedActivityId) {
      setIsNewFormModalOpen(false);
      setNewActivityForm(prev => ({ ...prev, title: newFormTitle.trim() }));
      setIsNewActivityModalOpen(true);
      setSyncAlert({
        type: 'error',
        message: 'Belum ada Kegiatan yang aktif. Formulir dialihkan untuk membuat Kegiatan baru terlebih dahulu.'
      });
      setTimeout(() => setSyncAlert(null), 4000);
      return;
    }

    const newId = `form_${Date.now()}`;
    const newFormObj = {
      id: newId,
      activityId: selectedActivityId,
      title: newFormTitle.trim(),
      icon: newFormIcon || 'FileText',
      orderIndex: forms.length,
      sheetUrl: '',
      sheetName: '',
      webhookUrl: '',
      groupingLevels: [],
      fields: [],
      stats: { totalRecords: 0, totalDraft: 0, totalSubmitted: 0 }
    };

    try {
      const res = await fetch(`${baseUrl}/api/laporan/activities/${selectedActivityId}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newFormTitle.trim(),
          icon: newFormIcon || 'FileText',
          orderIndex: forms.length
        })
      });
      if (res.ok) {
        const data = await res.json();
        newFormObj.id = data.id || newId;
      }
    } catch (err) {
      console.warn('Server belum terhubung, menyimpan formulir secara lokal:', err);
    }

    const updatedForms = [...forms, newFormObj];
    setForms(updatedForms);
    localStorage.setItem(`garda_laporan_forms_${selectedActivityId}`, JSON.stringify(updatedForms));
    setSelectedFormId(newFormObj.id);
    setIsNewFormModalOpen(false);
    setNewFormTitle('');
    setNewFormIcon('FileText');
    setSyncAlert({ type: 'success', message: `Formulir "${newFormObj.title}" berhasil ditambahkan ke kegiatan!` });
    setTimeout(() => setSyncAlert(null), 3500);
  };

  // Open Edit Activity Modal
  const openEditActivityModal = (act?: any) => {
    const target = act || selectedActivity;
    if (!target) return;
    setEditActivityForm({
      id: target.id,
      title: target.title || '',
      description: target.description || '',
      startDate: target.startDate ? target.startDate.split('T')[0] : '',
      endDate: target.endDate ? target.endDate.split('T')[0] : '',
      isOpen: target.isOpen !== false,
      icon: target.icon || 'Layers'
    });
    setIsEditActivityModalOpen(true);
    setIsActivityDropdownOpen(false);
  };

  // Update Activity in Backend and Local
  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editActivityForm.id || !editActivityForm.title.trim()) return;

    try {
      await fetch(`${baseUrl}/api/laporan/activities/${editActivityForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editActivityForm.title.trim(),
          description: editActivityForm.description,
          startDate: editActivityForm.startDate || null,
          endDate: editActivityForm.endDate || null,
          isOpen: editActivityForm.isOpen,
          icon: editActivityForm.icon || 'Layers'
        })
      });
    } catch (err) {
      console.warn('Gagal memperbarui kegiatan di server, menyimpan lokal:', err);
    }

    const updated = activities.map(a => {
      if (a.id === editActivityForm.id) {
        return {
          ...a,
          title: editActivityForm.title.trim(),
          description: editActivityForm.description,
          startDate: editActivityForm.startDate || null,
          endDate: editActivityForm.endDate || null,
          isOpen: editActivityForm.isOpen,
          icon: editActivityForm.icon || 'Layers'
        };
      }
      return a;
    });
    setActivities(updated);
    localStorage.setItem('garda_laporan_activities', JSON.stringify(updated));
    setIsEditActivityModalOpen(false);
    setSyncAlert({ type: 'success', message: `Data kegiatan "${editActivityForm.title.trim()}" berhasil diperbarui!` });
    setTimeout(() => setSyncAlert(null), 3500);
  };

  // Open Edit Form Modal
  const openEditFormModal = (form?: any) => {
    const target = form || selectedForm;
    if (!target) return;
    setEditingFormObj({ 
      id: target.id, 
      title: target.title || '', 
      icon: target.icon || 'FileText' 
    });
    setIsEditFormModalOpen(true);
  };

  // Update Form Title and Icon
  const handleUpdateFormTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFormObj || !editingFormObj.title.trim()) return;

    try {
      await fetch(`${baseUrl}/api/laporan/forms/${editingFormObj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editingFormObj.title.trim(),
          icon: editingFormObj.icon || 'FileText'
        })
      });
    } catch (err) {
      console.warn('Gagal memperbarui nama formulir di server, menyimpan lokal:', err);
    }

    const updated = forms.map(f => {
      if (f.id === editingFormObj.id) {
        return { 
          ...f, 
          title: editingFormObj.title.trim(),
          icon: editingFormObj.icon || f.icon || 'FileText'
        };
      }
      return f;
    });
    setForms(updated);
    if (selectedActivityId) {
      localStorage.setItem(`garda_laporan_forms_${selectedActivityId}`, JSON.stringify(updated));
    }
    if (editingFormObj.id === selectedFormId) {
      setFormConfig(prev => ({ ...prev, title: editingFormObj.title.trim() }));
    }
    setIsEditFormModalOpen(false);
    setSyncAlert({ type: 'success', message: `Formulir "${editingFormObj.title.trim()}" berhasil diperbarui!` });
    setTimeout(() => setSyncAlert(null), 3500);
  };

  // Save Form Settings (Google Sheet & Grouping)
  const handleSaveFormConfig = async () => {
    if (!selectedFormId) return;
    const cleanGroupings = formConfig.groupingLevels.filter(g => g && g.trim() !== '');
    try {
      await fetch(`${baseUrl}/api/laporan/forms/${selectedFormId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formConfig.title,
          sheetUrl: formConfig.sheetUrl,
          sheetName: formConfig.sheetName,
          webhookUrl: formConfig.webhookUrl,
          groupingLevels: cleanGroupings
        })
      });
    } catch (err) {
      console.warn('Gagal menyimpan ke server, menyimpan di lokal:', err);
    }

    const updated = forms.map(f => {
      if (f.id === selectedFormId) {
        return {
          ...f,
          title: formConfig.title || f.title,
          sheetUrl: formConfig.sheetUrl,
          sheetName: formConfig.sheetName,
          webhookUrl: formConfig.webhookUrl,
          groupingLevels: cleanGroupings
        };
      }
      return f;
    });
    setForms(updated);
    if (selectedActivityId) {
      localStorage.setItem(`garda_laporan_forms_${selectedActivityId}`, JSON.stringify(updated));
    }
    setSyncAlert({ type: 'success', message: 'Pengaturan formulir dan database Google Sheet berhasil disimpan!' });
    setTimeout(() => setSyncAlert(null), 3500);
  };

  // Add Question to Form
  const handleAddField = () => {
    if (!newField.label.trim()) return;

    const col = newField.columnName.trim() || newField.label.trim();
    const item = {
      id: `field_${Date.now()}`,
      label: newField.label.trim(),
      columnName: col,
      dataType: newField.dataType,
      isRequired: newField.isRequired,
      groupSection: newField.groupSection
    };

    setFields([...fields, item]);
    setNewField({
      label: '',
      columnName: '',
      dataType: 'teks',
      isRequired: false,
      groupSection: ''
    });
    setIsAddingField(false);
  };

  // Save Questions (Fields) to Backend
  const handleSaveFields = async () => {
    if (!selectedFormId) return;
    try {
      await fetch(`${baseUrl}/api/laporan/forms/${selectedFormId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
    } catch (err) {
      console.warn('Gagal menyimpan pertanyaan ke server, menyimpan di lokal:', err);
    }

    const updated = forms.map(f => {
      if (f.id === selectedFormId) {
        return { ...f, fields };
      }
      return f;
    });
    setForms(updated);
    if (selectedActivityId) {
      localStorage.setItem(`garda_laporan_forms_${selectedActivityId}`, JSON.stringify(updated));
    }
    setSyncAlert({ type: 'success', message: 'Daftar pertanyaan berhasil disimpan ke database!' });
    setTimeout(() => setSyncAlert(null), 3500);
  };

  // Download Excel Template
  const handleDownloadExcelTemplate = () => {
    if (!selectedFormId) return;
    window.open(`${baseUrl}/api/laporan/forms/${selectedFormId}/template-excel`, '_blank');
  };

  // Sync Sheet Data (Import Predefined Data)
  const handleSyncSheet = async () => {
    if (!selectedFormId) return;
    if (!formConfig.sheetUrl.trim()) {
      alert('Tautan Google Sheet belum diisi.');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncAlert(null);
      const res = await fetch(`${baseUrl}/api/laporan/forms/${selectedFormId}/sync-sheet`, {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok) {
        setSyncAlert({ type: 'success', message: data.message || 'Sinkronisasi berhasil!' });
        fetchForms(selectedActivityId);
        fetchMonitoring(selectedActivityId);
      } else {
        setSyncAlert({ type: 'error', message: data.error || 'Gagal menyinkronkan data Google Sheet.' });
      }
    } catch (err) {
      setSyncAlert({ type: 'error', message: 'Terjadi kesalahan jaringan saat sinkronisasi.' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Ready-to-copy Google Apps Script Webhook Code
  const googleAppsScriptCode = `function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(payload.sheetName || 'Sheet1');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    }
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data = payload.data || {};
    
    // Cari baris berdasarkan ID atau nomor urut
    var rowId = String(payload.rowId || data['ID'] || data['id'] || '');
    var targetRow = -1;
    if (rowId && sheet.getLastRow() > 1) {
      var idValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < idValues.length; i++) {
        if (String(idValues[i][0]).trim() === rowId.trim()) {
          targetRow = i + 2;
          break;
        }
      }
    }
    
    var rowData = [];
    for (var c = 0; c < headers.length; c++) {
      var colName = headers[c];
      var val = data[colName] !== undefined ? data[colName] : '';
      if (colName === 'Status' || colName === 'status') val = payload.status || val;
      if (colName === 'Latitude' && payload.latitude) val = payload.latitude;
      if (colName === 'Longitude' && payload.longitude) val = payload.longitude;
      rowData.push(val);
    }
    
    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  // Available column names for grouping dropdowns
  const availableColumns = fields.map(f => f.columnName || f.label);

  const selectedDataTypeInfo = DATA_TYPES.find(d => d.id === newField.dataType) || DATA_TYPES[0];
  const SelectedIcon = selectedDataTypeInfo.icon;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* ==========================================
          HEADER UTAMA & SELECTOR KEGIATAN
          ========================================== */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {(() => {
            const ActivityHeaderIcon = getIconComponent(selectedActivity?.icon, Layers);
            return (
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                style={{ backgroundColor: presetInfo.colors.primary }}
              >
                <ActivityHeaderIcon className="w-6 h-6" />
              </div>
            );
          })()}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Laporan Pendataan</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary-100 text-primary-800">
                Mode Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Penyusunan form lapangan dinamis AppSheet, Google Sheet Database, dan monitoring progres
            </p>
          </div>
        </div>

        {/* Activity Picker (Custom Dropdown) & Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Custom Activity Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsActivityDropdownOpen(!isActivityDropdownOpen)}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary-200 cursor-pointer flex items-center gap-2.5 transition-all shadow-2xs max-w-xs"
            >
              {(() => {
                const CurrentActIcon = getIconComponent(selectedActivity?.icon, Layers);
                return <CurrentActIcon className="w-4 h-4 text-primary-600 shrink-0" />;
              })()}
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedActivity?.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="truncate max-w-[170px] sm:max-w-[210px]">
                {selectedActivity?.title || 'Pilih Kegiatan'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isActivityDropdownOpen ? 'rotate-180 text-primary-600' : ''}`} />
            </button>

            {isActivityDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsActivityDropdownOpen(false)} 
                />
                <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-1 min-w-[280px] sm:min-w-[320px] max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Pilih Kegiatan</span>
                    <span className="text-[10px] text-slate-400 font-bold">{activities.length} Terdaftar</span>
                  </div>

                  {activities.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">Belum ada kegiatan</div>
                  ) : (
                    activities.map(a => {
                      const isSelected = a.id === selectedActivityId;
                      const ItemActIcon = getIconComponent(a.icon, Layers);
                      return (
                        <div
                          key={a.id}
                          onClick={() => {
                            setSelectedActivityId(a.id);
                            setIsActivityDropdownOpen(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-colors ${
                            isSelected 
                              ? 'bg-primary-50 border border-primary-200 text-slate-900' 
                              : 'hover:bg-slate-50 border border-transparent text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                              <ItemActIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${a.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span className="font-bold text-xs block truncate text-slate-900">{a.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                                {a.isOpen ? '🟢 Dibuka' : '🔴 Ditutup'}
                                {a.startDate && ` • Mulai: ${a.startDate.split('T')[0]}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditActivityModal(a);
                              }}
                              className="p-1 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Edit Data Kegiatan Ini"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActivityDropdownOpen(false);
                        setIsNewActivityModalOpen(true);
                      }}
                      className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-primary-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Buat Kegiatan Baru</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tombol Edit Kegiatan Terpilih */}
          {selectedActivity && (
            <button
              type="button"
              onClick={() => openEditActivityModal(selectedActivity)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
              title="Ubah nama dan informasi kegiatan yang sedang aktif"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Kegiatan</span>
            </button>
          )}

          {/* Tombol Kegiatan Baru */}
          <button
            type="button"
            onClick={() => setIsNewActivityModalOpen(true)}
            style={{ backgroundColor: presetInfo.colors.primary }}
            className="px-3.5 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kegiatan Baru</span>
          </button>

          {/* Toggle Open/Close Petugas */}
          {selectedActivity && (
            <button
              type="button"
              onClick={() => handleToggleActivityOpen(selectedActivity)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedActivity.isOpen 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
              }`}
              title="Buka atau tutup akses form untuk petugas"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{selectedActivity.isOpen ? 'Aplikasi Terbuka' : 'Aplikasi Tertutup'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Alert Banner */}
      <AnimatePresence>
        {syncAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs ${
              syncAlert.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncAlert.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{syncAlert.message}</span>
            </div>
            <button onClick={() => setSyncAlert(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          PANDUAN & PETUNJUK PEMBUATAN APLIKASI (BAGIAN ATAS)
          ========================================== */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/60 rounded-3xl border border-indigo-100 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100/80">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: presetInfo.colors.primary }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Petunjuk Alur Pembuatan Aplikasi &amp; Formulir Pendataan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                  Panduan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ikuti 4 langkah terstruktur ini untuk menyusun instrumen survei lapangan bergaya AppSheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs self-start sm:self-auto"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showWorkflowGuide ? 'Sembunyikan Petunjuk' : 'Buka Petunjuk'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showWorkflowGuide ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showWorkflowGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                {/* Langkah 1 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <h4 className="font-black text-slate-900 text-xs">
                      Tentukan Kegiatan &amp; Form
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Pilih/buat Kegiatan (misal: <i>Susenas 2026</i>), lalu tambahkan Formulir di dalamnya (misal: <i>Pencacahan</i> &amp; <i>Pemeriksaan</i>).
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsNewActivityModalOpen(true)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Kegiatan Baru</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activities.length === 0) {
                          setIsNewActivityModalOpen(true);
                        } else {
                          setIsNewFormModalOpen(true);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Form</span>
                    </button>
                  </div>
                </div>

                {/* Langkah 2 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <h4 className="font-black text-slate-900 text-xs">
                      Susun Pertanyaan &amp; Tipe Data
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Buat pertanyaan &amp; tentukan variabel (teks, angka, GPS, foto, tanggal, jam). Kolom ini menjadi dasar database &amp; template Excel.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminTab('forms');
                        setTimeout(() => {
                          const el = document.getElementById('langkah-1-pertanyaan');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            setIsAddingField(true);
                          }
                        }, 100);
                      }}
                      className="w-full py-1.5 px-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Ke Form Pertanyaan</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Langkah 3 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                      3
                    </div>
                    <h4 className="font-black text-slate-900 text-xs">
                      Atur Pengelompokan Data
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Pilih kolom pengelompokan hierarki petugas lapangan (Level 1 s.d. 4, misal: Kecamatan &gt; Desa &gt; SLS).
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminTab('forms');
                        setTimeout(() => {
                          const el = document.getElementById('langkah-2-grouping');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className="w-full py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Ke Pengelompokan Data</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Langkah 4 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                      4
                    </div>
                    <h4 className="font-black text-slate-900 text-xs">
                      Hubungkan ke Google Sheet
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Download format Excel untuk mengisi sasaran responden di Google Sheet Anda, lalu masukkan linknya agar data masuk ke aplikasi!
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminTab('forms');
                        setTimeout(() => {
                          const el = document.getElementById('langkah-3-database');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className="w-full py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Ke Hubungkan Google Sheet</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips Footer */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/60 flex items-center gap-2.5 text-[11px] text-indigo-900">
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>
                  <b>Kemudahan Edit:</b> Nama Kegiatan dan Nama Formulir dapat Anda ubah kapan saja dengan tombol <b>Edit</b>. Petugas lapangan akan langsung menerima susunan formulir yang telah disimpan secara real-time.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==========================================
          NAV TABS (FORMS vs MONITORING vs PREVIEW)
          ========================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setAdminTab('forms')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'forms'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Formulir & Pertanyaan</span>
        </button>

        <button
          onClick={() => setAdminTab('monitoring')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'monitoring'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Monitoring Pengisian Lapangan</span>
        </button>

        <button
          onClick={() => setAdminTab('preview')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'preview'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-primary-700 hover:bg-primary-50 border border-primary-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Pratinjau Mode Petugas (AppSheet)</span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: FORMULIR & PERTANYAAN (BUILDER)
          ========================================== */}
      {adminTab === 'forms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SISI KIRI: DAFTAR FORM DALAM KEGIATAN */}
          <div className="lg:col-span-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Formulir Kegiatan</h3>
                <p className="text-[11px] text-slate-400">Pemeriksaan, Pencacahan, dsb.</p>
              </div>
              <button
                onClick={() => {
                  if (activities.length === 0) {
                    setIsNewActivityModalOpen(true);
                  } else {
                    setIsNewFormModalOpen(true);
                  }
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title={activities.length === 0 ? "Buat Kegiatan Baru Dahulu" : "Tambah Formulir"}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-500 bg-amber-50/70 rounded-2xl border border-dashed border-amber-200 space-y-2.5">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="font-bold text-slate-800">Belum ada Kegiatan terdaftar.</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Formulir (seperti Pencacahan / Pemeriksaan) harus berada di bawah sebuah Kegiatan (contoh: <b>Susenas September 2026</b>).
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewActivityModalOpen(true)}
                  style={{ backgroundColor: presetInfo.colors.primary }}
                  className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-90 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Buat Kegiatan Baru Dahulu</span>
                </button>
              </div>
            ) : forms.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada formulir dalam kegiatan ini. Klik tombol (+) untuk menambah form.
              </div>
            ) : (
              <div className="space-y-1.5">
                {forms.map(f => {
                  const isSelected = f.id === selectedFormId;
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFormId(f.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/50 shadow-xs ring-1 ring-primary-200'
                          : 'border-slate-200/80 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {(() => {
                            const FormItemIcon = getIconComponent(f.icon, FileText);
                            return <FormItemIcon className="w-4 h-4" />;
                          })()}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold block truncate">{f.title}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {f.fields?.length || 0} Pertanyaan • {f.stats?.totalRecords || 0} Sampel
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditFormModal(f);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-primary-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                          title="Ubah Nama Formulir Ini"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary-600' : 'text-slate-300'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SISI KANAN: KONFIGURASI FORM, GOOGLE SHEET & PERTANYAAN */}
          <div className="lg:col-span-8 space-y-6">
            {selectedForm ? (
              <>
                {/* HEADER FORMULIR AKTIF & UBAH NAMA */}
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0"
                      style={{ backgroundColor: presetInfo.colors.primary }}
                    >
                      {(() => {
                        const ActiveFormIcon = getIconComponent(selectedForm.icon, FileText);
                        return <ActiveFormIcon className="w-5 h-5" />;
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Formulir Terpilih:</span>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">{selectedForm.title}</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bagian dari Kegiatan: <b className="text-slate-700">{selectedActivity?.title || '-'}</b>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditFormModal(selectedForm)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Ubah nama formulir ini"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ubah Nama Form</span>
                    </button>
                  </div>
                </div>
                {/* ============================================================ */}
                {/* LANGKAH 1: DEFINISI PERTANYAAN & TIPE DATA (BAGIAN ATAS)   */}
                {/* ============================================================ */}
                <div id="langkah-1-pertanyaan" className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 scroll-mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary-100 text-primary-800">
                          Langkah 1 dari 3
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                          Daftar Pertanyaan &amp; Tipe Data ({fields.length})
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Buat dan tentukan variabel formulir yang akan dijawab oleh petugas di lapangan
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsAddingField(true)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Pertanyaan</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveFields}
                        style={{ backgroundColor: presetInfo.colors.primary }}
                        className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-90 cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Pertanyaan</span>
                      </button>
                    </div>
                  </div>

                  {/* Form Tambah Pertanyaan Baru */}
                  <AnimatePresence>
                    {isAddingField && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-800 text-xs">Definisi Pertanyaan Baru</span>
                          <span className="text-[11px] text-slate-400">Pastikan tipe data sesuai dengan format isian petugas</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Label Pertanyaan:</label>
                            <input
                              type="text"
                              placeholder="Contoh: Foto Rumah (dengan geotagging)"
                              value={newField.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewField(prev => ({
                                  ...prev,
                                  label: val,
                                  columnName: prev.columnName === '' || prev.columnName === prev.label ? val : prev.columnName
                                }));
                              }}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200 text-xs text-slate-800 placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block mb-1">Nama Kolom Database / Sheet:</label>
                            <input
                              type="text"
                              placeholder="Sama dengan header kolom sheet (otomatis terisi)"
                              value={newField.columnName}
                              onChange={(e) => setNewField({ ...newField, columnName: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200 text-xs text-slate-800 placeholder:text-slate-400 font-mono text-[11px]"
                            />
                          </div>
                        </div>

                        {/* Custom Dropdown Jenis Data / Variabel & Checkbox Wajib */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
                          <div className="sm:col-span-2 relative">
                            <label className="font-bold text-slate-700 block mb-1">Jenis Data / Variabel:</label>
                            
                            <button
                              type="button"
                              onClick={() => setIsDataTypeDropdownOpen(!isDataTypeDropdownOpen)}
                              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left flex items-center justify-between gap-2 text-xs font-bold text-slate-800 transition-all shadow-2xs focus:ring-2 focus:ring-primary-200 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-1 rounded-lg border shrink-0 ${selectedDataTypeInfo.badgeColor}`}>
                                  <SelectedIcon className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-bold text-slate-900">{selectedDataTypeInfo.label}</span>
                                <span className="text-[11px] text-slate-400 font-normal truncate hidden md:inline">
                                  • {selectedDataTypeInfo.desc}
                                </span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isDataTypeDropdownOpen ? 'rotate-180 text-primary-600' : ''}`} />
                            </button>

                            {/* Floating Dropdown Menu */}
                            {isDataTypeDropdownOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-30" 
                                  onClick={() => setIsDataTypeDropdownOpen(false)} 
                                />
                                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                                  {DATA_TYPES.map((dt) => {
                                    const Icon = dt.icon;
                                    const isSelected = newField.dataType === dt.id;
                                    return (
                                      <div
                                        key={dt.id}
                                        onClick={() => {
                                          setNewField({ ...newField, dataType: dt.id });
                                          setIsDataTypeDropdownOpen(false);
                                        }}
                                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                                          isSelected 
                                            ? 'bg-primary-50/70 border border-primary-200 text-slate-900' 
                                            : 'hover:bg-slate-50 border border-transparent text-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className={`p-1.5 rounded-lg border shrink-0 ${dt.badgeColor}`}>
                                            <Icon className="w-4 h-4" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                              <span>{dt.label}</span>
                                              {isSelected && (
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-primary-200/80 text-primary-800">
                                                  Aktif
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{dt.desc}</p>
                                          </div>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>

                          <div className="pt-6">
                            <label 
                              htmlFor="reqCheck" 
                              className="flex items-center gap-2.5 p-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                            >
                              <input
                                type="checkbox"
                                id="reqCheck"
                                checked={newField.isRequired}
                                onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                                className="w-4 h-4 rounded text-primary-600 cursor-pointer accent-primary-600"
                              />
                              <span className="font-bold text-slate-700 text-xs">
                                Wajib Diisi (Required)
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingField(false);
                              setIsDataTypeDropdownOpen(false);
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer text-xs transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleAddField}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer shadow-xs text-xs transition-colors"
                          >
                            Tambahkan ke Formulir
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* List of Existing Questions */}
                  {fields.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      Belum ada pertanyaan pada form ini. Klik tombol <span className="font-bold text-slate-700">+ Tambah Pertanyaan</span> di atas untuk mulai membuat variabel.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fields.map((f, idx) => {
                        const typeInfo = DATA_TYPES.find(d => d.id === f.dataType) || DATA_TYPES[0];
                        const Icon = typeInfo.icon;
                        return (
                          <div
                            key={f.id || idx}
                            className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-[11px] shrink-0 shadow-2xs">
                                {idx + 1}
                              </span>
                              <div className="truncate">
                                <span className="font-bold text-slate-900 block truncate">{f.label}</span>
                                <span className="text-[10px] text-slate-400 font-mono block truncate">
                                  Kolom Header: <span className="text-slate-600 font-semibold">{f.columnName}</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${typeInfo.badgeColor}`}>
                                <Icon className="w-3 h-3" />
                                <span>{typeInfo.label}</span>
                              </div>

                              {f.isRequired && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                  Wajib
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setFields(fields.filter((_, i) => i !== idx));
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Hapus Pertanyaan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* LANGKAH 2: PENGELOMPOKAN DATA PETUGAS (BAGIAN TENGAH)        */}
                {/* ============================================================ */}
                <div id="langkah-2-grouping" className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 scroll-mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                          Langkah 2 dari 3
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-600" />
                          Pengelompokan Hierarki Data Petugas
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Kelompokkan tampilan data di aplikasi petugas lapangan berdasarkan variabel dari Langkah 1 (contoh: Wilayah &gt; Desa &gt; SLS).
                      </p>
                    </div>
                  </div>

                  {availableColumns.length === 0 ? (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Tambahkan pertanyaan di Langkah 1 terlebih dahulu agar nama kolom dapat dipilih untuk pengelompokan.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[0, 1, 2, 3].map((lvl) => {
                          const levelNames = [
                            'Tingkat 1 (Grup Utama)',
                            'Tingkat 2 (Sub-Grup 1)',
                            'Tingkat 3 (Sub-Grup 2)',
                            'Tingkat 4 (Sub-Grup 3)'
                          ];
                          const isSelected = Boolean(formConfig.groupingLevels[lvl]);
                          return (
                            <div 
                              key={lvl} 
                              className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                                isSelected 
                                  ? 'bg-primary-50/25 border-primary-200 shadow-2xs' 
                                  : 'bg-slate-50 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-slate-800">{levelNames[lvl]}</span>
                                {isSelected ? (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Aktif</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-medium">Opsional</span>
                                )}
                              </div>
                              <div className="relative">
                                <select
                                  value={formConfig.groupingLevels[lvl] || ''}
                                  onChange={(e) => {
                                    const updated = [...formConfig.groupingLevels];
                                    updated[lvl] = e.target.value;
                                    setFormConfig({ ...formConfig, groupingLevels: updated });
                                  }}
                                  className={`w-full appearance-none pl-3.5 pr-9 py-2.5 bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all truncate border shadow-2xs ${
                                    isSelected
                                      ? 'border-primary-300 text-primary-950 ring-1 ring-primary-200'
                                      : 'border-slate-200 hover:border-slate-300 text-slate-700 focus:ring-2 focus:ring-primary-200'
                                  }`}
                                >
                                  <option value="">-- Tidak Digunakan --</option>
                                  {availableColumns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                  ))}
                                </select>
                                <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isSelected ? 'text-primary-600' : 'text-slate-400'}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleSaveFormConfig}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Hierarki Pengelompokan</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* LANGKAH 3: HUBUNGKAN KE GOOGLE SHEET (SEDERHANA & RAMAH AWAM)*/}
                {/* ============================================================ */}
                <div id="langkah-3-database" className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 scroll-mt-6">
                  {/* Header Langkah 3 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          Langkah 3 dari 3
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          Hubungkan ke Google Sheet
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Isi daftar sasaran responden di Google Sheet Anda, lalu sambungkan ke aplikasi ini dengan mudah.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadExcelTemplate}
                      className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Download Format Excel</span>
                    </button>
                  </div>

                  {/* 2 Kotak Langkah Sederhana */}
                  <div className="space-y-4">
                    {/* Tahap 1: Hubungkan Link Google Sheet */}
                    <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          1
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                            Masukkan Link Google Sheet Anda
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Aplikasi akan menarik daftar nama sasaran / responden dari file Google Sheet ini.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Link Google Sheet:</label>
                          <input
                            type="text"
                            placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                            value={formConfig.sheetUrl}
                            onChange={(e) => setFormConfig({ ...formConfig, sheetUrl: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-primary-200 font-mono text-[11px]"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            *Pastikan link di Google Sheet diatur: <b>&quot;Siapa saja yang memiliki link (Pelihat)&quot;</b>
                          </span>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Nama Tab di Google Sheet:</label>
                          <input
                            type="text"
                            placeholder="Contoh: Sheet1 atau Pencacahan"
                            value={formConfig.sheetName}
                            onChange={(e) => setFormConfig({ ...formConfig, sheetName: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-primary-200 text-xs"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            *Nama lembar tab di bagian paling bawah Google Sheet Anda
                          </span>
                        </div>
                      </div>

                      {/* Tombol Simpan & Tarik Data Utama */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={handleSaveFormConfig}
                          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Link</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSyncSheet}
                          disabled={isSyncing}
                          style={{ backgroundColor: presetInfo.colors.primary }}
                          className="px-5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:opacity-90 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Sedang Menarik Data...' : 'Tarik Data dari Google Sheet'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Tahap 2: Kirim Laporan Otomatis ke Google Sheet */}
                    <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            2
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                Pengiriman Hasil Laporan Petugas
                              </h5>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 uppercase">
                                Otomatis
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Agar jawaban yang diisi petugas di lapangan langsung masuk ke Google Sheet Anda secara otomatis.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowWebhookGuide(!showWebhookGuide)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{showWebhookGuide ? 'Tutup Panduan' : 'Lihat Cara Pasang (Mudah)'}</span>
                        </button>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 text-xs mb-1">
                          Link Skrip Google Sheet:
                        </label>
                        <input
                          type="text"
                          placeholder="https://script.google.com/macros/s/.../exec (Tempel link hasil panduan di sini)"
                          value={formConfig.webhookUrl}
                          onChange={(e) => setFormConfig({ ...formConfig, webhookUrl: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-primary-200 font-mono text-[11px]"
                        />
                      </div>

                      <AnimatePresence>
                        {showWebhookGuide && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs space-y-3 shadow-md"
                          >
                            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                              <span className="font-bold text-white">Cara Pasang Skrip di Google Sheet (Hanya 1 Menit)</span>
                              <button
                                onClick={handleCopyScript}
                                className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer text-xs"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedScript ? 'Tersalin!' : 'Salin Skrip'}</span>
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                              <p><b>1.</b> Buka Google Sheet Anda &rarr; klik menu <b>Ekstensi</b> &rarr; <b>Apps Script</b>.</p>
                              <p><b>2.</b> Hapus teks bawaan yang ada di sana, lalu klik tombol biru <b>Salin Skrip</b> di atas dan tempel (Paste) di Google Sheet, lalu klik ikon <b>Simpan</b>.</p>
                              <p><b>3.</b> Klik tombol biru <b>Deploy (Terapkan)</b> di kanan atas &rarr; pilih <b>Deployment Baru</b> &rarr; pilih jenis: <b>Aplikasi Web</b> &rarr; ubah Akses ke: <b>Siapa saja (Anyone)</b> &rarr; klik <b>Terapkan</b>.</p>
                              <p><b>4.</b> Salin URL Aplikasi Web yang muncul dan tempelkan pada kolom input di atas. Selesai!</p>
                            </div>
                            <pre className="bg-slate-950 p-3 rounded-xl overflow-x-auto text-[10px] font-mono text-emerald-400 max-h-48 custom-scrollbar select-all">
                              {googleAppsScriptCode}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleSaveFormConfig}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Pengaturan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
                Pilih atau tambahkan formulir terlebih dahulu pada panel sebelah kiri.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: MONITORING PENGISIAN LAPANGAN
          ========================================== */}
      {adminTab === 'monitoring' && (
        <div className="space-y-6">
          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 block">Total Sasaran / Sampel</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {monitoringData?.totalAllRecords || 0}
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-emerald-600 block">Laporan Submitted</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {monitoringData?.totalAllSubmitted || 0}
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-amber-600 block">Masih Draf</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">
                {monitoringData?.totalAllDraft || 0}
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-primary-600 block">Persentase Selesai</span>
              <span className="text-2xl font-black text-primary-600 mt-1 block">
                {monitoringData?.totalAllRecords > 0 
                  ? Math.round((monitoringData.totalAllSubmitted / monitoringData.totalAllRecords) * 100) 
                  : 0}%
              </span>
            </div>
          </div>

          {/* MONITORING PER FORM */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900">Rekapitulasi Progres per Formulir</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {monitoringData?.formStats?.map((f: any) => (
                <div key={f.formId} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate">{f.title}</span>
                    <span className="font-black text-primary-600">{f.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary-600 h-full rounded-full" style={{ width: `${f.percent}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Submit: {f.submitted}</span>
                    <span>Draf: {f.draft}</span>
                    <span>Total: {f.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MONITORING PER PETUGAS (PPL / PML) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-black text-slate-900">Progres Pengisian per Petugas Lapangan</h3>
              <input
                type="text"
                placeholder="Cari nama petugas..."
                value={monitoringSearch}
                onChange={(e) => setMonitoringSearch(e.target.value)}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs outline-none focus:ring-2 focus:ring-primary-200 max-w-xs"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                    <th className="py-2.5 px-3">Nama Petugas</th>
                    <th className="py-2.5 px-3">PML</th>
                    <th className="py-2.5 px-3 text-center">Sasaran</th>
                    <th className="py-2.5 px-3 text-center">Draf</th>
                    <th className="py-2.5 px-3 text-center">Submitted</th>
                    <th className="py-2.5 px-3">Progres</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monitoringData?.petugasStats
                    ?.filter((p: any) => p.name.toLowerCase().includes(monitoringSearch.toLowerCase()))
                    ?.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800">{p.name}</td>
                        <td className="py-3 px-3 text-slate-500">{p.pml}</td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">{p.total}</td>
                        <td className="py-3 px-3 text-center text-amber-600 font-bold">{p.draft}</td>
                        <td className="py-3 px-3 text-center text-emerald-600 font-bold">{p.submitted}</td>
                        <td className="py-3 px-3 w-40">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${p.percent}%` }} />
                            </div>
                            <span className="text-[11px] font-extrabold text-slate-600 w-8">{p.percent}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: PRATINJAU MODE PETUGAS (APPSHEET VIEW)
          ========================================== */}
      {adminTab === 'preview' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-primary-50 border border-primary-200 rounded-2xl text-xs text-primary-900 flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary-600" />
              Anda sedang melihat pratinjau langsung tampilan Petugas Lapangan (Mode AppSheet).
            </span>
            <button
              onClick={() => setAdminTab('forms')}
              className="text-xs font-bold text-primary-700 underline cursor-pointer"
            >
              Kembali ke Pengaturan Admin
            </button>
          </div>

          <PetugasLaporanModule user={user} />
        </div>
      )}

      {/* MODAL: TAMBAH KEGIATAN BARU */}
      <AnimatePresence>
        {isNewActivityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsNewActivityModalOpen(false)} />
            <div className="bg-white rounded-3xl p-6 max-w-md w-full relative z-10 shadow-2xl space-y-4 text-xs">
              <h3 className="text-base font-black text-slate-900">Buat Kegiatan Laporan Baru</h3>
              <form onSubmit={handleCreateActivity} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Kegiatan:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Susenas Maret 2026"
                    value={newActivityForm.title}
                    onChange={(e) => setNewActivityForm({ ...newActivityForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200 text-xs"
                  />
                </div>
                <IconPicker
                  label="Pilih Ikon Kegiatan:"
                  selectedIcon={newActivityForm.icon}
                  onSelect={(iconId) => setNewActivityForm({ ...newActivityForm, icon: iconId })}
                />
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deskripsi:</label>
                  <textarea
                    rows={2}
                    placeholder="Keterangan singkat kegiatan..."
                    value={newActivityForm.description}
                    onChange={(e) => setNewActivityForm({ ...newActivityForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Mulai:</label>
                    <input
                      type="date"
                      value={newActivityForm.startDate}
                      onChange={(e) => setNewActivityForm({ ...newActivityForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Selesai:</label>
                    <input
                      type="date"
                      value={newActivityForm.endDate}
                      onChange={(e) => setNewActivityForm({ ...newActivityForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewActivityModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: presetInfo.colors.primary }}
                    className="px-5 py-2 text-white rounded-xl font-bold shadow-md cursor-pointer hover:opacity-90"
                  >
                    Buat Kegiatan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: TAMBAH FORMULIR BARU */}
      <AnimatePresence>
        {isNewFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsNewFormModalOpen(false)} />
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full relative z-10 shadow-2xl space-y-4 text-xs">
              <div>
                <h3 className="text-base font-black text-slate-900">Tambah Formulir dalam Kegiatan</h3>
                {selectedActivity ? (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Formulir akan dibuat di dalam kegiatan: <b className="text-primary-700">{selectedActivity.title}</b>
                  </p>
                ) : (
                  <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Belum ada Kegiatan yang dipilih</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Formulir harus bernaung di bawah sebuah Kegiatan (misal: Kegiatan <b>"Susenas September 2026"</b>, lalu di dalamnya ada form <b>"Pencacahan"</b> & <b>"Pemeriksaan"</b>).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewFormModalOpen(false);
                        setNewActivityForm(prev => ({ ...prev, title: newFormTitle.trim() }));
                        setIsNewActivityModalOpen(true);
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors cursor-pointer text-center block shadow-xs"
                    >
                      Jadikan Sebagai Kegiatan Baru &rarr;
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleCreateForm} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Formulir:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pencacahan, Pemeriksaan, Updating"
                    value={newFormTitle}
                    onChange={(e) => setNewFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200 text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Misalnya tahap atau instrumen pendataan (bukan nama survei keseluruhan).
                  </span>
                </div>

                <IconPicker
                  label="Pilih Ikon Formulir:"
                  selectedIcon={newFormIcon}
                  onSelect={(iconId) => setNewFormIcon(iconId)}
                />

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: presetInfo.colors.primary }}
                    className="px-5 py-2 text-white rounded-xl font-bold shadow-md cursor-pointer hover:opacity-90"
                  >
                    {selectedActivity ? 'Tambah Form' : 'Lanjutkan Buat Kegiatan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT DATA KEGIATAN */}
      <AnimatePresence>
        {isEditActivityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsEditActivityModalOpen(false)} />
            <div className="bg-white rounded-3xl p-6 max-w-md w-full relative z-10 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary-600" />
                  <h3 className="text-base font-black text-slate-900">Edit Data Kegiatan</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsEditActivityModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateActivity} className="space-y-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Kegiatan:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Susenas Maret 2026"
                    value={editActivityForm.title}
                    onChange={(e) => setEditActivityForm({ ...editActivityForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200 text-xs font-semibold text-slate-800"
                  />
                </div>

                <IconPicker
                  label="Pilih Ikon Kegiatan:"
                  selectedIcon={editActivityForm.icon}
                  onSelect={(iconId) => setEditActivityForm({ ...editActivityForm, icon: iconId })}
                />

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deskripsi Kegiatan:</label>
                  <textarea
                    rows={2}
                    placeholder="Keterangan singkat kegiatan..."
                    value={editActivityForm.description}
                    onChange={(e) => setEditActivityForm({ ...editActivityForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200 text-xs text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Mulai:</label>
                    <input
                      type="date"
                      value={editActivityForm.startDate}
                      onChange={(e) => setEditActivityForm({ ...editActivityForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Selesai:</label>
                    <input
                      type="date"
                      value={editActivityForm.endDate}
                      onChange={(e) => setEditActivityForm({ ...editActivityForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Status Akses Petugas</span>
                    <span className="text-[10px] text-slate-400">Jika dibuka, petugas lapangan dapat melihat form</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditActivityForm(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      editActivityForm.isOpen 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {editActivityForm.isOpen ? '🟢 Dibuka' : '🔴 Ditutup'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditActivityModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: presetInfo.colors.primary }}
                    className="px-5 py-2 text-white rounded-xl font-bold shadow-md cursor-pointer hover:opacity-90 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT NAMA FORMULIR */}
      <AnimatePresence>
        {isEditFormModalOpen && editingFormObj && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsEditFormModalOpen(false)} />
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full relative z-10 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary-600" />
                  <h3 className="text-base font-black text-slate-900">Ubah Nama Formulir</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsEditFormModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateFormTitle} className="space-y-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Formulir:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pencacahan, Pemeriksaan, Updating"
                    value={editingFormObj.title}
                    onChange={(e) => setEditingFormObj({ ...editingFormObj, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-200 text-xs font-semibold text-slate-800"
                    autoFocus
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Nama ini akan langsung diperbarui di dashboard admin dan menu petugas lapangan.
                  </span>
                </div>

                <IconPicker
                  label="Pilih Ikon Formulir:"
                  selectedIcon={editingFormObj.icon}
                  onSelect={(iconId) => setEditingFormObj({ ...editingFormObj, icon: iconId })}
                />

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: presetInfo.colors.primary }}
                    className="px-5 py-2 text-white rounded-xl font-bold shadow-md cursor-pointer hover:opacity-90 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Nama Form</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

