const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { apiKeyAuthMiddleware, getMasterApiKey, loadApiKeys, generateNewApiKey } = require('../middleware/apiKeyAuth');

const DATA_DIR = path.join(__dirname, '../data');
const MITRA_FILE = path.join(DATA_DIR, 'mitra_evaluations.json');
const INITIAL_PAYLOAD_FILE = path.join(__dirname, '../../public/data/initial_mitra_se2026.json');

// Kunci enkripsi baseline resmi SE2026
const SECRET_PASSPHRASE = 'GARDA-DATA-SE2026-BPS-MEMPAWAH-MILITARY-GRADE-AES256-SECURE-KEY!';
const SALT_STR = 'garda_data_salt_6104_mempawah_sec';

// In-memory cache untuk performa tinggi (< 5ms response time)
let cachedMitraList = null;

// Helper: Penentuan Kategori Penilaian sesuai aturan standar BPS
function getKategoriFromNilai(nilai) {
    if (nilai === null || nilai === undefined || isNaN(nilai) || String(nilai).trim() === '') return null;
    const num = Number(nilai);
    if (num >= 90 && num <= 100) return 'Sangat Direkomendasikan';
    if (num >= 80 && num < 90) return 'Direkomendasikan';
    if (num >= 60 && num < 80) return 'Cukup';
    return 'Blacklist';
}

// Helper: Generate record key konsisten
function getRecordKey(m) {
    if (m.id) return m.id;
    const emailKey = (m.email || '').toLowerCase().trim();
    const roleKey = (m.role || 'ppl').toLowerCase().trim();
    return `${emailKey}_${roleKey}`;
}

// Helper: Dekripsi file baseline awal
function decryptBaselineFile() {
    try {
        if (!fs.existsSync(INITIAL_PAYLOAD_FILE)) {
            console.warn('[MITRA] Berkas initial_mitra_se2026.json tidak ditemukan.');
            return [];
        }

        const raw = fs.readFileSync(INITIAL_PAYLOAD_FILE, 'utf8');
        const payload = JSON.parse(raw);

        if (Array.isArray(payload)) {
            return payload;
        }

        if (payload && payload.algo === 'AES-256-GCM' && payload.data && payload.iv && payload.tag) {
            const key = crypto.pbkdf2Sync(SECRET_PASSPHRASE, SALT_STR, 100000, 32, 'sha256');
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
            decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
            
            let dec = decipher.update(Buffer.from(payload.data, 'base64'), null, 'utf8');
            dec += decipher.final('utf8');
            
            const list = JSON.parse(dec);
            console.log(`[MITRA] Berhasil mendekripsi baseline ${list.length} mitra dari initial_mitra_se2026.json`);
            return list;
        }

        return [];
    } catch (e) {
        console.error('[MITRA] Gagal mendekripsi baseline data mitra:', e.message);
        return [];
    }
}

// Muat data dari file persistent
function loadMitraData() {
    if (cachedMitraList) {
        return cachedMitraList;
    }

    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        if (fs.existsSync(MITRA_FILE)) {
            const raw = fs.readFileSync(MITRA_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                cachedMitraList = parsed;
                return cachedMitraList;
            }
        }

        // Jika belum ada file mitra_evaluations.json, inisialisasi dari dekripsi baseline
        const baseline = decryptBaselineFile();
        if (baseline.length > 0) {
            const normalized = baseline.map(m => ({
                id: getRecordKey(m),
                email: m.email || '',
                nama: m.nama || '',
                role: (m.role || 'PPL').toUpperCase(),
                pj: m.pj || '-',
                kecamatan: m.kecamatan || '-',
                nilai: m.nilai !== undefined && m.nilai !== null ? Number(m.nilai) : null,
                kategori: m.kategori || getKategoriFromNilai(m.nilai),
                catatan: m.catatan || '',
                updatedAt: m.updatedAt || new Date().toISOString()
            }));

            fs.writeFileSync(MITRA_FILE, JSON.stringify(normalized, null, 2), 'utf8');
            cachedMitraList = normalized;
            console.log(`[MITRA] Inisialisasi awal ${normalized.length} data mitra tersimpan ke mitra_evaluations.json`);
            return cachedMitraList;
        }

        cachedMitraList = [];
        return cachedMitraList;
    } catch (err) {
        console.error('[MITRA] Gagal membaca data mitra:', err.message);
        cachedMitraList = [];
        return cachedMitraList;
    }
}

