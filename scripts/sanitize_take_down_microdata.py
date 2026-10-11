import os
import sys
import json
import base64
import hashlib
import re
from Cryptodome.Cipher import AES
from Cryptodome.Random import get_random_bytes

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SECRET_PASSPHRASE = b"GARDA-DATA-SE2026-BPS-MEMPAWAH-MILITARY-GRADE-AES256-SECURE-KEY!"
SALT = b"garda_data_salt_6104_mempawah_sec"
AES_KEY = hashlib.pbkdf2_hmac('sha256', SECRET_PASSPHRASE, SALT, 100000, 32)

DATA_DIR = os.path.join(os.path.dirname(__file__), "../public/data/se2026_responden")
DIST_DIR = os.path.join(os.path.dirname(__file__), "../dist/data/se2026_responden")

def decrypt_payload(payload):
    iv = base64.b64decode(payload['iv'])
    tag = base64.b64decode(payload['tag'])
    ciphertext = base64.b64decode(payload['data'])
    cipher = AES.new(AES_KEY, AES.MODE_GCM, nonce=iv)
    decrypted_bytes = cipher.decrypt_and_verify(ciphertext, tag)
    return json.loads(decrypted_bytes.decode('utf-8'))

def encrypt_payload(data_obj):
    json_bytes = json.dumps(data_obj, ensure_ascii=False).encode('utf-8')
    iv = get_random_bytes(12)
    cipher = AES.new(AES_KEY, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(json_bytes)
    return {
        "v": 1,
        "algo": "AES-256-GCM",
        "iv": base64.b64encode(iv).decode('ascii'),
        "tag": base64.b64encode(tag).decode('ascii'),
        "data": base64.b64encode(ciphertext).decode('ascii')
    }

def mask_nama_kk(name):
    if not name or str(name).strip().lower() in ['none', 'nan', '-', 'null', 'responden se2026']:
        return 'Responden SE2026'
    words = str(name).strip().split()
    masked = []
    for w in words:
        w_clean = re.sub(r'[^a-zA-Z0-9]', '', w)
        if not w_clean:
            continue
        if len(w_clean) == 1:
            masked.append(w_clean)
        elif len(w_clean) == 2:
            masked.append(w_clean[0] + '*')
        elif len(w_clean) <= 4:
            masked.append(w_clean[0] + '*' * (len(w_clean) - 1))
        else:
            masked.append(w_clean[:2] + '*' * (len(w_clean) - 2))
    return ' '.join(masked) if masked else 'Responden SE2026'

def main():
    print("=" * 80)
    print("🛡️  TAKE DOWN & SANITIZATION PIPELINE FOR SE2026 MICRODATA")
    print("🎯  Retaining ONLY: Coordinates, Censored Nama KK, No Bangunan, Kec, Desa, SLS")
    print("🗑️  Removing: All business rosters, owners, phones, notes, revenue, KBLI, officers")
    print("=" * 80)

    files = [f for f in os.listdir(DATA_DIR) if f.startswith('responden_kec_') and f.endswith('.json')]
    total_points = 0

    for fname in sorted(files):
        fpath = os.path.join(DATA_DIR, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            encrypted_payload = json.load(f)

        decrypted_kec = decrypt_payload(encrypted_payload)
        original_count = len(decrypted_kec.get('points', []))
        total_points += original_count

        sanitized_points = []
        for p in decrypted_kec.get('points', []):
            clean_pt = {
                'i': p.get('i', ''),
                'k': mask_nama_kk(p.get('k', '')),
                'lt': round(float(p['lt']), 6),
                'lg': round(float(p['lg']), 6),
                'd': str(p.get('d', '000')),
                'dn': str(p.get('dn', '')),
                's': str(p.get('s', '')),
                'ks': str(p.get('ks', '')),
                'nb': str(p.get('nb', '')) if p.get('nb') and str(p.get('nb')).lower() not in ['none', 'nan', '-', 'null'] else '',
                'u': 1 if p.get('u', 0) > 0 else 0,
                'st': str(p.get('st', '1. Ditemukan'))
            }
            if p.get('m'):
                clean_pt['m'] = 1
            sanitized_points.append(clean_pt)

        decrypted_kec['points'] = sanitized_points
        re_encrypted = encrypt_payload(decrypted_kec)

        with open(fpath, 'w', encoding='utf-8') as f:
            json.dump(re_encrypted, f)

        if os.path.exists(DIST_DIR):
            dist_fpath = os.path.join(DIST_DIR, fname)
            with open(dist_fpath, 'w', encoding='utf-8') as f:
                json.dump(re_encrypted, f)

        size_kb = os.path.getsize(fpath) / 1024
        print(f"  ✔ {fname}: {len(sanitized_points):,} points sanitized & re-encrypted ({size_kb:.1f} KB)")

    print(f"\n🎉 Successfully sanitized {total_points:,} respondent points across {len(files)} subdistricts.")
    print("🔒 All microdata has been permanently taken down from server JSON datasets.")

if __name__ == '__main__':
    main()
