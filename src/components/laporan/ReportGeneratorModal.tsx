import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, X, Printer, Download, CheckCircle2, 
  Users, MapPin, Calendar, FileSpreadsheet, Sparkles 
} from 'lucide-react';
import { 
  openReportPrintWindow, 
  downloadDocxReport, 
  ReportItemData 
} from './report/docxGeneratorEngine';
import { getRecordVal, cleanText } from './laporanConstants';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: any;
  form: any;
  records: any[];
  primaryThemeColor?: string;
  initialPplName?: string;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  activity,
  form,
  records,
  primaryThemeColor = '#0ea5e9',
  initialPplName = ''
}) => {
  if (!isOpen) return null;

  // Extract list of all PPLs from records
  const allPpls = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      const d = r.data || {};
      const ppl = getRecordVal(d, 'Nama PPL') || getRecordVal(d, 'PPL') || getRecordVal(d, 'Nama Petugas');
      if (ppl && String(ppl).trim()) set.add(String(ppl).trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Extract list of all Kecamatans
  const allKecamatans = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      const d = r.data || {};
      const kec = getRecordVal(d, 'Kecamatan');
      if (kec && String(kec).trim()) set.add(String(kec).trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filter States
  const [selectedPpl, setSelectedPpl] = useState<string>(initialPplName || (allPpls[0] || 'Semua Petugas'));
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'submitted' | 'draft'>('all');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportPeriode, setReportPeriode] = useState<string>('Mei 2026');

  // Filtered records based on selection
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const d = r.data || {};
      const ppl = String(getRecordVal(d, 'Nama PPL') || getRecordVal(d, 'PPL') || getRecordVal(d, 'Nama Petugas') || '').trim();
      const kec = String(getRecordVal(d, 'Kecamatan') || '').trim();

      if (selectedPpl !== 'Semua Petugas' && ppl.toLowerCase() !== selectedPpl.toLowerCase()) {
        return false;
      }
      if (selectedKecamatan !== 'Semua' && kec.toLowerCase() !== selectedKecamatan.toLowerCase()) {
        return false;
      }
      if (selectedStatus !== 'all' && r.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [records, selectedPpl, selectedKecamatan, selectedStatus]);

  const totalSampel = filteredRecords.length;
  const totalSelesai = filteredRecords.filter(r => r.status === 'submitted').length;
  const persentase = totalSampel > 0 ? Math.round((totalSelesai / totalSampel) * 100) : 0;

  // Build Payload
  const getPayload = () => {
    const labelField = (form?.fields || []).find((f: any) => f.isLabel);
    const labelKey = labelField?.columnName || labelField?.label;

    const items: ReportItemData[] = filteredRecords.map((r, idx) => {
      const d = r.data || {};
      const photoField = (form?.fields || []).find((f: any) => f.dataType === 'Image' || f.type === 'Image');
      const gpsField = (form?.fields || []).find((f: any) => f.dataType === 'LatLong' || f.type === 'LatLong');

      const photoVal = (photoField ? getRecordVal(d, photoField.columnName) : '') || getRecordVal(d, 'Foto Lapangan') || getRecordVal(d, 'Foto');
      const gpsVal = (gpsField ? getRecordVal(d, gpsField.columnName) : '') || (r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : getRecordVal(d, 'Geotagging'));

      return {
        namaPpl: selectedPpl !== 'Semua Petugas' ? selectedPpl : (getRecordVal(d, 'Nama PPL') || 'Petugas'),
        kabupaten: getRecordVal(d, 'Kabupaten') || 'Mempawah',
        kecamatan: getRecordVal(d, 'Kecamatan') || '-',
        desa: getRecordVal(d, 'Desa') || '-',
        sls: getRecordVal(d, 'SLS') || getRecordVal(d, 'RT') || '-',
        namaKrt: (labelKey ? getRecordVal(d, labelKey) : '') || getRecordVal(d, 'Nama KRT') || getRecordVal(d, 'Nama Responden') || `Responden #${idx + 1}`,
        status: r.status || 'draft',
        gps: String(gpsVal || '-'),
        fotoUrl: photoVal,
        tanggal: r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : reportDate,
        nus: getRecordVal(d, 'NUS') || getRecordVal(d, 'No Urut') || String(idx + 1)
      };
    });

    return {
      activityTitle: activity?.title || 'Kegiatan Pendataan Lapangan',
      namaPpl: selectedPpl,
      periode: reportPeriode,
      tanggalLaporan: new Date(reportDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      items
    };
  };

  const handlePrint = () => {
    openReportPrintWindow(getPayload());
  };

  const handleDownloadDocx = () => {
    downloadDocxReport(getPayload());
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Generator Laporan Resmi Perjalanan / PPL
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kegiatan: <span className="font-semibold text-slate-700 dark:text-slate-300">{activity?.title || 'E-Form'}</span>
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Form */}
        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Filter PPL */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-primary-600" />
                <span>Pilih Petugas (PPL):</span>
              </label>
              <select
                value={selectedPpl}
                onChange={(e) => setSelectedPpl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="Semua Petugas">-- Semua Petugas (Rekap Total) --</option>
                {allPpls.map(ppl => (
                  <option key={ppl} value={ppl}>{ppl}</option>
                ))}
              </select>
            </div>

            {/* Filter Wilayah */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Kecamatan:</span>
              </label>
              <select
                value={selectedKecamatan}
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="Semua">-- Semua Kecamatan --</option>
                {allKecamatans.map(kec => (
                  <option key={kec} value={kec}>{kec}</option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status Sampel:</span>
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="all">Semua Sampel (Draf &amp; Selesai)</option>
                <option value="submitted">Hanya Sampel Terverifikasi (Selesai)</option>
                <option value="draft">Hanya Draf / Belum Selesai</option>
              </select>
            </div>

            {/* Tanggal & Periode */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Tanggal Laporan:</span>
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Hasil Filter Dokumen</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedPpl} ({totalSampel} Responden)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {totalSelesai} terverifikasi selesai &bull; {totalSampel - totalSelesai} draf
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {persentase}%
              </span>
              <span className="text-[10px] text-slate-400 block font-semibold">Kelengkapan</span>
            </div>
          </div>

          {/* Preview Format Info */}
          <div className="p-3 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-xl text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Dokumen yang digenerate mencakup <b>Kop Surat Resmi BPS</b>, tabel rincian sampel responden, koordinat geotagging GPS, lampiran foto, serta lembar tanda tangan PPL dan Pengawas Lapangan (PML).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              style={{ backgroundColor: primaryThemeColor }}
              className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Pratinjau Cetak / Ekspor PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Pratinjau / Cetak PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Unduh Format Microsoft Word"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Dokumen (.docx)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
