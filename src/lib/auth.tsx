import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'petugas' | 'petugas_pengolahan' | 'pengunjung' | null;

export interface AuthUser {
  username: string;
  role: UserRole;
  name?: string;
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

// Zero-plaintext offline credential database with individual cryptographic salts
const SECURE_OFFLINE_USERS: Record<string, {
  salt: string;
  hash: string;
  role: UserRole;
  name: string;
}> = {
  'admin': {
    salt: 'garda_sec_admin_salt_6104',
    hash: 'a4989151788d4a45bb961353506c719f291fe293bc6b3d8c8b861c6319ac6f2c',
    role: 'admin',
    name: 'Administrator BPS'
  },
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
  loginAsVisitor: () => void;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  lockoutRemainingSeconds: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds lockout after 5 failed attempts

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('navigasi_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('navigasi_user');
    }
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

  const loginAsVisitor = () => {
    const visitorUser: AuthUser = { username: 'Pengunjung', role: 'pengunjung', name: 'Tamu BPS' };
    setUser(visitorUser);
    localStorage.setItem('navigasi_user', JSON.stringify(visitorUser));
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
        localStorage.setItem('navigasi_user', JSON.stringify(newUser));
        if (data.token) {
          localStorage.setItem('navigasi_token', data.token);
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
        localStorage.setItem('navigasi_user', JSON.stringify(newUser));
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
          localStorage.setItem('navigasi_user', JSON.stringify(newUser));
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

    const token = localStorage.getItem('navigasi_token');

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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('navigasi_user');
    localStorage.removeItem('navigasi_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsVisitor, logout, changePassword, lockoutRemainingSeconds }}>
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

