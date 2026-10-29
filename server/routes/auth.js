const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { getJwtSecret } = require('../middleware/jwtSecret');

// In-Memory Rate Limiter for Login Attempts (Anti-Brute Force)
const loginAttemptTracker = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout

const BPS_NIP_TO_EMAIL_MAP = {
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

// Clean up stale attempts periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of loginAttemptTracker.entries()) {
        if (now - record.lastAttempt > LOCKOUT_WINDOW_MS) {
            loginAttemptTracker.delete(key);
        }
    }
}, 5 * 60 * 1000);

function validatePasswordPolicy(password) {
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return { isValid: false, message: 'Kata sandi tidak boleh kosong.' };
    }
    return { isValid: true };
}

// POST /api/auth/register - Register new user (with anti-privilege escalation)
router.post('/register', async (req, res) => {
    const { username, password, name, role } = req.body;
    
    if (!username || !password || !name) {
        return res.status(400).json({ message: 'Semua bidang wajib diisi.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanName = String(name).trim();

    // Password Complexity Validation
    const pwValidation = validatePasswordPolicy(password);
    if (!pwValidation.isValid) {
        return res.status(400).json({ message: pwValidation.message });
    }
    
    try {
        // Check if user already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Username sudah terdaftar.' });
        }
        
        // Anti-Privilege Escalation Protection:
        // Only existing administrators can register another 'admin' or 'petugas_pengolahan'
        // If system has no users yet (bootstrap phase), allow initial admin creation
        let targetRole = 'petugas';
        const [userCount] = await pool.query('SELECT COUNT(*) as total FROM users');
        const isBootstrap = userCount[0].total === 0;

        if (role === 'admin' || role === 'petugas_pengolahan') {
            if (isBootstrap) {
                targetRole = role;
            } else {
                // Verify if caller is an authorized admin
                const authHeader = req.header('Authorization');
                if (authHeader) {
                    try {
                        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
                        const decoded = jwt.verify(token, getJwtSecret());
                        if (decoded.role === 'admin') {
                            targetRole = role;
                        } else {
                            targetRole = 'petugas';
                        }
                    } catch {
                        targetRole = 'petugas';
                    }
                } else {
                    targetRole = 'petugas'; // Prevent privilege escalation
                }
            }
        } else if (role === 'pengunjung') {
            targetRole = 'pengunjung';
        } else {
            targetRole = 'petugas';
        }

        // Hash password with 12 rounds
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);
        
        const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        // Insert user
        await pool.query(
            'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
            [id, cleanUsername, password_hash, cleanName, targetRole]
        );
        
        res.status(201).json({
            message: 'Pengguna berhasil didaftarkan.',
            user: { id, username: cleanUsername, name: cleanName, role: targetRole }
        });
    } catch (err) {
        res.status(500).json({ message: 'Kesalahan server saat pendaftaran.', error: err.message });
    }
});

// POST /api/auth/visitor - Issue signed read-only JWT token for visitor/guest session
router.post('/visitor', (req, res) => {
    try {
        const token = jwt.sign(
            { id: 'visitor_guest', username: 'pengunjung', role: 'pengunjung', name: 'Tamu BPS' },
            getJwtSecret(),
            { expiresIn: '1d' }
        );
        res.json({
            token,
            user: {
                id: 'visitor_guest',
                username: 'pengunjung',
                name: 'Tamu BPS',
                role: 'pengunjung'
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Gagal membuat token pengunjung.', error: err.message });
    }
});

// POST /api/auth/login - Login user with rate limiting
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan kata sandi wajib diisi.' });
    }

    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const cleanUsername = String(username).trim().toLowerCase();
    const trackKey = `${clientIp}_${cleanUsername}`;
    const now = Date.now();

    // Check Rate Limiter
    const attemptRecord = loginAttemptTracker.get(trackKey) || { count: 0, lastAttempt: now };
    if (attemptRecord.count >= MAX_FAILED_ATTEMPTS && (now - attemptRecord.lastAttempt < LOCKOUT_WINDOW_MS)) {
        const remainingMinutes = Math.ceil((LOCKOUT_WINDOW_MS - (now - attemptRecord.lastAttempt)) / 60000);
        return res.status(429).json({
            message: `Akun dikunci sementara akibat terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${remainingMinutes} menit.`
        });
    }
    
    try {
        // Find user
        const [users] = await pool.query('SELECT id, username, password_hash, name, role, nip FROM users WHERE username = ?', [cleanUsername]);
        if (users.length === 0) {
            // Check if user attempted legacy 'admin' login
            if (cleanUsername === 'admin') {
                return res.status(403).json({
                    message: 'Akun Administrator BPS kini telah distandarkan menggunakan SSO rIDM BPS Kabupaten Mempawah. Silakan masuk melalui tombol "Login Pegawai BPS (SSO rIDM)".'
                });
            }
            attemptRecord.count += 1;
            attemptRecord.lastAttempt = now;
            loginAttemptTracker.set(trackKey, attemptRecord);
            return res.status(400).json({ message: 'Username atau kata sandi tidak sesuai.' });
        }
        
        const user = users[0];

        // Security rule: Pegawai BPS / Administrator accounts must authenticate strictly through SSO rIDM
        // Form login is strictly designated for Petugas Pendataan Lapangan and Petugas Pengolahan
        if (cleanUsername === 'admin' || user.role === 'admin') {
            return res.status(403).json({
                message: 'Akun Administrator BPS kini telah distandarkan menggunakan SSO rIDM BPS Kabupaten Mempawah. Silakan masuk melalui tombol "Login Pegawai BPS (SSO rIDM)".'
            });
        }
        
        // Validate password using secure bcrypt compare
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            attemptRecord.count += 1;
            attemptRecord.lastAttempt = now;
            loginAttemptTracker.set(trackKey, attemptRecord);
            const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - attemptRecord.count);
            return res.status(400).json({ 
                message: remainingAttempts > 0 
                    ? `Username atau kata sandi tidak sesuai. Sisa kesempatan: ${remainingAttempts} kali.`
                    : 'Terlalu banyak percobaan gagal. Akun dikunci sementara selama 15 menit.'
            });
        }
        
        // Reset failed attempt on success
        loginAttemptTracker.delete(trackKey);

        // Sign JWT with strong secret
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.name, nip: user.nip },
            getJwtSecret(),
            { expiresIn: '7d' } // Secure 7 days session duration
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                nip: user.nip
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Kesalahan server saat otentikasi.', error: err.message });
    }
});

