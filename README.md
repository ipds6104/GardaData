# Garda Data

Garda Data adalah sebuah ekosistem digital inovatif yang dirancang secara khusus untuk menjadi asisten andal bagi petugas pendataan dan sensus di lapangan. Aplikasi ini dibangun untuk menyelesaikan masalah klasik dalam pengumpulan data primer, seperti inkonsistensi isian, kesalahan klasifikasi (KBLI/KBJI), anomali perhitungan luas bangunan, serta kesulitan petugas mengakses pedoman kerja di lapangan yang minim sinyal internet.

Melalui arsitektur *Progressive Web App* (PWA) modern, Garda Data menjembatani gap antara kelancaran operasional (petugas lapangan) dan kebutuhan pengawasan secara *real-time* (administrator tingkat daerah/pusat). Garda Data memadukan pengumpulan data, analitik statistik lokal, direktori geospasial, dan _Learning Management System_ (LMS) dalam satu portal terpadu.

---

## 🚀 Fitur Utama & Modul Sistem

Garda Data memiliki serangkaian modul cerdas yang ditujukan bagi dua kelompok pengguna: **Petugas Lapangan** dan **Admin Pengawas**.

### 1. Modul Klasifikasi KBLI & KBJI
Mesin pencari semantik cerdas untuk mengklasifikasikan kegiatan ekonomi (KBLI 2025) dan jabatan pekerjaan (KBJI). 
- **Admin**: Dapat melihat riwayat pencarian (opsional, untuk analisis kata kunci sulit).
- **Petugas**: Memasukkan deskripsi pekerjaan responden dengan bahasa sehari-hari. Sistem akan menyajikan kode klasifikasi paling relevan tanpa perlu mengingat ribuan daftar manual.

### 2. Modul Kalkulator Luas Bangunan
Fitur canggih berbasis algoritma estimasi fisik untuk mengalkulasi luas bangunan rumah/usaha hanya berdasarkan ukuran panjang x lebar atau luas area referensi, demi menghindari "data anomali" (misalnya: luas lantai dicatat 10 meter namun memiliki 5 kamar tidur).
- **Admin**: Dashboard untuk memonitor hasil tangkapan gambar atau catatan kalibrasi luasan bangunan dari petugas.
- **Petugas**: Membantu memvalidasi input luas lantai bangunan secara presisi langsung di depan responden.

### 3. Modul Infrastruktur Desa
Sistem informasi geospasial dan agregasi data infrastruktur di tingkat Desa maupun Kecamatan.
- **Admin**: Memantau pergeseran jumlah infrastruktur publik (pendidikan, kesehatan, pemerintahan, ekonomi) dari setiap desa yang dientri petugas secara komprehensif hingga rekapitulasi level kecamatan.
- **Petugas**: Mendata dan memetakan titik infrastruktur (menambahkan koordinat/poligon pada peta), lengkap dengan agregasi profil fasilitas suatu wilayah desa.

### 4. Modul Imputasi Susenas-Seruti
Pusat referensi dan panduan penentuan nilai wajar (*imputation rules*) untuk survei sosial ekonomi. 
- **Admin**: -
- **Petugas**: Secara proaktif membantu petugas memberikan tebakan (*suggestion*) nilai wajar atas komoditas yang sulit dinilai responden, untuk menghindari angka _outlier_.

### 5. Laporan Pendataan (Cerdas Form)
Formulir *real-time* berbasis _Cloud_ untuk pelaporan progres pencacahan rumah tangga.
- **Admin**: Memantau sejauh mana kelengkapan data lapangan dikumpulkan secara spasial dan numerik.
- **Petugas**: Mengunggah ringkasan laporan kunjungan responden per blok sensus.

### 6. Learning Management System (LMS)
Modul E-Learning bagi petugas untuk persiapan menjelang turun ke lapangan.
- **Admin**: Merancang pelatihan, menentukan periode tanggal, menonaktifkan kelas, dan mengatur kategori elemen tautan (Absensi, Administrasi, Materi, Jadwal, Kuis) menggunakan UI dashboard.
- **Petugas**: Mengakses kumpulan tautan (materi, *pre-test*, jadwal, *zoom*) dari berbagai jenis pelatihan melalui navigasi visual UI berdesain kartu (*card* pastel) yang ramah *mobile*.

### 7. Fenomena Sosial Ekonomi
Pencatatan temuan lapangan yang belum tergambar dalam angka statistik kaku, misalnya fenomena gagal panen lokal, PHK masal, atau tren bisnis baru.
- **Admin**: Membaca rangkuman laporan (*AI Generated Summary* atau agregat) dari temuan fenomena yang terjadi.
- **Petugas**: Menginput observasi kualitatif dan menambahkan dokumentasi lapangan dengan antarmuka formulir yang responsif.

---

## 🛠 Teknologi yang Digunakan

Garda Data dikembangkan menggunakan *stack* teknologi yang modern, cepat, dan ringan:

* **Framework Frontend:** React 18 (menggunakan Vite sebagai *build tool*).
* **Styling & UI:** Tailwind CSS (dengan utility class kustom untuk palet warna interaktif).
* **Ikonografi & Animasi:** Lucide React (ikon) dan Framer Motion (transisi mulus, efek *hover*, dan navigasi *accordion*).
* **Database & BaaS:** Firebase Cloud Firestore (untuk penyimpanan data *real-time*).
* **Autentikasi:** Custom Auth Hook tersimulasi/Firebase Auth (bergantung konfigurasi di `lib/auth.ts`).
* **Peta Geospasial:** Leaflet & React-Leaflet untuk visualisasi spasial infrastruktur.

---

## ⚙️ Panduan Instalasi & Menjalankan Aplikasi

