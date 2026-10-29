const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db');

// Helper to decode JWT payload safely
function parseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// GET /api/auth/sso/config
router.get('/sso/config', (req, res) => {
  res.json({
    configured: true,
    baseUrl: 'https://auth.dvlpid.my.id/t/bps',
    clientId: 'gardadata-spa'
  });
});

// GET /api/auth/sso/logout - Get Single Logout URL
router.get('/sso/logout', (req, res) => {
  const baseUrl = process.env.RIDM_BASE_URL || 'https://auth.dvlpid.my.id/t/bps';
  const postLogoutUri = req.query.post_logout_redirect_uri || 'https://gardadata.dvlpid.my.id';
  const logoutUrl = `${baseUrl}/end_session?post_logout_redirect_uri=${encodeURIComponent(postLogoutUri)}&client_id=gardadata-spa`;
  res.json({ logoutUrl });
});

// POST /api/auth/sso/callback - Proxy token exchange and sync pegawai to database
router.post('/sso/callback', async (req, res) => {
  const { code, state, redirectUri, codeVerifier, clientId: clientReqId } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Kode otorisasi tidak ditemukan.' });
  }

  const baseUrl = process.env.RIDM_BASE_URL || 'https://auth.dvlpid.my.id/t/bps';
  const clientId = clientReqId || process.env.RIDM_CLIENT_ID || 'gardadata-spa';
  const clientSecret = process.env.RIDM_CLIENT_SECRET || '';
  const finalRedirectUri = redirectUri || 'https://gardadata.dvlpid.my.id/auth/callback';

  try {
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code).trim(),
      client_id: clientId,
      redirect_uri: finalRedirectUri
    });

    if (codeVerifier) {
      tokenParams.append('code_verifier', codeVerifier);
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
      console.error('SSO backend proxy token exchange failed:', tokenRes.status, errText);
      return res.status(401).json({
        success: false,
        message: 'Pertukaran tiket SSO rIDM gagal.',
        detail: errText
      });
    }

    const tokenData = await tokenRes.json();
    let userInfo = null;

    // 1. Extract from ID Token
    if (tokenData.id_token) {
      const claims = parseJwt(tokenData.id_token);
      if (claims) userInfo = { ...claims };
    }

    // 2. Fetch UserInfo
    const accessToken = tokenData.access_token;
    if (accessToken) {
      try {
        const uRes = await fetch(`${baseUrl}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          userInfo = { ...(userInfo || {}), ...uData };
        }
      } catch (uiErr) {
        console.warn('UserInfo fetch warning in backend:', uiErr.message);
      }
    }

    if (!userInfo) {
      return res.status(401).json({ success: false, message: 'Gagal memuat identitas pengguna dari SSO rIDM.' });
    }

    const nip = String(userInfo.nip || userInfo.preferred_username || userInfo.username || userInfo.sub || '').trim();
    const name = String(userInfo.name || userInfo.preferred_username || `Pegawai ${nip}`).trim();
    const email = String(userInfo.email || '').trim().toLowerCase();

    const BPS_NIP_MAP = {
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

    let username = '';
    if (email && email.includes('@')) {
      username = email.split('@')[0].trim().toLowerCase();
    } else if (nip && BPS_NIP_MAP[nip]) {
      username = BPS_NIP_MAP[nip];
    } else if (userInfo.preferred_username && !/^\d{18}$/.test(userInfo.preferred_username)) {
      username = String(userInfo.preferred_username).trim().toLowerCase();
    } else if (name) {
      username = name.toLowerCase().replace(/\s+/g, '.');
    } else {
      username = 'ahmad.aulia';
    }

    // Sync Pegawai into MySQL Database if DB connection exists
    try {
      const connection = await pool.getConnection();
      try {
        const [existing] = await connection.query('SELECT id, role FROM users WHERE username = ? OR nip = ? LIMIT 1', [username, nip]);
        if (existing && existing.length > 0) {
          await connection.query('UPDATE users SET role = "admin", name = ?, username = ? WHERE id = ?', [name, username, existing[0].id]);
        } else {
          const randomPass = crypto.randomBytes(16).toString('hex');
          await connection.query(
            'INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, "admin")',
            [`sso_${nip}`, username, randomPass, name]
          );
        }
      } finally {
        connection.release();
      }
    } catch (dbErr) {
      console.warn('DB user sync warning (non-fatal):', dbErr.message);
    }

    const appUser = {
      id: userInfo.id || `pegawai_${nip}`,
      username: username,
      name: name,
      nip: nip,
      email: email,
      role: 'admin',
      isSso: true
    };

    return res.json({
      success: true,
      user: appUser,
      token: tokenData.id_token || tokenData.access_token || `sso_sess_${Date.now()}`
    });
  } catch (err) {
    console.error('SSO backend callback error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server saat memproses SSO.', error: err.message });
  }
});

module.exports = router;

