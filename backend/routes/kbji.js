const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// In-Memory Database for KBJI 2014
let isLoaded = false;
let allItems = [];
let categories = [];
let itemMap = new Map();
let categoryMap = new Map();
let mempawahTrainingData = null;
let mempawahRules = [];
let mempawahSummary = new Map();

// Level Priority (Operational specificity: Jabatan 5-digit and Sub-Golongan 4-digit highest)
const LEVEL_PRIORITY = {
    'jabatan': 1,
    'sub_golongan': 2,
    'golongan': 3,
    'sub_golongan_pokok': 4,
    'golongan_pokok': 5
};

const LEVEL_LABELS = {
    'golongan_pokok': 'Golongan Pokok (1 Digit)',
    'sub_golongan_pokok': 'Sub-Golongan Pokok (2 Digit)',
    'golongan': 'Golongan (3 Digit)',
    'sub_golongan': 'Sub-Golongan (4 Digit)',
    'jabatan': 'Jabatan Spesifik'
};

function createSnippet(text, query, maxLength = 220) {
    if (!text) return '';
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLength) return clean;

    if (!query) return clean.slice(0, maxLength) + '...';

    const lower = clean.toLowerCase();
    const qLower = query.toLowerCase();
    const idx = lower.indexOf(qLower);

    if (idx === -1) {
        return clean.slice(0, maxLength) + '...';
    }

    const start = Math.max(0, idx - 40);
    const end = Math.min(clean.length, idx + query.length + 140);
    let snippet = clean.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < clean.length) snippet = snippet + '...';
    return snippet;
}

function loadKbjiData() {
    if (isLoaded) return;
    try {
        const dataPath = path.join(__dirname, '../kbji_data');
        const allItemsPath = path.join(dataPath, 'kbji_2014_all_items.json');
        const categoriesPath = path.join(dataPath, '01_golongan_pokok.json');
        const trainingPath = path.join(dataPath, 'kbji_mempawah_training.json');

        if (!fs.existsSync(allItemsPath) || !fs.existsSync(categoriesPath)) {
            console.warn('KBJI 2014 datasets not found in', dataPath);
            return;
        }

        const rawAll = JSON.parse(fs.readFileSync(allItemsPath, 'utf8'));
        categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

        if (fs.existsSync(trainingPath)) {
            try {
                mempawahTrainingData = JSON.parse(fs.readFileSync(trainingPath, 'utf8'));
                if (mempawahTrainingData.rules) {
                    mempawahRules = Object.values(mempawahTrainingData.rules);
                    mempawahRules.sort((a, b) => {
                        const lenA = a.pattern.split(' ').length;
                        const lenB = b.pattern.split(' ').length;
                        if (lenA !== lenB) return lenB - lenA;
                        return (b.count || 0) - (a.count || 0);
                    });
                }
                if (mempawahTrainingData.kbji_summary) {
                    mempawahSummary = new Map(Object.entries(mempawahTrainingData.kbji_summary));
                }
            } catch (trErr) {
                console.warn('Note on loading Mempawah training data:', trErr.message);
            }
        }

        // Cache pre-computed lowercase fields for ultra-fast multi-token searching
        allItems = rawAll.map(it => {
            const empInfo = mempawahSummary.get(it.kode) || null;
            return {
                ...it,
                _kodeLower: String(it.kode).toLowerCase(),
                _judulLower: String(it.judul || '').toLowerCase(),
                _deskripsiLower: String(it.deskripsi || '').toLowerCase(),
                _isJabatan: it.level === 'jabatan',
                _isSubGolongan: it.level === 'sub_golongan',
                empInfo
            };
        });

        itemMap.clear();
        allItems.forEach(it => {
            itemMap.set(String(it.kode), it);
        });

        categoryMap.clear();
        categories.forEach(cat => {
            categoryMap.set(String(cat.code), cat);
        });

        isLoaded = true;
        console.log(`✔ [KBJI 2014] Loaded ${allItems.length} classification items & ${categories.length} Golongan Pokok into RAM.`);
    } catch (err) {
        console.error('Error loading KBJI 2014 data:', err);
    }
}