// Simpan data mitra ke file persistent & perbarui cache
function saveMitraData(list) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        cachedMitraList = list;
        fs.writeFileSync(MITRA_FILE, JSON.stringify(list, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('[MITRA] Gagal menulis mitra_evaluations.json:', err.message);
        return false;
    }
}

// Sync opsional ke MySQL jika koneksi aktif
async function trySyncToMySql(record) {
    try {
        const pool = require('../db');
        if (!pool || !pool.query) return;

        // Pastikan tabel mitra_evaluations ada
        await pool.query(`
            CREATE TABLE IF NOT EXISTS mitra_evaluations (
                id VARCHAR(150) PRIMARY KEY,
                email VARCHAR(100) NOT NULL,
                nama VARCHAR(150) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'PPL',
                pj VARCHAR(100) NOT NULL DEFAULT '-',
                kecamatan VARCHAR(100) NOT NULL DEFAULT '-',
                nilai DOUBLE NULL,
                kategori VARCHAR(50) NULL,
                catatan TEXT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_role (role),
                INDEX idx_kecamatan (kecamatan),
                INDEX idx_kategori (kategori)
            )
        `);

        const sql = `
            INSERT INTO mitra_evaluations (id, email, nama, role, pj, kecamatan, nilai, kategori, catatan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                nama = VALUES(nama),
                role = VALUES(role),
                pj = VALUES(pj),
                kecamatan = VALUES(kecamatan),
                nilai = VALUES(nilai),
                kategori = VALUES(kategori),
                catatan = VALUES(catatan),
                updated_at = CURRENT_TIMESTAMP
        `;

        await pool.query(sql, [
            record.id,
            record.email,
            record.nama,
            record.role,
            record.pj,
            record.kecamatan,
            record.nilai,
            record.kategori,
            record.catatan
        ]);
    } catch (e) {
        // Abaikan error database agar fallback file JSON tetap berjalan 100% mulus
    }
}

// =========================================================================
// MIDDLEWARE: Semua rute di bawah wajib memiliki API Key atau JWT login valid
// =========================================================================
router.use(apiKeyAuthMiddleware);

