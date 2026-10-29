#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
KBLI 2025 AI/EMPIRICAL SEARCH & RECOMMENDATION ENGINE (STANDALONE PYTHON MODEL)
================================================================================
Modul ini mengimplementasikan logika mesin pencarian dan klasifikasi otomatis KBLI 2025
yang digunakan pada Garda Data BPS Kabupaten Mempawah.

Fitur Unggulan Model:
1. Normalisasi Entitas & Pembersihan Stopwords:
   - Menghapus gelar/honorifik pemilik (Pak, Bu, Haji, Bang, Kak, dll.)
   - Menghapus bentuk badan hukum (PT, CV, UD, BUMDes, dll.)
   - Menghapus stopword geografis lokal (Mempawah, Sungai Pinyuh, Desa, Dusun, dll.)
2. Hukum Diterangkan-Menerangkan (DM) Head-Word Disambiguation:
   - Membedakan aktivitas ekonomi riil dari kata penjelas/komoditas
   - Contoh: "Toko Sawit" -> Kategori G (Perdagangan Eceran), bukan Kategori A (Perkebunan Sawit).
   - "Penggilingan Padi" -> Kategori C (Industri Penggilingan), bukan Kategori A (Pertanian Padi).
   - "Angkutan Sawit" -> Kategori H (Transportasi Truk), bukan Kategori A (Perkebunan Sawit).
3. Multi-Signal Scoring & Hierarchical Prioritization:
   - Prioritas kode 5-digit (Kelompok) tertinggi untuk efisiensi operasional pendataan.
   - Penilaian berbasis kemiripan Kode, Judul, Uraian Cakupan (Inklusi/Eksklusi), dan Bobot Empiris SE2026.
4. Kompatibilitas Python Mandiri:
   - Murni menggunakan Standard Library (json, re, math, pathlib).
   - Dapat digunakan langsung untuk optimasi batch pada Pandas DataFrame, Jupyter Notebook, atau API FastAPI/Flask.