// Ensure loaded initially
loadKbjiData();

/**
 * GET /api/kbji/stats
 */
router.get('/stats', (req, res) => {
    loadKbjiData();
    res.json({
        total_items: allItems.length,
        total_categories: categories.length,
        total_jabatan: allItems.filter(i => i.level === 'jabatan').length,
        total_sub_golongan: allItems.filter(i => i.level === 'sub_golongan').length,
        total_mempawah_rules: mempawahRules.length,
        is_ready: isLoaded
    });
});

/**
 * GET /api/kbji/categories
 * Returns 10 Golongan Pokok (1-9 & 0) with breakdown counts
 */
router.get('/categories', (req, res) => {
    loadKbjiData();
    const enrichedCategories = categories.map(cat => {
        const catCode = String(cat.code);
        const itemsInCat = allItems.filter(i => String(i.golongan_pokok_kode) === catCode);
        return {
            code: catCode,
            title: cat.title,
            description: cat.description,
            total_items: itemsInCat.length,
            total_jabatan: itemsInCat.filter(i => i.level === 'jabatan').length,
            total_sub_golongan: itemsInCat.filter(i => i.level === 'sub_golongan').length,
            total_sub_golongan_pokok: itemsInCat.filter(i => i.level === 'sub_golongan_pokok').length
        };
    });

    res.json(enrichedCategories);
});

/**
 * GET /api/kbji/recommend
 * Quick recommendation endpoint for autocomplete
 */
router.get('/recommend', (req, res) => {
    loadKbjiData();
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q || q.length < 2) {
        return res.json([]);
    }

    const suggestions = [];
    const seen = new Set();

    // 1. Check Mempawah empirical rules
    for (const rule of mempawahRules) {
        if (rule.pattern.includes(q) || q.includes(rule.pattern)) {
            if (!seen.has(rule.kbji)) {
                seen.add(rule.kbji);
                suggestions.push({
                    kode: rule.kbji,
                    judul: rule.job_title,
                    kategori: rule.kategori,
                    pekerjaan: rule.pekerjaan,
                    bidang: rule.bidang,
                    source: 'Rekomendasi Lapangan Mempawah',
                    confidence: rule.confidence || 0.95
                });
                if (suggestions.length >= 6) break;
            }
        }
    }

    // 2. Check exact code prefix or title prefix
    if (suggestions.length < 6) {
        for (const it of allItems) {
            if (seen.has(it.kode)) continue;
            if (it._kodeLower.startsWith(q) || it._judulLower.includes(q)) {
                seen.add(it.kode);
                suggestions.push({
                    kode: it.kode,
                    judul: it.judul,
                    kategori: it.golongan_pokok_kode,
                    level: it.level,
                    source: 'Katalog Standar KBJI 2014',
                    confidence: 0.8
                });
                if (suggestions.length >= 8) break;
            }
        }
    }

    res.json(suggestions);
});

/**
 * GET /api/kbji/search
 * Smart multi-token search with Mempawah empirical boosting, level filters, & category filters
 */
