import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'garda-dev-server-middleware',
        configureServer(server: any) {
          try {
            const express = require('express');

            server.middlewares.use((req: any, res: any, next: any) => {
              if (req.url && (req.url.startsWith('/api/kbli') || req.url.startsWith('/api/analytics') || req.url.startsWith('/api/mitra'))) {
                try {
                  delete require.cache[require.resolve('./server/routes/analytics')];
                  delete require.cache[require.resolve('./server/routes/kbli')];
                  delete require.cache[require.resolve('./server/routes/mitra')];
                  delete require.cache[require.resolve('./server/middleware/apiKeyAuth')];
                } catch {}

                const apiApp = express();
                apiApp.use((_req: any, res: any, nextFn: any) => {
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, x-api-key, X-API-Token, x-api-token');
                  if (_req.method === 'OPTIONS') return res.sendStatus(204);
                  nextFn();
                });
                apiApp.use(express.json());
                apiApp.use('/api/kbli', require('./server/routes/kbli'));
                apiApp.use('/api/analytics', require('./server/routes/analytics'));
                apiApp.use('/api/mitra', require('./server/routes/mitra'));
                return apiApp(req, res, next);
              }
              next();
            });
            console.log('✔ [Vite Dev] KBLI 2025, Analytics & Mitra API middleware mounted at /api/kbli, /api/analytics, and /api/mitra');
          } catch (e: any) {
            console.warn('Note on dev middleware:', e.message);
          }
        }
      },
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 5000000,
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              // Navigasi halaman HTML: NetworkFirst agar selalu mengambil versi terbaru dari server saat online
              // dan otomatis fallback ke cache lokal jika sedang offline di lapangan
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'garda-pages-cache',
                networkTimeoutSeconds: 2,
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          name: 'Garda Data',
          short_name: 'Garda Data',
          description: 'Aplikasi Survei Lapangan',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'https://gardadata.dvlpid.my.id/',
          changeOrigin: true,
          secure: false,
        }
      }
    },
  };
});
