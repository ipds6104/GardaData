import { AuthUser } from '../lib/auth';

const VISITOR_ID_KEY = 'garda_visitor_uuid';
const LOCAL_ANALYTICS_KEY = 'garda_real_analytics_v1';

export interface FeatureStat {
  id: string;
  title: string;
  views: number;
  percentage: number;
  roles?: HourRoleBreakdown;
  unique_count?: number;
}

export interface DayStat {
  index: number;
  name: string;
  count: number;
  percentage: number;
  is_weekend: boolean;
}

export interface HourRoleBreakdown {
  admin: number;
  petugas: number;
  petugas_pengolahan: number;
  pengunjung: number;
}

export interface FeatureAccessItem {
  id: string;
  title: string;
  views: number;
}

export interface HourStat {
  hour: number;
  label: string;
  count: number;
  unique_count?: number;
  percentage: number;
  is_working_hour: boolean;
  roles?: HourRoleBreakdown;
  features?: FeatureAccessItem[];
}

export interface LocationStat {
  name: string;
  count: number;
  percentage: number;
}

export interface SmartInsight {
  type: string;
  title: string;
  content: string;
}

export interface RecentLogItem {
  id: string;
  timestamp: string;
  page: string;
  page_title: string;
  visitor_id: string;
  role: string;
  username: string;
  device_type: string;
  day_name: string;
  hour: number;
  city?: string;
  province?: string;
  isp?: string;
  ip_masked?: string;
}

export interface DailySeriesItem {
  date: string;
  day_name: string;
  label: string;
  total_views: number;
  unique_visitors_count: number;
  features?: FeatureAccessItem[];
  roles?: HourRoleBreakdown;
}

export interface DeviceDistribution {
  desktop: { count: number; percentage: number };
  mobile: { count: number; percentage: number };
  tablet: { count: number; percentage: number };
}

export interface AnalyticsDataResponse {
  success: boolean;
  message?: string;
  summary: {
    total_views: number;
    unique_visitors_count: number;
    first_tracked: string;
    last_updated: string;
    top_feature: string;
    peak_hour: string;
    peak_day: string;
    top_city?: string;
    top_isp?: string;
    filtered_total_views?: number;
    filtered_unique_count?: number;
    range?: {
      start: string;
      end: string;
    };
  };
  daily_series: DailySeriesItem[];
  features: FeatureStat[];
  range_features?: FeatureStat[];
  roles_summary?: HourRoleBreakdown;
  day_distribution: DayStat[];
  hour_distribution: HourStat[];
  locations: {
    cities: LocationStat[];
    provinces: LocationStat[];
    isps: LocationStat[];
    top_city: string;
    top_isp: string;
  };
  device_distribution: DeviceDistribution;
  work_comparison: {
    working_hours: { count: number; percentage: number };
    outside_working_hours: { count: number; percentage: number };
    weekday: { count: number; percentage: number };
    weekend: { count: number; percentage: number };
  };
  insights: SmartInsight[];
  recent_logs: RecentLogItem[];
}

const FEATURE_NAMES: Record<string, string> = {
  'landing': 'Beranda Utama',
  'kbli-2025': 'KBLI 2025 (Klasifikasi Lapangan Usaha)',
  'kbji-2014': 'KBJI 2014 (Klasifikasi Baku Jabatan)',
  'kbli-kbji': 'KBLI dan KBJI Mempawah',
  'penilaian-mitra': 'Penilaian Kinerja Mitra Statistik',
  'peta-responden-se2026': 'Peta Responden SE2026',
  'rasionalitas-ntb': 'Rasionalitas NTB SE2026',
  'laporan-pendataan': 'Laporan Pendataan Lapangan',
  'building-area': 'Pengukuran Luas Bangunan (Satelit)',
  'imputation': 'Imputasi Susenas-Seruti',
  'infrastructure': 'Infrastruktur Desa',
  'lms': 'Learning Management System (LMS)',
  'monitoring': 'Monitoring Dashboard Lapangan',
  'admin-sls': 'Peta Batas SLS Live',
  'social-phenomenon': 'Fenomena Sosial Ekonomi',
  'admin-strategic-data': 'Data Strategis BPS',
  'identifikasi-sls': 'Identifikasi SLS'
};

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Mendapatkan atau menghasilkan UUID anonim unik per perangkat browser
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'unknown_node';
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = 'vid_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return 'temp_vid_' + Date.now().toString(36);
  }
}