router.get('/search', (req, res) => {
    loadKbjiData();
    const startTime = process.hrtime.bigint();

    const query = req.query || {};
    const q = (query.q || '').trim();
    const kategori = (query.kategori || 'ALL').trim().toUpperCase();
    const level = (query.level || 'all').trim().toLowerCase();
    const sort = (query.sort || 'relevance').trim().toLowerCase();
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));

    let pool = allItems;

    // Filter by Golongan Pokok (1 digit / 0)
    if (kategori && kategori !== 'ALL') {
        pool = pool.filter(item => String(item.golongan_pokok_kode) === kategori);
    }

    // Filter by Hierarchy Level
    if (level && level !== 'all') {
        pool = pool.filter(item => item.level === level);
    }

    let filtered = pool;
    let bestRec = null;

    if (q) {
        const queryLower = q.toLowerCase();
        const rawTokens = queryLower.split(/\s+/).filter(t => t.length > 1 || /^[0-9]$/.test(t));
        const queryTokens = rawTokens.length > 0 ? rawTokens : [queryLower];

        // 1. Check Mempawah Empirical Match for the query
        for (const rule of mempawahRules) {
            if (rule.pattern === queryLower || queryLower.includes(rule.pattern) || rule.pattern.includes(queryLower)) {
                bestRec = rule;
                break;
            }
        }

        const scored = [];
        const poolLen = pool.length;

        for (let i = 0; i < poolLen; i++) {
            const item = pool[i];
            let score = 0;
            let matchedTokensCount = 0;

            // 0. Boost from Mempawah Empirical Match
            if (bestRec && bestRec.kbji) {
                if (item.kode === bestRec.kbji || item.induk === bestRec.kbji) {
                    score += 35000;
                    matchedTokensCount = queryTokens.length;
                }
            }

            // 1. Exact match on Code
            if (item._kodeLower === queryLower) {
                score += 48000;
                matchedTokensCount = queryTokens.length;
            } else if (item._kodeLower.startsWith(queryLower)) {
                score += 7500;
                matchedTokensCount++;
            } else if (item._kodeLower.includes(queryLower)) {
                score += 2500;
            }

            // 2. Exact Title match
            if (item._judulLower === queryLower) {
                score += 20000;
                matchedTokensCount = queryTokens.length;
            } else if (item._judulLower.includes(queryLower)) {
                score += 8500;
            }

            // 3. Multi-token scoring across title and concept/description
            let titleHits = 0;
            let descHits = 0;

            for (let t = 0; t < queryTokens.length; t++) {
                const token = queryTokens[t];
                let hit = false;

                if (item._judulLower.includes(token)) {
                    titleHits++;
                    hit = true;
                }
                if (item._deskripsiLower.includes(token)) {
                    descHits++;
                    hit = true;
                }

                if (hit) matchedTokensCount++;
            }

            score += titleHits * 900;
            score += Math.min(descHits * 180, 2500);

            // 4. Bonus if all query tokens match
            if (queryTokens.length > 1 && matchedTokensCount >= queryTokens.length) {
                score += 4000;
            }

            if (score > 0) {
                scored.push({ item, score, matchedTokensCount });
            }
        }

        // Sorting
        scored.sort((a, b) => {
            const aExactCode = a.item._kodeLower === queryLower;
            const bExactCode = b.item._kodeLower === queryLower;
            if (aExactCode && !bExactCode) return -1;
            if (!aExactCode && bExactCode) return 1;

            // Mempawah best rec first
            if (bestRec && bestRec.kbji) {
                const aIsBest = a.item.kode === bestRec.kbji;
                const bIsBest = b.item.kode === bestRec.kbji;
                if (aIsBest && !bIsBest) return -1;
                if (!aIsBest && bIsBest) return 1;
            }

            // Prioritize specific Jabatan / Sub-Golongan
            const rankA = LEVEL_PRIORITY[a.item.level] || 99;
            const rankB = LEVEL_PRIORITY[b.item.level] || 99;
            if (rankA !== rankB) {
                return rankA - rankB;
            }

            return b.score - a.score;
        });

        filtered = scored.map(s => s.item);
    } else {
        if (sort === 'title-asc') {
            filtered = [...pool].sort((a, b) => a.judul.localeCompare(b.judul));
        } else if (sort === 'code-desc') {
            filtered = [...pool].sort((a, b) => b.kode.localeCompare(a.kode));
        } else if (sort === 'code-asc') {
            filtered = [...pool].sort((a, b) => a.kode.localeCompare(b.kode));
        } else {
            // Default: group by hierarchy level then code
            filtered = [...pool].sort((a, b) => {
                const rankA = LEVEL_PRIORITY[a.level] || 99;
                const rankB = LEVEL_PRIORITY[b.level] || 99;
                if (rankA !== rankB) return rankA - rankB;
                return a.kode.localeCompare(b.kode);
            });
        }
    }

    const endTime = process.hrtime.bigint();
    const timeMs = Number(endTime - startTime) / 1e6;

    const total = filtered.length;
    const totalJabatan = filtered.filter(item => item.level === 'jabatan').length;
    const totalSubGolongan = filtered.filter(item => item.level === 'sub_golongan').length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const pageItems = filtered.slice(startIndex, startIndex + limit).map(item => {
        let mempawahRec = null;
        if (mempawahSummary.has(item.kode)) {
            const summary = mempawahSummary.get(item.kode);
            mempawahRec = {
                badge: 'Rekomendasi Lapangan Mempawah',
                pekerjaan: summary.primary_job,
                bidang: summary.bidang,
                count: summary.count
            };
        } else if (bestRec && (bestRec.kbji === item.kode || bestRec.kbji === item.induk)) {
            mempawahRec = {
                badge: 'Rekomendasi Lapangan Mempawah',
                pekerjaan: bestRec.pekerjaan,
                bidang: bestRec.bidang,
                count: bestRec.count
            };
        }

        return {
            kode: item.kode,
            judul: item.judul,
            level: item.level,
            digit: item.digit,
            level_label: LEVEL_LABELS[item.level] || item.level,
            induk: item.induk,
            golongan_pokok_kode: item.golongan_pokok_kode,
            breadcrumbs: item.breadcrumbs || [],
            child_count: item.child_count || 0,
            snippet: createSnippet(item.deskripsi, q, 200),
            mempawah_recommendation: mempawahRec
        };
    });

    res.json({
        items: pageItems,
        total,
        total_jabatan: totalJabatan,
        total_sub_golongan: totalSubGolongan,
        page,
        limit,
        total_pages: totalPages,
        time_ms: Math.round(timeMs * 100) / 100,
        query: q,
        best_recommendation: bestRec ? {
            pattern: bestRec.pattern,
            kbji: bestRec.kbji,
            pekerjaan: bestRec.pekerjaan,
            bidang: bestRec.bidang,
            job_title: bestRec.job_title
        } : null
    });
});

