/**
 * PWA & Browser Cache Updater
 * Memastikan aplikasi selalu mendapatkan versi terbaru dari server tanpa tertahan oleh cache lama,
 * namun tetap aman dan tidak menghapus token login ataupun data draft offline.
 */

export function initPwaUpdater() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const checkRegistrationUpdate = () => {
    if (!navigator.onLine) return;
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        reg.update().catch((err) => {
          console.warn('[PWA] Gagal memeriksa update:', err);
        });
      }
    });
  };

  window.addEventListener('load', () => {
    // 1. Cek update 1.5 detik setelah aplikasi selesai dimuat
    setTimeout(checkRegistrationUpdate, 1500);

    // 2. Cek update berkala setiap 5 menit saat user online
    setInterval(checkRegistrationUpdate, 5 * 60 * 1000);

    // 3. Cek update saat tab aplikasi kembali dibuka/fokus (visibilitychange)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkRegistrationUpdate();
      }
    });
  });
}

/**
 * Fungsi aman untuk membersihkan cache browser & service worker tanpa menghapus session login
 */
export async function clearAppCacheAndReload(): Promise<void> {
  try {
    // 1. Hapus seluruh CacheStorage (Workbox precache, runtime caches, dll)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('[PWA] CacheStorage berhasil dibersihkan');
    }

    // 2. Unregister semua Service Worker lama
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      console.log('[PWA] Service Worker berhasil di-unregister');
    }

    // 3. Bersihkan cache sesi halaman tanpa menghapus login (navigasi_token, navigasi_user)
    sessionStorage.clear();

    // 4. Muat ulang halaman dengan bypass cache menggunakan timestamp unik
    const cleanUrl = window.location.origin + window.location.pathname + '?v=' + Date.now();
    window.location.replace(cleanUrl);
  } catch (err) {
    console.error('[PWA] Gagal membersihkan cache:', err);
    window.location.reload();
  }
}

