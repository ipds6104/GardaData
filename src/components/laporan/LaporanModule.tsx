import React from 'react';
import { useAuth } from '../../lib/auth';
import { AdminLaporanManager } from './AdminLaporanManager';
import { PetugasLaporanModule } from './PetugasLaporanModule';

interface LaporanModuleProps {
  onBack: () => void;
}

export const LaporanModule: React.FC<LaporanModuleProps> = ({ onBack }) => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminLaporanManager onBack={onBack} user={user} />;
  }

  return <PetugasLaporanModule onBack={onBack} user={user} />;
};