================================================================================
"""

import os
import sys
import json
import re
import math
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Set

# Memastikan output konsol mendukung encoding UTF-8 pada lingkungan Windows
if sys.platform == 'win32' and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


# ==============================================================================
# KAMUS PREPROSESING, HONORIFIK, DAN STOPWORD LOKAL INDONESIA & MEMPAWAH
# ==============================================================================

OWNER_HONORIFICS: Set[str] = {
    'pak', 'bu', 'ibu', 'bapak', 'bpk', 'bang', 'bg', 'kak', 'dek', 'om', 'tante',
    'nek', 'kek', 'hj', 'haji', 'hajjah', 'ny', 'tn', 'sdr', 'sdri', 'abg', 'abang',
    'mak', 'wak', 'wan', 'cik', 'ce', 'ko', 'koh', 'ci'
}

GEO_AND_STOPWORDS: Set[str] = {
    'dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'dengan', 'atau', 'ini', 'itu',
    'usaha', 'milik', 'sendiri', 'pribadi', 'kabupaten', 'mempawah', 'kecamatan', 'kelurahan',
    'desa', 'jalan', 'jl', 'dusun', 'rt', 'rw', 'no', 'nomor', 'hilir', 'hulu', 'timur', 'barat',
    'utara', 'selatan', 'tengah', 'dalam', 'luar', 'kota', 'sungai', 'pinyuh', 'kunyit',
    'segedong', 'jongkat', 'siantan', 'anjongan', 'toho', 'sadaniang'
}

CORP_PREFIXES: Set[str] = {
    'cv', 'pt', 'ud', 'pd', 'fa', 'perum', 'perumda', 'bumdes', 'bumdesa', 'yayasan'
}

NON_AGRI_HEAD_WORDS: Set[str] = {
    'toko', 'kios', 'grosir', 'minimarket', 'supermarket', 'swalayan', 'distro', 'butik',
    'konter', 'counter', 'pangkalan', 'spbu', 'pertamini', 'pengepul', 'tengkulak', 'pedagang',
    'dagang', 'apotek', 'apotik', 'jual', 'jualan', 'penjual',
    'warung', 'warkop', 'kedai', 'kafe', 'cafe', 'coffee', 'coffe', 'resto', 'restoran', 'rm',
    'kantin', 'angkringan', 'lesehan', 'catering', 'katering',
    'bengkel', 'servis', 'service', 'reparasi',
    'pabrik', 'industri', 'penggilingan', 'gilingan', 'pembuatan', 'membuat', 'produksi',
    'pengolahan', 'pengeringan', 'penggaraman', 'percetakan', 'konveksi', 'penjahit', 'tailor',
    'taylor', 'mebel', 'meubel', 'furnitur', 'somel', 'sawmill', 'depot', 'cetak',
    'angkutan', 'angkut', 'transportasi', 'truk', 'truck', 'dump', 'dam', 'pickup', 'ekspedisi',
    'kurir', 'kargo', 'ojek', 'ojol', 'taksi', 'taxi', 'travel',
    'sewa', 'penyewaan', 'persewaan', 'rental', 'kontrakan', 'kost', 'kos', 'kosan', 'kostan', 'indekos',
    'konstruksi', 'kontruksi', 'kontraktor', 'pemborong', 'instalasi',
    'koperasi', 'ksp', 'bmt', 'bank', 'pegadaian', 'brilink',
    'pdam', 'pengumpul', 'pemulung',
    'kantor', 'studio', 'notaris', 'klinik', 'praktek', 'praktik', 'puskesmas', 'sd', 'smp', 'sma',
    'smk', 'madrasah', 'pondok', 'tk', 'paud', 'bimbel',
    'lapangan', 'sanggar', 'pangkas', 'potong', 'cukur', 'salon', 'laundry', 'londri', 'permak',
    'vermak', 'asisten', 'pembantu'
}

AGRI_EXPLICIT_HEADS: Set[str] = {
    'utp', 'kebun', 'perkebunan', 'petani', 'sawah', 'ladang', 'hortikultura', 'holtikultura',
    'peternakan', 'peternak', 'ternak', 'kandang', 'perikanan', 'nelayan', 'tambak',
    'budidaya', 'pembibitan', 'pembenihan', 'penggemukan'
}

NON_AGRI_STRONG_SIGNALS: List[str] = [
    'konstruksi', 'kontruksi', 'kontraktor', 'pemborong', 'instalasi', 'angkutan',
    'penggilingan', 'gilingan', 'kontrakan', 'laundry', 'pangkas', 'bengkel',
    'koperasi', 'brilink', 'notaris', 'futsal', 'bidan', 'dokter', 'pdam', 'rongsokan', 'pemulung'
]

LEVEL_PRIORITY: Dict[str, int] = {
    'kelompok': 1,       # 5 digit (Kelompok) - Prioritas tertinggi operasional survei
    'subgolongan': 2,    # 4 digit
    'golongan': 3,       # 3 digit
    'golongan_pokok': 4, # 2 digit
    'kategori': 5        # 1 digit (A - U)
}


# ==============================================================================
# KELAS SEARCH ENGINE KBLI 2025
# ==============================================================================

class KBLISearchEngine:
    def __init__(self, data_path: Optional[str] = None):
        """
        Inisialisasi Search Engine KBLI 2025.
        Jika data_path kosong, modul mencari file kbli_2025_all_items.json secara otomatis
        pada direktori project Garda Data.
        """
        self.all_items: List[Dict[str, Any]] = []
        self.item_map: Dict[str, Dict[str, Any]] = {}
        self.category_map: Dict[str, Dict[str, Any]] = {}
        self.nama_usaha_phrases: List[Tuple] = []
        self.nama_usaha_tokens: List[Tuple] = []
        self.nama_usaha_token_map: Dict[str, Tuple] = {}
        self.kbli5_titles_map: Dict[str, str] = {}
        
        self.resolved_data_dir = self._resolve_data_dir(data_path)
        self._load_datasets()

    def _resolve_data_dir(self, custom_path: Optional[str]) -> Path:
        """Menemukan direktori data KBLI 2025 secara otomatis."""
        if custom_path:
            p = Path(custom_path)
            if p.is_file():
                return p.parent
            if p.is_dir():
                return p

        # Cari lokasi otomatis relatif terhadap script ini
        current_file_dir = Path(__file__).resolve().parent
        candidate_paths = [
            current_file_dir.parent / "server" / "kbli_data",
            current_file_dir.parent / "backend" / "kbli_data",
            current_file_dir / "server" / "kbli_data",
            current_file_dir / "backend" / "kbli_data",
            Path.cwd() / "server" / "kbli_data",
            Path.cwd() / "backend" / "kbli_data"
        ]

        for cand in candidate_paths:
            if cand.exists() and (cand / "kbli_2025_all_items.json").exists():
                return cand

        # Fallback ke direktori kerja saat ini
        return Path.cwd()

    def _load_datasets(self):
        """Memuat dataset KBLI 2025 dan model empiris SE2026 ke dalam memori RAM."""
        all_items_file = self.resolved_data_dir / "kbli_2025_all_items.json"
        cat_file = self.resolved_data_dir / "01_kategori.json"
        nama_model_file = self.resolved_data_dir / "se2026_nama_usaha_model.json"

        if not all_items_file.exists():
            raise FileNotFoundError(f"File data KBLI tidak ditemukan di: {all_items_file}")

        with open(all_items_file, 'r', encoding='utf-8') as f:
            raw_items = json.load(f)

        if cat_file.exists():
            with open(cat_file, 'r', encoding='utf-8') as f:
                categories = json.load(f)
                self.category_map = {c.get('code', ''): c for c in categories}

        # Muat Model Empiris Nama Usaha SE2026 jika ada
        if nama_model_file.exists():
            try:
                with open(nama_model_file, 'r', encoding='utf-8') as f:
                    nama_model = json.load(f)
                    self.nama_usaha_phrases = [tuple(x) for x in nama_model.get('phrases', [])]
                    self.nama_usaha_tokens = [tuple(x) for x in nama_model.get('tokens', [])]
                    self.kbli5_titles_map = nama_model.get('kbli5_titles', {})
                    self.nama_usaha_token_map = {t[0]: t for t in self.nama_usaha_tokens}
            except Exception as e:
                print(f"[Warning] Gagal memuat se2026_nama_usaha_model.json: {e}", file=sys.stderr)

        temp_map = {item['kode']: item for item in raw_items}

        enriched = []
        for item in raw_items:
            curr = item
            breadcrumb = [{
                'kode': item['kode'],
                'judul': item.get('judul', ''),
                'level': item.get('level', ''),
                'digit': item.get('digit', 0)
            }]

            while curr and curr.get('induk') and curr.get('induk') in temp_map:
                curr = temp_map[curr['induk']]
                breadcrumb.insert(0, {
                    'kode': curr['kode'],
                    'judul': curr.get('judul', ''),
                    'level': curr.get('level', ''),
                    'digit': curr.get('digit', 0)
                })

            kategori_root = breadcrumb[0]
            kategori_code = kategori_root['kode'] if kategori_root.get('level') == 'kategori' else (
                item['kode'] if item.get('level') == 'kategori' else ''
            )
            kategori_info = self.category_map.get(kategori_code, {})

            desc = item.get('deskripsi', '')
            desc_lower = desc.lower()
            excl_idx = desc_lower.find('tidak mencakup')
            if excl_idx == -1:
                excl_idx = desc_lower.find('tidak termasuk')

            inclusion = desc_lower[:excl_idx] if excl_idx != -1 else desc_lower
            exclusion = desc_lower[excl_idx:] if excl_idx != -1 else ''

            enriched_item = {
                **item,
                'kategori_kode': kategori_code,
                'kategori_judul': kategori_info.get('title', kategori_root.get('judul', '')),
                'breadcrumb': breadcrumb,
                '_kodeLower': str(item['kode']).lower(),
                '_judulLower': str(item.get('judul', '')).lower(),
                '_inclusionLower': inclusion,
                '_exclusionLower': exclusion,
                '_is5Digit': item.get('digit') == 5 or item.get('level') == 'kelompok'
            }
            enriched.append(enriched_item)

        self.all_items = enriched
        self.item_map = {it['kode']: it for it in self.all_items}
        print(f"[OK] KBLI 2025 Model dimuat: {len(self.all_items)} entitas klasifikasi.")

    # ==========================================================================
    # PIPELINE PREPROSESING & EKSTRAKSI TOKEN MAKNA
    # ==========================================================================

    @staticmethod
    def clean_text(raw_name: str) -> str:
        """Membersihkan tanda baca, kurung, dan karakter khusus."""
        if not raw_name or not isinstance(raw_name, str):
            return ""
        cleaned = re.sub(r'\(.*?\)|<.*?>|\[.*?\]', ' ', raw_name)
        cleaned = cleaned.lower()
        cleaned = re.sub(r'[^a-z0-9\s]', ' ', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    def extract_meaningful_tokens(self, clean_name: str) -> List[str]:
        """Menghilangkan honorifik, stopword, dan prefix badan hukum."""
        raw_words = [w for w in clean_name.split() if len(w) >= 2]
        meaningful = [
            w for w in raw_words
            if w not in OWNER_HONORIFICS and w not in GEO_AND_STOPWORDS and not w.isdigit()
        ]
        if not meaningful:
            meaningful = [w for w in raw_words if not w.isdigit()]
        return meaningful

    # ==========================================================================
    # HUKUM DITERANGKAN-MENERANGKAN (DM) & REKOMENDASI NAMA USAHA
    # ==========================================================================

    def analyze_nama_usaha(self, raw_name: str) -> Optional[Dict[str, Any]]:
        """
        Menganalisis teks Nama Usaha berdasarkan relasi Diterangkan-Menerangkan (DM),
        pola kontigu, skip-gram, dan kamus empiris SE2026.
        """
        clean = self.clean_text(raw_name)
        if len(clean) < 2:
            return None

        meaningful = self.extract_meaningful_tokens(clean)
        if not meaningful:
            return None

        act_words = [w for w in meaningful if w not in CORP_PREFIXES]
        if not act_words:
            act_words = meaningful

        condensed = " ".join(meaningful)
        first_word = act_words[0]
        word_set = set(meaningful)

        has_non_agri_head = (
            first_word in NON_AGRI_HEAD_WORDS or
            any(w in word_set for w in NON_AGRI_STRONG_SIGNALS)
        )
        has_explicit_agri = (
            first_word in AGRI_EXPLICIT_HEADS or
            'utp' in word_set
        )

        cat_scores: Dict[str, float] = {}
        cat_best_kbli: Dict[str, Dict[str, Any]] = {}
        kbli5_scores: Dict[str, Dict[str, Any]] = {}

        def add_vote(kat: str, kbli5: Optional[str], kw: str, cnt: int, raw_score: float):
            score = raw_score
            # Penalti Kategori A jika Head Word jelas non-pertanian (Toko, Pabrik, Bengkel, dll.)
            if kat == 'A' and has_non_agri_head and not has_explicit_agri:
                score *= 0.12

            cat_scores[kat] = cat_scores.get(kat, 0.0) + score
            if kat not in cat_best_kbli or score > cat_best_kbli[kat]['score']:
                cat_best_kbli[kat] = {'score': score, 'kbli5': kbli5, 'matchedKw': kw, 'count': cnt}

            if kbli5:
                if kbli5 not in kbli5_scores:
                    kbli5_scores[kbli5] = {'score': score, 'matchedKw': kw, 'count': cnt, 'kat': kat, 'topSingle': score}
                else:
                    kbli5_scores[kbli5]['score'] += score
                    if score > kbli5_scores[kbli5]['topSingle']:
                        kbli5_scores[kbli5]['matchedKw'] = kw
                        kbli5_scores[kbli5]['topSingle'] = score

        padded_clean = f" {clean} "
        padded_condensed = f" {condensed} "

        # 1. Evaluasi Frasa Kontigu & Skip-Gram dari Model SE2026
        for phr, kat, kbli5, cnt, prec in self.nama_usaha_phrases:
            p_words = phr.split()
            w_cnt = len(p_words)

            is_contiguous = (
                clean == phr or
                condensed == phr or
                f" {phr} " in padded_clean or
                f" {phr} " in padded_condensed
            )

            if is_contiguous:
                base = w_cnt * 135.0 * prec + math.log10(cnt + 1) * 45.0
                if condensed.startswith(phr) or clean.startswith(phr):
                    base += 160.0
                add_vote(kat, kbli5, phr, cnt, base)
            elif w_cnt == 2 and p_words[0] in word_set and p_words[1] in word_set:
                try:
                    idx0 = meaningful.index(p_words[0])
                    idx1 = meaningful.index(p_words[1])
                    if 0 <= idx0 < idx1:
                        skip_score = 175.0 * prec + math.log10(cnt + 1) * 35.0
                        if idx0 == 0 or p_words[0] == first_word:
                            skip_score += 110.0
                        add_vote(kat, kbli5, phr, cnt, skip_score)
                except ValueError:
                    pass

        # 2. Aturan Khusus Diterangkan-Menerangkan (DM Rules BPS)
        if first_word in {
            'toko', 'kios', 'grosir', 'minimarket', 'supermarket', 'swalayan', 'distro',
            'butik', 'konter', 'counter', 'pangkalan', 'spbu', 'pertamini', 'pengepul',
            'tengkulak', 'pedagang', 'dagang', 'apotek', 'apotik'
        }:
            if any(w in word_set for w in ['roti', 'kue', 'bakery']):
                add_vote('C', '10710', f"{first_word} roti/kue", 50, 320.0)
            else:
                default_k5 = '47112'  # Eceran kelontong / sembako
                if any(w in word_set for w in ['bangunan', 'material', 'matrial', 'cat']):
                    default_k5 = '47521'
                elif any(w in word_set for w in ['pertanian', 'tani', 'pupuk', 'pakan', 'bibit']):
                    default_k5 = '47763'
                elif any(w in word_set for w in ['pakaian', 'baju', 'busana', 'distro', 'butik', 'jilbab']):
                    default_k5 = '47711'
                elif any(w in word_set for w in ['sepatu', 'sandal', 'sendal']):
                    default_k5 = '47712'
                elif any(w in word_set for w in ['emas', 'perhiasan']):
                    default_k5 = '47735'
                elif any(w in word_set for w in ['obat', 'apotek', 'apotik']):
                    default_k5 = '47721'
                elif any(w in word_set for w in ['kosmetik', 'skincare', 'parfum']):
                    default_k5 = '47724'
                elif any(w in word_set for w in ['elektronik', 'listrik', 'lampu']):
                    default_k5 = '47592'
                elif any(w in word_set for w in ['pulsa', 'kuota', 'konter', 'counter', 'hp', 'ponsel']):
                    default_k5 = '47404'
                elif any(w in word_set for w in ['gas', 'lpg', 'elpiji', 'pangkalan']):
                    default_k5 = '47772'
                elif any(w in word_set for w in ['bensin', 'pertalite', 'pertamini', 'spbu', 'bbm']):
                    default_k5 = '47302'
                elif any(w in word_set for w in ['sayur', 'sayuran']):
                    default_k5 = '47213'
                elif 'ikan' in word_set:
                    default_k5 = '47215'
                elif any(w in word_set for w in ['buah', 'buahan']):
                    default_k5 = '47212'
                elif any(w in word_set for w in ['sawit', 'karet', 'kelapa', 'pinang', 'pengepul']):
                    default_k5 = '46202'
                elif any(w in word_set for w in ['motor', 'sparepart', 'onderdil']):
                    default_k5 = '47833'
                add_vote('G', default_k5, first_word, 500, 420.0)

        elif first_word in {'jual', 'jualan', 'penjual'}:
            if any(w in word_set for w in [
                'pentol', 'bakso', 'mie', 'mi', 'nasi', 'soto', 'sate', 'gorengan',
                'sarapan', 'minuman', 'kopi', 'teh', 'boba', 'jus', 'cendol', 'rujak',
                'gado', 'seblak', 'geprek', 'bubur', 'lontong', 'jajanan', 'kantin'
            ]):
                k5 = '56102' if ('keliling' in word_set or 'pentol' in word_set) else (
                    '56304' if any(w in word_set for w in ['minuman', 'kopi', 'teh', 'boba', 'jus', 'cendol']) else '56101'
                )
                add_vote('I', k5, f"{first_word} kuliner", 150, 400.0)
            elif 'es' in word_set and ('batu' in word_set or 'balok' in word_set):
                add_vote('D', '35302', 'jual es batu', 35, 450.0)
            elif 'kue' in word_set and ('basah' in word_set or 'tradisional' in word_set):
                add_vote('C', '10792', 'jual kue basah', 30, 380.0)
            else:
                k5 = '47213'
                if 'ikan' in word_set:
                    k5 = '47246' if 'asin' in word_set else '47215'
                elif 'ayam' in word_set:
                    k5 = '47214'
                elif 'buah' in word_set:
                    k5 = '47212'
                elif 'sembako' in word_set:
                    k5 = '47112'
                elif any(w in word_set for w in ['bensin', 'pertalite']):
                    k5 = '47302'
                elif any(w in word_set for w in ['gas', 'lpg', 'tabung']):
                    k5 = '47772'
                elif any(w in word_set for w in ['sawit', 'karet', 'kelapa', 'pinang']):
                    k5 = '46202'
                add_vote('G', k5, first_word, 300, 420.0)

        elif first_word in {
            'warung', 'warkop', 'kedai', 'kafe', 'cafe', 'coffee', 'coffe',
            'resto', 'restoran', 'rm', 'kantin', 'angkringan', 'lesehan', 'catering', 'katering'
        } or condensed.startswith('rumah makan'):
            if first_word == 'warung' and any(w in word_set for w in ['sembako', 'kelontong', 'harian', 'bensin', 'gas', 'eceran']):
                k5 = '47302' if any(w in word_set for w in ['bensin', 'pertalite']) else '47112'
                add_vote('G', k5, 'warung sembako', 800, 420.0)
            elif first_word == 'warung' and len(act_words) == 1:
                add_vote('G', '47112', 'warung', 1200, 260.0)
            else:
                k5 = '56101'
                if first_word in {'warkop', 'kafe', 'cafe', 'coffee'} or (
                    any(w in word_set for w in ['kopi', 'minuman', 'es', 'jus', 'boba']) and
                    'makan' not in word_set and 'nasi' not in word_set
                ):
                    k5 = '56303' if first_word in {'kafe', 'cafe', 'coffee'} else '56304'
                elif first_word == 'angkringan':
                    k5 = '56102'
                elif first_word in {'catering', 'katering'}:
                    k5 = '56210'
                add_vote('I', k5, first_word, 400, 420.0)

        elif first_word in {'bengkel', 'servis', 'service', 'reparasi'}:
            if any(w in word_set for w in ['las', 'bubut', 'teralis', 'kanopi', 'besi', 'baja', 'karoseri']):
                add_vote('C', '25920', f"{first_word} las", 85, 450.0)
            elif any(w in word_set for w in ['elektronik', 'tv', 'kulkas', 'ac', 'mesin', 'hp', 'ponsel', 'laptop']):
                k5 = '95120' if any(w in word_set for w in ['hp', 'ponsel']) else (
                    '95110' if any(w in word_set for w in ['laptop', 'komputer']) else '95210'
                )
                add_vote('S', k5, f"{first_word} elektronik", 60, 450.0)
            else:
                k5 = '95311' if 'mobil' in word_set else '95320'
                add_vote('G', k5, first_word, 450, 420.0)

        elif first_word in {
            'pabrik', 'industri', 'penggilingan', 'gilingan', 'pembuatan', 'membuat',
            'produksi', 'pengolahan', 'percetakan', 'konveksi', 'penjahit', 'tailor',
            'mebel', 'somel', 'sawmill', 'depot', 'cetak'
        }:
            k5 = '10792'
            if 'padi' in word_set or 'beras' in word_set or first_word in {'penggilingan', 'gilingan'}:
                k5 = '10631'
            elif any(w in word_set for w in ['tahu', 'tempe', 'kedelai']):
                k5 = '10307'
            elif 'ikan' in word_set and 'asin' in word_set:
                k5 = '10211'
            elif any(w in word_set for w in ['kerupuk', 'keripik', 'peyek']):
                k5 = '10794'
            elif any(w in word_set for w in ['roti', 'bakery', 'kering']):
                k5 = '10710'
            elif 'air' in word_set or 'galon' in word_set or first_word == 'depot':
                k5 = '11052'
            elif first_word in {'konveksi', 'penjahit', 'tailor'} or any(w in word_set for w in ['jahit', 'pakaian', 'baju']):
                k5 = '14120'
            elif first_word in {'mebel', 'furnitur'} or any(w in word_set for w in ['kursi', 'lemari', 'kusen']):
                k5 = '31011'
            elif first_word in {'somel', 'sawmill'} or 'kayu' in word_set:
                k5 = '16221'
            elif any(w in word_set for w in ['batako', 'bata', 'paving', 'gorong']):
                k5 = '23951'
            elif first_word in {'percetakan', 'cetak'} or any(w in word_set for w in ['sablon', 'fotocopy']):
                k5 = '18111'
            add_vote('C', k5, first_word, 300, 440.0)

        elif first_word in {
            'angkutan', 'angkut', 'transportasi', 'truk', 'truck', 'dump', 'dam',
            'pickup', 'ekspedisi', 'kurir', 'ojek', 'ojol', 'taksi', 'travel'
        } or 'angkutan' in word_set:
            k5 = '49296' if first_word in {'ojek', 'ojol'} else (
                '53200' if first_word in {'ekspedisi', 'kurir'} else (
                    '49293' if first_word in {'taksi', 'travel'} else '49231'
                )
            )
            add_vote('H', k5, 'angkutan', 250, 460.0)

        elif first_word in {'kebun', 'perkebunan', 'pertanian', 'petani', 'sawah', 'ladang', 'peternakan', 'ternak'}:
            k5 = '01122'
            if 'sawit' in word_set:
                k5 = '01262'
            elif 'kelapa' in word_set:
                k5 = '01261'
            elif 'karet' in word_set:
                k5 = '01291'
            elif 'jagung' in word_set:
                k5 = '01111'
            elif any(w in word_set for w in ['cabai', 'cabe']):
                k5 = '01138'
            elif 'sapi' in word_set:
                k5 = '01411'
            elif 'kambing' in word_set:
                k5 = '01442'
            elif 'ayam' in word_set:
                k5 = '01461' if any(w in word_set for w in ['pedaging', 'potong']) else '01462'
            elif any(w in word_set for w in ['ikan', 'lele', 'nila', 'tambak']):
                k5 = '03221'
            add_vote('A', k5, first_word, 1500, 420.0)

        if not cat_scores:
            return {
                'meaningfulTokens': meaningful,
                'hasNonAgriHead': has_non_agri_head,
                'hasExplicitAgri': has_explicit_agri,
                'bestRec': None,
                'kbli5Scores': kbli5_scores
            }

        best_kat = max(cat_scores.keys(), key=lambda k: cat_scores[k])
        total_score = sum(cat_scores.values())
        best_detail = cat_best_kbli.get(best_kat, {})
        kbli5_code = best_detail.get('kbli5')
        kbli_item = self.item_map.get(kbli5_code) if kbli5_code else None
        kbli5_title = kbli_item.get('judul', '') if kbli_item else self.kbli5_titles_map.get(kbli5_code, '')

        confidence_pct = min(99, round((cat_scores[best_kat] / total_score) * 100)) if total_score > 0 else 85

        return {
            'meaningfulTokens': meaningful,
            'hasNonAgriHead': has_non_agri_head,
            'hasExplicitAgri': has_explicit_agri,
            'bestRec': {
                'kategori': kbli_item.get('kategori_kode', best_kat) if kbli_item else best_kat,
                'kbli': kbli5_code,
                'judul': kbli5_title,
                'matchedKeyword': best_detail.get('matchedKw', first_word),
                'confidence': confidence_pct
            },
            'kbli5Scores': kbli5_scores
        }

    # ==========================================================================
    # METODE PENCARIAN & SKORING UTAMA (MULTI-TIER SEARCH ENGINE)
    # ==========================================================================

    def search(
        self,
        query: str,
        kategori: str = 'ALL',
        level: str = 'all',
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Melakukan pencarian cerdas KBLI 2025 dengan Multi-Signal Recommender.
        
        Args:
            query: Teks pencarian (nama usaha, deskripsi kegiatan, atau kata kunci komoditas).
            kategori: Filter kategori alfabet ('A' - 'U' atau 'ALL').
            level: Filter level KBLI ('kelompok', 'golongan', dll., atau 'all').
            top_k: Jumlah maksimum hasil teratas yang dikembalikan.

        Returns:
            List dictionary berisi kode, judul, level, kategori, skor relevansi, dan snippet uraian.
        """
        q = (query or '').strip()
        if not q:
            return []

        query_lower = q.lower()
        pool = self.all_items

        if kategori and kategori.upper() != 'ALL':
            kat_upper = kategori.upper()
            pool = [it for it in pool if it.get('kategori_kode') == kat_upper]

        if level and level.lower() != 'all':
            lvl_lower = level.lower()
            pool = [it for it in pool if it.get('level') == lvl_lower]

        nama_analysis = self.analyze_nama_usaha(q)
        query_tokens = (
            nama_analysis['meaningfulTokens']
            if nama_analysis and nama_analysis.get('meaningfulTokens')
            else [t for t in query_lower.split() if len(t) > 1]
        )

        best_rec = nama_analysis.get('bestRec') if nama_analysis else None
        kbli5_scores = nama_analysis.get('kbli5Scores', {}) if nama_analysis else {}
        has_non_agri_head = bool(nama_analysis.get('hasNonAgriHead')) if nama_analysis else False
        has_explicit_agri = bool(nama_analysis.get('hasExplicitAgri')) if nama_analysis else False

        scored_items = []

        for item in pool:
            score = 0.0
            matched_tokens_count = 0

            # 1. Rekomendasi Teratas dari Evaluasi Diterangkan-Menerangkan SE2026
            if best_rec and best_rec.get('kbli') and item['kode'] == best_rec['kbli']:
                score += 38000.0
                matched_tokens_count = len(query_tokens)
            elif item['kode'] in kbli5_scores:
                k5_entry = kbli5_scores[item['kode']]
                score += min(22000.0, k5_entry['score'] * 28.0)
                matched_tokens_count = max(matched_tokens_count, min(len(query_tokens), 2))

            # 2. Kemiripan Persis pada Kode KBLI
            if item['_kodeLower'] == query_lower:
                score += 45000.0
            elif item['_kodeLower'].startswith(query_lower):
                score += 5000.0
            elif query_lower in item['_kodeLower']:
                score += 1500.0

            # 3. Kemiripan Persis pada Judul KBLI
            if item['_judulLower'] == query_lower:
                score += 15000.0
            elif query_lower in item['_judulLower']:
                score += 6500.0

            if f"selain {query_lower}" in item['_judulLower']:
                score -= 3500.0

            # 4. Pencarian Frasa pada Uraian Cakupan (Inklusi / Eksklusi)
            if query_lower in item['_inclusionLower']:
                score += 4000.0
            elif query_lower in item['_exclusionLower']:
                score += 150.0

            # 5. Pencocokan Token Per Kata
            title_hits = 0
            inclusion_hits = 0
            exclusion_hits = 0

            for token in query_tokens:
                hit = False
                if token in item['_judulLower']:
                    if f"selain {token}" in item['_judulLower']:
                        score += 20.0
                    else:
                        title_hits += 1
                        hit = True
                if token in item['_inclusionLower']:
                    inclusion_hits += 1
                    hit = True
                elif token in item['_exclusionLower']:
                    exclusion_hits += 1
                    hit = True

                if hit:
                    matched_tokens_count += 1

            score += title_hits * 750.0
            score += inclusion_hits * 260.0
            score += exclusion_hits * 25.0

            # Bonus jika seluruh kata kunci dalam query cocok
            if len(query_tokens) > 1 and matched_tokens_count >= len(query_tokens):
                score += 3200.0

            # Penalti Kategori A (Pertanian) jika usaha ber-Head Word non-pertanian
            if has_non_agri_head and not has_explicit_agri and item.get('kategori_kode') == 'A':
                score *= 0.18
            elif best_rec and item.get('kategori_kode') == best_rec.get('kategori') and score > 0:
                score += 1800.0

            if score > 0:
                scored_items.append((item, score))

        def sort_key(entry):
            it, sc = entry
            is_exact_code = 0 if it['_kodeLower'] == query_lower else 1
            is_best_rec = 0 if (best_rec and it['kode'] == best_rec.get('kbli')) else 1
            rank_level = LEVEL_PRIORITY.get(it.get('level', ''), 99)
            return (is_exact_code, is_best_rec, rank_level, -sc)

        scored_items.sort(key=sort_key)
        top_results = scored_items[:top_k]

        output = []
        for it, sc in top_results:
            desc = it.get('deskripsi', '')
            output.append({
                'kode': it['kode'],
                'judul': it.get('judul', ''),
                'level': it.get('level', ''),
                'digit': it.get('digit', 0),
                'kategori_kode': it.get('kategori_kode', ''),
                'kategori_judul': it.get('kategori_judul', ''),
                'score': round(sc, 1),
                'deskripsi_ringkas': (desc[:180] + '...') if len(desc) > 180 else desc
            })

        return output

    def predict_one(self, business_name: str) -> Optional[Dict[str, Any]]:
        """
        Memprediksi 1 kode KBLI 5-Digit terbaik untuk nama usaha tertentu.
        Sangat cocok untuk klasifikasi cepat baris per baris.
        """
        results = self.search(business_name, top_k=1)
        if not results:
            return None
        best = results[0]
        return {
            'input_nama_usaha': business_name,
            'predicted_kbli': best['kode'],
            'judul': best['judul'],
            'kategori': best['kategori_kode'],
            'score': best['score']
        }

    def classify_csv(
        self,
        input_csv_path: str,
        output_csv_path: str,
        column_name: str = 'nama_usaha',
        delimiter: str = ','
    ) -> int:
        """
        Klasifikasi batch ribuan baris data survei dari file CSV secara mandiri (tanpa dependensi eksternal).
        Menambahkan kolom: predicted_kbli, judul_kbli, kategori_kbli, score_relevansi.
        """
        import csv

        in_p = Path(input_csv_path)
        out_p = Path(output_csv_path)

        if not in_p.exists():
            raise FileNotFoundError(f"File input CSV tidak ditemukan: {in_p}")

        processed_count = 0
        with open(in_p, 'r', encoding='utf-8-sig', errors='replace') as f_in, \
             open(out_p, 'w', encoding='utf-8', newline='') as f_out:

            reader = csv.DictReader(f_in, delimiter=delimiter)
            fieldnames = (reader.fieldnames or []) + ['predicted_kbli', 'judul_kbli', 'kategori_kbli', 'score_relevansi']
            writer = csv.DictWriter(f_out, fieldnames=fieldnames, delimiter=delimiter)
            writer.writeheader()

            for row in reader:
                nama = row.get(column_name, '')
                pred = self.predict_one(nama) if nama else None
                if pred:
                    row['predicted_kbli'] = pred['predicted_kbli']
                    row['judul_kbli'] = pred['judul']
                    row['kategori_kbli'] = pred['kategori']
                    row['score_relevansi'] = pred['score']
                else:
                    row['predicted_kbli'] = ''
                    row['judul_kbli'] = ''
                    row['kategori_kbli'] = ''
                    row['score_relevansi'] = ''
                writer.writerow(row)
                processed_count += 1

        print(f"[OK] Selesai mengklasifikasi {processed_count} baris ke: {out_p}")
        return processed_count


