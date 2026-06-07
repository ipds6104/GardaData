import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, MapPin, Building2, Users, Wheat, Mars, Venus, CreditCard, FolderOpen, Database, CheckCircle2, Loader2, Map as MapIcon, Info, Globe, Download, Upload, FileSpreadsheet, AlertCircle, Calendar, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, orderBy, limit, serverTimestamp, writeBatch, doc, where, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { OperationType, handleFirestoreError } from '../lib/errorUtils';
import { KECAMATAN_LIST, MEMPAWAH_REGIONS } from '../data/regions';
import * as XLSX from 'xlsx';

interface VillageStat {
  id: string;
  village: string;
  year?: string;
  male: string;
  female: string;
  total: string;
  kk: string;
  agriFamily: string;
}

interface InfrastructureItem {
  id: string;
  category: string;
  item: string;
  village: string;
  source: string;
  year?: string;
}

interface InfrastructureModuleProps {
  onBack: () => void;
}

// Helper slugify untuk cegah duplikasi pengetikan
const slugify = (text: string) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Komponen Custom Combobox untuk dropdown yang rapi
const CustomCombobox = ({ value, onChange, options, placeholder, icon: Icon, disabled }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const filteredOptions = options.filter((o: string) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full space-y-2">
      <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
        {Icon && <Icon className="w-4 h-4 text-primary-500" />}
        {placeholder}
      </label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={`Ketik atau pilih...`}
          className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
          disabled={disabled}
        />
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />

        <AnimatePresence>
          {isOpen && filteredOptions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 max-h-60 overflow-y-auto overflow-x-hidden"
            >
              {filteredOptions.map((opt: string) => (
                <div
                  key={opt}
                  className="px-5 py-3 hover:bg-primary-50 hover:text-primary-700 cursor-pointer font-bold text-slate-600 transition-colors"
                  onClick={() => {
                    setSearch(opt);
                    onChange(opt);
                    setIsOpen(false);
                  }}
                >
                  {opt}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SEED_DATA_RAW = `Kategori;Infrastruktur;Nama Desa;Sumber Data
Hutan;Hutan Lindung;AMAWANG;UPT Kehutanan
Hutan;Lembaga Pengelola Hutan Desa (LPHD);AMAWANG;UPT Kehutanan
Kesehatan;Polindes;AMAWANG;Dinkes
Olahraga;Sepak Bola (1);AMAWANG;Data Desa
Olahraga;Voli (1);AMAWANG;Data Desa
Olahraga;Bulu Tangkis (1);AMAWANG;Data Desa
Panti;Panti Asuhan;AMAWANG;Data Desa
Panti;Panti Jompo;AMAWANG;Data Desa
Pendidikan;SD (2);AMAWANG;Dinkes
Pendidikan;SMP (1);AMAWANG;Dinkes
Pendidikan;TPA (5);AMAWANG;Kemenag
Pendidikan;PAUD (2);AMAWANG;Dinkes
Perhubungan;Dermaga (2);AMAWANG;Data Desa
Pertanian;UPJA;AMAWANG;Distan
Pertanian;RMU;AMAWANG;Distan
Sampah;TPS;AMAWANG;DLH
Tambahan Data;Kantor Desa;AMAWANG;Data Desa
Tambahan Data;Bumdes;AMAWANG;Data Desa
Tambahan Data;Lembaga Adat;AMAWANG;Data Desa
Tambahan Data;LPM;AMAWANG;Data Desa
Hutan;Hutan Lindung;ANTIBAR;UPT Kehutanan
Hutan;Lembaga Pengelola Hutan Desa (LPHD);ANTIBAR;UPT Kehutanan
Kesehatan;Polindes (1);ANTIBAR;Dinkes
Kesehatan;Poskesdes (1);ANTIBAR;Dinkes
Olahraga;Sepak Bola (1);ANTIBAR;Data Desa
Olahraga;Voli (1);ANTIBAR;Data Desa
Olahraga;Bulu Tangkis (1);ANTIBAR;Data Desa
Olahraga;Futsal (1);ANTIBAR;Data Desa
Olahraga;Senam (1);ANTIBAR;Data Desa
Panti;Panti Asuhan;ANTIBAR;Data Desa
Panti;Panti Jompo;ANTIBAR;Data Desa
Pendidikan;SD (3);ANTIBAR;Dinkes
Pendidikan;SMP (1);ANTIBAR;Dinkes
Pendidikan;TK (1);ANTIBAR;Dinkes
Pendidikan;TPA (6);ANTIBAR;Kemenag
Pendidikan;PAUD (2);ANTIBAR;Dinkes
Perhubungan;Dermaga (1);ANTIBAR;Data Desa
Pertanian;UPJA;ANTIBAR;Distan
Pertanian;RMU;ANTIBAR;Distan
Sampah;TPS (1);ANTIBAR;DLH
Tambahan Data;Kantor Desa;ANTIBAR;Data Desa
Tambahan Data;Bumdes;ANTIBAR;Data Desa
Tambahan Data;Lembaga Adat;ANTIBAR;Data Desa
Tambahan Data;LPM;ANTIBAR;Data Desa
Hutan;Hutan Lindung;PASIR;UPT Kehutanan
Hutan;Lembaga Pengelola Hutan Desa (LPHD);PASIR;UPT Kehutanan
Kesehatan;Polindes;PASIR;Dinkes
Kesehatan;Poskesdes;PASIR;Dinkes
Olahraga;Sepak Bola;PASIR;Data Desa
Olahraga;Voli;PASIR;Data Desa
Olahraga;Bulu Tangkis;PASIR;Data Desa
Olahraga;Futsal;PASIR;Data Desa
Olahraga;Senam;PASIR;Data Desa
Olahraga;Tenis Meja;PASIR;Data Desa
Panti;Panti Asuhan;PASIR;Data Desa
Panti;Panti Jompo;PASIR;Data Desa
Pendidikan;SD (4);PASIR;Dinkes
Pendidikan;SMP (1);PASIR;Dinkes
Pendidikan;TK (2);PASIR;Dinkes
Pendidikan;TPA (6);PASIR;Kemenag
Pendidikan;PAUD (3);PASIR;Dinkes
Perhubungan;Dermaga;PASIR;Data Desa
Pertanian;UPJA;PASIR;Distan
Pertanian;RMU;PASIR;Distan
Sampah;TPS;PASIR;DLH
Sampah;Bank Sampah;PASIR;DLH
Tambahan Data;Kantor Desa;PASIR;Data Desa
Tambahan Data;Bumdes;PASIR;Data Desa
Tambahan Data;Lembaga Adat;PASIR;Data Desa
Tambahan Data;LPM;PASIR;Data Desa
Hutan;Hutan Lindung;SENGKUBANG;UPT Kehutanan
Hutan;Lembaga Pengelola Hutan Desa (LPHD);SENGKUBANG;UPT Kehutanan
Kesehatan;Polindes;SENGKUBANG;Dinkes
Kesehatan;Poskesdes;SENGKUBANG;Dinkes
Olahraga;Sepak Bola;SENGKUBANG;Data Desa
Olahraga;Voli;SENGKUBANG;Data Desa
Olahraga;Bulu Tangkis;SENGKUBANG;Data Desa
Olahraga;Futsal;SENGKUBANG;Data Desa
Olahraga;Senam;SENGKUBANG;Data Desa
Olahraga;Tenis Meja;SENGKUBANG;Data Desa
Panti;Panti Asuhan;SENGKUBANG;Data Desa
Panti;Panti Jompo;SENGKUBANG;Data Desa
Pendidikan;SD;SENGKUBANG;Dinkes
Pendidikan;SMP;SENGKUBANG;Dinkes
Pendidikan;TK;SENGKUBANG;Dinkes
Pendidikan;TPA;SENGKUBANG;Kemenag
Pendidikan;PAUD;SENGKUBANG;Dinkes
Perhubungan;Dermaga;SENGKUBANG;Data Desa
Pertanian;UPJA;SENGKUBANG;Distan
Pertanian;RMU;SENGKUBANG;Distan
Sampah;TPS;SENGKUBANG;DLH
Sampah;Bank Sampah;SENGKUBANG;DLH
Tambahan Data;Kantor Desa;SENGKUBANG;Data Desa
Tambahan Data;Bumdes;SENGKUBANG;Data Desa
Tambahan Data;Lembaga Adat;SENGKUBANG;Data Desa
Tambahan Data;LPM;SENGKUBANG;Data Desa
Hutan;Hutan Lindung;SEUDON;UPT Kehutanan
Hutan;Lembaga Pengelola Hutan Desa (LPHD);SEUDON;UPT Kehutanan
Kesehatan;Polindes;SEUDON;Dinkes
Kesehatan;Poskesdes;SEUDON;Dinkes
Olahraga;Sepak Bola;SEUDON;Data Desa
Olahraga;Voli;SEUDON;Data Desa
Olahraga;Bulu Tangkis;SEUDON;Data Desa
Olahraga;Futsal;SEUDON;Data Desa
Olahraga;Senam;SEUDON;Data Desa
Olahraga;Tenis Meja;SEUDON;Data Desa
Panti;Panti Asuhan;SEUDON;Data Desa
Panti;Panti Jompo;SEUDON;Data Desa
Pendidikan;SD;SEUDON;Dinkes
Pendidikan;SMP;SEUDON;Dinkes
Pendidikan;TK;SEUDON;Dinkes
Pendidikan;TPA;SEUDON;Kemenag
Pendidikan;PAUD;SEUDON;Dinkes
Perhubungan;Dermaga;SEUDON;Data Desa
Pertanian;UPJA;SEUDON;Distan
Pertanian;RMU;SEUDON;Distan
Sampah;TPS;SEUDON;DLH
Sampah;Bank Sampah;SEUDON;DLH
Tambahan Data;Kantor Desa;SEUDON;Data Desa
Tambahan Data;Bumdes;SEUDON;Data Desa
Tambahan Data;Lembaga Adat;SEUDON;Data Desa
Tambahan Data;LPM;SEUDON;Data Desa
Hutan;Hutan Lindung;MALIK;UPT Kehutanan
Hutan;Lembaga Pengelola Hutan Desa (LPHD);MALIK;UPT Kehutanan
Kesehatan;Polindes;MALIK;Dinkes
Kesehatan;Poskesdes;MALIK;Dinkes
Olahraga;Sepak Bola;MALIK;Data Desa
Olahraga;Voli;MALIK;Data Desa
Olahraga;Bulu Tangkis;MALIK;Data Desa
Olahraga;Futsal;MALIK;Data Desa
Olahraga;Senam;MALIK;Data Desa
Olahraga;Tenis Meja;MALIK;Data Desa
Panti;Panti Asuhan;MALIK;Data Desa
Panti;Panti Jompo;MALIK;Data Desa
Pendidikan;SD;MALIK;Dinkes
Pendidikan;SMP;MALIK;Dinkes
Pendidikan;TK;MALIK;Dinkes
Pendidikan;TPA;MALIK;Kemenag
Pendidikan;PAUD;MALIK;Dinkes
Perhubungan;Dermaga;MALIK;Data Desa
Pertanian;UPJA;MALIK;Distan
Pertanian;RMU;MALIK;Distan
Sampah;TPS;MALIK;DLH
Sampah;Bank Sampah;MALIK;DLH
Tambahan Data;Kantor Desa;MALIK;Data Desa
Tambahan Data;Bumdes;MALIK;Data Desa
Tambahan Data;Lembaga Adat;MALIK;Data Desa
Tambahan Data;LPM;MALIK;Data Desa
Hutan;Hutan Lindung;PASIR PANJANG;UPT Kehutanan
Hutan;Lembaga Pengelola Hutan Desa (LPHD);PASIR PANJANG;UPT Kehutanan
Kesehatan;Polindes;PASIR PANJANG;Dinkes
Kesehatan;Poskesdes;PASIR PANJANG;Dinkes
Olahraga;Sepak Bola;PASIR PANJANG;Data Desa
Olahraga;Voli;PASIR PANJANG;Data Desa
Olahraga;Bulu Tangkis;PASIR PANJANG;Data Desa
Olahraga;Futsal;PASIR PANJANG;Data Desa
Olahraga;Senam;PASIR PANJANG;Data Desa
Olahraga;Tenis Meja;PASIR PANJANG;Data Desa
Panti;Panti Asuhan;PASIR PANJANG;Data Desa
Panti;Panti Jompo;PASIR PANJANG;Data Desa
Pendidikan;SD;PASIR PANJANG;Dinkes
Pendidikan;SMP;PASIR PANJANG;Dinkes
Pendidikan;TK;PASIR PANJANG;Dinkes
Pendidikan;TPA;PASIR PANJANG;Kemenag
Pendidikan;PAUD;PASIR PANJANG;Dinkes
Perhubungan;Dermaga;PASIR PANJANG;Data Desa
Pertanian;UPJA;PASIR PANJANG;Distan
Pertanian;RMU;PASIR PANJANG;Distan
Sampah;TPS;PASIR PANJANG;DLH
Sampah;Bank Sampah;PASIR PANJANG;DLH
Tambahan Data;Kantor Desa;PASIR PANJANG;Data Desa
Tambahan Data;Bumdes;PASIR PANJANG;Data Desa
Tambahan Data;Lembaga Adat;PASIR PANJANG;Data Desa
Tambahan Data;LPM;PASIR PANJANG;Data Desa
Hutan;Hutan Lindung;KUALA;UPT Kehutanan
Hutan;Lembaga Pengelola Hutan Desa (LPHD);KUALA;UPT Kehutanan
Kesehatan;Polindes;KUALA;Dinkes
Kesehatan;Poskesdes;KUALA;Dinkes
Olahraga;Sepak Bola;KUALA;Data Desa
Olahraga;Voli;KUALA;Data Desa
Olahraga;Bulu Tangkis;KUALA;Data Desa
Olahraga;Futsal;KUALA;Data Desa
Olahraga;Senam;KUALA;Data Desa
Olahraga;Tenis Meja;KUALA;Data Desa
Panti;Panti Asuhan;KUALA;Data Desa
Panti;Panti Jompo;KUALA;Data Desa
Pendidikan;SD;KUALA;Dinkes
Pendidikan;SMP;KUALA;Dinkes
Pendidikan;TK;KUALA;Dinkes
Pendidikan;TPA;KUALA;Kemenag
Pendidikan;PAUD;KUALA;Dinkes
Perhubungan;Dermaga;KUALA;Data Desa
Pertanian;UPJA;KUALA;Distan
Pertanian;RMU;KUALA;Distan
Sampah;TPS;KUALA;DLH
Sampah;Bank Sampah;KUALA;DLH
Tambahan Data;Kantor Desa;KUALA;Data Desa
Tambahan Data;Bumdes;KUALA;Data Desa
Tambahan Data;Lembaga Adat;KUALA;Data Desa
Tambahan Data;LPM;KUALA;Data Desa
Hutan;Hutan Lindung;PENIBUNG;UPT Kehutanan
Hutan;Lembaga Pengelola Hutan Desa (LPHD);PENIBUNG;UPT Kehutanan
Kesehatan;Polindes;PENIBUNG;Dinkes
Kesehatan;Poskesdes;PENIBUNG;Dinkes
Olahraga;Sepak Bola;PENIBUNG;Data Desa
Olahraga;Voli;PENIBUNG;Data Desa
Olahraga;Bulu Tangkis;PENIBUNG;Data Desa
Olahraga;Futsal;PENIBUNG;Data Desa
Olahraga;Senam;PENIBUNG;Data Desa
Olahraga;Tenis Meja;PENIBUNG;Data Desa
Panti;Panti Asuhan;PENIBUNG;Data Desa
Panti;Panti Jompo;PENIBUNG;Data Desa
Pendidikan;SD;PENIBUNG;Dinkes
Pendidikan;SMP;PENIBUNG;Dinkes
Pendidikan;TK;PENIBUNG;Dinkes
Pendidikan;TPA;PENIBUNG;Kemenag
Pendidikan;PAUD;PENIBUNG;Dinkes
Perhubungan;Dermaga;PENIBUNG;Data Desa
Pertanian;UPJA;PENIBUNG;Distan
Pertanian;RMU;PENIBUNG;Distan
Sampah;TPS;PENIBUNG;DLH
Sampah;Bank Sampah;PENIBUNG;DLH
Tambahan Data;Kantor Desa;PENIBUNG;Data Desa
Tambahan Data;Bumdes;PENIBUNG;Data Desa
Tambahan Data;Lembaga Adat;PENIBUNG;Data Desa
Tambahan Data;LPM;PENIBUNG;Data Desa`;

export const InfrastructureModule: React.FC<InfrastructureModuleProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'manage'>('search');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState({
    category: '',
    year: ''
  });
  const [villageStats, setVillageStats] = useState<VillageStat[]>([]);
  const [infraItems, setInfraItems] = useState<InfrastructureItem[]>([]);
  const [uniqueVillages, setUniqueVillages] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [uniqueYears, setUniqueYears] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statsRef = collection(db, 'village_stats');
      const statsSnap = await getDocs(query(statsRef, orderBy('village', 'asc')));
      const stats = statsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as VillageStat[];
      setVillageStats(stats);

      const infraRef = collection(db, 'infrastructure_items');
      const infraSnap = await getDocs(query(infraRef, limit(100))); // Fetch initial names
      const infraVillages = infraSnap.docs.map(d => (d.data() as InfrastructureItem).village);

      const combinedVillages = Array.from(new Set([...stats.map(s => s.village), ...infraVillages]))
        .filter(Boolean)
        .sort();
      setUniqueVillages(combinedVillages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredVillages = React.useMemo(() => {
    if (!selectedKecamatan) return uniqueVillages;
    const allowed = MEMPAWAH_REGIONS[selectedKecamatan].map((v: string) => v.toUpperCase());
    return uniqueVillages.filter(v => allowed.includes(v.toUpperCase()));
  }, [selectedKecamatan, uniqueVillages]);

  const handleSearch = async (villageName: string, kecamatanName: string) => {
    if (!villageName && !kecamatanName) {
      setInfraItems([]);
      setUniqueCategories([]);
      setUniqueYears([]);
      return;
    }
    setLoading(true);
    try {
      const infraRef = collection(db, 'infrastructure_items');
      let snap;

      if (villageName) {
        // Fetch specific village
        const q = query(infraRef, where('village', '==', villageName.toUpperCase()));
        snap = await getDocs(q);
      } else {
        // Fetch all villages in kecamatan
        const allowed = MEMPAWAH_REGIONS[kecamatanName].map((v: string) => v.toUpperCase());
        const q = query(infraRef, where('village', 'in', allowed));
        snap = await getDocs(q);
      }

      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as InfrastructureItem[];
      setInfraItems(items);

      const cats = Array.from(new Set(items.map(i => i.category))).filter(Boolean).sort();
      const yrs = Array.from(new Set(items.map(i => i.year))).filter(Boolean).sort((a, b) => Number(b) - Number(a));
      setUniqueCategories(cats);
      setUniqueYears(yrs as string[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVillageChange = (val: string) => {
    setSelectedVillage(val);
    handleSearch(val, selectedKecamatan);
  };

  const handleKecamatanChange = (val: string) => {
    setSelectedKecamatan(val);
    setSelectedVillage(''); // Reset desa ketika kecamatan berubah
    handleSearch('', val);
  };

  const downloadInfraTemplate = () => {
    const templateData = [
      { Tahun: '2026', Kategori: 'Pendidikan', Infrastruktur: 'SDN 01 ANTIBAR', 'Nama Desa': 'ANTIBAR', 'Sumber Data': 'Dinas Pendidikan' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Infrastruktur');
    XLSX.writeFile(wb, 'Template_Infrastruktur_Desa.xlsx');
  };

  const downloadPopTemplate = () => {
    const templateData = [
      { Tahun: '2026', 'Nama Desa/Kelurahan': 'ANTIBAR', 'Banyak Penduduk Laki-Laki': '1000', 'Banyak Penduduk Perempuan': '1200', 'Jumlah KK': '500', 'Jumlah Keluarga Pertanian': '300' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kependudukan');
    XLSX.writeFile(wb, 'Template_Kependudukan_Desa.xlsx');
  };

  const parseRawData = (text: string) => {
    const lines = text.split('\n');
    if (lines.length < 2) return [];

    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ';';

    const header = firstLine.split(delimiter);
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(delimiter);
      const obj: any = {};
      header.forEach((h, i) => {
        obj[h.trim()] = values[i]?.trim();
      });
      return obj;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'infra' | 'pop') => {
    const file = e.target.files?.[0];
    if (!file || !user || user.role !== 'admin') return;

    setUploading(true);
    setMessage(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result as string;
        let data: any[] = [];

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]) as any[];
        } else {
          data = parseRawData(bstr);
        }

        if (type === 'infra') {
          await processAndUploadInfra(data);
        } else {
          await processAndUploadPop(data);
        }
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Gagal memproses file. Pastikan format kolom sesuai dengan template.' });
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const processAndUploadInfra = async (data: any[]) => {
    const batchSize = 100;
    let count = 0;
    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = data.slice(i, i + batchSize);
        chunk.forEach((item) => {
          const kategori = item.Kategori || item.category || 'Lainnya';
          const namaInfra = item.Infrastruktur || item.item;
          const desa = item['Nama Desa'] || item.village;
          const sumber = item['Sumber Data'] || item.source || 'Unknown';
          const tahun = item.Tahun || item.year || new Date().getFullYear().toString();

          if (namaInfra && desa) {
            // Upsert Logic: Kombinasi Desa + Kategori + Infrastruktur + Tahun (Cegah Duplikat)
            const docIdStr = `${slugify(desa)}-${slugify(kategori)}-${slugify(namaInfra)}-${tahun}`;
            const ref = doc(db, 'infrastructure_items', docIdStr);
            batch.set(ref, {
              category: String(kategori),
              item: String(namaInfra),
              village: String(desa).toUpperCase(),
              source: String(sumber),
              year: String(tahun),
              updatedAt: serverTimestamp(),
              createdBy: user?.username || 'system'
            }, { merge: true });
            count++;
          }
        });
        await batch.commit();
      }
      setMessage({ type: 'success', text: `Berhasil memproses ${count} data infrastruktur.` });
      if (selectedVillage) {
        handleSearch(selectedVillage);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menyimpan data infrastruktur ke database.' });
    }
  };

  const processAndUploadPop = async (data: any[]) => {
    const batchSize = 100;
    let count = 0;
    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = data.slice(i, i + batchSize);
        chunk.forEach((item) => {
          const desa = item['Nama Desa/Kelurahan'] || item.village;
          const tahun = item.Tahun || item.year || new Date().getFullYear().toString();

          if (desa) {
            const docIdStr = `${slugify(desa)}-${tahun}`;
            const ref = doc(db, 'village_stats', docIdStr);

            const male = Number(item['Banyak Penduduk Laki-Laki'] || 0);
            const female = Number(item['Banyak Penduduk Perempuan'] || 0);
            const total = male + female;

            batch.set(ref, {
              village: String(desa).toUpperCase(),
              year: String(tahun),
              male: String(male),
              female: String(female),
              total: String(total),
              kk: String(item['Jumlah KK'] || 0),
              agriFamily: String(item['Jumlah Keluarga Pertanian'] || 0),
              updatedAt: serverTimestamp(),
              updatedBy: user?.username || 'system'
            }, { merge: true });
            count++;
          }
        });
        await batch.commit();
      }
      setMessage({ type: 'success', text: `Berhasil memproses ${count} data kependudukan.` });
      fetchData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menyimpan data kependudukan ke database.' });
    }
  };

  const seedProvidedData = () => {
    const data = parseRawData(SEED_DATA_RAW);
    processAndUploadInfra(data);
  };

  const migrateDatabaseTo2025 = async () => {
    if (!window.confirm('PERINGATAN: Tindakan ini akan memigrasi seluruh data infrastruktur dan kependudukan menjadi tahun 2025, dan menghapus dokumen lama. Lanjutkan?')) return;

    setUploading(true);
    setMessage(null);
    let migratedCount = 0;

    try {
      const infraRef = collection(db, 'infrastructure_items');
      const infraSnap = await getDocs(infraRef);

      let batch = writeBatch(db);
      let opCount = 0;

      for (const d of infraSnap.docs) {
        const data = d.data() as InfrastructureItem;
        if (data.year !== '2025') {
          const newIdStr = `${slugify(data.village)}-${slugify(data.category)}-${slugify(data.item)}-2025`;
          const newRef = doc(db, 'infrastructure_items', newIdStr);

          batch.set(newRef, {
            ...data,
            year: '2025',
            updatedAt: serverTimestamp(),
            migratedAt: serverTimestamp()
          });

          if (newIdStr !== d.id) {
            batch.delete(d.ref);
          }

          migratedCount++;
          opCount += 2;

          if (opCount >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        }
      }
      if (opCount > 0) await batch.commit();

      const popRef = collection(db, 'village_stats');
      const popSnap = await getDocs(popRef);

      batch = writeBatch(db);
      opCount = 0;

      for (const d of popSnap.docs) {
        const data = d.data() as VillageStat;
        if (data.year !== '2025') {
          const newIdStr = `${slugify(data.village)}-2025`;
          const newRef = doc(db, 'village_stats', newIdStr);

          batch.set(newRef, {
            ...data,
            year: '2025',
            updatedAt: serverTimestamp(),
            migratedAt: serverTimestamp()
          });

          if (newIdStr !== d.id) {
            batch.delete(d.ref);
          }

          migratedCount++;
          opCount += 2;

          if (opCount >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        }
      }
      if (opCount > 0) await batch.commit();

      setMessage({ type: 'success', text: `Migrasi selesai. ${migratedCount} data berhasil dipindahkan ke tahun 2025.` });
      fetchData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat melakukan migrasi massal.' });
    } finally {
      setUploading(false);
    }
  };

  // Aggregation for Display Stats
  const displayStats = React.useMemo(() => {
    if (selectedVillage) {
      return villageStats.find(s =>
        s.village.toUpperCase() === selectedVillage.toUpperCase() &&
        (!searchQuery.year || s.year === searchQuery.year)
      );
    } else if (selectedKecamatan) {
      // Aggregate stats for all villages in selected kecamatan
      const allowed = MEMPAWAH_REGIONS[selectedKecamatan].map((v: string) => v.toUpperCase());
      const matchingStats = villageStats.filter(s =>
        allowed.includes(s.village.toUpperCase()) &&
        (!searchQuery.year || s.year === searchQuery.year)
      );

      if (matchingStats.length === 0) return undefined;

      return matchingStats.reduce((acc, curr) => ({
        id: 'aggregated',
        village: `KEC. ${selectedKecamatan.toUpperCase()}`,
        year: curr.year || acc.year,
        male: String(Number(acc.male || 0) + Number(curr.male || 0)),
        female: String(Number(acc.female || 0) + Number(curr.female || 0)),
        total: String(Number(acc.total || 0) + Number(curr.total || 0)),
        kk: String(Number(acc.kk || 0) + Number(curr.kk || 0)),
        agriFamily: String(Number(acc.agriFamily || 0) + Number(curr.agriFamily || 0)),
      }), { male: '0', female: '0', total: '0', kk: '0', agriFamily: '0' } as any) as VillageStat;
    }
    return undefined;
  }, [selectedVillage, selectedKecamatan, villageStats, searchQuery.year]);

  const filteredInfra = infraItems.filter(item => {
    const matchCategory = !searchQuery.category || item.category?.toLowerCase().includes(searchQuery.category.toLowerCase());
    const matchYear = !searchQuery.year || item.year === searchQuery.year;
    return matchCategory && matchYear;
  });

  const groupedInfra = filteredInfra.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InfrastructureItem[]>);

  // Grouping Otomatis Sesuai Prioritas
  const predefinedOrder = ['Hutan', 'Pendidikan', 'Kesehatan', 'Transportasi'];
  const sortedCategories = Object.keys(groupedInfra).sort((a, b) => {
    const idxA = predefinedOrder.indexOf(a);
    const idxB = predefinedOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  // Generate summary counts
  const summaryCounts = (selectedVillage || selectedKecamatan) ? (
    searchQuery.category ?
      Object.entries(filteredInfra.reduce((acc, item) => {
        if (!acc[item.item]) acc[item.item] = 0;
        acc[item.item]++;
        return acc;
      }, {} as Record<string, number>)).map(([name, count]) => ({ name, count, isItem: true }))
      :
      sortedCategories.map(cat => ({ name: cat, count: groupedInfra[cat].length, isItem: false }))
  ) : [];

  const handleScrollToSection = (sectionName: string) => {
    const el = document.getElementById(`section-${slugify(sectionName)}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors font-semibold group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Landing Page
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight md:text-6xl uppercase">Profil <span className="text-primary-600">Potensi Desa</span></h1>
          <p className="text-slate-500 font-medium mt-2">
            Eksplorasi potensi dan profil desa di Kabupaten Mempawah.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('search')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-tighter ${activeSubTab === 'search' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pencarian
          </button>
          <button
            onClick={() => setActiveSubTab('manage')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-tighter ${activeSubTab === 'manage' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Update Database
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'search' ? (
          <motion.div key="search-ui" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-12">

            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CustomCombobox
                  icon={MapIcon}
                  placeholder="Pilih Kecamatan"
                  value={selectedKecamatan}
                  onChange={handleKecamatanChange}
                  options={KECAMATAN_LIST}
                />
                <CustomCombobox
                  icon={MapPin}
                  placeholder="Pilih Nama Desa"
                  value={selectedVillage}
                  onChange={handleVillageChange}
                  options={filteredVillages}
                  disabled={selectedKecamatan && filteredVillages.length === 0}
                />
                <CustomCombobox
                  icon={FolderOpen}
                  placeholder="Filter Kategori"
                  value={searchQuery.category}
                  onChange={(val: string) => setSearchQuery({ ...searchQuery, category: val })}
                  options={uniqueCategories}
                  disabled={!selectedVillage}
                />
                <CustomCombobox
                  icon={Calendar}
                  placeholder="Filter Tahun"
                  value={searchQuery.year}
                  onChange={(val: string) => setSearchQuery({ ...searchQuery, year: val })}
                  options={uniqueYears}
                  disabled={!selectedVillage}
                />
              </div>
            </div>

            {(selectedVillage || selectedKecamatan) && (
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter ml-2">Ringkasan Profil {selectedVillage ? `Desa ${selectedVillage}` : `Kecamatan ${selectedKecamatan}`}</h3>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Blok Kependudukan (Kiri) */}
                  <div className="lg:col-span-5 bg-primary-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary-200">
                    <div className="mb-6">
                      <h4 className="text-primary-200 font-bold uppercase tracking-widest text-xs mb-1 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Data Kependudukan
                      </h4>
                      <p className="text-[10px] text-primary-300 italic">* Sumber data kependudukan dari Dinas Dukcapil</p>
                    </div>
                    {displayStats ? (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <span className="text-primary-300 text-xs font-black uppercase">Total Jiwa</span>
                          <p className="text-3xl font-black">{displayStats.total}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-primary-300 text-xs font-black uppercase">Jumlah KK</span>
                          <p className="text-3xl font-black">{displayStats.kk}</p>
                        </div>
                        <div className="space-y-1 flex items-center gap-2">
                          <div className="bg-primary-500/30 p-2 rounded-lg"><Mars className="w-4 h-4" /></div>
                          <div>
                            <span className="text-primary-300 text-[10px] font-black uppercase block">Laki-Laki</span>
                            <p className="text-lg font-bold">{displayStats.male}</p>
                          </div>
                        </div>
                        <div className="space-y-1 flex items-center gap-2">
                          <div className="bg-primary-500/30 p-2 rounded-lg"><Venus className="w-4 h-4" /></div>
                          <div>
                            <span className="text-primary-300 text-[10px] font-black uppercase block">Perempuan</span>
                            <p className="text-lg font-bold">{displayStats.female}</p>
                          </div>
                        </div>
                        <div className="col-span-2 mt-4 pt-4 border-t border-primary-500/30 flex items-center justify-between">
                          <span className="text-primary-200 text-xs font-bold uppercase">Keluarga Pertanian</span>
                          <span className="bg-white text-primary-600 px-3 py-1 rounded-lg text-sm font-black">{displayStats.agriFamily} KK</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center text-primary-300/50 text-sm font-medium border border-dashed border-primary-500/30 rounded-2xl">
                        Data kependudukan belum tersedia.
                      </div>
                    )}
                  </div>

                  {/* Blok Infrastruktur (Kanan) */}
                  <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-secondary-500" /> Jumlah Infrastruktur
                    </h4>
                    {summaryCounts.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {summaryCounts.map((s, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => !s.isItem && handleScrollToSection(s.name)}
                            className={`flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 ${!s.isItem ? 'cursor-pointer hover:bg-slate-100 hover:border-slate-200 transition-colors' : ''}`}
                          >
                            <span className={`text-sm ${!s.isItem ? 'font-bold text-slate-700' : 'font-medium text-slate-500'}`}>{s.name}</span>
                            <span className="bg-white px-2 py-1 rounded-lg text-xs font-black text-primary-600 border border-primary-100 shadow-sm">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-slate-400 text-sm font-medium border border-dashed border-slate-200 rounded-2xl">
                        Tidak ada infrastruktur yang tercatat.
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            <div className="grid gap-8">
              {loading ? (
                <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-primary-600" /></div>
              ) : Object.keys(groupedInfra).length > 0 ? (
                sortedCategories.map((category, catIdx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.1 }}
                    key={category}
                    id={`section-${slugify(category)}`}
                    className="space-y-6 scroll-mt-6"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-[1px] flex-grow bg-slate-100" />
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{category}</h4>
                      <div className="h-[1px] flex-grow bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupedInfra[category].map((item, idx) => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          key={item.id}
                          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Building2 className="w-16 h-16 text-slate-900" />
                          </div>
                          <div className="space-y-4 relative z-10">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">{item.village}</span>
                            <h5 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-tight group-hover:text-primary-600 transition-colors">{item.item}</h5>
                            <div className="flex items-center justify-between mt-6">
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <Database className="w-4 h-4 opacity-40" /> {item.source}
                                {item.year && <span className="ml-2 bg-slate-100 px-2 py-0.5 rounded text-slate-500">Thn: {item.year}</span>}
                              </div>
                              <a
                                href={`https://www.google.com/maps/search/Desa+${item.village}+${item.item}`}
                                target="_blank" rel="noreferrer"
                                className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
                              >
                                <MapPin className="w-5 h-5" />
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : selectedVillage ? (
                <div className="py-20 text-center text-slate-400 font-medium bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                  <Info className="w-16 h-16 mx-auto mb-6 opacity-10" />
                  Tidak ada infrastruktur yang ditemukan untuk filter ini di desa {selectedVillage}.
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 font-medium bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                  <MapIcon className="w-16 h-16 mx-auto mb-6 opacity-10" />
                  Silakan pilih nama desa untuk melihat detail infrastruktur.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="manage-ui" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-5xl mx-auto">
            {user?.role !== 'admin' ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-16 text-center space-y-8">
                <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Akses Terbatas</h2>
                  <p className="text-slate-500 max-w-sm mx-auto">Hanya administrator yang dapat melakukan pembaruan database pusat.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 md:p-16 space-y-12">
                <div className="text-center space-y-4">
                  <div className="bg-primary-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-primary-600">
                    <FileSpreadsheet className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Updating Data Desa</h2>
                  <p className="text-slate-500 max-w-lg mx-auto">Update database infrastruktur desa melalui Excel.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Blok Infrastruktur */}
                  <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6 flex flex-col items-center text-center border border-slate-100">
                    <Building2 className="w-10 h-10 text-slate-400" />
                    <div>
                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter">Data Infrastruktur</h4>
                      <p className="text-sm text-slate-500 mt-2">Format kolom: Tahun, Kategori, Infrastruktur, Nama Desa, Sumber Data.</p>
                    </div>
                    <div className="w-full space-y-3 mt-auto">
                      <button
                        onClick={downloadInfraTemplate}
                        className="w-full bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Unduh Template Infrastruktur
                      </button>
                      <label className="w-full bg-primary-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 transition-all cursor-pointer shadow-md shadow-primary-100 flex items-center justify-center gap-2">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Unggah Infrastruktur</>}
                        <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleFileUpload(e, 'infra')} disabled={uploading} />
                      </label>
                    </div>
                  </div>

                  {/* Blok Kependudukan */}
                  <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6 flex flex-col items-center text-center border border-slate-100">
                    <Users className="w-10 h-10 text-slate-400" />
                    <div>
                      <h4 className="font-black text-slate-900 text-lg uppercase tracking-tighter">Data Kependudukan</h4>
                      <p className="text-sm text-slate-500 mt-2">Format kolom: Tahun, Nama Desa/Kelurahan, Penduduk Laki/Pr, Jumlah KK, Pertanian.</p>
                    </div>
                    <div className="w-full space-y-3 mt-auto">
                      <button
                        onClick={downloadPopTemplate}
                        className="w-full bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Unduh Template Kependudukan
                      </button>
                      <label className="w-full bg-secondary-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary-700 transition-all cursor-pointer shadow-md shadow-secondary-100 flex items-center justify-center gap-2">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Unggah Kependudukan</>}
                        <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleFileUpload(e, 'pop')} disabled={uploading} />
                      </label>
                    </div>
                  </div>


                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`p-6 rounded-[1.5rem] flex items-center gap-4 ${message.type === 'success' ? 'bg-secondary-50 text-secondary-700 border border-secondary-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                    >
                      {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                      <p className="font-bold uppercase tracking-tight">{message.text}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
