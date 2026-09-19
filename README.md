# Garda Data

Garda Data adalah ekosistem digital terpadu yang dirancang khusus sebagai asisten andal bagi petugas pendataan, pengawas, dan pengelola kegiatan statistik di lingkungan Badan Pusat Statistik (BPS). Aplikasi ini hadir untuk menyelesaikan berbagai tantangan klasik dalam kegiatan lapangan, mulai dari manajemen instrumen kuesioner dinamis, standardisasi klasifikasi (KBLI/KBJI), simulasi nilai wajar (imputasi), kalkulasi luas bangunan geospasial, hingga pemantauan progres lapangan secara *real-time*.

Melalui arsitektur *Progressive Web App* (PWA) modern dan *Self-Hosted MySQL*, Garda Data menyatukan kemudahan operasional di lapangan dengan fleksibilitas pengawasan berbasis awan (*cloud*) dan integrasi Google Sheet dua arah.

---

## 🚀 Fitur Utama & Modul Sistem

Garda Data menghadirkan serangkaian modul komprehensif untuk mendukung seluruh siklus kegiatan pendataan:

### 1. Manajemen Laporan Pendataan Lapangan (Dynamic Forms & Google Sheet 2 Arah)
Modul unggulan untuk penyusunan dan pengisian instrumen survei lapangan bergaya **AppSheet**:
- **Pembuat Formulir Dinamis (Admin Form Builder):** Admin dapat membuat kegiatan (misal: *Susenas 2026*) dan berbagai formulir di dalamnya (misal: *Pencacahan* & *Pemeriksaan*).
- **Tipe Data Lengkap:** Mendukung variabel Teks, Angka, Tanggal, Jam, Lokasi Geotagging GPS, dan Foto/Berkas yang diunggah langsung ke server.
- **Kustomisasi Ikon Visual:** Dilengkapi pemilih 17 ikon Lucide tematik untuk membedakan kegiatan dan formulir secara visual.
- **Hierarki Pengelompokan Berjenjang (Level 1–4):** Mengelompokkan tampilan sampel responden petugas berdasarkan hierarki wilayah (misal: *Kecamatan > Desa > SLS*).
- **Koneksi Google Sheet Interaktif 2 Arah (Ramah Pengguna Awam):**
  - **Arah 1 (Sheet → Aplikasi):** Tarik data master sasaran responden langsung dari link Google Sheet publik tanpa batas kuota dan tanpa instalasi script.
  - **Arah 2 (Aplikasi → Sheet):** Kiriman jawaban petugas, titik GPS, dan status laporan otomatis terisi ke baris Google Sheet secara *real-time* via Webhook Apps Script.
- **Mode Petugas Lapangan (AppSheet Mobile View):** Antarmuka ramah ponsel dengan indikator persentase kelengkapan isian (% progress bar), penyimpanan draf *offline-resilient*, dan navigasi *bottom tab* dinamis.
- **Monitoring & Rekap Data:** Dashboard pemantauan jumlah target, draf, dan laporan masuk beserta tabel rekap yang dapat dicari dan difilter.

### 2. Modul Penilaian Mitra Statistik
Sistem evaluasi berkala kinerja mitra lapangan (pendata dan pengawas) dengan penilaian multi-kriteria (kualitas data, kedisiplinan, ketepatan waktu, dan integritas kerja sama) serta validasi wajib pengisian catatan kualitatif lapangan (minimal 10 karakter) untuk standardisasi rekam jejak mitra.

### 3. Modul Klasifikasi KBLI 2025 & KBJI 2014
Mesin pencari pintar berbasis basis data relasional untuk mengklasifikasikan kegiatan ekonomi (KBLI 2025) dan jabatan pekerjaan (KBJI) menggunakan teknik *fuzzy search* dan *debounced query*.

### 4. Modul Kalkulator Luas Bangunan Geospasial
Fitur digitasi poligon berbasis citra satelit (Leaflet.js & Leaflet Draw) untuk mengestimasi luas bangunan tempat tinggal/usaha secara otomatis menggunakan formula geospasial Gauss/Shoelace, dilengkapi dashboard admin.

### 5. Modul Imputasi Susenas-Seruti
Pusat referensi dan simulator perhitungan nilai wajar (*imputation rules*) untuk survei sosial ekonomi. Dilengkapi kalkulator multi-baris dinamis yang otomatis menghitung subtotal per komoditas dan Grand Total tanpa kehilangan data saat berpindah tab.

### 6. Modul Infrastruktur Desa & Info Wilayah
Sistem Informasi Geospasial (SIG) dan direktori fasilitas publik untuk 60 desa di 9 kecamatan Kabupaten Mempawah. Dilengkapi fitur *auto-seeding* data cadangan agar laman tidak pernah kosong saat terjadi gangguan koneksi.

### 7. Learning Management System (LMS)
Modul E-Learning bagi petugas untuk persiapan menjelang turun ke lapangan, mendukung penyematan materi dokumen PDF, rekaman video, modul pembelajaran, dan tautan briefing online.

### 8. Fenomena Sosial Ekonomi
Pencatatan observasi kualitatif lapangan (seperti gagal panen lokal, gejolak harga, bencana alam, atau fenomena ketenagakerjaan) yang terhubung langsung dengan REST API.

