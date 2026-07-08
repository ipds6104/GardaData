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

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-16 text-center mt-12 max-w-4xl mx-auto">
        <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Fitur Masih Dalam Pengembangan</h2>
        <p className="text-slate-500 font-medium max-w-lg mx-auto">
          Mohon maaf, fitur penayangan Data Strategis BPS sedang dalam tahap penyempurnaan dan belum dapat diakses untuk sementara waktu. Silakan cek kembali di waktu mendatang.
        </p>
      </div>
    </div>
  );
};
