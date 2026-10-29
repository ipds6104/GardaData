const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'analytics_data.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let analyticsState = null;
let isDirty = false;
let saveTimer = null;
const ipLocationCache = new Map();

// Helper universal pengiriman JSON aman (kompatibel penuh dengan Express & Connect / Vite Dev Server)
function sendJson(res, statusCode, data) {
    try {
        if (typeof res.status === 'function' && typeof res.json === 'function') {
            return res.status(statusCode).json(data);
        }
        res.statusCode = statusCode;
        if (typeof res.setHeader === 'function') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
        res.end(JSON.stringify(data));
        return res;
    } catch (e) {
        try {
            res.statusCode = statusCode;
            res.end(JSON.stringify(data));
        } catch {}
    }
}

// Middleware kompatibilitas untuk Connect (Vite Dev Server) & Express (Production)
router.use((req, res, next) => {
    if (typeof req.url === 'string' && req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        const searchParams = new URLSearchParams(queryString);
        req.query = Object.fromEntries(searchParams.entries());
    } else if (!req.query) {
        req.query = {};
    }

    if (typeof res.status !== 'function') {
        res.status = function(code) {
            res.statusCode = code;
            return res;
        };
    }

    if (typeof res.json !== 'function') {
        res.json = function(data) {
            return sendJson(res, res.statusCode || 200, data);
        };
    }

    if (req.method === 'POST' && (!req.body || Object.keys(req.body).length === 0)) {
        let bodyStr = '';
        req.on('data', chunk => {
            bodyStr += chunk;
        });
        req.on('end', () => {
            try {
                req.body = bodyStr ? JSON.parse(bodyStr) : {};
            } catch (e) {
                req.body = {};
            }
            next();
        });
        return;
    }

    next();
});

const FEATURE_NAMES = {
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
    'identifikasi-sls': 'Identifikasi SLS',
    'visitor-dashboard': 'Halaman Tamu (Data Strategis)',
    'analytics-ahmad': 'Statistik & Analisis Pengunjung'
};

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function getWibDate(date = new Date()) {
    const utcMs = date.getTime() + (date.getTimezoneOffset() * 60000);
    const wibMs = utcMs + (7 * 3600000);
    return new Date(wibMs);
}

function getWibDateString(date = new Date()) {
    const wib = getWibDate(date);
    const y = wib.getFullYear();
    const m = String(wib.getMonth() + 1).padStart(2, '0');
    const d = String(wib.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

const NIP_TO_USERNAME = {
    // Pegawai & PPPK BPS Kabupaten Mempawah (Sesuai Data Resmi BPS)
    '196908031992111001': 'munawir',
    '196901192007011004': 'abdul.karim',
    '198603272009021005': 'supandi',
    '198204042005022005': 'sy.apriani',
    '198103182011011003': 'firmansyah2',
    '198407112011011007': 'alhaq',
    '198007142011011003': 'yulfi.ramanda',
    '199605222019012001': 'arinif',
    '199612302019011001': 'listiojati',
    '199605162019012001': 'sarah.pratiwi',
    '199101072019032001': 'wantri.mukti',
    '199606062019122001': 'safira.nurrosyid',
    '200002042022012003': 'najia.helmiah',
    '200001062023021001': 'allersilaban',
    '199910282023021005': 'ihzakarunia',
    '200109122024121001': 'ahmad.aulia',
    '200202152024122003': 'sukma.andini',
    '199907192021042001': 'vaya.difa',
    '199905272023022001': 'arsita.indah',
    '200110202023021003': 'mullahrifky',
    '200306242024122001': 'vaniya.dewi',
    '200104042026032001': 'akmabatrisyia',
    '200409072026032001': 'claralagum',
    '198008112005021004': 'muh.adwin',
    '197511292025211001': 'iskandar-pppk',
    '199908082025211024': 'haddadsaputra-pppk',
    '198805282025211043': 'rizakurniawan-pppk'
};

function normalizeUsername(raw, role, page) {
    if (page === 'analytics-ahmad') return 'ahmad.aulia';
    if (!raw || role === 'pengunjung' || String(raw).toLowerCase() === 'pengunjung' || String(raw).toLowerCase() === 'tamu' || (String(raw).toLowerCase() === 'petugas' && role === 'pengunjung')) {
        return 'Tamu';
    }
    let u = String(raw).trim();
    if (NIP_TO_USERNAME[u]) return NIP_TO_USERNAME[u];
    if (u.includes('@')) {
        u = u.split('@')[0].trim().toLowerCase();
    }
    if (/^\d{18}$/.test(u)) {
        return NIP_TO_USERNAME[u] || ('pegawai.' + u.slice(-4));
    }
    if (u.includes(' ') && role === 'admin') {
        return u.toLowerCase().replace(/\s+/g, '.');
    }
    return u;
}


// Inisialisasi struktur data murni mulai hari ini (Nol / Pure Organic)
function createCleanAnalytics() {
    const by_day = {};
    for (let i = 0; i < 7; i++) by_day[i] = 0;

    const by_hour = {};
    for (let i = 0; i < 24; i++) by_hour[i] = 0;

    const by_feature = {};
    Object.keys(FEATURE_NAMES).forEach(feat => {
        by_feature[feat] = 0;
    });

    const now = new Date();
    return {
        summary: {
            total_views: 0,
            unique_visitors_count: 0,
            first_tracked: now.toISOString(),
            last_updated: now.toISOString()
        },
        unique_visitors: {},
        by_feature,
        by_day,
        by_hour,
        by_city: {},
        by_province: {},
        by_isp: {},
        by_device: { desktop: 0, mobile: 0, tablet: 0 },
        daily_records: {}, // Map 'YYYY-MM-DD' -> record
        recent_logs: []
    };
}

function loadAnalyticsFromDisk() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.summary && parsed.by_day && parsed.by_hour && parsed.by_feature) {
                Object.keys(FEATURE_NAMES).forEach(feat => {
                    if (typeof parsed.by_feature[feat] !== 'number') {
                        parsed.by_feature[feat] = 0;
                    }
                });
                parsed.by_city = parsed.by_city || {};
                parsed.by_province = parsed.by_province || {};
                parsed.by_isp = parsed.by_isp || {};
                parsed.by_device = parsed.by_device || { desktop: 0, mobile: 0, tablet: 0 };
                parsed.daily_records = parsed.daily_records || {};
                parsed.recent_logs = (parsed.recent_logs || []).map(l => {
                    const cleanU = normalizeUsername(l.username, l.role, l.page);
                    return {
                        ...l,
                        username: cleanU,
                        role: l.page === 'analytics-ahmad' ? 'admin' : (cleanU === 'Tamu' ? 'pengunjung' : l.role)
                    };
                });
                return parsed;
            }
        }
    } catch (err) {
        console.error('[ANALYTICS] Gagal membaca analytics_data.json:', err.message);
    }

    const clean = createCleanAnalytics();
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(clean, null, 2), 'utf8');
    } catch {}
    return clean;
}

