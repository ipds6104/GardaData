import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, Loader2, RefreshCw, Filter, TrendingUp, Users, MapPin, Search, CheckCircle2, AlertCircle, Target, Clock, Star, BarChart3, Calendar, Target as TargetIcon } from 'lucide-react';
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
  const [lastSync, setLastSync] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Global Filters
  const [pmlFilter, setPmlFilter] = useState<string>('ALL');
  const [pplFilter, setPplFilter] = useState<string>('ALL');
  const [tanggalFilter, setTanggalFilter] = useState<string>('ALL');

  // Chart Filters
  const [kecamatanFilter, setKecamatanFilter] = useState<string>('ALL');
  const [desaFilter, setDesaFilter] = useState<string>('ALL');
  const [slsFilter, setSlsFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Tracker Filters
  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerLimit, setTrackerLimit] = useState<number>(3);
  const [trackerPage, setTrackerPage] = useState<number>(1);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);
    
    try {
      const parsed = await parseMonitoringSheet(config.sheetUrl, config.sheetName);
      setData(parsed);

      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/monitoring/snapshots/${config.id}`);
      if (res.ok) {
        const snaps = await res.json();
        setSnapshots(snaps);
      }
      
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      setLastSync(`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
    
    if (!silent) setLoading(false);
    else setIsSyncing(false);
  };

  useEffect(() => {
    loadData();
  }, [config]);

  // Options for headers
  const uniquePml = useMemo(() => ['ALL', ...new Set(data.map(d => d.namaPml).filter(Boolean))], [data]);
  const uniquePpl = useMemo(() => {
    let filtered = data;
    if (pmlFilter !== 'ALL') filtered = filtered.filter(d => d.namaPml === pmlFilter);
    return ['ALL', ...new Set(filtered.map(d => d.namaPpl).filter(Boolean))];
  }, [data, pmlFilter]);

  const uniqueTanggal = useMemo(() => {
    return ['ALL', ...new Set(snapshots.map(s => s.snapshotDate))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [snapshots]);

  // Filtered Data based on header filters
  const headerFilteredData = useMemo(() => {
    return data.filter(d => {
      const matchPml = pmlFilter === 'ALL' || d.namaPml === pmlFilter;
      const matchPpl = pplFilter === 'ALL' || d.namaPpl === pplFilter;
      return matchPml && matchPpl;
    });
  }, [data, pmlFilter, pplFilter]);

  // Calculate daily additions from snapshots
  const dailyDiff = useMemo(() => {
    if (snapshots.length === 0) return { submit: 0, draft: 0 };
    const sorted = [...snapshots].sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime());
    if (sorted.length >= 2) {
      const latest = sorted[0];
      const prev = sorted[1];
      return {
        submit: Math.max(0, (latest.totalSubmit || 0) - (prev.totalSubmit || 0)),
        draft: (latest.totalDraft || 0) - (prev.totalDraft || 0)
      };
    } else if (sorted.length === 1) {
      return { submit: sorted[0].totalSubmit || 0, draft: sorted[0].totalDraft || 0 };
    }
    return { submit: 0, draft: 0 };
  }, [snapshots]);

  const totalTarget = headerFilteredData.reduce((acc, curr) => acc + curr.target, 0);
  const totalSubmit = headerFilteredData.reduce((acc, curr) => acc + curr.totalSubmit, 0);
  const totalDraft = headerFilteredData.reduce((acc, curr) => acc + curr.draft, 0);
  const progressPct = totalTarget > 0 ? ((totalSubmit / totalTarget) * 100).toFixed(1) : '0';
  const submitPct = totalTarget > 0 ? ((dailyDiff.submit / totalTarget) * 100).toFixed(2) : '0';
  const draftPct = totalTarget > 0 ? ((totalDraft / totalTarget) * 100).toFixed(2) : '0';

  const sisaHariKerja = useMemo(() => {
    const end = new Date(config.endDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [config.endDate]);

  // Expected Time Target (for Tracker)
  const expectedTargetPct = useMemo(() => {
    const startDate = new Date(2026, 5, 15).getTime(); // default fallback 15 June 2026
    const endDate = new Date(config.endDate).getTime();
    const now = new Date().getTime();
    const totalDuration = endDate - startDate;
    if (totalDuration <= 0) return 100;
    const elapsed = now - startDate;
    const pct = (elapsed / totalDuration) * 100;
    return Math.min(100, Math.max(0, pct));
  }, [config.endDate]);

  // PPL Leaderboard & Most Active
  const pplStats = useMemo(() => {
    const stats: Record<string, { submit: number, draft: number, target: number, pml: string, totalSls: number }> = {};
    headerFilteredData.forEach(d => {
      if (!d.namaPpl) return;
      if (!stats[d.namaPpl]) stats[d.namaPpl] = { submit: 0, draft: 0, target: 0, pml: d.namaPml, totalSls: 0 };
      stats[d.namaPpl].submit += d.totalSubmit;
      stats[d.namaPpl].draft += d.draft;
      stats[d.namaPpl].target += d.target;
      stats[d.namaPpl].totalSls += 1;
    });
    return Object.entries(stats).map(([name, vals]) => ({ name, ...vals })).sort((a, b) => b.submit - a.submit);
  }, [headerFilteredData]);

  const mostActivePpl = pplStats.length > 0 ? pplStats[0] : null;

  // SLS Status Calculation
  const slsStats = useMemo(() => {
    const stats: Record<string, { submit: number, draft: number, target: number }> = {};
    headerFilteredData.forEach(d => {
      const key = `${d.kecamatan}-${d.desa}-${d.sls}`;
      if (!stats[key]) stats[key] = { submit: 0, draft: 0, target: 0 };
      stats[key].submit += d.totalSubmit;
      stats[key].draft += d.draft;
      stats[key].target += d.target;
    });
    
    let total = 0;
    let selesai = 0;
    let proses = 0;
    let belum = 0;

    Object.values(stats).forEach(s => {
      total++;
      if (s.submit > 0 && s.submit >= s.target) selesai++;
      else if (s.submit > 0 || s.draft > 0) proses++;
      else belum++;
    });

    return { total, selesai, proses, belum };
  }, [headerFilteredData]);

  const slsSelesaiPct = slsStats.total > 0 ? ((slsStats.selesai / slsStats.total) * 100).toFixed(1) : '0';
  const slsProsesPct = slsStats.total > 0 ? ((slsStats.proses / slsStats.total) * 100).toFixed(1) : '0';
  const slsBelumPct = slsStats.total > 0 ? ((slsStats.belum / slsStats.total) * 100).toFixed(1) : '0';

  // Geo Filtered Data
  const geoFilteredData = useMemo(() => {
    return headerFilteredData.filter(d => {
      const matchKec = kecamatanFilter === 'ALL' || d.kecamatan === kecamatanFilter;
      const matchDesa = desaFilter === 'ALL' || d.desa === desaFilter;
      const matchSls = slsFilter === 'ALL' || d.sls === slsFilter;
      return matchKec && matchDesa && matchSls;
    });
  }, [headerFilteredData, kecamatanFilter, desaFilter, slsFilter]);

  const uniqueKecamatan = useMemo(() => ['ALL', ...new Set(headerFilteredData.map(d => d.kecamatan).filter(Boolean))], [headerFilteredData]);
  const uniqueDesa = useMemo(() => {
    let filtered = headerFilteredData;
    if (kecamatanFilter !== 'ALL') filtered = filtered.filter(d => d.kecamatan === kecamatanFilter);
    return ['ALL', ...new Set(filtered.map(d => d.desa).filter(Boolean))];
  }, [headerFilteredData, kecamatanFilter]);
  const uniqueSls = useMemo(() => {
    let filtered = headerFilteredData;
    if (desaFilter !== 'ALL') filtered = filtered.filter(d => d.desa === desaFilter);
    return ['ALL', ...new Set(filtered.map(d => d.sls).filter(Boolean))];
  }, [headerFilteredData, desaFilter]);

  const geoChartData = useMemo(() => {
    const stats: Record<string, { name: string, submit: number, target: number }> = {};
    const grouping = kecamatanFilter === 'ALL' ? 'kecamatan' : (desaFilter === 'ALL' ? 'desa' : 'sls');
    
    geoFilteredData.forEach(d => {
      const key = d[grouping as keyof MonitoringRow] as string;
      if (!key) return;
      if (!stats[key]) stats[key] = { name: key, submit: 0, target: 0 };
      stats[key].submit += d.totalSubmit;
      stats[key].target += d.target;
    });
    return Object.values(stats).sort((a, b) => b.submit - a.submit);
  }, [geoFilteredData, kecamatanFilter, desaFilter]);

  const lineChartData = useMemo(() => {
    if (snapshots.length === 0) return [];
    const sorted = [...snapshots].sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
    let prevSubmit = 0;
    return sorted.map((snap) => {
      const currentSubmit = snap.totalSubmit || 0;
      const daily = Math.max(0, currentSubmit - prevSubmit);
      prevSubmit = currentSubmit;
      return {
        date: snap.snapshotDate,
        "Penambahan Harian": daily,
        "Akumulasi": currentSubmit
      };
    });
  }, [snapshots]);

  // Tracker Logic
  const filteredTrackerData = useMemo(() => {
    let filtered = pplStats;
    if (trackerSearch) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(trackerSearch.toLowerCase()));
    }
    return filtered;
  }, [pplStats, trackerSearch]);

  const paginatedTrackerData = useMemo(() => {
    const start = (trackerPage - 1) * trackerLimit;
    return filteredTrackerData.slice(start, start + trackerLimit);
  }, [filteredTrackerData, trackerPage, trackerLimit]);

  const totalTrackerPages = Math.ceil(filteredTrackerData.length / trackerLimit) || 1;

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
      {/* Header with Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{config.kegiatan}</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {config.subKegiatan || "Monitoring Interaktif"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={pmlFilter}
              onChange={e => { setPmlFilter(e.target.value); setPplFilter('ALL'); }}
              className="bg-transparent text-sm text-slate-700 outline-none w-32 truncate"
            >
              {uniquePml.map(p => <option key={p} value={p}>{p === 'ALL' ? 'PML: Semua Tim' : p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <select 
              value={pplFilter}
              onChange={e => setPplFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-700 outline-none w-32 truncate"
            >
              {uniquePpl.map(p => <option key={p} value={p}>{p === 'ALL' ? 'PPL: Semua Petugas' : p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <select 
              value={tanggalFilter}
              onChange={e => setTanggalFilter(e.target.value)}
              className="bg-transparent text-sm text-slate-700 outline-none w-32 truncate"
            >
              {uniqueTanggal.map(t => <option key={t} value={t}>{t === 'ALL' ? 'Tanggal: Semua' : t}</option>)}
            </select>
          </div>

          <button 
            onClick={() => loadData(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* KPI Cards (3 columns instead of 4 since Tracker takes the 4th) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Submit */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-emerald-50">
            <CheckCircle2 className="w-24 h-24" />
          </div>
          <div className="relative">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Submit (Hari Ini / Filter)</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-emerald-500">+{dailyDiff.submit > 0 ? dailyDiff.submit : totalSubmit}</h3>
                <span className="text-xs font-medium text-slate-500">berkas dari {pplStats.length} PPL</span>
              </div>
              <div className="bg-emerald-50 px-2 py-1 rounded text-emerald-600 text-[11px] font-bold">
                {submitPct}%
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-slate-400">
              <span className="text-emerald-500">●</span> KONTRIBUSI BERSIH HARIAN
            </div>
          </div>
        </div>

        {/* Card 2: Total Draft */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-amber-50">
            <AlertCircle className="w-24 h-24" />
          </div>
          <div className="relative">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Draft (Saat Ini)</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-amber-500">{totalDraft}</h3>
                <span className="text-xs font-medium text-amber-500">{dailyDiff.draft > 0 ? `+${dailyDiff.draft}` : dailyDiff.draft} hari ini</span>
              </div>
              <div className="bg-amber-50 px-2 py-1 rounded text-amber-600 text-[11px] font-bold">
                {draftPct}%
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-slate-600">
              <span className="text-amber-500">●</span> Diperbarui: {lastSync}
            </div>
          </div>
        </div>

        {/* Card 3: Akumulasi Progres */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-blue-50">
            <Target className="w-24 h-24" />
          </div>
          <div className="relative flex flex-col h-full justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Akumulasi Progres Target</p>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-slate-800">{totalTarget.toLocaleString()}</h3>
                <div className="bg-blue-50 px-2 py-1 rounded text-blue-600 text-[11px] font-bold">
                  {progressPct}% Selesai
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Number(progressPct))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Seluruh SLS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase">MONITORING SELURUH SLS ({config.kegiatan})</h2>
          <p className="text-[11px] text-slate-500">Statistik berdasarkan filter PML & PPL.</p>
        </div>
        <div className="flex items-center gap-6 divide-x divide-slate-100 bg-slate-50 px-6 py-3 rounded-xl border border-slate-100">
          <div className="text-center px-4">
            <p className="text-[10px] font-bold text-slate-400 mb-1">TOTAL</p>
            <h3 className="text-xl font-black text-slate-700">{slsStats.total}</h3>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] font-bold text-slate-400 mb-1">SELESAI</p>
            <div className="flex items-baseline justify-center gap-1">
              <h3 className="text-xl font-black text-emerald-600">{slsStats.selesai}</h3>
              <span className="text-[10px] font-bold text-emerald-500">{slsSelesaiPct}%</span>
            </div>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] font-bold text-slate-400 mb-1">PROSES</p>
            <div className="flex items-baseline justify-center gap-1">
              <h3 className="text-xl font-black text-blue-600">{slsStats.proses}</h3>
              <span className="text-[10px] font-bold text-blue-500">{slsProsesPct}%</span>
            </div>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] font-bold text-slate-400 mb-1">BELUM</p>
            <div className="flex items-baseline justify-center gap-1">
              <h3 className="text-xl font-black text-rose-600">{slsStats.belum}</h3>
              <span className="text-[10px] font-bold text-rose-500">{slsBelumPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* BIG PPL TRACKER SECTION */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tracker Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-rose-100">
                BUFFER TARGET {config.kegiatan}
              </span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                DEADLINE: {new Date(config.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <TargetIcon className="w-7 h-7 text-rose-500" />
                Pelacak Target Harian Petugas (Akselerasi Tepat Waktu)
              </h2>
              <p className="text-sm text-slate-500 mt-1">Hitung mundur sisa hari kerja hingga target penyelesaian buffer tanggal {new Date(config.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex-shrink-0">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider">SISA HARI KERJA</p>
              <h3 className="text-2xl font-black text-orange-600">{sisaHariKerja} Hari Lagi</h3>
            </div>
          </div>
        </div>

        {/* Tracker Filters */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Cari nama PPL..."
              value={trackerSearch}
              onChange={e => {setTrackerSearch(e.target.value); setTrackerPage(1);}}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <span>TAMPIL:</span>
              <select 
                value={trackerLimit}
                onChange={e => {setTrackerLimit(Number(e.target.value)); setTrackerPage(1);}}
                className="bg-transparent border-b border-slate-300 outline-none font-bold text-slate-800 pb-1"
              >
                <option value={3}>3 Kartu</option>
                <option value={6}>6 Kartu</option>
                <option value={9}>9 Kartu</option>
                <option value={12}>12 Kartu</option>
              </select>
            </div>
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-bold px-3 py-1.5 rounded uppercase">
              FILTER PML AKTIF: {pmlFilter === 'ALL' ? 'SEMUA' : pmlFilter}
            </div>
            <div className="bg-white border border-slate-800 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded uppercase">
              TOTAL PPL TERPILIH: {filteredTrackerData.length} / {pplStats.length} ORANG
            </div>
          </div>
        </div>

        {/* Tracker Cards Grid */}
        <div className="p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTrackerData.map((ppl, idx) => {
              const pplProgressPct = ppl.target > 0 ? (ppl.submit / ppl.target) * 100 : 0;
              const sisaDokumen = Math.max(0, ppl.target - ppl.submit);
              const minPerHari = sisaHariKerja > 0 ? Math.ceil(sisaDokumen / sisaHariKerja) : sisaDokumen;
              
              return (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
                  {/* Top Name & Progress */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{ppl.name}</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">SUPERVISOR: {ppl.pml}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-[9px] font-bold text-blue-400 uppercase">TARGET HARI INI</p>
                          <p className="text-sm font-black text-blue-500">{expectedTargetPct.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">PROGRES TARGET</p>
                          <p className="text-sm font-black text-orange-500">{pplProgressPct.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full mb-6 flex overflow-hidden">
                    <div className="bg-orange-500 h-full transition-all" style={{ width: `${Math.min(100, pplProgressPct)}%` }} />
                    <div className="bg-blue-400 h-full transition-all opacity-30" style={{ width: `${Math.max(0, expectedTargetPct - pplProgressPct)}%` }} />
                  </div>

                  {/* 3x2 Grid Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="border border-slate-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">TOTAL SLS</p>
                      <p className="text-sm font-bold text-slate-800">{ppl.totalSls}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">TARGET AKHIR</p>
                      <p className="text-sm font-bold text-slate-800">{ppl.target}</p>
                    </div>
                    <div className="border border-emerald-200 bg-emerald-50/30 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">TELAH SUBMIT</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {ppl.submit} <span className="text-[10px] font-medium">({pplProgressPct.toFixed(1)}%)</span>
                      </p>
                    </div>
                    <div className="border border-emerald-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[8px] font-bold text-emerald-600 uppercase mb-1">SUBMIT HARI INI (LIVE)</p>
                      <p className="text-sm font-bold text-emerald-500">
                        +0 <span className="text-[10px] font-medium">(0.0%)</span>
                      </p>
                    </div>
                    <div className="border border-amber-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-amber-600 uppercase mb-1">JUMLAH DRAF</p>
                      <p className="text-sm font-bold text-amber-500">
                        {ppl.draft} <span className="text-[10px] font-medium">({ppl.target > 0 ? ((ppl.draft / ppl.target)*100).toFixed(1) : 0}%)</span>
                      </p>
                    </div>
                    <div className="border border-rose-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-rose-500 uppercase mb-1">SISA DOKUMEN</p>
                      <p className="text-sm font-bold text-rose-500">
                        {sisaDokumen} <span className="text-[10px] font-medium">({ppl.target > 0 ? ((sisaDokumen / ppl.target)*100).toFixed(1) : 0}%)</span>
                      </p>
                    </div>
                  </div>

                  {/* Target Minimal / Hari */}
                  <div className="mt-auto bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-700 uppercase">TARGET SUBMIT HARI INI</p>
                      <p className="text-[10px] text-slate-500">Minimal disubmit / hari kerja</p>
                    </div>
                    <div className="bg-slate-900 text-white rounded-lg px-4 py-2 text-center">
                      <p className="text-lg font-black leading-none">{minPerHari}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">DOK / HARI</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {paginatedTrackerData.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Tidak ada data PPL yang cocok dengan filter.
            </div>
          )}

          {/* Pagination Controls */}
          {totalTrackerPages > 1 && (
            <div className="mt-8 flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setTrackerPage(p => Math.max(1, p - 1))}
                disabled={trackerPage === 1}
                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="text-sm font-bold text-slate-500">
                Halaman {trackerPage} / {totalTrackerPages}
              </span>
              <button 
                onClick={() => setTrackerPage(p => Math.min(totalTrackerPages, p + 1))}
                disabled={trackerPage === totalTrackerPages}
                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
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
                <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSubmit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
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

        {/* Leaderboard */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Bintang Petugas
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {pplStats.slice(0, 5).map((ppl, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate text-sm">{ppl.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">PML: {ppl.pml}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600 text-sm">{ppl.submit}</p>
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-500" />
            Progres Menurut Geografis
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={kecamatanFilter}
              onChange={e => { setKecamatanFilter(e.target.value); setDesaFilter('ALL'); setSlsFilter('ALL'); }}
              className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 outline-none"
            >
              {uniqueKecamatan.map(k => <option key={k} value={k}>{k === 'ALL' ? 'Semua Kecamatan' : k}</option>)}
            </select>
            
            <select 
              value={desaFilter}
              onChange={e => { setDesaFilter(e.target.value); setSlsFilter('ALL'); }}
              disabled={kecamatanFilter === 'ALL'}
              className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 outline-none disabled:opacity-50"
            >
              {uniqueDesa.map(d => <option key={d} value={d}>{d === 'ALL' ? 'Semua Desa' : d}</option>)}
            </select>

            <select 
              value={slsFilter}
              onChange={e => setSlsFilter(e.target.value)}
              disabled={desaFilter === 'ALL'}
              className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 outline-none disabled:opacity-50"
            >
              {uniqueSls.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Semua SLS/Wilayah Kerja' : s}</option>)}
            </select>
          </div>
        </div>

        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={geoChartData} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-45} textAnchor="end" height={60} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
              <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="submit" name="Submit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table PPL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Akumulasi Progres Petugas
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Cari nama PPL / PML..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full sm:w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="px-5 py-3">Nama PPL</th>
                <th className="px-5 py-3">Nama PML</th>
                <th className="px-5 py-3 text-center">Target</th>
                <th className="px-5 py-3 text-center">Submit</th>
                <th className="px-5 py-3 text-center">Draft</th>
                <th className="px-5 py-3 text-right">Progres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pplStats.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.pml.toLowerCase().includes(searchQuery.toLowerCase())).map((ppl, idx) => {
                const pct = ppl.target > 0 ? ((ppl.submit / ppl.target) * 100).toFixed(1) : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-700">{ppl.name}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{ppl.pml}</td>
                    <td className="px-5 py-3 text-center font-medium">{ppl.target}</td>
                    <td className="px-5 py-3 text-center font-black text-emerald-600">{ppl.submit}</td>
                    <td className="px-5 py-3 text-center text-amber-600 font-bold">{ppl.draft}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-slate-700 text-xs">{pct}%</span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Number(pct))}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pplStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Tidak ada data yang sesuai.
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
