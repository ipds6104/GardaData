import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, User, Lock, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '../lib/auth';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      setError('');
    } else {
      setError('Username atau password salah.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-50 via-slate-50 to-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 p-10 border border-white">
          <div className="text-center mb-10">
            <div className="mx-auto mb-6 flex justify-center">
              <img src="/logo.png" alt="Garda Data Logo" className="w-20 h-20 object-contain drop-shadow-xl" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Garda Data</h1>
            <p className="text-slate-500 font-medium mt-2">BPS Kabupaten Mempawah</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                  placeholder="Masukkan username"
                  required
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-100"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-3"
            >
              <LogIn className="w-6 h-6" />
              MASUK
            </button>
          </form>
          
          <div className="mt-8 text-center text-xs font-bold text-slate-400">
            Garda Data - Platform Terpadu Menjaga Kualitas Data
          </div>
        </div>
      </motion.div>
    </div>
  );
};
