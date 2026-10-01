import os
import sys
import pandas as pd
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r"C:\Users\hp\Documents\Coding\Data Analyst\Data BPS\Database\Raw Data SE2026_01-10-2026"

ass = pd.read_parquet(os.path.join(DATA_DIR, "assignment.parquet"))

lats = pd.to_numeric(ass['root_geotag_latitude'], errors='coerce')
lngs = pd.to_numeric(ass['root_geotag_longitude'], errors='coerce')
is_valid_geo = (
    ((lats >= -1.0) & (lats <= 1.5) & (lngs >= 108.0) & (lngs <= 110.5)) |
    ((lats >= 108.0) & (lats <= 110.5) & (lngs >= -1.0) & (lngs <= 1.5))
)
no_geo = ass[~is_valid_geo].copy()

print("=" * 100)
print(f"REKAP LENGKAP ASSIGNMENT TANPA GEOTAGGING (TOTAL: {len(no_geo):,} DARI {len(ass):,} ASSIGNMENT)")
print("=" * 100)

# 1. Tabel 1: Status Submit (assignment_status_alias) x Status Keberadaan Keluarga (root_ada_keluarga_label)
no_geo['status_submit'] = no_geo['assignment_status_alias'].fillna('(Null / Belum Submit)')
no_geo['status_keluarga'] = no_geo['root_ada_keluarga_label'].replace('', '(Kosong / Tidak Tercatat)').fillna('(Null / Non-Respon)')

ct_kel = pd.crosstab(
    no_geo['status_submit'], 
    no_geo['status_keluarga'], 
    margins=True, 
    margins_name='TOTAL'
)

print("\n[TABEL 1] TABULASI SILANG: STATUS SUBMIT ASSIGNMENT x STATUS KEBERADAAN KELUARGA")
print("-" * 100)
print(ct_kel.to_string())

# 2. Tabel 2: Status Submit x Status Keberadaan Usaha (se2026_keberadaan_usaha_label)
no_geo['status_usaha'] = no_geo['se2026_keberadaan_usaha_label'].replace('', '(Kosong / Non-Usaha)').fillna('(Null / Non-Usaha)')

ct_usaha = pd.crosstab(
    no_geo['status_submit'], 
    no_geo['status_usaha'], 
    margins=True, 
    margins_name='TOTAL'
)

print("\n" + "=" * 100)
print("[TABEL 2] TABULASI SILANG: STATUS SUBMIT ASSIGNMENT x STATUS KEBERADAAN USAHA")
print("-" * 100)
print(ct_usaha.to_string())

# 3. Rekap Tunggal Status Submit
print("\n" + "=" * 100)
print("[TABEL 3] REKAPITULASI TUNGGAL STATUS SUBMIT ASSIGNMENT (TANPA GEOTAG)")
print("-" * 100)
submit_recap = no_geo['status_submit'].value_counts().reset_index()
submit_recap.columns = ['Status Submit Assignment', 'Jumlah Assignment']
submit_recap['Persentase (%)'] = (submit_recap['Jumlah Assignment'] / len(no_geo)) * 100
print(submit_recap.to_string(index=False))

# 4. Rekap Tunggal Status Keberadaan Keluarga
print("\n" + "=" * 100)
print("[TABEL 4] REKAPITULASI TUNGGAL STATUS KEBERADAAN KELUARGA (TANPA GEOTAG)")
print("-" * 100)
kel_recap = no_geo['status_keluarga'].value_counts().reset_index()
kel_recap.columns = ['Status Keberadaan Keluarga', 'Jumlah Assignment']
kel_recap['Persentase (%)'] = (kel_recap['Jumlah Assignment'] / len(no_geo)) * 100
print(kel_recap.to_string(index=False))

# 5. Rekap Tunggal Status Keberadaan Usaha
print("\n" + "=" * 100)
print("[TABEL 5] REKAPITULASI TUNGGAL STATUS KEBERADAAN USAHA (TANPA GEOTAG)")
print("-" * 100)
usaha_recap = no_geo['status_usaha'].value_counts().reset_index()
usaha_recap.columns = ['Status Keberadaan Usaha', 'Jumlah Assignment']
usaha_recap['Persentase (%)'] = (usaha_recap['Jumlah Assignment'] / len(no_geo)) * 100
print(usaha_recap.to_string(index=False))
