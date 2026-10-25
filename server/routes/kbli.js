const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// In-Memory Database for KBLI 2025
let isLoaded = false;
let allItems = [];
let categories = [];
let itemMap = new Map();
let categoryMap = new Map();
let se2026Data = null;
let se2026KbliMap = new Map();
let se2026Rules = [];

// Helper to load datasets safely into RAM
function loadKbliData() {
    if (isLoaded) return;
    try {
        const dataPath = path.join(__dirname, '../kbli_data');
        const allItemsRaw = JSON.parse(fs.readFileSync(path.join(dataPath, 'kbli_2025_all_items.json'), 'utf8'));
        const categoriesRaw = JSON.parse(fs.readFileSync(path.join(dataPath, '01_kategori.json'), 'utf8'));

        // Load SE2026 empirical training data if available
        const se2026Path = path.join(dataPath, 'se2026_training_empirical.json');
        if (fs.existsSync(se2026Path)) {
            try {
                se2026Data = JSON.parse(fs.readFileSync(se2026Path, 'utf8'));
                if (se2026Data?.kbli_summary) {
                    se2026KbliMap = new Map(Object.entries(se2026Data.kbli_summary));
                }
                if (se2026Data?.rules) {
                    se2026Rules = Object.values(se2026Data.rules);
                    // Sort phrases first (longer phrases higher precedence), then tokens
                    se2026Rules.sort((a, b) => {
                        const lenA = a.pattern.split(' ').length;
                        const lenB = b.pattern.split(' ').length;
                        if (lenA !== lenB) return lenB - lenA;
                        return b.count - a.count;
                    });
                }
                console.log(`✔ [KBLI 2025] Loaded SE2026 empirical training data: ${se2026KbliMap.size} KBLI codes, ${se2026Rules.length} rules.`);
            } catch (seErr) {
                console.warn('Note on loading SE2026 training data:', seErr.message);
            }
        }

        categories = categoriesRaw;
        categories.forEach(cat => {
            categoryMap.set(cat.code, cat);
        });

        itemMap = new Map(allItemsRaw.map(it => [it.kode, it]));

        // Index trained rule patterns by 5-digit KBLI code
        const kbliPatternsMap = new Map();
        for (const rule of se2026Rules) {
            if (rule.kbli) {
                if (!kbliPatternsMap.has(rule.kbli)) {
                    kbliPatternsMap.set(rule.kbli, []);
                }
                kbliPatternsMap.get(rule.kbli).push(rule.pattern);
            }
        }

        // Enrich items with parent hierarchy & category mapping & SE2026 empirical field data
        allItems = allItemsRaw.map(item => {
            // Traverse up to find root kategori
            let curr = item;
            const breadcrumb = [
                {
                    kode: item.kode,
                    judul: item.judul,
                    level: item.level,
                    digit: item.digit
                }
            ];

            while (curr && curr.induk && itemMap.has(curr.induk)) {
                curr = itemMap.get(curr.induk);
                breadcrumb.unshift({
                    kode: curr.kode,
                    judul: curr.judul,
                    level: curr.level,
                    digit: curr.digit
                });
            }

            const kategoriRoot = breadcrumb[0];
            const kategoriCode = kategoriRoot?.level === 'kategori' ? kategoriRoot.kode : (item.level === 'kategori' ? item.kode : '');
            const kategoriInfo = categoryMap.get(kategoriCode) || {};

            const desc = item.deskripsi || '';
            const descLower = desc.toLowerCase();
            let exclIdx = descLower.indexOf('tidak mencakup');
            if (exclIdx === -1) exclIdx = descLower.indexOf('tidak termasuk');
            const inclusion = exclIdx !== -1 ? descLower.slice(0, exclIdx) : descLower;
            const exclusion = exclIdx !== -1 ? descLower.slice(exclIdx) : '';

            // Attach empirical SE2026 training data for 5-digit KBLI
            const se2026Info = se2026KbliMap.get(item.kode);
            const trainedPatterns = kbliPatternsMap.get(item.kode) || [];
            let empiricalText = '';
            if (se2026Info || trainedPatterns.length > 0) {
                empiricalText = [
                    ...(se2026Info ? se2026Info.top_nama || [] : []),
                    ...(se2026Info ? se2026Info.top_kegiatan || [] : []),
                    ...(se2026Info ? se2026Info.top_produk || [] : []),
                    ...(se2026Info ? se2026Info.keywords || [] : []),
                    ...trainedPatterns
                ].join(' ').toLowerCase();
            }

            return {
                ...item,
                kategori_kode: kategoriCode,
                kategori_judul: kategoriInfo.title || (kategoriRoot?.judul || ''),
                breadcrumb,
                se2026_empirical: se2026Info ? {
                    count: se2026Info.count,
                    top_nama: se2026Info.top_nama,
                    top_kegiatan: se2026Info.top_kegiatan,
                    top_produk: se2026Info.top_produk
                } : null,
                // Pre-indexed search fields for ultra-fast, zero-overhead execution
                _kodeLower: item.kode.toLowerCase(),
                _judulLower: item.judul.toLowerCase(),
                _inclusionLower: inclusion,
                _exclusionLower: exclusion,
                _empiricalLower: empiricalText,
                _is5Digit: item.digit === 5 || item.level === 'kelompok'
            };
        });

        // Re-populate map with enriched items
        itemMap = new Map(allItems.map(it => [it.kode, it]));
        isLoaded = true;
        console.log(`✔ [KBLI 2025] Successfully initialized ${allItems.length} items and ${categories.length} categories in server memory.`);
    } catch (err) {
        console.error('❌ [KBLI 2025] Failed to load dataset:', err.message);
    }
}

