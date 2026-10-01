import os
import sys
import pandas as pd
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r"C:\Users\hp\Documents\Coding\Data Analyst\Data BPS\Database\Raw Data SE2026_01-10-2026"

def main():
    print("=" * 80)
    print("DEEP EXPLORATION & STRUCTURAL AUDIT: RAW DATA SE2026 (01-10-2026)")
    print("=" * 80)
    
    # 1. Load tables
    print("\n[1] Membaca Seluruh Berkas Parquet...")
    ass = pd.read_parquet(os.path.join(DATA_DIR, "assignment.parquet"))
    kp = pd.read_parquet(os.path.join(DATA_DIR, "kp_nested.parquet"))
    dtsen = pd.read_parquet(os.path.join(DATA_DIR, "nested_dtsen.parquet"))
    dtsen_var = pd.read_parquet(os.path.join(DATA_DIR, "nested_dtsen_var.parquet"))
    meteran = pd.read_parquet(os.path.join(DATA_DIR, "nested_meteran.parquet"))
    se_nest = pd.read_parquet(os.path.join(DATA_DIR, "se2026_nested.parquet"))
    
    print(f"  • assignment.parquet       : {len(ass):,d} baris, {len(ass.columns)} kolom")
    print(f"  • kp_nested.parquet        : {len(kp):,d} baris, {len(kp.columns)} kolom")
    print(f"  • nested_dtsen.parquet     : {len(dtsen):,d} baris, {len(dtsen.columns)} kolom")
    print(f"  • nested_dtsen_var.parquet : {len(dtsen_var):,d} baris, {len(dtsen_var.columns)} kolom")
    print(f"  • nested_meteran.parquet   : {len(meteran):,d} baris, {len(meteran.columns)} kolom")
    print(f"  • se2026_nested.parquet    : {len(se_nest):,d} baris, {len(se_nest.columns)} kolom")

    # 2. Audit assignment.parquet
    print("\n" + "=" * 80)
    print("[2] AUDIT: assignment.parquet (Tabel Utama Penugasan / Master Responden)")
    print("=" * 80)
    print("Kolom Utama:")
    for col in ass.columns:
        if any(k in col.lower() for k in ['id', 'status', 'petugas', 'pcl', 'pml', 'nama', 'lat', 'long', 'lng', 'coord', 'desa', 'kec', 'sls', 'usaha']):
            print(f"  - {col}: non-null={ass[col].notna().sum():,}/{len(ass):,}, unique={ass[col].nunique():,}")
    
    # Coordinate check in assignment
    ass_lat_cols = [c for c in ass.columns if 'lat' in c.lower()]
    ass_lng_cols = [c for c in ass.columns if any(k in c.lower() for k in ['long', 'lng'])]
    print(f"\nKolom Latitude di assignment : {ass_lat_cols}")
    print(f"Kolom Longitude di assignment: {ass_lng_cols}")
    
    for c in ass_lat_cols + ass_lng_cols:
        vals = pd.to_numeric(ass[c], errors='coerce')
        valid = vals.notna().sum()
        print(f"  * {c}: valid numeric={valid:,} ({valid/len(ass)*100:.2f}%), min={vals.min()}, max={vals.max()}")

    # 3. Audit nested_dtsen & se2026_nested
    print("\n" + "=" * 80)
    print("[3] AUDIT: nested_dtsen.parquet (Daftar Keluarga / Roster KK)")
    print("=" * 80)
    print(f"Total baris DTSEN: {len(dtsen):,}")
    print("Kolom DTSEN:", list(dtsen.columns))
    
    print("\n" + "=" * 80)
    print("[4] AUDIT: se2026_nested.parquet (Roster Usaha Ekonomi)")
    print("=" * 80)
    print(f"Total baris Usaha SE2026: {len(se_nest):,}")
    key_se_cols = [c for c in se_nest.columns if any(k in c.lower() for k in ['id', 'nama', 'usaha', 'skala', 'kbli', 'lat', 'long', 'omset', 'pendapatan', 'tenaga'])]
    print("Kolom Utama Usaha:", key_se_cols[:15])

    # 4. Audit nested_meteran.parquet
    print("\n" + "=" * 80)
    print("[5] AUDIT: nested_meteran.parquet (Data Meteran Listrik / PLN)")
    print("=" * 80)
    print(f"Total baris Meteran: {len(meteran):,}")
    print("Kolom Meteran:", list(meteran.columns))
    for c in meteran.columns:
        print(f"  - {c}: non-null={meteran[c].notna().sum():,}, sample={meteran[c].dropna().head(3).tolist()}")

    # 5. Relationship / Join Keys Check
    print("\n" + "=" * 80)
    print("[6] RELASI & JOIN ANTAR TABEL (Primary Keys & Foreign Keys)")
    print("=" * 80)
    print(f"Unique 'id' di assignment.parquet            : {ass['id'].nunique():,}")
    if 'assignment_id' in dtsen.columns:
        print(f"Unique 'assignment_id' di nested_dtsen.parquet: {dtsen['assignment_id'].nunique():,}")
        match_dtsen = dtsen['assignment_id'].isin(ass['id']).sum()
        print(f"  -> {match_dtsen:,}/{len(dtsen):,} ({match_dtsen/len(dtsen)*100:.2f}%) cocok dengan assignment.id")
    
    if 'assignment_id' in se_nest.columns:
        print(f"Unique 'assignment_id' di se2026_nested.parquet: {se_nest['assignment_id'].nunique():,}")
        match_se = se_nest['assignment_id'].isin(ass['id']).sum()
        print(f"  -> {match_se:,}/{len(se_nest):,} ({match_se/len(se_nest)*100:.2f}%) cocok dengan assignment.id")

    if 'assignment_id' in meteran.columns:
        print(f"Unique 'assignment_id' di nested_meteran.parquet: {meteran['assignment_id'].nunique():,}")
        match_met = meteran['assignment_id'].isin(ass['id']).sum()
        print(f"  -> {match_met:,}/{len(meteran):,} ({match_met/len(meteran)*100:.2f}%) cocok dengan assignment.id")

    # 6. Status distribution in assignment
    print("\n" + "=" * 80)
    print("[7] DISTRIBUSI STATUS & WILAYAH PADA assignment.parquet")
    print("=" * 80)
    for stat_col in ['status_alias', 'status', 'assignment_status_alias', 'root_assignment_status_alias']:
        if stat_col in ass.columns:
            print(f"\nDistribusi {stat_col}:")
            print(ass[stat_col].value_counts(dropna=False))

    # 7. Coordinate Validity & Outlier Filtering
    print("\n" + "=" * 80)
    print("[8] ANALISIS KUALITAS KOORDINAT & BOUNDS FILTERING (KAB. MEMPAWAH)")
    print("=" * 80)
    
    # Check assignment coordinates
    lat_col = 'latitude' if 'latitude' in ass.columns else 'lat'
    lng_col = 'longitude' if 'longitude' in ass.columns else 'lng'
    if lat_col in ass.columns and lng_col in ass.columns:
        lats = pd.to_numeric(ass[lat_col], errors='coerce')
        lngs = pd.to_numeric(ass[lng_col], errors='coerce')
        
        # Valid Mempawah bounds: Lat between -1.0 and 1.5, Lng between 108.0 and 110.5
        valid_direct = (lats >= -1.0) & (lats <= 1.5) & (lngs >= 108.0) & (lngs <= 110.5)
        # Swapped check (Lng is Lat, Lat is Lng)
        swapped = (lngs >= -1.0) & (lngs <= 1.5) & (lats >= 108.0) & (lats <= 110.5)
        # Zero coordinates
        zeros = (lats == 0) & (lngs == 0)
        # Nulls
        nulls = lats.isna() | lngs.isna()
        # Out of bounds
        out_bounds = (~valid_direct) & (~swapped) & (~zeros) & (~nulls)
        
        print(f"Total Assignment Records: {len(ass):,}")
        print(f"  ✔ Koordinat Valid Langsung Mempawah : {valid_direct.sum():,} ({valid_direct.sum()/len(ass)*100:.2f}%)")
        print(f"  ✔ Koordinat Terbalik (Swapped Lat/Lng): {swapped.sum():,} ({swapped.sum()/len(ass)*100:.2f}%)")
        print(f"  ⚠️ Koordinat Nol (0, 0)               : {zeros.sum():,} ({zeros.sum()/len(ass)*100:.2f}%)")
        print(f"  ⚠️ Koordinat Null / Kosong            : {nulls.sum():,} ({nulls.sum()/len(ass)*100:.2f}%)")
        print(f"  ❌ Koordinat Out of Bounds (Anomali)  : {out_bounds.sum():,} ({out_bounds.sum()/len(ass)*100:.2f}%)")

if __name__ == "__main__":
    main()
