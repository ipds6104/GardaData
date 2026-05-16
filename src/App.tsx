/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { ClassificationModule } from './components/ClassificationModule';
import { InfrastructureModule } from './components/InfrastructureModule';
import { BuildingAreaModule } from './components/BuildingAreaModule';
import { AdminBuildingDashboard } from './components/AdminBuildingDashboard';
import { ImputationModule } from './components/imputation/ImputationModule';
import { Login } from './components/Login';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('landing');

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'kbli-kbji':
        return <ClassificationModule onBack={() => setCurrentPage('landing')} />;
      case 'infrastructure':
        return <InfrastructureModule onBack={() => setCurrentPage('landing')} />;
      case 'imputation':
        return <ImputationModule onBack={() => setCurrentPage('landing')} />;
      case 'building-area':
        if (user?.role === 'admin') {
          return <AdminBuildingDashboard onBack={() => setCurrentPage('landing')} />;
        }
        return <BuildingAreaModule onBack={() => setCurrentPage('landing')} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

