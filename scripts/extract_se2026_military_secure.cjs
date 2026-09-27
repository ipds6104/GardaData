const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const filePath = 'C:/Users/hp/Documents/Coding/Data Analyst/Data BPS/Database/Raw data SE2026_02-09-2026/📁 Ekspor Data SE2026 BPS Kabupaten Mempawah (Update September 2026)/0. RAW DUMP LENGKAP 100_ (SEMUA 601 KOLOM)/data_se2026_RAW_DUMP_SEMUA_601_KOLOM_MEMPAWAH.csv';
const outputDir = path.join(__dirname, '../public/data/se2026_responden');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Military-grade AES-256-GCM Secret Key & Salt
const SECRET_PASSPHRASE = 'GARDA-DATA-SE2026-BPS-MEMPAWAH-MILITARY-GRADE-AES256-SECURE-KEY!';
const SALT = Buffer.from('garda_data_salt_6104_mempawah_sec', 'utf8');
const AES_KEY = crypto.pbkdf2Sync(SECRET_PASSPHRASE, SALT, 100000, 32, 'sha256');

// Encrypt payload with AES-256-GCM
function encryptPayload(dataObj) {
  const jsonStr = JSON.stringify(dataObj);
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
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

function cleanKec(str) {
  if (!str) return { code: '000', name: 'Lainnya', raw: 'Lainnya' };
  const match = str.match(/\[(\d+)\]\s*(.*)/);
  if (match) {
    return { code: match[1], name: match[2].trim(), raw: str.trim() };
  }
  return { code: '000', name: str.trim(), raw: str.trim() };
}

function cleanDesa(str) {
  if (!str) return { code: '000', name: 'Lainnya', raw: 'Lainnya' };
  const match = str.match(/\[(\d+)\]\s*(.*)/);
  if (match) {
    return { code: match[1], name: match[2].trim(), raw: str.trim() };
  }
  return { code: '000', name: str.trim(), raw: str.trim() };
}

function extractAndEncrypt() {
  console.log('🔒 Starting SE2026 Precision Name Extraction & AES-256-GCM Encryption...');
  const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 256 * 1024 });
  let row = [];
  let field = '';
  let inQuotes = false;
  let rowCount = 0;
  let headers = null;
  let headerMap = {};

  const byKecamatan = {};
  const stats = {
    totalRawRows: 0,
    totalValidPoints: 0,
    totalBerusaha: 0,
    totalNonUsaha: 0,
    security: {
      standard: 'AES-256-GCM',
      dataProtection: 'UU No. 16 Tahun 1997 tentang Statistik & Protokol Kriptografi Militer NIST SP 800-38D'
    },
    kecamatanList: {},
    statusCounts: {},
    skalaCounts: {},
    generatedAt: new Date().toISOString()
  };

  stream.on('data', (chunk) => {
    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];
      const nextChar = chunk[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(field);
        field = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(field);
        field = '';

        if (!headers) {
          headers = row;
          headers.forEach((h, idx) => {
            headerMap[h] = idx;
          });
        } else {
          rowCount++;
          
          const getVal = (colName) => {
            const idx = headerMap[colName];
            return idx !== undefined ? (row[idx] || '').trim() : '';
          };

          let latStr = getVal('root_geotag_latitude');
          let lngStr = getVal('root_geotag_longitude');
          
          if (!latStr || isNaN(parseFloat(latStr))) {
            latStr = getVal('root_geotag_pml_latitude');
            lngStr = getVal('root_geotag_pml_longitude');
          }

          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);

          // Valid bounds for Kabupaten Mempawah
          if (!isNaN(lat) && !isNaN(lng) && lat >= -1.0 && lat <= 1.5 && lng >= 108.0 && lng <= 110.5) {
            stats.totalValidPoints++;

            let rawKec = getVal('root_kec') || getVal('se2026_kec_l') || '';
            let rawDesa = getVal('root_desa') || getVal('se2026_desa_l') || '';
            let kecObj = cleanKec(rawKec);
            let desaObj = cleanDesa(rawDesa);

            // Auto-fallback mapping for [000] - to administrative hierarchy (level 3 & 4)
            if (kecObj.code === '000' || kecObj.name === '-' || !kecObj.name || kecObj.name === 'Lainnya') {
              const l3Code = getVal('se2026_level_3_code') || getVal('root_level_3_code');
              const l3Name = getVal('se2026_level_3_name') || getVal('root_level_3_name');
              if (l3Code && l3Name && l3Name !== '-') {
                const codeFormatted = l3Code.length <= 3 ? l3Code.padStart(3, '0') : l3Code.slice(-3);
                kecObj = {
                  code: codeFormatted,
                  name: l3Name.toUpperCase().trim(),
                  raw: `[${codeFormatted}] ${l3Name.toUpperCase().trim()}`
                };
                rawKec = kecObj.raw;
              }
            }

            if (desaObj.code === '000' || desaObj.name === '-' || !desaObj.name || desaObj.name === 'Lainnya') {
              const l4Code = getVal('se2026_level_4_code') || getVal('root_level_4_code');
              const l4Name = getVal('se2026_level_4_name') || getVal('root_level_4_name');
              if (l4Code && l4Name && l4Name !== '-') {
                const codeFormatted = l4Code.length <= 3 ? l4Code.padStart(3, '0') : l4Code.slice(-3);
                desaObj = {
                  code: codeFormatted,
                  name: l4Name.toUpperCase().trim(),
                  raw: `[${codeFormatted}] ${l4Name.toUpperCase().trim()}`
                };
                rawDesa = desaObj.raw;
              }
            }
            
            const rawStatus = getVal('root_assignment_status_alias') || getVal('assignment_status_alias') || 'UNKNOWN';
            const rawSkala = getVal('root_skala_usaha_all') || getVal('se2026_skala_usaha') || 'Non Usaha / Keluarga';
            const rawJmlUsaha = parseInt(getVal('root_jumlah_usaha') || '0', 10);
            const jmlUsaha = isNaN(rawJmlUsaha) ? 0 : rawJmlUsaha;
            const adaUsaha = jmlUsaha > 0;

            if (adaUsaha) stats.totalBerusaha++;
            else stats.totalNonUsaha++;

            stats.statusCounts[rawStatus] = (stats.statusCounts[rawStatus] || 0) + 1;
            stats.skalaCounts[rawSkala] = (stats.skalaCounts[rawSkala] || 0) + 1;

            const kecKey = kecObj.code || '000';
            if (!byKecamatan[kecKey]) {
              byKecamatan[kecKey] = {
                kecCode: kecObj.code,
                kecName: kecObj.name,
                rawKec: rawKec,
                total: 0,
                totalBerusaha: 0,
                totalNonUsaha: 0,
                desaList: {},
                points: []
              };
            }

            const kecData = byKecamatan[kecKey];
            kecData.total++;
            if (adaUsaha) kecData.totalBerusaha++;
            else kecData.totalNonUsaha++;

            const desaKey = desaObj.code || '000';
            if (!kecData.desaList[desaKey]) {
              kecData.desaList[desaKey] = {
                desaCode: desaObj.code,
                desaName: desaObj.name,
                rawDesa: rawDesa,
                total: 0,
                totalBerusaha: 0,
                totalNonUsaha: 0,
                slsList: {}
              };
            }
            const desaData = kecData.desaList[desaKey];
            desaData.total++;
            if (adaUsaha) desaData.totalBerusaha++;
            else desaData.totalNonUsaha++;

            const namaSls = getVal('root_nama_sls') || getVal('se2026_sls_l') || 'SLS';
            const kodeSls = getVal('root_kode_sls') || getVal('se2026_kodesls_l') || '';
            const slsKey = kodeSls || namaSls;
            if (!desaData.slsList[slsKey]) {
              desaData.slsList[slsKey] = {
                kodeSls,
                namaSls,
                total: 0
              };
            }
            desaData.slsList[slsKey].total++;

            // Accurate Head of Household / Respondent Name lookup
            let namaKK = getVal('root_nama_kk') || 
                         getVal('root_dtsen_nama_kk') || 
                         getVal('root_nama_principal') ||
                         getVal('se2026_pengusaha_var_label') ||
                         getVal('se2026_pengusaha') ||
                         getVal('root_nama_ak_lain');

            if (!namaKK || namaKK.trim() === '') {
              namaKK = getVal('se2026_nama_komersial') || getVal('se2026_nama_usaha') || 'Responden SE2026';
            }

            // Clean multiple slashes if in principal e.g. "SURYA MUCHLIS / ERNI" -> "SURYA MUCHLIS"
            if (namaKK.includes(' / ')) {
              namaKK = namaKK.split(' / ')[0].trim();
            }

            const rawNamaUsaha = getVal('se2026_nama_usaha') || getVal('se2026_nama_komersial') || (adaUsaha ? getVal('root_label_usaha') : '');
            let safeNamaUsaha = rawNamaUsaha;
            if (safeNamaUsaha.length > 60) safeNamaUsaha = safeNamaUsaha.substring(0, 60);

            // Obfuscate internal assignment ID to cryptographic short hash
            const rawId = getVal('id') || getVal('assignment_id') || `resp_${rowCount}`;
            const safeId = 'SE26-' + crypto.createHash('sha256').update(rawId).digest('hex').substring(0, 10).toUpperCase();

            const point = {
              i: safeId,
              k: namaKK.trim().toUpperCase(),
              lt: Math.round(lat * 1000000) / 1000000,
              lg: Math.round(lng * 1000000) / 1000000,
              d: desaObj.code,
              dn: desaObj.name,
              s: namaSls,
              ks: kodeSls,
              u: jmlUsaha,
              nu: safeNamaUsaha,
              kb: getVal('se2026_kbli_label') || getVal('se2026_kbli_akhir') || '',
              st: rawStatus,
              sk: rawSkala
            };

            kecData.points.push(point);
          }
        }
        row = [];
      } else {
        field += char;
      }
    }
  });

  stream.on('close', () => {
    stats.totalRawRows = rowCount;

    console.log(`Writing AES-256-GCM encrypted per-kecamatan files...`);
    const indexKecamatan = [];

    Object.keys(byKecamatan).forEach((kecKey) => {
      const kec = byKecamatan[kecKey];
      const fileName = `responden_kec_${kecKey}.json`;
      const outPath = path.join(outputDir, fileName);

      const kecPayload = {
        kecCode: kec.kecCode,
        kecName: kec.kecName,
        rawKec: kec.rawKec,
        total: kec.total,
        totalBerusaha: kec.totalBerusaha,
        totalNonUsaha: kec.totalNonUsaha,
        desaList: kec.desaList,
        points: kec.points
      };

      // Encrypt with AES-256-GCM
      const encryptedData = encryptPayload(kecPayload);
      fs.writeFileSync(outPath, JSON.stringify(encryptedData));

      const fileSizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
      console.log(`  🔒 Saved Encrypted ${fileName}: ${kec.points.length} points (${fileSizeKB} KB)`);

      indexKecamatan.push({
        kecCode: kec.kecCode,
        kecName: kec.kecName,
        rawKec: kec.rawKec,
        total: kec.total,
        totalBerusaha: kec.totalBerusaha,
        totalNonUsaha: kec.totalNonUsaha,
        fileName: fileName,
        desaList: Object.values(kec.desaList).map(d => ({
          desaCode: d.desaCode,
          desaName: d.desaName,
          total: d.total,
          totalBerusaha: d.totalBerusaha,
          totalNonUsaha: d.totalNonUsaha,
          slsList: Object.values(d.slsList)
        }))
      });
    });

    stats.kecamatanList = indexKecamatan;

    // Write master index metadata file
    const indexPath = path.join(outputDir, 'metadata_index.json');
    fs.writeFileSync(indexPath, JSON.stringify(stats, null, 2));
    console.log(`\n✔ Successfully extracted names and encrypted with AES-256-GCM to ${outputDir}!`);
    console.log(`Total valid coordinates: ${stats.totalValidPoints}`);
  });
}

extractAndEncrypt();