/**
 * Deteksi tipe perangkat secara sederhana
 */
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getWibDateString(date = new Date()): string {
  const utcMs = date.getTime() + (date.getTimezoneOffset() * 60000);
  const wibMs = utcMs + (7 * 3600000);
  const wib = new Date(wibMs);
  const y = wib.getFullYear();
  const m = String(wib.getMonth() + 1).padStart(2, '0');
  const d = String(wib.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Membaca struktur data murni dari localStorage
 */
function getCleanLocalStore(): {
  total_views: number;
  visitors: Record<string, boolean>;
  by_feature: Record<string, number>;
  by_day: Record<number, number>;
  by_hour: Record<number, number>;
  by_device: { desktop: number; mobile: number; tablet: number };
  by_city: Record<string, number>;
  by_province: Record<string, number>;
  by_isp: Record<string, number>;
  daily_records: Record<string, {
    date: string;
    day_name: string;
    total_views: number;
    unique_visitors: Record<string, boolean>;
    by_hour: Record<number, number>;
  }>;
  recent_logs: RecentLogItem[];
  first_tracked: string;
} {
  const by_day: Record<number, number> = {};
  for (let i = 0; i < 7; i++) by_day[i] = 0;

  const by_hour: Record<number, number> = {};
  for (let i = 0; i < 24; i++) by_hour[i] = 0;

  const by_feature: Record<string, number> = {};
  Object.keys(FEATURE_NAMES).forEach(f => { by_feature[f] = 0; });

  const defaultStore = {
    total_views: 0,
    visitors: {},
    by_feature,
    by_day,
    by_hour,
    by_device: { desktop: 0, mobile: 0, tablet: 0 },
    by_city: {},
    by_province: {},
    by_isp: {},
    daily_records: {},
    recent_logs: [],
    first_tracked: new Date().toISOString()
  };

  if (typeof window === 'undefined') return defaultStore;

  try {
    const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.total_views === 'number') {
        return {
          total_views: parsed.total_views,
          visitors: parsed.visitors || {},
          by_feature: { ...by_feature, ...(parsed.by_feature || {}) },
          by_day: { ...by_day, ...(parsed.by_day || {}) },
          by_hour: { ...by_hour, ...(parsed.by_hour || {}) },
          by_device: parsed.by_device || { desktop: 0, mobile: 0, tablet: 0 },
          by_city: parsed.by_city || {},
          by_province: parsed.by_province || {},
          by_isp: parsed.by_isp || {},
          daily_records: parsed.daily_records || {},
          recent_logs: Array.isArray(parsed.recent_logs) ? parsed.recent_logs : [],
          first_tracked: parsed.first_tracked || new Date().toISOString()
        };
      }
    }
  } catch {}

  return defaultStore;
}

/**
 * Menyusun respons data analitik dari data lokal offline (fallback)
 */
