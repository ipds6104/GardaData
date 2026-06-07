import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Users, Briefcase, Factory, BarChart3, ChevronRight, Download, Activity } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const categories = [
  { id: 'ekonomi', label: 'Indikator Ekonomi & Keuangan Daerah', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'sosial', label: 'Sosial, Kependudukan, & Kemiskinan', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'naker', label: 'Indikator Ketenagakerjaan', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'produksi', label: 'Indikator Produksi & Sektor Riil', icon: Factory, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export const VisitorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState(categories[0].id);

  // Mocked Data, in a real app this would come from a backend or local state managed by Admin
  const data = JSON.parse(localStorage.getItem('garda_strategic_data') || 'null') || {
    ekonomi: [
      { year: 2023, pdrbADHK: '4.5%', pdrbADHB: 'Rp 12.5T', pdrbKapita: 'Rp 45 Juta', pad: 'Rp 300M' },
      { year: 2022, pdrbADHK: '4.2%', pdrbADHB: 'Rp 11.8T', pdrbKapita: 'Rp 43 Juta', pad: 'Rp 280M' },
      { year: 2021, pdrbADHK: '3.8%', pdrbADHB: 'Rp 11.2T', pdrbKapita: 'Rp 40 Juta', pad: 'Rp 250M' },
      { year: 2020, pdrbADHK: '-1.5%', pdrbADHB: 'Rp 10.5T', pdrbKapita: 'Rp 38 Juta', pad: 'Rp 210M' },
      { year: 2019, pdrbADHK: '5.1%', pdrbADHB: 'Rp 10.8T', pdrbKapita: 'Rp 39 Juta', pad: 'Rp 270M' },
    ],
    sosial: [
      { year: 2023, ipm: 68.5, kemiskinan: '4.2%', gini: 0.312, penduduk: '312.450 Jiwa' },
      { year: 2022, ipm: 67.9, kemiskinan: '4.5%', gini: 0.315, penduduk: '308.210 Jiwa' },
      { year: 2021, ipm: 67.4, kemiskinan: '5.1%', gini: 0.318, penduduk: '304.500 Jiwa' },
      { year: 2020, ipm: 67.0, kemiskinan: '5.5%', gini: 0.320, penduduk: '301.200 Jiwa' },
      { year: 2019, ipm: 66.8, kemiskinan: '4.8%', gini: 0.310, penduduk: '298.100 Jiwa' },
    ],
    naker: [
      { year: 2023, tpt: '5.2%', tpak: '65.4%', angkatanKerja: '150.200', pekerja: '142.300' },
      { year: 2022, tpt: '5.8%', tpak: '64.8%', angkatanKerja: '148.500', pekerja: '139.800' },
      { year: 2021, tpt: '6.5%', tpak: '64.2%', angkatanKerja: '145.200', pekerja: '135.700' },
      { year: 2020, tpt: '7.2%', tpak: '63.5%', angkatanKerja: '142.100', pekerja: '131.800' },
      { year: 2019, tpt: '4.9%', tpak: '66.1%', angkatanKerja: '140.500', pekerja: '133.600' },
    ],
    produksi: [
      { year: 2023, padi: '45.200 Ton', sawit: '120.500 Ton', wisatawan: '25.400', industri: '1.250 Unit' },
      { year: 2022, padi: '44.800 Ton', sawit: '118.200 Ton', wisatawan: '20.100', industri: '1.210 Unit' },
      { year: 2021, padi: '43.500 Ton', sawit: '115.000 Ton', wisatawan: '12.500', industri: '1.180 Unit' },
      { year: 2020, padi: '42.100 Ton', sawit: '110.500 Ton', wisatawan: '5.200', industri: '1.150 Unit' },
      { year: 2019, padi: '46.500 Ton', sawit: '105.200 Ton', wisatawan: '28.900', industri: '1.100 Unit' },
    ]
  };

  const currentData = data[activeCategory] || [];

  // Helper untuk mengekstrak angka dari string (contoh: "Rp 12.5T" -> 12.5)
  const parseToNumber = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const match = String(val).match(/[-+]?[0-9]*\.?[0-9]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Menyiapkan data untuk grafik dan diurutkan dari tahun terkecil ke terbesar
  const chartData = [...currentData].sort((a, b) => a.year - b.year).map(row => {
    const newRow: any = { year: row.year };
    Object.keys(row).filter(k => k !== 'year').forEach(k => {
      newRow[k] = parseToNumber(row[k]);
    });
    return newRow;
  });

  // Mengambil 2 metrik pertama untuk ditampilkan di grafik
  const availableKeys = Object.keys(currentData[0] || {}).filter(k => k !== 'year');
  const primaryKey = availableKeys[0];
  const secondaryKey = availableKeys[1];

  return (
    <div className="space-y-8 min-h-[85vh] bg-slate-50/50 pb-12">
      <header className="relative bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-primary-400 opacity-10 blur-[60px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-primary-100 text-sm font-bold border border-white/10">
              <BarChart3 className="w-4 h-4" />
              <span>Data Strategis Terbuka</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Dashboard Statistik <br />
              <span className="text-primary-300">Kabupaten Mempawah</span>
            </h1>
            <p className="text-primary-100/80 text-lg font-medium max-w-xl">
              Akses cepat dan transparan ke indikator makro pembangunan daerah selama 5 tahun terakhir.
            </p>
          </div>
          
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-lg">
            <Download className="w-5 h-5" />
            Unduh Laporan PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                activeCategory === cat.id 
                  ? 'bg-white shadow-xl shadow-slate-200/50 border border-slate-100 scale-[1.02]' 
                  : 'hover:bg-white hover:shadow-md border border-transparent text-slate-500'
              }`}
            >
              <div className={`p-3 rounded-xl ${activeCategory === cat.id ? cat.bg : 'bg-slate-100'}`}>
                <cat.icon className={`w-6 h-6 ${activeCategory === cat.id ? cat.color : 'text-slate-400'}`} />
              </div>
              <div className="text-left flex-1">
                <div className={`font-bold text-sm ${activeCategory === cat.id ? 'text-slate-900' : ''}`}>
                  {cat.label}
                </div>
              </div>
              {activeCategory === cat.id && <ChevronRight className="w-5 h-5 text-slate-300" />}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 overflow-x-auto"
            >
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-800">
                    {categories.find(c => c.id === activeCategory)?.label}
                  </h2>
                </div>
              </div>

              {/* Grafik Modern */}
              <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-slate-700">Tren 5 Tahun Terakhir</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="year" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontWeight: 600 }} 
                        dy={10}
                      />
                      <YAxis 
                        yAxisId="left"
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                      />
                      {secondaryKey && (
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }} 
                        />
                      )}
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 600 }} />
                      
                      {primaryKey && (
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          name={primaryKey.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                          dataKey={primaryKey} 
                          stroke="#2563eb" 
                          strokeWidth={4}
                          dot={{ r: 6, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }}
                          activeDot={{ r: 8 }}
                        />
                      )}
                      {secondaryKey && (
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          name={secondaryKey.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                          dataKey={secondaryKey} 
                          stroke="#f59e0b" 
                          strokeWidth={4}
                          dot={{ r: 6, fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 2 }}
                          activeDot={{ r: 8 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="min-w-[800px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 rounded-xl">
                      <th className="p-4 font-bold text-slate-600 rounded-l-xl">Tahun</th>
                      {Object.keys(currentData[0] || {}).filter(k => k !== 'year').map(key => (
                        <th key={key} className="p-4 font-bold text-slate-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((row: any, i: number) => (
                      <tr key={row.year} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-black text-slate-800">{row.year}</td>
                        {Object.entries(row).filter(([k]) => k !== 'year').map(([k, val]) => (
                          <td key={k} className="p-4 text-slate-600 font-medium">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