# ==============================================================================
# DEMO INTERAKTIF & PENGUJIAN MODEL
# ==============================================================================

if __name__ == '__main__':
    print("=" * 80)
    print("DEMO MODEL PENCARIAN KBLI 2025 - BPS KABUPATEN MEMPAWAH")
    print("=" * 80)

    try:
        engine = KBLISearchEngine()
    except Exception as err:
        print(f"Error inisialisasi: {err}", file=sys.stderr)
        sys.exit(1)

    # Uji Kasus Uji Klasik Disambiguasi Head-Word (DM Rules)
    test_cases = [
        "Toko Kelontong Berkah",
        "Toko Pupuk dan Racun Rumput",
        "Warung Kopi Aming",
        "Rumah Makan Padang Murah",
        "Bengkel Las Terus Jaya",
        "Bengkel Motor Honda",
        "Penggilingan Padi Sri Rejeki",
        "Perkebunan Kelapa Sawit Pak Haji Ali",
        "Angkutan Truk Ekspedisi Sawit",
        "Pangkalan Gas LPG 3kg Bu Siti",
        "Penjahit Busana Muslimah",
        "Pangkas Rambut Gaul",
        "Depot Air Minum Isi Ulang Sehat"
    ]

    print("\n--- HASIL PENGUJIAN DISAMBIGUASI NAMA USAHA ---\n")
    for name in test_cases:
        pred = engine.predict_one(name)
        if pred:
            print(f"[{name}]")
            print(f"  -> Rekomendasi KBLI : {pred['predicted_kbli']} ({pred['kategori']})")
            print(f"  -> Judul Kegiatan   : {pred['judul']}")
            print(f"  -> Skor Relevansi   : {pred['score']}")
            print("-" * 60)

    # Mode Interaktif Pengguna
    print("\nKetik nama usaha/kata kunci untuk mencoba pencarian (ketik 'exit' untuk keluar):")
    while True:
        try:
            q_user = input("\nCari KBLI > ").strip()
            if not q_user or q_user.lower() in {'exit', 'quit', 'q'}:
                break
            res = engine.search(q_user, top_k=5)
            if not res:
                print("Tidak ditemukan hasil yang relevan.")
                continue
            for idx, r in enumerate(res, 1):
                print(f"{idx}. [{r['kode']} - {r['kategori_kode']}] {r['judul']} (Skor: {r['score']})")
                print(f"   Uraian: {r['deskripsi_ringkas']}")
        except (KeyboardInterrupt, EOFError):
            break

    print("\nProgram selesai.")
