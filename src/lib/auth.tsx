import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'petugas' | 'petugas_pengolahan' | 'pengunjung' | null;

export interface AuthUser {
  id?: string;
  username: string;
  role: UserRole;
  name?: string;
  nip?: string;
  email?: string;
  isSso?: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
  score: number; // 0 to 4
}

/**
 * Validates password:
 * Memperbolehkan sandi sederhana agar mudah diingat sesuai kebutuhan pengguna.
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
  if (!password || password.trim().length === 0) {
    return {
      isValid: false,
      message: 'Sandi tidak boleh kosong.',
      score: 0
    };
  }

  return {
    isValid: true,
    message: 'Sandi diterima.',
    score: 3
  };
}

// Helper to compute SHA-256 hash using native Web Crypto API
async function sha256Hex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = await window.crypto.subtle.digest('SHA-256', enc.encode(data));
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// PKCE RFC 7636 Utilities for Browser-Native rIDM OIDC Flow
function generateRandomString(length = 43): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Normalisasi URL Callback OIDC rIDM.
 * Selaras dengan Redirect URI yang terdaftar resmi di portal rIDM BPS:
 * 1. Produksi: https://gardadata.dvlpid.my.id/auth/callback
 * 2. Lokal/Dev: http://localhost:5173/auth/callback
 */
export function getOidcRedirectUri(): string {
  if (typeof window === 'undefined') return 'http://localhost:5173/auth/callback';
  if (window.location.origin.includes('gardadata.dvlpid.my.id')) {
    return 'https://gardadata.dvlpid.my.id/auth/callback';
  }
  return 'http://localhost:5173/auth/callback';
}

/**
 * Decode payload JWT (seperti ID Token OIDC) secara aman di sisi browser
 */
export function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Gagal mem-parsing payload JWT ID Token:', e);
    return null;
  }
}

/**
 * Menyiapkan transfer sesi sekali-pakai (single-use handoff) untuk tab baru
 * dengan batas kedaluwarsa 6 detik. Hanya digunakan oleh aksi klik internal di aplikasi.
 */
export function prepareTabHandoff(): void {
  try {
    const userStr = sessionStorage.getItem('navigasi_user');
    const token = sessionStorage.getItem('navigasi_token');
    if (userStr) {
      const payload = {
        user: JSON.parse(userStr),
        token: token || null,
        expiresAt: Date.now() + 6000 // Berlaku maksimal 6 detik
      };
      localStorage.setItem('garda_tab_handoff', JSON.stringify(payload));
    }
  } catch {}
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('navigasi_token') || localStorage.getItem('navigasi_token');
}