// Auto-load on route registration
loadKbliData();

// Compatibility middleware for both Express and Vite/Connect dev server middleware
router.use((req, res, next) => {
    // 1. Ensure req.query exists and is populated
    if (!req.query && req.url) {
        try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const qObj = {};
            for (const [key, val] of parsedUrl.searchParams.entries()) {
                qObj[key] = val;
            }
            req.query = qObj;
        } catch (e) {
            req.query = {};
        }
    } else if (!req.query) {
        req.query = {};
    }

    // 2. Ensure res.json and res.status exist in Connect/Node HTTP
    if (typeof res.json !== 'function') {
        res.json = function(data) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data));
            return res;
        };
    }
    if (typeof res.status !== 'function') {
        res.status = function(code) {
            res.statusCode = code;
            return res;
        };
    }

    next();
});

// Helper for snippet extraction & keyword matching (centered around matched keywords/commodities)
function createSnippet(text, query, maxLength = 180) {
    if (!text) return '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!query) {
        return cleanText.length > maxLength ? cleanText.slice(0, maxLength) + '...' : cleanText;
    }

    const lowerText = cleanText.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    let idx = lowerText.indexOf(lowerQuery);

    if (idx === -1) {
        // If exact phrase not found, find position of any significant keyword token (length >= 3)
        const tokens = lowerQuery.split(/\s+/).filter(t => t.length >= 3);
        for (const token of tokens) {
            const tokenIdx = lowerText.indexOf(token);
            if (tokenIdx !== -1) {
                idx = tokenIdx;
                break;
            }
        }
    }

    if (idx === -1) {
        return cleanText.length > maxLength ? cleanText.slice(0, maxLength) + '...' : cleanText;
    }

    const start = Math.max(0, idx - 40);
    const end = Math.min(cleanText.length, idx + 140);
    let snippet = cleanText.slice(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < cleanText.length) snippet = snippet + '...';
    return snippet;
}

/**
 * GET /api/kbli/stats
 * Overview counts of KBLI 2025 items per level
 */
