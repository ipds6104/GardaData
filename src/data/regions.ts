export interface RegionMapping {
  [kecamatan: string]: string[];
}

export const MEMPAWAH_REGIONS: RegionMapping = {
  'Mempawah Hilir': [
    'Tengah',
    'Terusan',
    'Malikian',
    'Kuala Secapah',
    'Pasir',
    'Senggiring',
    'Penibung'
  ],
  'Mempawah Timur': [
    'Pasir Wan Salim',
    'Antibar',
    'Sungai Bakau Kecil',
    'Parit Banjar',
    'Sengkubang',
    'Sejegi',
    'Pinang Dalam'
  ],
  'Sungai Pinyuh': [
    'Sungai Pinyuh',
    'Galang',
    'Peniraman',
    'Nusapati',
    'Sungai Purun Kecil',
    'Sungai Batang',
    'Sungai Rasau',
    'Sungai Bakau Besar Laut',
    'Sungai Bakau Besar Darat'
  ],
  'Jongkat': [
    'Wajok Hulu',
    'Wajok Hilir',
    'Jungkat',
    'Peniti Dalam I',
    'Peniti Dalam II',
    'Peniti Besar',
    'Sungai Kupah'
  ],
  'Segedong': [
    'Peniti Dalam I',
    'Peniti Dalam II',
    'Peniti Besar',
    'Parit Bugis',
    'Segedong',
    'Sungai Burung'
  ],
  'Anjongan': [
    'Anjungan Melancar',
    'Anjongan',
    'Kepayang',
    'Galang',
    'Dema'
  ],
  'Toho': [
    'Toho Hilir',
    'Pak Laheng',
    'Toho',
    'Pentek',
    'Sambora',
    'Kecurit',
    'Sekabuk'
  ],
  'Sadaniang': [
    'Amawang',
    'Pentek',
    'Sekabuk',
    'Ansiap',
    'Suak Barangan'
  ]
};

export const KECAMATAN_LIST = Object.keys(MEMPAWAH_REGIONS);
