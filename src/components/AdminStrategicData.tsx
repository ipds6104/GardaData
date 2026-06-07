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

  if (!data) return null;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        </div>
        
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
        >
          <Save className="w-5 h-5" />
          <span>Simpan Perubahan</span>
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="flex border-b border-slate-100 bg-slate-50">
          {[
            { id: 'ekonomi', label: 'Ekonomi & Keuangan' },
            { id: 'sosial', label: 'Sosial & Penduduk' },
            { id: 'naker', label: 'Ketenagakerjaan' },
            { id: 'produksi', label: 'Produksi & Riil' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-bold text-sm transition-all ${
                activeTab === tab.id 
                ? 'bg-white text-primary-600 border-t-2 border-primary-600' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-t-2 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 rounded-xl">
                {Object.keys(data[activeTab][0] || {}).map(key => (
                  <th key={key} className="p-4 font-bold text-slate-600 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data[activeTab].map((row: any, rowIndex: number) => (
                <tr key={rowIndex} className="border-b border-slate-50">
                  {Object.keys(row).map((key) => (
                    <td key={key} className="p-2">
                      <input
                        type="text"
                        value={row[key]}
                        onChange={(e) => handleCellChange(activeTab, rowIndex, key, e.target.value)}
                        className={`w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${key === 'year' ? 'bg-slate-50 font-bold' : ''}`}
                        readOnly={key === 'year'}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-slate-400 italic">* Anda hanya dapat memperbarui nilai data untuk 5 tahun terakhir. Format angka/teks bebas.</p>
        </div>
      </motion.div>
    </div>
  );
};
