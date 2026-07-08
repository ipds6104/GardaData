import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, ChevronLeft, BarChart3 } from 'lucide-react';

interface AdminStrategicDataProps {
  onBack: () => void;
}

const defaultData = {
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

export const AdminStrategicData: React.FC<AdminStrategicDataProps> = ({ onBack }) => {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('ekonomi');

  useEffect(() => {
    const saved = localStorage.getItem('garda_strategic_data');
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData(defaultData);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('garda_strategic_data', JSON.stringify(data));
    alert('Data Strategis berhasil diperbarui!');
  };

  const handleCellChange = (tab: string, rowIndex: number, key: string, value: string) => {
    const newData = { ...data };
    newData[tab][rowIndex][key] = value;
    setData(newData);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Update Data Strategis</h1>
          <p className="text-slate-500 font-medium">Pengelolaan Dashboard Pengunjung</p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl p-16 text-center"
      >
        <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Fitur Masih Dalam Pengembangan</h2>
        <p className="text-slate-500 font-medium max-w-lg mx-auto">
          Mohon maaf, fitur pengelolaan dan penayangan Data Strategis BPS sedang dalam tahap penyempurnaan. Silakan cek kembali di pembaruan sistem berikutnya.
        </p>
      </motion.div>
    </div>
  );
};
