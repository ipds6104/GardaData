import React from 'react';
import { useAuth } from '../../lib/auth';
import { AdminLaporanManager } from './AdminLaporanManager';
import { PetugasLaporanModule } from './PetugasLaporanModule';

interface LaporanModuleProps {
  onBack: () => void;
}

export const LaporanModule: React.FC<LaporanModuleProps> = ({ onBack }) => {
  const { user } = useAuth();

  // Ambil target activity dari sessionStorage (shortlink pertama kali buka)
  // atau localStorage (shortlink setelah di-refresh — URL sudah bersih)
  const targetActivityId = typeof window !== 'undefined'
    ? (sessionStorage.getItem('garda_laporan_target_activity') ||
       localStorage.getItem('garda_laporan_last_activity') ||
       undefined)
    : undefined;
  const targetFormId = typeof window !== 'undefined' 
    ? (sessionStorage.getItem('garda_laporan_target_form') || undefined) 
    : undefined;

  if (user?.role === 'admin') {
    return <AdminLaporanManager onBack={onBack} user={user} initialActivityId={targetActivityId} />;
  }

  return (
    <PetugasLaporanModule 
      onBack={onBack} 
      user={user} 
      initialActivityId={targetActivityId}
      initialFormId={targetFormId}
    />
  );
};

