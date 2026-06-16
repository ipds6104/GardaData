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
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 items-center justify-center relative overflow-hidden">
        {/* Elemen Dekoratif */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-400 opacity-20 blur-[80px] rounded-full translate-y-1/3 -translate-x-1/3"></div>
        
        <div className="relative z-10 text-white max-w-xl px-8">
          <div className="mb-8">
            <img src="/logo.png" alt="Garda Data Logo" className="w-20 h-20 object-contain drop-shadow-2xl" onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} />
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight tracking-tight">
            Selamat Datang di <br/><span className="text-primary-200">Garda Data</span>
          </h1>
          <p className="text-primary-100/90 text-lg leading-relaxed mb-10 font-medium">
            Satu platform terpadu untuk memudahkan petugas lapangan menjaga akurasi dan kualitas pendataan melalui sistem validasi dan pengukuran yang presisi.
          </p>
          <div className="flex items-center gap-4 text-primary-200">
            <div className="w-12 h-1 bg-primary-400/50 rounded-full"></div>
            <span className="font-bold tracking-widest uppercase text-xs">BPS Kabupaten Mempawah</span>
          </div>
        </div>
      </div>

      {/* Kanan: Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50 relative">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 sm:p-10 border border-slate-100">
            <div className="text-center mb-10 lg:hidden">
              <div className="mx-auto mb-4 flex justify-center">
                <img src="/logo.png" alt="Garda Data Logo" className="w-16 h-16 object-contain" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Garda Data</h2>
              <p className="text-slate-500 text-sm mt-1">BPS Kabupaten Mempawah</p>
            </div>

            <div className="mb-8 hidden lg:block">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Masuk Akun</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">Silakan masukkan kredensial Anda untuk melanjutkan.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
                    placeholder="Masukkan username"
                    required
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
                    placeholder="••••••••"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 text-rose-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold border border-rose-100"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-4 mt-2 rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 group"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Atau</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={handleGuestClick}
                  className="w-full bg-white border border-slate-200 text-slate-600 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <HeartHandshake className="w-5 h-5 text-primary-500" />
                  Masuk sebagai Tamu
                </button>
                {showGuestMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-12 left-0 right-0 bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg text-center shadow-lg"
                  >
                    Fitur Tamu sementara dinonaktifkan.
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
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
