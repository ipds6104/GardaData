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
          <h1 className="text-slate-800 text-4xl md:text-5xl lg:text-6xl leading-tight font-serif font-semibold">
            Pusat Administrasi & Kualitas <br/>
            <span className="text-primary-500 font-serif italic">Data Lapangan</span>
          </h1>
          
          <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium max-w-md">
            Terus tingkatkan akurasi dan capai target pengumpulan data Anda dengan presisi tinggi melalui platform terintegrasi kami.
          </p>

          <div className="flex items-center gap-4 pt-4">
            <button className="bg-primary-500 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-all hover:scale-105 active:scale-95 cursor-pointer">
              Eksplorasi Fitur
            </button>
            <button className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-xl hover:scale-110 active:scale-95 cursor-pointer group">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 group-hover:text-primary-300 transition-colors"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
          </div>
        </div>

        {/* Right Column (Logo Image & Badges) */}
        <div className="relative z-10 w-full md:w-1/2 flex justify-center md:justify-end mt-16 md:mt-0">
          <div className="relative">
            {/* Soft backdrop glow behind the logo */}
            <div className="absolute inset-0 bg-primary-200 blur-3xl opacity-40 rounded-full w-full h-full transform scale-150"></div>
            
            <img 
              src="/logo.png" 
              alt="Garda Data Logo" 
              className="relative z-10 w-auto h-48 md:h-72 object-contain hover:scale-105 transition-transform duration-500 drop-shadow-2xl" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />

            {/* Decorative Glassmorphism floating badge like in the screenshot */}
            <div className="absolute -bottom-6 -left-6 md:-left-12 bg-white/80 backdrop-blur-md border border-white p-4 rounded-2xl shadow-xl flex items-center gap-4 z-20 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">100% Valid</p>
                <p className="text-[10px] text-slate-500 font-medium">Data Terverifikasi</p>
              </div>
            </div>
            
            {/* Circular badge top right like in the screenshot */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary-400 rounded-full flex flex-col items-center justify-center text-white shadow-lg z-20 transform rotate-12 hover:rotate-0 transition-transform cursor-default border-4 border-[#fef9f1]">
              <span className="text-[10px] font-bold leading-none uppercase tracking-widest opacity-90">Akurasi</span>
              <span className="text-lg font-black leading-tight">Tinggi</span>
            </div>
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
