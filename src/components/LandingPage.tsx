import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Ruler, Map, FileEdit, Users, TrendingUp, MonitorPlay, ArrowRight, Activity } from 'lucide-react';
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
      <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary-600 transition-colors leading-tight">
        {title}
      </h3>
    </div>
    <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
      {description}
    </p>
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-primary-600 transition-all mt-auto uppercase tracking-widest">
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
      {/* Hero Banner */}
      <div className="bg-[#fef9f1] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[400px] shadow-sm border border-orange-100/50">
        
        {/* Left Column (Text & Buttons) */}
        <div className="relative z-10 flex flex-col items-start text-left space-y-6 w-full md:w-1/2 max-w-xl mx-auto md:mx-0">
          <h1 className="text-slate-800 text-3xl md:text-4xl lg:text-5xl leading-tight font-serif font-semibold">
            Portal Integrasi Menjaga Kualitas Data & <br className="hidden md:block" />
            <span className="text-primary-500 font-serif italic">Akuntabilitas Proses Pendataan</span>
          </h1>
          
          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-md italic font-serif">
            "Kesempurnaan tidak datang dengan sendirinya. Kesempurnaan harus diupayakan." <br/>
            <span className="font-bold not-italic block mt-2 text-slate-700">- Prof. Dr. Ing. B.J. Habibie</span>
          </p>
        </div>

        {/* Right Column (Logo Image) */}
        <div className="relative z-10 w-full md:w-1/2 flex justify-center md:justify-end mt-12 md:mt-0">
          <div className="relative">
            {/* Soft backdrop glow behind the logo */}
            <div className="absolute inset-0 bg-primary-200 blur-3xl opacity-40 rounded-full w-full h-full transform scale-150"></div>
            
            <img 
              src="/logo.png" 
              alt="Garda Data Logo" 
              className="relative z-10 w-auto h-56 md:h-80 object-contain hover:scale-105 transition-transform duration-500 drop-shadow-2xl" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
          </div>
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
            <span className="w-1.5 h-6 bg-primary-600 rounded-full"></span>
            Pendataan Lapangan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Monitoring Dashboard"
              description="Pantau akumulasi progres lapangan, pencapaian target, dan performa petugas secara real-time."
              icon={Activity}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              onClick={() => onNavigate('monitoring')}
            />
            <FeatureCard
              title="Pengukuran Luas Bangunan"
              description="Kalkulator validasi luas atap bangunan berbasis citra satelit dan geospasial."
              icon={Ruler}
              iconColor="text-primary-600"
              bgColor="bg-primary-50"
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
              description="Dashboard indikator makro ekonomi, sosial, dan produksi daerah. (Masih dalam pengembangan)"
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
