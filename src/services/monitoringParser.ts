export interface MonitoringRow {
  kodeWilayah: string;
  namaPpl: string;
  namaPml: string;
  kecamatan: string;
  desa: string;
  sls: string;
  submit: number;
  draft: number;
  approve: number;
  reject: number;
  open: number;
  target: number;
  totalSubmit: number; // calculated as submit + approve + reject
}

// Fungsi sederhana untuk parsing CSV (menangani koma di dalam tanda kutip)
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentCell.trim());
        result.push(currentRow);
        currentRow = [];
        currentCell = '';
        if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
      } else {
        currentCell += char;
      }
    }
  }
  
  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    result.push(currentRow);
  }
  
  return result;
}

export async function parseMonitoringSheet(sheetUrl: string, sheetName: string = ''): Promise<MonitoringRow[]> {
  try {
    const urlObj = new URL(sheetUrl);
    const pathnameParts = urlObj.pathname.split('/');
    const dIndex = pathnameParts.indexOf('d');
    if (dIndex === -1 || dIndex + 1 >= pathnameParts.length) return [];
    
    const documentId = pathnameParts[dIndex + 1];
    let gid = '0';
    if (urlObj.searchParams.has('gid')) {
      gid = urlObj.searchParams.get('gid') || '0';
    } else if (urlObj.hash && urlObj.hash.includes('gid=')) {
      gid = urlObj.hash.split('gid=')[1].split('&')[0];
    }

    let exportUrl = '';
    if (sheetName && sheetName.trim() !== '') {
      exportUrl = `https://docs.google.com/spreadsheets/d/${documentId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName.trim())}`;
    } else {
      exportUrl = `https://docs.google.com/spreadsheets/d/${documentId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    }
    
    // Gunakan backend proxy untuk menghindari pemblokiran CORS oleh browser
    const baseUrl = (import.meta as any).env.VITE_API_URL || '';
    const proxyUrl = `${baseUrl}/api/monitoring/proxy-sheet?url=${encodeURIComponent(exportUrl)}&cb=${Date.now()}`;
    
    const res = await fetch(proxyUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch sheet');
    
    const text = await res.text();
    const parsedCsv = parseCSV(text);
    if (parsedCsv.length < 2) return [];

    // Sesuaikan indeks kolom dengan format baku Google Sheet dari user:
    // 0: kode wilayah, 1: nama PPL, 2: nama PML, 3: nama Kecamatan, 4: nama Desa,
    // 5: nama SLS/Wilayah Kerja, 6: submit, 7: draf, 8: approve, 9: reject, 10: open, 11: target
    const iWilayah = 0;
    const iPpl = 1;
    const iPml = 2;
    const iKec = 3;
    const iDesa = 4;
    const iSls = 5;
    const iSub = 6;
    const iDraf = 7;
    const iApp = 8;
    const iRej = 9;
    const iOpn = 10;
    const iTgt = 11;

    const result: MonitoringRow[] = [];
    
    for (let i = 1; i < parsedCsv.length; i++) {
      const cols = parsedCsv[i];
      if (cols.length < 3) continue;

      const submit = cols[iSub] ? parseInt(cols[iSub]) || 0 : 0;
      const approve = cols[iApp] ? parseInt(cols[iApp]) || 0 : 0;
      const reject = cols[iRej] ? parseInt(cols[iRej]) || 0 : 0;
      
      const totalSubmit = submit;

      result.push({
        kodeWilayah: cols[iWilayah] || '',
        namaPpl: cols[iPpl] || '',
        namaPml: cols[iPml] || '',
        kecamatan: cols[iKec] || '',
        desa: cols[iDesa] || '',
        sls: cols[iSls] || '',
        submit,
        draft: cols[iDraf] ? parseInt(cols[iDraf]) || 0 : 0,
        approve,
        reject,
        open: cols[iOpn] ? parseInt(cols[iOpn]) || 0 : 0,
        target: cols[iTgt] ? parseInt(cols[iTgt]) || 0 : 0,
        totalSubmit
      });
    }

    return result;
  } catch (e) {
    console.error('Error parsing sheet:', e);
    return [];
  }
}
