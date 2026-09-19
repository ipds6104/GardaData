import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPwaUpdater } from './lib/pwaUpdater';

// Inisialisasi pendeteksi pembaruan versi & sinkronisasi service worker
initPwaUpdater();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