function schedulePersistToDisk() {
    isDirty = true;
    if (saveTimer) return;

    saveTimer = setTimeout(() => {
        saveTimer = null;
        if (!isDirty || !analyticsState) return;

        try {
            if (analyticsState.recent_logs.length > 2000) {
                analyticsState.recent_logs = analyticsState.recent_logs.slice(0, 2000);
            }

            const keys = Object.keys(analyticsState.unique_visitors);
            if (keys.length > 10000) {
                const trimmed = {};
                keys.slice(-5000).forEach(k => {
                    trimmed[k] = analyticsState.unique_visitors[k];
                });
                analyticsState.unique_visitors = trimmed;
            }

            analyticsState.summary.last_updated = new Date().toISOString();
            analyticsState.summary.unique_visitors_count = Object.keys(analyticsState.unique_visitors).length;

            const tempFile = `${DATA_FILE}.tmp`;
            fs.writeFileSync(tempFile, JSON.stringify(analyticsState, null, 2), 'utf8');
            fs.renameSync(tempFile, DATA_FILE);
            isDirty = false;
        } catch (err) {
            console.error('[ANALYTICS] Gagal menyimpan data ke disk:', err.message);
        }
    }, 2500);
}

analyticsState = loadAnalyticsFromDisk();

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const firstIp = String(forwarded).split(',')[0].trim();
        if (firstIp) return firstIp;
    }
    if (req.headers['x-real-ip']) {
        return String(req.headers['x-real-ip']).trim();
    }
    if (req.ip) {
        return String(req.ip).replace('::ffff:', '').trim();
    }
    if (req.socket && req.socket.remoteAddress) {
        return String(req.socket.remoteAddress).replace('::ffff:', '').trim();
    }
    return '127.0.0.1';
}

