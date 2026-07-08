import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Database, Activity, Calendar } from 'lucide-react';
import { MonitoringConfig, ICON_MAP } from './AdminMonitoring';

interface MonitoringListProps {
  onNavigateToDashboard: (config: MonitoringConfig) => void;
}

const getThemeClasses = (color?: string) => {
  const c = color || 'emerald';
  return {
    bg: `bg-${c}-50`,
    border: `border-${c}-200`,
    textTitle: `text-${c}-900`,
    textMuted: `text-${c}-700`,
    iconBg: 'bg-white',
    iconText: `text-${c}-800`,
    badgeText: `text-${c}-800`,
    hover: `hover:shadow-${c}-100 hover:border-${c}-300`,
    watermark: `text-${c}-900`
  };
};

export const MonitoringList: React.FC<MonitoringListProps> = ({ onNavigateToDashboard }) => {
  const [configs, setConfigs] = useState<MonitoringConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const baseUrl = (import.meta as any).env.VITE_API_URL || '';
        const res = await fetch(`${baseUrl}/api/monitoring/configs`);
        if (res.ok) {
          const data: MonitoringConfig[] = await res.json();
          setConfigs(data.filter(d => Boolean(d.isActive)));
        }
      } catch (err) {
        console.error('Error fetching monitoring configs:', err);
      }
      setLoading(false);
    };
    fetchConfigs();
  }, []);

  // Group by Kegiatan
  const grouped = configs.reduce((acc, curr) => {
    if (!acc[curr.kegiatan]) acc[curr.kegiatan] = [];
    acc[curr.kegiatan].push(curr);
    return acc;
  }, {} as Record<string, MonitoringConfig[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Activity className="w-8 h-8 text-primary-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Monitoring Dashboard</h1>
          <p className="text-indigo-100 max-w-xl text-lg font-medium">Pantau akumulasi progres lapangan, pencapaian target, dan performa petugas secara real-time.</p>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium text-lg">Belum ada monitoring yang aktif.</p>
        </div>
      ) : (
        (Object.entries(grouped) as [string, MonitoringConfig[]][]).map(([kegiatan, items]) => (
          <div key={kegiatan} className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-2 h-6 bg-primary-500 rounded-full"></div>
              {kegiatan}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => {
                const theme = getThemeClasses(item.color);
                const Icon = item.icon && ICON_MAP[item.icon] ? ICON_MAP[item.icon] : Activity;
                const startDateStr = new Date(item.startDate).toLocaleDateString('id-ID', { day: 'numeric' });
                const endDateStr = new Date(item.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigateToDashboard(item)}
                    className={`${theme.bg} ${theme.border} border-2 rounded-[2rem] p-6 text-left flex flex-col group h-full cursor-pointer relative overflow-hidden transition-all shadow-sm ${theme.hover}`}
                  >
                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className={`p-4 ${theme.iconBg} rounded-2xl shadow-sm`}>
                        <Icon className={`w-8 h-8 ${theme.iconText}`} strokeWidth={2.5} />
                      </div>
                      <div className={`px-3 py-1 bg-white rounded-full text-[10px] font-black tracking-widest ${theme.badgeText} shadow-sm`}>
                        AKTIF
                      </div>
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className={`font-black ${theme.textTitle} text-xl leading-tight mb-3`}>
                        {item.subKegiatan || item.kegiatan}
                      </h3>
                      <div className={`flex items-center gap-2 text-sm font-bold ${theme.textMuted} uppercase tracking-wider`}>
                        <Calendar className="w-4 h-4" />
                        <span>{startDateStr}-{endDateStr}</span>
                      </div>
                    </div>

                    <Icon className={`absolute -right-4 -bottom-4 w-40 h-40 opacity-[0.04] ${theme.watermark} -rotate-12`} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
