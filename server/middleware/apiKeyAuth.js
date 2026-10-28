const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./jwtSecret');

const API_KEYS_FILE = path.join(__dirname, '../data/api_keys.json');

// Helper pembuat API Key acak dengan entropi tinggi
function generateSecureRandomKey() {
    return `garda_live_${crypto.randomBytes(16).toString('hex')}`;
}

// Master API Key default yang aman (menggunakan env atau generate otomatis saat inisialisasi)
const DEFAULT_MASTER_KEY = process.env.MITRA_API_KEY || generateSecureRandomKey();

// Pastikan direktori server/data ada
function ensureDataDir() {
    const dir = path.dirname(API_KEYS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Muat semua API Key dari file
function loadApiKeys() {
    ensureDataDir();
    try {
        if (!fs.existsSync(API_KEYS_FILE)) {
            const initialData = {
                keys: [
                    {
                        id: 'key_master_se2026',
                        name: 'Master API Key Integrasi Eksternal (SE2026)',
                        key: DEFAULT_MASTER_KEY,
                        status: 'active',
                        permissions: ['mitra:read', 'mitra:write', 'mitra:stats'],
                        created_at: new Date().toISOString(),
                        last_used_at: null,
                        usage_count: 0
                    }
                ]
            };
            fs.writeFileSync(API_KEYS_FILE, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData.keys;
        }

        const raw = fs.readFileSync(API_KEYS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        let keys = Array.isArray(parsed?.keys) ? parsed.keys : [];

        // Pastikan default master key selalu ada jika list kosong
        if (keys.length === 0) {
            keys.push({
                id: 'key_master_se2026',
                name: 'Master API Key Integrasi Eksternal (SE2026)',
                key: DEFAULT_MASTER_KEY,
                status: 'active',
                permissions: ['mitra:read', 'mitra:write', 'mitra:stats'],
                created_at: new Date().toISOString(),
                last_used_at: null,
                usage_count: 0
            });
            saveApiKeys(keys);
        }

        return keys;
    } catch (err) {
        console.error('[API_KEY] Gagal memuat api_keys.json:', err.message);
        return [
            {
                id: 'key_fallback',
                name: 'Fallback Master Key',
                key: DEFAULT_MASTER_KEY,
                status: 'active',
                permissions: ['mitra:read', 'mitra:write', 'mitra:stats'],
                created_at: new Date().toISOString(),
                last_used_at: null,
                usage_count: 0
            }
        ];
    }
}

// Simpan API Key ke file
function saveApiKeys(keys) {
    ensureDataDir();
    try {
        fs.writeFileSync(API_KEYS_FILE, JSON.stringify({ keys }, null, 2), 'utf8');
    } catch (err) {
        console.error('[API_KEY] Gagal menyimpan api_keys.json:', err.message);
    }
}

// Verifikasi API Key
function findActiveApiKey(candidateKey) {
    if (!candidateKey || typeof candidateKey !== 'string') return null;
    const cleanCandidate = candidateKey.trim();
    if (!cleanCandidate) return null;

    const keys = loadApiKeys();
    const found = keys.find(k => k.status === 'active' && k.key === cleanCandidate);
    if (found) {
        // Catat penggunaan secara asynchronous
        found.last_used_at = new Date().toISOString();
        found.usage_count = (found.usage_count || 0) + 1;
        setTimeout(() => saveApiKeys(keys), 50);
        return found;
    }
    return null;
}

// Generate API Key baru
function generateNewApiKey(name = 'API Client Eksternal', permissions = ['mitra:read']) {
    const keys = loadApiKeys();
    const randomHex = crypto.randomBytes(16).toString('hex');
    const newKey = {
        id: `key_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        name: name.trim() || 'API Client Eksternal',
        key: `garda_live_${randomHex}`,
        status: 'active',
        permissions: Array.isArray(permissions) ? permissions : ['mitra:read'],
        created_at: new Date().toISOString(),
        last_used_at: null,
        usage_count: 0
    };

    keys.push(newKey);
    saveApiKeys(keys);
    return newKey;
}

// Cabut / nonaktifkan API Key
function revokeApiKey(keyId) {
    const keys = loadApiKeys();
    const target = keys.find(k => k.id === keyId || k.key === keyId);
    if (!target) return false;
    target.status = 'revoked';
    target.revoked_at = new Date().toISOString();
    saveApiKeys(keys);
    return true;
}

// Ambil Master Key yang aktif
function getMasterApiKey() {
    const keys = loadApiKeys();
    const master = keys.find(k => k.id === 'key_master_se2026' && k.status === 'active') || keys.find(k => k.status === 'active');
    return master ? master.key : DEFAULT_MASTER_KEY;
}

/**
 * Middleware Utama:
 * Memeriksa apakah request membawa API Key yang valid (via X-API-Key, Authorization, atau Query Parameter).
 * Juga menerima JWT Token resmi pengguna internal Garda Data.
 */
const apiKeyAuthMiddleware = (req, res, next) => {
    // 1. Periksa API Key dari Header X-API-Key atau x-api-key
    const headerApiKey = req.headers['x-api-key'] || req.headers['x-api-token'];
    if (headerApiKey) {
        const keyInfo = findActiveApiKey(headerApiKey);
        if (keyInfo) {
            req.apiKey = keyInfo;
            req.authType = 'api_key';
            return next();
        }
    }

    // 2. Periksa API Key dari Query Parameter ?api_key= atau ?apiKey=
    const queryApiKey = req.query.api_key || req.query.apiKey;
    if (queryApiKey) {
        const keyInfo = findActiveApiKey(queryApiKey);
        if (keyInfo) {
            req.apiKey = keyInfo;
            req.authType = 'api_key';
            return next();
        }
    }

    // 3. Periksa Authorization Header (ApiKey <key> atau Bearer <token>)
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        if (authHeader.startsWith('ApiKey ')) {
            const rawKey = authHeader.substring(7).trim();
            const keyInfo = findActiveApiKey(rawKey);
            if (keyInfo) {
                req.apiKey = keyInfo;
                req.authType = 'api_key';
                return next();
            }
        } else if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7).trim();
            
            // Cek apakah Bearer token ini sebenarnya merupakan format API key
            const keyInfo = findActiveApiKey(token);
            if (keyInfo) {
                req.apiKey = keyInfo;
                req.authType = 'api_key';
                return next();
            }

            // Jika bukan API key, verifikasi apakah ini JWT Token pengguna Garda Data
            try {
                const secret = getJwtSecret();
                const verified = jwt.verify(token, secret);
                req.user = verified;
                req.authType = 'jwt';
                return next();
            } catch (jwtErr) {
                // Token tidak valid, lanjutkan ke penolakan akses
            }
        }
    }

    // Jika tidak ada kredensial valid
    return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Akses ditolak: API Key tidak valid atau belum disertakan.',
        hint: 'Sertakan API Key Anda melalui HTTP Header `X-API-Key: <api_key>` atau query parameter `?api_key=<api_key>`.'
    });
};

module.exports = {
    apiKeyAuthMiddleware,
    findActiveApiKey,
    loadApiKeys,
    generateNewApiKey,
    revokeApiKey,
    getMasterApiKey,
    DEFAULT_MASTER_KEY
};