Berikut adalah langkah-langkah untuk menyiapkan *environment* pengembangan di komputer lokal Anda:

### 1. Prasyarat (*Prerequisites*)
Pastikan Anda telah menginstal:
- **Node.js** (direkomendasikan versi 18.x atau 20.x LTS)
- **NPM** atau **Yarn** atau **PNPM** sebagai *package manager*.
- Akun Google Firebase (jika ingin melakukan manajemen database sendiri).

### 2. Kloning Repositori
Clone repository ke mesin lokal Anda:
```bash
git clone https://github.com/ipds6104/GardaData.git
cd GardaData
```

### 3. Instalasi Dependensi
Jalankan perintah berikut untuk mengunduh semua modul yang dibutuhkan:
```bash
npm install
# atau
yarn install
```

### 4. Menjalankan *Development Server*
Untuk mulai menulis kode dan melihat hasil di *browser*:
```bash
npm run dev
# atau
yarn dev
```
Aplikasi akan berjalan secara otomatis di `http://localhost:5173`. Perubahan kode akan me-_refresh_ halaman secara instan (*Hot Module Replacement*).

---

## 🔧 Konfigurasi Web dan Pengembangan Aplikasi

### Konfigurasi Firebase
Aplikasi ini sangat bergantung pada Firebase Firestore untuk sinkronisasi data *real-time* (LMS, Infrastruktur, Fenomena Sosial, dll). 
1. Buat proyek baru di [Firebase Console](https://console.firebase.google.com/).
2. Aktifkan **Cloud Firestore** dan atur aturan keamanannya (*Security Rules*) untuk tahap _testing_ atau _production_.
3. Dapatkan objek `firebaseConfig`.
4. Buka direktori aplikasi Anda dan temukan berkas `src/lib/firebase.ts`. Sesuaikan nilainya dengan konfigurasi yang Anda dapatkan:
   ```typescript
   const firebaseConfig = {
     apiKey: "API_KEY_ANDA",
     authDomain: "DOMAIN_ANDA.firebaseapp.com",
     projectId: "PROJECT_ID_ANDA",
     storageBucket: "BUCKET_ANDA.appspot.com",
     messagingSenderId: "SENDER_ID",
     appId: "APP_ID"
   };
   ```

### Mode Offline & PWA
Agar tangguh di area _blank spot_, Garda Data memanfaatkan fitur bawaan Firestore (*offline persistence*). Aplikasi telah dikonfigurasi untuk menangkap kegagalan sinkronisasi dan akan menaruh data dalam antrean (cache) yang akan otomatis didorong (*push*) ketika koneksi internet kembali normal. 

---

## 👨‍💻 Panduan Pengembangan untuk Developer Lain

Jika Anda berencana berkontribusi pada repositori ini, mohon ikuti panduan arsitektur berikut:

1. **Arsitektur Direktori:**
   - `src/components/`: Berisi semua komponen React. Usahakan satu komponen utama per file (misal `LMSModule.tsx`, `InfrastructureModule.tsx`).
   - `src/lib/`: Berisi skrip utilitas seperti `firebase.ts` (koneksi DB), `auth.ts` (konteks autentikasi pengguna), dan _helpers_ lainnya.
   - `src/data/`: Berisi data absolut (*static dummy/offline seeders*).

2. **Aturan State Management:**
   Aplikasi menggunakan pola manajemen _state_ lokal melalui `useState` dan _context_ melalui `useContext`. Hindari penggunaan Redux kecuali jika kompleksitas data lintas-modul benar-benar membutuhkannya. Tarik data dari API sedekat mungkin ke komponen yang membutuhkannya menggunakan _hook_ standar React. Khusus untuk modul Luas Bangunan, data kini ditarik dari *backend* MySQL kita.

3. **Backend API (Node.js & MySQL):**
   - Modul Luas Bangunan telah bermigrasi sepenuhnya ke arsitektur *self-hosted* menggunakan Node.js dan MySQL untuk menghindari limitasi kuota pembacaan Firestore.
   - Kode *backend* dapat ditemukan di direktori `/backend`. Pastikan *environment variables* (seperti `DB_HOST`, `DB_USER`, `DB_PASSWORD`) terisi dengan benar merujuk ke database MySQL.
   - Pada aplikasi *frontend* Coolify Anda, tentukan alamat server backend menggunakan *environment variable* `VITE_API_URL` (contoh: `VITE_API_URL=https://api.garda-data.com`).

4. **Styling (Tailwind CSS):**
   - Tetap gunakan standardisasi *utility-classes* dari Tailwind CSS.
   - Pastikan warna komponen responsif. Referensi warna prioritas proyek ini adalah `slate`, `primary` (biasanya biru), `emerald`, `amber`, `rose`.

5. **Pull Request Workflow:**
   - _Branching_: Buat cabang fitur dari `main` dengan format `feature/nama-fitur` atau `fix/nama-perbaikan`.
   - _Commit_: Gunakan pesan _commit_ yang deskriptif.

---

## 👤 Kreator & Kontributor Utama

Aplikasi **Garda Data** digagas dan dikembangkan oleh:
- **[Ahmad Rahman](https://github.com/ahmadrahman79)** (Kreator / *Lead Developer*)

Segala bentuk pertanyaan, umpan balik, atau saran perbaikan dapat langsung diajukan melalui profil GitHub di atas atau dengan membuat *Issue* pada repositori ini.

---

> "Sebuah instrumen pencacahan yang baik tidak hanya bergantung pada metodologi, tetapi juga seberapa mudah dan manusiawi alat tersebut digunakan oleh petugas di lapangan." - **Garda Data Core Team**
