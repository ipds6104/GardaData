import os
import sys
import pandas as pd
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r"C:\Users\hp\Documents\Coding\Data Analyst\Data BPS\Database\Raw Data SE2026_01-10-2026"

ass = pd.read_parquet(os.path.join(DATA_DIR, "assignment.parquet"))
se_nest = pd.read_parquet(os.path.join(DATA_DIR, "se2026_nested.parquet"))

def is_filled(series):
    return series.astype(str).str.strip().replace(['', 'None', 'nan', 'NaN', 'null', 'NULL', '-'], np.nan).notna()

# 1. Coordinate check
lats = pd.to_numeric(ass['root_geotag_latitude'], errors='coerce')
lngs = pd.to_numeric(ass['root_geotag_longitude'], errors='coerce')
is_valid_geo = (
    ((lats >= -1.0) & (lats <= 1.5) & (lngs >= 108.0) & (lngs <= 110.5)) |
    ((lats >= 108.0) & (lats <= 110.5) & (lngs >= -1.0) & (lngs <= 1.5))
)
ass['has_valid_geo'] = is_valid_geo

print("=" * 95)
print("AUDIT KELENGKAPAN KOORDINAT PADA ASSIGNMENT YANG STATUS KEBERADAANNYA DITEMUKAN")
print("=" * 95)

# A. Berdasarkan Status Formal
# 1. Formal Keluarga Ditemukan (root_ada_keluarga_label == '1. Ditemukan' or '2. Baru')
formal_kel_ditemukan = ass['root_ada_keluarga_label'].isin(['1. Ditemukan', '2. Baru'])
# 2. Formal Usaha Ditemukan (se2026_keberadaan_usaha_label == '1. Ditemukan' or '2. Baru')
formal_usaha_ditemukan = ass['se2026_keberadaan_usaha_label'].isin(['1. Ditemukan', '2. Baru'])

print("\n--- [A] ANALISIS BERDASARKAN STATUS FORMAL KUESIONER ---")
print(f"1. Responden dengan Status Keluarga '1. Ditemukan' / '2. Baru': {formal_kel_ditemukan.sum():,} baris")
geo_kel_formal = ass[formal_kel_ditemukan]['has_valid_geo'].sum()
print(f"   • Memiliki Koordinat Geotag GPS Valid : {geo_kel_formal:,} / {formal_kel_ditemukan.sum():,} ({geo_kel_formal/formal_kel_ditemukan.sum()*100:.2f}%)")
print(f"   • Tanpa Koordinat GPS                 : {(~ass[formal_kel_ditemukan]['has_valid_geo']).sum():,} baris")

print(f"\n2. Responden dengan Status Usaha '1. Ditemukan' / '2. Baru'   : {formal_usaha_ditemukan.sum():,} baris")
geo_usaha_formal = ass[formal_usaha_ditemukan]['has_valid_geo'].sum()
print(f"   • Memiliki Koordinat Geotag GPS Valid : {geo_usaha_formal:,} / {formal_usaha_ditemukan.sum():,} ({geo_usaha_formal/formal_usaha_ditemukan.sum()*100:.2f}%)")
print(f"   • Tanpa Koordinat GPS                 : {(~ass[formal_usaha_ditemukan]['has_valid_geo']).sum():,} baris")


# B. Berdasarkan Ciri Substantif (Kondisi Bangunan & Biaya/Penjualan Usaha)
# Ciri Keluarga Ditemukan: Isian kondisi fisik bangunan (atap, dinding, lantai) terisi lengkap
has_atap = is_filled(ass['root_kondisi_atap_label'])
has_dinding = is_filled(ass['root_kondisi_dinding_label'])
has_lantai = is_filled(ass['root_kondisi_lantai_label'])
has_bangunan_lengkap = has_atap & has_dinding & has_lantai

