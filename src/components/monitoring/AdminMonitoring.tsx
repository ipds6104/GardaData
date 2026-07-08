import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Save, Trash2, Download, AlertCircle, Edit, Link as LinkIcon, Loader2 } from 'lucide-react';

export interface MonitoringConfig {
  id?: string;
  kegiatan: string;
  subKegiatan: string;
  sheetUrl: string;
  sheetName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
}

interface AdminMonitoringProps {
  onBack: () => void;
}

export const AdminMonitoring: React.FC<AdminMonitoringProps> = ({ onBack }) => {
  const [configs, setConfigs] = useState<MonitoringConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<MonitoringConfig>({
    kegiatan: '',
    subKegiatan: '',
    sheetUrl: '',
    sheetName: '',
    startDate: '',
    endDate: '',
    isActive: true
  });
  
  const [noSubKegiatan, setNoSubKegiatan] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/monitoring/configs`);
      if (res.ok) {
        const data = await res.json();
        // format dates for input type="date"
        const formatted = data.map((d: any) => ({
          ...d,
          startDate: d.startDate.split('T')[0],
          endDate: d.endDate.split('T')[0],
          isActive: Boolean(d.isActive)
        }));
        setConfigs(formatted);
      }
    } catch (err) {
      console.error('Error fetching monitoring configs:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      
      // If no sub kegiatan, clear it
      const payload = { ...currentConfig, subKegiatan: noSubKegiatan ? '' : currentConfig.subKegiatan };
      
      const method = currentConfig.id ? 'PUT' : 'POST';
      const url = currentConfig.id 
        ? `${baseUrl}/api/monitoring/configs/${currentConfig.id}`
        : `${baseUrl}/api/monitoring/configs`;
        
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsEditing(false);
        fetchConfigs();
        // Reset
        setCurrentConfig({
          kegiatan: '',
          subKegiatan: '',
          sheetUrl: '',
          sheetName: '',
          startDate: '',
          endDate: '',
          isActive: true
        });
        setNoSubKegiatan(false);
      }
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Gagal menyimpan konfigurasi. Pastikan semua kolom terisi dan koneksi server backend berjalan.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus monitoring ini? Riwayat snapshot juga akan dihapus.')) return;
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/monitoring/configs/${id}`, { method: 'DELETE' });
      if (res.ok) fetchConfigs();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const downloadTemplate = () => {
    const headers = ["kode wilayah", "nama PPL", "nama PML", "nama Kecamatan", "nama Desa", "nama SLS/Wilayah Kerja", "submit", "draf", "approve", "reject", "open", "target"];
    // Menggunakan CSV dengan pemisah titik koma (;) agar otomatis terbaca dalam kolom oleh Excel versi Indonesia
    const csvContent = headers.join(";") + "\n";
    
    // Menambahkan BOM (Byte Order Mark) agar Excel membaca file sebagai UTF-8 dengan benar
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_monitoring.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-2xl font-black text-slate-800">Manajemen Monitoring (Admin)</h1>
        </div>
        {!isEditing && (
          <div className="flex gap-4">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
            <button
              onClick={() => {
                setCurrentConfig({
                  kegiatan: '',
                  subKegiatan: '',
                  sheetUrl: '',
                  sheetName: '',
                  startDate: '',
                  endDate: '',
                  isActive: true
                });
                setNoSubKegiatan(false);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Monitoring
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-6">{currentConfig.id ? 'Edit Monitoring' : 'Buat Monitoring Baru'}</h2>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nama Kegiatan</label>
                <input 
                  type="text" 
                  value={currentConfig.kegiatan}
                  onChange={(e) => setCurrentConfig({...currentConfig, kegiatan: e.target.value})}
                  required 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500"
                  placeholder="Contoh: Sakernas 2026"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">Sub Kegiatan</label>
                  <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={noSubKegiatan} 
                      onChange={(e) => setNoSubKegiatan(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    Tidak ada sub-kegiatan
                  </label>
                </div>
                <input 
                  type="text" 
                  value={currentConfig.subKegiatan}
                  onChange={(e) => setCurrentConfig({...currentConfig, subKegiatan: e.target.value})}
                  disabled={noSubKegiatan}
                  required={!noSubKegiatan}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500 disabled:opacity-50"
                  placeholder="Contoh: Pemutakhiran"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  URL Google Sheet Publik
                </label>
                <input 
                  type="url" 
                  value={currentConfig.sheetUrl}
                  onChange={(e) => setCurrentConfig({...currentConfig, sheetUrl: e.target.value})}
                  required 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <p className="text-xs text-slate-500">Pastikan akses Google Sheet diubah menjadi "Siapa saja yang memiliki link (Viewer)".</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nama Sheet (Opsional)</label>
                <input 
                  type="text" 
                  value={currentConfig.sheetName}
                  onChange={(e) => setCurrentConfig({...currentConfig, sheetName: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500"
                  placeholder="Contoh: Sheet1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tanggal Mulai</label>
                  <input 
                    type="date" 
                    value={currentConfig.startDate}
                    onChange={(e) => setCurrentConfig({...currentConfig, startDate: e.target.value})}
                    required 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tanggal Selesai</label>
                  <input 
                    type="date" 
                    value={currentConfig.endDate}
                    onChange={(e) => setCurrentConfig({...currentConfig, endDate: e.target.value})}
                    required 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={currentConfig.isActive}
                  onChange={(e) => setCurrentConfig({...currentConfig, isActive: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                <span className="ml-3 text-sm font-bold text-slate-700">Aktifkan untuk Petugas</span>
              </label>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg"
              >
                <Save className="w-5 h-5" />
                Simpan Konfigurasi
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
          ) : configs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Belum ada konfigurasi monitoring.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Kegiatan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Periode</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {configs.map(config => (
                    <tr key={config.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{config.kegiatan}</p>
                        {config.subKegiatan && <p className="text-xs text-slate-500 mt-1">{config.subKegiatan}</p>}
                      </td>
                      <td className="px-6 py-4">
                        {config.isActive ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">Aktif</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">Nonaktif</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {new Date(config.startDate).toLocaleDateString('id-ID')} - {new Date(config.endDate).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => {
                            setCurrentConfig(config);
                            setNoSubKegiatan(!config.subKegiatan);
                            setIsEditing(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(config.id!)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
