const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SECRET_PASSPHRASE = Buffer.from('GARDA-DATA-SE2026-BPS-MEMPAWAH-MILITARY-GRADE-AES256-SECURE-KEY!', 'utf8');
const SALT = Buffer.from('garda_data_salt_6104_mempawah_sec', 'utf8');
const AES_KEY = crypto.pbkdf2Sync(SECRET_PASSPHRASE, SALT, 100000, 32, 'sha256');

function decrypt(payload) {
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(ciphertext, null, 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

function encrypt(dataObj) {
  const jsonStr = JSON.stringify(dataObj);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  let ciphertext = cipher.update(jsonStr, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    algo: 'AES-256-GCM',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64')
  };
}

function maskNamaKK(name) {
  if (!name || ['none', 'nan', '-', 'null', 'responden se2026'].includes(String(name).trim().toLowerCase())) {
    return 'Responden SE2026';
  }
  let str = String(name).trim();
  let parts = str.split(/\s+/);
  
  let merged = [];
  let buffer = '';
  for (const p of parts) {
    if (p.length === 1) {
      buffer += p;
    } else {
      if (buffer) {
        merged.push(buffer);
        buffer = '';
      }
      merged.push(p);
    }
  }
  if (buffer) merged.push(buffer);

  const masked = [];
  for (const w of merged) {
    const clean = w.replace(/[^a-zA-Z0-9]/g, '');
    if (!clean) continue;
    if (clean.length === 1) {
      masked.push(clean + '*');
    } else if (clean.length === 2) {
      masked.push(clean[0] + '*');
    } else if (clean.length <= 4) {
      masked.push(clean[0] + '*'.repeat(clean.length - 1));
    } else {
      masked.push(clean.slice(0, 2) + '*'.repeat(clean.length - 2));
    }
  }
  return masked.length ? masked.join(' ') : 'Responden SE2026';
}

const kecFiles = [
  'responden_kec_080.json', 'responden_kec_081.json',
  'responden_kec_090.json', 'responden_kec_091.json',
  'responden_kec_100.json', 'responden_kec_101.json',
  'responden_kec_110.json', 'responden_kec_120.json',
  'responden_kec_121.json'
];

let totalProcessed = 0;
let totalWithNu = 0;
let totalWithPeng = 0;
let totalWithUnmaskedK = 0;

const rootDir = path.join(__dirname, '..');

for (const file of kecFiles) {
  console.log(`Processing ${file} from HEAD...`);
  const gitRaw = execSync(`git show HEAD:public/data/se2026_responden/${file}`, { 
    cwd: rootDir, 
    maxBuffer: 50 * 1024 * 1024 
  }).toString('utf8');
  
  const payload = JSON.parse(gitRaw);
  const data = decrypt(payload);
  
  const sanitizedPoints = [];
  for (const p of data.points) {
    // Preserve nama usaha: check p.nu, or fallback to first business name in p.mFound if p.nu is empty
    let namaUsaha = (p.nu || '').trim();
    if (!namaUsaha && p.mFound) {
      const matchFound = p.mFound.split(';')[0].replace(/^\[\d+\]\s*/, '').trim();
      if (matchFound) namaUsaha = matchFound;
    }
    if (['none', 'nan', '-', 'null'].includes(namaUsaha.toLowerCase())) namaUsaha = '';

    // Preserve nama pemilik / pengelola usaha
    let namaPengelola = (p.peng || '').trim();
    if (['none', 'nan', '-', 'null'].includes(namaPengelola.toLowerCase())) namaPengelola = '';

    if (namaUsaha) totalWithNu++;
    if (namaPengelola) totalWithPeng++;

    const maskedK = maskNamaKK(p.k);
    if (maskedK && !maskedK.includes('*') && !['-', 'Responden SE2026'].includes(maskedK)) {
      totalWithUnmaskedK++;
    }

    // Strict whitelist of attributes
    const cleanPt = {
      i: p.i,
      k: maskedK,
      lt: p.lt,
      lg: p.lg,
      d: p.d,
      dn: p.dn,
      s: p.s,
      ks: p.ks,
      nb: p.nb,
      u: p.u || 0,
      st: p.st
    };

    if (namaUsaha) cleanPt.nu = namaUsaha;
    if (namaPengelola) cleanPt.peng = namaPengelola;
    if (p.m === 1) cleanPt.m = 1;

    sanitizedPoints.push(cleanPt);
  }

  totalProcessed += sanitizedPoints.length;
  data.points = sanitizedPoints;

  const reEncrypted = encrypt(data);
  const publicOut = path.join(rootDir, 'public/data/se2026_responden', file);
  const distOut = path.join(rootDir, 'dist/data/se2026_responden', file);

  fs.writeFileSync(publicOut, JSON.stringify(reEncrypted), 'utf8');
  fs.writeFileSync(distOut, JSON.stringify(reEncrypted), 'utf8');
}

console.log('====================================');
console.log('SUCCESSFULLY REPROCESSED DATASETS:');
console.log('Total Processed Points:', totalProcessed);
console.log('Points with Preserved Nama Usaha:', totalWithNu);
console.log('Points with Preserved Nama Pemilik Usaha:', totalWithPeng);
console.log('Unmasked Kepala Keluarga count:', totalWithUnmaskedK);
console.log('====================================');
