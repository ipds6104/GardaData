import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Ruler, Map, ShieldCheck, ArrowRight, CheckCircle2, FileEdit, Users, Sprout, TrendingUp } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  onClick: () => void;
  disabled?: boolean;
  buttonTextColor?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, iconColor, bgColor, onClick, disabled, buttonTextColor }) => (
  <motion.button
    whileHover={disabled ? {} : { y: -8, scale: 1.02 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    onClick={onClick}
    disabled={disabled}
    className={`relative group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col h-full ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-2xl hover:shadow-slate-200/50 cursor-pointer'
    }`}
  >
    <div className={`p-4 rounded-2xl w-fit mb-6 ${bgColor}`}>
      <Icon className={`w-8 h-8 ${iconColor}`} />
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
      {title}
    </h3>
    <p className="text-slate-500 leading-relaxed mb-8 flex-grow">
      {description}
    </p>
    {!disabled && (
      <div className={`flex items-center gap-2 font-bold group-hover:gap-4 transition-all ${buttonTextColor || 'text-primary-600'}`}>
        <span>Buka Fitur</span>
        <ArrowRight className="w-5 h-5" />
      </div>
    )}
    {disabled && (
      <div className="inline-flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100 w-fit mt-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Masih dalam pengembangan</span>
      </div>
    )}
  </motion.button>
);

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 py-8">
      <header className="text-center space-y-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-bold"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>V1.0 Garda Data</span>
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-tight">
          Garda <span className="text-primary-500">Data</span>
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium">
          Satu platform terpadu untuk memudahkan petugas lapangan menjaga akurasi dan kualitas pendataan melalui sistem validasi dan pengukuran yang presisi.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        <FeatureCard
          title="KBLI & KBJI"
          description="Akses cepat klasifikasi KBLI 2025 dan KBJI untuk penentuan kode lapangan usaha dan jabatan yang akurat."
          icon={BookOpen}
          iconColor="text-primary-600"
          bgColor="bg-primary-50"
          onClick={() => onNavigate('kbli-kbji')}
        />
        <FeatureCard
          title="Luas Bangunan"
          description="Kalkulator validasi luas bangunan berdasarkan parameter teknis untuk menghindari anomali data lapangan."
          icon={Ruler}
          iconColor="text-secondary-600"
          bgColor="bg-secondary-50"
          onClick={() => onNavigate('building-area')}
        />
        <FeatureCard
          title="Infrastruktur Desa"
          description="Monitoring dan update data infrastruktur pendukung desa secara real-time untuk pemetaan yang presisi."
          icon={Map}
          iconColor="text-accent-600"
          bgColor="bg-accent-50"
          onClick={() => onNavigate('infrastructure')}
        />
        <FeatureCard
          title="Imputasi Susenas-Seruti"
          description="Mesin pencari cerdas untuk panduan nilai imputasi lapangan secara instan dan bebas typo."
          icon={FileEdit}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          onClick={() => onNavigate('imputation')}
        />
        <FeatureCard
          title="Fenomena Sosial Ekonomi"
          description="Modul pemantauan, analisis, dan pencatatan dinamika fenomena sosial ekonomi masyarakat secara terstruktur."
          icon={Users}
          iconColor="text-rose-600"
          bgColor="bg-rose-50"
          onClick={() => onNavigate('social-phenomenon')}
        />
        <FeatureCard
          title="Sektor Pertanian"
          description="Direktori data komoditas unggulan, luas lahan tanam, dan produktivitas pertanian secara berkala."
          icon={Sprout}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          disabled={true}
          onClick={() => {}}
        />
        <FeatureCard
          title="Ekonomi & Pembangunan"
          description="Indikator makro ekonomi, perkembangan industri daerah, dan status kemajuan infrastruktur."
          icon={TrendingUp}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
          disabled={true}
          onClick={() => {}}
        />
      </div>

      <section className="bg-white border border-slate-100 shadow-xl rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-50 opacity-40 blur-[100px] -rotate-12 translate-x-1/2" />
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-slate-900">Tentang Garda Data</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Map className="w-6 h-6 text-primary-500 shrink-0" />
                <div className="text-sm font-bold text-slate-700">Pemetaan Titik Lokasi</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-secondary-500 shrink-0" />
                <div className="text-sm font-bold text-slate-700">Monitor Infrastruktur</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-purple-500 shrink-0" />
                <div className="text-sm font-bold text-slate-700">Referensi Imputasi</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Ruler className="w-6 h-6 text-accent-600 shrink-0" />
                <div className="text-sm font-bold text-slate-700">Akurasi Lapangan</div>
              </div>
            </div>
          </div>
          <div className="text-slate-600 space-y-6">
            <p className="text-lg leading-relaxed">
              <strong className="text-slate-900">Garda Data</strong> adalah ekosistem digital inovatif yang dirancang khusus untuk menjadi pendamping andal bagi para petugas pendataan di lapangan. Aplikasi ini hadir untuk menyederhanakan proses survei sekaligus memastikan setiap informasi yang dikumpulkan memiliki kualitas dan presisi tinggi sejak dari tahap awal.
            </p>
            <p className="text-lg leading-relaxed">
              Mulai dari pencarian cerdas klasifikasi ekonomi (KBLI & KBJI), kalkulator luas lantai bangunan berbasis citra satelit, direktori infrastruktur desa yang terintegrasi dengan Google Maps, hingga mesin referensi cerdas untuk imputasi Susenas-Seruti—semuanya dirangkai untuk memperlancar alur kerja Anda dan menghadirkan potret statistik yang benar-benar akurat.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
