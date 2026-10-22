import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface AuthCallbackProps {
  onSuccess?: () => void;
  onError?: () => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onError }) => {
  const { handleSsoCallback } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasProcessedRef = React.useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const processCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || `Otorisasi SSO dibatalkan atau ditolak (${error}).`);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('Parameter kode otorisasi (code) tidak ditemukan dalam URL callback.');
        return;
      }

      const res = await handleSsoCallback(code, state || undefined);
      if (res.success) {
        setStatus('success');
        // Clean URL params to avoid re-triggering on refresh
        window.history.replaceState({}, document.title, '/');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.href = '/';
          }
        }, 1200);
      } else {
        setStatus('error');
        setErrorMessage(res.message || 'Gagal menyinkronkan akun pegawai dengan SSO rIDM.');
      }
    };

    processCallback();
  }, []);

  const handleReturnToLogin = () => {
    window.history.replaceState({}, document.title, '/');
    if (onError) {
      onError();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50/70 via-white to-secondary-50/50 p-6 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-primary-300)_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-200/30 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/80 p-8 sm:p-10 border border-slate-100 text-center relative z-10"
      >
        {/* BPS Logo & Header */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100/60 border border-primary-200 flex items-center justify-center p-3 shadow-inner">
              <img src="/logo.png" alt="Logo Garda Data" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          SSO rIDM BPS Kabupaten Mempawah
        </h1>
        <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-6">
          Autentikasi Terpusat Pegawai
        </p>

        {status === 'loading' && (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-slate-800">Menghubungkan Akun Pegawai...</p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Memvalidasi tiket rIDM dan menyinkronkan hak akses Administrator Garda Data.
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-black text-emerald-800">Autentikasi Berhasil!</p>
              <p className="text-xs text-slate-500">
                Selamat datang kembali. Mengalihkan Anda ke portal Garda Data...
              </p>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 py-2"
          >
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-rose-800">Gagal Masuk via SSO</p>
              <div className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold border border-rose-200 text-left leading-relaxed">
                {errorMessage}
              </div>
            </div>
            <button
              onClick={handleReturnToLogin}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Login</span>
            </button>
          </motion.div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>OIDC 2.0 • Zero-Trust Token Verification</span>
        </div>
      </motion.div>
    </div>
  );
};