// ==========================================
// SSO BPS KABUPATEN MEMPAWAH (rIDM OIDC)
// ==========================================

// In-Memory PKCE verifier store (10 minutes TTL)
const pkceStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, item] of pkceStore.entries()) {
        if (now - item.timestamp > 10 * 60 * 1000) {
            pkceStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Helper to determine active registered redirect URI (Anti-Open Redirect & OAuth Hijacking)
function resolveRedirectUri(req) {
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://gardadata.dvlpid.my.id'];
    if (req.query && req.query.redirect_uri) {
        try {
            const parsed = new URL(req.query.redirect_uri);
            if (allowedOrigins.includes(parsed.origin) && parsed.pathname === '/auth/callback') {
                return req.query.redirect_uri;
            }
        } catch {
            // Ignore invalid URL
        }
    }
    const origin = req.get('origin') || req.get('referer') || '';
    if (origin.includes('gardadata.dvlpid.my.id')) {
        return 'https://gardadata.dvlpid.my.id/auth/callback';
    }
    return process.env.RIDM_REDIRECT_URI || 'http://localhost:5173/auth/callback';
}

// GET /api/auth/sso/config - Check SSO configuration status
router.get('/sso/config', (req, res) => {
    const baseUrl = process.env.RIDM_BASE_URL || 'https://auth.dvlpid.my.id/t/bps';
    const clientId = process.env.RIDM_CLIENT_ID || '';
    const redirectUri = resolveRedirectUri(req);
    res.json({
        configured: Boolean(clientId),
        baseUrl,
        clientId,
        redirectUri,
        isDev: process.env.NODE_ENV !== 'production'
    });
});

// GET /api/auth/sso/login - Initiate SSO OAuth2 Authorization URL with PKCE (S256)
router.get('/sso/login', (req, res) => {
    const baseUrl = process.env.RIDM_BASE_URL || 'https://auth.dvlpid.my.id/t/bps';
    const clientId = process.env.RIDM_CLIENT_ID || 'gardadata-app';
    const redirectUri = resolveRedirectUri(req);
    const state = crypto.randomBytes(16).toString('hex');
    
    // PKCE S256 Generation (Mandatory per rIDM client configuration)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    // Store verifier with state mapping
    pkceStore.set(state, {
        codeVerifier,
        redirectUri,
        timestamp: Date.now()
    });

    if (!clientId) {
        return res.status(400).json({
            error: 'SSO_NOT_CONFIGURED',
            message: 'Client ID SSO rIDM belum dikonfigurasi di server/.env. Silakan hubungi Tim IT BPS untuk mendaftarkan aplikasi.',
            isDev: process.env.NODE_ENV !== 'production'
        });
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'login'
    });

    const authUrl = `${baseUrl}/authorize?${params.toString()}`;
    res.json({ url: authUrl, state, codeVerifier });
});

// POST /api/auth/sso/callback - Exchange authorization code with PKCE, sync Pegawai to DB, and issue JWT
router.post('/sso/callback', async (req, res) => {
    const { code, state, redirectUri, codeVerifier, clientId: clientReqId } = req.body;
    if (!code) {
        return res.status(400).json({ message: 'Kode otorisasi (code) tidak ditemukan.' });
    }

    const baseUrl = process.env.RIDM_BASE_URL || 'https://auth.dvlpid.my.id/t/bps';
    const clientId = clientReqId || process.env.RIDM_CLIENT_ID || 'gardadata-app';
    const clientSecret = process.env.RIDM_CLIENT_SECRET || '';

    // Retrieve PKCE verifier and redirect URI from memory store or request body
    let finalVerifier = codeVerifier;
    let finalRedirectUri = redirectUri;

    if (state && pkceStore.has(state)) {
        const stored = pkceStore.get(state);
        finalVerifier = finalVerifier || stored.codeVerifier;
        finalRedirectUri = finalRedirectUri || stored.redirectUri;
        pkceStore.delete(state);
    }

    if (!finalRedirectUri) {
        finalRedirectUri = resolveRedirectUri(req);
    }

    try {
        // 1. Exchange authorization code for token (including PKCE code_verifier)
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: String(code).trim(),
            client_id: clientId,
            redirect_uri: finalRedirectUri
        });

        if (finalVerifier) {
            tokenParams.append('code_verifier', finalVerifier);
        }

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'GardaData-BPS-Mempawah'
        };

        // Profil A: gardadata-app terdaftar wajib menggunakan client_secret_basic
        if (clientId === 'gardadata-app') {
            const secret = clientSecret || 'cs_--WU8U2qOOpGxH9WO-0cO5z2Qx6zhn6CNROGOh6Ixa8';
            const basicAuth = Buffer.from(`${clientId}:${secret}`).toString('base64');
            headers['Authorization'] = `Basic ${basicAuth}`;
        }

        const tokenRes = await fetch(`${baseUrl}/token`, {
            method: 'POST',
            headers: headers,
            body: tokenParams.toString()
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error('rIDM token exchange failed:', tokenRes.status, errText);
            return res.status(401).json({
                message: 'Pertukaran token SSO rIDM gagal. Kode otorisasi mungkin kedaluwarsa atau tidak valid.',
                detail: errText
            });
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        if (!accessToken) {
            return res.status(401).json({ message: 'Token akses tidak diterima dari server SSO rIDM.' });
        }

        // 2. Fetch UserInfo
        const userinfoRes = await fetch(`${baseUrl}/userinfo`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'User-Agent': 'GardaData-BPS-Mempawah'
            }
        });

        if (!userinfoRes.ok) {
            const errText = await userinfoRes.text();
            console.error('rIDM userinfo fetch failed:', userinfoRes.status, errText);
            return res.status(401).json({ message: 'Gagal mengambil data profil dari SSO rIDM.' });
        }

        const userInfo = await userinfoRes.json();

        // 3. Extract identity attributes per BPS rIDM guide
        // Primary identifier: NIP 18-digit (or preferred_username / sub)
        const nip = String(userInfo.nip || userInfo.preferred_username || userInfo.sub || '').trim();
        const name = String(userInfo.name || userInfo.preferred_username || `Pegawai ${nip}`).trim();
        const email = String(userInfo.email || '').trim().toLowerCase();

        // Gunakan nama email pengguna (misal sukma.andini), BUKAN NIP!
        let username = '';
        if (email && email.includes('@')) {
            username = email.split('@')[0].trim().toLowerCase();
        } else if (nip && BPS_NIP_TO_EMAIL_MAP[nip]) {
            username = BPS_NIP_TO_EMAIL_MAP[nip];
        } else if (userInfo.preferred_username && !/^\d{18}$/.test(userInfo.preferred_username)) {
            username = String(userInfo.preferred_username).trim().toLowerCase();
        } else if (name) {
            username = name.toLowerCase().replace(/\s+/g, '.');
        } else {
            username = 'ahmad.aulia';
        }

        if (!nip) {
            return res.status(400).json({ message: 'Identitas NIP tidak ditemukan pada profil SSO rIDM.' });
        }

        // 4. Synchronize user in Garda Data DB with role 'admin'
        // Rule: Pegawai automatically gets 'admin' role!
        const [existingUsers] = await pool.query(
            'SELECT id, username, name, role FROM users WHERE nip = ? OR username = ?',
            [nip, nip]
        );

        let userId;
        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
            await pool.query(
                'UPDATE users SET name = ?, email = ?, nip = ?, role = "admin", username = ? WHERE id = ?',
                [name, email, nip, username, userId]
            );
            console.log(`✔ Pegawai SSO login: Updated user ${nip} (${name}) as admin with username ${username}`);
        } else {
            userId = `pegawai_${nip}`;
            const dummySalt = await bcrypt.genSalt(12);
            const dummyHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), dummySalt);
            await pool.query(
                'INSERT INTO users (id, username, password_hash, name, nip, email, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, username, dummyHash, name, nip, email, 'admin']
            );
            console.log(`✔ Pegawai SSO auto-register: Created user ${nip} (${name}) with username ${username} and role admin`);
        }

        // 5. Generate Garda Data JWT Token
        const appToken = jwt.sign(
            { id: userId, username: username, role: 'admin', name, nip },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token: appToken,
            user: {
                id: userId,
                username: username,
                name: name,
                role: 'admin',
                nip: nip,
                email: email,
                isSso: true
            }
        });
    } catch (err) {
        console.error('SSO callback processing error:', err);
        res.status(500).json({ message: 'Kesalahan server saat memproses otentikasi SSO.', error: err.message });
    }
});