router.get('/stats', (req, res) => {
    loadKbliData();
    const stats = {
        total: allItems.length,
        categories: categories.length,
        levels: {
            kategori: allItems.filter(i => i.level === 'kategori').length,
            golongan_pokok: allItems.filter(i => i.level === 'golongan_pokok').length,
            golongan: allItems.filter(i => i.level === 'golongan').length,
            subgolongan: allItems.filter(i => i.level === 'subgolongan').length,
            kelompok: allItems.filter(i => i.level === 'kelompok').length
        }
    };
    res.json(stats);
});

/**
 * GET /api/kbli/categories
 * Returns list of 22 categories with metadata
 */
router.get('/categories', (req, res) => {
    loadKbliData();
    const enrichedCategories = categories.map(cat => {
        const itemsInCat = allItems.filter(i => i.kategori_kode === cat.code);
        return {
            code: cat.code,
            title: cat.title,
            description: cat.description,
            total_items: itemsInCat.length,
            total_kelompok: itemsInCat.filter(i => i.level === 'kelompok').length,
            total_golongan_pokok: itemsInCat.filter(i => i.level === 'golongan_pokok').length
        };
    });

    res.json(enrichedCategories);
});

/**
 * GET /api/kbli/search
 * Smart search with category & hierarchy filters + pagination
 * Params:
 * - q: keyword (code, title, or definition text)
 * - kategori: 'ALL' or 'A'..'U'
 * - level: 'all' | 'kategori' | 'golongan_pokok' | 'golongan' | 'subgolongan' | 'kelompok'
 * - sort: 'code' | 'title' | 'relevance'
 * - page: integer (default 1)
 * - limit: integer (default 20, max 100)
 */