### 9. Dashboard Data Strategis BPS
Penyajian indikator makro utama daerah (Inflasi, Persentase Kemiskinan, Tingkat Pengangguran Terbuka/TPT, dan PDRB) dengan kontrol pembaruan data berbasis role Admin.

### 10. Pemilih Tema Dinamis (6 Dynamic Presets)
Personalisasi UI instan dengan CSS Variables dan Tailwind CSS v4 (@theme):
- **Original** (Warm Orange & Terracotta)
- **GreenTea** (Teal, Sage Green & Fresh Mint)
- **Yellow World** (Dominan Kuning Cerah, Golden Amber & Aksen Emas)
- **Notebook** (Dominan Pink Pastel, Sweet Rose Blush & Soft Magenta)
- **Persik JosJiz** (Electric Violet Lilac & Coral Peach)
- **Sky** (Healthcare Blue / Professional Crisp Blue)

---

## 🛠 Teknologi & Arsitektur Sistem

Garda Data mengadopsi arsitektur *Self-Hosted Fullstack* yang independen, cepat, dan terbebas dari *vendor lock-in*:

* **Frontend:** React 18, Vite 6, TypeScript 5, Tailwind CSS v4, Framer Motion, Lucide React, Leaflet.js, xlsx.
* **Optimasi Frontend:** Code Splitting agresif (`React.lazy` & `Suspense`) dengan ukuran bundle gzip awal ~390 KB, PWA Service Worker caching (Workbox).
* **Backend API:** Node.js & Express.js REST API dengan Connection Pooling (`mysql2/promise`), Multer file upload, Helmet security headers, dan CORS middleware.
* **Basis Data:** MySQL Relational Database dengan Auto-Migration skema tabel dan Auto-Seeding data awal.

---

## ⚙️ Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat (*Prerequisites*)
Pastikan pada komputer/server Anda telah terpasang:
- **Node.js** (Versi 18.x atau 20.x LTS)
- **NPM** atau **Yarn** / **PNPM**
- **MySQL Server** (XAMPP, Laragon, MySQL Community Server, atau Docker)

### 2. Kloning Repositori
```bash
git clone https://github.com/ipds6104/GardaData.git
cd GardaData
```

### 3. Konfigurasi Backend & Basis Data
1. Buat database MySQL baru:
   ```sql
   CREATE DATABASE garda_data CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Buka file `backend/db.js` atau sesuaikan environment variables untuk kredensial MySQL (Host, User, Password, Database).
3. Masuk ke direktori backend dan jalankan server:
   ```bash
   cd backend
   npm install
   node server.js
   ```
   *Backend akan aktif di `http://localhost:3000` dan otomatis menginisialisasi seluruh tabel yang diperlukan.*

### 4. Konfigurasi Frontend
1. Buka terminal baru pada direktori utama (`GardaData`).
2. Pastikan file `.env` memuat alamat backend:
   ```env
   VITE_API_URL=http://localhost:3000
   ```
3. Pasang dependensi dan jalankan development server:
   ```bash
   npm install
   npm run dev
   ```
4. Buka `http://localhost:5173` di peramban web Anda.

---

##  Struktur Direktori Proyek

```
GardaData/
├── backend/
│   ├── routes/
│   │   ├── classification.js   # API pencarian KBLI & KBJI
│   │   ├── infrastructure.js   # API infrastruktur & statistik desa
│   │   ├── laporan.js          # API kegiatan, form builder, records, & webhook
│   │   └── social.js           # API laporan fenomena sosial
│   ├── uploads/
│   │   └── laporan/            # Berkas & foto kuesioner lapangan
│   ├── db.js                   # MySQL Connection Pool & Auto-Migration
│   └── server.js               # Entry point Express API & Middleware
├── src/
│   ├── components/
│   │   ├── imputation/         # Modul simulator nilai wajar imputasi
│   │   ├── laporan/            # Modul admin form manager & petugas AppSheet view
│   │   ├── mitra/              # Modul penilaian mitra statistik
│   │   ├── BuildingAreaModule.tsx
│   │   ├── ClassificationModule.tsx
│   │   ├── InfrastructureModule.tsx
│   │   ├── LMSModule.tsx
│   │   ├── SocialPhenomenonModule.tsx
│   │   └── Layout.tsx
│   ├── lib/
│   │   ├── auth.tsx            # Context otentikasi & sesi pengguna
│   │   └── theme.tsx           # Context 6 dynamic theme presets
│   ├── App.tsx                 # Routing berbasis state & lazy-loading
│   └── index.css               # Token warna CSS Variables & Tailwind CSS v4
├── DOCUMENTATION.md            # Dokumentasi teknis & arsitektur komprehensif
└── README.md
```

---

## 👤 Tim Pengembang & Kontributor

- **Ahmad Rahman** ([@ahmadrahman79](https://github.com/ahmadrahman79)) - Arsitek Sistem & Lead Developer
- **Tim IPDS 6104** ([@ipds6104](https://github.com/ipds6104)) - Infrastruktur & Pengembangan Modul

---

> "Sebuah instrumen pencacahan yang baik tidak hanya bergantung pada metodologi, tetapi juga seberapa mudah dan manusiawi alat tersebut digunakan oleh petugas di lapangan." — **Garda Data Core Team**
