/**
 * Military-Grade Cryptography & Decryption Utility
 * Standard: NIST SP 800-38D (AES-256-GCM authenticated encryption)
 * Key Derivation: PBKDF2 with HMAC-SHA256 (100,000 iterations)
 */

const SECRET_PASSPHRASE = 'GARDA-DATA-SE2026-BPS-MEMPAWAH-MILITARY-GRADE-AES256-SECURE-KEY!';
const SALT_STR = 'garda_data_salt_6104_mempawah_sec';

let cachedCryptoKey: CryptoKey | null = null;

async function getDerivedKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) return cachedCryptoKey;

  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_PASSPHRASE),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  cachedCryptoKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT_STR),
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  return cachedCryptoKey;
}

// Convert Base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export interface EncryptedPayload {
  v: number;
  algo: string;
  iv: string;
  tag: string;
  data: string;
}

/**
 * Decrypts AES-256-GCM encrypted payload in hardware-accelerated memory
 */
export async function decryptMilitaryPayload<T = any>(payload: EncryptedPayload | any): Promise<T> {
  // If payload is already raw plain JSON (fallback)
  if (!payload || !payload.data || !payload.iv || !payload.tag) {
    return payload as T;
  }

  try {
    const key = await getDerivedKey();
    const ivBytes = base64ToUint8Array(payload.iv);
    const dataBytes = base64ToUint8Array(payload.data);
    const tagBytes = base64ToUint8Array(payload.tag);

    // In Web Crypto API, AES-GCM expects the authentication tag appended to ciphertext
    const combinedCiphertext = new Uint8Array(dataBytes.length + tagBytes.length);
    combinedCiphertext.set(dataBytes, 0);
    combinedCiphertext.set(tagBytes, dataBytes.length);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
        tagLength: 128
      },
      key,
      combinedCiphertext
    );

    const dec = new TextDecoder('utf-8');
    const jsonStr = dec.decode(decryptedBuffer);
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.error('Cryptographic Decryption failed:', err);
    throw new Error('Gagal membuka data terenkripsi. Kunci keamanan tidak valid.');
  }
}

