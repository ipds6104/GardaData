import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, Loader2, ArrowUpCircle, CheckCircle2, AlertCircle, Clock, Target, Star, BarChart3, TrendingUp, Users, MapPin, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { MonitoringConfig } from './AdminMonitoring';
import { parseMonitoringSheet, MonitoringRow } from '../../services/monitoringParser';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

interface MonitoringDashboardProps {
  config: MonitoringConfig;
  onBack: () => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ config, onBack }) => {
  const [data, setData] = useState<MonitoringRow[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [kecamatanFilter, setKecamatanFilter] = useState<string>('ALL');
  const [desaFilter, setDesaFilter] = useState<string>('ALL');
  const [slsFilter, setSlsFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const parsed = await parseMonitoringSheet(config.sheetUrl, config.sheetName);
        if (!active) return;
        setData(parsed);

        // Fetch snapshots
        const baseUrl = (import.meta as any).env.VITE_API_URL || '';
        const res = await fetch(`${baseUrl}/api/monitoring/snapshots/${config.id}`);
        if (res.ok) {
          const snaps = await res.json();
          if (active) setSnapshots(snaps);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
      if (active) setLoading(false);
    };
    loadData();
    return () => { active = false; };
  }, [config]);

  // Derived Data & KPIs
  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchKec = kecamatanFilter === 'ALL' || d.kecamatan === kecamatanFilter;
      const matchDesa = desaFilter === 'ALL' || d.desa === desaFilter;
      const matchSls = slsFilter === 'ALL' || d.sls === slsFilter;
      const matchSearch = !searchQuery || 
                          d.namaPpl.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.namaPml.toLowerCase().includes(searchQuery.toLowerCase());
      return matchKec && matchDesa && matchSls && matchSearch;
    });
  }, [data, kecamatanFilter, desaFilter, slsFilter, searchQuery]);

  const uniqueKecamatan = useMemo(() => ['ALL', ...new Set(data.map(d => d.kecamatan).filter(Boolean))], [data]);
  const uniqueDesa = useMemo(() => {
    let filtered = data;
    if (kecamatanFilter !== 'ALL') filtered = filtered.filter(d => d.kecamatan === kecamatanFilter);
    return ['ALL', ...new Set(filtered.map(d => d.desa).filter(Boolean))];
  }, [data, kecamatanFilter]);
  const uniqueSls = useMemo(() => {
    let filtered = data;
    if (desaFilter !== 'ALL') filtered = filtered.filter(d => d.desa === desaFilter);
    return ['ALL', ...new Set(filtered.map(d => d.sls).filter(Boolean))];
  }, [data, desaFilter]);

  const totalTarget = filteredData.reduce((acc, curr) => acc + curr.target, 0);
  const totalSubmit = filteredData.reduce((acc, curr) => acc + curr.totalSubmit, 0);
  const totalDraft = filteredData.reduce((acc, curr) => acc + curr.draft, 0);
  const progressPct = totalTarget > 0 ? ((totalSubmit / totalTarget) * 100).toFixed(1) : '0';

  const sisaHariKerja = useMemo(() => {
    const end = new Date(config.endDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [config.endDate]);

  // PPL Leaderboard
  const pplStats = useMemo(() => {
    const stats: Record<string, { submit: number, draft: number, target: number, pml: string }> = {};
    filteredData.forEach(d => {
      if (!d.namaPpl) return;
      if (!stats[d.namaPpl]) stats[d.namaPpl] = { submit: 0, draft: 0, target: 0, pml: d.namaPml };
      stats[d.namaPpl].submit += d.totalSubmit;
      stats[d.namaPpl].draft += d.draft;
      stats[d.namaPpl].target += d.target;
    });
    return Object.entries(stats).map(([name, vals]) => ({ name, ...vals })).sort((a, b) => b.submit - a.submit);
  }, [filteredData]);

  // Line Chart Data
  const lineChartData = useMemo(() => {
    if (snapshots.length === 0) return [];
    const sorted = [...snapshots].sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
    
    let prevSubmit = 0;
    return sorted.map((snap) => {
      const currentSubmit = snap.totalSubmit || 0;
      const dailySubmit = Math.max(0, currentSubmit - prevSubmit);
      prevSubmit = currentSubmit;
      return {
        date: snap.snapshotDate,
        "Penambahan Harian": dailySubmit,
        "Akumulasi": currentSubmit
      };
    });
  }, [snapshots]);

  // Geographical Bar Chart
  const geoChartData = useMemo(() => {
    const stats: Record<string, { name: string, submit: number, target: number }> = {};
    const grouping = kecamatanFilter === 'ALL' ? 'kecamatan' : (desaFilter === 'ALL' ? 'desa' : 'sls');
    
    filteredData.forEach(d => {
      const key = d[grouping as keyof MonitoringRow] as string;
      if (!key) return;
      if (!stats[key]) stats[key] = { name: key, submit: 0, target: 0 };
      stats[key].submit += d.totalSubmit;
      stats[key].target += d.target;
    });
    return Object.values(stats).sort((a, b) => b.submit - a.submit);
  }, [filteredData, kecamatanFilter, desaFilter]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Menarik data langsung dari Google Sheets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{config.kegiatan}</h1>
            <p className="text-sm text-slate-500 font-medium">{config.subKegiatan || "Monitoring Interaktif"}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold">Live Terhubung</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Data dari: {config.sheetName || "Sheet 1"}</p>
        </div>
      </div>

      {/* KPI Cards like Prasasti */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-emerald-50">
            <CheckCircle2 className="w-32 h-32" />
          </div>
          <div className="relative">
            <p className="text-sm font-bold text-slate-500 mb-1">Total Submit</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-slate-800">{totalSubmit.toLocaleString()}</h3>
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              <ArrowUpCircle className="w-3 h-3" /> Tersimpan di sistem
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-amber-50">
            <AlertCircle className="w-32 h-32" />
          </div>
          <div className="relative">
            <p className="text-sm font-bold text-slate-500 mb-1">Total Draft</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-slate-800">{totalDraft.toLocaleString()}</h3>
            </div>
            <p className="text-xs text-amber-600 font-semibold mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Belum di-submit
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white">
          <div className="absolute -right-6 -top-6 text-indigo-100/50">
            <Target className="w-32 h-32" />
          </div>
          <div className="relative">
            <p className="text-sm font-bold text-indigo-600 mb-1">Akumulasi Progres</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-indigo-900">{progressPct}%</h3>
            </div>
            <div className="w-full bg-indigo-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Number(progressPct))}%` }} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800 p-6 rounded-3xl shadow-sm relative overflow-hidden text-white">
          <div className="absolute -right-6 -top-6 text-slate-700">
            <Clock className="w-32 h-32" />
          </div>
          <div className="relative">
            <p className="text-sm font-bold text-slate-400 mb-1">Sisa Hari Kerja</p>
            <div className="flex items-end gap-2">
              <h3 className="text-4xl font-black text-white">{sisaHariKerja}</h3>
              <span className="text-slate-400 font-medium mb-1">Hari</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-2">
              Tenggat: {new Date(config.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Tren Progres Harian
              </h2>
              <p className="text-xs text-slate-500">Berdasarkan data snapshot dari server</p>
            </div>
          </div>
          <div className="h-[300px]">
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineChartData}>
                  <defs>
                    <linearGradient id="colorSubmit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Akumulasi" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSubmit)" />
                  <Line type="monotone" dataKey="Penambahan Harian" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Belum ada data snapshot harian</p>
              </div>
            )}
          </div>
        </div>

        {/* Bintang Petugas / Leaderboard */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Bintang Petugas
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {pplStats.slice(0, 5).map((ppl, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{ppl.name}</p>
                  <p className="text-xs text-slate-500 truncate">PML: {ppl.pml}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600">{ppl.submit}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Submit</p>
                </div>
              </div>
            ))}
            {pplStats.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-10">Belum ada data progres PPL.</p>
            )}
          </div>
        </div>
      </div>

      {/* Geographic & Filter Area */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-500" />
            Progres Menurut Geografis
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={kecamatanFilter}
                onChange={e => { setKecamatanFilter(e.target.value); setDesaFilter('ALL'); setSlsFilter('ALL'); }}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              >
                {uniqueKecamatan.map(k => <option key={k} value={k}>{k === 'ALL' ? 'Semua Kecamatan' : k}</option>)}
              </select>
            </div>
            
            <select 
              value={desaFilter}
              onChange={e => { setDesaFilter(e.target.value); setSlsFilter('ALL'); }}
              disabled={kecamatanFilter === 'ALL'}
              className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none disabled:opacity-50"
            >
              {uniqueDesa.map(d => <option key={d} value={d}>{d === 'ALL' ? 'Semua Desa' : d}</option>)}
            </select>

            <select 
              value={slsFilter}
              onChange={e => setSlsFilter(e.target.value)}
              disabled={desaFilter === 'ALL'}
              className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none disabled:opacity-50"
            >
              {uniqueSls.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Semua SLS/Wilayah Kerja' : s}</option>)}
            </select>
          </div>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={geoChartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} angle={-45} textAnchor="end" height={60} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <RechartsTooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="submit" name="Submit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table PPL */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Akumulasi Progres Petugas
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Cari nama PPL atau PML..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">Nama PPL</th>
                <th className="px-6 py-4">Nama PML</th>
                <th className="px-6 py-4 text-center">Target</th>
                <th className="px-6 py-4 text-center">Submit</th>
                <th className="px-6 py-4 text-center">Draft</th>
                <th className="px-6 py-4 text-right">Progres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pplStats.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.pml.toLowerCase().includes(searchQuery.toLowerCase())).map((ppl, idx) => {
                const pct = ppl.target > 0 ? ((ppl.submit / ppl.target) * 100).toFixed(1) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{ppl.name}</td>
                    <td className="px-6 py-4 text-slate-500">{ppl.pml}</td>
                    <td className="px-6 py-4 text-center font-medium">{ppl.target}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{ppl.submit}</td>
                    <td className="px-6 py-4 text-center text-amber-600">{ppl.draft}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-slate-700">{pct}%</span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Number(pct))}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pplStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
