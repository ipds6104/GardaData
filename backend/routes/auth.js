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

    // Sync Pegawai into MySQL Database if DB connection exists
    try {
      const connection = await pool.getConnection();
      try {
        const [existing] = await connection.query('SELECT id, role FROM users WHERE username = ? LIMIT 1', [nip]);
        if (existing && existing.length > 0) {
          await connection.query('UPDATE users SET role = "admin", name = ? WHERE username = ?', [name, nip]);
        } else {
          const randomPass = crypto.randomBytes(16).toString('hex');
          await connection.query(
            'INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, "admin")',
            [`sso_${nip}`, nip, randomPass, name]
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
      username: nip,
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

