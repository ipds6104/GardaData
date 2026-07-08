/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { ClassificationModule } from './components/ClassificationModule';
import { InfrastructureModule } from './components/InfrastructureModule';
import { BuildingAreaModule } from './components/BuildingAreaModule';
import { AdminBuildingDashboard } from './components/AdminBuildingDashboard';
import { ImputationModule } from './components/imputation/ImputationModule';
import { SocialPhenomenonModule } from './components/SocialPhenomenonModule';
import { CerdasModule } from './components/CerdasModule';
import { VisitorDashboard } from './components/VisitorDashboard';
import { AdminStrategicData } from './components/AdminStrategicData';
import { LMSModule } from './components/LMSModule';
import { Login } from './components/Login';
import { MonitoringModule } from './components/monitoring/MonitoringModule';
import { syncImputationFromFirebase } from './services/imputationService';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return sessionStorage.getItem('garda_current_page') || 'landing';
  });

  useEffect(() => {
    sessionStorage.setItem('garda_current_page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (!user) return;

    const preloadData = async () => {
      console.log('Starting background preloading of master data for offline use...');
      try {
        if (navigator.onLine) {
          await syncImputationFromFirebase();
          console.log('✔ Imputation data preloaded and cached successfully');
        }
      } catch (err) {
        console.warn('Failed to preload imputation data:', err);
      }

      try {
        const classRef = collection(db, 'classifications');
        const qClass = query(classRef, orderBy('createdAt', 'desc'));
        await getDocs(qClass);
        console.log('✔ KBLI/KBJI classifications preloaded and cached in Firestore offline cache');
      } catch (err) {
        console.warn('Failed to preload classifications:', err);
      }

      try {
        const statsRef = collection(db, 'village_stats');
        await getDocs(query(statsRef, orderBy('village', 'asc')));

        const infraRef = collection(db, 'infrastructure_items');
        await getDocs(infraRef);
        console.log('✔ Village statistics and infrastructure directory preloaded and cached in Firestore offline cache');
      } catch (err) {
        console.warn('Failed to preload infrastructure / village stats:', err);
      }
    };

    // Preload after a slight delay to keep page load lightweight and snappy
    const timer = setTimeout(preloadData, 1000);
    return () => clearTimeout(timer);
  }, [user]);

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
      case 'social-phenomenon':
        return <SocialPhenomenonModule onBack={() => setCurrentPage('landing')} />;
      case 'building-area':
        if (user?.role === 'admin') {
          return <AdminBuildingDashboard onBack={() => setCurrentPage('landing')} />;
        }
        return <BuildingAreaModule onBack={() => setCurrentPage('landing')} />;
      case 'cerdas-form':
        return <CerdasModule onBack={() => setCurrentPage('landing')} />;
      case 'lms':
        return <LMSModule onBack={() => setCurrentPage('landing')} />;
      case 'admin-strategic-data':
        if (user?.role === 'admin') {
          return <AdminStrategicData onBack={() => setCurrentPage('landing')} />;
        }
        return <LandingPage onNavigate={setCurrentPage} />;
      case 'monitoring':
        return <MonitoringModule onBack={() => setCurrentPage('landing')} />;
      default:
        // Jika pengunjung, paksa tampilan Visitor Dashboard
        if (user.role === 'pengunjung') {
          return <VisitorDashboard />;
        }
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
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

