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

    const exportUrl = `https://docs.google.com/spreadsheets/d/${documentId}/export?format=tsv&gid=${gid}`;
    
    // Gunakan backend proxy untuk menghindari pemblokiran CORS oleh browser
    const baseUrl = (import.meta as any).env.VITE_API_URL || '';
    const proxyUrl = `${baseUrl}/api/monitoring/proxy-sheet?url=${encodeURIComponent(exportUrl)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Failed to fetch sheet');
    
    const text = await res.text();
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split('\t').map(h => h.trim());
    const iWilayah = headers.findIndex(h => h.includes('kode wilayah'));
    const iPpl = headers.findIndex(h => h.includes('nama ppl'));
    const iPml = headers.findIndex(h => h.includes('nama pml'));
    const iKec = headers.findIndex(h => h.includes('kecamatan'));
    const iDesa = headers.findIndex(h => h.includes('desa'));
    const iSls = headers.findIndex(h => h.includes('sls') || h.includes('wilayah kerja'));
    const iSub = headers.findIndex(h => h === 'submit');
    const iDraf = headers.findIndex(h => h === 'draf' || h === 'draft');
    const iApp = headers.findIndex(h => h === 'approve' || h === 'approved');
    const iRej = headers.findIndex(h => h === 'reject' || h === 'rejected');
    const iOpn = headers.findIndex(h => h === 'open');
    const iTgt = headers.findIndex(h => h === 'target');

    const result: MonitoringRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('\t').map(c => c.trim());
      if (cols.length < 3) continue;

      const submit = iSub !== -1 && cols[iSub] ? parseInt(cols[iSub]) || 0 : 0;
      const approve = iApp !== -1 && cols[iApp] ? parseInt(cols[iApp]) || 0 : 0;
      const reject = iRej !== -1 && cols[iRej] ? parseInt(cols[iRej]) || 0 : 0;
      
      const totalSubmit = submit + approve + reject;

      result.push({
        kodeWilayah: iWilayah !== -1 ? cols[iWilayah] : '',
        namaPpl: iPpl !== -1 ? cols[iPpl] : '',
        namaPml: iPml !== -1 ? cols[iPml] : '',
        kecamatan: iKec !== -1 ? cols[iKec] : '',
        desa: iDesa !== -1 ? cols[iDesa] : '',
        sls: iSls !== -1 ? cols[iSls] : '',
        submit,
        draft: iDraf !== -1 && cols[iDraf] ? parseInt(cols[iDraf]) || 0 : 0,
        approve,
        reject,
        open: iOpn !== -1 && cols[iOpn] ? parseInt(cols[iOpn]) || 0 : 0,
        target: iTgt !== -1 && cols[iTgt] ? parseInt(cols[iTgt]) || 0 : 0,
        totalSubmit
      });
    }

    return result;
  } catch (e) {
    console.error('Error parsing sheet:', e);
    return [];
  }
}