function buildOrganicAnalyticsResponse(startDate?: string, endDate?: string): AnalyticsDataResponse {
  const store = getCleanLocalStore();
  const rawViews = store.total_views;

  const featureList: FeatureStat[] = Object.keys(store.by_feature).map(featKey => {
    const views = store.by_feature[featKey] || 0;
    const pct = rawViews > 0 ? ((views / rawViews) * 100).toFixed(1) : '0.0';
    return {
      id: featKey,
      title: FEATURE_NAMES[featKey] || featKey,
      views,
      percentage: parseFloat(pct)
    };
  }).sort((a, b) => b.views - a.views);

  let maxDayViews = 0;
  let peakDayIdx = new Date().getDay();
  const dayStats: DayStat[] = DAY_NAMES.map((name, idx) => {
    const count = store.by_day[idx] || 0;
    if (count > maxDayViews) {
      maxDayViews = count;
      peakDayIdx = idx;
    }
    const pct = rawViews > 0 ? ((count / rawViews) * 100).toFixed(1) : '0.0';
    return {
      index: idx,
      name,
      count,
      percentage: parseFloat(pct),
      is_weekend: idx === 0 || idx === 6
    };
  });

  // Susun rentang tanggal untuk daily_series
  let dateList: string[] = [];
  if (startDate && endDate) {
    try {
      const [sy, sm, sd] = startDate.split('-').map(Number);
      const [ey, em, ed] = endDate.split('-').map(Number);
      const cur = new Date(Date.UTC(sy, sm - 1, sd));
      const end = new Date(Date.UTC(ey, em - 1, ed));
      let steps = 0;
      while (cur <= end && steps < 120) {
        const y = cur.getUTCFullYear();
        const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
        const d = String(cur.getUTCDate()).padStart(2, '0');
        dateList.push(`${y}-${m}-${d}`);
        cur.setUTCDate(cur.getUTCDate() + 1);
        steps++;
      }
    } catch {
      dateList = Object.keys(store.daily_records).sort();
    }
  } else {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateList.push(getWibDateString(d));
    }
  }

  let filteredTotalViews = 0;
  const filteredUniqueSet = new Set<string>();
  const filteredHours: Record<number, number> = {};
  for (let h = 0; h < 24; h++) filteredHours[h] = 0;

  const dailySeries: DailySeriesItem[] = dateList.map(dStr => {
    const rec = store.daily_records[dStr];
    const recViews = rec ? rec.total_views : 0;
    const recUnique = rec ? Object.keys(rec.unique_visitors || {}).length : 0;
    filteredTotalViews += recViews;

    if (rec?.unique_visitors) {
      Object.keys(rec.unique_visitors).forEach(v => filteredUniqueSet.add(v));
    }
    if (rec?.by_hour) {
      for (let h = 0; h < 24; h++) {
        filteredHours[h] += (rec.by_hour[h] || 0);
      }
    }

    const [y, m, d] = dStr.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dayName = DAY_NAMES[dateObj.getDay()];
    const label = `${parseInt(d)} ${MONTH_NAMES[parseInt(m) - 1]}`;

    return {
      date: dStr,
      day_name: dayName,
      label,
      total_views: recViews,
      unique_visitors_count: recUnique
    };
  });

  const isRangeFiltered = Boolean(startDate || endDate);
  const effectiveTotalViews = isRangeFiltered ? filteredTotalViews : rawViews;
  const effectiveUniqueCount = isRangeFiltered ? filteredUniqueSet.size : Object.keys(store.visitors).length;

  let maxHourViews = 0;
  let peakHourVal = new Date().getHours();
  const hourStats: HourStat[] = [];
  for (let h = 0; h < 24; h++) {
    const count = isRangeFiltered ? (filteredHours[h] || 0) : (store.by_hour[h] || 0);
    if (count > maxHourViews) {
      maxHourViews = count;
      peakHourVal = h;
    }
    const pct = effectiveTotalViews > 0 ? ((count / effectiveTotalViews) * 100).toFixed(1) : '0.0';
    const isWorkingHour = h >= 8 && h <= 16;
    hourStats.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      count,
      percentage: parseFloat(pct),
      is_working_hour: isWorkingHour
    });
  }

  // Lokasi Berbasis IP (Kota, Provinsi, Provider)
  const byCity = store.by_city || {};
  const cityList: LocationStat[] = Object.keys(byCity).map(city => {
    const count = byCity[city] || 0;
    const pct = rawViews > 0 ? ((count / rawViews) * 100).toFixed(1) : '0.0';
    return { name: city, count, percentage: parseFloat(pct) };
  }).sort((a, b) => b.count - a.count);

  const byProvince = store.by_province || {};
  const provinceList: LocationStat[] = Object.keys(byProvince).map(prov => {
    const count = byProvince[prov] || 0;
    const pct = rawViews > 0 ? ((count / rawViews) * 100).toFixed(1) : '0.0';
    return { name: prov, count, percentage: parseFloat(pct) };
  }).sort((a, b) => b.count - a.count);

  const byIsp = store.by_isp || {};
  const ispList: LocationStat[] = Object.keys(byIsp).map(isp => {
    const count = byIsp[isp] || 0;
    const pct = rawViews > 0 ? ((count / rawViews) * 100).toFixed(1) : '0.0';
    return { name: isp, count, percentage: parseFloat(pct) };
  }).sort((a, b) => b.count - a.count);

  const topCity = cityList[0] ? cityList[0].name : '-';
  const topIsp = ispList[0] ? ispList[0].name : '-';

  const workingHourViews = hourStats
    .filter(item => item.is_working_hour)
    .reduce((acc, curr) => acc + curr.count, 0);
  const nonWorkingHourViews = effectiveTotalViews - workingHourViews;
  const workingHourPct = effectiveTotalViews > 0 ? ((workingHourViews / effectiveTotalViews) * 100).toFixed(1) : '0.0';

  const weekdayViews = dayStats
    .filter(d => !d.is_weekend)
    .reduce((acc, curr) => acc + curr.count, 0);
  const weekendViews = rawViews - weekdayViews;
  const weekdayPct = rawViews > 0 ? ((weekdayViews / rawViews) * 100).toFixed(1) : '0.0';

  const topFeature = featureList[0] && featureList[0].views > 0
    ? featureList[0] 
    : { title: 'Belum Ada Kunjungan', views: 0, percentage: 0 };
  const peakDayName = rawViews > 0 ? DAY_NAMES[peakDayIdx] : DAY_NAMES[new Date().getDay()];
  const peakHourFormatted = effectiveTotalViews > 0 
    ? `${String(peakHourVal).padStart(2, '0')}:00 - ${String((peakHourVal + 1) % 24).padStart(2, '0')}:00 WIB`
    : `${String(new Date().getHours()).padStart(2, '0')}:00 WIB (Memulai)`;

  const dev = store.by_device || { desktop: 0, mobile: 0, tablet: 0 };
  const totalDev = Math.max(1, (dev.desktop || 0) + (dev.mobile || 0) + (dev.tablet || 0));
  const deviceDistribution: DeviceDistribution = {
    desktop: { count: dev.desktop || 0, percentage: parseFloat((((dev.desktop || 0) / totalDev) * 100).toFixed(1)) },
    mobile: { count: dev.mobile || 0, percentage: parseFloat((((dev.mobile || 0) / totalDev) * 100).toFixed(1)) },
    tablet: { count: dev.tablet || 0, percentage: parseFloat((((dev.tablet || 0) / totalDev) * 100).toFixed(1)) }
  };

  const insights: SmartInsight[] = [
    {
      type: 'primary',
      title: 'Pola Waktu Puncak (Peak Hours)',
      content: effectiveTotalViews > 0
        ? `Aktivitas tertinggi terjadi pada rentang pukul ${peakHourFormatted} dengan akumulasi ${maxHourViews.toLocaleString('id-ID')} interaksi (${((maxHourViews / effectiveTotalViews) * 100).toFixed(1)}% dari total interaksi rentang ini).`
        : `Sistem telemetri baru aktif hari ini (${new Date().toLocaleDateString('id-ID')}). Setiap kali modul dibuka, data akan tercatat secara murni.`
    },
    {
      type: 'location_pattern',
      title: 'Sebaran Wilayah & Jaringan Akses (IP)',
      content: rawViews > 0 && topCity !== '-'
        ? `Sebagian besar pengguna mengakses Garda Data dari wilayah ${topCity} (${cityList[0]?.percentage}%) dengan jaringan operator dominan ${topIsp}.`
        : `Menunggu aktivitas pengguna untuk mendeteksi sebaran wilayah kota/kabupaten dan penyedia jaringan secara pasif di latar belakang.`
    },
    {
      type: 'work_pattern',
      title: 'Rasio Jam Kerja vs Luar Jam Kerja',
      content: effectiveTotalViews > 0
        ? `${workingHourPct}% interaksi berlangsung di jam dinas resmi (08:00 - 16:00 WIB), mencerminkan penggunaan sebagai instrumen dinas BPS Kabupaten Mempawah.`
        : `Menunggu aktivitas pengguna untuk mengukur perbandingan interaksi di jam kerja dinas vs luar dinas.`
    },
    {
      type: 'day_trend',
      title: 'Hari Akses Paling Aktif',
      content: rawViews > 0
        ? `Hari ${peakDayName} merupakan hari paling aktif dengan ${maxDayViews.toLocaleString('id-ID')} kunjungan. Sebanyak ${weekdayPct}% kunjungan berlangsung pada hari kerja.`
        : `Pemantauan tren harian dimulai pada hari ${DAY_NAMES[new Date().getDay()]}.`
    },
    {
      type: 'feature_dominance',
      title: 'Fitur Paling Diminati',
      content: rawViews > 0 && topFeature.views > 0
        ? `Fitur "${topFeature.title}" menempati posisi teratas dengan ${topFeature.views.toLocaleString('id-ID')} kali dibuka (${topFeature.percentage}% pangsa).`
        : `Peringkat fitur akan tersusun secara otomatis sesuai modul yang dikunjungi petugas.`
    },
    {
      type: 'maintenance_rec',
      title: 'Rekomendasi Pemeliharaan Server',
      content: `Waktu optimal untuk rilis pembaruan atau perawatan server adalah pukul 00:00 - 05:00 WIB di saat aktivitas pengguna berada pada level terendah.`
    }
  ];

  return {
    success: true,
    summary: {
      total_views: store.total_views,
      unique_visitors_count: Object.keys(store.visitors).length,
      first_tracked: store.first_tracked,
      last_updated: new Date().toISOString(),
      top_feature: topFeature.title,
      peak_hour: peakHourFormatted,
      peak_day: peakDayName,
      top_city: topCity,
      top_isp: topIsp,
      filtered_total_views: effectiveTotalViews,
      filtered_unique_count: effectiveUniqueCount,
      range: {
        start: startDate || (dailySeries[0]?.date || getWibDateString()),
        end: endDate || (dailySeries[dailySeries.length - 1]?.date || getWibDateString())
      }
    },
    daily_series: dailySeries,
    features: featureList,
    day_distribution: dayStats,
    hour_distribution: hourStats,
    locations: {
      cities: cityList,
      provinces: provinceList,
      isps: ispList,
      top_city: topCity,
      top_isp: topIsp
    },
    device_distribution: deviceDistribution,
    work_comparison: {
      working_hours: { count: workingHourViews, percentage: parseFloat(workingHourPct) },
      outside_working_hours: { count: nonWorkingHourViews, percentage: parseFloat((100 - parseFloat(workingHourPct)).toFixed(1)) },
      weekday: { count: weekdayViews, percentage: parseFloat(weekdayPct) },
      weekend: { count: weekendViews, percentage: parseFloat((100 - parseFloat(weekdayPct)).toFixed(1)) }
    },
    insights,
    recent_logs: store.recent_logs.slice(0, 100)
  };
}

