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
let namaUsahaPhrases = [];
let namaUsahaTokens = [];
let namaUsahaTokenMap = new Map();
let kbli5TitlesMap = {};

// Learned Model from 500+ High-Confidence Field Confirmations
let kbliLearnedModel = null;
let kbliLearnedRules = [];
const HIGH_CONFIDENCE_THRESHOLD = 500;

// Honorifics, Stopwords & Corporate Prefixes for SE2026 Business Name Normalization
const OWNER_HONORIFICS = new Set([
    'pak', 'bu', 'ibu', 'bapak', 'bpk', 'bang', 'bg', 'kak', 'dek', 'om', 'tante',
    'nek', 'kek', 'hj', 'haji', 'hajjah', 'ny', 'tn', 'sdr', 'sdri', 'abg', 'abang',
    'mak', 'wak', 'wan', 'cik', 'ce', 'ko', 'koh', 'ci'
]);

const GEO_AND_STOPWORDS = new Set([
    'dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'dengan', 'atau', 'ini', 'itu',
    'usaha', 'milik', 'sendiri', 'pribadi', 'kabupaten', 'mempawah', 'kecamatan', 'kelurahan',
    'desa', 'jalan', 'jl', 'dusun', 'rt', 'rw', 'no', 'nomor', 'hilir', 'hulu', 'timur', 'barat',
    'utara', 'selatan', 'tengah', 'dalam', 'luar', 'kota', 'sungai', 'pinyuh', 'kunyit',
    'segedong', 'jongkat', 'siantan', 'anjongan', 'toho', 'sadaniang'
]);

const CORP_PREFIXES = new Set([
    'cv', 'pt', 'ud', 'pd', 'fa', 'perum', 'perumda', 'bumdes', 'bumdesa', 'yayasan'
]);

const NON_AGRI_HEAD_WORDS = new Set([
    'toko', 'kios', 'grosir', 'minimarket', 'supermarket', 'swalayan', 'distro', 'butik', 'konter', 'counter', 'pangkalan', 'spbu', 'pertamini', 'pengepul', 'tengkulak', 'pedagang', 'dagang', 'apotek', 'apotik',
    'jual', 'jualan', 'penjual',
    'warung', 'warkop', 'kedai', 'kafe', 'cafe', 'coffee', 'coffe', 'resto', 'restoran', 'rm', 'kantin', 'angkringan', 'lesehan', 'catering', 'katering',
    'bengkel', 'servis', 'service', 'reparasi',
    'pabrik', 'industri', 'penggilingan', 'gilingan', 'pembuatan', 'membuat', 'produksi', 'pengolahan', 'pengeringan', 'penggaraman', 'percetakan', 'konveksi', 'penjahit', 'tailor', 'taylor', 'mebel', 'meubel', 'furnitur', 'somel', 'sawmill', 'depot', 'cetak',
    'angkutan', 'angkut', 'transportasi', 'truk', 'truck', 'dump', 'dam', 'pickup', 'ekspedisi', 'kurir', 'kargo', 'ojek', 'ojol', 'taksi', 'taxi', 'travel',
    'sewa', 'penyewaan', 'persewaan', 'rental', 'kontrakan', 'kost', 'kos', 'kosan', 'kostan', 'indekos',
    'konstruksi', 'kontruksi', 'kontraktor', 'pemborong', 'instalasi',
    'koperasi', 'ksp', 'bmt', 'bank', 'pegadaian', 'brilink',
    'pdam', 'pengumpul', 'pemulung',
    'kantor', 'studio', 'notaris', 'klinik', 'praktek', 'praktik', 'puskesmas', 'sd', 'smp', 'sma', 'smk', 'madrasah', 'pondok', 'tk', 'paud', 'bimbel',
    'lapangan', 'sanggar', 'pangkas', 'potong', 'cukur', 'salon', 'laundry', 'londri', 'permak', 'vermak', 'asisten', 'pembantu'
]);

const AGRI_EXPLICIT_HEADS = new Set([
    'utp', 'kebun', 'perkebunan', 'petani', 'sawah', 'ladang', 'hortikultura', 'holtikultura',
    'peternakan', 'peternak', 'ternak', 'kandang', 'perikanan', 'nelayan', 'tambak',
    'budidaya', 'pembibitan', 'pembenihan', 'penggemukan'
]);

const NON_AGRI_STRONG_SIGNALS = [
    'konstruksi', 'kontruksi', 'kontraktor', 'pemborong', 'instalasi', 'angkutan',
    'penggilingan', 'gilingan', 'kontrakan', 'laundry', 'pangkas', 'bengkel',
    'koperasi', 'brilink', 'notaris', 'futsal', 'bidan', 'dokter', 'pdam', 'rongsokan', 'pemulung'
];

function hasAny(wordSet, candidates) {
    for (let i = 0; i < candidates.length; i++) {
        if (wordSet.has(candidates[i])) return true;
    }
    return false;
}

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
                    se2026Rules.sort((a, b) => {
                        const lenA = a.pattern.split(' ').length;
                        const lenB = b.pattern.split(' ').length;
                        if (lenA !== lenB) return lenB - lenA;
                        return b.count - a.count;
                    });
                }
            } catch (seErr) {
                console.warn('Note on loading SE2026 training data:', seErr.message);
            }
        }

        // Load SE2026 Nama Usaha specialized model
        const namaModelPath = path.join(dataPath, 'se2026_nama_usaha_model.json');
        if (fs.existsSync(namaModelPath)) {
            try {
                const namaModel = JSON.parse(fs.readFileSync(namaModelPath, 'utf8'));
                namaUsahaPhrases = namaModel.phrases || [];
                namaUsahaTokens = namaModel.tokens || [];
                kbli5TitlesMap = namaModel.kbli5_titles || {};
                namaUsahaTokenMap = new Map(namaUsahaTokens.map(t => [t[0], t]));
                console.log(`✔ [KBLI 2025] Loaded SE2026 Nama Usaha Model: ${namaUsahaPhrases.length} phrases, ${namaUsahaTokens.length} tokens.`);
            } catch (nmErr) {
                console.warn('Note on loading SE2026 Nama Usaha model:', nmErr.message);
            }
        }

        // Load Field-Learned Model (Aktif otomatis setelah 500+ Konfirmasi Lapangan)
        const learnedPath = path.join(dataPath, 'kbli_learned_field_model.json');
        if (fs.existsSync(learnedPath)) {
            try {
                kbliLearnedModel = JSON.parse(fs.readFileSync(learnedPath, 'utf8'));
                if (Array.isArray(kbliLearnedModel?.rules)) {
                    kbliLearnedRules = kbliLearnedModel.rules;
                    console.log(`🎯 [KBLI 2025] Loaded Learned Model: ${kbliLearnedRules.length} aturan hasil 500+ konfirmasi lapangan.`);
                }
            } catch (lErr) {
                console.warn('Note on loading KBLI learned model:', lErr.message);
            }
        }

        categories = categoriesRaw;
        categories.forEach(cat => {
            categoryMap.set(cat.code, cat);
        });

        itemMap = new Map(allItemsRaw.map(it => [it.kode, it]));

        // Index trained rule patterns & nama_usaha phrases by 5-digit KBLI code
        const kbliPatternsMap = new Map();
        for (const rule of se2026Rules) {
            if (rule.kbli) {
                if (!kbliPatternsMap.has(rule.kbli)) {
                    kbliPatternsMap.set(rule.kbli, []);
                }
                kbliPatternsMap.get(rule.kbli).push(rule.pattern);
            }
        }
        for (const [phr, , kbli5] of namaUsahaPhrases) {
            if (kbli5) {
                if (!kbliPatternsMap.has(kbli5)) {
                    kbliPatternsMap.set(kbli5, []);
                }
                kbliPatternsMap.get(kbli5).push(phr);
            }
        }

        // Enrich items with parent hierarchy & category mapping & SE2026 empirical field data
        allItems = allItemsRaw.map(item => {
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
                _kodeLower: item.kode.toLowerCase(),
                _judulLower: item.judul.toLowerCase(),
                _inclusionLower: inclusion,
                _exclusionLower: exclusion,
                _empiricalLower: empiricalText,
                _empCount: se2026Info ? (se2026Info.count || 0) : 0,
                _is5Digit: item.digit === 5 || item.level === 'kelompok'
            };
        });

        itemMap = new Map(allItems.map(it => [it.kode, it]));
        isLoaded = true;
        console.log(`✔ [KBLI 2025] Successfully initialized ${allItems.length} items and ${categories.length} categories in server memory.`);
    } catch (err) {
        console.error('❌ [KBLI 2025] Failed to load dataset:', err.message);
    }
}

