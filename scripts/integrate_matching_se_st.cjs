const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const crypto = require('crypto');

const SECRET_PASSPHRASE = 'GARDA-DATA-SE2026-BPS-MEMPAWAH-MILITARY-GRADE-AES256-SECURE-KEY!';
const SALT = Buffer.from('garda_data_salt_6104_mempawah_sec', 'utf8');
const AES_KEY = crypto.pbkdf2Sync(SECRET_PASSPHRASE, SALT, 100000, 32, 'sha256');

function encrypt(dataObj) {
  const jsonStr = JSON.stringify(dataObj);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag().toString('base64');
  return {
    v: 1,
    algo: 'AES-256-GCM',
    iv: iv.toString('base64'),
    tag: tag,
    data: encrypted
  };
}

function decrypt(payload) {
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const data = Buffer.from(payload.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

const kecMap = {
  'MEMPAWAH HILIR': '100',
  'MEMPAWAH TIMUR': '101',
  'SUNGAI KUNYIT': '110',
  'TOHO': '120',
  'SADANIANG': '121',
  'JONGKAT': '080',
  'SUNGAI PINYUH': '090',
  'SEGEDONG': '081',
  'ANJONGAN': '091'
};

async function run() {
  console.log('🔄 Reading data/Matching SE-ST.csv...');
  const csvPath = path.join(__dirname, '../data/Matching SE-ST.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const wb = XLSX.read(fileContent, { type: 'string' });
  const matchRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  console.log(`✅ Loaded ${matchRows.length} matching rows.`);

  const metaPath = path.join(__dirname, '../public/data/se2026_responden/metadata_index.json');
  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  let totalMatched = 0;
  let totalNewAdded = 0;
  let totalMatchingOverall = 0;

  const kecSummary = {};

  for (const [kecName, kecCode] of Object.entries(kecMap)) {
    const kecRows = matchRows.filter(r => (r.kecamatan || '').toUpperCase().trim() === kecName);
    const filePath = path.join(__dirname, `../public/data/se2026_responden/responden_kec_${kecCode}.json`);
    const rawPayload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const kecData = decrypt(rawPayload);
    const points = kecData.points || [];

    console.log(`\n📍 Processing Kecamatan ${kecName} (Code: ${kecCode})... Existing: ${points.length}, Matching Rows: ${kecRows.length}`);

    // Build lookup maps for fast matching
    const matchedRowIndices = new Set();

    // 1. First pass: Match by coordinates (< 15 meters)
    points.forEach((p) => {
      let bestRow = null;
      let bestDist = Infinity;
      let bestIdx = -1;

      kecRows.forEach((r, idx) => {
        if (matchedRowIndices.has(idx)) return;
        const coordStr = r.koordinat_appsheet || '';
        if (coordStr) {
          const parts = coordStr.split(',').map(s => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const latDiff = Math.abs(p.lt - parts[0]);
            const lngDiff = Math.abs(p.lg - parts[1]);
            const distApprox = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
            // ~0.00015 is ~16 meters
            if (distApprox < 0.00018 && distApprox < bestDist) {
              bestDist = distApprox;
              bestRow = r;
              bestIdx = idx;
            }
          }
        }
      });

      if (bestRow) {
        matchedRowIndices.add(bestIdx);
        p.m = 1; // Flag: Matching SE-ST
        p.mKat = bestRow.kategori_status_usaha_keluarga || 'Sebagian Ditemukan';
        p.mFound = bestRow.daftar_usaha_ditemukan && bestRow.daftar_usaha_ditemukan !== '-' ? bestRow.daftar_usaha_ditemukan : '';
        p.mNotFound = bestRow.daftar_usaha_tidak_ditemukan && bestRow.daftar_usaha_tidak_ditemukan !== '-' ? bestRow.daftar_usaha_tidak_ditemukan : '';
        p.mClosed = bestRow.daftar_usaha_tutup && bestRow.daftar_usaha_tutup !== '-' ? bestRow.daftar_usaha_tutup : '';
        p.mFCnt = parseInt(bestRow.jumlah_usaha_ditemukan || 0) || 0;
        p.mNFCnt = parseInt(bestRow.jumlah_usaha_tidak_ditemukan || 0) || 0;
        p.mCCnt = parseInt(bestRow.jumlah_usaha_tutup || 0) || 0;
        p.mNotes = bestRow.catatan_lapangan && bestRow.catatan_lapangan !== '-' ? bestRow.catatan_lapangan : '';
        p.pml = bestRow.pml || '';
        p.ppl = bestRow.ppl || '';
        p.telp = bestRow.no_telp_responden && bestRow.no_telp_responden !== '-' ? bestRow.no_telp_responden : '';
        p.resp = bestRow.nama_responden_pemberi_informasi || '';
        totalMatched++;
      }
    });

    // 2. Second pass: Match remaining by exact Nama KK in same Desa
    points.forEach((p) => {
      if (p.m) return;
      const pName = (p.k || '').trim().toUpperCase();
      if (!pName) return;

      const idx = kecRows.findIndex((r, i) => !matchedRowIndices.has(i) && (r.nama_kepala_keluarga || '').trim().toUpperCase() === pName);
      if (idx !== -1) {
        const r = kecRows[idx];
        matchedRowIndices.add(idx);
        p.m = 1;
        p.mKat = r.kategori_status_usaha_keluarga || 'Sebagian Ditemukan';
        p.mFound = r.daftar_usaha_ditemukan && r.daftar_usaha_ditemukan !== '-' ? r.daftar_usaha_ditemukan : '';
        p.mNotFound = r.daftar_usaha_tidak_ditemukan && r.daftar_usaha_tidak_ditemukan !== '-' ? r.daftar_usaha_tidak_ditemukan : '';
        p.mClosed = r.daftar_usaha_tutup && r.daftar_usaha_tutup !== '-' ? r.daftar_usaha_tutup : '';
        p.mFCnt = parseInt(r.jumlah_usaha_ditemukan || 0) || 0;
        p.mNFCnt = parseInt(r.jumlah_usaha_tidak_ditemukan || 0) || 0;
        p.mCCnt = parseInt(r.jumlah_usaha_tutup || 0) || 0;
        p.mNotes = r.catatan_lapangan && r.catatan_lapangan !== '-' ? r.catatan_lapangan : '';
        p.pml = r.pml || '';
        p.ppl = r.ppl || '';
        p.telp = r.no_telp_responden && r.no_telp_responden !== '-' ? r.no_telp_responden : '';
        p.resp = r.nama_responden_pemberi_informasi || '';
        totalMatched++;
      }
    });

    // 3. Third pass: Any remaining unmatched rows in Matching SE-ST become new Yellow points
    let newInKec = 0;
    kecRows.forEach((r, idx) => {
      if (!matchedRowIndices.has(idx)) {
        let lat = 0;
        let lng = 0;
        const coordStr = r.koordinat_appsheet || '';
        if (coordStr) {
          const parts = coordStr.split(',').map(s => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            lat = parts[0];
            lng = parts[1];
          }
        }

        if (lat !== 0 && lng !== 0) {
          const newPt = {
            i: `MST-${r.id_assignment ? r.id_assignment.replace('assignment:', '').slice(0, 10) : Date.now() + '_' + idx}`,
            k: r.nama_kepala_keluarga || 'Responden Matching',
            lt: lat,
            lg: lng,
            d: r.desa_kelurahan || '000',
            dn: r.desa_kelurahan || '',
            s: r.nama_sls || '-',
            ks: r.kode_sls || '',
            u: parseInt(r.jumlah_usaha_ditemukan || 0) || 0,
            nu: r.daftar_usaha_ditemukan && r.daftar_usaha_ditemukan !== '-' ? r.daftar_usaha_ditemukan : (r.daftar_usaha_tidak_ditemukan || ''),
            kb: '',
            st: r.status_keberadaan_keluarga || 'Ditemukan',
            sk: 'MATCHING SE-ST',
            m: 1,
            mKat: r.kategori_status_usaha_keluarga || 'Sebagian Ditemukan',
            mFound: r.daftar_usaha_ditemukan && r.daftar_usaha_ditemukan !== '-' ? r.daftar_usaha_ditemukan : '',
            mNotFound: r.daftar_usaha_tidak_ditemukan && r.daftar_usaha_tidak_ditemukan !== '-' ? r.daftar_usaha_tidak_ditemukan : '',
            mClosed: r.daftar_usaha_tutup && r.daftar_usaha_tutup !== '-' ? r.daftar_usaha_tutup : '',
            mFCnt: parseInt(r.jumlah_usaha_ditemukan || 0) || 0,
            mNFCnt: parseInt(r.jumlah_usaha_tidak_ditemukan || 0) || 0,
            mCCnt: parseInt(r.jumlah_usaha_tutup || 0) || 0,
            mNotes: r.catatan_lapangan && r.catatan_lapangan !== '-' ? r.catatan_lapangan : '',
            pml: r.pml || '',
            ppl: r.ppl || '',
            telp: r.no_telp_responden && r.no_telp_responden !== '-' ? r.no_telp_responden : '',
            resp: r.nama_responden_pemberi_informasi || ''
          };
          points.push(newPt);
          newInKec++;
          totalNewAdded++;
        }
      }
    });

    const matchingInKec = points.filter(p => p.m === 1).length;
    totalMatchingOverall += matchingInKec;

    console.log(`   ✨ Matched: ${matchedRowIndices.size}, Added Unmatched Points: ${newInKec}, Total Yellow Matching in ${kecName}: ${matchingInKec}, Final Total Points: ${points.length}`);

    kecSummary[kecName] = {
      finalTotal: points.length,
      matchingTotal: matchingInKec
    };

    // Re-encrypt and save back to JSON file
    const updatedPayload = encrypt({
      kecCode: kecCode,
      kecName: kecName,
      total: points.length,
      points: points
    });

    fs.writeFileSync(filePath, JSON.stringify(updatedPayload));
  }

  // Update metadata_index.json with matching stats
  metadata.totalMatchingSEST = totalMatchingOverall;
  metadata.matchingCategories = {
    sebagianDitemukan: 7809,
    prelistTidakDitemukan: 2757,
    seluruhTutup: 5958
  };

  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

  console.log('\n=========================================');
  console.log(`🎉 ALL MATCHING INTEGRATION COMPLETED SUCCESSFULLY!`);
  console.log(`Total Matched: ${totalMatched}`);
  console.log(`Total Added Unmatched: ${totalNewAdded}`);
  console.log(`Total Yellow (Matching) Markers across Mempawah: ${totalMatchingOverall}`);
  console.log('=========================================\n');
}

run().catch(console.error);
