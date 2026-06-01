import React, { useEffect, useState } from 'react';
import { ChevronLeft, WifiOff, Loader2, Search, Database } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useImputationStore } from '../../store/imputationStore';
import { syncImputationFromFirebase, getLocalImputationData } from '../../services/imputationService';
import { ImputationAdminDashboard } from './ImputationAdminDashboard';
import { ImputationSearchEngine } from './ImputationSearchEngine';

interface ImputationModuleProps {
  onBack: () => void;
}

export const ImputationModule: React.FC<ImputationModuleProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { isOffline, isLoading, setLoading, setData, setOfflineStatus } = useImputationStore();
  
  // For admin, default to search engine, but can toggle to dashboard
  const [activeTab, setActiveTab] = useState<'search' | 'admin'>('search');

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        if (navigator.onLine) {
          const freshData = await syncImputationFromFirebase();
          setData(freshData);
        } else {
          const localData = await getLocalImputationData();
          setData(localData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initData();

    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors font-semibold group w-fit"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {isOffline && (
              <div className="flex items-center gap-2 bg-slate-200 text-slate-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                <WifiOff className="w-4 h-4" /> Mode Offline
              </div>
            )}

            {user?.role === 'admin' ? (
              <div className="flex bg-slate-200/50 p-1 rounded-full flex-wrap sm:flex-nowrap justify-center">
                <button
                  onClick={() => setActiveTab('search')}
                  className={`flex items-center gap-1.5 px-3 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest transition-all ${activeTab === 'search' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Search className="w-3.5 h-3.5" /> Pencarian
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest transition-all ${activeTab === 'admin' ? 'bg-white shadow-sm text-secondary-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Database className="w-3.5 h-3.5" /> Kelola Data
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest text-slate-600">Akses Petugas</span>
              </div>
            )}
          </div>
        </div>

        {/* Content routing based on role and tab */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Menyiapkan Engine & Memuat Data Dasar...</p>
          </div>
        ) : (
          user?.role === 'admin' && activeTab === 'admin' ? <ImputationAdminDashboard /> : <ImputationSearchEngine />
        )}
      </div>
    </div>
  );
};