// Auto-load on route registration
loadKbliData();

/**
 * Multi-Signal SE2026 Nama Usaha -> KBLI Recommender & Candidate Scorer
 * Evaluates contiguous phrases, 2-word skip-grams, Head-Word DM rules, and token stems.
 */
function analyzeNamaUsahaQuery(rawName) {
    if (!rawName || typeof rawName !== 'string') return null;

    const clean = rawName
        .replace(/\(.*?\)|<.*?>|\[.*?\]/g, ' ')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (clean.length < 2) return null;

    const rawWords = clean.split(' ').filter(w => w.length >= 2);
    let meaningful = rawWords.filter(
        w => !OWNER_HONORIFICS.has(w) && !GEO_AND_STOPWORDS.has(w) && !/^\d+$/.test(w)
    );
    if (meaningful.length === 0) {
        meaningful = rawWords.filter(w => !/^\d+$/.test(w));
    }
    if (meaningful.length === 0) return null;

    let actWords = meaningful.filter(w => !CORP_PREFIXES.has(w));
    if (actWords.length === 0) {
        actWords = meaningful;
    }

    const condensed = meaningful.join(' ');
    const firstWord = actWords[0];
    const wordSet = new Set(meaningful);

    const hasNonAgriHead =
        NON_AGRI_HEAD_WORDS.has(firstWord) || hasAny(wordSet, NON_AGRI_STRONG_SIGNALS);
    const hasExplicitAgri =
        AGRI_EXPLICIT_HEADS.has(firstWord) || wordSet.has('utp');

    const catScores = {};
    const catBestKbli = {};
    const kbli5Scores = new Map(); // kbli5 -> { score, matchedKw, count, kat }

    const addVote = (kat, kbli5, kw, cnt, rawScore) => {
        let score = rawScore;
        if (kat === 'A' && hasNonAgriHead && !hasExplicitAgri) {
            score *= 0.12;
        }
        catScores[kat] = (catScores[kat] || 0) + score;
        if (!catBestKbli[kat] || score > catBestKbli[kat].score) {
            catBestKbli[kat] = { score, kbli5, matchedKw: kw, count: cnt };
        }
        if (kbli5) {
            const prev = kbli5Scores.get(kbli5);
            if (!prev) {
                kbli5Scores.set(kbli5, { score, matchedKw: kw, count: cnt, kat });
            } else {
                prev.score += score;
                if (score > prev.topSingleScore || !prev.topSingleScore) {
                    prev.matchedKw = kw;
                    prev.topSingleScore = score;
                }
            }
        }
    };

    const paddedClean = ` ${clean} `;
    const paddedCondensed = ` ${condensed} `;

    // 1. Contiguous & Skip-Gram Phrase Evaluation from SE2026 Nama Usaha
    for (let i = 0; i < namaUsahaPhrases.length; i++) {
        const [phr, kat, kbli5, cnt, prec] = namaUsahaPhrases[i];
        const pWords = phr.split(' ');
        const wCnt = pWords.length;

        const isContiguous =
            clean === phr ||
            condensed === phr ||
            paddedClean.includes(` ${phr} `) ||
            paddedCondensed.includes(` ${phr} `);

        if (isContiguous) {
            let base = wCnt * 135.0 * prec + Math.log10(cnt + 1) * 45.0;
            if (condensed.startsWith(phr) || clean.startsWith(phr)) {
                base += 160.0;
            }
            addVote(kat, kbli5, phr, cnt, base);
        } else if (wCnt === 2 && wordSet.has(pWords[0]) && wordSet.has(pWords[1])) {
            const idx0 = meaningful.indexOf(pWords[0]);
            const idx1 = meaningful.indexOf(pWords[1]);
            if (idx0 >= 0 && idx0 < idx1) {
                let skipScore = 175.0 * prec + Math.log10(cnt + 1) * 35.0;
                if (idx0 === 0 || pWords[0] === firstWord) {
                    skipScore += 110.0;
                }
                addVote(kat, kbli5, phr, cnt, skipScore);
            }
        }
    }

    // 2. Head-Word DM (Diterangkan-Menerangkan) Disambiguation Rules
    if (
        [
            'toko', 'kios', 'grosir', 'minimarket', 'supermarket', 'swalayan', 'distro',
            'butik', 'konter', 'counter', 'pangkalan', 'spbu', 'pertamini', 'pengepul',
            'tengkulak', 'pedagang', 'dagang', 'apotek', 'apotik'
        ].includes(firstWord)
    ) {
        if (hasAny(wordSet, ['roti', 'kue', 'bakery'])) {
            addVote('C', '10710', `${firstWord} roti/kue`, 50, 320.0);
        } else {
            let defaultK5 = '47112';
            if (hasAny(wordSet, ['bangunan', 'material', 'matrial', 'cat'])) defaultK5 = '47521';
            else if (hasAny(wordSet, ['pertanian', 'tani', 'pupuk', 'pakan', 'bibit'])) defaultK5 = '47763';
            else if (hasAny(wordSet, ['pakaian', 'baju', 'busana', 'distro', 'butik', 'jilbab'])) defaultK5 = '47711';
            else if (hasAny(wordSet, ['sepatu', 'sandal', 'sendal'])) defaultK5 = '47712';
            else if (hasAny(wordSet, ['emas', 'perhiasan'])) defaultK5 = '47735';
            else if (hasAny(wordSet, ['obat', 'apotek', 'apotik'])) defaultK5 = '47721';
            else if (hasAny(wordSet, ['kosmetik', 'skincare', 'parfum'])) defaultK5 = '47724';
            else if (hasAny(wordSet, ['elektronik', 'listrik', 'lampu'])) defaultK5 = '47592';
            else if (hasAny(wordSet, ['perabot', 'perabotan', 'plastik'])) defaultK5 = '47599';
            else if (hasAny(wordSet, ['pulsa', 'kuota', 'konter', 'counter', 'hp', 'ponsel'])) defaultK5 = '47404';
            else if (hasAny(wordSet, ['gas', 'lpg', 'elpiji', 'pangkalan'])) defaultK5 = '47772';
            else if (hasAny(wordSet, ['bensin', 'pertalite', 'pertamini', 'spbu', 'bbm'])) defaultK5 = '47302';
            else if (hasAny(wordSet, ['sayur', 'sayuran'])) defaultK5 = '47213';
            else if (wordSet.has('ikan')) defaultK5 = '47215';
            else if (hasAny(wordSet, ['buah', 'buahan'])) defaultK5 = '47212';
            else if (hasAny(wordSet, ['sawit', 'karet', 'kelapa', 'pinang', 'pengepul'])) defaultK5 = '46202';
            else if (hasAny(wordSet, ['motor', 'sparepart', 'onderdil'])) defaultK5 = '47833';
            addVote('G', defaultK5, firstWord, 500, 420.0);
        }
    } else if (['jual', 'jualan', 'penjual'].includes(firstWord)) {
        if (
            hasAny(wordSet, [
                'pentol', 'bakso', 'mie', 'mi', 'nasi', 'soto', 'sate', 'gorengan',
                'sarapan', 'minuman', 'kopi', 'teh', 'boba', 'jus', 'cendol', 'rujak',
                'gado', 'seblak', 'geprek', 'bubur', 'lontong', 'jajanan', 'jajan', 'kantin'
            ])
        ) {
            const k5 =
                wordSet.has('keliling') || wordSet.has('pentol')
                    ? '56102'
                    : hasAny(wordSet, ['minuman', 'kopi', 'teh', 'boba', 'jus', 'cendol'])
                    ? '56304'
                    : '56101';
            addVote('I', k5, `${firstWord} kuliner`, 150, 400.0);
        } else if (wordSet.has('es') && (wordSet.has('batu') || wordSet.has('balok'))) {
            addVote('D', '35302', 'jual es batu', 35, 450.0);
        } else if (wordSet.has('kue') && (wordSet.has('basah') || wordSet.has('tradisional'))) {
            addVote('C', '10792', 'jual kue basah', 30, 380.0);
        } else {
            let k5 = '47213';
            if (wordSet.has('ikan')) k5 = wordSet.has('asin') ? '47246' : '47215';
            else if (wordSet.has('ayam')) k5 = '47214';
            else if (wordSet.has('buah')) k5 = '47212';
            else if (wordSet.has('sembako')) k5 = '47112';
            else if (hasAny(wordSet, ['bensin', 'pertalite'])) k5 = '47302';
            else if (hasAny(wordSet, ['gas', 'lpg', 'tabung'])) k5 = '47772';
            else if (hasAny(wordSet, ['sawit', 'karet', 'kelapa', 'pinang', 'beli'])) k5 = '46202';
            addVote('G', k5, firstWord, 300, 420.0);
        }
    } else if (
        [
            'warung', 'warkop', 'kedai', 'kafe', 'cafe', 'coffee', 'coffe',
            'resto', 'restoran', 'rm', 'kantin', 'angkringan', 'lesehan', 'catering', 'katering'
        ].includes(firstWord) ||
        condensed.startsWith('rumah makan')
    ) {
        if (
            firstWord === 'warung' &&
            hasAny(wordSet, ['sembako', 'kelontong', 'harian', 'bensin', 'pertalite', 'gas', 'eceran'])
        ) {
            const k5 = hasAny(wordSet, ['bensin', 'pertalite']) ? '47302' : '47112';
            addVote('G', k5, 'warung sembako', 800, 420.0);
        } else if (firstWord === 'warung' && actWords.length === 1) {
            addVote('G', '47112', 'warung', 1200, 260.0);
        } else {
            let k5 = '56101';
            if (
                ['warkop', 'kafe', 'cafe', 'coffee', 'coffe'].includes(firstWord) ||
                (hasAny(wordSet, ['kopi', 'minuman', 'es', 'jus', 'boba', 'teh']) &&
                    !wordSet.has('makan') &&
                    !wordSet.has('nasi'))
            ) {
                k5 = ['kafe', 'cafe', 'coffee', 'coffe'].includes(firstWord) ? '56303' : '56304';
            } else if (firstWord === 'angkringan') {
                k5 = '56102';
            } else if (['catering', 'katering'].includes(firstWord)) {
                k5 = '56210';
            }
            addVote('I', k5, firstWord, 400, 420.0);
        }
    } else if (['bengkel', 'servis', 'service', 'reparasi'].includes(firstWord)) {
        if (
            hasAny(wordSet, [
                'las', 'bubut', 'teralis', 'tralis', 'kanopi', 'kanopy', 'besi', 'baja', 'karoseri', 'logam'
            ])
        ) {
            addVote('C', '25920', `${firstWord} las`, 85, 450.0);
        } else if (
            hasAny(wordSet, [
                'elektronik', 'tv', 'televisi', 'kulkas', 'ac', 'kipas', 'kompor',
                'mesin', 'hp', 'handphone', 'ponsel', 'laptop', 'komputer', 'jam', 'sepatu'
            ])
        ) {
            const k5 = hasAny(wordSet, ['hp', 'handphone', 'ponsel'])
                ? '95120'
                : hasAny(wordSet, ['laptop', 'komputer'])
                ? '95110'
                : '95210';
            addVote('S', k5, `${firstWord} elektronik`, 60, 450.0);
        } else {
            const k5 = wordSet.has('mobil') ? '95311' : '95320';
            addVote('G', k5, firstWord, 450, 420.0);
        }
    } else if (
        [
            'pabrik', 'industri', 'penggilingan', 'gilingan', 'pembuatan', 'membuat',
            'produksi', 'pengolahan', 'pengeringan', 'penggaraman', 'percetakan',
            'konveksi', 'penjahit', 'tailor', 'taylor', 'mebel', 'meubel', 'furnitur',
            'somel', 'sawmill', 'depot', 'cetak'
        ].includes(firstWord)
    ) {
        if (wordSet.has('es') && (wordSet.has('batu') || wordSet.has('balok'))) {
            addVote('D', '35302', `${firstWord} es batu`, 50, 460.0);
        } else {
            let k5 = '10792';
            if (wordSet.has('padi') || wordSet.has('beras') || ['penggilingan', 'gilingan'].includes(firstWord)) k5 = '10631';
            else if (hasAny(wordSet, ['tahu', 'tempe', 'kedelai'])) k5 = '10307';
            else if (wordSet.has('ikan') && wordSet.has('asin')) k5 = '10211';
            else if (hasAny(wordSet, ['kerupuk', 'keripik', 'peyek'])) k5 = '10794';
            else if (hasAny(wordSet, ['roti', 'bakery', 'kering'])) k5 = '10710';
            else if (wordSet.has('gula')) k5 = '10722';
            else if (wordSet.has('air') || wordSet.has('galon') || firstWord === 'depot') k5 = '11052';
            else if (['konveksi', 'penjahit', 'tailor', 'taylor'].includes(firstWord) || hasAny(wordSet, ['jahit', 'pakaian', 'baju'])) k5 = '14120';
            else if (['mebel', 'meubel', 'furnitur'].includes(firstWord) || hasAny(wordSet, ['kursi', 'lemari', 'kusen'])) k5 = '31011';
            else if (['somel', 'sawmill'].includes(firstWord) || wordSet.has('kayu')) k5 = '16221';
            else if (['percetakan', 'cetak'].includes(firstWord) || hasAny(wordSet, ['sablon', 'fotocopy', 'fotokopi'])) {
                k5 = hasAny(wordSet, ['batako', 'bata', 'paving', 'gorong']) ? '23951' : '18111';
            } else if (hasAny(wordSet, ['batako', 'bata', 'paving', 'tempayan', 'gorong'])) {
                k5 = '23951';
            }
            addVote('C', k5, firstWord, 300, 440.0);
        }
    } else if (
        [
            'angkutan', 'angkut', 'transportasi', 'truk', 'truck', 'dump', 'dam',
            'pickup', 'ekspedisi', 'kurir', 'kargo', 'ojek', 'ojol', 'taksi', 'taxi', 'travel'
        ].includes(firstWord) ||
        wordSet.has('angkutan')
    ) {
        const k5 = ['ojek', 'ojol'].includes(firstWord)
            ? '49296'
            : ['ekspedisi', 'kurir'].includes(firstWord)
            ? '53200'
            : ['taksi', 'taxi', 'travel'].includes(firstWord)
            ? '49293'
            : '49231';
        addVote('H', k5, 'angkutan', 250, 460.0);
    } else if (
        [
            'sewa', 'penyewaan', 'persewaan', 'rental', 'kontrakan',
            'kost', 'kos', 'kosan', 'kostan', 'indekos'
        ].includes(firstWord)
    ) {
        if (
            ['kontrakan', 'kost', 'kos', 'kosan', 'kostan', 'indekos'].includes(firstWord) ||
            hasAny(wordSet, [
                'kontrakan', 'kost', 'kos', 'kosan', 'kostan', 'indekos',
                'rumah', 'ruko', 'gedung', 'kamar', 'lahan', 'tanah', 'properti'
            ])
        ) {
            const k5 = hasAny(wordSet, ['lahan', 'tanah', 'ruko', 'gedung']) ? '68129' : '68112';
            addVote('L', k5, firstWord, 180, 460.0);
        } else if (hasAny(wordSet, ['ps', 'playstation'])) {
            addVote('R', '93299', 'rental ps', 20, 450.0);
        } else {
            const k5 = hasAny(wordSet, ['mobil', 'motor'])
                ? '77100'
                : hasAny(wordSet, ['sampan', 'perahu'])
                ? '77312'
                : '77291';
            addVote('N', k5, firstWord, 80, 440.0);
        }
    } else if (
        hasAny(wordSet, ['konstruksi', 'kontruksi', 'kontraktor', 'pemborong', 'instalasi', 'gypsum', 'plafon']) ||
        (wordSet.has('tukang') && wordSet.has('bangunan')) ||
        (wordSet.has('sumur') && wordSet.has('bor'))
    ) {
        const k5 =
            wordSet.has('instalasi') || wordSet.has('listrik')
                ? '43211'
                : wordSet.has('gypsum') || wordSet.has('plafon')
                ? '43302'
                : wordSet.has('bor')
                ? '43120'
                : '41011';
        addVote('F', k5, 'konstruksi/instalasi', 60, 450.0);
    } else if (
        hasAny(wordSet, ['pdam', 'rongsokan', 'pemulung', 'limbah', 'sampah']) ||
        (wordSet.has('barang') && wordSet.has('bekas')) ||
        (wordSet.has('sedot') && wordSet.has('wc'))
    ) {
        const k5 = wordSet.has('pdam') ? '36001' : wordSet.has('wc') ? '37000' : '38110';
        addVote('E', k5, 'pengelolaan air/sampah', 35, 450.0);
    } else if (
        hasAny(wordSet, ['koperasi', 'ksp', 'bmt', 'brilink', 'pegadaian', 'asuransi', 'bank']) ||
        (wordSet.has('simpan') && wordSet.has('pinjam')) ||
        (wordSet.has('credit') && wordSet.has('union')) ||
        (wordSet.has('transfer') && wordSet.has('dana'))
    ) {
        const k5 =
            wordSet.has('brilink') || wordSet.has('transfer')
                ? '66141'
                : wordSet.has('bmt')
                ? '64192'
                : wordSet.has('asuransi')
                ? '65110'
                : '64191';
        addVote('K', k5, 'jasa keuangan', 65, 450.0);
    } else if (
        hasAny(wordSet, [
            'futsal', 'gym', 'fitness', 'biliar', 'billiard', 'karaoke',
            'sanggar', 'pemancingan', 'playstation', 'youtuber'
        ]) ||
        (wordSet.has('kolam') && wordSet.has('renang')) ||
        (wordSet.has('tempat') && wordSet.has('wisata'))
    ) {
        const k5 = wordSet.has('futsal')
            ? '93112'
            : wordSet.has('gym') || wordSet.has('fitness')
            ? '93120'
            : wordSet.has('sanggar')
            ? '90002'
            : '93299';
        addVote('R', k5, 'olahraga/rekreasi/seni', 35, 450.0);
    } else if (
        hasAny(wordSet, ['notaris', 'ppat', 'pengacara', 'advokat', 'arsitek', 'fotografer']) ||
        (wordSet.has('studio') && wordSet.has('foto')) ||
        (wordSet.has('dokter') && wordSet.has('hewan'))
    ) {
        const k5 =
            wordSet.has('notaris') || wordSet.has('ppat')
                ? '69104'
                : wordSet.has('foto') || wordSet.has('fotografer')
                ? '74209'
                : '69101';
        addVote('M', k5, 'jasa profesional', 35, 450.0);
    } else if (
        hasAny(wordSet, ['bidan', 'puskesmas', 'posyandu', 'polindes', 'klinik']) ||
        (wordSet.has('praktek') && wordSet.has('dokter')) ||
        (wordSet.has('praktik') && wordSet.has('dokter')) ||
        (wordSet.has('rumah') && wordSet.has('sakit')) ||
        (wordSet.has('pengobatan') && wordSet.has('tradisional')) ||
        (wordSet.has('jasa') && wordSet.has('urut')) ||
        (wordSet.has('tukang') && (wordSet.has('urut') || wordSet.has('pijat')))
    ) {
        const k5 = wordSet.has('bidan')
            ? '86991'
            : hasAny(wordSet, ['urut', 'pijat', 'tradisional'])
            ? '86992'
            : wordSet.has('dokter')
            ? '86201'
            : '86105';
        addVote('Q', k5, 'kesehatan', 50, 450.0);
    } else if (
        [
            'sd', 'sdn', 'sds', 'smp', 'smpn', 'sma', 'sman', 'smk', 'smkn',
            'mi', 'mis', 'min', 'mts', 'mtsn', 'ma', 'man', 'tk', 'tkn',
            'paud', 'kb', 'ra', 'tpq', 'tpa', 'mda', 'pondok', 'pesantren',
            'sekolah', 'madrasah', 'bimbel', 'kursus', 'les'
        ].includes(firstWord)
    ) {
        const k5 = ['sd', 'sdn', 'sds', 'sekolah'].includes(firstWord)
            ? '85201'
            : ['pondok', 'pesantren'].includes(firstWord)
            ? '85541'
            : ['bimbel', 'kursus', 'les'].includes(firstWord)
            ? '85595'
            : '85311';
        addVote('P', k5, firstWord, 65, 450.0);
    } else if (
        hasAny(wordSet, ['pangkas', 'salon', 'laundry', 'londri', 'barbershop', 'permak', 'vermak']) ||
        (wordSet.has('potong') && wordSet.has('rambut')) ||
        (wordSet.has('cukur') && wordSet.has('rambut')) ||
        (wordSet.has('rias') && wordSet.has('pengantin'))
    ) {
        const k5 =
            wordSet.has('laundry') || wordSet.has('londri')
                ? '96100'
                : wordSet.has('permak') || wordSet.has('vermak')
                ? '95291'
                : '96210';
        addVote('S', k5, 'jasa perorangan', 95, 450.0);
    } else if (
        (wordSet.has('asisten') && wordSet.has('rumah')) ||
        (wordSet.has('pembantu') && wordSet.has('rumah')) ||
        wordSet.has('babysitter') ||
        (wordSet.has('pengasuh') && wordSet.has('anak'))
    ) {
        addVote('T', '97000', 'jasa perorangan rumah tangga', 35, 460.0);
    } else if (
        [
            'utp', 'kebun', 'perkebunan', 'pertanian', 'petani', 'sawah', 'ladang',
            'hortikultura', 'holtikultura', 'peternakan', 'peternak', 'ternak',
            'kandang', 'perikanan', 'nelayan', 'tambak', 'kolam', 'budidaya',
            'pembibitan', 'pembenihan', 'penggemukan'
        ].includes(firstWord)
    ) {
        let k5 = '01122';
        if (wordSet.has('sawit')) k5 = '01262';
        else if (wordSet.has('kelapa')) k5 = '01261';
        else if (wordSet.has('karet')) k5 = '01291';
        else if (wordSet.has('pinang')) k5 = '01289';
        else if (wordSet.has('jagung')) k5 = '01111';
        else if (hasAny(wordSet, ['ubi', 'keladi'])) k5 = '01135';
        else if (hasAny(wordSet, ['cabai', 'cabe', 'rawit'])) k5 = '01138';
        else if (hasAny(wordSet, ['kangkung', 'bayam', 'sayur'])) k5 = '01131';
        else if (wordSet.has('semangka')) k5 = '01132';
        else if (hasAny(wordSet, ['hortikultura', 'holtikultura', 'pisang', 'nanas', 'nenas', 'durian', 'rambutan', 'langsat'])) k5 = '01220';
        else if (wordSet.has('sapi')) k5 = '01411';
        else if (wordSet.has('kambing')) k5 = '01442';
        else if (wordSet.has('babi')) k5 = '01450';
        else if (wordSet.has('ayam')) {
            k5 = hasAny(wordSet, ['broiler', 'boiler', 'pedaging', 'potong'])
                ? '01461'
                : wordSet.has('petelur')
                ? '01462'
                : '01464';
        } else if (hasAny(wordSet, ['bebek', 'itik'])) k5 = '01465';
        else if (hasAny(wordSet, ['walet', 'burung'])) k5 = '01497';
        else if (hasAny(wordSet, ['ikan', 'perikanan', 'nelayan', 'tambak', 'kolam', 'lele', 'nila'])) {
            k5 = hasAny(wordSet, ['tawar', 'kolam', 'lele', 'nila', 'patin', 'bawal', 'pembenihan', 'budidaya'])
                ? '03221'
                : wordSet.has('tambak')
                ? '03211'
                : '03110';
        } else if (['kebun', 'perkebunan'].includes(firstWord)) k5 = '01262';
        else if (['peternakan', 'peternak', 'ternak'].includes(firstWord)) k5 = '01411';
        addVote('A', k5, firstWord, 1500, 420.0);
    }

    // 3. Token & Prefix Stem Evaluation
    for (let idx = 0; idx < meaningful.length; idx++) {
        const w = meaningful[idx];
        let matchedTok = namaUsahaTokenMap.get(w);
        if (!matchedTok && w.length >= 4) {
            for (let j = 0; j < namaUsahaTokens.length; j++) {
                const tkEntry = namaUsahaTokens[j];
                const tkStr = tkEntry[0];
                if (tkStr.length >= 4 && (w.startsWith(tkStr) || tkStr.startsWith(w))) {
                    matchedTok = tkEntry;
                    break;
                }
            }
        }
        if (matchedTok) {
            const [tkStr, kat, kbli5, cnt, prec] = matchedTok;
            let tokScore = 70.0 * prec + Math.log10(cnt + 1) * 22.0;
            if (idx === 0 || w === firstWord) {
                tokScore += 45.0;
            }
            addVote(kat, kbli5, tkStr, cnt, tokScore);
        }
    }

    const katKeys = Object.keys(catScores);
    if (katKeys.length === 0) {
        return {
            meaningfulTokens: meaningful,
            hasNonAgriHead,
            hasExplicitAgri,
            bestRec: null,
            kbli5Scores
        };
    }

    let bestKat = katKeys[0];
    let totalScore = 0;
    for (let i = 0; i < katKeys.length; i++) {
        const k = katKeys[i];
        totalScore += catScores[k];
        if (catScores[k] > catScores[bestKat]) {
            bestKat = k;
        }
    }

    const bestDetail = catBestKbli[bestKat];
    const kbli5Code = bestDetail?.kbli5 || null;
    const kbliItem = kbli5Code ? itemMap.get(kbli5Code) : null;
    const kbli5Title = kbliItem?.judul || (kbli5Code ? kbli5TitlesMap[kbli5Code] : '') || '';
    const actualKategoriKode = kbliItem?.kategori_kode || bestKat;
    const confidencePct = totalScore > 0 ? Math.min(99, Math.round((catScores[bestKat] / totalScore) * 100)) : 85;

    return {
        meaningfulTokens: meaningful,
        hasNonAgriHead,
        hasExplicitAgri,
        bestRec: {
            kategori: actualKategoriKode,
            ntbKategori: bestKat,
            kbli: kbli5Code,
            judul: kbli5Title,
            matchedKeyword: bestDetail?.matchedKw || firstWord,
            count: bestDetail?.count || 1,
            confidence: confidencePct
        },
        kbli5Scores
    };
}

