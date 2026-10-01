import os
import sys
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r"C:\Users\hp\Documents\Coding\Data Analyst\Data BPS\Database\Raw Data SE2026_01-10-2026"

ass = pd.read_parquet(os.path.join(DATA_DIR, "assignment.parquet"))

cols = [c for c in ass.columns if any(k in c.lower() for k in ['status', 'keberadaan', 'keluarga', 'kondisi', 'hasil', 'ditemukan'])]
print("Matching columns in assignment:")
for c in cols:
    uniq = ass[c].dropna().unique()
    if len(uniq) < 20:
        print(f"  • {c:<35}: {uniq.tolist()}")

lats = pd.to_numeric(ass['root_geotag_latitude'], errors='coerce')
lngs = pd.to_numeric(ass['root_geotag_longitude'], errors='coerce')
is_valid_geo = (
    ((lats >= -1.0) & (lats <= 1.5) & (lngs >= 108.0) & (lngs <= 110.5)) |
    ((lats >= 108.0) & (lats <= 110.5) & (lngs >= -1.0) & (lngs <= 1.5))
)
no_geo = ass[~is_valid_geo].copy()

# Look at root_keberadaan_keluarga or root_status_keberadaan or root_status_keluarga or se2026_keberadaan_usaha_label
for c in ['root_keberadaan_keluarga_label', 'root_status_keluarga_label', 'root_keberadaan_label', 'se2026_keberadaan_usaha_label']:
    if c in no_geo.columns:
        print(f"\nValue counts for {c} in NO_GEOTAG:")
        print(no_geo[c].value_counts(dropna=False))
