import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, Loader2, RefreshCw, Filter, TrendingUp, Users, MapPin, Search, CheckCircle2, AlertCircle, Target, Clock, Star, BarChart3, Calendar, Target as TargetIcon, Trophy, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import { MonitoringConfig } from './AdminMonitoring';
import { MonitoringRow } from '../../services/monitoringParser';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  searchPlaceholder: string;
  prefix?: string;
  formatLabel?: (val: string) => string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ value, onChange, options, placeholder, searchPlaceholder, prefix = '', formatLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLabel = (opt: string) => formatLabel ? formatLabel(opt) : opt;
  const filtered = options.filter(o => getLabel(o).toLowerCase().includes(search.toLowerCase()));
  const displayValue = value === 'ALL' ? placeholder : `${prefix}${getLabel(value)}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-48 bg-white border rounded-lg px-3 py-2 text-sm text-slate-700 font-medium ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'} transition-all`}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <input 
                type="text" 
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-emerald-500 rounded-md py-1.5 pl-3 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-300">
            {filtered.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${value === opt ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {opt === 'ALL' ? placeholder : `${prefix}${getLabel(opt)}`}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-slate-400">Tidak ditemukan</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface MonitoringDashboardProps {
  config: MonitoringConfig;
  onBack: () => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ config, onBack }) => {
  const [data, setData] = useState<MonitoringRow[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const fullTableRef = React.useRef<HTMLDivElement>(null);
  const [isDownloadingPNG, setIsDownloadingPNG] = useState(false);

  const handleDownloadPNG = async () => {
    if (!fullTableRef.current) return;
    setIsDownloadingPNG(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      // Temporarily make sure it's fully rendered by setting a white background
      const dataUrl = await toPng(fullTableRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Progres_Petugas_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG:', err);
    } finally {
      setIsDownloadingPNG(false);
    }
  };

  // Global Filters
  const [pmlFilter, setPmlFilter] = useState<string>('ALL');
  const [pplFilter, setPplFilter] = useState<string>('ALL');
  const [tanggalFilter, setTanggalFilter] = useState<string>('ALL');

  // Chart Filters
  const [wilayahSearch, setWilayahSearch] = useState('');
  const [kecamatanFilter, setKecamatanFilter] = useState<string>('ALL');
  const [desaFilter, setDesaFilter] = useState<string>('ALL');
  const [slsFilter, setSlsFilter] = useState<string>('ALL');

  // Tracker Filters
  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerLimit, setTrackerLimit] = useState<number>(3);
  const [trackerPage, setTrackerPage] = useState<number>(1);

  // Bottom Table State
  const [tableMode, setTableMode] = useState<'PPL' | 'PML'>('PPL');
  const [tableSearch, setTableSearch] = useState('');
  const [tableSort, setTableSort] = useState<{key: string, dir: 'asc'|'desc'}>({ key: 'submit', dir: 'desc' });
  const [tableLimit, setTableLimit] = useState<number>(15);
  const [tablePage, setTablePage] = useState<number>(1);

  // SLS Table State
  const [slsTableSearch, setSlsTableSearch] = useState('');
  const [slsTableSort, setSlsTableSort] = useState<{key: string, dir: 'asc'|'desc'}>({ key: 'kecamatan', dir: 'asc' });
  const [slsTableLimit, setSlsTableLimit] = useState<number>(15);
  const [slsTablePage, setSlsTablePage] = useState<number>(1);

  // PPL Daily Delta Table State
  const [pplDeltaSearch, setPplDeltaSearch] = useState('');
  const [pplDeltaSort, setPplDeltaSort] = useState<{key: string, dir: 'asc'|'desc'}>({ key: 'addSubmit', dir: 'desc' });
  const [pplDeltaLimit, setPplDeltaLimit] = useState<number>(15);
  const [pplDeltaPage, setPplDeltaPage] = useState<number>(1);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const liveRes = await fetch(`${baseUrl}/api/monitoring/live-data/${config.id}`);
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        setData(liveData);
      }
      
      const res = await fetch(`${baseUrl}/api/monitoring/snapshots/${config.id}`);
      if (res.ok) {
        const snaps = await res.json();
        setSnapshots(snaps);
      }
      const logRes = await fetch(`${baseUrl}/api/monitoring/logs/${config.id}`);
      if (logRes.ok) {
        const logsData = await logRes.json();
        setLogs(logsData);
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

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/monitoring/sync-live/${config.id}`, { method: 'POST' });
      if (res.ok) {
        await loadData(true);
      } else {
        alert("Gagal melakukan sinkronisasi data dari Google Sheets.");
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Terjadi kesalahan saat sinkronisasi.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Reset filters when switching activity
    setPmlFilter('ALL');
    setPplFilter('ALL');
    setTanggalFilter('ALL');
    setWilayahSearch('');
    setKecamatanFilter('ALL');
    setDesaFilter('ALL');
    setSlsFilter('ALL');
    setTrackerSearch('');
    setTableSearch('');
    setSlsTableSearch('');
    setPplDeltaSearch('');
    setTrackerPage(1);
    setTablePage(1);
    setSlsTablePage(1);
    setPplDeltaPage(1);
    
    loadData(); 
  }, [config]);

  const sisaHariKerja = useMemo(() => {
    const end = new Date(config.endDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [config.endDate]);

  const hariBerjalan = useMemo(() => {
    const start = new Date(config.startDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [config.startDate]);

  const uniquePml = useMemo(() => ['ALL', ...new Set(data.map(d => d.namaPml).filter(Boolean))], [data]);
  const uniquePpl = useMemo(() => {
    let filtered = data;
    if (pmlFilter !== 'ALL') filtered = filtered.filter(d => d.namaPml === pmlFilter);
    return ['ALL', ...new Set(filtered.map(d => d.namaPpl).filter(Boolean))];
  }, [data, pmlFilter]);
  const uniqueTanggal = useMemo(() => {
    const dates = [...new Set(snapshots.map(s => s.snapshotDate as string))].sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime());
    return ['ALL', ...dates];
  }, [snapshots]);

  const headerFilteredData = useMemo(() => {
    return data.filter(d => {
      return (pmlFilter === 'ALL' || d.namaPml === pmlFilter) && (pplFilter === 'ALL' || d.namaPpl === pplFilter);
    });
  }, [data, pmlFilter, pplFilter]);

  const dailyDiff = useMemo(() => {
    if (snapshots.length === 0) return { submit: 0, draft: 0 };
    const sorted = [...snapshots].sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime());
    if (sorted.length >= 2) {
      return {
        submit: Math.max(0, (sorted[0].totalSubmit || 0) - (sorted[1].totalSubmit || 0)),
        draft: (sorted[0].totalDraft || 0) - (sorted[1].totalDraft || 0)
      };
    } else if (sorted.length === 1) {
      return { submit: sorted[0].totalSubmit || 0, draft: sorted[0].totalDraft || 0 };
    }
    return { submit: 0, draft: 0 };
  }, [snapshots]);

  const totalTarget = headerFilteredData.reduce((acc, curr) => acc + curr.target, 0);
  // Untuk card KPI kita pakai totalSubmit (semua yg disubmit)
  const totalSubmitAll = headerFilteredData.reduce((acc, curr) => acc + curr.totalSubmit, 0);
  const totalDraft = headerFilteredData.reduce((acc, curr) => acc + curr.draft, 0);
  const progressPct = totalTarget > 0 ? ((totalSubmitAll / totalTarget) * 100).toFixed(1) : '0';
  const submitPct = totalTarget > 0 ? ((dailyDiff.submit / totalTarget) * 100).toFixed(2) : '0';
  const draftPct = totalTarget > 0 ? ((totalDraft / totalTarget) * 100).toFixed(2) : '0';

  const expectedTargetPct = useMemo(() => {
    const startDate = new Date(config.startDate).getTime(); 
    const endDate = new Date(config.endDate).getTime();
    const now = new Date().getTime();
    const totalDuration = endDate - startDate;
    if (totalDuration <= 0) return 100;
    return Math.min(100, Math.max(0, ((now - startDate) / totalDuration) * 100));
  }, [config.startDate, config.endDate]);

  // PPL Leaderboard
  const pplStatsRaw = useMemo(() => {
    const stats: Record<string, { submit: number, totalSubmit: number, draft: number, target: number, pml: string, totalSls: number, approve: number, reject: number, open: number }> = {};
    headerFilteredData.forEach(d => {
      if (!d.namaPpl) return;
      // Gunakan nama PPL dan PML sebagai unique key untuk mencegah merge data nama yang sama
      const key = `${d.namaPpl}|${d.namaPml}`;
      if (!stats[key]) stats[key] = { submit: 0, totalSubmit: 0, draft: 0, target: 0, pml: d.namaPml, totalSls: 0, approve: 0, reject: 0, open: 0 };
      stats[key].submit += (d.submit ?? 0);
      // Live data dari DB tidak punya totalSubmit, fallback ke submit
      stats[key].totalSubmit += (d.totalSubmit ?? d.submit ?? 0);
      stats[key].draft += (d.draft ?? 0);
      stats[key].target += (d.target ?? 0);
      stats[key].totalSls += 1;
      stats[key].approve += (d.approve ?? 0);
      stats[key].reject += (d.reject ?? 0);
      stats[key].open += (d.open ?? 0);
    });
    return Object.entries(stats).map(([k, v]) => ({ name: k.split('|')[0], key: k, ...v })).sort((a, b) => b.totalSubmit - a.totalSubmit);
  }, [headerFilteredData]);

  const mostActivePpl = pplStatsRaw.length > 0 ? pplStatsRaw[0] : null;

  const geoFilteredData = useMemo(() => {
    return headerFilteredData.filter(d => {
      const matchKec = kecamatanFilter === 'ALL' || d.kecamatan === kecamatanFilter;
      const matchDesa = desaFilter === 'ALL' || d.desa === desaFilter;
      const matchSls = slsFilter === 'ALL' || d.sls === slsFilter;
      return matchKec && matchDesa && matchSls;
    });
  }, [headerFilteredData, kecamatanFilter, desaFilter, slsFilter]);

  const uniqueKecamatan = useMemo(() => ['ALL', ...new Set(headerFilteredData.map(d => d.kecamatan).filter(Boolean))], [headerFilteredData]);
  const uniqueDesa = useMemo(() => ['ALL', ...new Set(headerFilteredData.filter(d => kecamatanFilter==='ALL' || d.kecamatan===kecamatanFilter).map(d => d.desa).filter(Boolean))], [headerFilteredData, kecamatanFilter]);
  const uniqueSls = useMemo(() => ['ALL', ...new Set(headerFilteredData.filter(d => desaFilter==='ALL' || d.desa===desaFilter).map(d => d.sls).filter(Boolean))], [headerFilteredData, desaFilter]);

  const geoChartData = useMemo(() => {
    const stats: Record<string, { name: string, submit: number, totalSubmit: number, target: number }> = {};
    const grouping = kecamatanFilter === 'ALL' ? 'kecamatan' : (desaFilter === 'ALL' ? 'desa' : 'sls');
    geoFilteredData.forEach(d => {
      const key = d[grouping as keyof MonitoringRow] as string;
      if (!key || (wilayahSearch && !key.toLowerCase().includes(wilayahSearch.toLowerCase()))) return;
      if (!stats[key]) stats[key] = { name: key, submit: 0, totalSubmit: 0, target: 0 };
      stats[key].submit += d.submit;
      stats[key].totalSubmit += d.totalSubmit;
      stats[key].target += d.target;
    });
    return Object.values(stats).sort((a, b) => b.totalSubmit - a.totalSubmit);
  }, [geoFilteredData, kecamatanFilter, desaFilter, wilayahSearch]);

  const slsStats = useMemo(() => {
    const stats: Record<string, { submit: number, totalSubmit: number, draft: number, target: number }> = {};
    headerFilteredData.forEach(d => {
      const key = `${d.kecamatan}-${d.desa}-${d.sls}`;
      if (!stats[key]) stats[key] = { submit: 0, totalSubmit: 0, draft: 0, target: 0 };
      stats[key].submit += d.submit;
      stats[key].totalSubmit += d.totalSubmit;
      stats[key].draft += d.draft;
      stats[key].target += d.target;
    });
    let total = 0, selesai = 0, proses = 0, belum = 0;
    Object.values(stats).forEach(s => {
      total++;
      if (s.totalSubmit > 0 && s.totalSubmit >= s.target) selesai++;
      else if (s.totalSubmit > 0 || s.draft > 0) proses++;
      else belum++;
    });
    return { total, selesai, proses, belum };
  }, [headerFilteredData]);

  const slsSelesaiPct = slsStats.total > 0 ? ((slsStats.selesai / slsStats.total) * 100).toFixed(1) : '0';
  const slsProsesPct = slsStats.total > 0 ? ((slsStats.proses / slsStats.total) * 100).toFixed(1) : '0';
  const slsBelumPct = slsStats.total > 0 ? ((slsStats.belum / slsStats.total) * 100).toFixed(1) : '0';

  const lineChartData = useMemo(() => {
    if (logs.length === 0) return [];
    
    // Group logs by date, applying PPL and PML filters
    const sumByDate: Record<string, number> = {};
    logs.forEach(log => {
      if (pmlFilter !== 'ALL' && log.pml !== pmlFilter) return;
      if (pplFilter !== 'ALL' && log.ppl !== pplFilter) return;

      const d = new Date(log.tanggalUpdate);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      if (!sumByDate[dateStr]) sumByDate[dateStr] = 0;
      sumByDate[dateStr] += log.submit;
    });

    const sortedDates = Object.keys(sumByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let prevSubmit = 0;
    
    return sortedDates.map(date => {
      const currentSubmit = sumByDate[date];
      const daily = Math.max(0, currentSubmit - prevSubmit);
      prevSubmit = currentSubmit;
      return {
        date: date,
        "Penambahan Harian": daily,
        "Akumulasi": currentSubmit
      };
    });
  }, [logs, pmlFilter, pplFilter]);

  // PPL Daily Delta Computation based on Logs
  const pplDailyDeltaData = useMemo(() => {
    if (logs.length === 0) return [];
    
    if (logs.length === 0 && tanggalFilter !== 'ALL') return [];
    
    // Group logs by PPL+PML
    const logsByPpl: Record<string, any[]> = {};
    logs.forEach(log => {
      const pplKey = `${log.ppl}|${log.pml}`;
      if (!logsByPpl[pplKey]) logsByPpl[pplKey] = [];
      logsByPpl[pplKey].push(log);
    });

    // Sort logs inside each PPL group by date ASC
    Object.values(logsByPpl).forEach(arr => {
      arr.sort((a, b) => new Date(a.tanggalUpdate).getTime() - new Date(b.tanggalUpdate).getTime());
    });

    const results: any[] = [];

    if (tanggalFilter === 'ALL') {
      pplStatsRaw.forEach(liveData => {
         // Apply Global Filters
         if (pmlFilter !== 'ALL' && liveData.pml !== pmlFilter) return;
         if (pplFilter !== 'ALL' && liveData.name !== pplFilter) return;

         const arr = logsByPpl[liveData.key];
         if (arr && arr.length > 0) {
            const latestLog = arr[arr.length - 1];
            const addSubmit = Math.max(0, liveData.submit - latestLog.submit);
            const addDraft = liveData.draft - latestLog.draft;
            const addApprove = Math.max(0, liveData.approve - (latestLog.approve || 0));
            results.push({
               id: liveData.key,
               ppl: liveData.name,
               pml: liveData.pml,
               submit: liveData.submit,
               draft: liveData.draft,
               approve: liveData.approve || 0,
               addSubmit,
               addDraft,
               addApprove,
               date: 'Live'
            });
         } else {
            results.push({
               id: liveData.key,
               ppl: liveData.name,
               pml: liveData.pml,
               submit: liveData.submit,
               draft: liveData.draft,
               approve: liveData.approve || 0,
               addSubmit: liveData.submit,
               addDraft: liveData.draft,
               addApprove: liveData.approve || 0,
               date: 'Live'
            });
         }
      });
    } else {
      // Find all unique dates in logs
      const allDates = [...new Set(logs.map(l => {
          const d = new Date(l.tanggalUpdate);
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }))].sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime());

      if (allDates.length === 0) return [];

      let targetDateStr = allDates[0]; // default to newest
      const tfDate = new Date(tanggalFilter);
      const tfStr = `${tfDate.getFullYear()}-${String(tfDate.getMonth()+1).padStart(2, '0')}-${String(tfDate.getDate()).padStart(2, '0')}`;
      if (allDates.includes(tfStr)) {
        targetDateStr = tfStr;
      }
      
      Object.keys(logsByPpl).forEach(pplKey => {
         const arr = logsByPpl[pplKey];
         const targetIdx = arr.findIndex(l => {
            const d = new Date(l.tanggalUpdate);
            const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return str === targetDateStr;
         });

         if (targetIdx !== -1) {
            const targetLog = arr[targetIdx];
            const prevLog = targetIdx > 0 ? arr[targetIdx - 1] : null;

            const addSubmit = prevLog ? Math.max(0, targetLog.submit - prevLog.submit) : targetLog.submit;
            const addDraft = prevLog ? (targetLog.draft - prevLog.draft) : targetLog.draft;
            const addApprove = prevLog ? Math.max(0, (targetLog.approve || 0) - (prevLog.approve || 0)) : (targetLog.approve || 0);

            if (pmlFilter !== 'ALL' && targetLog.pml !== pmlFilter) return;
            if (pplFilter !== 'ALL' && targetLog.ppl !== pplFilter) return;

            results.push({
               id: pplKey,
               ppl: targetLog.ppl,
               pml: targetLog.pml,
               submit: targetLog.submit,
               draft: targetLog.draft,
               approve: targetLog.approve || 0,
               addSubmit,
               addDraft,
               addApprove,
               date: targetDateStr
            });
         }
      });
    }

    return results;
  }, [logs, tanggalFilter, pmlFilter, pplFilter, pplStatsRaw]);

  const sortedPplDeltaData = useMemo(() => {
    const filtered = pplDailyDeltaData.filter(d => 
      !pplDeltaSearch || 
      d.ppl.toLowerCase().includes(pplDeltaSearch.toLowerCase()) || 
      d.pml.toLowerCase().includes(pplDeltaSearch.toLowerCase())
    );
    return filtered.sort((a, b) => {
      let valA = a[pplDeltaSort.key];
      let valB = b[pplDeltaSort.key];
      if (typeof valA === 'string' && typeof valB === 'string') return pplDeltaSort.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return pplDeltaSort.dir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [pplDailyDeltaData, pplDeltaSearch, pplDeltaSort]);

  const paginatedPplDeltaData = useMemo(() => sortedPplDeltaData.slice((pplDeltaPage - 1) * pplDeltaLimit, pplDeltaPage * pplDeltaLimit), [sortedPplDeltaData, pplDeltaPage, pplDeltaLimit]);
  const totalPplDeltaPages = Math.ceil(sortedPplDeltaData.length / pplDeltaLimit) || 1;

  const handlePplDeltaSort = (key: string) => {
    setPplDeltaSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  // Tracker Pagination
  const filteredTrackerData = useMemo(() => pplStatsRaw.filter(p => !trackerSearch || p.name.toLowerCase().includes(trackerSearch.toLowerCase())), [pplStatsRaw, trackerSearch]);
  const paginatedTrackerData = useMemo(() => filteredTrackerData.slice((trackerPage - 1) * trackerLimit, trackerPage * trackerLimit), [filteredTrackerData, trackerPage, trackerLimit]);
  const totalTrackerPages = Math.ceil(filteredTrackerData.length / trackerLimit) || 1;

  // Bottom Table Logic
  const tableData = useMemo(() => {
    if (tableMode === 'PPL') {
      return pplStatsRaw.map(p => {
        const dailyDelta = pplDailyDeltaData.find(d => d.ppl === p.name && d.pml === p.pml);
        return {
          id: p.key,
          name: p.name,
          supervisor: p.pml,
          target: p.target,
          submit: p.submit,
          totalSubmit: p.totalSubmit,
          draft: p.draft,
          approve: p.approve,
          reject: p.reject,
          open: p.open,
          submitLive: dailyDelta ? dailyDelta.addSubmit : 0,
          rataRata: (p.totalSubmit / hariBerjalan).toFixed(2),
          pct: p.target > 0 ? (p.totalSubmit / p.target) * 100 : 0
        };
      });
    } else {
      const pmlMap: Record<string, any> = {};
      pplStatsRaw.forEach(p => {
        if (!pmlMap[p.pml]) pmlMap[p.pml] = { id: p.pml, name: p.pml, supervisor: '-', target: 0, submit: 0, totalSubmit: 0, draft: 0, approve: 0, reject: 0, open: 0, submitLive: 0 };
        pmlMap[p.pml].target += p.target;
        pmlMap[p.pml].submit += p.submit;
        pmlMap[p.pml].totalSubmit += p.totalSubmit;
        pmlMap[p.pml].draft += p.draft;
        pmlMap[p.pml].approve += p.approve;
        pmlMap[p.pml].reject += p.reject;
        pmlMap[p.pml].open += p.open;
        
        const dailyDelta = pplDailyDeltaData.find(d => d.ppl === p.name && d.pml === p.pml);
        if (dailyDelta) pmlMap[p.pml].submitLive += dailyDelta.addSubmit;
      });
      return Object.values(pmlMap).map(p => ({
        ...p,
        rataRata: (p.totalSubmit / hariBerjalan).toFixed(2),
        pct: p.target > 0 ? (p.totalSubmit / p.target) * 100 : 0
      }));
    }
  }, [pplStatsRaw, tableMode, hariBerjalan, pplDailyDeltaData]);

  const sortedTableData = useMemo(() => {
    const filtered = tableData.filter(t => !tableSearch || t.name.toLowerCase().includes(tableSearch.toLowerCase()) || t.supervisor.toLowerCase().includes(tableSearch.toLowerCase()));
    return filtered.sort((a: any, b: any) => {
      const valA = a[tableSort.key];
      const valB = b[tableSort.key];
      if (typeof valA === 'string' && typeof valB === 'string') return tableSort.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return tableSort.dir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [tableData, tableSearch, tableSort]);

  const paginatedTableData = useMemo(() => sortedTableData.slice((tablePage - 1) * tableLimit, tablePage * tableLimit), [sortedTableData, tablePage, tableLimit]);
  const totalTablePages = Math.ceil(sortedTableData.length / tableLimit) || 1;

  const handleSort = (key: string) => {
    setTableSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  // SLS Table Logic
  const slsTableData = useMemo(() => {
    return geoFilteredData.filter(d => 
      !slsTableSearch || 
      d.namaPpl.toLowerCase().includes(slsTableSearch.toLowerCase()) || 
      d.namaPml.toLowerCase().includes(slsTableSearch.toLowerCase()) ||
      d.sls.toLowerCase().includes(slsTableSearch.toLowerCase()) ||
      d.desa.toLowerCase().includes(slsTableSearch.toLowerCase())
    ).sort((a: any, b: any) => {
      let valA = a[slsTableSort.key];
      let valB = b[slsTableSort.key];
      if (slsTableSort.key === 'progres') {
        valA = a.target > 0 ? (a.totalSubmit / a.target) * 100 : 0;
        valB = b.target > 0 ? (b.totalSubmit / b.target) * 100 : 0;
      }
      if (typeof valA === 'string' && typeof valB === 'string') return slsTableSort.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return slsTableSort.dir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [geoFilteredData, slsTableSearch, slsTableSort]);

  const paginatedSlsTableData = useMemo(() => slsTableData.slice((slsTablePage - 1) * slsTableLimit, slsTablePage * slsTableLimit), [slsTableData, slsTablePage, slsTableLimit]);
  const totalSlsTablePages = Math.ceil(slsTableData.length / slsTableLimit) || 1;

  const handleSlsSort = (key: string) => {
    setSlsTableSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl">
      <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
      <p className="text-slate-500 font-medium animate-pulse">Menarik data langsung dari Google Sheets...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-sm border border-slate-200 sticky top-0 z-30">
        {/* Baris 1: Judul & status */}
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-slate-800 leading-tight truncate">{config.kegiatan}</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <span className="truncate">{config.subKegiatan || 'Monitoring Interaktif'}</span>
            </p>
          </div>
        </div>

        {/* Baris 2: Filter + Aksi */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {/* Label Filter */}
          <div className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </div>

          {/* Filter PML */}
          <div className="flex-shrink-0 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 min-w-[120px]">
            <SearchableSelect
              value={pmlFilter}
              onChange={val => { setPmlFilter(val); setPplFilter('ALL'); }}
              options={uniquePml}
              placeholder="Semua Tim"
              searchPlaceholder="Cari PML..."
              prefix="PML: "
            />
          </div>

          {/* Filter PPL */}
          <div className="flex-shrink-0 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 min-w-[120px]">
            <SearchableSelect
              value={pplFilter}
              onChange={setPplFilter}
              options={uniquePpl}
              placeholder="Semua PPL"
              searchPlaceholder="Cari PPL..."
              prefix="PPL: "
            />
          </div>

          {/* Filter Tanggal */}
          <div className="flex-shrink-0 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 min-w-[130px]">
            <SearchableSelect
              value={tanggalFilter}
              onChange={setTanggalFilter}
              options={uniqueTanggal}
              placeholder="Semua Tanggal"
              searchPlaceholder="Cari Tanggal..."
              prefix="Tgl: "
              formatLabel={(val) => {
                if (val === 'ALL') return 'Semua Tanggal';
                const d = new Date(val);
                const isLatest = uniqueTanggal[1] === val;
                const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                return isLatest ? `${dateStr} ✦` : dateStr;
              }}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Info sync + tombol */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="hidden md:block text-xs text-slate-400 font-medium whitespace-nowrap">{lastSync}</span>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center justify-center p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 group"
              title="Tarik data terbaru"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
            <button
              onClick={onBack}
              className="flex items-center justify-center p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              title="Kembali"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-emerald-50"><CheckCircle2 className="w-24 h-24" /></div>
          <div className="relative">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Submit (Hari Ini / Filter)</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-emerald-500">+{dailyDiff.submit > 0 ? dailyDiff.submit : totalSubmitAll}</h3>
                <span className="text-xs font-medium text-slate-500">berkas dari {pplStatsRaw.length} PPL</span>
              </div>
              <div className="bg-emerald-50 px-2 py-1 rounded text-emerald-600 text-[11px] font-bold">{submitPct}%</div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-slate-400">
              <span className="text-emerald-500">●</span> KONTRIBUSI BERSIH HARIAN
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-amber-50"><AlertCircle className="w-24 h-24" /></div>
          <div className="relative">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Draft (Saat Ini)</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-amber-500">{totalDraft}</h3>
                <span className="text-xs font-medium text-amber-500">{dailyDiff.draft > 0 ? `+${dailyDiff.draft}` : dailyDiff.draft} hari ini</span>
              </div>
              <div className="bg-amber-50 px-2 py-1 rounded text-amber-600 text-[11px] font-bold">{draftPct}%</div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-slate-600">
              <span className="text-amber-500">●</span> Diperbarui: {lastSync}
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-blue-50"><Target className="w-24 h-24" /></div>
          <div className="relative flex flex-col h-full justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Akumulasi Progres Target</p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-800">{totalSubmitAll.toLocaleString()}</h3>
                  <span className="text-xs font-medium text-slate-500">/ {totalTarget.toLocaleString()} Target</span>
                </div>
                <div className="bg-blue-50 px-2 py-1 rounded text-blue-600 text-[11px] font-bold">{progressPct}% Selesai</div>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden relative">
              {/* Marker for daily expected target */}
              <div className="absolute top-0 h-full w-0.5 bg-red-400 z-10" style={{ left: `${Math.min(100, expectedTargetPct)}%` }} title={`Target Hari Ini: ${expectedTargetPct.toFixed(1)}%`} />
              <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Number(progressPct))}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                <span className="text-slate-500">Target Hari Ini:</span>
                <span className="text-red-500">{Math.round(totalTarget * expectedTargetPct / 100).toLocaleString()} dokumen ({expectedTargetPct.toFixed(1)}%)</span>
              </div>
              <span className={`text-[10px] font-bold ${Number(progressPct) >= expectedTargetPct ? 'text-emerald-500' : 'text-red-500'}`}>
                {Number(progressPct) >= expectedTargetPct ? '✓ Di atas target' : '⚠ Di bawah target'}
              </span>
            </div>
          </div>
        </div>
      </div>

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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-rose-100">BUFFER TARGET {config.kegiatan}</span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">DEADLINE: {new Date(config.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><TargetIcon className="w-7 h-7 text-rose-500" />Pelacak Target Harian Petugas (Akselerasi Tepat Waktu)</h2>
              <p className="text-sm text-slate-500 mt-1">Hitung mundur sisa hari kerja hingga target penyelesaian buffer tanggal {new Date(config.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex-shrink-0">
            <div className="bg-white p-3 rounded-xl shadow-sm"><Calendar className="w-8 h-8 text-orange-500" /></div>
            <div><p className="text-[10px] font-bold text-slate-500 tracking-wider">SISA HARI KERJA</p><h3 className="text-2xl font-black text-orange-600">{sisaHariKerja} Hari Lagi</h3></div>
          </div>
        </div>
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Cari nama PPL..." value={trackerSearch} onChange={e => {setTrackerSearch(e.target.value); setTrackerPage(1);}} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <span>TAMPIL:</span>
              <select value={trackerLimit} onChange={e => {setTrackerLimit(Number(e.target.value)); setTrackerPage(1);}} className="bg-transparent border-b border-slate-300 outline-none font-bold text-slate-800 pb-1">
                <option value={3}>3 Kartu</option><option value={6}>6 Kartu</option><option value={9}>9 Kartu</option><option value={12}>12 Kartu</option>
              </select>
            </div>
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-bold px-3 py-1.5 rounded uppercase">FILTER PML AKTIF: {pmlFilter === 'ALL' ? 'SEMUA' : pmlFilter}</div>
            <div className="bg-white border border-slate-800 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded uppercase">TOTAL PPL TERPILIH: {filteredTrackerData.length} / {pplStatsRaw.length} ORANG</div>
          </div>
        </div>
        <div className="p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTrackerData.map((ppl, idx) => {
              const sisaDokumen = ppl.open;
              const pplProgressPct = ppl.target > 0 ? (ppl.submit / ppl.target) * 100 : 0;
              const minPerHari = sisaHariKerja > 0 ? Math.ceil(sisaDokumen / sisaHariKerja) : sisaDokumen;
              return (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{ppl.name}</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">SUPERVISOR: {ppl.pml}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div><p className="text-[9px] font-bold text-blue-400 uppercase">TARGET HARI INI</p><p className="text-sm font-black text-blue-500">{expectedTargetPct.toFixed(1)}%</p></div>
                      <div><p className="text-[9px] font-bold text-slate-400 uppercase">PROGRES TARGET</p><p className="text-sm font-black text-orange-500">{pplProgressPct.toFixed(1)}%</p></div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mb-6 flex overflow-hidden">
                    <div className="bg-orange-500 h-full transition-all" style={{ width: `${Math.min(100, pplProgressPct)}%` }} />
                    <div className="bg-blue-400 h-full transition-all opacity-30" style={{ width: `${Math.max(0, expectedTargetPct - pplProgressPct)}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="border border-slate-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">TOTAL SLS</p><p className="text-sm font-bold text-slate-800">{ppl.totalSls}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">TARGET AKHIR</p><p className="text-sm font-bold text-slate-800">{ppl.target}</p>
                    </div>
                    <div className="border border-emerald-200 bg-emerald-50/30 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">TELAH SUBMIT</p>
                      <p className="text-sm font-bold text-emerald-600">{ppl.submit} <span className="text-[10px] font-medium">({pplProgressPct.toFixed(1)}%)</span></p>
                    </div>
                    <div className="border border-emerald-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[8px] font-bold text-emerald-600 uppercase mb-1">SUBMIT HARI INI (LIVE)</p>
                      <p className="text-sm font-bold text-emerald-500">0 <span className="text-[10px] font-medium">(0.0%)</span></p>
                    </div>
                    <div className="border border-amber-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-amber-600 uppercase mb-1">JUMLAH DRAF</p>
                      <p className="text-sm font-bold text-amber-500">{ppl.draft} <span className="text-[10px] font-medium">({ppl.target > 0 ? ((ppl.draft / ppl.target)*100).toFixed(1) : 0}%)</span></p>
                    </div>
                    <div className="border border-rose-200 rounded-lg p-2 text-center flex flex-col justify-center">
                      <p className="text-[9px] font-bold text-rose-500 uppercase mb-1">SISA DOKUMEN</p>
                      <p className="text-sm font-bold text-rose-500">{sisaDokumen} <span className="text-[10px] font-medium">({ppl.target > 0 ? ((sisaDokumen / ppl.target)*100).toFixed(1) : 0}%)</span></p>
                    </div>
                  </div>
                  <div className="mt-auto bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
                    <div><p className="text-[10px] font-bold text-slate-700 uppercase">TARGET SUBMIT HARI INI</p><p className="text-[10px] text-slate-500">Minimal disubmit / hari kerja</p></div>
                    <div className="bg-slate-900 text-white rounded-lg px-4 py-2 text-center"><p className="text-lg font-black leading-none">{minPerHari}</p><p className="text-[8px] font-bold text-slate-300 uppercase mt-1">DOK / HARI</p></div>
                  </div>
                </div>
              );
            })}
          </div>
          {paginatedTrackerData.length === 0 && <div className="text-center py-12 text-slate-500">Tidak ada data.</div>}
          {totalTrackerPages > 1 && (
            <div className="mt-8 flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-100 border-t-2 border-t-slate-200">
              <button onClick={() => setTrackerPage(p => Math.max(1, p - 1))} disabled={trackerPage === 1} className="px-4 py-1.5 text-sm font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30">Sebelumnya</button>
              <span className="text-sm font-mono text-slate-500">Halaman {trackerPage} / {totalTrackerPages}</span>
              <button onClick={() => setTrackerPage(p => Math.min(totalTrackerPages, p + 1))} disabled={trackerPage === totalTrackerPages} className="px-4 py-1.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30">Berikutnya</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><TrendingUp className="w-5 h-5 text-indigo-500" />Tren Progres Harian</h2>
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
            ) : <div className="h-full flex items-center justify-center text-slate-400"><p>Belum ada data</p></div>}
          </div>
        </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />Apresiasi Bintang Petugas SE2026</h2>
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {pplStatsRaw.slice(0, 5).map((ppl, idx) => {
            const progress = ppl.target ? (ppl.totalSubmit / ppl.target) * 100 : 0;
            const starCount = Math.min(5, Math.max(0, Math.round((isFinite(progress) ? progress : 0) / 20) || 0));
            return (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors">
                <div className="flex items-center gap-1">
                  {[...Array(starCount)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                  {[...Array(5 - starCount)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gray-300" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate text-sm">{ppl.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">PML: {ppl.pml}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600 text-sm">{ppl.totalSubmit}</p>
                  <p className="text-xs text-slate-500">{Math.round(progress)}%</p>
                </div>
              </div>
            );
          })}
          {pplStatsRaw.length === 0 && <p className="text-sm text-slate-500 text-center py-10">Belum ada data.</p>}
        </div>
      </div>
      </div>

      {/* Tabel Penambahan Submit & Draft Harian Menurut PPL & PML */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Penambahan Harian Menurut Petugas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Menampilkan {paginatedPplDeltaData.length} dari {pplDailyDeltaData.length} petugas pada tanggal {pplDailyDeltaData.length > 0 ? new Date(pplDailyDeltaData[0].date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari nama PPL atau PML..." 
                value={pplDeltaSearch} 
                onChange={e => {setPplDeltaSearch(e.target.value); setPplDeltaPage(1);}} 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-full transition-colors" 
              />
            </div>
          </div>
        </div>

        {pplDailyDeltaData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Belum ada data penambahan harian petugas untuk tanggal tersebut.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handlePplDeltaSort('ppl')}>
                    Nama PPL {pplDeltaSort.key === 'ppl' && (pplDeltaSort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100" onClick={() => handlePplDeltaSort('pml')}>
                    Supervisor (PML) {pplDeltaSort.key === 'pml' && (pplDeltaSort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-emerald-600 uppercase tracking-wider whitespace-nowrap text-center cursor-pointer hover:bg-slate-100" onClick={() => handlePplDeltaSort('addSubmit')}>
                    + Submit Harian {pplDeltaSort.key === 'addSubmit' && (pplDeltaSort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center cursor-pointer hover:bg-slate-100" onClick={() => handlePplDeltaSort('submit')}>
                    Total Submit {pplDeltaSort.key === 'submit' && (pplDeltaSort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-amber-600 uppercase tracking-wider whitespace-nowrap text-center cursor-pointer hover:bg-slate-100" onClick={() => handlePplDeltaSort('addDraft')}>
                    ± Draft Harian {pplDeltaSort.key === 'addDraft' && (pplDeltaSort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3 text-[11px] font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap text-center cursor-pointer hover:bg-slate-100" onClick={() => handlePplDeltaSort('addApprove')}>
                    + Approve Harian {pplDeltaSort.key === 'addApprove' && (pplDeltaSort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPplDeltaData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-800">{row.ppl}</td>
                    <td className="px-5 py-3 text-slate-500">{row.pml}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        row.addSubmit > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {row.addSubmit > 0 ? '+' : ''}{row.addSubmit}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-slate-700">{row.submit}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        row.addDraft > 0 ? 'bg-amber-100 text-amber-700' : row.addDraft < 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {row.addDraft > 0 ? '+' : ''}{row.addDraft}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        row.addApprove > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {row.addApprove > 0 ? '+' : ''}{row.addApprove}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-200">
                  <td colSpan={2} className="px-5 py-3 text-xs font-bold text-slate-600 uppercase text-right">Total Keseluruhan</td>
                  <td className="px-5 py-3 text-center font-black text-emerald-700">
                    +{sortedPplDeltaData.reduce((acc, row) => acc + row.addSubmit, 0)}
                  </td>
                  <td className="px-5 py-3 text-center font-black text-slate-700">
                    {sortedPplDeltaData.reduce((acc, row) => acc + row.submit, 0)}
                  </td>
                  <td className="px-5 py-3 text-center font-black text-amber-600">
                    {(() => { const t = sortedPplDeltaData.reduce((acc, row) => acc + row.addDraft, 0); return t > 0 ? `+${t}` : t; })()}
                  </td>
                  <td className="px-5 py-3 text-center font-black text-blue-600">
                    +{sortedPplDeltaData.reduce((acc, row) => acc + row.addApprove, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {totalPplDeltaPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button 
              onClick={() => setPplDeltaPage(p => Math.max(1, p - 1))} 
              disabled={pplDeltaPage === 1} 
              className="px-4 py-1.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Sebelumnya
            </button>
            <span className="text-sm font-mono text-slate-500">Hal {pplDeltaPage} / {totalPplDeltaPages}</span>
            <button 
              onClick={() => setPplDeltaPage(p => Math.min(totalPplDeltaPages, p + 1))} 
              disabled={pplDeltaPage === totalPplDeltaPages} 
              className="px-4 py-1.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-rose-500" />Progres Menurut Geografis</h2>
          <div className="flex flex-wrap items-center gap-3">
            <SearchableSelect 
              value={kecamatanFilter}
              onChange={val => { setKecamatanFilter(val); setDesaFilter('ALL'); setSlsFilter('ALL'); }}
              options={uniqueKecamatan}
              placeholder="Semua Kecamatan"
              searchPlaceholder="Cari Kecamatan..."
            />
            <div className={`${kecamatanFilter === 'ALL' ? 'opacity-50 pointer-events-none' : ''}`}>
              <SearchableSelect 
                value={desaFilter}
                onChange={val => { setDesaFilter(val); setSlsFilter('ALL'); }}
                options={uniqueDesa}
                placeholder="Semua Desa"
                searchPlaceholder="Cari Desa..."
              />
            </div>
            <div className={`${desaFilter === 'ALL' ? 'opacity-50 pointer-events-none' : ''}`}>
              <SearchableSelect 
                value={slsFilter}
                onChange={setSlsFilter}
                options={uniqueSls}
                placeholder="Semua SLS/Wilayah"
                searchPlaceholder="Cari SLS..."
              />
            </div>
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
              <Bar dataKey="target" name="Target" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="totalSubmit" name="Submit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" />Akumulasi Progres Petugas</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setTableMode('PPL')} className={`px-4 py-1.5 text-sm font-bold rounded-md ${tableMode==='PPL'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>PPL</button>
              <button onClick={() => setTableMode('PML')} className={`px-4 py-1.5 text-sm font-bold rounded-md ${tableMode==='PML'?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>PML</button>
            </div>
            <select value={tableLimit} onChange={e => {setTableLimit(Number(e.target.value)); setTablePage(1);}} className="bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg px-2 py-1 outline-none">
              <option value={10}>10 Baris</option><option value={15}>15 Baris</option><option value={30}>30 Baris</option><option value={100}>100 Baris</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Cari nama..." value={tableSearch} onChange={e => {setTableSearch(e.target.value); setTablePage(1);}} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full sm:w-48" />
            </div>
            <button onClick={handleDownloadPNG} disabled={isDownloadingPNG} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
              {isDownloadingPNG ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloadingPNG ? 'Mengekspor...' : 'Unduh PNG'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>Nama {tableSort.key==='name' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('supervisor')}>Supervisor {tableSort.key==='supervisor' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('target')}>Target {tableSort.key==='target' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('submit')}>Submit {tableSort.key==='submit' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('draft')}>Draf {tableSort.key==='draft' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('approve')}>Approved PML {tableSort.key==='approve' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('reject')}>Rejected PML {tableSort.key==='reject' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('open')}>Open {tableSort.key==='open' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('submitLive')}>Submit Hari Ini {tableSort.key==='submitLive' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSort('rataRata')}>Rata-Rata {tableSort.key==='rataRata' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSort('pct')}>Progres {tableSort.key==='pct' && (tableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-bold text-slate-700">{row.name}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{row.supervisor}</td>
                  <td className="px-5 py-3 text-center font-medium">{row.target}</td>
                  <td className="px-5 py-3 text-center font-black text-emerald-600">{row.submit}</td>
                  <td className="px-5 py-3 text-center text-amber-500 font-bold">{row.draft}</td>
                  <td className="px-5 py-3 text-center text-blue-600 font-bold">{row.approve}</td>
                  <td className="px-5 py-3 text-center text-rose-600 font-bold">{row.reject}</td>
                  <td className="px-5 py-3 text-center text-purple-600 font-bold">{row.open}</td>
                  <td className="px-5 py-3 text-center text-slate-600 font-bold">{row.submitLive}</td>
                  <td className="px-5 py-3 text-center text-slate-600 font-bold">{row.rataRata}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-bold text-slate-700 text-xs">{row.pct.toFixed(1)}%</span>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, row.pct)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedTableData.length === 0 && <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-500">Tidak ada data.</td></tr>}
            </tbody>
          </table>
        </div>
        {totalTablePages > 1 && (
          <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setTablePage(p => Math.max(1, p - 1))} disabled={tablePage === 1} className="px-4 py-1.5 text-sm font-bold text-slate-500 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-30">Sebelumnya</button>
            <span className="text-sm font-mono text-slate-500">Halaman {tablePage} / {totalTablePages}</span>
            <button onClick={() => setTablePage(p => Math.min(totalTablePages, p + 1))} disabled={tablePage === totalTablePages} className="px-4 py-1.5 text-sm font-bold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-30">Berikutnya</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-500" />Tabel Progres Menurut SLS</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select value={slsTableLimit} onChange={e => {setSlsTableLimit(Number(e.target.value)); setSlsTablePage(1);}} className="bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg px-2 py-1 outline-none">
              <option value={10}>10 Baris</option><option value={15}>15 Baris</option><option value={30}>30 Baris</option><option value={100}>100 Baris</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Cari wilayah/PPL/PML..." value={slsTableSearch} onChange={e => {setSlsTableSearch(e.target.value); setSlsTablePage(1);}} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 w-full sm:w-64" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSlsSort('kecamatan')}>Kecamatan {slsTableSort.key==='kecamatan' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSlsSort('desa')}>Desa {slsTableSort.key==='desa' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSlsSort('sls')}>Nama SLS {slsTableSort.key==='sls' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSlsSort('namaPpl')}>Nama PPL {slsTableSort.key==='namaPpl' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSlsSort('namaPml')}>Nama PML {slsTableSort.key==='namaPml' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSlsSort('submit')}>Submit {slsTableSort.key==='submit' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSlsSort('approve')}>Approved PML {slsTableSort.key==='approve' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSlsSort('reject')}>Rejected PML {slsTableSort.key==='reject' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSlsSort('draft')}>Draf {slsTableSort.key==='draft' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSlsSort('open')}>Open {slsTableSort.key==='open' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-center" onClick={() => handleSlsSort('target')}>Target {slsTableSort.key==='target' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
                <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 text-right" onClick={() => handleSlsSort('progres')}>Progres {slsTableSort.key==='progres' && (slsTableSort.dir==='asc'?<ChevronUp className="inline w-3 h-3"/>:<ChevronDown className="inline w-3 h-3"/>)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSlsTableData.map((row, idx) => {
                const progresPct = row.target > 0 ? (row.submit / row.target) * 100 : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-700">{row.kecamatan}</td>
                    <td className="px-5 py-3 text-slate-700">{row.desa}</td>
                    <td className="px-5 py-3 text-slate-700 text-xs">{row.sls}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs font-bold">{row.namaPpl}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{row.namaPml}</td>
                    <td className="px-5 py-3 text-center font-black text-emerald-600">{row.submit}</td>
                    <td className="px-5 py-3 text-center text-blue-600 font-bold">{row.approve}</td>
                    <td className="px-5 py-3 text-center text-rose-600 font-bold">{row.reject}</td>
                    <td className="px-5 py-3 text-center text-amber-500 font-bold">{row.draft}</td>
                    <td className="px-5 py-3 text-center text-slate-600 font-bold">{row.open}</td>
                    <td className="px-5 py-3 text-center font-bold">{row.target}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-slate-700 text-xs">{progresPct.toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, progresPct)}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedSlsTableData.length === 0 && <tr><td colSpan={12} className="px-5 py-10 text-center text-slate-500">Tidak ada data.</td></tr>}
            </tbody>
          </table>
        </div>
        {totalSlsTablePages > 1 && (
          <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-t border-slate-100">
            <button onClick={() => setSlsTablePage(p => Math.max(1, p - 1))} disabled={slsTablePage === 1} className="px-4 py-1.5 text-sm font-bold text-slate-500 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-30">Sebelumnya</button>
            <span className="text-sm font-mono text-slate-500">Halaman {slsTablePage} / {totalSlsTablePages}</span>
            <button onClick={() => setSlsTablePage(p => Math.min(totalSlsTablePages, p + 1))} disabled={slsTablePage === totalSlsTablePages} className="px-4 py-1.5 text-sm font-bold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 disabled:opacity-30">Berikutnya</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-500" />Log Submit Harian (Otomatis)</h2>
          <div className="flex gap-2">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Sinkronisasi Database Aktif</span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0 shadow-sm">
              <tr>
                <th className="px-5 py-3">Tanggal Update</th><th className="px-5 py-3">Supervisor (PML)</th><th className="px-5 py-3">Petugas (PPL)</th>
                <th className="px-5 py-3">SUBMIT ↓</th><th className="px-5 py-3">DRAFT</th><th className="px-5 py-3">APPROVE PML</th><th className="px-5 py-3">TOTAL</th><th className="px-5 py-3">Status Siklus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium">{new Date(log.tanggalUpdate).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</td>
                  <td className="px-5 py-3 text-slate-500">{log.pml}</td>
                  <td className="px-5 py-3 font-bold text-slate-700">{log.ppl}</td>
                  <td className="px-5 py-3 font-black text-emerald-600">{log.submit}</td>
                  <td className="px-5 py-3 font-bold text-amber-500">{log.draft}</td>
                  <td className="px-5 py-3 font-bold text-blue-600">{log.approve || 0}</td>
                  <td className="px-5 py-3 font-bold">{log.total}</td>
                  <td className="px-5 py-3"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold">{log.statusSiklus}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500 italic">Belum ada log terekam untuk kegiatan ini. Log akan di-generate otomatis setiap hari pukul 23:59.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden container for full table export */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -9999, pointerEvents: 'none' }}>
        <div ref={fullTableRef} className="bg-white p-6 rounded-2xl w-[1200px]" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Users className="w-6 h-6 text-blue-500" />Akumulasi Progres Petugas ({tableMode})</h2>
            <p className="text-slate-500 text-sm mt-1">Total {sortedTableData.length} Data | Diekspor pada: {new Date().toLocaleString('id-ID')}</p>
          </div>
          <table className="w-full text-left text-sm text-slate-600 border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-[11px] uppercase font-bold text-slate-600 tracking-wider">
              <tr>
                <th className="px-5 py-3 border-b border-slate-200">Nama</th>
                <th className="px-5 py-3 border-b border-slate-200">Supervisor</th>
                <th className="px-5 py-3 border-b border-slate-200 text-center">Target</th>
                <th className="px-5 py-3 border-b border-slate-200 text-center">Submit</th>
                <th className="px-5 py-3 border-b border-slate-200 text-center">Draf</th>
                <th className="px-5 py-3 border-b border-slate-200 text-center">Approved PML</th>
                <th className="px-5 py-3 border-b border-slate-200 text-center">Rejected PML</th>
                <th className="px-5 py-3 border-b border-slate-200 text-center">Rata-Rata</th>
                <th className="px-5 py-3 border-b border-slate-200 text-right">Progres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedTableData.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-5 py-3 font-bold text-slate-700">{row.name}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{row.supervisor}</td>
                  <td className="px-5 py-3 text-center font-medium">{row.target}</td>
                  <td className="px-5 py-3 text-center font-black text-emerald-600">{row.submit}</td>
                  <td className="px-5 py-3 text-center text-amber-500 font-bold">{row.draft}</td>
                  <td className="px-5 py-3 text-center text-blue-600 font-bold">{row.approve}</td>
                  <td className="px-5 py-3 text-center text-rose-600 font-bold">{row.reject}</td>
                  <td className="px-5 py-3 text-center text-slate-600 font-bold">{row.rataRata}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-700">{row.pct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
