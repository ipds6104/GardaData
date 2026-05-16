export type ImputationType = 'NILAI_IMPUTASI' | 'BANSOS' | 'WAJIB_IMPUTASI' | 'WAJIB_TRANSFER';

export interface BaseImputation {
  id: string;
  type: ImputationType;
  kategori: string;
  keywordText: string; // Precomputed string for easy Fuse.js searching
  aktif: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NilaiImputation extends BaseImputation {
  type: 'NILAI_IMPUTASI';
  keterangan: string;
  nilaiPengeluaran: string;
  nilaiOOP: string;
  nilaiPendapatan: string;
  sumberPendapatan: string;
}

export interface BansosImputation extends BaseImputation {
  type: 'BANSOS';
  jenisBantuan: string;
  pengelompokanJenisBantuan: string;
  nilai: string;
  periodePenerimaan: string;
}

export interface WajibImputation extends BaseImputation {
  type: 'WAJIB_IMPUTASI';
  kuesioner: string;
  rincianPertanyaan: string;
  keterangan: string;
  sumberPendanaan: string;
}

export interface WajibTransferImputation extends BaseImputation {
  type: 'WAJIB_TRANSFER';
  penerimaan: string;
  transferDiterimaUang: string;
  transferDiterimaBarang: string;
  transferDibayarUang: string;
  transferDibayarBarang: string;
}

export type ImputationData = NilaiImputation | BansosImputation | WajibImputation | WajibTransferImputation;
