import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, User, Lock, AlertCircle, HeartHandshake, ArrowRight, Eye, EyeOff, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../lib/auth';

export const Login: React.FC = () => {
  const { login, lockoutRemainingSeconds } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuestMessage, setShowGuestMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSeconds > 0) return;

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

  const handleGuestClick = () => {
    setShowGuestMessage(true);
    setTimeout(() => setShowGuestMessage(false), 3000);
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
            {/* Soft backdrop glow behind the logo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-400/30 via-secondary-300/30 to-accent-400/20 blur-2xl rounded-full transform scale-150 animate-pulse pointer-events-none"></div>
            <img src="/logo.png" alt="Garda Data Logo" className="relative z-10 w-32 h-32 object-contain drop-shadow-xl hover:scale-105 transition-transform" onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} />
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-black mb-6 leading-[1.1] tracking-tight font-serif">
            Selamat Datang di <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 italic">Garda Data</span>
          </h1>
          
          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-primary-100/60 shadow-xs mb-12 max-w-md">
            <p className="text-slate-600 text-lg leading-relaxed font-medium font-serif italic">
              Portal Integrasi Menjaga Kualitas Data dan Akuntabilitas Proses Pendataan
            </p>
          </div>
          
          <div className="mt-auto pt-8 border-t border-primary-200/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full shadow-sm"></div>
              <span className="font-black tracking-widest uppercase text-xs text-primary-600/80">BPS Kabupaten Mempawah</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>NIST Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanan: Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Dekorasi Sudut Kanan */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary-100/40 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-secondary-100/30 blur-[60px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md w-full relative z-10"
        >
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-8 sm:p-12 border border-slate-100">
            <div className="text-center mb-10 lg:hidden">
              <div className="mx-auto mb-6 flex justify-center">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
                  <img src="/logo.png" alt="Garda Data Logo" className="w-16 h-16 object-contain" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Garda Data</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">BPS Kabupaten Mempawah</p>
            </div>

            <div className="mb-8 hidden lg:block">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Masuk Akun</h2>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <Lock className="w-5 h-5 text-primary-600" />
                </span>
              </div>
              <p className="text-slate-500 text-sm font-medium">Silakan masukkan kredensial Anda untuk melanjutkan ke dashboard aman.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username / ID Pengguna</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLocked || isLoading}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder-slate-400 group-hover:border-slate-300 disabled:opacity-50"
                    placeholder="Masukkan username"
                    autoComplete="username"
                    required
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Kata Sandi</label>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLocked || isLoading}
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder-slate-400 group-hover:border-slate-300 disabled:opacity-50"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Lockout Warning Banner */}
              {isLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 text-amber-900 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border border-amber-200"
                >
                  <Clock className="w-5 h-5 shrink-0 text-amber-600 animate-spin" />
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
                  className="bg-rose-50 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border border-rose-200"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLocked || isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-4 mt-2 rounded-2xl font-black text-base hover:from-primary-700 hover:to-primary-600 transition-all shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2 group transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </button>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-black uppercase tracking-widest">Atau</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={handleGuestClick}
                  className="w-full bg-white border-2 border-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <HeartHandshake className="w-5 h-5 text-primary-500 group-hover:scale-110 transition-transform" />
                  Masuk sebagai Tamu
                </button>
                {showGuestMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -top-14 left-0 right-0 bg-slate-800 text-white text-xs font-bold py-3 px-4 rounded-xl text-center shadow-2xl z-20 border border-slate-700"
                  >
                    Fitur Tamu sementara dinonaktifkan untuk keamanan data.
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-slate-700"></div>
                  </motion.div>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

