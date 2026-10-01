import os
import sys
import pandas as pd
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r"C:\Users\hp\Documents\Coding\Data Analyst\Data BPS\Database\Raw Data SE2026_01-10-2026"

ass = pd.read_parquet(os.path.join(DATA_DIR, "assignment.parquet"))

print("Assignment total rows:", len(ass))

# Identify status columns
status_cols = [c for c in ass.columns if any(k in c.lower() for k in ['status', 'keberadaan', 'ditemukan', 'kondisi', 'hasil'])]
print("\nStatus related columns in assignment:")
for c in status_cols:
    s = ass[c].dropna()
    print(f"  • {c:<40} | non-null={len(s):,} | unique={ass[c].nunique()} | sample={s.unique()[:4].tolist()}")

# Check geotag validity
lats = pd.to_numeric(ass['root_geotag_latitude'], errors='coerce')
lngs = pd.to_numeric(ass['root_geotag_longitude'], errors='coerce')

is_valid_geo = (
    ((lats >= -1.0) & (lats <= 1.5) & (lngs >= 108.0) & (lngs <= 110.5)) |
    ((lats >= 108.0) & (lats <= 110.5) & (lngs >= -1.0) & (lngs <= 1.5))
)

ass['has_geotag'] = is_valid_geo
no_geo = ass[~is_valid_geo].copy()

print(f"\nTotal Tanpa Geotag: {len(no_geo):,} ({len(no_geo)/len(ass)*100:.2f}%)")

# Let's inspect submit status and keberadaan columns for no_geo
submit_col = 'assignment_status_alias' if 'assignment_status_alias' in ass.columns else 'status_alias'
# Let's find keberadaan column
for c in ['root_status_keluarga_label', 'root_status_keluarga_value', 'root_keberadaan_keluarga_label', 'root_status_keberadaan', 'root_keberadaan_label', 'se2026_keberadaan_usaha_label']:
    if c in ass.columns:
        print(f"\nDistribusi {c} pada data TANPA Geotag:")
        print(no_geo[c].value_counts(dropna=False))

print("\n--- TABULASI SILANG (CROSS-TABULATION): Status Submit x Status Keberadaan (Tanpa Geotag) ---")
keb_cols = [c for c in no_geo.columns if 'keberadaan' in c.lower() or 'status_keluarga' in c.lower()]
print("Pilihan kolom keberadaan:", keb_cols)

for kc in keb_cols:
    if no_geo[kc].nunique() > 1:
        print(f"\n>>> Cross Tab: {submit_col} x {kc} <<<")
        ct = pd.crosstab(no_geo[submit_col].fillna('(Null)'), no_geo[kc].fillna('(Null)'), margins=True)
        print(ct.to_string())