/**
 * Merekam perpindahan halaman / kunjungan fitur Garda Data secara otomatis murni mulai hari ini
 */
export async function trackPageView(page: string, user: AuthUser | null | undefined): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const visitorId = getOrCreateVisitorId();
    const role = user?.role || 'pengunjung';
    const username = user?.username || (user?.role === 'pengunjung' ? 'Tamu' : 'Petugas');
    const deviceType = getDeviceType();

    // 1. Simpan ke local store murni secara instan
    try {
      const store = getCleanLocalStore();
      store.total_views += 1;
      store.visitors[visitorId] = true;
      store.by_feature[page] = (store.by_feature[page] || 0) + 1;

      const now = new Date();
      const dayIdx = now.getDay();
      const hour = now.getHours();
      const dateKey = getWibDateString(now);

      store.by_day[dayIdx] = (store.by_day[dayIdx] || 0) + 1;
      store.by_hour[hour] = (store.by_hour[hour] || 0) + 1;

      const dType = deviceType === 'mobile' ? 'mobile' : deviceType === 'tablet' ? 'tablet' : 'desktop';
      store.by_device = store.by_device || { desktop: 0, mobile: 0, tablet: 0 };
      store.by_device[dType] = (store.by_device[dType] || 0) + 1;

      store.daily_records = store.daily_records || {};
      if (!store.daily_records[dateKey]) {
        const hInit: Record<number, number> = {};
        for (let h = 0; h < 24; h++) hInit[h] = 0;
        store.daily_records[dateKey] = {
          date: dateKey,
          day_name: DAY_NAMES[dayIdx],
          total_views: 0,
          unique_visitors: {},
          by_hour: hInit
        };
      }
      store.daily_records[dateKey].total_views += 1;
      store.daily_records[dateKey].unique_visitors[visitorId] = true;
      store.daily_records[dateKey].by_hour[hour] = (store.daily_records[dateKey].by_hour[hour] || 0) + 1;

      const newLog: RecentLogItem = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: now.toISOString(),
        page,
        page_title: FEATURE_NAMES[page] || page,
        visitor_id: visitorId,
        role: String(role).slice(0, 30),
        username: String(username).slice(0, 50),
        device_type: deviceType,
        day_name: DAY_NAMES[dayIdx],
        hour,
        city: 'Memproses...',
        province: 'Kalimantan Barat',
        isp: 'Memproses...'
      };

      store.recent_logs.unshift(newLog);
      if (store.recent_logs.length > 500) {
        store.recent_logs = store.recent_logs.slice(0, 500);
      }

      localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(store));
    } catch {}

    // 2. Kirim juga ke server non-blocking (fire and forget)
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page,
        visitorId,
        role,
        username,
        deviceType
      }),
      keepalive: true
    }).catch(() => {
      // Offline fallback
    });
  } catch {
    // Silent catch
  }
}