/**
 * GET /api/kbji/detail/:kode
 * Full concept, definitions, main duties (tugas utama), breadcrumbs, children & siblings
 */
router.get('/detail/:kode', (req, res) => {
    loadKbjiData();
    const kode = String(req.params?.kode || '').trim();
    const item = itemMap.get(kode);

    if (!item) {
        return res.status(404).json({ message: `Kode KBJI '${kode}' tidak ditemukan.` });
    }

    // Children
    const children = allItems
        .filter(it => it.induk === kode)
        .map(it => ({
            kode: it.kode,
            judul: it.judul,
            level: it.level,
            digit: it.digit,
            level_label: LEVEL_LABELS[it.level] || it.level,
            deskripsi: it.deskripsi,
            snippet: createSnippet(it.deskripsi, '', 160),
            child_count: it.child_count || 0
        }));

    // Siblings under the same parent
    const siblings = item.induk
        ? allItems
            .filter(it => it.induk === item.induk && it.kode !== kode)
            .slice(0, 8)
            .map(it => ({
                kode: it.kode,
                judul: it.judul,
                level: it.level,
                digit: it.digit
            }))
        : [];

    // Mempawah Job Context
    const mempawahContext = mempawahSummary.get(kode) || null;

    res.json({
        kode: item.kode,
        judul: item.judul,
        level: item.level,
        digit: item.digit,
        level_label: LEVEL_LABELS[item.level] || item.level,
        induk: item.induk,
        golongan_pokok_kode: item.golongan_pokok_kode,
        deskripsi: item.deskripsi,
        breadcrumbs: item.breadcrumbs || [],
        children,
        siblings,
        mempawah_context: mempawahContext
    });
});

/**
 * POST /api/kbji/log-selection
 * Telemetry logging for searched & selected KBJI codes
 */
router.post('/log-selection', (req, res) => {
    try {
        const { query, kode, judul, level, timestamp } = req.body || {};
        // Can be stored or monitored as needed
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