router.get('/search', (req, res) => {
    loadKbliData();
    const startTime = process.hrtime.bigint();

    const query = req.query || {};
    const q = (query.q || '').trim();
    const kategori = (query.kategori || 'ALL').trim().toUpperCase();
    const level = (query.level || 'all').trim().toLowerCase();
    const sort = (query.sort || 'relevance').trim().toLowerCase();
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));

    let pool = allItems;

    // Fast filter by Kategori
    if (kategori && kategori !== 'ALL') {
        pool = pool.filter(item => item.kategori_kode === kategori);
    }

    // Fast filter by Hierarchy Level
    if (level && level !== 'all') {
        pool = pool.filter(item => item.level === level);
    }

    // Level priority: 5-digit Kelompok items ALWAYS displayed first!
    const levelPriority = {
        kelompok: 1,       // 5 digit (Kelompok) - highest operational priority
        subgolongan: 2,    // 4 digit
        golongan: 3,       // 3 digit
        golongan_pokok: 4, // 2 digit
        kategori: 5        // 1 digit / alphabet
    };

    let filtered = pool;

    // Filter & Score by Search Query (Ultra-Fast Pre-Indexed Matching)
    if (q) {
        const queryLower = q.toLowerCase();
        // Ignore single-character noise unless valid KBLI category letter A-U or single digit 0-9
        const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 1 || /^[a-u0-9]$/i.test(t));

        const scored = [];
        const poolLen = pool.length;

        for (let i = 0; i < poolLen; i++) {
            const item = pool[i];
            let score = 0;
            let matchedTokensCount = 0;

            // 1. Exact match on Code (Highest instant pinpoint)
            if (item._kodeLower === queryLower) {
                score += 25000;
            } else if (item._kodeLower.startsWith(queryLower)) {
                score += 5000;
            } else if (item._kodeLower.includes(queryLower)) {
                score += 1500;
            }

            // 2. Title match
            if (item._judulLower === queryLower) {
                score += 15000;
            } else if (item._judulLower.includes(queryLower)) {
                score += 6000;
            }

            // Penalty if title specifically says "selain [query]" (negative exclusion in title)
            if (item._judulLower.includes('selain ' + queryLower)) {
                score -= 3500;
            }

            // 3. Exact Phrase in Inclusion (Commodity concept)
            if (item._inclusionLower.includes(queryLower)) {
                score += 4000;
            } else if (item._exclusionLower.includes(queryLower)) {
                score += 200; // Small score for exclusion mention
            }

            // 4. Token-by-token matching across Title & Description
            let titleHits = 0;
            let inclusionHits = 0;
            let exclusionHits = 0;

            for (let j = 0; j < queryTokens.length; j++) {
                const token = queryTokens[j];
                let hit = false;

                if (item._judulLower.includes(token)) {
                    if (item._judulLower.includes('selain ' + token)) {
                        score += 30; // Negative context in title
                    } else {
                        titleHits++;
                        hit = true;
                    }
                }
                if (item._inclusionLower.includes(token)) {
                    inclusionHits++;
                    hit = true;
                } else if (item._exclusionLower.includes(token)) {
                    exclusionHits++;
                    hit = true;
                }

                if (hit) matchedTokensCount++;
            }

            score += titleHits * 700;
            score += inclusionHits * 250;
            score += exclusionHits * 30;

            // 5. Match in SE2026 Empirical Training Data (Real field commodities, business names, activities)
            let empiricalHits = 0;
            if (item._empiricalLower) {
                if (item._empiricalLower.includes(queryLower)) {
                    score += 8500; // Strong match on empirical phrase in Mempawah census!
                    empiricalHits += 2;
                } else {
                    for (let j = 0; j < queryTokens.length; j++) {
                        if (item._empiricalLower.includes(queryTokens[j])) {
                            score += 1500;
                            empiricalHits++;
                        }
                    }
                }
            }

            // Bonus if ALL query tokens match
            if (queryTokens.length > 1 && matchedTokensCount === queryTokens.length) {
                score += 3000;
            }

            if (score > 0) {
                scored.push({ item, score, matchedTokensCount });
            }
        }

        // Sort by Priority:
        // 1. Exact code match is absolute #1 (e.g. typing '01' or '01111')
        // 2. 5-digit Kelompok items ALWAYS displayed first!
        // 3. Number of matched tokens
        // 4. Relevance score descending
        scored.sort((a, b) => {
            const aExactCode = a.item._kodeLower === queryLower;
            const bExactCode = b.item._kodeLower === queryLower;
            if (aExactCode && !bExactCode) return -1;
            if (!aExactCode && bExactCode) return 1;

            // Prioritize 5-digit (kelompok) first!
            const rankA = levelPriority[a.item.level] || 99;
            const rankB = levelPriority[b.item.level] || 99;
            if (rankA !== rankB) {
                return rankA - rankB; // Rank 1 (kelompok 5-digit) comes first!
            }

            // Within same level, prioritize more tokens matched
            if (a.matchedTokensCount !== b.matchedTokensCount && queryTokens.length > 1) {
                return b.matchedTokensCount - a.matchedTokensCount;
            }

            // Within same level, sort by relevance score
            return b.score - a.score;
        });

        filtered = scored.map(s => s.item);
    } else {
        // Default sorting
        if (sort === 'title') {
            filtered = [...pool].sort((a, b) => a.judul.localeCompare(b.judul));
        } else {
            // Sort by level priority (5-digit first) or code
            filtered = [...pool].sort((a, b) => {
                const rankA = levelPriority[a.level] || 99;
                const rankB = levelPriority[b.level] || 99;
                if (rankA !== rankB) return rankA - rankB;
                return a.kode.localeCompare(b.kode);
            });
        }
    }

    const endTime = process.hrtime.bigint();
    const timeMs = Number(endTime - startTime) / 1e6;

    const total = filtered.length;
    const totalKelompok = filtered.filter(item => item._is5Digit).length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    // Return lightweight payload for list view (prevents excessive network bandwidth)
    const resultItems = paginatedItems.map(item => {
        let snippetText = createSnippet(item.deskripsi, q, 180);
        let empiricalMatch = null;
        if (item.se2026_empirical) {
            const emp = item.se2026_empirical;
            empiricalMatch = {
                count: emp.count,
                top_produk: emp.top_produk || [],
                top_kegiatan: emp.top_kegiatan || [],
                top_nama: emp.top_nama || []
            };
            // If user query matched empirical field data, enrich snippet
            const queryHitEmpirical = q && item._empiricalLower && (
                item._empiricalLower.includes(q.toLowerCase()) ||
                q.toLowerCase().split(/\s+/).some(t => t.length >= 3 && item._empiricalLower.includes(t))
            );
            if (queryHitEmpirical && emp.top_produk && emp.top_produk.length > 0) {
                const sampleProds = emp.top_produk.slice(0, 3).join(', ');
                snippetText = `✨ Data SE2026 Mempawah (${emp.count} unit): ${sampleProds} • ${snippetText}`;
            }
        }

        return {
            kode: item.kode,
            judul: item.judul,
            level: item.level,
            digit: item.digit,
            kategori_kode: item.kategori_kode,
            kategori_judul: item.kategori_judul,
            induk: item.induk,
            snippet: snippetText,
            has_exclusions: /tidak\s+(?:ini\s+)?(?:mencakup|termasuk)/i.test(item.deskripsi || ''),
            se2026_match: empiricalMatch
        };
    });

    res.json({
        total,
        total_kelompok: totalKelompok,
        execution_time_ms: Number(timeMs.toFixed(2)),
        page,
        limit,
        totalPages,
        items: resultItems
    });
});

