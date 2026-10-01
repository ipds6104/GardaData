import os
import sys
import json
import base64
import hashlib
from Cryptodome.Cipher import AES
from Cryptodome.Random import get_random_bytes

SECRET_PASSPHRASE = b"GARDA-DATA-SE2026-BPS-MEMPAWAH-MILITARY-GRADE-AES256-SECURE-KEY!"
SALT = b"garda_data_salt_6104_mempawah_sec"
AES_KEY = hashlib.pbkdf2_hmac('sha256', SECRET_PASSPHRASE, SALT, 100000, 32)

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

test_obj = {"test": "hello Mempawah 2026", "count": 12345}
enc = encrypt_payload(test_obj)

# Test decrypt in python
iv_dec = base64.b64decode(enc['iv'])
tag_dec = base64.b64decode(enc['tag'])
cipher_dec = AES.new(AES_KEY, AES.MODE_GCM, nonce=iv_dec)
dec_bytes = cipher_dec.decrypt_and_verify(base64.b64decode(enc['data']), tag_dec)
print("Decrypted object:", json.loads(dec_bytes.decode('utf-8')))

