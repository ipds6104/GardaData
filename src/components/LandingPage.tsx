import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Ruler, Map, FileEdit, Users, TrendingUp, MonitorPlay, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, iconColor, bgColor, onClick }) => (
  <motion.button
    whileHover={{ y: -4, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all text-left flex flex-col h-full cursor-pointer group"
  >
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 rounded-xl ${bgColor}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">
        {title}
      </h3>
    </div>
    <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
      {description}
    </p>
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-all mt-auto uppercase tracking-widest">
      <span>Buka Aplikasi</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </motion.button>
);

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Hero Banner (GOJAGS Style) */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start justify-between min-h-[280px]">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-400 opacity-20 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 space-y-4 max-w-2xl text-center md:text-left">
          <p className="text-blue-100 font-bold tracking-widest text-sm uppercase">SELAMAT DATANG DI GARDA DATA</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {user?.username || 'Pengguna'}, <span className="text-blue-200">{user?.role === 'admin' ? 'S.Tr.Stat' : 'BPS'}</span>
          </h1>
          <p className="text-blue-100/90 text-sm md:text-base leading-relaxed max-w-xl font-medium pt-2">
            Pusat administrasi dan kualitas data lapangan yang terintegrasi. Terus tingkatkan akurasi dan capai target pengumpulan data Anda dengan presisi tinggi melalui platform Garda Data!
          </p>
        </div>

        {/* Illustration placeholder (similar to Gojags) */}
        <div className="relative z-10 hidden md:block shrink-0 mt-8 md:mt-0">
           <img src="/logo.png" alt="Illustration" className="w-48 h-48 object-contain opacity-80 mix-blend-screen drop-shadow-2xl" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="w-40 h-40 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20 flex items-center justify-center"><svg class="w-20 h-20 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>';
           }} />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-10 pt-4">
        
        {/* Kategori: Pelatihan */}
        <div>
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
            Pelatihan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Learning Management System"
              description="Pusat materi, jadwal, instrumen dan kuis pelatihan petugas pendataan yang terstruktur."
              icon={MonitorPlay}
              iconColor="text-sky-600"
              bgColor="bg-sky-50"
              onClick={() => onNavigate('lms')}
            />
          </div>
        </div>

        {/* Kategori: Pendataan Lapangan */}
        <div>
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            Pendataan Lapangan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Pengukuran Luas Bangunan"
              description="Kalkulator validasi luas atap bangunan berbasis citra satelit dan geospasial."
              icon={Ruler}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
              onClick={() => onNavigate('building-area')}
            />
            <FeatureCard
              title="Laporan Pendataan"
              description="Aplikasi pelaporan dan monitoring progres pendataan lapangan secara real-time."
              icon={FileEdit}
              iconColor="text-indigo-600"
              bgColor="bg-indigo-50"
              onClick={() => onNavigate('cerdas-form')}
            />
            <FeatureCard
              title="KBLI 2025 & KBJI 2014"
              description="Akses cepat klasifikasi KBLI 2025 dan KBJI untuk penentuan kode yang akurat."
              icon={BookOpen}
              iconColor="text-primary-600"
              bgColor="bg-primary-50"
              onClick={() => onNavigate('kbli-kbji')}
            />
            <FeatureCard
              title="Imputasi Susenas-Seruti"
              description="Mesin pencari cerdas untuk panduan nilai imputasi lapangan secara instan."
              icon={FileEdit}
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
              onClick={() => onNavigate('imputation')}
            />
            <FeatureCard
              title="Infrastruktur Desa"
              description="Monitoring dan update data infrastruktur pendukung desa secara real-time."
              icon={Map}
              iconColor="text-accent-600"
              bgColor="bg-accent-50"
              onClick={() => onNavigate('infrastructure')}
            />
          </div>
        </div>

        {/* Kategori: Analisis dan Diseminasi */}
        <div>
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
            Analisis dan Diseminasi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Fenomena Sosial Ekonomi"
              description="Modul pemantauan, analisis, dan pencatatan dinamika fenomena sosial ekonomi."
              icon={Users}
              iconColor="text-rose-600"
              bgColor="bg-rose-50"
              onClick={() => onNavigate('social-phenomenon')}
            />
            <FeatureCard
              title="Data Strategis BPS"
              description="Dashboard indikator makro ekonomi, sosial, dan produksi daerah."
              icon={TrendingUp}
              iconColor="text-amber-600"
              bgColor="bg-amber-50"
              onClick={() => onNavigate('admin-strategic-data')}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