// Compatibility middleware for both Express and Vite/Connect dev server middleware
router.use((req, res, next) => {
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
 * Smart search with SE2026 Nama Usaha Multi-Signal Recommender + Category & Hierarchy filters
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

    if (kategori && kategori !== 'ALL') {
        pool = pool.filter(item => item.kategori_kode === kategori);
    }

    if (level && level !== 'all') {
        pool = pool.filter(item => item.level === level);
    }

    const levelPriority = {
        kelompok: 1,       // 5 digit (Kelompok) - highest operational priority
        subgolongan: 2,    // 4 digit
        golongan: 3,       // 3 digit
        golongan_pokok: 4, // 2 digit
        kategori: 5        // 1 digit / alphabet
    };

    let filtered = pool;
    let namaAnalysis = null;
    let learnedMatch = null;

    if (q) {
        const queryLower = q.toLowerCase();

        // 0. Cek apakah query cocok dengan model pembelajaran hasil 500+ konfirmasi lapangan
        if (kbliLearnedRules.length > 0) {
            for (const rule of kbliLearnedRules) {
                if (rule.pattern === queryLower || queryLower.includes(rule.pattern) || rule.pattern.includes(queryLower)) {
                    learnedMatch = rule;
                    break;
                }
            }
        }

        // Run SE2026 Nama Usaha Multi-Signal Recommender on query
        namaAnalysis = analyzeNamaUsahaQuery(q);

        // Use cleaned meaningful tokens (stripped of Pak/Bu/Hj, CV/PT/UD, Mempawah village names) so personal/owner names don't dilute token matching!
        const rawTokens = queryLower.split(/\s+/).filter(t => t.length > 1 || /^[a-v0-9]$/i.test(t));
        const queryTokens = (namaAnalysis && namaAnalysis.meaningfulTokens && namaAnalysis.meaningfulTokens.length > 0)
            ? namaAnalysis.meaningfulTokens
            : rawTokens;

        const bestRec = namaAnalysis?.bestRec || null;
        const kbli5Scores = namaAnalysis?.kbli5Scores || new Map();
        const hasNonAgriHead = Boolean(namaAnalysis?.hasNonAgriHead);
        const hasExplicitAgri = Boolean(namaAnalysis?.hasExplicitAgri);

        const scored = [];
        const poolLen = pool.length;

        for (let i = 0; i < poolLen; i++) {
            const item = pool[i];
            let score = 0;
            let matchedTokensCount = 0;

            // 0. Super Boost dari Field Learned Model (Hasil 500+ Konfirmasi Lapangan Terverifikasi)
            if (learnedMatch && learnedMatch.kbli && item.kode === learnedMatch.kbli) {
                score += 55000;
                matchedTokensCount = queryTokens.length;
            } else if (bestRec && bestRec.kbli && item.kode === bestRec.kbli) {
                score += 38000;
                matchedTokensCount = queryTokens.length;
            } else if (kbli5Scores.has(item.kode)) {
                const k5Entry = kbli5Scores.get(item.kode);
                score += Math.min(22000, Math.round(k5Entry.score * 28));
                matchedTokensCount = Math.max(matchedTokensCount, Math.min(queryTokens.length, 2));
            }

            // 1. Exact match on Code (Highest instant pinpoint)
            if (item._kodeLower === queryLower) {
                score += 45000;
            } else if (item._kodeLower.startsWith(queryLower)) {
                score += 5000;
            } else if (item._kodeLower.includes(queryLower)) {
                score += 1500;
            }

            // 2. Title match
            if (item._judulLower === queryLower) {
                score += 15000;
            } else if (item._judulLower.includes(queryLower)) {
                score += 6500;
            }

            if (item._judulLower.includes('selain ' + queryLower)) {
                score -= 3500;
            }

            // 3. Exact Phrase in Inclusion (Commodity concept)
            if (item._inclusionLower.includes(queryLower)) {
                score += 4000;
            } else if (item._exclusionLower.includes(queryLower)) {
                score += 150;
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
                        score += 20;
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

            score += titleHits * 750;
            score += inclusionHits * 260;
            score += exclusionHits * 25;

            // 5. Match in SE2026 Empirical Training Data weighted by empirical log-frequency!
            if (item._empiricalLower) {
                const freqMultiplier = Math.max(0.4, Math.log10((item._empCount || 1) + 1));
                if (item._empiricalLower.includes(queryLower)) {
                    score += Math.round(4500 * freqMultiplier);
                    matchedTokensCount = Math.max(matchedTokensCount, queryTokens.length);
                } else {
                    for (let j = 0; j < queryTokens.length; j++) {
                        if (item._empiricalLower.includes(queryTokens[j])) {
                            score += Math.round(750 * freqMultiplier);
                            matchedTokensCount++;
                        }
                    }
                }
            }

            // Bonus if ALL meaningful query tokens match
            if (queryTokens.length > 1 && matchedTokensCount >= queryTokens.length) {
                score += 3200;
            }

            // Head-Word Disambiguation: If query starts with a non-agricultural head word (Toko, Angkutan, Penggilingan, Jual, Sewa),
            // penalize raw Kategori A items so commodity tokens (sawit, padi, ikan) don't hijack non-agricultural business searches!
            if (hasNonAgriHead && !hasExplicitAgri && item.kategori_kode === 'A') {
                score = Math.round(score * 0.18);
            } else if (bestRec && item.kategori_kode === bestRec.kategori && score > 0) {
                score += 1800;
            }

            if (score > 0) {
                scored.push({ item, score, matchedTokensCount });
            }
        }

        scored.sort((a, b) => {
            const aExactCode = a.item._kodeLower === queryLower;
            const bExactCode = b.item._kodeLower === queryLower;
            if (aExactCode && !bExactCode) return -1;
            if (!aExactCode && bExactCode) return 1;

            // Jika cocok dengan model pembelajaran lapangan (500+ konfirmasi), prioritaskan di posisi paling atas (#1)!
            if (learnedMatch && learnedMatch.kbli) {
                const aIsLearned = a.item.kode === learnedMatch.kbli;
                const bIsLearned = b.item.kode === learnedMatch.kbli;
                if (aIsLearned && !bIsLearned) return -1;
                if (!aIsLearned && bIsLearned) return 1;
            }

            // If one item is the #1 SE2026 Nama Usaha recommended 5-digit KBLI, put it at #1!
            if (bestRec && bestRec.kbli) {
                const aIsBestRec = a.item.kode === bestRec.kbli;
                const bIsBestRec = b.item.kode === bestRec.kbli;
                if (aIsBestRec && !bIsBestRec) return -1;
                if (!aIsBestRec && bIsBestRec) return 1;
            }

            // Prioritize 5-digit (kelompok) first!
            const rankA = levelPriority[a.item.level] || 99;
            const rankB = levelPriority[b.item.level] || 99;
            if (rankA !== rankB) {
                return rankA - rankB;
            }

            return b.score - a.score;
        });

        filtered = scored.map(s => s.item);
    } else {
        if (sort === 'title') {
            filtered = [...pool].sort((a, b) => a.judul.localeCompare(b.judul));
        } else {
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

    let activeRecommendedKbli = namaAnalysis?.bestRec || null;
    if (learnedMatch) {
        const targetItem = itemMap.get(learnedMatch.kbli);
        activeRecommendedKbli = {
            kategori: targetItem?.kategori || '',
            ntbKategori: targetItem?.kategori || '',
            kbli: learnedMatch.kbli,
            judul: learnedMatch.judul || targetItem?.judul || '',
            judulUsaha: learnedMatch.judul || targetItem?.judul || '',
            top_kategori: 'Empiris Terverifikasi Lapangan (500+ Konfirmasi)',
            confidence: learnedMatch.confidence,
            reason: `Diverifikasi dari ${learnedMatch.sample_count} konfirmasi petugas lapangan`,
            source: 'Hasil Pembelajaran Lapangan (500+ Konfirmasi)'
        };
    }

    res.json({
        total,
        total_kelompok: totalKelompok,
        execution_time_ms: Number(timeMs.toFixed(2)),
        page,
        limit,
        totalPages,
        recommended_kbli: activeRecommendedKbli,
        items: resultItems
    });
});

/**
 * GET /api/kbli/recommend
 * Recommend KBLI category & 5-digit code based on SE2026 Nama Usaha Multi-Signal Model
 */
router.get('/recommend', (req, res) => {
    loadKbliData();
    const rawName = (req.query.name || req.query.q || '').trim();
    if (!rawName || rawName.length < 2) {
        return res.json({ suggestion: null });
    }

    const analysis = analyzeNamaUsahaQuery(rawName);
    if (analysis && analysis.bestRec && analysis.bestRec.kbli) {
        return res.json({
            suggestion: {
                kategori: analysis.bestRec.kategori,
                ntbKategori: analysis.bestRec.ntbKategori,
                kbli: analysis.bestRec.kbli,
                judul: analysis.bestRec.judul,
                matchedKeyword: analysis.bestRec.matchedKeyword,
                count: analysis.bestRec.count,
                confidence: analysis.bestRec.confidence
            }
        });
    }

    res.json({ suggestion: null });
});

/**
 * GET /api/kbli/detail/:kode
 */
router.get('/detail/:kode', (req, res) => {
    loadKbliData();
    const kode = String(req.params?.kode || '').trim();
    const item = itemMap.get(kode);

    if (!item) {
        return res.status(404).json({ message: `Kode KBLI '${kode}' tidak ditemukan.` });
    }

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

function computeConfidence(isCopied, isLast, dwellSeconds) {
    if (isCopied) return 'VERY_HIGH'; // Opsi 1: User menyalin kode, konfirmasi 99%
    if (isLast && dwellSeconds >= 15) return 'HIGH'; // Opsi 2 & 3: Card terakhir dan dibaca mendalam
    if (isLast && dwellSeconds >= 5) return 'MEDIUM_HIGH';
    if (dwellSeconds >= 15) return 'MEDIUM';
    if (isLast) return 'MEDIUM_LOW';
    return 'LOW'; // Browsing/inspeksi sekilas (< 5 detik)
}

/**
 * POST /api/kbli/log-selection
 * Telemetry logging with Options 1 (Copy Code), 2 (Last-in-Session), and 3 (Dwell Time)
 */
router.post('/log-selection', (req, res) => {
    try {
        const {
            session_id,
            keyword,
            selected_code,
            selected_title,
            selected_level,
            action, // 'view' | 'copy_code'
            is_copied,
            dwell_time_seconds,
            is_last_in_session,
            timestamp
        } = req.body || {};

        const cleanKeyword = String(keyword || '').trim();
        const cleanCode = String(selected_code || '').trim();
        const cleanSessionId = String(session_id || '').trim();

        if (!cleanKeyword || !cleanCode) {
            return res.status(400).json({ error: 'Keyword and selected_code are required' });
        }

        const dataDir = path.join(__dirname, '../kbli_data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const logPath = path.join(dataDir, 'search_feedback_dataset.json');
        let logs = [];
        if (fs.existsSync(logPath)) {
            try {
                logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                if (!Array.isArray(logs)) logs = [];
            } catch (e) {
                logs = [];
            }
        }

        // Cari apakah sesi dan kode ini sudah pernah dicatat sebelumnya
        let existing = cleanSessionId ? logs.find(l => l.session_id === cleanSessionId && l.selected_code === cleanCode) : null;

        if (existing) {
            // Update rekaman yang sudah ada
            if (action === 'copy_code' || is_copied) {
                existing.action = 'copy_code';
                existing.is_copied = true;
            }
            if (dwell_time_seconds !== undefined && Number(dwell_time_seconds) > (existing.dwell_time_seconds || 0)) {
                existing.dwell_time_seconds = Number(dwell_time_seconds);
            }
            if (is_last_in_session !== undefined) {
                existing.is_last_in_session = Boolean(is_last_in_session);
            }
            existing.confidence_level = computeConfidence(existing.is_copied, existing.is_last_in_session, existing.dwell_time_seconds || 0);
            existing.updated_at = new Date().toISOString();
        } else {
            // Jika ada card baru dalam sesi yang sama, tandai card-card sebelumnya sebagai bukan kartu terakhir
            if (cleanSessionId) {
                logs.forEach(l => {
                    if (l.session_id === cleanSessionId) {
                        l.is_last_in_session = false;
                        l.confidence_level = computeConfidence(l.is_copied, false, l.dwell_time_seconds || 0);
                    }
                });
            }

            const copiedFlag = action === 'copy_code' || Boolean(is_copied);
            const dwellVal = Math.max(0, Number(dwell_time_seconds) || 0);
            const isLastVal = is_last_in_session !== undefined ? Boolean(is_last_in_session) : true;

            const newEntry = {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
                session_id: cleanSessionId || ('sess_' + Date.now().toString(36)),
                keyword: cleanKeyword,
                selected_code: cleanCode,
                selected_title: selected_title || '',
                selected_level: selected_level || '',
                action: copiedFlag ? 'copy_code' : (action || 'view'),
                is_copied: copiedFlag,
                dwell_time_seconds: dwellVal,
                is_last_in_session: isLastVal,
                confidence_level: computeConfidence(copiedFlag, isLastVal, dwellVal),
                timestamp: timestamp || new Date().toISOString(),
                source: 'user_telemetry'
            };

            logs.push(newEntry);
        }

        // Tulis kembali ke disk secara aman
        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');

        // Otomatis evaluasi & perbaiki model jika sudah mencapai ambang batas 500 data VERY_HIGH dan HIGH
        try {
            checkAndImproveKbliModel();
        } catch (_) {}

        return res.json({ 
            success: true, 
            message: 'Search feedback logged successfully',
            total_logged: logs.length 
        });
    } catch (err) {
        console.error('Error logging search selection:', err.message);
        return res.status(500).json({ error: 'Failed to persist search feedback' });
    }
});

/**
 * Evaluasi & perbaiki model klasifikasi KBLI otomatis saat mencapai ambang batas 500 data
 */
function checkAndImproveKbliModel(force = false) {
    try {
        const dataDir = path.join(__dirname, '../kbli_data');
        const logPath = path.join(dataDir, 'search_feedback_dataset.json');
        if (!fs.existsSync(logPath)) return { updated: false, reason: 'File feedback belum ada' };

        const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        if (!Array.isArray(logs)) return { updated: false, reason: 'Format logs tidak valid' };

        // Ambil data yang berstatus VERY_HIGH dan HIGH (atau is_copied)
        const eligibleLogs = logs.filter(l => l.confidence_level === 'VERY_HIGH' || l.confidence_level === 'HIGH' || l.is_copied);
        const totalEligible = eligibleLogs.length;

        const learnedPath = path.join(dataDir, 'kbli_learned_field_model.json');
        let prevModel = null;
        if (fs.existsSync(learnedPath)) {
            try {
                prevModel = JSON.parse(fs.readFileSync(learnedPath, 'utf8'));
            } catch (_) {}
        }

        const lastTrainedCount = prevModel?.total_eligible_samples || 0;

        // Cek apakah sudah memenuhi ambang batas 500 data
        if (!force && totalEligible < HIGH_CONFIDENCE_THRESHOLD) {
            return {
                updated: false,
                threshold: HIGH_CONFIDENCE_THRESHOLD,
                total_eligible: totalEligible,
                progress_percent: Number(((totalEligible / HIGH_CONFIDENCE_THRESHOLD) * 100).toFixed(1)),
                message: `Ambang batas belum tercapai (${totalEligible}/${HIGH_CONFIDENCE_THRESHOLD})`
            };
        }

        // Jika sudah pernah ditraining pada >= 500, tunggu setidaknya 25 data baru berikutnya sebelum batch retrain
        if (!force && prevModel && (totalEligible - lastTrainedCount < 25)) {
            return {
                updated: false,
                threshold: HIGH_CONFIDENCE_THRESHOLD,
                total_eligible: totalEligible,
                already_up_to_date: true,
                message: 'Model sudah up-to-date dengan data feedback saat ini'
            };
        }

        // --- PROSES PERBAIKAN MODEL DARI 500+ DATA KONSENSUS LAPANGAN ---
        const keywordGroups = new Map();
        for (const log of eligibleLogs) {
            const rawKw = String(log.keyword || '').toLowerCase().trim();
            const cleanKw = rawKw.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleanKw.length < 2) continue;

            if (!keywordGroups.has(cleanKw)) {
                keywordGroups.set(cleanKw, []);
            }
            keywordGroups.get(cleanKw).push(log);
        }

        const learnedRules = [];

        for (const [kw, items] of keywordGroups.entries()) {
            const codeCounts = new Map();
            const codeDetails = new Map();

            for (const item of items) {
                const code = item.selected_code;
                if (!code) continue;
                // Beri bobot 2x untuk konfirmasi 'copy_code' / VERY_HIGH
                const weight = (item.is_copied || item.confidence_level === 'VERY_HIGH') ? 2 : 1;
                codeCounts.set(code, (codeCounts.get(code) || 0) + weight);
                if (!codeDetails.has(code)) {
                    codeDetails.set(code, {
                        title: item.selected_title || '',
                        level: item.selected_level || ''
                    });
                }
            }

            let winnerCode = null;
            let maxWeight = 0;
            let totalWeight = 0;

            for (const [code, w] of codeCounts.entries()) {
                totalWeight += w;
                if (w > maxWeight) {
                    maxWeight = w;
                    winnerCode = code;
                }
            }

            const consensusRatio = totalWeight > 0 ? maxWeight / totalWeight : 0;
            // Syarat masuk model perbaikan:
            // 1. Minimal total bobot 2
            // 2. Konsensus mayoritas minimal 60%
            if (winnerCode && maxWeight >= 2 && consensusRatio >= 0.6) {
                const details = codeDetails.get(winnerCode) || {};
                learnedRules.push({
                    pattern: kw,
                    kbli: winnerCode,
                    judul: details.title,
                    level: details.level,
                    sample_count: items.length,
                    confidence: Number((consensusRatio * (items.length >= 3 ? 0.99 : 0.93)).toFixed(3)),
                    source: 'Hasil Pembelajaran 500+ Konfirmasi Lapangan'
                });
            }
        }

        learnedRules.sort((a, b) => b.pattern.length - a.pattern.length);

        const newModel = {
            version: '2.0.0-learned',
            trained_at: new Date().toISOString(),
            threshold: HIGH_CONFIDENCE_THRESHOLD,
            total_eligible_samples: totalEligible,
            total_rules: learnedRules.length,
            rules: learnedRules
        };

        fs.writeFileSync(learnedPath, JSON.stringify(newModel, null, 2), 'utf8');

        // Sinkronkan ke folder backend jika ada
        const backendPath = path.join(__dirname, '../../backend/kbli_data');
        if (fs.existsSync(backendPath)) {
            try {
                fs.writeFileSync(path.join(backendPath, 'kbli_learned_field_model.json'), JSON.stringify(newModel, null, 2), 'utf8');
            } catch (_) {}
        }

        kbliLearnedModel = newModel;
        kbliLearnedRules = learnedRules;

        console.log(`🚀 [KBLI 2025] Model Berhasil Diperbaiki! ${learnedRules.length} aturan baru diaktifkan dari ${totalEligible} data konfirmasi lapangan.`);

        return {
            updated: true,
            total_eligible: totalEligible,
            rules_generated: learnedRules.length,
            model_version: newModel.version,
            trained_at: newModel.trained_at
        };
    } catch (err) {
        console.error('Error improving KBLI model:', err.message);
        return { updated: false, error: err.message };
    }
}

/**
 * GET /api/kbli/model-status
 * Status ambang batas 500 data dan model perbaikan
 */
router.get('/model-status', (req, res) => {
    try {
        const logPath = path.join(__dirname, '../kbli_data/search_feedback_dataset.json');
        let logs = [];
        if (fs.existsSync(logPath)) {
            try {
                logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                if (!Array.isArray(logs)) logs = [];
            } catch (_) {}
        }

        const veryHigh = logs.filter(l => l.confidence_level === 'VERY_HIGH').length;
        const high = logs.filter(l => l.confidence_level === 'HIGH').length;
        const medium = logs.filter(l => l.confidence_level === 'MEDIUM' || l.confidence_level === 'MEDIUM_HIGH' || l.confidence_level === 'MEDIUM_LOW').length;
        const low = logs.filter(l => l.confidence_level === 'LOW').length;

        const totalEligible = veryHigh + high;
        const progressPercent = Math.min(100, Number(((totalEligible / HIGH_CONFIDENCE_THRESHOLD) * 100).toFixed(1)));

        res.json({
            threshold: HIGH_CONFIDENCE_THRESHOLD,
            total_eligible_samples: totalEligible,
            progress_percent: progressPercent,
            is_ready_or_active: totalEligible >= HIGH_CONFIDENCE_THRESHOLD || kbliLearnedRules.length > 0,
            active_learned_rules: kbliLearnedRules.length,
            model_version: kbliLearnedModel?.version || 'baseline-se2026',
            last_trained_at: kbliLearnedModel?.trained_at || null,
            breakdown: {
                very_high_copied: veryHigh,
                high_last_read: high,
                medium_dwell: medium,
                low_browsing: low,
                total_all_logs: logs.length
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/kbli/trigger-improvement
 * Pemicu manual / evaluasi model perbaikan
 */
router.post('/trigger-improvement', (req, res) => {
    const { force } = req.body || {};
    const result = checkAndImproveKbliModel(Boolean(force));
    res.json(result);
});

/**
 * GET /api/kbli/feedback-dataset
 * Mengambil dataset keyword dan hasil yang dipilih user
 */
router.get('/feedback-dataset', (req, res) => {
    try {
        const logPath = path.join(__dirname, '../kbli_data/search_feedback_dataset.json');
        if (fs.existsSync(logPath)) {
            const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
            return res.json({ total: logs.length, dataset: logs });
        }
        res.json({ total: 0, dataset: [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
