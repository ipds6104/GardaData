import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Lock,
  AlertCircle,
  HeartHandshake,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  Sparkles,
  Server,
  Info,
  X,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../lib/auth';

export const Login: React.FC = () => {
  const { login, loginWithSso, mockSsoLogin, loginAsVisitor, lockoutRemainingSeconds, ssoConfigured } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const [showGuestMessage, setShowGuestMessage] = useState(false);
  const [showSsoInfoModal, setShowSsoInfoModal] = useState(false);
  const [ssoModalMessage, setSsoModalMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSeconds > 0) return;

    if (username.trim().toLowerCase() === 'admin') {
      setError('Akun Administrator BPS kini telah distandarkan menggunakan SSO rIDM. Silakan klik tombol "Login Pegawai BPS (SSO rIDM)".');
      return;
    }

    setIsLoading(true);
    setError('');

    const res = await login(username, password);
    setIsLoading(false);

    if (res.success) {
      setError('');
    } else {
      setError(res.message || 'Username atau sandi salah.');
    }
  };

  const handleSsoClick = async () => {
    setIsSsoLoading(true);
    setError('');

    const res = await loginWithSso();
    // If redirect was initiated, browser navigates to rIDM.
    // If failed, clear loading and show error message.
    if (!res.success) {
      setIsSsoLoading(false);
      setError(res.message || 'Gagal memulai otentikasi SSO.');
    }
  };

  const handleSimulatedSsoLogin = async () => {
    setIsSsoLoading(true);
    setShowSsoInfoModal(false);
    const res = await mockSsoLogin('200109122024121001', 'Ahmad Aulia Rahman');
    setIsSsoLoading(false);
    if (!res.success) {
      setError(res.message || 'Gagal menjalankan simulasi login pegawai.');
    }
  };

  const handleGuestClick = () => {
    loginAsVisitor();
  };

  const isLocked = lockoutRemainingSeconds > 0;

  return (
    <div className="min-h-screen flex bg-[var(--body-bg)] font-sans transition-colors duration-500">
      {/* Kiri: Branding & Ilustrasi */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-50/90 via-white to-secondary-50/70 p-12 items-center justify-center relative overflow-hidden border-r border-primary-100/80 transition-colors duration-500">
        {/* Elemen Dekoratif Ambient Lighting */}
        <div className="absolute inset-0 bg-primary-200 blur-[120px] opacity-30 rounded-full w-[120%] h-[120%] transform -translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 bg-secondary-200/20 blur-[100px] rounded-full w-[80%] h-[80%] pointer-events-none translate-y-1/4 translate-x-1/4"></div>
        
        {/* Subtle Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-primary-300)_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

        <div className="relative z-10 text-slate-800 max-w-xl px-4 flex flex-col h-full justify-center">
          {/* Logo dengan Adaptive Halo */}
          <div className="mb-10 inline-block self-start relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-400/30 via-secondary-300/30 to-accent-400/20 blur-2xl rounded-full transform scale-150 animate-pulse pointer-events-none"></div>
            <img
              src="/logo.png"
              alt="Garda Data Logo"
              className="relative z-10 w-32 h-32 object-contain drop-shadow-xl hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-black mb-6 leading-[1.1] tracking-tight font-serif">
            Selamat Datang di <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 italic">Garda Data</span>
          </h1>
          
          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-primary-100/60 shadow-xs mb-8 max-w-md">
            <p className="text-slate-600 text-lg leading-relaxed font-medium font-serif italic">
              Portal Integrasi Menjaga Kualitas Data dan Akuntabilitas Proses Pendataan
            </p>
          </div>

          <div className="space-y-3 max-w-md mb-8">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-600 font-semibold">
                <b className="text-slate-800">Pegawai BPS:</b> Otentikasi terpusat via SSO rIDM (Otomatis Role Administrator).
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-600 font-semibold">
                <b className="text-slate-800">Mitra Lapangan & Pengolahan:</b> Login akun mandiri non-SSO / eksternal.
              </p>
            </div>
          </div>
          
          <div className="mt-auto pt-8 border-t border-primary-200/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full shadow-sm"></div>
              <span className="font-black tracking-widest uppercase text-xs text-primary-600/80">BPS Kabupaten Mempawah</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SSO rIDM Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanan: Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary-100/40 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-secondary-100/30 blur-[60px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md w-full relative z-10"
        >
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-8 sm:p-10 border border-slate-100">
            {/* Header Mobile */}
            <div className="text-center mb-6 lg:hidden">
              <div className="mx-auto mb-4 flex justify-center">
                <div className="bg-slate-50 p-3.5 rounded-3xl border border-slate-100 shadow-inner">
                  <img src="/logo.png" alt="Garda Data Logo" className="w-14 h-14 object-contain" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Garda Data</h2>
              <p className="text-slate-500 text-xs mt-1 font-medium">BPS Kabupaten Mempawah</p>
            </div>

            <div className="mb-6 hidden lg:block">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portal Masuk</h2>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <Lock className="w-4 h-4 text-primary-600" />
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium">Pilih metode masuk sesuai dengan penugasan Anda.</p>
            </div>

            {/* SEKSI 1: LOGIN PEGAWAI BPS (SSO rIDM) */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Pegawai Organik BPS
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Role: Admin
                </span>
              </div>

              <button
                type="button"
                onClick={handleSsoClick}
                disabled={isSsoLoading || isLocked}
                className="w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-primary-600 text-white p-4 rounded-2xl font-black text-sm hover:from-blue-800 hover:to-primary-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-between group cursor-pointer border border-white/20 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-black tracking-wide leading-tight">
                      Login Pegawai BPS
                    </span>
                    <span className="block text-[11px] text-blue-100 font-medium">
                      SSO rIDM Terpusat
                    </span>
                  </div>
                </div>
                {isSsoLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowRight className="w-5 h-5 text-blue-200 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
                )}
              </button>
            </div>

            {/* DIVIDER: ATAU LOGIN NON-SSO */}
            <div className="relative flex py-2 items-center my-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                Atau Login Non-SSO / Eksternal
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* SEKSI 2: FORM LOGIN NON-SSO (PETUGAS LAPANGAN & PENGOLAHAN) */}
            <div className="mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-3 px-1">
                Petugas Pendataan & Pengolahan
              </span>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Username / ID Petugas
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLocked || isLoading}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder-slate-400 text-xs group-hover:border-slate-300 disabled:opacity-50"
                      placeholder="Username petugas (mis: petugas)"
                      autoComplete="username"
                      required
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Kata Sandi
                    </label>
                  </div>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLocked || isLoading}
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder-slate-400 text-xs group-hover:border-slate-300 disabled:opacity-50"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Lockout Warning Banner */}
                {isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 text-amber-900 p-3.5 rounded-2xl flex items-center gap-3 text-xs font-bold border border-amber-200"
                  >
                    <Clock className="w-4 h-4 shrink-0 text-amber-600 animate-spin" />
                    <div>
                      <span className="block font-black">Sistem Dikunci Sementara (Anti-Brute Force)</span>
                      <span>Silakan tunggu <b>{lockoutRemainingSeconds} detik</b> sebelum mencoba kembali.</span>
                    </div>
                  </motion.div>
                )}

                {/* Error Message Banner */}
                {error && !isLocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-bold border border-rose-200"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLocked || isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg shadow-slate-900/15 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Masuk sebagai Petugas</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Tombol Tamu */}
                <div className="relative pt-1">
                  <button
                    type="button"
                    onClick={handleGuestClick}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-100 hover:text-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <HeartHandshake className="w-4 h-4 text-slate-500" />
                    <span>Masuk sebagai Tamu</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      {/* MODAL: INFORMASI REGISTRASI SSO TIM IT & SIMULASI DEV */}
      <AnimatePresence>
        {showSsoInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl relative"
            >
              <button
                onClick={() => setShowSsoInfoModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Registrasi Client SSO rIDM
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">BPS Kabupaten Mempawah</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-600 leading-relaxed mb-6">
                <div className="bg-amber-50 text-amber-900 p-3.5 rounded-2xl border border-amber-200">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    Menunggu Client ID dari Tim IT:
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Aplikasi Garda Data telah siap 100% dengan standar OIDC rIDM. Agar redirect langsung ke SSO pusat aktif, daftarkan data berikut ke Tim IT BPS:
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-sans text-[10px] uppercase font-bold">Nama Aplikasi:</span>
                    <span className="font-bold text-slate-800">Garda Data</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[10px] uppercase font-bold">Callback / Redirect URL:</span>
                    <span className="font-bold text-primary-600 break-all">{window.location.origin}/auth/callback</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[10px] uppercase font-bold">Post-Logout URL:</span>
                    <span className="font-bold text-slate-800 break-all">{window.location.origin}</span>
                  </div>
                </div>

                <p className="text-slate-500">
                  Setelah Tim IT menerbitkan <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">RIDM_CLIENT_ID</code> dan <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">RIDM_CLIENT_SECRET</code>, pasang pada berkas <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">server/.env</code>.
                </p>
              </div>

              {/* Dev Simulation Button */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSimulatedSsoLogin}
                  className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white py-3 px-4 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Uji Coba: Simulasi Login Pegawai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSsoInfoModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
