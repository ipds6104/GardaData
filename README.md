# Garda Data

Garda Data adalah sebuah ekosistem digital inovatif yang dirancang secara khusus untuk menjadi asisten andal bagi petugas pendataan dan sensus di lapangan. Aplikasi ini dibangun untuk menyelesaikan masalah klasik dalam pengumpulan data primer, seperti inkonsistensi isian, kesalahan klasifikasi (KBLI/KBJI), anomali perhitungan luas bangunan, serta kesulitan petugas mengakses pedoman kerja di lapangan yang minim sinyal internet.

Melalui arsitektur *Progressive Web App* (PWA) modern, Garda Data menjembatani gap antara kelancaran operasional (petugas lapangan) dan kebutuhan pengawasan secara *real-time* (administrator tingkat daerah/pusat). Garda Data memadukan pengumpulan data, analitik statistik lokal, direktori geospasial, dan _Learning Management System_ (LMS) dalam satu portal terpadu.

---

## 🚀 Fitur Utama & Modul Sistem

Garda Data memiliki serangkaian modul cerdas yang ditujukan bagi dua kelompok pengguna: **Petugas Lapangan** dan **Admin Pengawas**.

### 1. Pemilih Tema Dinamis (Dynamic Presets)
Fitur personalisasi UI yang memungkinkan pengguna mengubah skema warna dan tipografi secara instan tanpa mengganggu tata letak. Tersedia 6 preset premium:
- **Original** (Warm Orange & Terracotta)
- **GreenTea** (Teal, Sage Green & Fresh Mint)
- **Auntum** (Caramel, Burnt Orange & Golden Amber)
- **Notebook** (Pastel Playful Rose-Peach, Lavender & Mint)
- **Persik** (Electric Violet Lilac & Coral Peach)
- **Sky** (Healthcare Blue / Professional Crisp Blue)

### 2. Modul Klasifikasi KBLI & KBJI
Mesin pencari cerdas berbasis database relasional untuk mengklasifikasikan kegiatan ekonomi (KBLI 2025) dan jabatan pekerjaan (KBJI). Memungkinkan petugas mencari kode paling relevan menggunakan bahasa sehari-hari.

### 3. Modul Kalkulator Luas Bangunan
Fitur canggih berbasis algoritma estimasi fisik untuk mengalkulasi luas bangunan rumah/usaha berdasarkan tangkapan spasial satelit (Leaflet.js) atau referensi hitungan.

### 4. Modul Infrastruktur Desa
Sistem informasi geospasial dan agregasi data infrastruktur di tingkat Desa maupun Kecamatan Kabupaten Mempawah.
- Dilengkapi dengan sistem *auto-seeding* (data cadangan desa) agar laman tidak pernah kosong jika koneksi *database* gagal.

### 5. Modul Imputasi Susenas-Seruti
Pusat referensi dan simulasi nilai wajar (*imputation rules*) untuk survei sosial ekonomi. 
- **Simulator Multi-Baris**: Petugas dapat menambahkan banyak jenis imputasi dalam satu tabel, mengisi jumlah kasus per baris, dan sistem akan otomatis menghitung subtotal dan Grand Total secara akurat.

### 6. Laporan Pendataan (Cerdas Form)
Formulir *real-time* berbasis _Cloud_ untuk pelaporan progres pencacahan rumah tangga.

### 7. Learning Management System (LMS)
Modul E-Learning bagi petugas untuk persiapan menjelang turun ke lapangan dengan desain UI responsif berkonsep *cards*.

### 8. Fenomena Sosial Ekonomi
Pencatatan temuan lapangan seperti fenomena gagal panen lokal, PHK masal, atau tren bisnis baru yang terintegrasi dengan arsitektur REST API.

---

## 🛠 Teknologi & Arsitektur Performa

Garda Data kini telah sepenuhnya bermigrasi dari arsitektur *Serverless (Firebase)* menuju ekosistem infrastruktur relasional mandiri (*Self-hosted MySQL*):