// POST /api/auth/sso/mock-login - Development Simulation Mode
// Allows local testing of Pegawai -> Admin auto-creation without live client credentials
router.post('/sso/mock-login', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Simulasi SSO hanya tersedia pada lingkungan pengembangan (development).' });
    }

    const { nip = '200109122024121001', name = 'Ahmad Aulia Rahman' } = req.body;
    const cleanNip = String(nip).trim();
    const cleanName = String(name).trim();
    const cleanUsername = BPS_NIP_TO_EMAIL_MAP[cleanNip] || (cleanName.toLowerCase().replace(/\s+/g, '.'));

    try {
        const [existingUsers] = await pool.query(
            'SELECT id, username, name, role FROM users WHERE nip = ? OR username = ?',
            [cleanNip, cleanNip]
        );

        let userId;
        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
            await pool.query(
                'UPDATE users SET name = ?, role = "admin", nip = ?, username = ? WHERE id = ?',
                [cleanName, cleanNip, cleanUsername, userId]
            );
        } else {
            userId = `pegawai_${cleanNip}`;
            const dummySalt = await bcrypt.genSalt(12);
            const dummyHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), dummySalt);
            await pool.query(
                'INSERT INTO users (id, username, password_hash, name, nip, email, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, cleanUsername, dummyHash, cleanName, cleanNip, `${cleanUsername}@bps.go.id`, 'admin']
            );
        }

        const appToken = jwt.sign(
            { id: userId, username: cleanUsername, role: 'admin', name: cleanName, nip: cleanNip },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token: appToken,
            user: {
                id: userId,
                username: cleanUsername,
                name: cleanName,
                role: 'admin',
                nip: cleanNip,
                email: `${cleanUsername}@bps.go.id`,
                isSso: true
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menjalankan mock login SSO.', error: err.message });
    }
});

