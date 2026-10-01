import os
import sys
import pandas as pd
import numpy as np

# Reconfigure stdout to utf-8 for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = r"C:\Users\hp\Documents\Coding\Data Analyst\Data BPS\Database\Raw Data SE2026_01-10-2026"

def explore():
    print("=" * 80)
    print("EKSPLORASI DATASET SE2026 UPDATE (01-10-2026)")
    print("=" * 80)
    
    files = [f for f in os.listdir(DATA_DIR) if f.endswith('.parquet')]
    print(f"Ditemukan {len(files)} berkas Parquet di direktori:")
    for f in sorted(files):
        fpath = os.path.join(DATA_DIR, f)
        sz_mb = os.path.getsize(fpath) / (1024 * 1024)
        print(f"  * {f:<28} ({sz_mb:.2f} MB)")
    
    print("\n" + "=" * 80)
    
    dfs = {}
    for f in sorted(files):
        fpath = os.path.join(DATA_DIR, f)
        df = pd.read_parquet(fpath)
        dfs[f] = df
        print(f"\n[FILE] {f}")
        print(f"   * Total Baris : {len(df):,}")
        print(f"   * Total Kolom : {len(df.columns)}")
        print(f"   * Kolom-Kolom :")
        for i, col in enumerate(df.columns):
            dtype = df[col].dtype
            null_cnt = df[col].isna().sum()
            null_pct = (null_cnt / len(df)) * 100 if len(df) > 0 else 0
            n_unique = df[col].nunique(dropna=True)
            print(f"     {i+1:2d}. {col:<35} | Tipe: {str(dtype):<10} | Null: {null_cnt:,} ({null_pct:.1f}%) | Unique: {n_unique:,}")
        
        # Check for coordinates
        coord_cols = [c for c in df.columns if any(k in c.lower() for k in ['lat', 'long', 'lng', 'coord', 'gps', 'geo', 'titik', 'x', 'y'])]
        if coord_cols:
            print(f"\n   * Analisis Kolom Koordinat:")
            for c in coord_cols:
                non_null = df[c].notna().sum()
                sample_vals = df[c].dropna().head(3).tolist()
                print(f"     - {c}: {non_null:,} terisi ({non_null/len(df)*100:.2f}%) | Contoh: {sample_vals}")
        
        print("\n" + "-" * 80)

if __name__ == "__main__":
    explore()
