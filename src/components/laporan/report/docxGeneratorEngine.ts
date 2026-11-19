import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export interface ReportItemData {
  namaPpl: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  sls: string;
  namaKrt: string;
  status: string;
  gps: string;
  fotoUrl?: string;
  tanggal: string;
  nus?: string;
  catatan?: string;
  customFields?: Record<string, any>;
}

export interface ReportGenerationPayload {
  activityTitle: string;
  namaPpl: string;
  periode: string;
  tanggalLaporan: string;
  items: ReportItemData[];
  catatanPetugas?: string;
  customTemplateDocxBase64?: string;
}

/**
 * Generate standard HTML report ready for window.print() or PDF export
 */
export const generatePrintableHtmlReport = (payload: ReportGenerationPayload): string => {
  const totalSampel = payload.items.length;
  const totalSelesai = payload.items.filter(i => i.status === 'submitted').length;
  const persentase = totalSampel > 0 ? Math.round((totalSelesai / totalSampel) * 100) : 0;

  const sampleRowsHtml = payload.items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
      <td style="padding: 8px 6px; text-align: center; color: #64748b;">${idx + 1}</td>
      <td style="padding: 8px 6px; font-weight: bold; color: #0f172a;">${item.namaKrt || '-'}</td>
      <td style="padding: 8px 6px; color: #334155;">${item.nus || '-'}</td>
      <td style="padding: 8px 6px; color: #334155;">${item.kecamatan || '-'} / ${item.desa || '-'}</td>
      <td style="padding: 8px 6px; color: #334155;">${item.sls || '-'}</td>
      <td style="padding: 8px 6px; font-family: monospace; font-size: 10px; color: #475569;">${item.gps || '-'}</td>
      <td style="padding: 8px 6px; text-align: center;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; background: ${item.status === 'submitted' ? '#dcfce7; color: #166534;' : '#fef3c7; color: #92400e;'}">
          ${item.status === 'submitted' ? 'Selesai' : 'Draf'}
        </span>
      </td>
      <td style="padding: 6px; text-align: center;">
        ${item.fotoUrl && (item.fotoUrl.startsWith('data:image') || item.fotoUrl.startsWith('http')) 
          ? `<img src="${item.fotoUrl}" alt="Foto" style="width: 48px; height: 36px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;" />` 
          : '<span style="color: #94a3b8; font-size: 10px;">-</span>'}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan Hasil Pendataan - ${payload.namaPpl}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm 12mm; }
        body { font-family: 'Arial', sans-serif; color: #0f172a; margin: 0; padding: 15px; line-height: 1.4; background: #fff; }
        .kop-surat { display: flex; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px; }
        .kop-logo { width: 55px; height: 55px; margin-right: 15px; object-fit: contain; }
        .kop-text h2 { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        .kop-text h1 { margin: 2px 0; font-size: 16px; font-weight: 800; color: #0284c7; }
        .kop-text p { margin: 0; font-size: 10px; color: #64748b; }
        .report-title { text-align: center; margin: 15px 0; }
        .report-title h3 { margin: 0; font-size: 14px; font-weight: 800; text-transform: uppercase; text-decoration: underline; }
        .report-title span { font-size: 11px; color: #475569; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 11px; }
        .info-row { display: flex; margin-bottom: 3px; }
        .info-label { width: 130px; font-weight: bold; color: #475569; }
        .info-val { flex: 1; font-weight: 600; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; padding: 8px 6px; font-size: 10px; text-transform: uppercase; color: #334155; }
        .rekap-card { display: flex; justify-content: space-between; margin-top: 15px; padding: 10px 15px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; font-size: 12px; font-weight: bold; color: #166534; }
        .signature-area { margin-top: 35px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .signature-box { text-align: center; width: 200px; font-size: 11px; }
        .signature-space { height: 60px; }
        .no-print { margin-bottom: 20px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; gap: 10px; justify-content: flex-end; }
        @media print { .no-print { display: none !important; } }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button onclick="window.print()" style="padding: 8px 16px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Cetak / Simpan PDF</button>
        <button onclick="window.close()" style="padding: 8px 16px; background: #64748b; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Tutup</button>
      </div>

      <div class="kop-surat">
        <div class="kop-text">
          <h2>BADAN PUSAT STATISTIK KABUPATEN MEMPAWAH</h2>
          <h1>GARDA DATA - LAPORAN HASIL PENDATAAN LAPANGAN</h1>
          <p>Sistem Integrasi Pengawasan dan Verifikasi Lapangan Petugas Pencacah</p>
        </div>
      </div>

      <div class="report-title">
        <h3>LAPORAN REKAPITULASI PENUGASAN PETUGAS (PPL)</h3>
        <span>Kegiatan: <b>${payload.activityTitle}</b> | Periode: ${payload.periode}</span>
      </div>

      <div class="info-grid">
        <div>
          <div class="info-row"><span class="info-label">Nama Petugas (PPL)</span><span class="info-val">: ${payload.namaPpl}</span></div>
          <div class="info-row"><span class="info-label">Kegiatan Survei</span><span class="info-val">: ${payload.activityTitle}</span></div>
          <div class="info-row"><span class="info-label">Wilayah Tugas Utama</span><span class="info-val">: ${payload.items[0]?.kecamatan || '-'}, ${payload.items[0]?.desa || '-'}</span></div>
        </div>
        <div>
          <div class="info-row"><span class="info-label">Tanggal Pelaporan</span><span class="info-val">: ${payload.tanggalLaporan}</span></div>
          <div class="info-row"><span class="info-label">Total Beban Tugas</span><span class="info-val">: ${totalSampel} Assignment / Responden</span></div>
          <div class="info-row"><span class="info-label">Status Progres</span><span class="info-val">: ${totalSelesai} / ${totalSampel} Selesai (${persentase}%)</span></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25px;">#</th>
            <th>Nama Responden / KRT</th>
            <th style="width: 45px;">NUS</th>
            <th>Kecamatan / Desa</th>
            <th>SLS / RT</th>
            <th>Koordinat GPS</th>
            <th style="width: 60px;">Status</th>
            <th style="width: 55px;">Foto</th>
          </tr>
        </thead>
        <tbody>
          ${sampleRowsHtml}
        </tbody>
      </table>

      <div class="rekap-card">
        <span>Ringkasan Pencapaian Lapangan:</span>
        <span>${totalSelesai} dari ${totalSampel} Terverifikasi Lengkap (${persentase}%)</span>
      </div>

      <div class="signature-area">
        <div class="signature-box">
          <span>Mengetahui,</span><br>
          <b>Pengawas Lapangan (PML)</b>
          <div class="signature-space"></div>
          <p style="margin: 0; text-decoration: underline; font-weight: bold;">( .................................................. )</p>
          <span>NIP: .......................................</span>
        </div>

        <div class="signature-box">
          <span>Mempawah, ${payload.tanggalLaporan}</span><br>
          <b>Petugas Pencacah Lapangan (PPL)</b>
          <div class="signature-space"></div>
          <p style="margin: 0; text-decoration: underline; font-weight: bold;">${payload.namaPpl}</p>
          <span>Petugas Mitra Lapangan</span>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Open print preview modal / new tab
 */
export const openReportPrintWindow = (payload: ReportGenerationPayload) => {
  const html = generatePrintableHtmlReport(payload);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
};

/**
 * XML helper for Word MailMerge
 */
function fillWordMailMerge(zip: PizZip, data: Record<string, any>) {
  let xml = zip.file('word/document.xml')?.asText() || '';

  // 1. Replace fldSimple MERGEFIELD structures
  xml = xml.replace(/<w:fldSimple[^>]*w:instr="[^"]*MERGEFIELD\s+([a-zA-Z0-9_]+)[^"]*"[^>]*>[\s\S]*?<\/w:fldSimple>/g, (_match, fieldName) => {
    const val = data[fieldName] !== undefined ? String(data[fieldName]) : '';
    return `<w:r><w:t>${escapeXml(val)}</w:t></w:r>`;
  });

  // 2. Replace any raw «FieldName» or {FieldName} in text tags
  Object.keys(data).forEach(key => {
    const val = escapeXml(String(data[key] !== undefined ? data[key] : ''));
    const guillemetRegex = new RegExp(`«${key}»`, 'g');
    const braceRegex = new RegExp(`\\{${key}\\}`, 'g');
    xml = xml.replace(guillemetRegex, val).replace(braceRegex, val);
  });

  zip.file('word/document.xml', xml);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Generate and download standard Word (.docx) report using template
 */
export const downloadDocxReport = async (payload: ReportGenerationPayload) => {
  try {
    let zip: PizZip | null = null;

    if (payload.customTemplateDocxBase64) {
      const binaryString = atob(payload.customTemplateDocxBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      zip = new PizZip(bytes);
    } else {
      // Coba unduh template resmi BPS dari server
      try {
        const res = await fetch('/api/laporan/template-docx');
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          zip = new PizZip(arrayBuffer);
        }
      } catch (e) {
        console.warn('Gagal memuat template dari server:', e);
      }
    }

    if (!zip) {
      openReportPrintWindow(payload);
      return;
    }

    const firstItem = payload.items[0];
    const gpsParts = (firstItem?.gps || '').split(',');
    const lat = gpsParts[0]?.trim() || '-';
    const lng = gpsParts[1]?.trim() || '-';

    const mergeData: Record<string, any> = {
      Nama_PPL: payload.namaPpl,
      Desa: firstItem?.desa || '-',
      Kecamatan: firstItem?.kecamatan || 'Mempawah',
      Kegiatan: payload.activityTitle,
      Tanggal_TTD_Visum: payload.tanggalLaporan || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      Jabatan_Pejabat_Setempat: firstItem?.customFields?.['Jabatan Pejabat Setempat'] || 'Ketua RT Setempat',
      Nama_Ketua_SLS: firstItem?.customFields?.['Nama Ketua SLS'] || firstItem?.customFields?.['Nama Ketua RT'] || 'Tokoh Setempat',
      SLS: firstItem?.sls || '-',
      Longitude: lng,
      Latitude: lat,
      Timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Eksekusi pengisian tag MailMerge BPS
    fillWordMailMerge(zip, mergeData);

    // 2. Jika ada foto dokumentasi lapangan, sematkan ke word/media/image1.jpeg
    const photoItem = payload.items.find(i => i.fotoUrl && (i.fotoUrl.startsWith('data:image') || i.fotoUrl.startsWith('http')));
    if (photoItem?.fotoUrl && photoItem.fotoUrl.startsWith('data:image')) {
      try {
        const base64Data = photoItem.fotoUrl.split(',')[1];
        if (base64Data) {
          const photoBin = atob(base64Data);
          const photoBytes = new Uint8Array(photoBin.length);
          for (let p = 0; p < photoBin.length; p++) photoBytes[p] = photoBin.charCodeAt(p);
          zip.file('word/media/image1.jpeg', photoBytes);
        }
      } catch (err) {
        console.warn('Gagal menyematkan foto ke Word:', err);
      }
    }

    // 3. Fallback jika template menggunakan sintaks docxtemplater
    try {
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.render({
        ...mergeData,
        Total_Sampel: payload.items.length,
        Total_Selesai: payload.items.filter(i => i.status === 'submitted').length,
        daftar_responden: payload.items.map((item, idx) => ({
          no: idx + 1,
          nama_krt: item.namaKrt,
          nus: item.nus || '-',
          kecamatan: item.kecamatan,
          desa: item.desa,
          sls: item.sls,
          gps: item.gps,
          status: item.status === 'submitted' ? 'Selesai' : 'Draf'
        }))
      });
    } catch (e) {
      // Abaikan jika template murni MailMerge
    }

    const out = zip.generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const url = URL.createObjectURL(out);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Pendataan_${payload.namaPpl.replace(/\s+/g, '_')}_${payload.periode.replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating docx report:', error);
    openReportPrintWindow(payload);
  }
};