// =========================================================================
// 1. GET /api/mitra: Mengambil daftar penilaian mitra dengan fitur pencarian & filter
// =========================================================================
router.get('/', (req, res) => {
    try {
        const allData = loadMitraData();
        let filtered = [...allData];

        const {
            q, search,
            role,
            kecamatan,
            pj,
            kategori,
            status,
            min_nilai, max_nilai,
            sort, order,
            page, limit
        } = req.query;

        // 1. Filter Pencarian Teks (Nama atau Email)
        const searchTerm = (q || search || '').toString().toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(m => 
                (m.nama && m.nama.toLowerCase().includes(searchTerm)) ||
                (m.email && m.email.toLowerCase().includes(searchTerm))
            );
        }

        // 2. Filter Role (PPL / PML)
        if (role) {
            const targetRole = role.toString().toUpperCase().trim();
            filtered = filtered.filter(m => (m.role || '').toUpperCase() === targetRole);
        }

        // 3. Filter Wilayah / Kecamatan
        if (kecamatan && kecamatan !== 'Semua Kecamatan') {
            const targetKec = kecamatan.toString().toLowerCase().trim();
            filtered = filtered.filter(m => (m.kecamatan || '').toLowerCase().trim() === targetKec);
        }

        // 4. Filter Penanggung Jawab (PJ)
        if (pj && pj !== 'Semua PJ') {
            const targetPj = pj.toString().toLowerCase().trim();
            filtered = filtered.filter(m => (m.pj || '').toLowerCase().trim() === targetPj);
        }

        // 5. Filter Kategori Rekomendasi
        if (kategori && kategori !== 'Semua Kategori') {
            const targetKat = kategori.toString().toLowerCase().trim();
            filtered = filtered.filter(m => {
                if (targetKat === 'belum dinilai') {
                    return !m.kategori || m.nilai === null || m.nilai === undefined;
                }
                return (m.kategori || '').toLowerCase().trim() === targetKat;
            });
        }

        // 6. Filter Status Penilaian (sudah_dinilai / belum_dinilai)
        if (status) {
            const s = status.toString().toLowerCase().trim();
            if (s === 'sudah' || s === 'sudah_dinilai' || s === 'completed') {
                filtered = filtered.filter(m => m.nilai !== null && m.nilai !== undefined && !isNaN(m.nilai));
            } else if (s === 'belum' || s === 'belum_dinilai' || s === 'pending') {
                filtered = filtered.filter(m => m.nilai === null || m.nilai === undefined || isNaN(m.nilai));
            }
        }

        // 7. Filter Rentang Nilai
        if (min_nilai !== undefined && min_nilai !== '') {
            const min = parseFloat(min_nilai);
            if (!isNaN(min)) filtered = filtered.filter(m => m.nilai !== null && m.nilai >= min);
        }
        if (max_nilai !== undefined && max_nilai !== '') {
            const max = parseFloat(max_nilai);
            if (!isNaN(max)) filtered = filtered.filter(m => m.nilai !== null && m.nilai <= max);
        }

        // 8. Sorting / Pengurutan
        const sortField = (sort || 'nama').toString().toLowerCase();
        const sortOrder = (order || (sortField === 'nilai' ? 'desc' : 'asc')).toString().toLowerCase();

        filtered.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (sortField === 'nilai') {
                valA = valA !== null && valA !== undefined ? Number(valA) : -1;
                valB = valB !== null && valB !== undefined ? Number(valB) : -1;
            } else {
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            }

            if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
            if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
            return 0;
        });

        // 9. Kalkulasi Summary Ringkas
        const evaluatedList = filtered.filter(m => m.nilai !== null && m.nilai !== undefined && !isNaN(m.nilai));
        const avgScore = evaluatedList.length > 0 
            ? parseFloat((evaluatedList.reduce((acc, curr) => acc + Number(curr.nilai), 0) / evaluatedList.length).toFixed(1))
            : 0;

        const summary = {
            total_tercatat: allData.length,
            total_hasil_filter: filtered.length,
            sudah_dinilai: evaluatedList.length,
            belum_dinilai: filtered.length - evaluatedList.length,
            rata_rata_nilai: avgScore,
            ppl_count: filtered.filter(m => (m.role || '').toUpperCase() === 'PPL').length,
            pml_count: filtered.filter(m => (m.role || '').toUpperCase() === 'PML').length
        };

        // 10. Pagination (Opsional, default: seluruh data ditampilkan)
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 0;
        let paginatedData = filtered;

        if (limitNum > 0) {
            const startIdx = (pageNum - 1) * limitNum;
            paginatedData = filtered.slice(startIdx, startIdx + limitNum);
        }

        // 11. Metadata Wilayah & Kategori untuk mempermudah form / dropdown web eksternal
        const kecamatanList = [...new Set(allData.map(m => m.kecamatan).filter(Boolean))].sort();
        const pjList = [...new Set(allData.map(m => m.pj).filter(Boolean))].sort();

        return res.json({
            success: true,
            total: allData.length,
            filtered: filtered.length,
            page: limitNum > 0 ? pageNum : 1,
            limit: limitNum > 0 ? limitNum : filtered.length,
            total_pages: limitNum > 0 ? Math.ceil(filtered.length / limitNum) : 1,
            data: paginatedData,
            summary,
            meta: {
                roles: ['PPL', 'PML'],
                kecamatan_list: kecamatanList,
                pj_list: pjList,
                kategori_list: [
                    'Sangat Direkomendasikan',
                    'Direkomendasikan',
                    'Cukup',
                    'Blacklist'
                ]
            }
        });
    } catch (err) {
        console.error('[MITRA API ERROR]', err);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil data penilaian mitra.',
            error: err.message
        });
    }
});

