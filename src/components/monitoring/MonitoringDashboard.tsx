import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, Loader2, ArrowUpCircle, CheckCircle2, AlertCircle, Clock, Target, Star, BarChart3, TrendingUp, Users, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { MonitoringConfig } from './AdminMonitoring';
import { parseMonitoringSheet, MonitoringRow } from '../../services/monitoringParser';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
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
  const [kecamatanFilter, setKecamatanFilter] = useState<string>('Semua Kecamatan');
  const [desaFilter, setDesaFilter] = useState<string>('Semua Desa');

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
        console.error('Error fetching dashboard data:', err);
      }
      if (active) setLoading(false);
    };
    loadData();
    return () => { active = false; };
  }, [config]);

  // Derived Data & KPIs
  const filteredData = useMemo(() => {
    return data.filter(d => 
      (kecamatanFilter === 'Semua Kecamatan' || d.kecamatan === kecamatanFilter) &&
      (desaFilter === 'Semua Desa' || d.desa === desaFilter)
    );
  }, [data, kecamatanFilter, desaFilter]);

  const uniqueKecamatan = useMemo(() => ['Semua Kecamatan', ...new Set(data.map(d => d.kecamatan).filter(Boolean))], [data]);
  const uniqueDesa = useMemo(() => {
    if (kecamatanFilter === 'Semua Kecamatan') return ['Semua Desa', ...new Set(data.map(d => d.desa).filter(Boolean))];
    return ['Semua Desa', ...new Set(data.filter(d => d.kecamatan === kecamatanFilter).map(d => d.desa).filter(Boolean))];
  }, [data, kecamatanFilter]);

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

  // Top PPL
  const pplStats = useMemo(() => {
    const stats: Record<string, { submit: number, draft: number, target: number }> = {};
    filteredData.forEach(d => {
      if (!d.namaPpl) return;
      if (!stats[d.namaPpl]) stats[d.namaPpl] = { submit: 0, draft: 0, target: 0 };
      stats[d.namaPpl].submit += d.totalSubmit;
      stats[d.namaPpl].draft += d.draft;
      stats[d.namaPpl].target += d.target;
    });
    return Object.entries(stats).map(([name, vals]) => ({ name, ...vals })).sort((a, b) => b.submit - a.submit);
  }, [filteredData]);

  // Line Chart Data (Hari Ini vs Kemarin vs 7 hari)
  const lineChartData = useMemo(() => {
    if (snapshots.length === 0) return [];
    
    // Convert cumulative snapshots to daily diffs
    const chart = [];
    let prevSubmit = 0;
    
    // Sort by date
    const sorted = [...snapshots].sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
    
    for (const snap of sorted) {
      const dateStr = new Date(snap.snapshotDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      chart.push({
        name: dateStr,
        Submit: Math.max(0, snap.totalSubmit - prevSubmit),
      });
      prevSubmit = snap.totalSubmit;
    }
    
    // Add today's live data
    const todayStr = 'Hari Ini';
    chart.push({
      name: todayStr,
      Submit: Math.max(0, totalSubmit - prevSubmit)
    });

    return chart.slice(-14); // Last 14 entries
  }, [snapshots, totalSubmit]);

  // Bar Chart Data (Kecamatan Progress)
  const barChartData = useMemo(() => {
    const stats: Record<string, { submit: number, target: number }> = {};
    data.forEach(d => {
      if (!d.kecamatan) return;
      if (!stats[d.kecamatan]) stats[d.kecamatan] = { submit: 0, target: 0 };
      stats[d.kecamatan].submit += d.totalSubmit;
      stats[d.kecamatan].target += d.target;
    });
    return Object.entries(stats).map(([name, vals]) => ({
      name, 
      Submit: vals.submit,
      Sisa: Math.max(0, vals.target - vals.submit)
    })).sort((a, b) => (b.Submit + b.Sisa) - (a.Submit + a.Sisa));
  }, [data]);

  const top3PPL = pplStats.slice(0, 3);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">Memproses Jutaan Sel Data Google Sheet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-white hover:bg-slate-100 rounded-full shadow-sm transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">{config.kegiatan}</h1>
            <p className="text-sm text-slate-500 font-medium">
              {config.subKegiatan ? `${config.subKegiatan} • ` : ''} 
              {new Date(config.startDate).toLocaleDateString('id-ID')} s.d {new Date(config.endDate).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select 
            value={kecamatanFilter}
            onChange={(e) => {
              setKecamatanFilter(e.target.value);
              setDesaFilter('Semua Desa');
            }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            {uniqueKecamatan.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select 
            value={desaFilter}
            onChange={(e) => setDesaFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            {uniqueDesa.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submit</p>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">{totalSubmit.toLocaleString('id-ID')}</h2>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Target</p>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">{totalTarget.toLocaleString('id-ID')}</h2>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Akumulasi %</p>
            <TrendingUp className="w-5 h-5 text-primary-500" />
          </div>
          <h2 className="text-3xl font-black text-primary-600">{progressPct}%</h2>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-primary-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Number(progressPct))}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Draft</p>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-3xl font-black text-amber-600">{totalDraft.toLocaleString('id-ID')}</h2>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sisa Waktu</p>
            <Clock className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex items-end gap-1">
            <h2 className="text-3xl font-black text-rose-600">{sisaHariKerja}</h2>
            <span className="text-sm font-bold text-rose-400 mb-1">Hari</span>
          </div>
        </div>
      </div>

      {/* Leaderboard & Apresiasi */}
      <div className="bg-gradient-to-r from-primary-600 to-amber-500 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 blur-3xl rounded-full"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
            <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">Top 3 PPL Teraktif</h3>
            <p className="text-primary-100 font-medium">Berdasarkan total akumulasi submit tertinggi.</p>
          </div>
        </div>
        
        <div className="flex gap-4 z-10 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {top3PPL.map((ppl, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col min-w-[140px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-primary-200 uppercase tracking-wider">Peringkat {idx + 1}</span>
                {idx === 0 && <span className="text-lg">🏆</span>}
              </div>
              <p className="font-bold text-white truncate max-w-[120px]" title={ppl.name}>{ppl.name}</p>
              <p className="text-2xl font-black text-white mt-auto">{ppl.submit.toLocaleString('id-ID')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Tren Penambahan Submit Harian
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="Submit" stroke="#F6A672" strokeWidth={4} dot={{ r: 6, fill: '#F6A672', strokeWidth: 0 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" />
              Progres Geografis (Akumulasi)
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Submit" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Sisa" stackId="a" fill="#f1f5f9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Rekapitulasi Akumulasi Per Petugas (PPL)
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Peringkat</th>
                <th className="px-6 py-4">Nama PPL</th>
                <th className="px-6 py-4 text-right">Target</th>
                <th className="px-6 py-4 text-right">Submit (Valid)</th>
                <th className="px-6 py-4 text-right">Draft</th>
                <th className="px-6 py-4 text-right">% Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pplStats.map((ppl, idx) => {
                const pct = ppl.target > 0 ? ((ppl.submit / ppl.target) * 100).toFixed(1) : '0';
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{ppl.name}</td>
                    <td className="px-6 py-4 text-right font-medium">{ppl.target}</td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600">{ppl.submit}</td>
                    <td className="px-6 py-4 text-right font-medium text-amber-500">{ppl.draft}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${Number(pct) >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
