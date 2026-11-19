import { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { initPwaUpdater } from './lib/pwaUpdater';

// Inisialisasi pendeteksi pembaruan versi & sinkronisasi service worker (hanya aktif saat mode produksi/domain web)
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  initPwaUpdater();
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  handleReload = () => {
    try {
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    } catch {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              marginBottom: '16px'
            }}>!</div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0' }}>
              Terjadi Kesalahan Tampilan Aplikasi
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.6 }}>
              Aplikasi mendeteksi kendala pada pemuatan script browser. Silakan muat ulang secara bersih.
            </p>
            {this.state.error && (
              <pre style={{
                textAlign: 'left',
                backgroundColor: '#090d16',
                color: '#f87171',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '11px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                marginBottom: '20px',
                maxHeight: '140px'
              }}>
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Muat Ulang Halaman Bersih ↻
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);

// Tandai aplikasi sukses ter-mount dan batalkan watchdog splash timer
if (typeof window !== 'undefined' && (window as any).__gardaAppMounted) {
  (window as any).__gardaAppMounted();
}