/**
 * Mengambil data statistik & analisis pengunjung murni mulai hari ini
 */
export async function getAnalyticsStats(
  user: AuthUser | null | undefined,
  startDate?: string,
  endDate?: string
): Promise<AnalyticsDataResponse> {
  const requestingUser = user?.username || user?.email || 'ahmadaulia';
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('navigasi_token') : null;

  try {
    let url = `/api/analytics/stats?user=${encodeURIComponent(requestingUser)}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: {
        'Accept': 'application/json',
        'x-garda-user': requestingUser,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.summary) {
        if (!serverData.daily_series || serverData.daily_series.length === 0) {
          const fallback = buildOrganicAnalyticsResponse(startDate, endDate);
          serverData.daily_series = fallback.daily_series;
        }
        return serverData;
      }
    }
  } catch (err) {
    console.warn('API /api/analytics/stats offline or unreachable, using local real telemetry:', err);
  }

  // Gunakan data riil murni yang tercatat di lokal
  return buildOrganicAnalyticsResponse(startDate, endDate);
}

/**
 * Reset data telemetri analitik menjadi 0 murni
 */
export async function resetAnalyticsData(user: AuthUser | null | undefined): Promise<boolean> {
  const requestingUser = user?.username || user?.email || 'ahmadaulia';
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_ANALYTICS_KEY);
    }
    const res = await fetch('/api/analytics/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-garda-user': requestingUser
      },
      body: JSON.stringify({ requesting_user: requestingUser })
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to reset analytics:', e);
    return false;
  }
}
