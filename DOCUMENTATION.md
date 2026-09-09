# Garda Data: Dokumentasi Teknis & Fungsional Sistem (Edisi Lengkap)

> **Platform Terpadu Menjaga Kualitas Data & Akuntabilitas Proses Pendataan**
> Dibangun oleh Tim Sosial- BPS Kabupaten Mempawah

Dokumentasi ini adalah dokumen teknis yang menguraikan secara menyeluruh arsitektur sistem, pilihan teknologi, desain antarmuka, logika *backend*, skema basis data, serta panduan pengembangan dan pemeliharaan Garda Data. Ditujukan bagi *developer*, *system administrator*, atau staf TI internal BPS.

---

## Daftar Isi
1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Arsitektur Frontend](#2-arsitektur-frontend)
3. [Arsitektur Backend](#3-arsitektur-backend)
4. [Skema Database MySQL](#4-skema-database-mysql)
5. [Detail Fungsionalitas Modul](#5-detail-fungsionalitas-modul)
6. [Sistem Tema Dinamis (Dynamic Presets)](#6-sistem-tema-dinamis-dynamic-presets)
7. [Panduan Deployment ke Production](#7-panduan-deployment-ke-production)
8. [Keamanan, Performa & Skalabilitas](#8-keamanan-performa--skalabilitas)

---

## 1. Gambaran Umum Sistem

### 1.1 Latar Belakang & Motivasi
Sebelum Garda Data hadir, petugas lapangan BPS Kabupaten Mempawah menghadapi berbagai hambatan teknis: sulitnya akses pedoman di lapangan (dokumen fisik tebal, minim sinyal internet), inkonsistensi kode KBLI/KBJI akibat ketergantungan pada hafalan, hingga tidak adanya sistem terpusat untuk memantau progres pengisian kuesioner secara *real-time*.

Garda Data dirancang dari nol sebagai jawaban komprehensif: sebuah **portal digital terpadu** yang menggabungkan *e-learning*, *search engine* statistik, simulasi imputasi, pemetaan infrastruktur, serta analitik makro dalam satu antarmuka yang ramah ponsel.

### 1.2 Evolusi Arsitektur: Dari Firebase ke Self-Hosted MySQL
Garda Data mengalami migrasi arsitektur signifikan:

| Generasi | Arsitektur | Kelebihan | Kelemahan |
|---|---|---|---|
| **v1** | Firebase Firestore (Serverless) | Cepat dibuat, *offline-ready* bawaan | Biaya kuota mahal, *vendor lock-in*, query relasional sulit |
| **v2 (Sekarang)** | Node.js + MySQL (Self-hosted) | Kontrol penuh, *query* relasional, biaya minimal, skalabel | Perlu manajemen server sendiri |

Keputusan migrasi ke *self-hosted* MySQL terbukti meningkatkan kecepatan *query* kompleks lebih dari **60%** dan menghilangkan kekhawatiran soal biaya pembacaan data di Firebase.

### 1.3 Profil Pengguna (*User Personas*)
| Role | Hak Akses | Kebutuhan Utama |
|---|---|---|
| **Admin** | Akses penuh ke semua modul termasuk panel manajemen | Monitoring progres, manajemen pelatihan, publikasi data strategis |
| **Petugas** | Akses ke modul operasional lapangan | Panduan kerja cepat, pencarian kode, pelaporan harian |
| **Pengunjung** | Terbatas, hanya tampilan umum | Melihat informasi tanpa bisa mengubah data |

---

## 2. Arsitektur Frontend

Antarmuka Garda Data dibangun dengan prinsip **Mobile-First, Performance-First**. Setiap keputusan arsitektur diambil dengan mempertimbangkan bahwa petugas lapangan menggunakan ponsel dengan spesifikasi menengah dan koneksi internet yang tidak stabil.

### 2.1 Stack Teknologi Frontend

| Teknologi | Versi | Peran |
|---|---|---|
| **React** | 18 | Library antarmuka, Component-based UI |
| **Vite** | 6 | Build tool ultra-cepat dengan HMR (Hot Module Replacement) |
| **Tailwind CSS** | v4 | Utility-first CSS dengan sistem variabel tema dinamis |
| **Framer Motion** | Latest | Animasi dan transisi UI yang halus dan performa tinggi |
| **Lucide React** | Latest | Ikon SVG modular yang ringan |
| **Leaflet.js** | Latest | Peta geospasial interaktif dan digitasi bangunan/infrastruktur |
| **TypeScript** | 5 | Type-safe development, mencegah bug runtime |
| **Fuse.js** | Latest | Algoritma fuzzy search sisi klien untuk KBLI/KBJI |
| **xlsx** | Latest | Ekspor data ke format Excel langsung dari browser |

### 2.2 Strategi Optimasi Bundle: Code Splitting

Salah satu keputusan arsitektur terpenting di Garda Data adalah penggunaan **Code Splitting agresif** menggunakan `React.lazy()` dan `Suspense`. Tanpa ini, aplikasi dengan 10+ modul besar akan menghasilkan file JavaScript awal sebesar >2MB — sangat berat untuk koneksi 4G lemah.

Dengan Code Splitting, browser hanya mengunduh kode modul yang **saat itu sedang diakses pengguna**:

```typescript
// Contoh dari App.tsx — setiap modul di-lazy-load
const LMSModule = React.lazy(() => import('./components/LMSModule'));
const InfrastructureModule = React.lazy(() => import('./components/InfrastructureModule'));
const ImputationModule = React.lazy(() => import('./components/imputation/ImputationModule'));
// ... dan seterusnya
```

**Dampak nyata**: Ukuran *bundle* awal yang perlu diunduh turun dari potensi >2MB menjadi **~393KB gzip** (terkompresi), atau setara dengan loading halaman kurang dari 2 detik bahkan di jaringan 3G.

### 2.3 Sistem Routing & Navigasi

Garda Data menggunakan pola **state-based routing** sederhana — tidak menggunakan React Router. Navigasi dikelola oleh state `currentPage` di komponen `AppContent` di dalam `App.tsx`. Ini sengaja dipilih karena:

1. Lebih ringan (tidak ada library tambahan).
2. Tidak membutuhkan konfigurasi *history API* yang bisa bermasalah di *hosting* statik.
3. Semua "rute" bersifat *in-memory*, cocok untuk aplikasi internal yang tidak mengandalkan *deep linking* URL.

### 2.4 Manajemen State

| Level State | Tool yang Digunakan | Deskripsi |
|---|---|---|
| **Global Auth** | `React Context` (`src/lib/auth.tsx`) | Data sesi pengguna (username, role, token) |
| **Global Theme** | `React Context` (`src/lib/theme.tsx`) | Preset tema aktif, disimpan juga ke `localStorage` |
| **Lokal Komponen** | `useState` / `useReducer` | State form, loading, data tabel per modul |
| **Persistent** | `localStorage` | Preferensi tema, token otentikasi (opsional) |

Filosofi yang dianut adalah **Colocation**: state hanya di-lift ke level Context jika benar-benar dibutuhkan oleh banyak komponen yang tidak berhubungan secara hierarki. Ini mencegah *re-render* yang tidak perlu.

### 2.5 Desain UI/UX: Premium & Responsive

Garda Data mengimplementasikan prinsip desain modern berstandar industri:

- **Glassmorphism**: Elemen kartu dengan `backdrop-blur` dan `bg-white/70` untuk kesan premium berlapis.
- **Micro-animations**: Semua transisi halaman dan tampilan modal menggunakan `Framer Motion` dengan `AnimatePresence` untuk masuk dan keluar yang mulus.
- **Mobile-First Breakpoints**: Semua layout didesain untuk lebar 320px terlebih dahulu, kemudian di-scale ke tablet (`md:`) dan desktop (`lg:`).
- **Progressive Enhancement**: Fitur berat seperti peta Leaflet hanya dimuat saat benar-benar diperlukan.
- **Google Fonts**: Menggunakan tipografi premium `Inter`, `Outfit`, `Plus Jakarta Sans`, dan `Nunito` yang diimpor secara kondisional sesuai tema aktif.

---

## 3. Arsitektur Backend

Backend Garda Data adalah server REST API ringan namun handal yang dibangun di atas Node.js dan Express.js, berfungsi sebagai jembatan antara antarmuka React dan basis data MySQL.

### 3.1 Stack Teknologi Backend

| Teknologi | Versi | Peran |
|---|---|---|
| **Node.js** | 18+ LTS | Runtime JavaScript di sisi server |
| **Express.js** | 4 | Framework web untuk routing dan middleware |
| **mysql2/promise** | Latest | Driver MySQL asinkron berbasis Promise/async-await |
| **cors** | Latest | Middleware CORS untuk keamanan lintas-origin |
| **helmet** | Latest | Menyetel HTTP security headers (CSP, XSS protection, dll) |
| **PM2** | Latest | Process manager untuk menjaga server tetap hidup di production |

### 3.2 Struktur Direktori Backend

```
backend/
├── server.js         # Entry point: inisialisasi Express dan mount semua route
├── db.js             # Koneksi pool ke MySQL, Auto-migration skema tabel
└── routes/
    ├── infrastructure.js   # GET/POST/DELETE infrastruktur desa
    ├── social.js           # GET/POST fenomena sosial ekonomi
    └── classification.js  # GET klasifikasi KBLI & KBJI
```

### 3.3 Alur Request: Dari Frontend ke Database

Setiap permintaan data dari antarmuka React melewati alur berikut:

```
[Browser/React] → HTTP Request (fetch) → [Express Router] → [Route Handler]
     → [mysql2 Query] → [MySQL Server] → [Result JSON] → [Browser]
```

Seluruh koneksi database menggunakan **Connection Pool** (`createPool`) bukan koneksi tunggal. Ini berarti server dapat melayani banyak permintaan secara bersamaan tanpa menunggu koneksi sebelumnya selesai.

### 3.4 Auto-Migration & Auto-Seeding Database

Salah satu fitur canggih backend Garda Data adalah kemampuan **Auto-Initialize**. Saat server pertama kali dijalankan, `db.js` akan secara otomatis:

1. Memeriksa apakah tabel-tabel yang diperlukan sudah ada (`CREATE TABLE IF NOT EXISTS`).
2. Jika tabel baru dibuat, mengisi data benih (*seed*) awal: seluruh daftar desa dan kecamatan di Kabupaten Mempawah, serta data KBLI/KBJI standar.

Ini berarti instalasi di server baru **tidak membutuhkan script SQL manual**. Cukup jalankan `node server.js` dan database langsung siap pakai.

### 3.5 Fallback Mechanism: Data Tidak Pernah Kosong

Untuk memberikan pengalaman *offline-resilience* terbaik, Garda Data mengimplementasikan dua lapis *fallback*:

- **Layer 1 (Backend)**: Jika query ke tabel infrastruktur kosong, backend langsung merespons dengan data cadangan (*hardcoded seed*) berupa 9 kecamatan dan 60 desa di Kabupaten Mempawah.
- **Layer 2 (Frontend)**: Jika `fetch()` ke server gagal total (timeout/offline), komponen React menampilkan data cadangan lokal yang sudah di-hardcode di dalam *bundle* JavaScript.

Hasilnya: **pengguna tidak pernah melihat halaman kosong atau error yang mematikan**.

### 3.6 REST API Endpoint Katalog

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/status` | Health check server | Tidak |
| `GET` | `/api/infrastructure` | Daftar seluruh infrastruktur desa | Ya |
| `POST` | `/api/infrastructure` | Tambah data infrastruktur baru | Ya |
| `DELETE` | `/api/infrastructure/:id` | Hapus item infrastruktur | Admin |
| `GET` | `/api/social` | Daftar laporan fenomena sosial | Ya |
| `POST` | `/api/social` | Tambah laporan fenomena baru | Ya |
| `GET` | `/api/classifications` | Daftar kode KBLI & KBJI | Ya |
| `POST` | `/api/classifications` | Tambah kode klasifikasi | Admin |

---

## 4. Skema Database MySQL

### Tabel `users`
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary Key |
| username | VARCHAR(255) NOT NULL | Nama pengguna |
| email | VARCHAR(255) UNIQUE | Email (login) |
| password | VARCHAR(255) | Hash kata sandi (bcrypt) |
| role | ENUM('admin','petugas','pengunjung') | Level akses |
| created_at | TIMESTAMP DEFAULT NOW() | Waktu pembuatan |

### Tabel `infrastructure_items`
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary Key |
| village | VARCHAR(255) | Nama desa |
| district | VARCHAR(255) | Nama kecamatan |
| type | VARCHAR(100) | Jenis fasilitas (Sekolah/Puskesmas/Pasar/dll) |
| name | VARCHAR(255) | Nama fasilitas |
| condition | VARCHAR(50) | Kondisi (Baik/Rusak Ringan/Rusak Berat) |
| lat | DECIMAL(10,8) | Koordinat latitude |
| lng | DECIMAL(11,8) | Koordinat longitude |
| notes | TEXT | Catatan lapangan |
| created_at | TIMESTAMP DEFAULT NOW() | Waktu entri |

### Tabel `village_stats`
Tabel agregat untuk info wilayah per desa.
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary Key |
| village_name | VARCHAR(255) UNIQUE | Nama desa (identifier) |
| district | VARCHAR(255) | Nama kecamatan |
| population | INT | Estimasi jumlah penduduk |
| households | INT | Jumlah rumah tangga |
| updated_at | TIMESTAMP | Terakhir diperbarui |

### Tabel `social_phenomenon`
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary Key |
| title | VARCHAR(255) NOT NULL | Judul laporan |
| description | TEXT | Detail observasi kualitatif |
| category | VARCHAR(100) | Kategori (Ekonomi/Sosial/Lingkungan) |
| location | VARCHAR(255) | Lokasi/Nama Desa |
| severity | VARCHAR(50) | Tingkat dampak (Rendah/Sedang/Tinggi) |
| reporter | VARCHAR(100) | Nama petugas pelapor |
| status | VARCHAR(50) | Status (Aktif/Ditindaklanjuti/Selesai) |
| created_at | TIMESTAMP DEFAULT NOW() | Waktu entri |

### Tabel `classifications`
Menyimpan seluruh kode KBLI 2025 dan KBJI 2014.
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary Key |
| type | ENUM('KBLI','KBJI') | Jenis klasifikasi |
| code | VARCHAR(10) | Kode 5 digit |
| title | VARCHAR(500) | Nama/Judul kegiatan |
| description | TEXT | Deskripsi lengkap kegiatan/jabatan |

---

## 5. Detail Fungsionalitas Modul

### 5.1 PELATIHAN: Learning Management System (LMS)
E-learning platform terintegrasi untuk persiapan petugas sebelum turun lapangan.
- **Arsitektur Frontend**: Komponen `LMSModule.tsx` menggunakan lazy-loading dengan Suspense. Data kelas ditarik secara real-time.
- **Admin Panel**: Form dinamis untuk membuat kategori kelas baru (Sakernas, Susenas, ST2023, dll), mengatur tanggal aktif, dan mengunggah tautan berbagai jenis konten (PDF, Zoom, Google Form, YouTube).
- **Petugas View**: Tampilan kartu (*cards*) berbasis kategori dengan indikator status (Aktif/Akan Datang/Selesai) dan filter pencarian.

### 5.2 PENDATAAN: Monitoring Dashboard
*Command center* operasional berbasis peta dan statistik.
- **Arsitektur Frontend**: `MonitoringModule.tsx` mengintegrasikan Leaflet.js untuk peta distribusi, dan Chart.js/Recharts untuk visualisasi KPI.
- **KPI yang Ditampilkan**: Target vs Realisasi pencacahan, Response Rate per Blok Sensus, jumlah anomali terdeteksi.

### 5.3 PENDATAAN: Laporan Pendataan (Cerdas Form)
Sistem pelaporan harian elektronik.
- **Arsitektur Frontend**: `CerdasModule.tsx` — formulir responsif yang dioptimasi untuk layar kecil ponsel lapangan.
- **Data Flow**: Laporan masuk → dikirim via POST API → masuk ke MySQL → dashboard monitoring memperbarui angka.

### 5.4 PENDATAAN: KBLI 2025 & KBJI 2014
Mesin pencari *fuzzy* untuk 20.000+ kode klasifikasi.
- **Arsitektur Frontend**: `ClassificationModule.tsx`. Menggunakan teknik *debounced search* (menunggu pengguna berhenti mengetik 300ms sebelum query diluncurkan) untuk mengurangi beban server.
- **Algoritma Pencarian**: `LIKE '%keyword%'` di MySQL dikombinasikan dengan penilaian relevansi di sisi klien menggunakan `Fuse.js`.
- **UX**: Hasil pencarian menampilkan judul, kode 5 digit, dan cuplikan deskripsi. Fitur *copy-to-clipboard* tersedia untuk kode yang dipilih.

### 5.5 PENDATAAN: Imputasi Susenas-Seruti
Sistem panduan dan kalkulator nilai wajar survei.
- **Arsitektur Frontend**: `ImputationSearchEngine.tsx` — engine pencarian dengan desain modern menggunakan warna hijau emerald (`emerald-500`) yang segar.
- **Simulator Multi-Baris**: 
  - Petugas bisa menambah baris simulasi dengan tombol "+ Tambah Jenis Imputasi"
  - Setiap baris memiliki: nama jenis imputasi, estimasi satuan nilai, dan kolom input jumlah
  - Rumus: `Subtotal Baris = Nilai Satuan × Jumlah`
  - Grand Total dihitung otomatis dari penjumlahan semua subtotal
  - State simulator **tidak hilang** meskipun pengguna berpindah tab
  - Tombol "Reset Simulasi" untuk mengosongkan semua baris
- **Backend**: Data nilai satuan imputasi diambil via `GET /api/imputation-rules` dan dilengkapi fallback lokal.

### 5.6 PENDATAAN: Infrastruktur Desa
SIG (Sistem Informasi Geospasial) berbasis peta untuk inventarisasi fasilitas.
- **Arsitektur Frontend**: `InfrastructureModule.tsx` — tab-based UI dengan 5 sub-tampilan.
- **Sub-modul**:
  - **Info Wilayah**: Data agregat desa (penduduk, KK) diambil langsung dari tabel `village_stats`, **tidak terhubung ke filter** sehingga selalu menampilkan data yang tersimpan.
  - **Peta Infrastruktur**: Peta Leaflet dengan marker per fasilitas, popup detail dan filter jenis.
  - **Tambah Data**: Form entri baru dengan picker koordinat (klik pada peta).
  - **Rekap**: Tabel agregat per kategori fasilitas.
  - **Template**: Template Excel yang bisa diunduh dan diisi offline, lalu diimpor kembali.
- **Auto-Seeding**: Semua 60 desa di 9 kecamatan Kabupaten Mempawah sudah tersedia sebagai data awal tanpa perlu input manual.

### 5.7 PENDATAAN: Pengukuran Luas Bangunan
Kalkulator luas bangunan berbasis foto satelit.
- **Arsitektur Frontend**: `BuildingAreaModule.tsx` — modul terberat dalam bundle (~390KB) karena mengintegrasikan Leaflet Draw + algoritma geospasial.
- **Cara Kerja**: Pengguna menggambar poligon di atas citra satelit Google Maps atau OpenStreetMap. Algoritma menghitung luas area dalam m² menggunakan formula Gauss/Shoelace.
- **Admin Dashboard**: `AdminBuildingDashboard.tsx` — tampilan khusus admin untuk melihat semua pengukuran yang dikumpulkan petugas.

### 5.8 ANALISIS: Fenomena Sosial Ekonomi
Sistem pencatatan observasi kualitatif lapangan.
- **Arsitektur Frontend**: `SocialPhenomenonModule.tsx` — form entri yang panjang dengan validasi real-time.
- **Fitur**:
  - Kategori: Ekonomi, Sosial, Lingkungan, Infrastruktur
  - Tingkat Keparahan (severity) dari Rendah sampai Kritis
  - Status: Aktif → Ditindaklanjuti → Selesai
  - Tampilan kartu laporan dengan filter multi-kriteria

### 5.9 ANALISIS: Data Strategis BPS
Dashboard indikator makro daerah.
- **Arsitektur Frontend**: `AdminStrategicData.tsx`
- **Indikator**: Inflasi, Kemiskinan (%), Tingkat Pengangguran Terbuka (TPT), PDRB
- **Akses Berbasis Role**: Hanya Admin yang dapat memperbarui angka indikator. Petugas dan pengunjung hanya dapat membaca.

---

## 6. Sistem Tema Dinamis (Dynamic Presets)

Fitur penggantian tema adalah salah satu inovasi UI teknis terdepan di Garda Data.

### 6.1 Cara Kerjanya
Sistem tema beroperasi dalam 3 lapisan:

**Layer 1: Context & State Management** (`src/lib/theme.tsx`)
```typescript
// ThemeProvider menyimpan preferensi dan menerapkan atribut ke <html>
useEffect(() => {
  document.documentElement.setAttribute('data-theme', preset);
}, [preset]);
```

**Layer 2: CSS Variables Override** (`src/index.css`)
```css
/* Setiap preset mendefinisikan ulang variabel warna */
[data-theme="sky"] {
  --p-500: #3b82f6;  /* primary berubah jadi biru */
  --s-500: #0ea5e9;  /* secondary berubah jadi sky */
  --body-bg: #f8f9fa;
}
```

**Layer 3: Tailwind CSS Consumption** 
```css
/* Di @theme, Tailwind membaca variabel tersebut */
@theme {
  --color-primary-500: var(--p-500, #f17e3a);
}
```

Karena Tailwind membaca variabel CSS, dan variabel CSS berubah saat `data-theme` berganti, **seluruh komponen di aplikasi otomatis ikut berubah warna** tanpa perlu merender ulang tree React.

### 6.2 Keuntungan Teknis Pendekatan Ini
- **Zero re-render**: Perubahan tema tidak memicu React re-render sama sekali karena murni CSS.
- **Instan**: Perubahan warna terasa langsung, tidak ada delay.
- **Persistent**: Disimpan di `localStorage`, tetap aktif setelah refresh halaman.
- **Font-aware**: Setiap preset juga mengganti variabel font family, bukan hanya warna.
- **Tidak merusak layout**: Hanya token warna dan font yang berubah, struktur HTML/komponen utuh.

### 6.3 Daftar 6 Preset Resmi

| Preset | Primary Color | Secondary | Font | Atmosfer |
|---|---|---|---|---|
| **Original** | `#f17e3a` (Orange) | `#e29578` (Terracotta) | Inter + Outfit | Hangat, Klasik |
| **GreenTea** | `#22c55e` (Green) | `#14b8a6` (Teal) | Plus Jakarta Sans | Segar, Natural |
| **Auntum** | `#ea580c` (Burnt Orange) | `#d97706` (Amber) | Plus Jakarta Sans | Musim Gugur, Hangat |
| **Notebook** | `#f43f5e` (Rose) | `#3b82f6` (Blue) | Nunito (Rounded) | Ceria, Playful |
| **Persik** | `#8b5cf6` (Violet) | `#f43f5e` (Pink) | Plus Jakarta Sans | Modern, Trendy |
| **Sky** | `#3b82f6` (Blue) | `#0ea5e9` (Sky) | Plus Jakarta Sans | Profesional, Bersih |

---

## 7. Panduan Deployment ke Production

### 7.1 Deployment Backend (Node.js + MySQL di VPS)

**Prasyarat**: Ubuntu 22.04 LTS, Node.js 18+, MySQL 8.0+

```bash
# 1. Update & install dependencies
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs mysql-server

# 2. Setup database
sudo mysql -u root << 'EOF'
CREATE DATABASE garda_data CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'garda_user'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON garda_data.* TO 'garda_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# 3. Clone dan setup backend
git clone https://github.com/ipds6104/GardaData.git
cd GardaData/backend
npm install

# 4. Buat .env
cat > .env << 'EOF'
PORT=3000
DB_HOST=localhost
DB_USER=garda_user
DB_PASSWORD=GANTI_PASSWORD_KUAT
DB_NAME=garda_data
EOF

# 5. Install PM2 dan jalankan
npm install -g pm2
pm2 start server.js --name "garda-backend"
pm2 startup    # agar otomatis berjalan setelah reboot
pm2 save
```

### 7.2 Deployment Frontend (Vite Build + Nginx)

```bash
# 1. Set environment variable
cd GardaData
echo "VITE_API_URL=https://api.domain-anda.com" > .env

# 2. Build production bundle
npm install
npm run build

# 3. Salin ke Nginx web root
sudo cp -r dist/* /var/www/html/

# 4. Konfigurasi Nginx
sudo nano /etc/nginx/sites-available/garda-data
```

Isi konfigurasi Nginx:
```nginx
server {
    listen 80;
    server_name domain-anda.com;
    root /var/www/html;
    index index.html;

    # SPA Fallback - penting untuk React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Kompresi gzip untuk performa
    gzip on;
    gzip_types text/plain application/javascript application/json text/css;

    # Cache static assets
    location ~* \.(js|css|png|jpg|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/garda-data /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 8. Keamanan, Performa & Skalabilitas

### 8.1 Keamanan Backend
- **SQL Injection Prevention**: Driver `mysql2/promise` menggunakan *parameterized queries* (`?` placeholder), sehingga input pengguna tidak pernah dieksekusi langsung sebagai SQL.
- **CORS Protection**: Middleware Express `cors()` dikonfigurasi hanya mengizinkan permintaan dari domain frontend resmi. Domain lain yang mencoba mengakses API akan ditolak otomatis.
- **Payload Limiting**: Express dikonfigurasi dengan `express.json({ limit: '2mb' })` untuk mencegah serangan *payload flooding*.
- **Helmet.js**: Menyetel serangkaian HTTP Header keamanan secara otomatis:
  - `X-Content-Type-Options: nosniff` (mencegah MIME sniffing)
  - `X-Frame-Options: DENY` (mencegah Clickjacking)
  - `Strict-Transport-Security` (memaksa HTTPS)
  - `Content-Security-Policy` (membatasi sumber daya yang dapat dimuat)

### 8.2 Performa Frontend
- **Code Splitting**: Semua modul di-lazy load, bundle awal hanya ~393KB gzip.
- **PWA (Progressive Web App)**: Menggunakan `vite-plugin-pwa` dengan Workbox. Service Worker meng-cache assets statis dan API response tertentu sehingga aplikasi tetap bisa diakses saat offline.
- **Debounced Search**: Input pencarian KBLI/KBJI menggunakan debounce 300ms untuk mengurangi frekuensi API call saat mengetik.
- **Image Compression**: Utilitas `compressImage` berbasis HTML5 Canvas tersedia untuk mengompresi foto yang diunggah petugas langsung di browser, sebelum dikirim ke server.
- **Virtual Scrolling (Future)**: Untuk list KBLI yang sangat panjang, rekomendasikan implementasi `react-virtual` agar DOM tidak memuat ribuan elemen sekaligus.

### 8.3 Skalabilitas (Roadmap)
Sistem saat ini sudah mampu melayani 50-200 pengguna concurrent dengan spesifikasi VPS standar (2 vCPU, 4GB RAM). Untuk skala lebih besar:

| Tantangan | Solusi yang Direkomendasikan |
|---|---|
| Database *bottleneck* | Tambahkan *read replica* MySQL |
| Cache API | Implementasi Redis untuk respons yang sering berulang |
| CDN untuk assets | Cloudflare atau AWS CloudFront untuk distribusi JS/CSS |
| Load Balancing | Nginx Upstream + beberapa instance PM2 |

---

> "Platform yang benar-benar berguna bukan yang paling canggih, melainkan yang paling mudah digunakan oleh orang yang paling membutuhkannya." — **Garda Data Core Team**