* **Framework Frontend:** React 18 (menggunakan Vite). Dilengkapi dengan **Code Splitting (React.lazy & Suspense)**.
* **Performa & UI/UX:** Menggunakan `Tailwind CSS v4` dengan fitur `@theme` dan variabel CSS dinamis untuk pergantian tema secara instan tanpa membebani peramban. Ikon menggunakan `Lucide React` dan animasi dengan `Framer Motion`.
* **Backend API (Node.js & Express):** Menggunakan pola REST API untuk menghubungkan antarmuka React dengan basis data.
* **Database & BaaS:** MySQL Relational Database. Telah menyingkirkan Firestore/Firebase guna menghindari *vendor lock-in* dan memberikan performa _query_ yang lebih terstruktur.
* **Peta Geospasial:** Leaflet & React-Leaflet untuk digitasi dan navigasi infrastruktur.

---

## ⚙️ Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat (*Prerequisites*)
Pastikan Anda telah menginstal:
- **Node.js** (direkomendasikan versi 18.x atau 20.x LTS)
- **NPM** atau **Yarn** atau **PNPM**
- **MySQL Server** (XAMPP/MAMP/Laragon atau Docker)

### 2. Kloning Repositori
```bash
git clone https://github.com/ipds6104/GardaData.git
cd GardaData
```

### 3. Konfigurasi Backend & Database
1. Buat database MySQL baru, contoh: `create database garda_data;`
2. Masuk ke direktori `backend/` dan sesuaikan file `db.js` dengan kredensial database Anda (Host, User, Password, Database Name).
3. Jalankan server backend:
   ```bash
   cd backend
   npm install
   node server.js
   ```
   Backend akan berjalan di `http://localhost:3000`. Saat pertama kali dijalankan, backend akan otomatis membuat struktur tabel yang dibutuhkan.

### 4. Konfigurasi Frontend
1. Buka terminal baru, kembali ke direktori *root* (GardaData).
2. Pastikan file `.env` memiliki variabel `VITE_API_URL=http://localhost:3000`.
3. Jalankan aplikasi React:
   ```bash
   npm install
   npm run dev
   ```
4. Buka `http://localhost:5173` di peramban Anda.

---

## 👨‍💻 Panduan Pengembangan untuk Developer Lain

Jika Anda berencana berkontribusi, mohon ikuti panduan arsitektur berikut:

1. **Arsitektur Direktori:**
   - `src/components/`: Berisi semua komponen antarmuka React.
   - `src/lib/`: Berisi skrip utilitas seperti `theme.ts` (Theme Context), `auth.ts` (Otentikasi).
   - `backend/`: Direktori REST API Node.js dan manajemen koneksi database MySQL (`db.js`, `server.js`, `/routes`).

2. **Styling (Tailwind CSS v4):**
   - Tetap gunakan standardisasi *utility-classes*.
   - Saat membuat desain komponen UI, hindari menanamkan kode warna heksadesimal statis (contoh: `bg-[#fef9f1]`). Gunakan token CSS bawaan tema (seperti `bg-primary-50` atau `text-secondary-600`) agar warna komponen otomatis beradaptasi bila pengguna mengganti tema.

3. **Pull Request Workflow:**
   - _Branching_: Buat cabang fitur dari `main` dengan format `feature/nama-fitur` atau `fix/nama-perbaikan`.
   - _Commit_: Gunakan pesan _commit_ yang deskriptif.

---

## 👤 Kreator & Kontributor Utama

Terima kasih kepada seluruh pihak yang telah mencurahkan waktu dan pikiran untuk membangun sistem ini.

- **Ahmad Rahman** ([@ahmadrahman79](https://github.com/ahmadrahman79)) - Arsitek Utama & Lead Developer
- **Tim IPDS 6104** ([@ipds6104](https://github.com/ipds6104)) - Infrastruktur & Deployment

Segala bentuk pertanyaan, umpan balik, atau saran perbaikan dapat langsung diajukan melalui profil GitHub di atas atau dengan membuat *Issue* pada repositori ini.

---

> "Sebuah instrumen pencacahan yang baik tidak hanya bergantung pada metodologi, tetapi juga seberapa mudah dan manusiawi alat tersebut digunakan oleh petugas di lapangan." - **Garda Data Core Team**
