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

// Helper to load datasets safely into RAM
function loadKbliData() {
    if (isLoaded) return;
    try {
        const dataPath = path.join(__dirname, '../kbli_data');
        const allItemsRaw = JSON.parse(fs.readFileSync(path.join(dataPath, 'kbli_2025_all_items.json'), 'utf8'));
        const categoriesRaw = JSON.parse(fs.readFileSync(path.join(dataPath, '01_kategori.json'), 'utf8'));

        categories = categoriesRaw;
        categories.forEach(cat => {
            categoryMap.set(cat.code, cat);
        });

        itemMap = new Map(allItemsRaw.map(it => [it.kode, it]));

        // Enrich items with parent hierarchy & category mapping
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

            return {
                ...item,
                kategori_kode: kategoriCode,
                kategori_judul: kategoriInfo.title || (kategoriRoot?.judul || ''),
                breadcrumb
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

// Helper for snippet extraction & keyword matching
function createSnippet(text, query, maxLength = 160) {
    if (!text) return '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!query) {
        return cleanText.length > maxLength ? cleanText.slice(0, maxLength) + '...' : cleanText;
    }

    const lowerText = cleanText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);

    if (idx === -1) {
        return cleanText.length > maxLength ? cleanText.slice(0, maxLength) + '...' : cleanText;
    }

    const start = Math.max(0, idx - 40);
    const end = Math.min(cleanText.length, idx + query.length + 100);
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

    const query = req.query || {};
    const q = (query.q || '').trim();
    const kategori = (query.kategori || 'ALL').trim().toUpperCase();
    const level = (query.level || 'all').trim().toLowerCase();
    const sort = (query.sort || 'relevance').trim().toLowerCase();
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));

    let filtered = allItems;

    // Filter by Kategori
    if (kategori && kategori !== 'ALL') {
        filtered = filtered.filter(item => item.kategori_kode === kategori);
    }

    // Filter by Hierarchy Level
    if (level && level !== 'all') {
        filtered = filtered.filter(item => item.level === level);
    }

    // Filter by Search Query
    if (q) {
        const queryLower = q.toLowerCase();
        const queryTokens = queryLower.split(/\s+/).filter(Boolean);

        const scored = [];
        for (const item of filtered) {
            const kodeLower = item.kode.toLowerCase();
            const judulLower = item.judul.toLowerCase();
            const descLower = (item.deskripsi || '').toLowerCase();

            let score = 0;

            // Exact code match = highest score
            if (kodeLower === queryLower) score += 1000;
            else if (kodeLower.startsWith(queryLower)) score += 500;
            else if (kodeLower.includes(queryLower)) score += 200;

            // Title match
            if (judulLower === queryLower) score += 400;
            else if (judulLower.includes(queryLower)) score += 150;

            // Token matches in title & description
            let allTokensFound = true;
            for (const token of queryTokens) {
                const inTitle = judulLower.includes(token);
                const inDesc = descLower.includes(token);
                if (inTitle) score += 40;
                else if (inDesc) score += 10;
                else allTokensFound = false;
            }

            if (score > 0 || allTokensFound) {
                scored.push({ item, score });
            }
        }

        // Sort by relevance score
        scored.sort((a, b) => b.score - a.score);
        filtered = scored.map(s => s.item);
    } else {
        // Default sorting
        if (sort === 'title') {
            filtered = [...filtered].sort((a, b) => a.judul.localeCompare(b.judul));
        } else {
            // Sort by code / level
            filtered = [...filtered].sort((a, b) => a.kode.localeCompare(b.kode));
        }
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    // Return lightweight payload for list view (prevents excessive network bandwidth)
    const resultItems = paginatedItems.map(item => ({
        kode: item.kode,
        judul: item.judul,
        level: item.level,
        digit: item.digit,
        kategori_kode: item.kategori_kode,
        kategori_judul: item.kategori_judul,
        induk: item.induk,
        snippet: createSnippet(item.deskripsi, q),
        has_exclusions: (item.deskripsi || '').toLowerCase().includes('tidak mencakup')
    }));

    res.json({
        total,
        page,
        limit,
        totalPages,
        items: resultItems
    });
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
            has_exclusions: (it.deskripsi || '').toLowerCase().includes('tidak mencakup'),
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
