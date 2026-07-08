import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, User, Lock, AlertCircle, HeartHandshake, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showGuestMessage, setShowGuestMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      setError('');
    } else {
      setError('Username atau password salah.');
    }
  };

  const handleGuestClick = () => {
    setShowGuestMessage(true);
    setTimeout(() => setShowGuestMessage(false), 3000);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Kiri: Branding & Ilustrasi */}
      <div className="hidden lg:flex w-1/2 bg-[#fef9f1] p-12 items-center justify-center relative overflow-hidden border-r border-orange-100/50">
        {/* Elemen Dekoratif */}
        <div className="absolute inset-0 bg-primary-200 blur-[120px] opacity-30 rounded-full w-[120%] h-[120%] transform -translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10 text-slate-800 max-w-xl px-4 flex flex-col h-full justify-center">
          {/* Logo */}
          <div className="mb-10 inline-block self-start">
            <img src="/logo.png" alt="Garda Data Logo" className="w-32 h-32 object-contain drop-shadow-xl hover:scale-105 transition-transform" onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} />
          </div>
          
          <h1 className="text-5xl xl:text-6xl font-black mb-6 leading-[1.1] tracking-tight font-serif">
            Selamat Datang di <br/>
            <span className="text-primary-500 italic">Garda Data</span>
          </h1>
          
          <p className="text-slate-600 text-lg leading-relaxed mb-12 font-medium max-w-md font-serif italic">
            Portal Integrasi Menjaga Kualitas Data dan Akuntabilitas Proses Pendataan
          </p>
          
          <div className="mt-8 pt-10 border-t border-slate-200 flex items-center gap-5">
            <div className="w-12 h-1.5 bg-primary-400 rounded-full shadow-sm"></div>
            <span className="font-black tracking-widest uppercase text-xs text-slate-400">BPS Kabupaten Mempawah</span>
          </div>
        </div>
      </div>

      {/* Kanan: Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#F8FAFC] relative">
        {/* Dekorasi Sudut Kanan */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary-100/50 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
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

            <div className="mb-10 hidden lg:block">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Masuk Akun</h2>
              <p className="text-slate-500 text-sm font-medium">Silakan masukkan kredensial Anda untuk melanjutkan ke dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder-slate-400 group-hover:border-slate-300"
                    placeholder="Masukkan username"
                    required
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder-slate-400 group-hover:border-slate-300"
                    placeholder="••••••••"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-rose-100"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-4 mt-2 rounded-2xl font-black text-base hover:from-primary-700 hover:to-primary-600 transition-all shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2 group transform hover:-translate-y-0.5"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <div className="relative flex py-6 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-black uppercase tracking-widest">Atau</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={handleGuestClick}
                  className="w-full bg-white border-2 border-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 group"
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
                    Fitur Tamu sementara dinonaktifkan.
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
