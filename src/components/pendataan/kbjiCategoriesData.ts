export interface KbjiCategory {
  code: string;
  title: string;
  description: string;
  total_items: number;
  total_jabatan: number;
  total_sub_golongan: number;
  total_sub_golongan_pokok: number;
  iconName?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
}

export const INITIAL_KBJI_CATEGORIES: KbjiCategory[] = [
  {
    code: "1",
    title: "Manajer",
    description: "Merumuskan kebijakan pemerintah, undang-undang, mengarahkan dan mengkoordinasikan kebijakan dan kegiatan perusahaan, organisasi, atau departemen.",
    total_items: 218,
    total_jabatan: 171,
    total_sub_golongan: 31,
    total_sub_golongan_pokok: 4,
    iconName: "Briefcase",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-800/60",
    textColor: "text-blue-700 dark:text-blue-300"
  },
  {
    code: "2",
    title: "Profesional",
    description: "Memerlukan pengetahuan tingkat tinggi dalam sains, teknologi, kesehatan, pendidikan, hukum, sosial, bisnis, dan teknologi informasi.",
    total_items: 670,
    total_jabatan: 544,
    total_sub_golongan: 92,
    total_sub_golongan_pokok: 6,
    iconName: "GraduationCap",
    color: "from-indigo-500 to-purple-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200 dark:border-indigo-800/60",
    textColor: "text-indigo-700 dark:text-indigo-300"
  },
  {
    code: "3",
    title: "Teknisi dan Asisten Ahli",
    description: "Melaksanakan pekerjaan teknis terapan, pengujian, asistensi kesehatan, bisnis, rekayasa, sains, hukum, dan pengajaran teknis.",
    total_items: 458,
    total_jabatan: 349,
    total_sub_golongan: 83,
    total_sub_golongan_pokok: 5,
    iconName: "HardHat",
    color: "from-cyan-500 to-blue-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
    borderColor: "border-cyan-200 dark:border-cyan-800/60",
    textColor: "text-cyan-700 dark:text-cyan-300"
  },
  {
    code: "4",
    title: "Tenaga Tata Usaha",
    description: "Menyimpan, menghitung, dan mengolah informasi numerik/dokumen, kesekretariatan, juru ketik, kasir, dan layanan pelanggan.",
    total_items: 133,
    total_jabatan: 91,
    total_sub_golongan: 29,
    total_sub_golongan_pokok: 4,
    iconName: "Building2",
    color: "from-teal-500 to-emerald-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/40",
    borderColor: "border-teal-200 dark:border-teal-800/60",
    textColor: "text-teal-700 dark:text-teal-300"
  },
  {
    code: "5",
    title: "Tenaga Usaha Jasa dan Tenaga Penjualan",
    description: "Menyediakan jasa perjalanan, kerumahtanggaan, pramusaji makanan/minuman, perawatan diri, satpam, dan penjualan toko/pasar.",
    total_items: 189,
    total_jabatan: 132,
    total_sub_golongan: 39,
    total_sub_golongan_pokok: 4,
    iconName: "ShoppingBag",
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800/60",
    textColor: "text-amber-700 dark:text-amber-300"
  },
  {
    code: "6",
    title: "Pekerja Terampil Pertanian, Kehutanan dan Perikanan",
    description: "Memproduksi hasil pertanian padi, kelapa sawit, perkebunan pohon buah, peternakan hewan, serta penangkapan & budidaya ikan.",
    total_items: 147,
    total_jabatan: 104,
    total_sub_golongan: 30,
    total_sub_golongan_pokok: 5,
    iconName: "Sprout",
    color: "from-emerald-500 to-green-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800/60",
    textColor: "text-emerald-700 dark:text-emerald-300"
  },
  {
    code: "7",
    title: "Pekerja Pengolahan, Kerajinan dan YBDI",
    description: "Tukang kayu, tukang batu, mekanik mesin motor/mobil, tukang las, tukang jahit pakaian jadi, tukang listrik, dan pengrajin logam.",
    total_items: 388,
    total_jabatan: 279,
    total_sub_golongan: 70,
    total_sub_golongan_pokok: 5,
    iconName: "Factory",
    color: "from-orange-500 to-rose-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
    borderColor: "border-orange-200 dark:border-orange-800/60",
    textColor: "text-orange-700 dark:text-orange-300"
  },
  {
    code: "8",
    title: "Operator Mesin dan Perakitan",
    description: "Mengoperasikan mesin stasioner industri, pengemudi mobil, taksi, bus, sopir truk berat angkutan barang, kapal, dan operator alat berat.",
    total_items: 271,
    total_jabatan: 177,
    total_sub_golongan: 42,
    total_sub_golongan_pokok: 3,
    iconName: "Truck",
    color: "from-rose-500 to-red-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    borderColor: "border-rose-200 dark:border-rose-800/60",
    textColor: "text-rose-700 dark:text-rose-300"
  },
  {
    code: "9",
    title: "Pekerja Kasar",
    description: "Tugas manual sederhana: pekerja kebersihan, pembantu rumah tangga, buruh tani, buruh bangunan, kuli angkut barang, dan pemulung.",
    total_items: 160,
    total_jabatan: 109,
    total_sub_golongan: 33,
    total_sub_golongan_pokok: 6,
    iconName: "Users",
    color: "from-purple-500 to-pink-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-200 dark:border-purple-800/60",
    textColor: "text-purple-700 dark:text-purple-300"
  },
  {
    code: "0",
    title: "TNI dan POLRI",
    description: "Mencakup dinas aktif Tentara Nasional Indonesia (AD, AL, AU) dan Kepolisian Negara Republik Indonesia (POLRI).",
    total_items: 222,
    total_jabatan: 200,
    total_sub_golongan: 15,
    total_sub_golongan_pokok: 3,
    iconName: "ShieldCheck",
    color: "from-slate-600 to-zinc-800",
    bgColor: "bg-slate-100 dark:bg-slate-800/60",
    borderColor: "border-slate-300 dark:border-slate-700",
    textColor: "text-slate-800 dark:text-slate-200"
  }
];

export const KBJI_LEVELS = [
  { id: 'all', label: 'Semua Level', shortLabel: 'Semua' },
  { id: 'golongan_pokok', label: 'Golongan Pokok (1 Digit)', shortLabel: '1 Digit' },
  { id: 'sub_golongan_pokok', label: 'Sub-Golongan Pokok (2 Digit)', shortLabel: '2 Digit' },
  { id: 'golongan', label: 'Golongan (3 Digit)', shortLabel: '3 Digit' },
  { id: 'sub_golongan', label: 'Sub-Golongan (4 Digit)', shortLabel: '4 Digit' },
  { id: 'jabatan', label: 'Jabatan Spesifik (5 Digit)', shortLabel: 'Jabatan' }
];

export const KBJI_SORT_OPTIONS = [
  { id: 'relevance', label: 'Paling Relevan' },
  { id: 'code-asc', label: 'Kode (0 - 9)' },
  { id: 'code-desc', label: 'Kode (9 - 0)' },
  { id: 'title-asc', label: 'Nama Jabatan (A - Z)' }
];