// =========================================================================
// 2. GET /api/mitra/stats: Statistik Agregat Penilaian Mitra (Dashboard Widget)
// =========================================================================
router.get('/stats', (req, res) => {
    try {
        const allData = loadMitraData();
        const evaluated = allData.filter(m => m.nilai !== null && m.nilai !== undefined && !isNaN(m.nilai));

        const scores = evaluated.map(m => Number(m.nilai));
        const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
        const minScore = scores.length > 0 ? Math.min(...scores) : 0;
        const avgScore = scores.length > 0 
            ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) 
            : 0;

        // Distribusi Kategori
        const kategoriCounts = {
            sangat_direkomendasikan: 0,
            direkomendasikan: 0,
            cukup: 0,
            blacklist: 0,
            belum_dinilai: 0
        };

        allData.forEach(m => {
            const kat = m.kategori || getKategoriFromNilai(m.nilai);
            if (kat === 'Sangat Direkomendasikan') kategoriCounts.sangat_direkomendasikan++;
            else if (kat === 'Direkomendasikan') kategoriCounts.direkomendasikan++;
            else if (kat === 'Cukup') kategoriCounts.cukup++;
            else if (kat === 'Blacklist') kategoriCounts.blacklist++;
            else kategoriCounts.belum_dinilai++;
        });

        // Rekap per Kecamatan
        const kecMap = {};
        allData.forEach(m => {
            const kec = m.kecamatan || 'Lainnya';
            if (!kecMap[kec]) {
                kecMap[kec] = { total: 0, dinilai: 0, sumNilai: 0 };
            }
            kecMap[kec].total++;
            if (m.nilai !== null && m.nilai !== undefined) {
                kecMap[kec].dinilai++;
                kecMap[kec].sumNilai += Number(m.nilai);
            }
        });

        const rekapKecamatan = Object.keys(kecMap).map(name => ({
            kecamatan: name,
            total_mitra: kecMap[name].total,
            sudah_dinilai: kecMap[name].dinilai,
            belum_dinilai: kecMap[name].total - kecMap[name].dinilai,
            rata_rata: kecMap[name].dinilai > 0 
                ? parseFloat((kecMap[name].sumNilai / kecMap[name].dinilai).toFixed(1))
                : 0
        })).sort((a, b) => b.rata_rata - a.rata_rata);

        // Rekap per PJ
        const pjMap = {};
        allData.forEach(m => {
            const pj = m.pj || 'Belum Ditentukan';
            if (!pjMap[pj]) {
                pjMap[pj] = { total: 0, dinilai: 0, sumNilai: 0 };
            }
            pjMap[pj].total++;
            if (m.nilai !== null && m.nilai !== undefined) {
                pjMap[pj].dinilai++;
                pjMap[pj].sumNilai += Number(m.nilai);
            }
        });

        const rekapPj = Object.keys(pjMap).map(name => ({
            nama_pj: name,
            total_mitra: pjMap[name].total,
            sudah_dinilai: pjMap[name].dinilai,
            rata_rata: pjMap[name].dinilai > 0 
                ? parseFloat((pjMap[name].sumNilai / pjMap[name].dinilai).toFixed(1))
                : 0
        })).sort((a, b) => b.rata_rata - a.rata_rata);

        return res.json({
            success: true,
            summary: {
                total_mitra: allData.length,
                ppl_total: allData.filter(m => (m.role || '').toUpperCase() === 'PPL').length,
                pml_total: allData.filter(m => (m.role || '').toUpperCase() === 'PML').length,
                sudah_dinilai: evaluated.length,
                belum_dinilai: allData.length - evaluated.length,
                persentase_penyelesaian: parseFloat(((evaluated.length / Math.max(1, allData.length)) * 100).toFixed(1)),
                rata_rata_nilai: avgScore,
                nilai_tertinggi: maxScore,
                nilai_terendah: minScore
            },
            kategori_distribution: kategoriCounts,
            per_kecamatan: rekapKecamatan,
            per_pj: rekapPj
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// =========================================================================
// 3. GET /api/mitra/keys: Informasi Kunci Integrasi
// =========================================================================
router.get('/keys/info', (req, res) => {
    try {
        const keys = loadApiKeys();
        const masterKey = getMasterApiKey();
        return res.json({
            success: true,
            master_key: masterKey,
            total_keys: keys.length,
            active_keys: keys.filter(k => k.status === 'active').map(k => ({
                id: k.id,
                name: k.name,
                key_prefix: k.key ? `${k.key.slice(0, 15)}...` : '',
                status: k.status,
                permissions: k.permissions,
                created_at: k.created_at,
                last_used_at: k.last_used_at,
                usage_count: k.usage_count || 0
            }))
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// =========================================================================
// 4. GET /api/mitra/:id: Detail Penilaian 1 Orang Mitra (by ID atau Email)
// =========================================================================
router.get('/:id', (req, res) => {
    try {
        const paramId = decodeURIComponent(req.params.id).trim();
        const allData = loadMitraData();

        const found = allData.find(m => 
            (m.id && m.id.toLowerCase() === paramId.toLowerCase()) ||
            (m.email && m.email.toLowerCase() === paramId.toLowerCase()) ||
            getRecordKey(m).toLowerCase() === paramId.toLowerCase()
        );

        if (!found) {
            return res.status(404).json({
                success: false,
                message: `Data mitra dengan identifier '${paramId}' tidak ditemukan.`
            });
        }

        return res.json({
            success: true,
            data: found
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// =========================================================================
// 5. PUT /api/mitra/:id: Simpan / Perbarui Nilai & Catatan Mitra
// =========================================================================
router.put('/:id', (req, res) => {
    try {
        const paramId = decodeURIComponent(req.params.id).trim();
        const allData = loadMitraData();

        let targetIdx = allData.findIndex(m => 
            (m.id && m.id.toLowerCase() === paramId.toLowerCase()) ||
            (m.email && m.email.toLowerCase() === paramId.toLowerCase()) ||
            getRecordKey(m).toLowerCase() === paramId.toLowerCase()
        );

        const { nilai, catatan, kategori, nama, role, pj, kecamatan } = req.body;

        let numNilai = null;
        if (nilai !== undefined && nilai !== null && nilai !== '') {
            numNilai = parseFloat(nilai);
            if (isNaN(numNilai) || numNilai < 0 || numNilai > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Nilai harus berupa angka antara 0 hingga 100.'
                });
            }
        }

        const computedKategori = numNilai !== null ? getKategoriFromNilai(numNilai) : (kategori || null);

        let updatedRecord = null;

        if (targetIdx !== -1) {
            // Update existing record
            const current = allData[targetIdx];
            updatedRecord = {
                ...current,
                nama: nama || current.nama,
                role: (role || current.role || 'PPL').toUpperCase(),
                pj: pj || current.pj,
                kecamatan: kecamatan || current.kecamatan,
                nilai: numNilai,
                kategori: computedKategori,
                catatan: catatan !== undefined ? (catatan || '') : (current.catatan || ''),
                updatedAt: new Date().toISOString()
            };
            allData[targetIdx] = updatedRecord;
        } else {
            // Create new record
            updatedRecord = {
                id: paramId.includes('_') ? paramId : `${paramId.toLowerCase()}_${(role || 'ppl').toLowerCase()}`,
                email: req.body.email || (paramId.includes('@') ? paramId : ''),
                nama: nama || 'Mitra Baru',
                role: (role || 'PPL').toUpperCase(),
                pj: pj || '-',
                kecamatan: kecamatan || '-',
                nilai: numNilai,
                kategori: computedKategori,
                catatan: catatan || '',
                updatedAt: new Date().toISOString()
            };
            allData.push(updatedRecord);
        }

        saveMitraData(allData);
        trySyncToMySql(updatedRecord);

        return res.json({
            success: true,
            message: `Data penilaian untuk ${updatedRecord.nama} berhasil diperbarui.`,
            data: updatedRecord
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// =========================================================================
// 6. POST /api/mitra/bulk: Simpan Banyak Nilai Sekaligus (Batch / Auto-sync)
// =========================================================================
router.post('/bulk', (req, res) => {
    try {
        const items = req.body.items;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Body request wajib berupa array items: MitraRecord[].'
            });
        }

        const allData = loadMitraData();
        const dataMap = new Map();
        allData.forEach((m, idx) => {
            dataMap.set(getRecordKey(m).toLowerCase(), idx);
            if (m.email) dataMap.set(m.email.toLowerCase(), idx);
        });

        let updatedCount = 0;
        let insertedCount = 0;

        items.forEach(item => {
            const key = getRecordKey(item).toLowerCase();
            const emailKey = (item.email || '').toLowerCase();
            const idx = dataMap.has(key) ? dataMap.get(key) : (dataMap.has(emailKey) ? dataMap.get(emailKey) : -1);

            let numNilai = null;
            if (item.nilai !== undefined && item.nilai !== null && item.nilai !== '') {
                const parsed = parseFloat(item.nilai);
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                    numNilai = parsed;
                }
            }

            const computedKat = numNilai !== null ? getKategoriFromNilai(numNilai) : (item.kategori || null);

            if (idx !== -1 && idx < allData.length) {
                const curr = allData[idx];
                allData[idx] = {
                    ...curr,
                    nama: item.nama || curr.nama,
                    role: (item.role || curr.role || 'PPL').toUpperCase(),
                    pj: item.pj && item.pj !== '-' ? item.pj : curr.pj,
                    kecamatan: item.kecamatan && item.kecamatan !== '-' ? item.kecamatan : curr.kecamatan,
                    nilai: numNilai !== null ? numNilai : curr.nilai,
                    kategori: computedKat || curr.kategori,
                    catatan: item.catatan !== undefined ? item.catatan : curr.catatan,
                    updatedAt: new Date().toISOString()
                };
                updatedCount++;
                trySyncToMySql(allData[idx]);
            } else {
                const newRec = {
                    id: getRecordKey(item),
                    email: item.email || '',
                    nama: item.nama || 'Mitra Baru',
                    role: (item.role || 'PPL').toUpperCase(),
                    pj: item.pj || '-',
                    kecamatan: item.kecamatan || '-',
                    nilai: numNilai,
                    kategori: computedKat,
                    catatan: item.catatan || '',
                    updatedAt: new Date().toISOString()
                };
                allData.push(newRec);
                dataMap.set(getRecordKey(newRec).toLowerCase(), allData.length - 1);
                insertedCount++;
                trySyncToMySql(newRec);
            }
        });

        saveMitraData(allData);

        return res.json({
            success: true,
            message: `Berhasil memperbarui ${updatedCount} dan menambahkan ${insertedCount} data penilaian mitra.`,
            updated_count: updatedCount,
            inserted_count: insertedCount,
            total_now: allData.length
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

