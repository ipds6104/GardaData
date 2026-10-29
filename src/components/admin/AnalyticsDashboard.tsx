import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart3, Users, Eye, Clock, Calendar, ArrowLeft, RefreshCw, 
  TrendingUp, Award, Activity, Shield, ShieldCheck, Sparkles, Filter, 
  Monitor, Smartphone, Tablet, CheckCircle2, AlertCircle, Info,
  MapPin, Globe, Wifi, PieChart, ChevronLeft, ChevronRight,
  ChevronDown, X, UserCheck, Briefcase, FileSpreadsheet, User, Search
} from 'lucide-react';
import { useAuth, isAhmadAuliaUser } from '../../lib/auth';
import { 
  getAnalyticsStats, 
  resetAnalyticsData, 
  AnalyticsDataResponse,
  DailySeriesItem,
  HourStat,
  FeatureStat,
  AccountRecapItem
} from '../../services/analyticsService';

interface AnalyticsDashboardProps {
  onBack: () => void;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDaysAgoString(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)} ${MONTH_SHORT_ID[monthIdx] || m} ${y}`;
}

// =========================================================================
// CUSTOM ELEGANT DATE RANGE PICKER
// =========================================================================
interface CustomDateRangePickerProps {
  startDate: string;
  endDate: string;
  onChangeRange: (start: string, end: string, presetName?: string) => void;
  activePreset: string;
}

const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  startDate,
  endDate,
  onChangeRange,
  activePreset
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState<number>(() => {
    return endDate ? parseInt(endDate.split('-')[0], 10) : today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return endDate ? parseInt(endDate.split('-')[1], 10) - 1 : today.getMonth();
  });

  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    const prevMonthTotalDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthTotalDays - i;
      const prevM = viewMonth === 0 ? 12 : viewMonth;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: dNum, isCurrentMonth: false });
    }

    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: i, isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = viewMonth === 11 ? 1 : viewMonth + 2;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: i, isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  const displayDays = useMemo(() => {
    const hasSixthWeek = calendarDays.slice(35).some(d => d.isCurrentMonth);
    return hasSixthWeek ? calendarDays.slice(0, 42) : calendarDays.slice(0, 35);
  }, [calendarDays]);

  const handleSelectDay = (dateStr: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd('');
    } else {
      if (dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const handleApply = () => {
    const s = tempStart || getTodayString();
    const e = tempEnd || tempStart || getTodayString();
    onChangeRange(s, e, 'custom');
    setIsOpen(false);
  };

  const handleQuickPreset = (preset: 'today' | 'yesterday' | '7days' | '14days' | '30days' | 'month') => {
    const end = getTodayString();
    let start = end;

    if (preset === 'today') {
      start = end;
    } else if (preset === 'yesterday') {
      start = getDaysAgoString(1);
    } else if (preset === '7days') {
      start = getDaysAgoString(6);
    } else if (preset === '14days') {
      start = getDaysAgoString(13);
    } else if (preset === '30days') {
      start = getDaysAgoString(29);
    } else if (preset === 'month') {
      const d = new Date();
      start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }

    setTempStart(start);
    setTempEnd(end);
    onChangeRange(start, end, preset);
    setIsOpen(false);
  };

  const todayStr = getTodayString();

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/90 shadow-2xs hover:border-primary-400 dark:hover:border-primary-500 transition-all text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
        >
          <div className="p-1 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span>
            {formatDateDisplay(startDate)} &mdash; {formatDateDisplay(endDate)}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className="inline-flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 text-[11px] font-bold">
          <button
            onClick={() => handleQuickPreset('yesterday')}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              activePreset === 'yesterday'
                ? 'bg-primary-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Mulai Kemarin
          </button>
          <button
            onClick={() => handleQuickPreset('today')}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              activePreset === 'today'
                ? 'bg-primary-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => handleQuickPreset('7days')}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              activePreset === '7days'
                ? 'bg-primary-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => handleQuickPreset('30days')}
            className={`px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
              activePreset === '30days'
                ? 'bg-primary-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            30 Hari Terakhir
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 z-50 w-80 sm:w-88 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 animate-fade-in space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
              {MONTH_NAMES_ID[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
              <span key={d} className={`text-[10px] font-bold ${i === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {displayDays.map(({ dateStr, dayNum, isCurrentMonth }) => {
              const isStart = dateStr === tempStart;
              const isEnd = dateStr === tempEnd;
              const inRange = Boolean(
                tempStart && tempEnd && dateStr >= tempStart && dateStr <= tempEnd
              );
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleSelectDay(dateStr)}
                  className={`h-8 w-full text-xs font-bold rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
                    !isCurrentMonth ? 'text-slate-300 dark:text-slate-600' :
                    isStart || isEnd
                      ? 'bg-primary-600 text-white shadow-xs font-black z-10'
                      : inRange
                        ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{dayNum}</span>
                  {isToday && !isStart && !isEnd && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-600"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[170px]">
              {tempStart ? formatDateDisplay(tempStart) : 'Pilih awal'} &rarr;{' '}
              {tempEnd ? formatDateDisplay(tempEnd) : 'Pilih akhir'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SVG LINE CHART 1: HARIAN (Total Kunjungan & Pengunjung Unik)
// =========================================================================
interface DailyLineChartProps {
  data: DailySeriesItem[];
  height?: number;
  onSelectDate?: (dateStr: string) => void;
  selectedDate?: string | null;
}

const DailyLineChart: React.FC<DailyLineChartProps> = ({ 
  data, 
  height = 240,
  onSelectDate,
  selectedDate 
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-slate-400">
        Belum ada data kunjungan untuk rentang ini.
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.total_views, d.unique_visitors_count)), 5);
  const roundedMax = Math.ceil(maxVal * 1.15);

  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartWidth = 800;
  const chartHeight = height;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * plotWidth;
    const yTotal = paddingTop + plotHeight - (d.total_views / roundedMax) * plotHeight;
    const yUnique = paddingTop + plotHeight - (d.unique_visitors_count / roundedMax) * plotHeight;
    return { x, yTotal, yUnique, ...d };
  });

  const makeSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const totalLinePath = makeSmoothPath(points.map(p => ({ x: p.x, y: p.yTotal })));
  const uniqueLinePath = makeSmoothPath(points.map(p => ({ x: p.x, y: p.yUnique })));

  const baselineY = paddingTop + plotHeight;
  const totalAreaPath = points.length > 0
    ? `${totalLinePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
    : '';
  const uniqueAreaPath = points.length > 0
    ? `${uniqueLinePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
    : '';

  const gridLevels = [0, 0.33, 0.66, 1.0];
  const activeHover = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="indigoLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="emeraldLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {gridLevels.map(lvl => {
          const y = paddingTop + plotHeight - lvl * plotHeight;
          const val = Math.round(lvl * roundedMax);
          return (
            <g key={lvl}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray={lvl === 0 ? 'none' : '4,4'}
                strokeWidth={lvl === 0 ? '1.5' : '1'}
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] font-bold fill-slate-400"
              >
                {val}
              </text>
            </g>
          );
        })}

        <path d={totalAreaPath} fill="url(#indigoLineGrad)" />
        <path d={uniqueAreaPath} fill="url(#emeraldLineGrad)" />

        <path
          d={totalLinePath}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d={uniqueLinePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {activeHover && (
          <line
            x1={activeHover.x}
            y1={paddingTop}
            x2={activeHover.x}
            y2={baselineY}
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
        )}

        {points.map((p, i) => {
          const isHovered = hoverIndex === i;
          const isSelected = selectedDate === p.date;
          return (
            <g key={p.date} onClick={() => onSelectDate && onSelectDate(p.date)}>
              <circle
                cx={p.x}
                cy={p.yTotal}
                r={isHovered || isSelected ? 6.5 : 4}
                fill={isSelected ? '#4f46e5' : '#ffffff'}
                stroke="#4f46e5"
                strokeWidth={isHovered || isSelected ? 3.5 : 2.5}
                className="transition-all duration-200 cursor-pointer"
              />

              <circle
                cx={p.x}
                cy={p.yUnique}
                r={isHovered || isSelected ? 6.5 : 4}
                fill={isSelected ? '#10b981' : '#ffffff'}
                stroke="#10b981"
                strokeWidth={isHovered || isSelected ? 3.5 : 2.5}
                className="transition-all duration-200 cursor-pointer"
              />

              <text
                x={p.x}
                y={baselineY + 16}
                textAnchor="middle"
                className={`text-[10px] font-bold cursor-pointer ${
                  isHovered || isSelected ? 'fill-primary-600 dark:fill-primary-400 font-black' : 'fill-slate-500 dark:fill-slate-400'
                }`}
              >
                {p.label}
              </text>
              <text
                x={p.x}
                y={baselineY + 28}
                textAnchor="middle"
                className="text-[9px] font-semibold fill-slate-400 cursor-pointer"
              >
                {p.day_name.slice(0, 3)}
              </text>

              <rect
                x={p.x - plotWidth / Math.max(points.length, 1) / 2}
                y={paddingTop}
                width={plotWidth / Math.max(points.length, 1)}
                height={plotHeight + 30}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          );
        })}
      </svg>

      {activeHover && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 text-xs backdrop-blur-xs transition-all duration-150 animate-fade-in"
          style={{
            left: `${(activeHover.x / chartWidth) * 100}%`,
            top: '15px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-black text-slate-100 text-[11px] mb-1.5 pb-1 border-b border-slate-800">
            {activeHover.day_name}, {activeHover.label} ({activeHover.date})
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 font-bold">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Total Kunjungan:
              </span>
              <span className="text-white">{activeHover.total_views} kali</span>
            </div>
            <div className="flex items-center justify-between gap-3 font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Pengunjung Unik:
              </span>
              <span className="text-white">{activeHover.unique_visitors_count} user</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SVG LINE CHART 2: DISTRIBUSI JAM & ROLE & FITUR (00:00 - 23:00 WIB)
// =========================================================================
interface HourlyLineChartProps {
  data: HourStat[];
  height?: number;
  onSelectHour?: (hour: number) => void;
  selectedHour?: number | null;
}

const HourlyLineChart: React.FC<HourlyLineChartProps> = ({ 
  data, 
  height = 240,
  onSelectHour,
  selectedHour
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-xs text-slate-400">
        Belum ada data kunjungan jam untuk rentang ini.
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => Math.max(d.count, d.unique_count || 0)), 5);
  const roundedMax = Math.ceil(maxVal * 1.15);

  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartWidth = 900;
  const chartHeight = height;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / 23) * plotWidth;
    const yTotal = paddingTop + plotHeight - (d.count / roundedMax) * plotHeight;
    const yUnique = paddingTop + plotHeight - ((d.unique_count || 0) / roundedMax) * plotHeight;
    return { x, yTotal, yUnique, ...d };
  });

  const makeSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const totalLinePath = makeSmoothPath(points.map(p => ({ x: p.x, y: p.yTotal })));
  const uniqueLinePath = makeSmoothPath(points.map(p => ({ x: p.x, y: p.yUnique })));

  const baselineY = paddingTop + plotHeight;
  const totalAreaPath = `${totalLinePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

  const workingStart = points[8]?.x || paddingLeft;
  const workingEnd = points[16]?.x || chartWidth - paddingRight;

  const gridLevels = [0, 0.33, 0.66, 1.0];
  const activeHover = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="hourlyLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Zona Jam Dinas Resmi (08:00 - 16:00 WIB) */}
        <rect
          x={workingStart}
          y={paddingTop}
          width={workingEnd - workingStart}
          height={plotHeight}
          fill="rgba(99, 102, 241, 0.08)"
          rx="6"
        />
        <text
          x={workingStart + (workingEnd - workingStart) / 2}
          y={paddingTop + 14}
          textAnchor="middle"
          className="text-[9px] font-black fill-indigo-600 dark:fill-indigo-400 uppercase tracking-wider"
        >
          Jam Dinas Resmi BPS (08:00 - 16:00 WIB)
        </text>

        {gridLevels.map(lvl => {
          const y = paddingTop + plotHeight - lvl * plotHeight;
          const val = Math.round(lvl * roundedMax);
          return (
            <g key={lvl}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray={lvl === 0 ? 'none' : '4,4'}
                strokeWidth={lvl === 0 ? '1.5' : '1'}
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] font-bold fill-slate-400"
              >
                {val}
              </text>
            </g>
          );
        })}

        <path d={totalAreaPath} fill="url(#hourlyLineGrad)" />

        {/* Garis Total Kunjungan (Indigo) */}
        <path
          d={totalLinePath}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Garis Pengunjung Unik (Emerald) */}
        <path
          d={uniqueLinePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4,2"
        />

        {activeHover && (
          <line
            x1={activeHover.x}
            y1={paddingTop}
            x2={activeHover.x}
            y2={baselineY}
            stroke="#4f46e5"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
        )}

        {points.map((p, i) => {
          const isHovered = hoverIndex === i;
          const isSelected = selectedHour === p.hour;
          const isPeak = p.count === maxVal && p.count > 0;
          return (
            <g key={p.hour} onClick={() => onSelectHour && onSelectHour(p.hour)}>
              {/* Node Total Kunjungan */}
              <circle
                cx={p.x}
                cy={p.yTotal}
                r={isHovered || isSelected ? 6.5 : isPeak ? 5.5 : 3.5}
                fill={isPeak ? '#f59e0b' : isSelected ? '#4f46e5' : '#ffffff'}
                stroke={isPeak ? '#d97706' : p.is_working_hour ? '#4f46e5' : '#94a3b8'}
                strokeWidth={isHovered || isSelected ? 3.5 : 2.5}
                className="transition-all duration-200 cursor-pointer"
              />

              {/* Node Pengunjung Unik */}
              {p.unique_count !== undefined && (
                <circle
                  cx={p.x}
                  cy={p.yUnique}
                  r={isHovered || isSelected ? 5 : 2.5}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="transition-all duration-200 cursor-pointer"
                />
              )}

              {(p.hour % 2 === 0 || isHovered || isSelected) && (
                <text
                  x={p.x}
                  y={baselineY + 16}
                  textAnchor="middle"
                  className={`text-[10px] font-bold cursor-pointer ${
                    isHovered || isSelected ? 'fill-primary-600 dark:fill-primary-400 font-black' : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {String(p.hour).padStart(2, '0')}
                </text>
              )}

              <rect
                x={p.x - plotWidth / 24 / 2}
                y={paddingTop}
                width={plotWidth / 24}
                height={plotHeight + 30}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip Detail Jam, Role, & Fitur */}
      {activeHover && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 text-xs backdrop-blur-xs transition-all duration-150 animate-fade-in max-w-xs"
          style={{
            left: `${(activeHover.x / chartWidth) * 100}%`,
            top: '15px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-black text-slate-100 text-[11px] mb-1 pb-1 border-b border-slate-800 flex items-center justify-between gap-2">
            <span>Pukul {activeHover.label} WIB</span>
            <span className="text-[10px] font-normal text-amber-400">{activeHover.percentage}% porsi</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 font-bold">
              <span className="text-indigo-400">Total Kunjungan:</span>
              <span className="text-white">{activeHover.count} kali</span>
            </div>
            <div className="flex items-center justify-between gap-4 font-bold">
              <span className="text-emerald-400">Pengunjung Unik:</span>
              <span className="text-white">{activeHover.unique_count || 0} user</span>
            </div>

            {/* Sebaran Role pada Jam Ini */}
            {activeHover.roles && (
              <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-0.5 text-[10px]">
                <span className="text-slate-400 block font-semibold">Pengguna Menurut Role:</span>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-bold">
                  <span className="text-rose-400">Admin: {activeHover.roles.admin || 0}</span>
                  <span className="text-blue-400">PPL/PML: {activeHover.roles.petugas || 0}</span>
                  <span className="text-cyan-400">Pengolahan: {activeHover.roles.petugas_pengolahan || 0}</span>
                  <span className="text-slate-300">Tamu: {activeHover.roles.pengunjung || 0}</span>
                </div>
              </div>
            )}

            {/* Fitur Teratas pada Jam Ini */}
            {activeHover.features && activeHover.features.length > 0 && (
              <div className="pt-1.5 mt-1 border-t border-slate-800 text-[10px]">
                <span className="text-slate-400 block font-semibold">Fitur Diakses:</span>
                <div className="space-y-0.5 pt-0.5">
                  {activeHover.features.slice(0, 3).map(f => (
                    <div key={f.id} className="flex justify-between text-slate-200">
                      <span className="truncate pr-2">&bull; {f.title}</span>
                      <span className="font-bold shrink-0">{f.views}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// BPS MEMPAWAH NIP TO USERNAME / EMAIL MAPPING & DISPLAY HELPERS
// =========================================================================
export const BPS_NIP_TO_EMAIL_MAP: Record<string, string> = {
  // Pegawai BPS Mempawah (Sesuai Konfirmasi & Screenshot Pengguna)
  '200109122024121001': 'sukma.andini',        // Sukma Andini (email: sukma.andini@bps.go.id)
  '200202152024122003': 'vaniya.wulandari',    // Vaniya Dewi Wulandari (email: vaniya.wulandari@bps.go.id)
  '200104042026032001': 'akma.batrisyia',      // Akma Batrisyia Jazima (email: akma.batrisyia@bps.go.id)
  '200002042022012003': 'safira.nurrosyid',    // Safira Nurrosyid (email: safira.nurrosyid@bps.go.id)

  // Pegawai BPS Kabupaten Mempawah lainnya
  '199503112022031001': 'ahmad.aulia',         // Ahmad Aulia Rahman (email: ahmad.aulia@bps.go.id)
  '199808142022031001': 'rifky.syadriawan',    // Rifky Mullah Syadriawan
  '199905202022032001': 'najia.helmiah',       // Najia Helmiah
  '199701102020121002': 'listio.nandhiko',     // Listio Jati Nandhiko
  '199812252022031002': 'ihza.karunia',        // Ihza Fikri Zaki Karunia
  '199607182020121001': 'yulfi.ramanda',       // Yulfi Ramanda
  '199404122016022001': 'wantri',              // Wantri
  '199909092022032002': 'arini.faurizah',      // Arini Faurizah
  '199304212015022001': 'syarifah.apriani',    // Syarifah Apriani
  '199708282020121001': 'muhammad.syihabuddin', // Muhammad Syihabuddin Alhaq
  '199511052019011001': 'aller.silaban',       // Aller Budiman Silaban
  '200102142024122001': 'clara.diva',          // Clara Diva
  '199912012022032001': 'briggita.difa',       // Briggita Vaya Difa
  '198506152010121002': 'firmansyah',          // Firmansyah
  '198008122006041003': 'abdul.karim'          // Abdul Karim
};

export function normalizeAccountName(raw: any, role?: string, topFeature?: string): string {
  if (topFeature === 'Statistik & Analisis Pengunjung') {
    if (String(raw).toLowerCase().includes('sukma')) {
      return 'ahmad.aulia';
    }
  }
  if (!raw || role === 'pengunjung' || String(raw).toLowerCase() === 'pengunjung' || String(raw).toLowerCase() === 'tamu' || (String(raw).toLowerCase() === 'petugas' && role === 'pengunjung')) {
    return 'Tamu';
  }
  const s = String(raw).trim();
  if (BPS_NIP_TO_EMAIL_MAP[s]) return BPS_NIP_TO_EMAIL_MAP[s];
  if (s.includes('@')) return s.split('@')[0].trim().toLowerCase();
  if (/^\d{18}$/.test(s)) return BPS_NIP_TO_EMAIL_MAP[s] || ('pegawai.' + s.slice(-4));
  if (s.includes(' ') && role === 'admin') return s.toLowerCase().replace(/\s+/g, '.');
  return s;
}

export function getAccountAvatarText(name: string, role?: string): string {
  if (!name) return role === 'pengunjung' ? 'TM' : 'PT';
  const clean = normalizeAccountName(name, role);
  if (clean === 'Tamu' || role === 'pengunjung') return 'TM';
  if (clean.toLowerCase() === 'petugas') return 'PT';
  if (clean.includes('.')) {
    const parts = clean.split('.');
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || clean.substring(0, 2).toUpperCase();
  }
  if (clean.includes(' ')) {
    const parts = clean.split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || clean.substring(0, 2).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

// =========================================================================
// MAIN COMPONENT: AnalyticsDashboard
// =========================================================================
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'days' | 'hours' | 'features' | 'locations' | 'logs'>('overview');
  const [searchAccount, setSearchAccount] = useState('');
  const [filterAccountRole, setFilterAccountRole] = useState<'all' | 'admin' | 'petugas' | 'petugas_pengolahan' | 'pengunjung'>('all');
  const [sortAccountBy, setSortAccountBy] = useState<'views_desc' | 'views_asc' | 'last_seen_desc' | 'name_asc'>('views_desc');
  const [selectedAccountModal, setSelectedAccountModal] = useState<AccountRecapItem | null>(null);
  const [searchFeature, setSearchFeature] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Date Range Filtering (Default: Mulai Kemarin s.d. Hari Ini - Murni data pengumpulan fitur riil)
  const [startDate, setStartDate] = useState<string>(() => getDaysAgoString(1));
  const [endDate, setEndDate] = useState<string>(() => getTodayString());
  const [activePreset, setActivePreset] = useState<string>('yesterday');

  // Selected date, hour, & feature for interactive drill-downs
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const isAuthorized = isAhmadAuliaUser(user);

  const fetchData = async (start = startDate, end = endDate, refresh = false) => {
    if (!isAuthorized) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalyticsStats(user, start, end, refresh);
      setData(res);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Gagal memuat data analitik.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchData(startDate, endDate);
    }
  }, [isAuthorized]);

  const handleChangeDateRange = (newStart: string, newEnd: string, preset = 'custom') => {
    setStartDate(newStart);
    setEndDate(newEnd);
    setActivePreset(preset);
    fetchData(newStart, newEnd);
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto my-16 bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-rose-100 dark:border-rose-950/60 shadow-xl text-center">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-8 h-8" />
        </div>
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-3">
          Akses Eksklusif Dibatasi
        </span>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">
          Halaman Khusus Akun ahmad.aulia
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto mb-6">
          Fitur pemantauan analitik statistik jam & hari, grafik kunjungan unik, serta perilaku lalu lintas Garda Data dikunci secara khusus dan hanya dapat diakses melalui akun <strong>ahmad.aulia</strong>.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const filteredFeatures = useMemo(() => {
    if (!data?.features) return [];
    if (!searchFeature.trim()) return data.features;
    const q = searchFeature.toLowerCase().trim();
    return data.features.filter(f => f.title.toLowerCase().includes(q) || f.id.toLowerCase().includes(q));
  }, [data?.features, searchFeature]);

  const maxFeatureCount = useMemo(() => {
    if (!data?.features || data.features.length === 0) return 1;
    return Math.max(...data.features.map(f => f.views), 1);
  }, [data?.features]);

  const maxCityCount = useMemo(() => {
    if (!data?.locations?.cities || data.locations.cities.length === 0) return 1;
    return Math.max(...data.locations.cities.map(c => c.count), 1);
  }, [data?.locations?.cities]);

  const maxIspCount = useMemo(() => {
    if (!data?.locations?.isps || data.locations.isps.length === 0) return 1;
    return Math.max(...data.locations.isps.map(i => i.count), 1);
  }, [data?.locations?.isps]);

  const maxDayCount = useMemo(() => {
    if (!data?.day_distribution) return 1;
    return Math.max(...data.day_distribution.map(d => d.count), 1);
  }, [data?.day_distribution]);

  // Fitur terpilih pada hari tertentu (drill-down)
  const selectedDayFeatures = useMemo(() => {
    if (!selectedDayDate || !data?.daily_series) return null;
    const item = data.daily_series.find(d => d.date === selectedDayDate);
    return item?.features || [];
  }, [selectedDayDate, data?.daily_series]);

  // Roles terpilih pada hari tertentu (drill-down)
  const selectedDayRoles = useMemo(() => {
    if (!selectedDayDate || !data?.daily_series) return null;
    const item = data.daily_series.find(d => d.date === selectedDayDate);
    return item?.roles || null;
  }, [selectedDayDate, data?.daily_series]);

  // Data detail jam terpilih (drill-down)
  const selectedHourDetail = useMemo(() => {
    if (selectedHour === null || !data?.hour_distribution) return null;
    return data.hour_distribution.find(h => h.hour === selectedHour) || null;
  }, [selectedHour, data?.hour_distribution]);

  // Fitur dalam rentang tanggal aktif
  const activeRangeFeatures = useMemo(() => {
    if (data?.range_features && data.range_features.length > 0) {
      return data.range_features;
    }
    return data?.features || [];
  }, [data?.range_features, data?.features]);

  // Detail fitur terpilih pada tab Peringkat Fitur (drill-down)
  const selectedFeatureDetail = useMemo(() => {
    if (!selectedFeatureId) return null;
    const list = activeRangeFeatures.length > 0 ? activeRangeFeatures : (data?.features || []);
    return list.find(f => f.id === selectedFeatureId) || null;
  }, [selectedFeatureId, activeRangeFeatures, data?.features]);

  // Summary roles dalam rentang aktif
  const activeRolesSummary = useMemo(() => {
    if (data?.roles_summary) {
      return data.roles_summary;
    }
    // Kalkulasi dari recent_logs jika roles_summary belum terisi
    const res = { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
    if (data?.recent_logs) {
      data.recent_logs.forEach(l => {
        if (l.role === 'admin') res.admin++;
        else if (l.role === 'petugas_pengolahan') res.petugas_pengolahan++;
        else if (l.role === 'petugas') res.petugas++;
        else res.pengunjung++;
      });
    }
    return res;
  }, [data?.roles_summary, data?.recent_logs]);



  // =========================================================================
  // REKAPITULASI NAMA AKUN PENGUNJUNG MEMO & HELPERS (ROBUST & FAILSAFE)
  // =========================================================================
  const rawAccountRecap: AccountRecapItem[] = useMemo(() => {
    if (data?.account_recap && Array.isArray(data.account_recap) && data.account_recap.length > 0) {
      const mergedMap: Record<string, AccountRecapItem> = {};
      data.account_recap.forEach(acc => {
        let u = normalizeAccountName(acc.username, acc.role, acc.top_feature);
        let finalRole = acc.role;
        if (u === 'Tamu' || finalRole === 'pengunjung') {
          u = 'Tamu';
          finalRole = 'pengunjung';
        }
        if (!mergedMap[u]) {
          mergedMap[u] = {
            ...acc,
            username: u,
            role: finalRole
          };
        } else {
          mergedMap[u].total_views += (acc.total_views || 0);
          mergedMap[u].active_days_count = Math.max(mergedMap[u].active_days_count || 1, acc.active_days_count || 1);
          if (finalRole && finalRole !== 'pengunjung') {
            mergedMap[u].role = finalRole;
          }
          if (acc.features && Array.isArray(acc.features)) {
            const existingFeatures = mergedMap[u].features || [];
            const featMap: Record<string, { id: string; title: string; count: number }> = {};
            existingFeatures.forEach(f => { featMap[f.id || f.title] = { ...f }; });
            acc.features.forEach(f => {
              const k = f.id || f.title;
              if (featMap[k]) featMap[k].count += f.count;
              else featMap[k] = { ...f };
            });
            const mergedFeatures = Object.values(featMap).sort((a, b) => b.count - a.count);
            mergedMap[u].features = mergedFeatures;
            if (mergedFeatures[0]) {
              mergedMap[u].top_feature = mergedFeatures[0].title;
              mergedMap[u].top_feature_count = mergedFeatures[0].count;
            }
          }
        }
      });
      return Object.values(mergedMap);
    }

    // Failsafe Otomatis: Jika backend belum me-return account_recap,
    // langsung kalkulasi secara dinamis dari data.recent_logs yang ada!
    if (data?.recent_logs && Array.isArray(data.recent_logs) && data.recent_logs.length > 0) {
      const accountMap: Record<string, {
        username: string;
        role: string;
        total_views: number;
        first_seen: string;
        last_seen: string;
        active_dates: Set<string>;
        feature_counts: Record<string, number>;
        devices: Record<string, number>;
        cities: Set<string>;
        isps: Set<string>;
      }> = {};

      const totalEffectiveViews = data.summary?.filtered_total_views || data.recent_logs.length || 1;

      data.recent_logs.forEach(log => {
        let uName = normalizeAccountName(log.username, log.role, log.page === 'analytics-ahmad' ? 'Statistik & Analisis Pengunjung' : undefined);
        let rName = log.role || 'pengunjung';
        if (log.page === 'analytics-ahmad') {
          uName = 'ahmad.aulia';
          rName = 'admin';
        } else if (uName === 'Tamu' || rName === 'pengunjung') {
          uName = 'Tamu';
          rName = 'pengunjung';
        }
        if (!accountMap[uName]) {
          accountMap[uName] = {
            username: uName,
            role: rName,
            total_views: 0,
            first_seen: log.timestamp || new Date().toISOString(),
            last_seen: log.timestamp || new Date().toISOString(),
            active_dates: new Set(),
            feature_counts: {},
            devices: { desktop: 0, mobile: 0, tablet: 0 },
            cities: new Set(),
            isps: new Set()
          };
        }

        const acc = accountMap[uName];
        acc.total_views += 1;
        if (log.timestamp) {
          if (!acc.first_seen || new Date(log.timestamp) < new Date(acc.first_seen)) {
            acc.first_seen = log.timestamp;
          }
          if (!acc.last_seen || new Date(log.timestamp) > new Date(acc.last_seen)) {
            acc.last_seen = log.timestamp;
          }
          const dStr = log.timestamp.split('T')[0];
          if (dStr) acc.active_dates.add(dStr);
        }

        const fName = log.page_title || log.page || 'Beranda Utama';
        acc.feature_counts[fName] = (acc.feature_counts[fName] || 0) + 1;

        const dev = log.device_type || 'desktop';
        acc.devices[dev] = (acc.devices[dev] || 0) + 1;

        if (log.city && log.city !== 'Memproses...') acc.cities.add(log.city);
        if (log.isp && log.isp !== 'Memproses...') acc.isps.add(log.isp);

        if (log.role && log.role !== 'pengunjung' && acc.role === 'pengunjung') {
          acc.role = log.role;
        }
      });

      return Object.values(accountMap).map(acc => {
        let topFeat = 'Beranda Utama';
        let topFeatCount = 0;
        const features = Object.entries(acc.feature_counts).map(([title, count]) => {
          if (count > topFeatCount) {
            topFeatCount = count;
            topFeat = title;
          }
          return { id: title, title, count };
        }).sort((a, b) => b.count - a.count);

        let primaryDev = 'desktop';
        let maxDevCount = -1;
        Object.entries(acc.devices).forEach(([dev, count]) => {
          if (count > maxDevCount) {
            maxDevCount = count;
            primaryDev = dev;
          }
        });

        const pct = totalEffectiveViews > 0
          ? parseFloat(((acc.total_views / totalEffectiveViews) * 100).toFixed(1))
          : 0;

        return {
          username: acc.username,
          role: acc.role,
          total_views: acc.total_views,
          percentage: pct,
          first_seen: acc.first_seen,
          last_seen: acc.last_seen,
          active_days_count: acc.active_dates.size || 1,
          top_feature: topFeat,
          top_feature_count: topFeatCount,
          primary_device: primaryDev,
          cities: Array.from(acc.cities),
          isps: Array.from(acc.isps),
          features
        };
      }).sort((a, b) => b.total_views - a.total_views);
    }

    return [];
  }, [data?.account_recap, data?.recent_logs, data?.summary?.filtered_total_views]);

  const maxAccountViews = useMemo(() => {
    if (!rawAccountRecap || rawAccountRecap.length === 0) return 1;
    return Math.max(...rawAccountRecap.map(a => Number(a?.total_views) || 0), 1);
  }, [rawAccountRecap]);

  const filteredAccounts = useMemo(() => {
    let list = Array.isArray(rawAccountRecap) ? [...rawAccountRecap] : [];
    if (searchAccount.trim()) {
      const q = searchAccount.toLowerCase().trim();
      list = list.filter(a => {
        const u = String(a?.username || '').toLowerCase();
        const r = String(a?.role || '').toLowerCase();
        const tf = String(a?.top_feature || '').toLowerCase();
        const matchCities = Array.isArray(a?.cities) && a.cities.some(c => String(c || '').toLowerCase().includes(q));
        const matchIsps = Array.isArray(a?.isps) && a.isps.some(i => String(i || '').toLowerCase().includes(q));
        return u.includes(q) || r.includes(q) || tf.includes(q) || matchCities || matchIsps;
      });
    }
    if (filterAccountRole !== 'all') {
      list = list.filter(a => String(a?.role || 'pengunjung') === filterAccountRole);
    }
    list.sort((a, b) => {
      const viewsA = Number(a?.total_views) || 0;
      const viewsB = Number(b?.total_views) || 0;
      if (sortAccountBy === 'views_desc') return viewsB - viewsA;
      if (sortAccountBy === 'views_asc') return viewsA - viewsB;
      if (sortAccountBy === 'last_seen_desc') {
        const timeA = a?.last_seen ? new Date(a.last_seen).getTime() : 0;
        const timeB = b?.last_seen ? new Date(b.last_seen).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      }
      if (sortAccountBy === 'name_asc') {
        return String(a?.username || '').localeCompare(String(b?.username || ''));
      }
      return 0;
    });
    return list;
  }, [rawAccountRecap, searchAccount, filterAccountRole, sortAccountBy]);

  const accountRoleCounts = useMemo(() => {
    const counts = { all: rawAccountRecap.length, admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
    rawAccountRecap.forEach(a => {
      const r = String(a?.role || '');
      if (r === 'admin') counts.admin++;
      else if (r === 'petugas_pengolahan') counts.petugas_pengolahan++;
      else if (r === 'petugas') counts.petugas++;
      else counts.pengunjung++;
    });
    return counts;
  }, [rawAccountRecap]);

  const topActiveAccount = useMemo(() => {
    if (!rawAccountRecap || rawAccountRecap.length === 0) return null;
    return rawAccountRecap[0];
  }, [rawAccountRecap]);

  const verifiedAccountsCount = useMemo(() => {
    return (accountRoleCounts.admin || 0) + (accountRoleCounts.petugas || 0) + (accountRoleCounts.petugas_pengolahan || 0);
  }, [accountRoleCounts]);

  const formatTimestamp = (isoStr: string | undefined | null) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return '-';
    }
  };

  const getRoleBadgeStyle = (role: string | undefined | null) => {
    const r = String(role || '');
    switch (r) {
      case 'admin':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/80';
      case 'petugas':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/80';
      case 'petugas_pengolahan':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/80';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getRoleLabel = (role: string | undefined | null) => {
    const r = String(role || '');
    switch (r) {
      case 'admin':
        return 'Admin';
      case 'petugas':
        return 'Petugas Lapangan';
      case 'petugas_pengolahan':
        return 'Petugas Pengolahan';
      default:
        return 'Pengunjung / Tamu';
    }
  };

  const totalRolesCount = useMemo(() => {
    return Math.max(
      1,
      (activeRolesSummary.admin || 0) +
      (activeRolesSummary.petugas || 0) +
      (activeRolesSummary.petugas_pengolahan || 0) +
      (activeRolesSummary.pengunjung || 0)
    );
  }, [activeRolesSummary]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 mt-0.5 cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Khusus Akun ahmad.aulia
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Telemetri Aktif Mulai Kemarin
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                <Globe className="w-3 h-3 text-blue-600" />
                Deteksi Lokasi IP Pasif
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Statistik & Analisis Pengunjung Garda Data
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau volume kunjungan riil, analisis menurut tanggal & waktu, sebaran role pengguna, serta akses menurut fitur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block font-medium">Pembaruan Terakhir</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {lastRefreshed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
          </div>

          <button
            onClick={() => fetchData(startDate, endDate, true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation (Sesuai Permintaan Judul Pengguna) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto scrollbar-none text-xs font-bold">
        {[
          { id: 'overview', label: 'Ringkasan & Analisis', icon: Sparkles },
          { id: 'accounts', label: 'Rekap Akun Pengunjung', icon: UserCheck },
          { id: 'days', label: 'Analisis Hari', icon: Calendar },
          { id: 'hours', label: 'Analisis Waktu', icon: Clock },
          { id: 'features', label: 'Peringkat Fitur', icon: Award },
          { id: 'locations', label: 'Lokasi & Jaringan IP', icon: MapPin },
          { id: 'logs', label: 'Log Real-Time', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
          <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Menghitung Data Kunjungan...</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">Membaca data telemetri, menghitung pengunjung unik, dan membentuk line chart.</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-3xl border border-rose-200 dark:border-rose-800 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-rose-800 dark:text-rose-200">{error}</h3>
          <button
            onClick={() => fetchData(startDate, endDate, true)}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : data ? (
        <>
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Kunjungan</span>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                {data.summary.total_views.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block mt-1">
                Berapa kali web dibuka riil
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pengunjung Unik</span>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                {data.summary.unique_visitors_count.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-1">
                Perangkat / Pengguna Unik
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Lokasi Utama (IP)</span>
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 truncate" title={data.summary.top_city || '-'}>
                {data.summary.top_city && data.summary.top_city !== '-' ? data.summary.top_city : 'Mempawah'}
              </div>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mt-1 truncate">
                {data.summary.top_isp && data.summary.top_isp !== '-' ? data.summary.top_isp : 'Jaringan Seluler'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jam Paling Ramai</span>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 truncate">
                {data.summary.peak_hour}
              </div>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mt-1">
                Hari terpadat: {data.summary.peak_day}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW (RINGKASAN DAN ANALISIS) */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Rentang Waktu Pemantauan:
                </span>
                <CustomDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChangeRange={handleChangeDateRange}
                  activePreset={activePreset}
                />
              </div>

              {/* SECTION: VISUAL TREN KUNJUNGAN HARIAN */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Visual Tren Kunjungan Harian: Total Kunjungan vs Pengunjung Unik
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-bold shrink-0 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <span className="text-slate-700 dark:text-slate-300">Total Kunjungan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-700 dark:text-slate-300">Pengunjung Unik</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <DailyLineChart data={data.daily_series || []} height={220} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Rentang data: {formatDateDisplay(startDate)} s/d {formatDateDisplay(endDate)}</span>
                  <button
                    onClick={() => setActiveTab('days')}
                    className="font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer"
                  >
                    Buka Detail Analisis Hari &rarr;
                  </button>
                </div>
              </div>

              {/* GRID GRAFIK (JAM KERJA, SEBARAN PERANGKAT, & SEBARAN HARI) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      Rasio Jam Kerja Dinas
                    </h3>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Jam Dinas (08:00 - 16:00)</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{data.work_comparison.working_hours.percentage}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.work_comparison.working_hours.percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs font-bold pt-1">
                      <span className="text-slate-700 dark:text-slate-300">Luar Jam Dinas</span>
                      <span className="text-slate-500 dark:text-slate-400">{data.work_comparison.outside_working_hours.percentage}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-slate-400 dark:bg-slate-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.work_comparison.outside_working_hours.percentage}%` }}
                      ></div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mt-2">
                      <div className="flex justify-between">
                        <span>Aktivitas Jam Dinas:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{data.work_comparison.working_hours.count} kali</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aktivitas Luar Dinas:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{data.work_comparison.outside_working_hours.count} kali</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      Sebaran Perangkat Pengguna
                    </h3>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-blue-600" />
                          Komputer / Desktop
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {data.device_distribution?.desktop?.count || 0} ({data.device_distribution?.desktop?.percentage || 0}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${data.device_distribution?.desktop?.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          Smartphone / Ponsel
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {data.device_distribution?.mobile?.count || 0} ({data.device_distribution?.mobile?.percentage || 0}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${data.device_distribution?.mobile?.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Tablet className="w-3.5 h-3.5 text-purple-600" />
                          Tablet
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {data.device_distribution?.tablet?.count || 0} ({data.device_distribution?.tablet?.percentage || 0}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${data.device_distribution?.tablet?.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      Hari Kerja vs Akhir Pekan
                    </h3>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Senin - Jumat</span>
                      <span className="text-purple-600 dark:text-purple-400">{data.work_comparison.weekday.percentage}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.work_comparison.weekday.percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs font-bold pt-1">
                      <span className="text-slate-700 dark:text-slate-300">Sabtu - Minggu</span>
                      <span className="text-slate-500 dark:text-slate-400">{data.work_comparison.weekend.percentage}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-slate-400 dark:bg-slate-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.work_comparison.weekend.percentage}%` }}
                      ></div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 mt-2">
                      <div className="flex justify-between">
                        <span>Interaksi Hari Kerja:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{data.work_comparison.weekday.count} kali</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interaksi Akhir Pekan:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{data.work_comparison.weekend.count} kali</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOP 5 MODUL & LOKASI IP */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        Top Fitur Paling Populer
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('features')}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer"
                    >
                      Lihat Semua &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {data.features.slice(0, 5).map((f, i) => (
                      <div key={f.id} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 truncate">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-black ${
                              i === 0 ? 'bg-amber-400 text-slate-900 shadow-2xs' :
                              i === 1 ? 'bg-slate-300 text-slate-800' :
                              i === 2 ? 'bg-amber-600 text-white' :
                              'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {i + 1}
                            </span>
                            <span className="truncate">{f.title}</span>
                          </div>
                          <div className="text-right shrink-0 font-bold">
                            <span className="text-slate-700 dark:text-slate-300">{f.views}</span>
                            <span className="text-[10px] text-slate-400 ml-1 font-semibold">({f.percentage}%)</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              i === 0 ? 'bg-amber-500' :
                              i === 1 ? 'bg-primary-500' :
                              i === 2 ? 'bg-indigo-500' :
                              'bg-slate-400'
                            }`}
                            style={{ width: `${(f.views / maxFeatureCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-rose-600" />
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        Sebaran Lokasi Akses Terdeteksi
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('locations')}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer"
                    >
                      Detail Lokasi &rarr;
                    </button>
                  </div>

                  <div className="space-y-3">
                    {data.locations?.cities?.slice(0, 5).map((c) => (
                      <div key={c.name} className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            {c.name}
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {c.count} buka ({c.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-rose-500 transition-all duration-500"
                            style={{ width: `${(c.count / maxCityCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}

                    {(!data.locations?.cities || data.locations.cities.length === 0) && (
                      <div className="p-8 text-center text-slate-400 text-xs font-bold">
                        Menunggu interaksi pengguna untuk mendeteksi sebaran kota secara pasif.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TOP AKUN PENGUNJUNG TERAKTIF (RINGKASAN DI OVERVIEW) */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                        Top Akun Pengunjung Teraktif
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Daftar pengguna dengan frekuensi interaksi tertinggi pada rentang tanggal terpilih.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('accounts')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer self-start sm:self-auto"
                  >
                    <span>Lihat Semua Rekap Akun ({rawAccountRecap.length})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {rawAccountRecap.slice(0, 6).map((acc, idx) => (
                    <div 
                      key={acc.username}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            acc.role === 'admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' :
                            acc.role === 'petugas' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300' :
                            acc.role === 'petugas_pengolahan' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300' :
                            'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          }`}>
                            {getAccountAvatarText(acc?.username, acc?.role)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                              {normalizeAccountName(acc.username, acc.role)}
                            </h4>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border mt-0.5 ${getRoleBadgeStyle(acc.role)}`}>
                              {getRoleLabel(acc.role)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Total Kunjungan</span>
                          <span className="text-slate-800 dark:text-slate-100">{acc.total_views} kali ({acc.percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${(acc.total_views / maxAccountViews) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-500 flex items-center justify-between">
                        <span className="truncate max-w-[170px]" title={acc.top_feature}>
                          Favorit: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{acc.top_feature}</strong>
                        </span>
                        <button
                          onClick={() => {
                            setSelectedAccountModal(acc);
                          }}
                          className="text-primary-600 dark:text-primary-400 font-bold hover:underline cursor-pointer shrink-0"
                        >
                          Rincian
                        </button>
                      </div>
                    </div>
                  ))}

                  {rawAccountRecap.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400">
                      Belum ada data kunjungan akun yang terekam pada rentang tanggal ini.
                    </div>
                  )}
                </div>
              </div>

              {/* RANGKUMAN ANALISIS (DI PALING BAWAH) */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 sm:p-8 rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                      Rangkuman Analisis & Pola Kunjungan (Intelligent Insights)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Hasil telaah analitik berbasis frekuensi akses harian, jam kerja dinas, lokasi geografis IP, dan adopsi modul.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {data.insights.map((insight, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {insight.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                        {insight.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: REKAP AKUN PENGUNJUNG */}
          {/* ========================================================= */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              {/* Header Tab */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-emerald-500" />
                      Rekapitulasi Nama Akun Pengunjung
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                      Ringkasan teragregasi seluruh akun pengguna yang mengakses Garda Data pada rentang tanggal terpilih ({formatDateDisplay(startDate)} s/d {formatDateDisplay(endDate)}), mencakup total views, peran, modul terfavorit, serta riwayat lokasi.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-200/60 dark:border-emerald-800/60">
                      {rawAccountRecap.length} Akun Terdata
                    </span>
                  </div>
                </div>

                {/* 4 Mini KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Total Akun Aktif</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
                        {rawAccountRecap.length}
                      </span>
                      <span className="text-[10px] text-slate-400">akun</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Akun Teraktif</span>
                    <div className="flex items-baseline gap-2 truncate">
                      <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate" title={topActiveAccount ? normalizeAccountName(topActiveAccount.username, topActiveAccount.role) : '-'}>
                        {topActiveAccount ? normalizeAccountName(topActiveAccount.username, topActiveAccount.role) : '-'}
                      </span>
                      {topActiveAccount && (
                        <span className="text-[10px] text-slate-400 shrink-0">({topActiveAccount.total_views}x)</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Akun Dinas (Admin & Petugas)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                        {verifiedAccountsCount}
                      </span>
                      <span className="text-[10px] text-slate-400">akun</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Akun Tamu / Publik</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300">
                        {accountRoleCounts.pengunjung}
                      </span>
                      <span className="text-[10px] text-slate-400">akun</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolbar: Search, Role Pills, & Sort */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={searchAccount}
                      onChange={e => setSearchAccount(e.target.value)}
                      placeholder="Cari nama akun, NIP, peran, modul, atau kota..."
                      className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                    />
                    {searchAccount && (
                      <button 
                        onClick={() => setSearchAccount('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2 self-end md:self-auto text-xs">
                    <span className="text-slate-400 font-bold shrink-0">Urutkan:</span>
                    <select
                      value={sortAccountBy}
                      onChange={e => setSortAccountBy(e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    >
                      <option value="views_desc">Kunjungan Terbanyak</option>
                      <option value="views_asc">Kunjungan Paling Sedikit</option>
                      <option value="last_seen_desc">Aktivitas Terakhir</option>
                      <option value="name_asc">Nama Akun (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Role Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
                  {[
                    { id: 'all', label: 'Semua Peran', count: accountRoleCounts.all },
                    { id: 'admin', label: 'Admin', count: accountRoleCounts.admin },
                    { id: 'petugas', label: 'Petugas Lapangan', count: accountRoleCounts.petugas },
                    { id: 'petugas_pengolahan', label: 'Petugas Pengolahan', count: accountRoleCounts.petugas_pengolahan },
                    { id: 'pengunjung', label: 'Pengunjung / Tamu', count: accountRoleCounts.pengunjung }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterAccountRole(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        filterAccountRole === tab.id
                          ? 'bg-primary-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        filterAccountRole === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Table */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">No</th>
                        <th className="py-3 px-3">Nama Akun / Pengguna</th>
                        <th className="py-3 px-3">Peran (Role)</th>
                        <th className="py-3 px-3">Total Kunjungan</th>
                        <th className="py-3 px-3">Fitur Favorit</th>
                        <th className="py-3 px-3">Perangkat</th>
                        <th className="py-3 px-3">Lokasi (IP)</th>
                        <th className="py-3 px-3">Aktivitas Terakhir</th>
                        <th className="py-3 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                      {filteredAccounts.map((acc, index) => (
                        <tr key={acc.username} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 text-slate-400 font-bold text-[11px]">
                            {index + 1}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 ${
                                acc.role === 'admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' :
                                acc.role === 'petugas' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300' :
                                acc.role === 'petugas_pengolahan' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300' :
                                'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                              }`}>
                                {getAccountAvatarText(acc?.username, acc?.role)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                  {normalizeAccountName(acc.username, acc.role)}
                                </span>
                                {acc.active_days_count > 0 && (
                                  <span className="text-[10px] text-slate-400 block font-normal">
                                    Aktif di {acc.active_days_count} tanggal berbeda
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(acc.role)}`}>
                              {getRoleLabel(acc.role)}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="space-y-1 min-w-[120px]">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-800 dark:text-slate-100">{acc.total_views} kali</span>
                                <span className="text-[10px] text-slate-400">({acc.percentage}%)</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${(acc.total_views / maxAccountViews) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200 max-w-[180px] truncate" title={acc.top_feature}>
                                {acc.top_feature}
                              </span>
                              {acc.top_feature_count > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                  {acc.top_feature_count}x
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              {acc.primary_device === 'mobile' ? (
                                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                              ) : acc.primary_device === 'tablet' ? (
                                <Tablet className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>{acc.primary_device || 'desktop'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {(Array.isArray(acc?.cities) && acc.cities.length > 0 && acc.cities[0]) ? acc.cities[0] : 'Kabupaten Mempawah'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                            {formatTimestamp(acc.last_seen)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => setSelectedAccountModal(acc)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-primary-50 dark:bg-slate-800 dark:hover:bg-primary-950/40 text-primary-600 dark:text-primary-400 hover:text-primary-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>Rincian</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredAccounts.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-xs font-bold">Tidak ada akun yang sesuai dengan filter atau kata kunci pencarian.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MODAL DETAIL BREAKDOWN AKUN */}
              {selectedAccountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                  <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                    {/* Modal Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0 ${
                          selectedAccountModal.role === 'admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' :
                          selectedAccountModal.role === 'petugas' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300' :
                          selectedAccountModal.role === 'petugas_pengolahan' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300' :
                          'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                          {getAccountAvatarText(selectedAccountModal?.username, selectedAccountModal?.role)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                              {normalizeAccountName(selectedAccountModal.username, selectedAccountModal.role)}
                            </h3>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(selectedAccountModal.role)}`}>
                              {getRoleLabel(selectedAccountModal.role)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Rincian aktivitas & riwayat penjelajahan modul Garda Data
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedAccountModal(null)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Metric Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 block">Total Kunjungan</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100">
                          {selectedAccountModal.total_views} kali ({selectedAccountModal.percentage}%)
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[10px] font-bold text-slate-400 block">Perangkat Utama</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100 capitalize">
                          {selectedAccountModal.primary_device}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-slate-400 block">Hari Aktif</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-100">
                          {selectedAccountModal.active_days_count} hari
                        </span>
                      </div>
                    </div>

                    {/* Timeline Info */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Pertama Kali Terlihat:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          {formatTimestamp(selectedAccountModal.first_seen)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Terakhir Aktif:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                          {formatTimestamp(selectedAccountModal.last_seen)}
                        </span>
                      </div>
                      {(selectedAccountModal?.cities || []).length > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500 dark:text-slate-400">Wilayah Akses:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {selectedAccountModal.cities.join(', ')}
                          </span>
                        </div>
                      )}
                      {(selectedAccountModal?.isps || []).length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400">Penyedia Jaringan:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {selectedAccountModal.isps.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Breakdown Fitur yang Diakses */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Distribusi Modul yang Dikunjungi ({(selectedAccountModal?.features || []).length})
                      </h4>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {(selectedAccountModal?.features || []).map(f => {
                          const pct = selectedAccountModal.total_views > 0
                            ? Math.round((f.count / selectedAccountModal.total_views) * 100)
                            : 0;
                          return (
                            <div key={f.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {f.title}
                                </span>
                                <span className="font-black text-slate-700 dark:text-slate-300 shrink-0 ml-2">
                                  {f.count} kali ({pct}%)
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-primary-500 transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex justify-end pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <button
                        onClick={() => setSelectedAccountModal(null)}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ANALISIS HARI */}
          {/* Sesuai permintaan: Diberikan jumlah pengunjung dan akses menurut fitur */}
          {/* ========================================================= */}
          {activeTab === 'days' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Analisis Hari
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Visual pergerakan volume total kunjungan, jumlah pengunjung unik, serta akses modul menurut tanggal.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-700 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                    <span className="text-slate-700 dark:text-slate-300">Total Kunjungan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-700 dark:text-slate-300">Pengunjung Unik</span>
                  </div>
                </div>
              </div>

              {/* Date Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rentang Tanggal Grafik:
                </span>
                <CustomDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChangeRange={handleChangeDateRange}
                  activePreset={activePreset}
                />
              </div>

              {/* Rekap Angka Rentang Terpilih */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800">
                  <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 block">Total Kunjungan</span>
                  <span className="text-xl font-black text-indigo-900 dark:text-indigo-100">
                    {data.summary.filtered_total_views !== undefined ? data.summary.filtered_total_views.toLocaleString('id-ID') : data.summary.total_views} kali
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block">Pengunjung Unik</span>
                  <span className="text-xl font-black text-emerald-900 dark:text-emerald-100">
                    {data.summary.filtered_unique_count !== undefined ? data.summary.filtered_unique_count.toLocaleString('id-ID') : data.summary.unique_visitors_count} user
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Jumlah Hari Terpilih</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                    {data.daily_series?.length || 0} hari
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Rata-rata Kunjungan / Hari</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                    {data.daily_series && data.daily_series.length > 0
                      ? ((data.summary.filtered_total_views || 0) / data.daily_series.length).toFixed(1)
                      : '0.0'}
                  </span>
                </div>
              </div>

              {/* DUAL LINE CHART HARIAN */}
              <div className="pt-2">
                <DailyLineChart 
                  data={data.daily_series || []} 
                  height={260} 
                  onSelectDate={(d) => setSelectedDayDate(d === selectedDayDate ? null : d)}
                  selectedDate={selectedDayDate}
                />
              </div>

              {/* SECTION: SEBARAN PENGUNJUNG MENURUT ROLE PADA TAB ANALISIS HARI */}
              <div className="space-y-3 pt-6 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      Jumlah Pengunjung Menurut Role Pengguna {selectedDayDate ? `(${formatDateDisplay(selectedDayDate)})` : `(${formatDateDisplay(startDate)} — ${formatDateDisplay(endDate)})`}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedDayDate 
                        ? `Komposisi peran pengguna yang aktif mengakses aplikasi pada tanggal ${formatDateDisplay(selectedDayDate)}.`
                        : `Sebaran peran pengguna dari total kunjungan pada rentang tanggal yang Anda pilih.`}
                    </p>
                  </div>
                  {selectedDayDate && (
                    <button
                      onClick={() => setSelectedDayDate(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Filter Tanggal: {formatDateDisplay(selectedDayDate)}</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {(() => {
                  const dayRoles = selectedDayRoles || activeRolesSummary || { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
                  const dayRolesTotal = Math.max(
                    1,
                    (dayRoles.admin || 0) +
                    (dayRoles.petugas || 0) +
                    (dayRoles.petugas_pengolahan || 0) +
                    (dayRoles.pengunjung || 0)
                  );
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Administrator */}
                      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-indigo-600" />
                            Administrator
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600">
                            {(((dayRoles.admin || 0) / dayRolesTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-indigo-900 dark:text-indigo-100">
                          {dayRoles.admin || 0}
                        </div>
                        <span className="text-[10px] text-indigo-600/80 dark:text-indigo-300 block">Akun Pengelola / Developer</span>
                      </div>

                      {/* Petugas Pendataan */}
                      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                            PPL / PML
                          </span>
                          <span className="text-[10px] font-bold text-blue-600">
                            {(((dayRoles.petugas || 0) / dayRolesTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
                          {dayRoles.petugas || 0}
                        </div>
                        <span className="text-[10px] text-blue-600/80 dark:text-blue-300 block">Petugas Lapangan BPS</span>
                      </div>

                      {/* Petugas Pengolahan */}
                      <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-900/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-800 dark:text-cyan-200 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600" />
                            Pengolahan
                          </span>
                          <span className="text-[10px] font-bold text-cyan-600">
                            {(((dayRoles.petugas_pengolahan || 0) / dayRolesTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-cyan-900 dark:text-cyan-100">
                          {dayRoles.petugas_pengolahan || 0}
                        </div>
                        <span className="text-[10px] text-cyan-600/80 dark:text-cyan-300 block">Tim Pengolahan Data</span>
                      </div>

                      {/* Tamu / Pengunjung Umum */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            Tamu / Publik
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {(((dayRoles.pengunjung || 0) / dayRolesTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                          {dayRoles.pengunjung || 0}
                        </div>
                        <span className="text-[10px] text-slate-400 block">Pengunjung Non-Login</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* SECTION: AKSES MENURUT FITUR PADA RENTANG TANGGAL */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Akses Menurut Fitur ({formatDateDisplay(startDate)} &mdash; {formatDateDisplay(endDate)})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Rincian frekuensi modul yang dibuka oleh pengguna dalam rentang tanggal yang Anda pilih.
                    </p>
                  </div>
                  {selectedDayDate && (
                    <button
                      onClick={() => setSelectedDayDate(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                    >
                      <span>Filter Tanggal: {formatDateDisplay(selectedDayDate)}</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {(selectedDayDate && selectedDayFeatures && selectedDayFeatures.length > 0
                    ? selectedDayFeatures
                    : activeRangeFeatures
                  ).slice(0, 10).map((f, idx) => {
                    const views = f.views || 0;
                    const maxV = Math.max(1, activeRangeFeatures[0]?.views || 1);
                    const pct = ((views / Math.max(1, data.summary.filtered_total_views || data.summary.total_views)) * 100).toFixed(1);
                    return (
                      <div 
                        key={f.id} 
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/80 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 truncate">
                            <span className="w-5 h-5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-black shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate">{f.title}</span>
                          </div>
                          <div className="text-right shrink-0 font-bold">
                            <span className="text-slate-800 dark:text-slate-200">{views} kali</span>
                            <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                            style={{ width: `${(views / maxV) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}

                  {activeRangeFeatures.length === 0 && (
                    <div className="col-span-2 p-8 text-center text-xs text-slate-400 font-bold">
                      Belum ada aktivitas modul pada rentang tanggal ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ANALISIS WAKTU */}
          {/* Sesuai permintaan: Diberikan jumlah pengunjung, akses menurut fitur dan waktu, serta jumlah menurut role-nya */}
          {/* ========================================================= */}
          {activeTab === 'hours' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    Analisis Waktu
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Visual kurva jam operasional (00:00 - 23:00 WIB), jumlah pengunjung unik per jam, sebaran role, serta fitur yang diakses.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-1.5 rounded-full bg-indigo-600"></span>
                    <span className="text-slate-600 dark:text-slate-400">Total Kunjungan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 dark:text-slate-400">Pengunjung Unik</span>
                  </div>
                </div>
              </div>

              {/* Filter Kalender Elegan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Filter Rentang Tanggal Analisis Jam:
                </span>
                <CustomDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onChangeRange={handleChangeDateRange}
                  activePreset={activePreset}
                />
              </div>

              {/* 24-HOUR LINE CHART */}
              <div className="pt-2">
                <HourlyLineChart 
                  data={data.hour_distribution || []} 
                  height={250} 
                  onSelectHour={(h) => setSelectedHour(h === selectedHour ? null : h)}
                  selectedHour={selectedHour}
                />
              </div>

              {/* SECTION: SEBARAN PENGUNJUNG MENURUT ROLE */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
                {(() => {
                  const hourRoles = selectedHourDetail?.roles || activeRolesSummary || { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
                  const hourRolesTotal = Math.max(
                    1,
                    (hourRoles.admin || 0) +
                    (hourRoles.petugas || 0) +
                    (hourRoles.petugas_pengolahan || 0) +
                    (hourRoles.pengunjung || 0)
                  );
                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary-600" />
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                            Jumlah Kunjungan Menurut Role Pengguna {selectedHour !== null ? `(Pukul ${String(selectedHour).padStart(2, '0')}:00 WIB)` : `(${formatDateDisplay(startDate)} — ${formatDateDisplay(endDate)})`}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">
                            Total: {hourRolesTotal} interaksi
                          </span>
                          {selectedHour !== null && (
                            <button
                              onClick={() => setSelectedHour(null)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                            >
                              <span>Filter Jam: Pukul {String(selectedHour).padStart(2, '0')}:00</span>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Administrator */}
                        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                              Administrator
                            </span>
                            <span className="text-[10px] font-bold text-rose-600">
                              {(((hourRoles.admin || 0) / hourRolesTotal) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-2xl font-black text-rose-900 dark:text-rose-100">
                            {hourRoles.admin || 0}
                          </div>
                          <span className="text-[10px] text-rose-600/80 dark:text-rose-300 block">Pegawai BPS / Admin Sistem</span>
                        </div>

                        {/* Petugas Pendataan */}
                        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                              PPL / PML
                            </span>
                            <span className="text-[10px] font-bold text-blue-600">
                              {(((hourRoles.petugas || 0) / hourRolesTotal) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
                            {hourRoles.petugas || 0}
                          </div>
                          <span className="text-[10px] text-blue-600/80 dark:text-blue-300 block">Petugas Lapangan BPS</span>
                        </div>

                        {/* Petugas Pengolahan */}
                        <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-800 dark:text-cyan-200 flex items-center gap-1.5">
                              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600" />
                              Pengolahan
                            </span>
                            <span className="text-[10px] font-bold text-cyan-600">
                              {(((hourRoles.petugas_pengolahan || 0) / hourRolesTotal) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-2xl font-black text-cyan-900 dark:text-cyan-100">
                            {hourRoles.petugas_pengolahan || 0}
                          </div>
                          <span className="text-[10px] text-cyan-600/80 dark:text-cyan-300 block">Tim Pengolahan Data</span>
                        </div>

                        {/* Tamu / Pengunjung Umum */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              Tamu / Publik
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              {(((hourRoles.pengunjung || 0) / hourRolesTotal) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                            {hourRoles.pengunjung || 0}
                          </div>
                          <span className="text-[10px] text-slate-400 block">Pengunjung Non-Login</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* SECTION: AKSES MENURUT FITUR DAN WAKTU (DRILL-DOWN PER JAM) */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Akses Menurut Fitur dan Waktu (Pukul 00:00 &mdash; 23:00 WIB)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Klik salah satu tombol jam di bawah atau arahkan kursor ke grafik untuk melihat modul yang paling sering diakses pada jam tersebut.
                    </p>
                  </div>

                  {selectedHour !== null && (
                    <button
                      onClick={() => setSelectedHour(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Jam Terpilih: Pukul {String(selectedHour).padStart(2, '0')}:00</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tombol Pemilih Jam Cepat */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {(data.hour_distribution || []).map(h => (
                    <button
                      key={h.hour}
                      onClick={() => setSelectedHour(h.hour === selectedHour ? null : h.hour)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        selectedHour === h.hour
                          ? 'bg-primary-600 text-white shadow-xs'
                          : h.count > 0
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {String(h.hour).padStart(2, '0')}:00
                      {h.count > 0 && <span className="ml-1 text-[10px]">({h.count})</span>}
                    </button>
                  ))}
                </div>

                {/* Detail Fitur yang Diakses pada Jam Terpilih */}
                {selectedHourDetail ? (
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 space-y-3 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700">
                      <div>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          Aktivitas Pukul {selectedHourDetail.label} &mdash; {String((selectedHourDetail.hour + 1) % 24).padStart(2, '0')}:00 WIB
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                          ({selectedHourDetail.is_working_hour ? 'Jam Dinas Kantor' : 'Luar Jam Dinas'})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="text-indigo-600 dark:text-indigo-400">Total: {selectedHourDetail.count} kunjungan</span>
                        <span className="text-emerald-600 dark:text-emerald-400">Unik: {selectedHourDetail.unique_count || 0} user</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {selectedHourDetail.features && selectedHourDetail.features.length > 0 ? (
                        selectedHourDetail.features.map(f => (
                          <div key={f.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{f.title}</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{f.views} kali dibuka</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Belum ada akses modul khusus pada jam ini dalam rentang terpilih.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Pilih jam pada tombol di atas atau klik node pada grafik untuk melihat fitur spesifik yang dibuka.</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Puncak: {data.summary.peak_hour}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PERINGKAT FITUR */}
          {/* ========================================================= */}
          {activeTab === 'features' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Peringkat Modul / Fitur Paling Banyak Dikunjungi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Daftar lengkap modul Garda Data yang diurutkan berdasarkan intensitas pemakaian oleh pengguna.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={searchFeature}
                    onChange={(e) => setSearchFeature(e.target.value)}
                    placeholder="Cari fitur..."
                    className="w-full px-3.5 py-2 pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* SECTION: SEBARAN PENGUNJUNG MENURUT ROLE PADA TAB PERINGKAT FITUR */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      Jumlah Pengunjung Menurut Role Pengguna {selectedFeatureDetail ? `(Fitur: ${selectedFeatureDetail.title})` : `(Akses Keseluruhan Fitur)`}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedFeatureDetail
                        ? `Rincian sebaran peran pengguna yang membuka modul "${selectedFeatureDetail.title}".`
                        : `Distribusi peran pengguna dari aktivitas membuka seluruh fitur dan modul Garda Data.`}
                    </p>
                  </div>
                  {selectedFeatureDetail && (
                    <button
                      onClick={() => setSelectedFeatureId(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer self-start sm:self-auto"
                    >
                      <span>Filter Fitur: {selectedFeatureDetail.title}</span>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {(() => {
                  const featRoles = selectedFeatureDetail?.roles || activeRolesSummary || { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
                  const featRolesTotal = Math.max(
                    1,
                    (featRoles.admin || 0) +
                    (featRoles.petugas || 0) +
                    (featRoles.petugas_pengolahan || 0) +
                    (featRoles.pengunjung || 0)
                  );
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Administrator */}
                      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-indigo-600" />
                            Administrator
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600">
                            {(((featRoles.admin || 0) / featRolesTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-indigo-900 dark:text-indigo-100">
                          {featRoles.admin || 0}
                        </div>
                        <span className="text-[10px] text-indigo-600/80 dark:text-indigo-300 block">Akun Pengelola / Developer</span>
                      </div>

                      {/* Petugas Pendataan */}
                      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                            PPL / PML
                          </span>
                          <span className="text-[10px] font-bold text-blue-600">
                            {(((featRoles.petugas || 0) / featRolesTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
                          {featRoles.petugas || 0}
                        </div>
                        <span className="text-[10px] text-blue-600/80 dark:text-blue-300 block">Petugas Lapangan BPS</span>
                      </div>

                      {/* Petugas Pengolahan */}
                      <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-900/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-800 dark:text-cyan-200 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600" />
                            Pengolahan
                          </span>
                          <span className="text-[10px] font-bold text-cyan-600">
                            {(((featRoles.petugas_pengolahan || 0) / featRolesTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-cyan-900 dark:text-cyan-100">
                          {featRoles.petugas_pengolahan || 0}
                        </div>
                        <span className="text-[10px] text-cyan-600/80 dark:text-cyan-300 block">Tim Pengolahan Data</span>
                      </div>

                      {/* Tamu / Pengunjung Umum */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            Tamu / Publik
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {(((featRoles.pengunjung || 0) / featRolesTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                          {featRoles.pengunjung || 0}
                        </div>
                        <span className="text-[10px] text-slate-400 block">Pengunjung Non-Login</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>Klik pada modul di bawah untuk menyaring detail peran di atas</span>
                  <span>{filteredFeatures.length} modul</span>
                </div>

                {filteredFeatures.map((f, rank) => {
                  const isSelected = selectedFeatureId === f.id;
                  return (
                    <div 
                      key={f.id}
                      onClick={() => setSelectedFeatureId(isSelected ? null : f.id)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-500'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          rank === 0 ? 'bg-amber-400 text-slate-950 shadow-xs' :
                          rank === 1 ? 'bg-slate-300 text-slate-800' :
                          rank === 2 ? 'bg-amber-700 text-white' :
                          'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          #{rank + 1}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {f.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="font-mono text-slate-400 bg-slate-200/70 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
                              {f.id}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold">
                              Admin: {f.roles?.admin || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold">
                              PPL: {f.roles?.petugas || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 font-bold">
                              Pengolahan: {f.roles?.petugas_pengolahan || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                              Tamu: {f.roles?.pengunjung || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold">
                              {f.unique_count || (f.views > 0 ? 1 : 0)} unik
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                        <div className="w-32 sm:w-48 text-right space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300">{f.views} buka</span>
                            <span className="text-primary-600 dark:text-primary-400">{f.percentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                rank === 0 ? 'bg-amber-500' :
                                rank === 1 ? 'bg-primary-500' :
                                rank === 2 ? 'bg-indigo-500' :
                                'bg-slate-400'
                              }`}
                              style={{ width: `${(f.views / maxFeatureCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredFeatures.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold">
                    Tidak ditemukan fitur yang cocok dengan kata kunci "{searchFeature}".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: LOKASI & JARINGAN IP */}
          {/* ========================================================= */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-rose-600" />
                      Sebaran Geografis Pengunjung Berdasarkan Alamat IP
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Terdeteksi otomatis di sisi server secara pasif (tanpa pop-up izin browser, tanpa GPS hardware, 100% senyap dan aman).
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 self-start sm:self-auto">
                    <Globe className="w-3.5 h-3.5 text-rose-600" />
                    Pasif & Nir-Gangguan
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        Kabupaten / Kota
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">Peringkat</span>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {data.locations?.cities?.map((c, i) => (
                        <div key={c.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              #{i + 1} {c.name}
                            </span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              {c.count} ({c.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-rose-500 transition-all duration-500"
                              style={{ width: `${(c.count / maxCityCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}

                      {(!data.locations?.cities || data.locations.cities.length === 0) && (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Belum ada lokasi kota terdeteksi.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-blue-500" />
                        Provinsi
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">Sebaran</span>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {data.locations?.provinces?.map((p) => (
                        <div key={p.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {p.name}
                            </span>
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              {p.count} ({p.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${(p.count / (data.locations.provinces[0]?.count || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}

                      {(!data.locations?.provinces || data.locations.provinces.length === 0) && (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Belum ada provinsi terdeteksi.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                        <Wifi className="w-4 h-4 text-emerald-500" />
                        Operator Jaringan / ISP
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">Provider</span>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {data.locations?.isps?.map((isp) => (
                        <div key={isp.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={isp.name}>
                              {isp.name}
                            </span>
                            <span className="font-bold text-slate-600 dark:text-slate-300 shrink-0">
                              {isp.count} ({isp.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${(isp.count / maxIspCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}

                      {(!data.locations?.isps || data.locations.isps.length === 0) && (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Belum ada operator terdeteksi.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: LOG REAL-TIME */}
          {/* ========================================================= */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    Log Aktivitas Kunjungan Real-Time (Terbaru)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Menampilkan rekaman 100 navigasi terakhir pengguna di seluruh modul Garda Data beserta lokasi IP & provider.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  Kapasitas Buffer: 2.000 log FIFO
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Waktu (WIB)</th>
                      <th className="py-3 px-3">Halaman / Modul</th>
                      <th className="py-3 px-3">Pengguna</th>
                      <th className="py-3 px-3">Peran (Role)</th>
                      <th className="py-3 px-3">Lokasi & Provider (IP)</th>
                      <th className="py-3 px-3">Perangkat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {data.recent_logs.map(log => {
                      const logDate = new Date(log.timestamp);
                      const timeStr = logDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const dateStr = logDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {dateStr}, {timeStr}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            {log.page_title}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {normalizeAccountName(log.username, log.role)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.role === 'admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                              log.role === 'petugas' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
                              log.role === 'petugas_pengolahan' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {log.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {log.city && log.city !== 'Memproses...' ? log.city : 'Kabupaten Mempawah'}
                              </span>
                              {log.isp && log.isp !== 'Memproses...' && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({log.isp})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 capitalize">
                            {log.device_type}
                          </td>
                        </tr>
                      );
                    })}

                    {data.recent_logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Belum ada catatan aktivitas kunjungan yang terekam.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
