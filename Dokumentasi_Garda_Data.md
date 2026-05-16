# Dokumentasi Fitur Garda Data

**Garda Data** adalah ekosistem digital inovatif yang dikembangkan oleh **Tim Sosial BPS Kabupaten Mempawah**. Aplikasi ini dirancang sebagai pendamping andal (*smart assistant*) bagi para petugas statistik di lapangan untuk menyederhanakan alur kerja survei dan menjaga kualitas data primer.

Berikut adalah penjelasan mendetail mengenai empat pilar fitur utama yang terdapat di dalam aplikasi Garda Data:

---

## 🔍 1. Pencarian Klasifikasi KBLI 2025 & KBJI 2014
Fitur ini bertindak sebagai kamus saku digital bagi petugas saat mengklasifikasikan jenis usaha dan jabatan responden di lapangan.
- **Konteks Lokal Mempawah**: Basis data referensi yang digunakan tidak hanya menampilkan daftar nasional yang kaku, melainkan telah disesuaikan dengan kondisi perekonomian nyata di wilayah Kabupaten Mempawah. Ini mempermudah petugas mencocokkan jawaban responden dengan kode baku secara lebih presisi.
- **Pencarian Fuzzy**: Menggunakan algoritma cerdas, petugas dapat mencari dengan kata kunci umum atau singkatan yang sering dipakai oleh masyarakat lokal, dan sistem akan langsung mengarahkan ke kode KBLI/KBJI yang paling relevan.

## 📏 2. Kalkulator Spasial Luas Bangunan
Fitur ini dirancang khusus untuk meminimalkan anomali atau kesalahan input ("salah ketik") mengenai luas lantai bangunan fisik rumah tangga responden.
- **Validasi Berbasis Satelit**: Dengan bantuan citra satelit dan pustaka geospasial *Leaflet*, petugas dapat menggambar pola (*polygon*) persis di atas atap rumah responden pada peta interaktif.
- **Penghitungan Presisi**: Sistem akan menghitung estimasi luas bangunan dalam satuan meter persegi secara otomatis berdasarkan gambar satelit tersebut.
- **Pengawalan Data**: Angka ini digunakan sebagai pembanding (*cross-check*) yang kuat untuk memvalidasi klaim luasan lantai dari responden, memastikan isian kuesioner petugas masuk akal dan mencegah *outlier* saat proses rekapitulasi data.

## 🏘️ 3. Direktori Infrastruktur Desa
Fitur ini berfungsi sebagai alat navigasi dan referensi untuk mengawal isian terkait Potensi Desa (Podes).
- **Akurasi Non-Spasial yang Terarah**: Berbeda dengan sistem pemetaan terpusat (*full GIS*), fitur ini lebih difokuskan pada manajemen data infrastruktur esensial desa (Kesehatan, Pendidikan, Fasilitas Publik).
- **Integrasi Google Maps**: Ketika petugas ingin memverifikasi atau mengunjungi lokasi infrastruktur tertentu untuk pengisian data, mereka cukup mengeklik nama infrastrukturnya di aplikasi. Aplikasi akan langsung mengarahkan (*redirect*) ke pencarian lokasi pada Google Maps eksternal. Hal ini sangat menghemat *bandwidth* namun tetap menjamin mobilitas petugas.

## 🧮 4. Panduan & Imputasi Susenas-Seruti
Ini adalah perpustakaan nilai referensi dan buku panduan digital yang menggantikan peran dokumen cetak (PDF atau buku tebal) yang merepotkan. Fitur ini krusial untuk menjaga konsistensi isian kuesioner Susenas KP Blok V.
- **Kalkulator Nilai Bawaan**: Jika petugas menemukan kasus yang membutuhkan nominal taksiran (seperti bantuan subsidi listrik, PKH, BPJS, MBG), mesin ini akan langsung memberikan besaran Rupiah yang sesuai.
- **Integrasi Susenas & Seruti**: Fitur ini memandu tata cara pengisian secara harmonis antara format kuesioner Susenas dan Seruti. Terdapat pedoman khusus untuk *Wajib Imputasi* dan *Wajib Transfer*, di mana aplikasi akan menjabarkan dengan jelas:
  - Nomor Kuesioner (KP vs Seruti)
  - Rincian Pertanyaan
  - Keterangan & Deskripsi Asumsi
  - Sumber Pendanaan
- **Sistem Dasbor Admin**: Admin (dari BPS Kabupaten) dapat mengubah *preset* nilai-nilai ini melalui antarmuka *Inline Edit* tanpa perlu mengunggah ulang Excel. Pembaruan akan langsung ditarik oleh gawai petugas di lapangan.

---

### Konsep Tahan Luring (Offline-First)
Seluruh pilar fitur di atas (terutama KBLI/KBJI dan Imputasi) dapat bekerja sepenuhnya tanpa sinyal internet. Berkat pemanfaatan *IndexedDB* dan sinkronisasi pintar di latar belakang, aplikasi akan menyimpan seluruh data master saat petugas berada di area yang terjangkau internet, sehingga mereka tetap bisa mencari data imputasi di pelosok Mempawah yang minim sinyal.

---

## 🛠️ 5. Spesifikasi Web & Penggunaan Teknologi

Garda Data dibangun di atas arsitektur modern berstandar *Progressive Web App* (PWA) untuk memastikan performa yang cepat, stabil, serta tangguh di berbagai kondisi jaringan:

- **Frontend Framework**: **React.js 18 + Vite** (Membangun antarmuka pengguna yang reaktif dengan waktu muat aplikasi yang sangat cepat).
- **Desain & Antarmuka**: **Tailwind CSS v4** (Kerangka kerja desain utilitas modern untuk antarmuka yang dinamis dan *mobile-first*) dipadukan dengan **Lucide React** (Koleksi ikon vektor ringan).
- **State Management**: **Zustand** (Sistem manajemen *state* global yang ringan untuk menjaga riwayat pencarian dan data modul tanpa memberatkan memori perangkat).
- **Penyimpanan Utama (Cloud)**: **Firebase Firestore** (Pangkalan data NoSQL yang memungkinkan sinkronisasi *real-time* dan penyimpanan masif untuk semua data Imputasi dan Podes).
- **Penyimpanan Lokal (Offline)**: **IndexedDB** melalui pustaka `idb` (Menyimpan seluruh basis data secara lokal ke dalam gawai petugas sehingga aplikasi tetap hidup meski tanpa sinyal).
- **Mesin Pencari**: **Fuse.js** (Algoritma pencarian *fuzzy* tingkat lanjut yang sangat toleran terhadap *typo* atau kesalahan ejaan, digunakan pada KBLI dan Imputasi).
- **Pemetaan & GIS**: **React Leaflet** (Perpustakaan geospasial sumber terbuka yang disambungkan dengan peladen peta citra satelit murni dari Google).
- **Pemrosesan Berkas**: **SheetJS (`xlsx`)** (Pustaka manipulasi sprei untuk membaca, mengonversi, dan mengelola migrasi data Excel ke dalam sistem secara utuh).
- **Keamanan & Autentikasi**: **Sistem RBAC (*Role-Based Access Control*)** (Membatasi hak intervensi basis data hanya kepada Admin BPS, sementara Petugas lapangan hanya memiliki akses penjelajahan dan pencarian).