/**
 * GET /api/kbli/recommend
 * Recommend KBLI category & 5-digit code based on SE2026 empirical trained models
 */
router.get('/recommend', (req, res) => {
    loadKbliData();
    const rawName = (req.query.name || req.query.q || '').trim();
    if (!rawName || rawName.length < 2) {
        return res.json({ suggestion: null });
    }
    const clean = rawName
        .replace(/\(.*?\)|<.*?>|\[.*?\]/g, ' ')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const tokens = clean.split(' ').filter(t => t.length >= 3);

    for (const rule of se2026Rules) {
        if (rule.isPhrase) {
            if (clean.includes(rule.pattern)) {
                return res.json({
                    suggestion: {
                        kategori: rule.kategori,
                        kbli: rule.kbli,
                        matchedKeyword: rule.pattern,
                        count: rule.count,
                        precision: rule.prec
                    }
                });
            }
        } else {
            if (tokens.includes(rule.pattern) || (rule.pattern.length >= 4 && clean.includes(rule.pattern))) {
                return res.json({
                    suggestion: {
                        kategori: rule.kategori,
                        kbli: rule.kbli,
                        matchedKeyword: rule.pattern,
                        count: rule.count,
                        precision: rule.prec
                    }
                });
            }
        }
    }
    res.json({ suggestion: null });
});

/**
 * GET /api/kbli/detail/:kode
 * Full detailed view of an item including complete description,
 * breadcrumbs, children, and cross-reference links
 */
router.get('/detail/:kode', (req, res) => {
    loadKbliData();
    const kode = String(req.params?.kode || '').trim();
    const item = itemMap.get(kode);

    if (!item) {
        return res.status(404).json({ message: `Kode KBLI '${kode}' tidak ditemukan.` });
    }

    // Find direct children
    const children = allItems
        .filter(it => it.induk === kode)
        .map(it => ({
            kode: it.kode,
            judul: it.judul,
            level: it.level,
            digit: it.digit,
            deskripsi: it.deskripsi,
            snippet: createSnippet(it.deskripsi, '', 160),
            has_exclusions: /tidak\s+(?:ini\s+)?(?:mencakup|termasuk)/i.test(it.deskripsi || ''),
            child_count: allItems.filter(c => c.induk === it.kode).length
        }));

    // Find siblings (same parent)
    const siblings = item.induk 
        ? allItems
            .filter(it => it.induk === item.induk && it.kode !== kode)
            .slice(0, 8)
            .map(it => ({
                kode: it.kode,
                judul: it.judul,
                level: it.level
            }))
        : [];

    res.json({
        ...item,
        children,
        siblings
    });
});

module.exports = router;
