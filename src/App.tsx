/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { Loader2, ScanLine, Award } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
const ClassificationModule = lazy(() => import('./components/ClassificationModule').then(m => ({ default: m.ClassificationModule })));
const InfrastructureModule = lazy(() => import('./components/InfrastructureModule').then(m => ({ default: m.InfrastructureModule })));
const BuildingAreaModule = lazy(() => import('./components/BuildingAreaModule').then(m => ({ default: m.BuildingAreaModule })));
const AdminBuildingDashboard = lazy(() => import('./components/AdminBuildingDashboard').then(m => ({ default: m.AdminBuildingDashboard })));
const ImputationModule = lazy(() => import('./components/imputation/ImputationModule').then(m => ({ default: m.ImputationModule })));
const SocialPhenomenonModule = lazy(() => import('./components/SocialPhenomenonModule').then(m => ({ default: m.SocialPhenomenonModule })));
const CerdasModule = lazy(() => import('./components/CerdasModule').then(m => ({ default: m.CerdasModule })));
const VisitorDashboard = lazy(() => import('./components/VisitorDashboard').then(m => ({ default: m.VisitorDashboard })));
const AdminStrategicData = lazy(() => import('./components/AdminStrategicData').then(m => ({ default: m.AdminStrategicData })));
const LMSModule = lazy(() => import('./components/LMSModule').then(m => ({ default: m.LMSModule })));
const MonitoringModule = lazy(() => import('./components/monitoring/MonitoringModule').then(m => ({ default: m.MonitoringModule })));
const AdminSLSDashboard = lazy(() => import('./components/sls/AdminSLSDashboard').then(m => ({ default: m.AdminSLSDashboard })));
const PenilaianMitraModule = lazy(() => import('./components/mitra/PenilaianMitraModule').then(m => ({ default: m.PenilaianMitraModule })));
import { Login } from './components/Login';
import { syncImputationFromFirebase } from './services/imputationService';

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
          console.log('\u2714 Imputation data preloaded and cached successfully');
        }
      } catch (err) {
        console.warn('Failed to preload imputation data:', err);
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
        return <AdminStrategicData onBack={() => setCurrentPage('landing')} />;
      case 'monitoring':
        return <MonitoringModule onBack={() => setCurrentPage('landing')} />;
      case 'admin-sls':
        if (user?.role !== 'admin') {
          return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Akses Ditolak</h2>
              <p className="text-sm text-slate-500 mt-2">Halaman Peta Batas SLS hanya dapat diakses oleh Administrator.</p>
              <button 
                onClick={() => setCurrentPage('landing')} 
                className="mt-4 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Kembali ke Beranda
              </button>
            </div>
          );
        }
        return <AdminSLSDashboard onBack={() => setCurrentPage('landing')} />;
      case 'identifikasi-sls':
        return (
          <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <ScanLine className="w-8 h-8" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 uppercase tracking-wide mb-3">
              Fitur Masih Pengembangan
            </span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
              Identifikasi SLS
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto mb-6">
              Fitur identifikasi, verifikasi, dan pemantauan kondisi batas SLS di lapangan sedang dalam proses pengembangan oleh tim BPS Kabupaten Mempawah.
            </p>
            <button
              onClick={() => setCurrentPage('landing')}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
            >
              Kembali ke Beranda
            </button>
          </div>
        );
      case 'penilaian-mitra':
        if (user?.role !== 'admin') {
          return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Akses Ditolak</h2>
              <p className="text-sm text-slate-500 mt-2">Halaman Penilaian Kinerja Mitra hanya dapat diakses oleh Administrator.</p>
              <button 
                onClick={() => setCurrentPage('landing')} 
                className="mt-4 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Kembali ke Beranda
              </button>
            </div>
          );
        }
        return <PenilaianMitraModule onBack={() => setCurrentPage('landing')} />;
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
      <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
}

import { ThemeProvider } from './lib/theme';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