# Ciri Usaha Ditemukan (di assignment atau se2026_nested):
# Memiliki isian biaya produksi dan penjualan / pendapatan
# Check in se2026_nested
se_with_sales_cost = se_nest[
    (is_filled(se_nest['total_pendapatan']) | is_filled(se_nest['biaya_produksi']) | is_filled(se_nest['total_pengeluaran']))
]
ass_ids_se_active = set(se_with_sales_cost['assignment_id'].dropna().astype(str))

# Also in assignment columns if any
ass_has_sales_cost = is_filled(ass['se2026_total_pendapatan']) | is_filled(ass['se2026_biaya_produksi']) | is_filled(ass['se2026_total_pengeluaran']) | ass['assignment_id'].astype(str).isin(ass_ids_se_active)

print("\n" + "=" * 95)
print("--- [B] ANALISIS BERDASARKAN CIRI SUBSTANTIF KELENGKAPAN ISIAN LAPANGAN ---")
print("=" * 95)

print(f"1. KELUARGA SUBSTANTIF DITEMUKAN (Isian Kondisi Bangunan Atap, Dinding, Lantai Lengkap):")
print(f"   • Total Assignment dengan Bangunan Lengkap : {has_bangunan_lengkap.sum():,} baris")
geo_bangunan = ass[has_bangunan_lengkap]['has_valid_geo'].sum()
no_geo_bangunan = (~ass[has_bangunan_lengkap]['has_valid_geo']).sum()
print(f"   • Memiliki Koordinat Geotag GPS Valid     : {geo_bangunan:,} / {has_bangunan_lengkap.sum():,} ({geo_bangunan/has_bangunan_lengkap.sum()*100:.2f}%)")
print(f"   • Tanpa Koordinat GPS                     : {no_geo_bangunan:,} baris ({no_geo_bangunan/has_bangunan_lengkap.sum()*100:.2f}%)")

print(f"\n2. USAHA SUBSTANTIF DITEMUKAN (Ada Isian Biaya Produksi / Total Pengeluaran / Penjualan):")
print(f"   • Total Assignment dengan Data Usaha Riil : {ass_has_sales_cost.sum():,} baris")
geo_usaha_riil = ass[ass_has_sales_cost]['has_valid_geo'].sum()
no_geo_usaha_riil = (~ass[ass_has_sales_cost]['has_valid_geo']).sum()
print(f"   • Memiliki Koordinat Geotag GPS Valid     : {geo_usaha_riil:,} / {ass_has_sales_cost.sum():,} ({geo_usaha_riil/ass_has_sales_cost.sum()*100:.2f}%)")
print(f"   • Tanpa Koordinat GPS                     : {no_geo_usaha_riil:,} baris ({no_geo_usaha_riil/ass_has_sales_cost.sum()*100:.2f}%)")

print(f"\n3. GABUNGAN: KELUARGA DITEMUKAN ATAU USAHA DITEMUKAN (SUBSTANTIF):")
combined_found = has_bangunan_lengkap | ass_has_sales_cost
geo_combined = ass[combined_found]['has_valid_geo'].sum()
no_geo_combined = (~ass[combined_found]['has_valid_geo']).sum()
print(f"   • Total Responden Substantif Ditemukan    : {combined_found.sum():,} baris")
print(f"   • Memiliki Koordinat Geotag GPS Valid     : {geo_combined:,} / {combined_found.sum():,} ({geo_combined/combined_found.sum()*100:.2f}%)")
print(f"   • Tanpa Koordinat GPS                     : {no_geo_combined:,} baris ({no_geo_combined/combined_found.sum()*100:.2f}%)")

if no_geo_combined > 0:
    print("\nDetail Responden Substantif Ditemukan tapi TANPA Koordinat GPS:")
    no_geo_found_df = ass[combined_found & (~ass['has_valid_geo'])]
    print(no_geo_found_df[['assignment_id', 'assignment_status_alias', 'root_level_3_name', 'root_level_4_name', 'root_nama_principal']].head(10).to_string())