function maskIp(ip) {
    if (!ip) return '127.0.0.1';
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***`;
    }
    return ip.slice(0, 8) + '***';
}

async function resolveIpLocation(ip) {
    if (ipLocationCache.has(ip)) {
        return ipLocationCache.get(ip);
    }

    try {
        const isLocal = !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
        const url = isLocal 
            ? 'http://ip-api.com/json/?fields=status,country,regionName,city,isp'
            : `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,isp`;

        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
            const d = await res.json();
            if (d && d.status === 'success') {
                const city = d.city || 'Kabupaten Mempawah';
                let region = d.regionName || 'Kalimantan Barat';
                if (region === 'West Kalimantan') region = 'Kalimantan Barat';
                if (region === 'Jakarta') region = 'DKI Jakarta';

                let isp = d.isp || 'Operator Seluler';
                isp = isp.replace(/^(PT |PT\. |PT\s+)/i, '').trim();

                const loc = {
                    city: city,
                    province: region,
                    country: d.country || 'Indonesia',
                    isp: isp
                };
                ipLocationCache.set(ip, loc);
                return loc;
            }
        }
    } catch {}

    const fallback = {
        city: 'Kabupaten Mempawah',
        province: 'Kalimantan Barat',
        country: 'Indonesia',
        isp: 'Jaringan Lokal BPS'
    };
    ipLocationCache.set(ip, fallback);
    return fallback;
}

function isAhmadAuliaAuth(req) {
    const userHeader = req.headers['x-garda-user'] || req.query.user || req.body?.requesting_user;
    if (userHeader) {
        const u = String(userHeader).toLowerCase().trim();
        const clean = u.replace(/[\s._-]+/g, '');
        if (
            clean.includes('ahmadaulia') ||
            clean.includes('200109122024121001') ||
            u.includes('ahmad.aulia') ||
            u.includes('ahmad') ||
            u.includes('aulia') ||
            u.includes('200109122024121001')
        ) {
            return true;
        }
    }

    if (req.user) {
        const u = String(req.user.username || '').toLowerCase();
        const e = String(req.user.email || '').toLowerCase();
        const n = String(req.user.name || '').toLowerCase();
        const clean = (u + e + n).replace(/[\s._-]+/g, '');
        if (clean.includes('ahmadaulia') || clean.includes('ahmad')) {
            return true;
        }
    }

    return true;
}

/**
 * POST /api/analytics/track
 * Merekam kunjungan & melacak lokasi IP pasif secara non-blocking di latar belakang
 */
router.post('/track', (req, res) => {
    try {
        const { 
            page = 'landing', 
            visitorId = 'anonymous', 
            role = 'pengunjung', 
            username = 'Tamu',
            deviceType = 'desktop'
        } = req.body || {};

        // Pengunjung yang masih di halaman login jangan dicatat sebagai pengunjung!
        if (page === 'login' || !role) {
            return sendJson(res, 200, { success: true, ignored: true, message: 'Halaman login tidak dicatat sebagai pengunjung.' });
        }

        const cleanUsername = normalizeUsername(username, role);

        const clientIp = getClientIp(req);
        const maskedIp = maskIp(clientIp);

        const wib = getWibDate();
        const dateKey = getWibDateString(wib);
        const dayIndex = wib.getDay();
        const hour = wib.getHours();
        const timestamp = wib.toISOString();

        // 1. Perbarui Summary
        analyticsState.summary.total_views = (analyticsState.summary.total_views || 0) + 1;

        // 2. Perbarui Unique Visitors
        const vKey = String(visitorId).trim().slice(0, 80);
        if (!analyticsState.unique_visitors[vKey]) {
            analyticsState.unique_visitors[vKey] = {
                first_seen: timestamp,
                last_seen: timestamp,
                count: 1,
                username: cleanUsername,
                role: String(role).slice(0, 30),
                last_ip: maskedIp
            };
        } else {
            analyticsState.unique_visitors[vKey].last_seen = timestamp;
            analyticsState.unique_visitors[vKey].count += 1;
            analyticsState.unique_visitors[vKey].last_ip = maskedIp;
            if (cleanUsername && cleanUsername !== 'Tamu') {
                analyticsState.unique_visitors[vKey].username = cleanUsername;
            }
            if (role) {
                analyticsState.unique_visitors[vKey].role = String(role).slice(0, 30);
            }
        }
        analyticsState.summary.unique_visitors_count = Object.keys(analyticsState.unique_visitors).length;

        // 3. Perbarui Matriks Global Fitur, Hari, Jam, Perangkat
        const cleanPage = String(page).trim();
        analyticsState.by_feature[cleanPage] = (analyticsState.by_feature[cleanPage] || 0) + 1;
        analyticsState.by_day[dayIndex] = (analyticsState.by_day[dayIndex] || 0) + 1;
        analyticsState.by_hour[hour] = (analyticsState.by_hour[hour] || 0) + 1;

        analyticsState.by_device = analyticsState.by_device || { desktop: 0, mobile: 0, tablet: 0 };
        const dType = deviceType === 'mobile' ? 'mobile' : deviceType === 'tablet' ? 'tablet' : 'desktop';
        analyticsState.by_device[dType] = (analyticsState.by_device[dType] || 0) + 1;

        // 4. Perbarui Agregat Harian Spesifik (daily_records)
        analyticsState.daily_records = analyticsState.daily_records || {};
        const rKey = (role === 'admin' || role === 'petugas_pengolahan' || role === 'petugas') ? role : 'pengunjung';

        if (!analyticsState.daily_records[dateKey]) {
            const byHourInit = {};
            for (let h = 0; h < 24; h++) byHourInit[h] = 0;
            analyticsState.daily_records[dateKey] = {
                date: dateKey,
                day_name: DAY_NAMES[dayIndex],
                total_views: 0,
                unique_visitors: {},
                unique_visitors_count: 0,
                by_hour: byHourInit,
                by_feature: {},
                by_role: { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 }
            };
        }

        const dRec = analyticsState.daily_records[dateKey];
        dRec.by_role = dRec.by_role || { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
        dRec.by_role[rKey] = (dRec.by_role[rKey] || 0) + 1;
        dRec.total_views += 1;
        dRec.unique_visitors[vKey] = true;
        dRec.unique_visitors_count = Object.keys(dRec.unique_visitors).length;
        dRec.by_hour[hour] = (dRec.by_hour[hour] || 0) + 1;
        dRec.by_feature[cleanPage] = (dRec.by_feature[cleanPage] || 0) + 1;

        // Perbarui sebaran role & unik per fitur (global)
        analyticsState.by_feature_role = analyticsState.by_feature_role || {};
        if (!analyticsState.by_feature_role[cleanPage]) {
            analyticsState.by_feature_role[cleanPage] = { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
        }
        analyticsState.by_feature_role[cleanPage][rKey] = (analyticsState.by_feature_role[cleanPage][rKey] || 0) + 1;

        analyticsState.by_feature_unique = analyticsState.by_feature_unique || {};
        if (!analyticsState.by_feature_unique[cleanPage]) {
            analyticsState.by_feature_unique[cleanPage] = {};
        }
        analyticsState.by_feature_unique[cleanPage][vKey] = true;

        // 5. Catat entri awal ke Recent Logs
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const newLogEntry = {
            id: logId,
            timestamp,
            date: dateKey,
            page: cleanPage,
            page_title: FEATURE_NAMES[cleanPage] || cleanPage,
            visitor_id: vKey,
            role: String(role).slice(0, 30),
            username: cleanUsername,
            device_type: dType,
            day_name: DAY_NAMES[dayIndex],
            hour: hour,
            ip_masked: maskedIp,
            city: 'Memproses...',
            province: 'Kalimantan Barat',
            isp: 'Memproses...'
        };

        analyticsState.recent_logs.unshift(newLogEntry);
        if (analyticsState.recent_logs.length > 2000) {
            analyticsState.recent_logs = analyticsState.recent_logs.slice(0, 2000);
        }

        schedulePersistToDisk();

        // 6. Resolusi Lokasi Pasif di Latar Belakang (Non-blocking)
        resolveIpLocation(clientIp).then(loc => {
            newLogEntry.city = loc.city;
            newLogEntry.province = loc.province;
            newLogEntry.isp = loc.isp;

            analyticsState.by_city = analyticsState.by_city || {};
            analyticsState.by_province = analyticsState.by_province || {};
            analyticsState.by_isp = analyticsState.by_isp || {};

            analyticsState.by_city[loc.city] = (analyticsState.by_city[loc.city] || 0) + 1;
            analyticsState.by_province[loc.province] = (analyticsState.by_province[loc.province] || 0) + 1;
            analyticsState.by_isp[loc.isp] = (analyticsState.by_isp[loc.isp] || 0) + 1;

            schedulePersistToDisk();
        }).catch(() => {});

        return sendJson(res, 200, { 
            success: true, 
            recorded: true,
            total_views: analyticsState.summary.total_views 
        });
    } catch (err) {
        console.error('[ANALYTICS] Error in /track:', err.message);
        return sendJson(res, 500, { success: false, error: 'Failed to record tracking' });
    }
});

/**
 * GET /api/analytics/stats
 * Mengambil rekap statistik, grafik jam & hari (dengan filter rentang tanggal), ranking fitur, dan lokasi IP
 */
router.get('/stats', (req, res) => {
    try {
        if (!analyticsState || !isDirty || req.query.refresh === 'true' || req.query.reload === 'true') {
            analyticsState = loadAnalyticsFromDisk();
        }

        const isAuthorized = isAhmadAuliaAuth(req);
        if (!isAuthorized) {
            return sendJson(res, 403, {
                success: false,
                message: 'Akses ditolak. Fitur pemantauan analitik ini khusus diperuntukkan bagi akun ahmad.aulia.'
            });
        }

        let startDate = req.query.startDate ? String(req.query.startDate).trim() : null;
        let endDate = req.query.endDate ? String(req.query.endDate).trim() : null;

        if (startDate && endDate && startDate > endDate) {
            const tmp = startDate;
            startDate = endDate;
            endDate = tmp;
        }

        analyticsState.daily_records = analyticsState.daily_records || {};
        const allDateKeys = Object.keys(analyticsState.daily_records).sort();

        // Susun daftar tanggal berurutan
        let dateList = [];
        if (startDate && endDate) {
            try {
                const [sy, sm, sd] = startDate.split('-').map(Number);
                const [ey, em, ed] = endDate.split('-').map(Number);
                const cur = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0));
                const end = new Date(Date.UTC(ey, em - 1, ed, 0, 0, 0));
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
                dateList = allDateKeys;
            }
        } else {
            // Default: 7 hari terakhir sampai hari ini
            const todayWib = getWibDate();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(todayWib);
                d.setDate(d.getDate() - i);
                dateList.push(getWibDateString(d));
            }
            allDateKeys.forEach(dk => {
                if (!dateList.includes(dk)) dateList.push(dk);
            });
            dateList.sort();
        }

        // 1. Rekap Harian Berurutan (Daily Series: Total Kunjungan & Pengunjung Unik)
        let filteredTotalViews = 0;
        const filteredUniqueSet = new Set();
        const filteredHours = {};
        for (let h = 0; h < 24; h++) filteredHours[h] = 0;

        // Wadah akumulasi fitur dan role per jam & per rentang tanggal
        const rangeFeatureMap = {};
        Object.keys(FEATURE_NAMES).forEach(f => { rangeFeatureMap[f] = 0; });
        const rangeRoleMap = { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };

        const dailyRoleMaps = {};
        const rangeFeatureRoleMaps = {};
        const rangeFeatureUniqueSets = {};
        Object.keys(FEATURE_NAMES).forEach(f => {
            rangeFeatureRoleMaps[f] = { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
            rangeFeatureUniqueSets[f] = new Set();
        });

        const hourlyUniqueSets = {};
        const hourlyFeatureMaps = {};
        const hourlyRoleMaps = {};
        for (let h = 0; h < 24; h++) {
            hourlyUniqueSets[h] = new Set();
            hourlyFeatureMaps[h] = {};
            hourlyRoleMaps[h] = { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
        }

        // Agregasi dari recent_logs untuk tanggal yang masuk dateList
        const dateSet = new Set(dateList);
        const accountAggregationMap = {};
        analyticsState.recent_logs.forEach(log => {
            if (dateSet.has(log.date)) {
                const h = typeof log.hour === 'number' ? log.hour : 0;
                const rKey = log.role === 'admin' ? 'admin' 
                    : log.role === 'petugas_pengolahan' ? 'petugas_pengolahan' 
                    : log.role === 'petugas' ? 'petugas' : 'pengunjung';

                if (hourlyRoleMaps[h]) hourlyRoleMaps[h][rKey] += 1;
                rangeRoleMap[rKey] += 1;

                if (!dailyRoleMaps[log.date]) {
                    dailyRoleMaps[log.date] = { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
                }
                dailyRoleMaps[log.date][rKey] += 1;

                if (!rangeFeatureRoleMaps[log.page]) {
                    rangeFeatureRoleMaps[log.page] = { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
                    rangeFeatureUniqueSets[log.page] = new Set();
                }
                rangeFeatureRoleMaps[log.page][rKey] += 1;
                rangeFeatureUniqueSets[log.page].add(log.visitor_id);

                if (hourlyUniqueSets[h]) hourlyUniqueSets[h].add(log.visitor_id);

                if (hourlyFeatureMaps[h]) {
                    hourlyFeatureMaps[h][log.page] = (hourlyFeatureMaps[h][log.page] || 0) + 1;
                }
                rangeFeatureMap[log.page] = (rangeFeatureMap[log.page] || 0) + 1;

                // Agregasi per akun pengguna (username)
                const uName = normalizeUsername(log.username, log.role, log.page);
                const rRole = log.page === 'analytics-ahmad' ? 'admin' : (uName === 'Tamu' ? 'pengunjung' : (log.role || 'pengunjung'));
                if (!accountAggregationMap[uName]) {
                    accountAggregationMap[uName] = {
                        username: uName,
                        role: rRole,
                        total_views: 0,
                        first_seen: log.timestamp,
                        last_seen: log.timestamp,
                        active_dates: new Set(),
                        feature_counts: {},
                        devices: { desktop: 0, mobile: 0, tablet: 0 },
                        cities: new Set(),
                        isps: new Set()
                    };
                }

                const acc = accountAggregationMap[uName];
                acc.total_views += 1;
                if (!acc.first_seen || new Date(log.timestamp) < new Date(acc.first_seen)) {
                    acc.first_seen = log.timestamp;
                }
                if (!acc.last_seen || new Date(log.timestamp) > new Date(acc.last_seen)) {
                    acc.last_seen = log.timestamp;
                }
                if (log.date) acc.active_dates.add(log.date);

                const featKey = log.page || 'landing';
                acc.feature_counts[featKey] = (acc.feature_counts[featKey] || 0) + 1;

                const dev = log.device_type || 'desktop';
                acc.devices[dev] = (acc.devices[dev] || 0) + 1;

                if (log.city && log.city !== 'Memproses...') acc.cities.add(log.city);
                if (log.isp && log.isp !== 'Memproses...') acc.isps.add(log.isp);

                if (log.role && log.role !== 'pengunjung' && acc.role === 'pengunjung') {
                    acc.role = log.role;
                }
            }
        });

        const dailySeries = dateList.map(dStr => {
            const rec = analyticsState.daily_records[dStr] || {
                total_views: 0,
                unique_visitors: {},
                unique_visitors_count: 0,
                by_hour: {},
                by_feature: {},
                by_role: { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 }
            };
            filteredTotalViews += rec.total_views || 0;
            if (rec.unique_visitors) {
                Object.keys(rec.unique_visitors).forEach(v => filteredUniqueSet.add(v));
            }
            if (rec.by_hour) {
                for (let h = 0; h < 24; h++) {
                    filteredHours[h] += (rec.by_hour[h] || 0);
                }
            }

            if (rec.by_feature) {
                Object.keys(rec.by_feature).forEach(f => {
                    rangeFeatureMap[f] = (rangeFeatureMap[f] || 0) + (rec.by_feature[f] || 0);
                });
            }

            const [y, m, d] = dStr.split('-');
            const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            const dayName = DAY_NAMES[dateObj.getDay()];
            const formattedLabel = `${parseInt(d)} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][parseInt(m)-1]}`;

            // Fitur teratas hari ini
            const dailyFeatures = Object.keys(rec.by_feature || {}).map(fKey => ({
                id: fKey,
                title: FEATURE_NAMES[fKey] || fKey,
                views: rec.by_feature[fKey] || 0
            })).filter(f => f.views > 0).sort((a, b) => b.views - a.views);

            const dayRoles = dailyRoleMaps[dStr] || rec.by_role || { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };

            return {
                date: dStr,
                day_name: dayName,
                label: formattedLabel,
                total_views: rec.total_views || 0,
                unique_visitors_count: rec.unique_visitors_count || Object.keys(rec.unique_visitors || {}).length,
                features: dailyFeatures,
                roles: dayRoles
            };
        });

        // Jika tidak ada filter tanggal atau filter mencakup semua, gunakan rekap jam global jika filter kosong
        const isRangeFiltered = Boolean(startDate || endDate);
        const effectiveTotalViews = isRangeFiltered ? filteredTotalViews : (analyticsState.summary.total_views || 0);
        const effectiveUniqueCount = isRangeFiltered ? filteredUniqueSet.size : Object.keys(analyticsState.unique_visitors || {}).length;

        // 1b. Rekapitulasi Akun Pengunjung Teragregasi
        const accountRecap = Object.values(accountAggregationMap).map(acc => {
            let topFeatKey = '';
            let topFeatCount = 0;
            const featuresArray = Object.keys(acc.feature_counts).map(fKey => {
                const count = acc.feature_counts[fKey];
                if (count > topFeatCount) {
                    topFeatCount = count;
                    topFeatKey = fKey;
                }
                return {
                    id: fKey,
                    title: FEATURE_NAMES[fKey] || fKey,
                    count
                };
            }).sort((a, b) => b.count - a.count);

            let primaryDev = 'desktop';
            let maxDevCount = -1;
            Object.keys(acc.devices).forEach(d => {
                if (acc.devices[d] > maxDevCount) {
                    maxDevCount = acc.devices[d];
                    primaryDev = d;
                }
            });

            const pct = effectiveTotalViews > 0 
                ? parseFloat(((acc.total_views / effectiveTotalViews) * 100).toFixed(1)) 
                : 0;

            return {
                username: acc.username,
                role: acc.role,
                total_views: acc.total_views,
                percentage: pct,
                first_seen: acc.first_seen,
                last_seen: acc.last_seen,
                active_days_count: acc.active_dates.size,
                top_feature: FEATURE_NAMES[topFeatKey] || topFeatKey || 'Beranda Utama',
                top_feature_count: topFeatCount,
                primary_device: primaryDev,
                cities: Array.from(acc.cities),
                isps: Array.from(acc.isps),
                features: featuresArray
            };
        }).sort((a, b) => b.total_views - a.total_views);

        // 2. Rekap Distribusi Jam (00:00 - 23:00) sesuai rentang tanggal yang dipilih
        let maxHourViews = 0;
        let peakHourVal = new Date().getHours();
        const hourStats = [];
        for (let h = 0; h < 24; h++) {
            const count = isRangeFiltered ? filteredHours[h] : (analyticsState.by_hour[h] || 0);
            if (count > maxHourViews) {
                maxHourViews = count;
                peakHourVal = h;
            }
            const pct = effectiveTotalViews > 0 ? ((count / effectiveTotalViews) * 100).toFixed(1) : '0.0';
            const isWorkingHour = h >= 8 && h <= 16;

            // Fitur yang diakses pada jam ini
            const topFeaturesHour = Object.keys(hourlyFeatureMaps[h] || {}).map(fId => ({
                id: fId,
                title: FEATURE_NAMES[fId] || fId,
                views: hourlyFeatureMaps[h][fId] || 0
            })).sort((a, b) => b.views - a.views);

            hourStats.push({
                hour: h,
                label: `${String(h).padStart(2, '0')}:00`,
                count,
                unique_count: hourlyUniqueSets[h]?.size || (count > 0 ? 1 : 0),
                percentage: parseFloat(pct),
                is_working_hour: isWorkingHour,
                roles: hourlyRoleMaps[h] || { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 },
                features: topFeaturesHour
            });
        }

        // Fitur dalam rentang tanggal terpilih
        const rangeFeatureList = Object.keys(rangeFeatureMap).map(fKey => {
            const views = rangeFeatureMap[fKey] || 0;
            const pct = effectiveTotalViews > 0 ? ((views / effectiveTotalViews) * 100).toFixed(1) : '0.0';
            return {
                id: fKey,
                title: FEATURE_NAMES[fKey] || fKey,
                views,
                percentage: parseFloat(pct),
                roles: rangeFeatureRoleMaps[fKey] || { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 },
                unique_count: rangeFeatureUniqueSets[fKey]?.size || (views > 0 ? 1 : 0)
            };
        }).sort((a, b) => b.views - a.views);

        // 3. Rekap dan Peringkat Fitur Global
        const featureList = Object.keys(analyticsState.by_feature).map(featKey => {
            const views = analyticsState.by_feature[featKey] || 0;
            const pct = analyticsState.summary.total_views > 0 ? ((views / analyticsState.summary.total_views) * 100).toFixed(1) : '0.0';
            const globalFeatureRoles = analyticsState.by_feature_role?.[featKey] || { admin: 0, petugas: 0, petugas_pengolahan: 0, pengunjung: 0 };
            const globalFeatureUnique = Object.keys(analyticsState.by_feature_unique?.[featKey] || {}).length || (views > 0 ? 1 : 0);
            return {
                id: featKey,
                title: FEATURE_NAMES[featKey] || featKey,
                views,
                percentage: parseFloat(pct),
                roles: globalFeatureRoles,
                unique_count: globalFeatureUnique
            };
        }).sort((a, b) => b.views - a.views);

        // 4. Rekap Distribusi Hari (Mingguan)
        let maxDayViews = 0;
        let peakDayIdx = new Date().getDay();
        const dayStats = DAY_NAMES.map((name, idx) => {
            const count = analyticsState.by_day[idx] || 0;
            if (count > maxDayViews) {
                maxDayViews = count;
                peakDayIdx = idx;
            }
            const pct = analyticsState.summary.total_views > 0 ? ((count / analyticsState.summary.total_views) * 100).toFixed(1) : '0.0';
            return {
                index: idx,
                name: name,
                count,
                percentage: parseFloat(pct),
                is_weekend: idx === 0 || idx === 6
            };
        });

        // 5. Lokasi Berbasis IP (Kota, Provinsi, Provider / ISP)
        const byCity = analyticsState.by_city || {};
        const cityList = Object.keys(byCity).map(city => {
            const count = byCity[city] || 0;
            const pct = analyticsState.summary.total_views > 0 ? ((count / analyticsState.summary.total_views) * 100).toFixed(1) : '0.0';
            return { name: city, count, percentage: parseFloat(pct) };
        }).sort((a, b) => b.count - a.count);

        const byProvince = analyticsState.by_province || {};
        const provinceList = Object.keys(byProvince).map(prov => {
            const count = byProvince[prov] || 0;
            const pct = analyticsState.summary.total_views > 0 ? ((count / analyticsState.summary.total_views) * 100).toFixed(1) : '0.0';
            return { name: prov, count, percentage: parseFloat(pct) };
        }).sort((a, b) => b.count - a.count);

        const byIsp = analyticsState.by_isp || {};
        const ispList = Object.keys(byIsp).map(isp => {
            const count = byIsp[isp] || 0;
            const pct = analyticsState.summary.total_views > 0 ? ((count / analyticsState.summary.total_views) * 100).toFixed(1) : '0.0';
            return { name: isp, count, percentage: parseFloat(pct) };
        }).sort((a, b) => b.count - a.count);

        const topCity = cityList[0] ? cityList[0].name : '-';
        const topIsp = ispList[0] ? ispList[0].name : '-';

        // 6. Sebaran Perangkat (Device Breakdown)
        const devices = analyticsState.by_device || { desktop: 0, mobile: 0, tablet: 0 };
        const totalDev = Math.max(1, (devices.desktop || 0) + (devices.mobile || 0) + (devices.tablet || 0));
        const deviceStats = {
            desktop: { count: devices.desktop || 0, percentage: parseFloat((((devices.desktop || 0) / totalDev) * 100).toFixed(1)) },
            mobile: { count: devices.mobile || 0, percentage: parseFloat((((devices.mobile || 0) / totalDev) * 100).toFixed(1)) },
            tablet: { count: devices.tablet || 0, percentage: parseFloat((((devices.tablet || 0) / totalDev) * 100).toFixed(1)) }
        };

        // 7. Analisis Jam Kerja vs Luar Jam Kerja
        const workingHourViews = hourStats
            .filter(item => item.is_working_hour)
            .reduce((acc, curr) => acc + curr.count, 0);
        const nonWorkingHourViews = effectiveTotalViews - workingHourViews;
        const workingHourPct = effectiveTotalViews > 0 ? ((workingHourViews / effectiveTotalViews) * 100).toFixed(1) : '0.0';

        // 8. Analisis Hari Kerja vs Akhir Pekan
        const weekdayViews = dayStats
            .filter(d => !d.is_weekend)
            .reduce((acc, curr) => acc + curr.count, 0);
        const weekendViews = analyticsState.summary.total_views - weekdayViews;
        const weekdayPct = analyticsState.summary.total_views > 0 ? ((weekdayViews / analyticsState.summary.total_views) * 100).toFixed(1) : '0.0';

        // 9. Generate Narasi Analisis Cerdas
        const topFeature = featureList[0] && featureList[0].views > 0
            ? featureList[0] 
            : { title: 'Belum Ada Kunjungan', views: 0, percentage: 0 };
        const peakDayName = analyticsState.summary.total_views > 0 ? DAY_NAMES[peakDayIdx] : DAY_NAMES[new Date().getDay()];
        const peakHourFormatted = effectiveTotalViews > 0 
            ? `${String(peakHourVal).padStart(2, '0')}:00 - ${String((peakHourVal + 1) % 24).padStart(2, '0')}:00 WIB`
            : `${String(new Date().getHours()).padStart(2, '0')}:00 WIB`;

        const insights = [
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
                content: analyticsState.summary.total_views > 0 && topCity !== '-'
                    ? `Sebagian besar pengguna mengakses Garda Data dari wilayah ${topCity} (${cityList[0]?.percentage}%) dengan operator dominan ${topIsp}.`
                    : `Menunggu aktivitas pengguna untuk mendeteksi sebaran wilayah kota/kabupaten dan penyedia jaringan secara pasif.`
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
                content: analyticsState.summary.total_views > 0
                    ? `Hari ${peakDayName} merupakan hari paling aktif dengan ${maxDayViews.toLocaleString('id-ID')} kunjungan. Sebanyak ${weekdayPct}% kunjungan berlangsung pada hari kerja.`
                    : `Pemantauan tren harian dimulai pada hari ${DAY_NAMES[new Date().getDay()]}.`
            },
            {
                type: 'feature_dominance',
                title: 'Fitur Paling Diminati',
                content: analyticsState.summary.total_views > 0 && topFeature.views > 0
                    ? `Fitur "${topFeature.title}" menempati posisi teratas dengan ${topFeature.views.toLocaleString('id-ID')} kali dibuka (${topFeature.percentage}% pangsa).`
                    : `Peringkat fitur akan tersusun secara otomatis sesuai modul yang dikunjungi petugas.`
            },
            {
                type: 'maintenance_rec',
                title: 'Rekomendasi Pemeliharaan Server',
                content: `Waktu optimal untuk rilis pembaruan atau perawatan server adalah pukul 00:00 - 05:00 WIB di saat aktivitas pengguna berada pada level terendah.`
            }
        ];

        return sendJson(res, 200, {
            success: true,
            summary: {
                total_views: analyticsState.summary.total_views,
                unique_visitors_count: Object.keys(analyticsState.unique_visitors).length,
                first_tracked: analyticsState.summary.first_tracked,
                last_updated: analyticsState.summary.last_updated,
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
            device_distribution: deviceStats,
            range_features: rangeFeatureList,
            roles_summary: rangeRoleMap,
            account_recap: accountRecap,
            work_comparison: {
                working_hours: { count: workingHourViews, percentage: parseFloat(workingHourPct) },
                outside_working_hours: { count: nonWorkingHourViews, percentage: parseFloat((100 - parseFloat(workingHourPct)).toFixed(1)) },
                weekday: { count: weekdayViews, percentage: parseFloat(weekdayPct) },
                weekend: { count: weekendViews, percentage: parseFloat((100 - parseFloat(weekdayPct)).toFixed(1)) }
            },
            insights,
            recent_logs: analyticsState.recent_logs.slice(0, 100).map(l => {
                const u = normalizeUsername(l.username, l.role, l.page);
                return {
                    ...l,
                    username: u,
                    role: l.page === 'analytics-ahmad' ? 'admin' : (u === 'Tamu' ? 'pengunjung' : l.role)
                };
            })
        });

    } catch (err) {
        console.error('[ANALYTICS] Error in /stats:', err.message);
        return sendJson(res, 500, { success: false, error: 'Gagal memproses data statistik' });
    }
});

/**
 * POST /api/analytics/reset
 * Fitur reset dinonaktifkan permanen untuk menjaga integritas data riil telemetri
 */
router.post('/reset', (req, res) => {
    return sendJson(res, 403, { 
        success: false, 
        error: 'Fitur reset data analitik telah dinonaktifkan secara permanen untuk memproteksi keaslian data kunjungan riil.' 
    });
});

module.exports = router;
