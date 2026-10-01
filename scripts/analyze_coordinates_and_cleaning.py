import os
import sys
import pandas as pd
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r"C:\Users\hp\Documents\Coding\Data Analyst\Data BPS\Database\Raw Data SE2026_01-10-2026"

def main():
    print("=" * 80)
    print("DETAILED COORDINATE & BUSINESS/HOUSEHOLD ANALYSIS (01-10-2026)")
    print("=" * 80)
    
    ass = pd.read_parquet(os.path.join(DATA_DIR, "assignment.parquet"))
    dtsen = pd.read_parquet(os.path.join(DATA_DIR, "nested_dtsen.parquet"))
    se_nest = pd.read_parquet(os.path.join(DATA_DIR, "se2026_nested.parquet"))
    meteran = pd.read_parquet(os.path.join(DATA_DIR, "nested_meteran.parquet"))
    
    print("\n--- ALL LAT/LNG COLUMNS IN ASSIGNMENT ---")
    coord_cols = [c for c in ass.columns if any(k in c.lower() for k in ['lat', 'long', 'lng', 'coord', 'gps'])]
    for c in coord_cols:
        s = ass[c].dropna()
        print(f"Column '{c}': {len(s):,} non-null values. Dtype: {ass[c].dtype}. Samples: {s.head(3).tolist()}")
        
    # Check primary coordinates in assignment
    # Let's inspect root_latitude / latitude / etc.
    lat_col = 'latitude' if 'latitude' in ass.columns else None
    lng_col = 'longitude' if 'longitude' in ass.columns else None
    
    print(f"\nEvaluating '{lat_col}' and '{lng_col}':")
    if lat_col and lng_col:
        lats = pd.to_numeric(ass[lat_col], errors='coerce')
        lngs = pd.to_numeric(ass[lng_col], errors='coerce')
        
        # Valid Mempawah bounds
        # Normal: lat in [-1.0, 1.5], lng in [108.0, 110.5]
        is_normal = (lats >= -1.0) & (lats <= 1.5) & (lngs >= 108.0) & (lngs <= 110.5)
        # Swapped: lat in [108.0, 110.5], lng in [-1.0, 1.5]
        is_swapped = (lats >= 108.0) & (lats <= 110.5) & (lngs >= -1.0) & (lngs <= 1.5)
        is_zero = (lats == 0) & (lngs == 0)
        is_null = lats.isna() | lngs.isna()
        is_outlier = (~is_normal) & (~is_swapped) & (~is_zero) & (~is_null)
        
        print(f"Total Baris Penugasan (Assignment)   : {len(ass):,}")
        print(f"  1. Koordinat Valid Mempawah (Normal) : {is_normal.sum():,} ({is_normal.sum()/len(ass)*100:.2f}%)")
        print(f"  2. Koordinat Terbalik (Swapped X/Y) : {is_swapped.sum():,} ({is_swapped.sum()/len(ass)*100:.2f}%)")
        print(f"  3. Koordinat Nol (0, 0)              : {is_zero.sum():,} ({is_zero.sum()/len(ass)*100:.2f}%)")
        print(f"  4. Koordinat Kosong (Null/NaN)       : {is_null.sum():,} ({is_null.sum()/len(ass)*100:.2f}%)")
        print(f"  5. Koordinat Outlier / Di Luar Batas : {is_outlier.sum():,} ({is_outlier.sum()/len(ass)*100:.2f}%)")
        
        total_geotagged = is_normal.sum() + is_swapped.sum()
        print(f"  -> TOTAL BERSIH KOORDINAT GEOTAG LAPANGAN: {total_geotagged:,} ({total_geotagged/len(ass)*100:.2f}%)")
        
        if is_outlier.sum() > 0:
            print("\nContoh Koordinat Outlier:")
            out_df = ass[is_outlier][[lat_col, lng_col, 'level_3_name', 'level_4_name']].head(10)
            print(out_df.to_string())

    print("\n--- DISTRIBUSI WILAYAH PER KECAMATAN (ASSIGNMENT) ---")
    if 'level_3_name' in ass.columns:
        kec_dist = ass.groupby(['level_3_code', 'level_3_name']).size().reset_index(name='total_responden')
        # Also count geotagged
        ass['is_geo'] = is_normal | is_swapped
        ass['is_geo_valid'] = ass['is_geo'].astype(int)
        kec_geo = ass.groupby(['level_3_code', 'level_3_name'])['is_geo_valid'].sum().reset_index(name='geotagged')
        kec_merged = pd.merge(kec_dist, kec_geo, on=['level_3_code', 'level_3_name'])
        kec_merged['pct_geotagged'] = (kec_merged['geotagged'] / kec_merged['total_responden']) * 100
        print(kec_merged.to_string(index=False))

    print("\n--- ANALISIS SE2026 ROSTER USAHA ---")
    print(f"Total rekod usaha di se2026_nested: {len(se_nest):,}")
    print("Distribusi skala usaha:")
    if 'skala_usaha' in se_nest.columns:
        print(se_nest['skala_usaha'].value_counts(dropna=False))
    
    print("\nDistribusi kategori usaha / kbli:")
    kbli_cols = [c for c in se_nest.columns if 'kbli' in c.lower()]
    print(f"KBLI columns in se2026_nested: {kbli_cols}")
    for k in kbli_cols:
        print(f"  - {k}: non-null={se_nest[k].notna().sum():,}, unique={se_nest[k].nunique():,}")

    print("\n--- ANALISIS DTSEN KELUARGA & ART ---")
    print(f"Total rekod ART/Keluarga di nested_dtsen: {len(dtsen):,}")
    for c in dtsen.columns:
        if any(k in c.lower() for k in ['nik', 'nama', 'hubungan', 'usaha', 'pekerjaan']):
            print(f"  - {c}: non-null={dtsen[c].notna().sum():,}, unique={dtsen[c].nunique():,}")

    print("\n--- ANALISIS METERAN LISTRIK (PLN) ---")
    print(f"Total rekod meteran di nested_meteran: {len(meteran):,}")
    idpel_filled = meteran['id_pelanggan'].replace('', np.nan).notna().sum()
    meter_filled = meteran['no_meteran'].replace('', np.nan).notna().sum()
    print(f"  - ID Pelanggan terisi: {idpel_filled:,} ({idpel_filled/len(meteran)*100:.2f}%)")
    print(f"  - No Meteran terisi  : {meter_filled:,} ({meter_filled/len(meteran)*100:.2f}%)")

if __name__ == "__main__":
    main()
