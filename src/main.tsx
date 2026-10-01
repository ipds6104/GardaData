import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { initPwaUpdater } from './lib/pwaUpdater';

// Inisialisasi pendeteksi pembaruan versi & sinkronisasi service worker
initPwaUpdater();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Tandai aplikasi sukses ter-mount dan batalkan watchdog splash timer
if (typeof window !== 'undefined' && (window as any).__gardaAppMounted) {
  (window as any).__gardaAppMounted();
}
