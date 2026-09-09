import struct
import json
import os
import shutil

def ring_area(pts):
    area = 0.0
    for i in range(len(pts) - 1):
        area += pts[i][0] * pts[i+1][1] - pts[i+1][0] * pts[i][1]
    return area / 2.0

def convert_sls_shp_to_geojson(shp_path, dbf_path, out_geojson_path):
    print(f"Membaca DBF: {dbf_path}...")
    with open(dbf_path, 'rb') as f:
        header = f.read(32)
        num_records = int.from_bytes(header[4:8], 'little')
        header_len = int.from_bytes(header[8:10], 'little')
        record_len = int.from_bytes(header[10:12], 'little')
        fields = []
        while f.tell() < header_len - 1:
            fdesc = f.read(32)
            if fdesc[0] == 0x0D:
                break
            name = fdesc[:11].replace(b'\x00', b'').decode('ascii', errors='ignore')
            ftype = chr(fdesc[11])
            flen = fdesc[16]
            fields.append((name, ftype, flen))
        f.seek(header_len)
        records = []
        for _ in range(num_records):
            rec_bytes = f.read(record_len)
            if not rec_bytes or rec_bytes[0] == 0x2A:
                records.append({})
                continue
            offset = 1
            rec = {}
            for fname, ftype, flen in fields:
                val = rec_bytes[offset:offset+flen].decode('utf-8', errors='ignore').strip()
                rec[fname] = val
                offset += flen
            records.append(rec)

    print(f"Membaca SHP: {shp_path}...")
    features = []
    with open(shp_path, 'rb') as f:
        f.seek(100)
        idx = 0
        while True:
            hdr = f.read(8)
            if len(hdr) < 8:
                break
            rec_num, rec_len = struct.unpack('>ii', hdr)
            rec_data = f.read(rec_len * 2)
            if len(rec_data) < rec_len * 2:
                break

            stype, = struct.unpack('<i', rec_data[0:4])
            if stype == 5: # Polygon
                box = struct.unpack('<dddd', rec_data[4:36])
                num_parts, num_points = struct.unpack('<ii', rec_data[36:44])
                parts = struct.unpack(f'<{num_parts}i', rec_data[44:44 + 4*num_parts])
                pts_start = 44 + 4*num_parts

                rings = []
                for p in range(num_parts):
                    sp = parts[p]
                    ep = parts[p+1] if p+1 < num_parts else num_points
                    ring_pts = []
                    for pt_idx in range(sp, ep):
                        px, py = struct.unpack('<dd', rec_data[pts_start + pt_idx*16 : pts_start + (pt_idx+1)*16])
                        ring_pts.append([round(px, 6), round(py, 6)])
                    if len(ring_pts) >= 4:
                        rings.append(ring_pts)

                polygons = []
                current_poly = None
                for ring in rings:
                    area = ring_area(ring)
                    if area < 0 or current_poly is None:
                        if current_poly:
                            polygons.append(current_poly)
                        current_poly = [ring]
                    else:
                        current_poly.append(ring)
                if current_poly:
                    polygons.append(current_poly)

                if len(polygons) == 1:
                    geom = {
                        'type': 'Polygon',
                        'coordinates': polygons[0]
                    }
                else:
                    geom = {
                        'type': 'MultiPolygon',
                        'coordinates': polygons
                    }

                props = records[idx] if idx < len(records) else {}
                features.append({
                    'type': 'Feature',
                    'id': props.get('idsls', str(idx)),
                    'properties': props,
                    'bbox': [round(box[0], 6), round(box[1], 6), round(box[2], 6), round(box[3], 6)],
                    'geometry': geom
                })
            idx += 1

    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }

    os.makedirs(os.path.dirname(out_geojson_path), exist_ok=True)
    with open(out_geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, separators=(',', ':'))

    print(f"Sukses mengonversi {len(features)} SLS ke {out_geojson_path} ({os.path.getsize(out_geojson_path)/1024:.1f} KB)")

def copy_and_minify_geojson(src_path, dest_path):
    print(f"Menyalin & optimasi: {src_path} -> {dest_path}")
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(src_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    with open(dest_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'))
    print(f"Tersimpan: {dest_path} ({os.path.getsize(dest_path)/1024:.1f} KB)")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    shp_path = os.path.join(base_dir, 'Batas SLS', 'Batas SLS 2024.shp')
    dbf_path = os.path.join(base_dir, 'Batas SLS', 'Batas SLS 2024.dbf')
    out_sls = os.path.join(base_dir, 'public', 'data', 'batas_sls_6104.geojson')
    
    convert_sls_shp_to_geojson(shp_path, dbf_path, out_sls)

    parent_dir = os.path.dirname(base_dir)
    kec_src = os.path.join(parent_dir, 'Layouting', 'Peta Digital', '6104', 'final_kec_202316104.geojson')
    desa_src = os.path.join(parent_dir, 'Layouting', 'Peta Digital', '6104', 'final_desa_202316104.geojson')

    if os.path.exists(kec_src):
        out_kec = os.path.join(base_dir, 'public', 'data', 'batas_kecamatan_6104.geojson')
        copy_and_minify_geojson(kec_src, out_kec)
    else:
        print(f"Warning: File batas kecamatan tidak ditemukan di {kec_src}")

    if os.path.exists(desa_src):
        out_desa = os.path.join(base_dir, 'public', 'data', 'batas_desa_6104.geojson')
        copy_and_minify_geojson(desa_src, out_desa)
    else:
        print(f"Warning: File batas desa tidak ditemukan di {desa_src}")

    print("Semua data geospasial siap digunakan!")