// GET /api/auth/sso/logout - Get Single Logout URL (Anti-Open Redirect)
router.get('/sso/logout', (req, res) => {
    const baseUrl = process.env.RIDM_BASE_URL || 'https://auth.dvlpid.my.id/t/bps';
    let postLogoutUri = req.query.post_logout_redirect_uri || `${req.protocol}://${req.get('host')}`;

    try {
        const parsed = new URL(postLogoutUri);
        const allowedHosts = ['localhost', '127.0.0.1', 'gardadata.dvlpid.my.id'];
        if (!allowedHosts.includes(parsed.hostname)) {
            postLogoutUri = `${req.protocol}://${req.get('host')}`;
        }
    } catch {
        postLogoutUri = `${req.protocol}://${req.get('host')}`;
    }

    const logoutUrl = `${baseUrl}/end_session?post_logout_redirect_uri=${encodeURIComponent(postLogoutUri)}&client_id=gardadata-spa`;
    res.json({ logoutUrl });
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Kata sandi lama dan kata sandi baru wajib diisi.' });
    }

    if (oldPassword === newPassword) {
        return res.status(400).json({ message: 'Kata sandi baru tidak boleh sama dengan kata sandi lama.' });
    }

    const pwValidation = validatePasswordPolicy(newPassword);
    if (!pwValidation.isValid) {
        return res.status(400).json({ message: pwValidation.message });
    }

    try {
        const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, users[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Kata sandi lama tidak sesuai.' });
        }

        const salt = await bcrypt.genSalt(12);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.user.id]);

        res.json({ message: 'Kata sandi berhasil diperbarui dengan aman.' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal memperbarui kata sandi.', error: err.message });
    }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, name, role, nip, email FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }
        res.json(users[0]);
    } catch (err) {
        res.status(500).json({ message: 'Kesalahan server saat memuat profil.', error: err.message });
    }
});

module.exports = router;