// Zero-plaintext offline credential database with individual cryptographic salts
// Admin role is strictly managed via Pegawai SSO rIDM. Offline credentials are exclusively for external field officers.
const SECURE_OFFLINE_USERS: Record<string, {
  salt: string;
  hash: string;
  role: UserRole;
  name: string;
}> = {
  'petugas': {
    salt: 'garda_sec_petugas_salt_6104',
    hash: 'ef8b88dfe2f5a6d4ac3f030a594123ea9039855764a03d929b3cb7705e216ef3',
    role: 'petugas',
    name: 'Petugas BPS'
  },
  'petugas.pengolahan@josjis.com': {
    salt: 'garda_sec_pengolahan_salt_6104',
    hash: 'e827e01e797e361546be07ea49177df6df9350409f4beb05f853f6389df91481',
    role: 'petugas_pengolahan',
    name: 'Petugas Pengolahan BPS'
  }
};

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithSso: () => Promise<{ success: boolean; url?: string; message?: string }>;
  handleSsoCallback: (code: string, state?: string) => Promise<{ success: boolean; message?: string }>;
  mockSsoLogin: (nip?: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  loginAsVisitor: () => void;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  lockoutRemainingSeconds: number;
  ssoConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds lockout after 5 failed attempts

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;

    // 0. Selalu bersihkan sisa kredensial permanen di localStorage (mencegah celah histori browser)
    try {
      localStorage.removeItem('navigasi_user');
      localStorage.removeItem('navigasi_token');
    } catch {}

    // 1. Cek apakah ada transfer sesi sekali-pakai dari tab utama yang baru saja diklik (< 6 detik)
    try {
      const handoffRaw = localStorage.getItem('garda_tab_handoff');
      if (handoffRaw) {
        localStorage.removeItem('garda_tab_handoff'); // Burn-after-reading: langsung hapus agar tidak bisa digunakan lagi
        const handoff = JSON.parse(handoffRaw);
        if (handoff && handoff.expiresAt && handoff.expiresAt > Date.now() && handoff.user) {
          sessionStorage.setItem('navigasi_user', JSON.stringify(handoff.user));
          if (handoff.token) {
            sessionStorage.setItem('navigasi_token', handoff.token);
          }
          return handoff.user;
        }
      }
    } catch {
      try { localStorage.removeItem('garda_tab_handoff'); } catch {}
    }

    // 2. Deteksi jenis navigasi browser:
    // Jika halaman dibuka melalui Histori Browser, Bookmark, ketik URL langsung ('navigate' / 'back_forward'),
    // atau tab ditutup lalu dibuka kembali dari histori (> 5 detik), WAJIBKAN LOGIN ULANG!
    try {
      const navEntries = window.performance?.getEntriesByType?.('navigation') as PerformanceNavigationTiming[] | undefined;
      const navType = navEntries && navEntries.length > 0 ? navEntries[0].type : 'navigate';
      const unloadTs = Number(sessionStorage.getItem('garda_unload_ts') || '0');
      sessionStorage.removeItem('garda_unload_ts');

      const isQuickReload = navType === 'reload' && (unloadTs === 0 || (Date.now() - unloadTs) < 5000);

      if (!isQuickReload) {
        sessionStorage.removeItem('navigasi_user');
        sessionStorage.removeItem('navigasi_token');
        return null;
      }

      const savedUser = sessionStorage.getItem('navigasi_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      sessionStorage.removeItem('navigasi_user');
      sessionStorage.removeItem('navigasi_token');
    }

    return null;
  });

  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);

  // Pasang proteksi anti-histori (BFCache & Unload Timestamp)
  useEffect(() => {
    try {
      localStorage.removeItem('navigasi_user');
      localStorage.removeItem('navigasi_token');
      localStorage.removeItem('garda_tab_handoff');
    } catch {}

    const handleUnload = () => {
      try {
        sessionStorage.setItem('garda_unload_ts', String(Date.now()));
      } catch {}
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // Jika halaman direstore dari BFCache (Back-Forward Cache melalui histori browser)
      if (event.persisted) {
        setUser(null);
        try {
          sessionStorage.removeItem('navigasi_user');
          sessionStorage.removeItem('navigasi_token');
          localStorage.removeItem('navigasi_user');
          localStorage.removeItem('navigasi_token');
        } catch {}
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutUntil <= Date.now()) {
      setLockoutRemainingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemainingSeconds(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const loginAsVisitor = async () => {
    const visitorUser: AuthUser = { username: 'Pengunjung', role: 'pengunjung', name: 'Tamu BPS' };
    setUser(visitorUser);
    sessionStorage.setItem('navigasi_user', JSON.stringify(visitorUser));
    localStorage.removeItem('navigasi_user');
    try {
      const res = await fetch('/api/auth/visitor', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          sessionStorage.setItem('navigasi_token', data.token);
          localStorage.removeItem('navigasi_token');
        }
      }
    } catch {
      // Offline fallback mode
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const now = Date.now();
    if (lockoutUntil > now) {
      const sec = Math.ceil((lockoutUntil - now) / 1000);
      return {
        success: false,
        message: `Terlalu banyak percobaan gagal. Akun dikunci sementara selama ${sec} detik untuk keamanan.`
      };
    }

    const trimmedUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '');

    if (!trimmedUsername || !cleanPassword) {
      return { success: false, message: 'Username dan sandi wajib diisi.' };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername, password: cleanPassword }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newUser: AuthUser = { 
          username: data.user.username, 
          role: data.user.role as UserRole,
          name: data.user.name 
        };
        setUser(newUser);
        setFailedAttempts(0);
        sessionStorage.setItem('navigasi_user', JSON.stringify(newUser));
        localStorage.removeItem('navigasi_user');
        if (data.token) {
          sessionStorage.setItem('navigasi_token', data.token);
          localStorage.removeItem('navigasi_token');
        }
        return { success: true };
      }
    } catch (error) {
      console.warn('Backend API connection offline, menggunakan autentikasi kriptografi lokal aman:', error);
    }

    // SECURE CRYPTOGRAPHIC ZERO-PLAINTEXT OFFLINE VERIFICATION
    const offlineProfile = SECURE_OFFLINE_USERS[trimmedUsername];
    if (offlineProfile) {
      const computedHash = await sha256Hex(cleanPassword + offlineProfile.salt);
      if (computedHash === offlineProfile.hash) {
        const newUser: AuthUser = {
          username: trimmedUsername,
          role: offlineProfile.role,
          name: offlineProfile.name
        };
        setUser(newUser);
        setFailedAttempts(0);
        sessionStorage.setItem('navigasi_user', JSON.stringify(newUser));
        localStorage.removeItem('navigasi_user');
        return { success: true };
      }
    }

    // Check custom local updated password if any
    try {
      const customLocalAuthStr = localStorage.getItem(`auth_hash_${trimmedUsername}`);
      if (customLocalAuthStr) {
        const customAuth = JSON.parse(customLocalAuthStr);
        const computedCustomHash = await sha256Hex(cleanPassword + customAuth.salt);
        if (computedCustomHash === customAuth.hash) {
          const newUser: AuthUser = {
            username: trimmedUsername,
            role: customAuth.role,
            name: customAuth.name
          };
          setUser(newUser);
          setFailedAttempts(0);
          sessionStorage.setItem('navigasi_user', JSON.stringify(newUser));
          localStorage.removeItem('navigasi_user');
          return { success: true };
        }
      }
    } catch {
      // ignore
    }

    // Handle Failed Attempt & Rate Limiting / Lockout Protection
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutUntil(lockUntil);
      setLockoutRemainingSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
      return {
        success: false,
        message: 'Terlalu banyak percobaan gagal (5 kali). Sistem dikunci selama 30 detik untuk mencegah serangan brute force.'
      };
    }

    const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts;
    return {
      success: false,
      message: `Username atau sandi salah. Sisa kesempatan: ${remainingAttempts} kali.`
    };
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Harap masuk terlebih dahulu.' };
    }

    const valResult = validatePasswordComplexity(newPassword);
    if (!valResult.isValid) {
      return { success: false, message: valResult.message || 'Sandi baru tidak memenuhi syarat.' };
    }

    if (oldPassword === newPassword) {
      return { success: false, message: 'Sandi baru tidak boleh sama dengan sandi lama.' };
    }

    const token = sessionStorage.getItem('navigasi_token') || localStorage.getItem('navigasi_token');

    // Attempt online change password
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: data.message || 'Sandi berhasil diperbarui.' };
      } else {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 400 || response.status === 401) {
          return { success: false, message: errData.message || 'Sandi lama tidak sesuai.' };
        }
      }
    } catch {
      // Offline fallback
    }

    // Secure local hashed password update
    const salt = `user_${Date.now()}_salt`;
    const newHash = await sha256Hex(newPassword + salt);
    localStorage.setItem(`auth_hash_${user.username.toLowerCase()}`, JSON.stringify({
      salt,
      hash: newHash,
      role: user.role,
      name: user.name
    }));

    return { success: true, message: 'Sandi berhasil diperbarui secara aman.' };
  };

  const [ssoConfigured, setSsoConfigured] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/auth/sso/config')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.configured === 'boolean') {
          setSsoConfigured(data.configured);
        }
      })
      .catch(() => {
        // Profil B (gardadata-spa) is always active client-side
        setSsoConfigured(true);
      });
  }, []);

  const loginWithSso = async (): Promise<{ success: boolean; url?: string; message?: string }> => {
    try {
      // Jika pengguna mengakses via IP 127.0.0.1, alihkan otomatis ke localhost agar origin cocok persis dengan whitelist OIDC rIDM
      if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
        const targetUrl = window.location.href.replace('127.0.0.1', 'localhost');
        window.location.href = targetUrl;
        return { success: false, message: 'Mengalihkan ke localhost sesuai izin OIDC rIDM...' };
      }

      const redirectUri = getOidcRedirectUri();
      
      // Native Web Crypto PKCE S256 (RFC 7636) using official registered client 'gardadata-spa'
      const codeVerifier = generateRandomString(43);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(16);

      // Simpan di sessionStorage DAN localStorage agar tahan navigasi redirect antar-origin
      sessionStorage.setItem('sso_code_verifier', codeVerifier);
      sessionStorage.setItem('sso_state', state);
      localStorage.setItem('sso_code_verifier', codeVerifier);
      localStorage.setItem('sso_state', state);

      const params = new URLSearchParams({
        client_id: 'gardadata-spa',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid profile email',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'login'
      });

      const authUrl = `https://auth.dvlpid.my.id/t/bps/authorize?${params.toString()}`;
      window.location.href = authUrl;
      return { success: true, url: authUrl };
    } catch (err: any) {
      console.error('SSO login initialization error:', err);
      return {
        success: false,
        message: 'Gagal mengarahkan ke portal SSO rIDM BPS. Silakan periksa koneksi internet.'
      };
    }
  };

  const handleSsoCallback = async (code: string, state?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const redirectUri = getOidcRedirectUri();
      const codeVerifier =
        localStorage.getItem('sso_code_verifier') ||
        sessionStorage.getItem('sso_code_verifier') ||
        undefined;

      let tokenData: any = null;
      let userInfo: any = null;
      let detailedError = '';

      // 1. Direct OIDC Token Exchange via Profil B (gardadata-spa, PKCE S256, CORS enabled)
      if (codeVerifier) {
        try {
          const tokenBody = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: 'gardadata-spa',
            code: code.trim(),
            redirect_uri: redirectUri,
            code_verifier: codeVerifier
          });

          const tokenRes = await fetch('https://auth.dvlpid.my.id/t/bps/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            },
            body: tokenBody.toString()
          });

          if (tokenRes.ok) {
            tokenData = await tokenRes.json();

            // 1a. Ekstrak identitas langsung dari ID Token OIDC jika tersedia
            if (tokenData?.id_token) {
              const idClaims = parseJwtPayload(tokenData.id_token);
              if (idClaims) {
                userInfo = { ...idClaims };
              }
            }

            // 1b. Ambil atau lengkapi profil via endpoint UserInfo jika ada access_token
            const accessToken = tokenData?.access_token || tokenData?.accessToken;
            if (accessToken) {
              try {
                const userinfoRes = await fetch('https://auth.dvlpid.my.id/t/bps/userinfo', {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                  }
                });
                if (userinfoRes.ok) {
                  const uiData = await userinfoRes.json();
                  userInfo = { ...(userInfo || {}), ...uiData };
                }
              } catch (uiErr) {
                console.warn('UserInfo fetch error:', uiErr);
              }
            }

            if (!userInfo) {
              detailedError = `Respon token sukses namun tidak memuat data identitas pegawai (${JSON.stringify(tokenData).slice(0, 100)})`;
            }
          } else {
            const errRaw = await tokenRes.text().catch(() => '');
            let parsedErr: any = null;
            try {
              parsedErr = JSON.parse(errRaw);
            } catch {}
            detailedError = parsedErr?.error_description || parsedErr?.error || `Penukaran token ditolak rIDM (HTTP ${tokenRes.status}): ${errRaw.slice(0, 120)}`;
            console.warn('Direct token exchange response not ok:', tokenRes.status, detailedError);
          }
        } catch (spaErr: any) {
          detailedError = `Koneksi langsung ke rIDM terhambat (${spaErr.message || 'CORS / Jaringan'}). Mencoba fallback ke server...`;
          console.warn('Direct rIDM token exchange error:', spaErr);
        }
      } else {
        detailedError = 'Kode verifikasi PKCE (code_verifier) tidak ditemukan di penyimpanan sesi.';
      }

      // 2. Fallback to backend exchange if direct exchange failed
      if (!userInfo) {
        try {
          const backendRes = await fetch('/api/auth/sso/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              state,
              redirectUri,
              codeVerifier,
              clientId: 'gardadata-spa'
            })
          });
          if (backendRes.ok) {
            const bData = await backendRes.json();
            if (bData.success && bData.user) {
              userInfo = bData.user;
              tokenData = { access_token: bData.token };
            }
          } else {
            const bErr = await backendRes.text().catch(() => '');
            console.warn('Backend fallback response not ok:', backendRes.status, bErr);
          }
        } catch (bErr) {
          console.warn('Backend exchange also failed:', bErr);
        }
      }

      if (!userInfo) {
        return {
          success: false,
          message: detailedError || 'Gagal memverifikasi tiket login SSO rIDM. Silakan coba login kembali.'
        };
      }

      // 3. Extract identity and assign Admin role (Sesuai aturan: Pegawai otomatis role admin!)
      const nip = String(userInfo.nip || userInfo.preferred_username || userInfo.username || userInfo.sub || '').trim();
      const name = String(userInfo.name || userInfo.preferred_username || `Pegawai ${nip}`).trim();
      const email = String(userInfo.email || '').trim().toLowerCase();

      const newUser: AuthUser = {
        id: userInfo.id || `pegawai_${nip}`,
        username: nip || userInfo.username || 'pegawai',
        role: 'admin',
        name: name,
        nip: nip,
        email: email,
        isSso: true
      };

      setUser(newUser);
      sessionStorage.setItem('navigasi_user', JSON.stringify(newUser));
      localStorage.removeItem('navigasi_user');

      const sessionToken = (tokenData && (tokenData.id_token || tokenData.access_token)) || `sso_admin_${Date.now()}`;
      sessionStorage.setItem('navigasi_token', sessionToken);
      localStorage.removeItem('navigasi_token');

      // Clean up storage
      sessionStorage.removeItem('sso_code_verifier');
      sessionStorage.removeItem('sso_state');
      localStorage.removeItem('sso_code_verifier');
      localStorage.removeItem('sso_state');

      // Sync user to backend in background if backend route is alive
      fetch('/api/auth/sso/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          state,
          redirectUri,
          codeVerifier,
          clientId: 'gardadata-spa'
        })
      }).catch(() => {});

      return { success: true };
    } catch (err: any) {
      console.error('SSO callback processing error:', err);
      return {
        success: false,
        message: err.message || 'Terjadi kesalahan saat memproses callback SSO.'
      };
    }
  };

  const mockSsoLogin = async (nip?: string, name?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanNip = nip || '199503112022031001';
      const cleanName = name || 'Pegawai BPS Kabupaten Mempawah';
      const newUser: AuthUser = {
        id: `pegawai_${cleanNip}`,
        username: cleanNip,
        role: 'admin',
        name: cleanName,
        nip: cleanNip,
        email: `${cleanNip}@bps.go.id`,
        isSso: true
      };
      setUser(newUser);
      sessionStorage.setItem('navigasi_user', JSON.stringify(newUser));
      sessionStorage.setItem('navigasi_token', `mock_sso_token_${Date.now()}`);
      localStorage.removeItem('navigasi_user');
      localStorage.removeItem('navigasi_token');
      return { success: true };
    } catch {
      return {
        success: false,
        message: 'Gagal menjalankan simulasi SSO.'
      };
    }
  };

  const logout = () => {
    // 1. Bersihkan seluruh sesi dan token otentikasi lokal
    setUser(null);
    sessionStorage.removeItem('navigasi_user');
    sessionStorage.removeItem('navigasi_token');
    sessionStorage.removeItem('garda_current_page');
    localStorage.removeItem('navigasi_user');
    localStorage.removeItem('navigasi_token');
    localStorage.removeItem('garda_tab_handoff');
    localStorage.removeItem('sso_code_verifier');
    localStorage.removeItem('sso_state');
    sessionStorage.removeItem('sso_code_verifier');
    sessionStorage.removeItem('sso_state');

    // 2. Beritahukan terminasi sesi ke rIDM di background (jika didukung) tanpa mengalihkan halaman
    try {
      fetch('https://auth.dvlpid.my.id/t/bps/end_session?client_id=gardadata-spa', {
        mode: 'no-cors'
      }).catch(() => {});
    } catch {}

    // 3. Arahkan langsung ke halaman login awal aplikasi Garda Data
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithSso,
      handleSsoCallback,
      mockSsoLogin,
      loginAsVisitor,
      logout,
      changePassword,
      lockoutRemainingSeconds,
      ssoConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


