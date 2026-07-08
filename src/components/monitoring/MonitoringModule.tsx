import React, { useState } from 'react';
import { MonitoringList } from './MonitoringList';
import { MonitoringDashboard } from './MonitoringDashboard';
import { AdminMonitoring, MonitoringConfig } from './AdminMonitoring';
import { useAuth } from '../../lib/auth';
import { Settings, Eye, ChevronLeft } from 'lucide-react';

interface MonitoringModuleProps {
  onBack: () => void;
}

export const MonitoringModule: React.FC<MonitoringModuleProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [selectedConfig, setSelectedConfig] = useState<MonitoringConfig | null>(() => {
    const saved = sessionStorage.getItem('garda_monitoring_selected_config');
    return saved ? JSON.parse(saved) : null;
  });

  React.useEffect(() => {
    if (selectedConfig) {
      sessionStorage.setItem('garda_monitoring_selected_config', JSON.stringify(selectedConfig));
    } else {
      sessionStorage.removeItem('garda_monitoring_selected_config');
    }
  }, [selectedConfig]);
  
  // By default, if the user is an admin, they might still want to see the Petugas view first,
  const [isAdminMode, setIsAdminMode] = useState(() => {
    const saved = sessionStorage.getItem('garda_monitoring_is_admin_mode');
    return saved !== null ? saved === 'true' : user?.role === 'admin';
  });

  React.useEffect(() => {
    sessionStorage.setItem('garda_monitoring_is_admin_mode', String(isAdminMode));
  }, [isAdminMode]);

  if (isAdminMode && user?.role === 'admin') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setIsAdminMode(false)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Lihat Tampilan Petugas
          </button>
        </div>
        <AdminMonitoring onBack={onBack} />
      </div>
    );
  }

  if (selectedConfig) {
    return <MonitoringDashboard config={selectedConfig} onBack={() => setSelectedConfig(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white hover:bg-slate-100 rounded-full shadow-sm transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-2xl font-black text-slate-800">Kembali ke Beranda</h1>
        </div>
        
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsAdminMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 font-bold rounded-xl hover:bg-primary-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Kelola Monitoring (Admin)
          </button>
        )}
      </div>
      <MonitoringList onNavigateToDashboard={setSelectedConfig} />
    </div>
  );
};
