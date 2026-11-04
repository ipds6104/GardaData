import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  RotateCcw
} from 'lucide-react';

export interface IndonesianDateTimePickerProps {
  value?: string; // 'YYYY-MM-DD' atau 'YYYY-MM-DDTHH:mm'
  onChange: (value: string) => void;
  mode?: 'date' | 'datetime';
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  id?: string;
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_SHORT_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const TIME_PRESETS_24H = [
  { label: '08:00', desc: 'Pagi', hour: '08', minute: '00' },
  { label: '09:00', desc: 'Sesi 1', hour: '09', minute: '00' },
  { label: '12:00', desc: 'Siang', hour: '12', minute: '00' },
  { label: '13:30', desc: 'Sesi 2', hour: '13', minute: '30' },
  { label: '16:00', desc: 'Sore', hour: '16', minute: '00' },
  { label: '17:00', desc: 'Selesai', hour: '17', minute: '00' },
  { label: '23:59', desc: 'Tutup', hour: '23', minute: '59' },
];

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES_STEPS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '59'];

export const IndonesianDateTimePicker: React.FC<IndonesianDateTimePickerProps> = ({
  value = '',
  onChange,
  mode = 'date',
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsing state awal dari value
  const parseValue = (val: string) => {
    if (!val) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        hour: String(now.getHours()).padStart(2, '0'),
        minute: String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0'),
        hasValue: false,
      };
    }

    try {
      if (mode === 'datetime' && val.includes('T')) {
        const [dPart, tPart] = val.split('T');
        const [y, m, d] = dPart.split('-').map(Number);
        const [h, min] = (tPart || '08:00').split(':');
        return {
          year: y || new Date().getFullYear(),
          month: (m ? m - 1 : 0),
          day: d || 1,
          hour: h ? h.padStart(2, '0') : '08',
          minute: min ? min.padStart(2, '0') : '00',
          hasValue: true,
        };
      } else {
        const [y, m, d] = val.split('-').map(Number);
        return {
          year: y || new Date().getFullYear(),
          month: (m ? m - 1 : 0),
          day: d || 1,
          hour: '08',
          minute: '00',
          hasValue: true,
        };
      }
    } catch {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        hour: '08',
        minute: '00',
        hasValue: false,
      };
    }
  };

  const parsed = parseValue(value);

  // Active view calendar state
  const [viewYear, setViewYear] = useState<number>(parsed.year);
  const [viewMonth, setViewMonth] = useState<number>(parsed.month);

  // Staging selection in popup
  const [selectedYear, setSelectedYear] = useState<number>(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(parsed.month);
  const [selectedDay, setSelectedDay] = useState<number | null>(parsed.hasValue ? parsed.day : null);
  const [selectedHour, setSelectedHour] = useState<string>(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState<string>(parsed.minute);

  // Sub-view untuk lompat tahun/bulan cepat
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  // Tab aktif pada mode datetime: 'calendar' atau 'time'
  const [activeTab, setActiveTab] = useState<'calendar' | 'time'>('calendar');

  // Sinkronisasi saat prop value berubah dari luar
  useEffect(() => {
    const p = parseValue(value);
    setViewYear(p.year);
    setViewMonth(p.month);
    setSelectedYear(p.year);
    setSelectedMonth(p.month);
    setSelectedDay(p.hasValue ? p.day : null);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
  }, [value, mode]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsYearPickerOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format display string di trigger button
  const getFormattedDisplay = () => {
    if (!value) return null;
    const p = parseValue(value);
    if (!p.hasValue) return null;

    const monthName = MONTHS_ID[p.month] || '';
    const dateFormatted = `${p.day} ${monthName} ${p.year}`;

    if (mode === 'datetime') {
      return `${dateFormatted}, ${p.hour}:${p.minute} WIB`;
    }
    return dateFormatted;
  };

  // Navigasi bulan
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Commit value ke parent
  const handleApply = (d: number, h: string, m: string) => {
    const yStr = String(viewYear);
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');

    if (mode === 'datetime') {
      const finalVal = `${yStr}-${mStr}-${dStr}T${h}:${m}`;
      onChange(finalVal);
    } else {
      const finalVal = `${yStr}-${mStr}-${dStr}`;
      onChange(finalVal);
    }
    setIsOpen(false);
    setIsYearPickerOpen(false);
  };

  // Quick action: Hari ini / Sekarang
  const handleSetToday = () => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const curDay = now.getDate();
    const curHour = String(now.getHours()).padStart(2, '0');
    const curMin = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');

    setViewYear(curYear);
    setViewMonth(curMonth);
    setSelectedYear(curYear);
    setSelectedMonth(curMonth);
    setSelectedDay(curDay);
    setSelectedHour(curHour);
    setSelectedMinute(curMin);

    handleApply(curDay, curHour, curMin);
  };

  // Clear date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSelectedDay(null);
  };

  // Hitung grid hari dalam bulan
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Min, 1 = Sen, ...
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Senin = 0, Minggu = 6
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
  };

  const isDaySelected = (day: number) => {
    return (
      selectedDay === day &&
      selectedMonth === viewMonth &&
      selectedYear === viewYear
    );
  };

  // List of years untuk quick selector (10 tahun terakhir & 5 tahun ke depan)
  const currentSysYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 16 }, (_, i) => currentSysYear - 10 + i);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-500 uppercase mb-2">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button Box */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && mode === 'datetime') {
            setActiveTab('calendar');
          }
        }}
        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl font-semibold text-left flex items-center justify-between transition-all cursor-pointer select-none group ${
          isOpen
            ? 'border-primary-500 bg-white ring-2 ring-primary-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
            value ? 'bg-primary-50 text-primary-600' : 'bg-slate-200/60 text-slate-400 group-hover:text-slate-600'
          }`}>
            {mode === 'datetime' ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
          </div>
          <span className={`text-sm truncate ${value ? 'text-slate-800 font-bold' : 'text-slate-400 font-medium'}`}>
            {getFormattedDisplay() || placeholder || (mode === 'datetime' ? 'Pilih tanggal & jam WIB...' : 'Pilih tanggal...')}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !required && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Hapus tanggal"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90 text-primary-600' : ''}`} />
        </div>
      </button>

      {/* Hidden input untuk form HTML standard */}
      <input
        type="hidden"
        value={value}
        required={required}
        readOnly
      />

      {/* Pop-up Dialog / Popover Calendar & Clock */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 sm:right-auto sm:w-[360px] mt-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden text-slate-800"
            style={{ minWidth: '320px' }}
          >
            {/* Mode Datetime: Tab Selector (Tanggal vs Waktu 24 Jam) */}
            {mode === 'datetime' && (
              <div className="flex rounded-xl bg-slate-100 p-1 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'bg-white text-primary-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Tanggal ({selectedDay || '–'} {MONTHS_ID[viewMonth].slice(0, 3)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('time')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'time'
                      ? 'bg-white text-primary-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Jam ({selectedHour}:{selectedMinute} WIB)</span>
                </button>
              </div>
            )}

            {/* TAB 1: KALENDER */}
            {(mode === 'date' || activeTab === 'calendar') && (
              <div>
                {/* Header: Bulan & Tahun dengan Quick Picker */}
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Bulan Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                    className="px-3 py-1 rounded-lg text-sm font-black text-slate-800 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{MONTHS_ID[viewMonth]} {viewYear}</span>
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded uppercase">Ubah</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Bulan Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Year & Month Selector Panel */}
                {isYearPickerOpen && (
                  <div className="p-3 mb-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                    <div>
                      <div className="font-bold text-slate-500 uppercase text-[10px] mb-1.5">Pilih Bulan</div>
                      <div className="grid grid-cols-4 gap-1">
                        {MONTHS_ID.map((mName, idx) => (
                          <button
                            key={mName}
                            type="button"
                            onClick={() => {
                              setViewMonth(idx);
                              setIsYearPickerOpen(false);
                            }}
                            className={`py-1 px-1.5 rounded-md font-bold text-center truncate transition-colors cursor-pointer ${
                              viewMonth === idx
                                ? 'bg-primary-600 text-white'
                                : 'hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {mName.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-500 uppercase text-[10px] mb-1.5">Pilih Tahun</div>
                      <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto pr-1">
                        {yearOptions.map(y => (
                          <button
                            key={y}
                            type="button"
                            onClick={() => {
                              setViewYear(y);
                              setIsYearPickerOpen(false);
                            }}
                            className={`py-1 rounded-md font-bold text-center transition-colors cursor-pointer ${
                              viewYear === y
                                ? 'bg-primary-600 text-white'
                                : 'hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Kalender: Header Hari (Sen - Min) */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DAYS_SHORT_ID.map(day => (
                    <div key={day} className="text-[11px] font-black text-slate-400 py-1 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Kalender: Grid Tanggal */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Hari bulan sebelumnya */}
                  {Array.from({ length: startOffset }, (_, i) => {
                    const prevDate = prevMonthDays - startOffset + i + 1;
                    return (
                      <div
                        key={`prev-${i}`}
                        className="h-8 flex items-center justify-center text-xs font-semibold text-slate-300 select-none"
                      >
                        {prevDate}
                      </div>
                    );
                  })}

                  {/* Hari bulan aktif */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNum = i + 1;
                    const selected = isDaySelected(dayNum);
                    const today = isToday(dayNum);

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        onClick={() => {
                          setSelectedDay(dayNum);
                          setSelectedMonth(viewMonth);
                          setSelectedYear(viewYear);
                          if (mode === 'date') {
                            handleApply(dayNum, selectedHour, selectedMinute);
                          } else {
                            // Untuk mode datetime, setelah pilih tanggal otomatis arahkan ke pemilihan jam
                            setActiveTab('time');
                          }
                        }}
                        className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer relative ${
                          selected
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-200 scale-105'
                            : today
                            ? 'bg-primary-50 text-primary-700 font-extrabold hover:bg-primary-100'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {dayNum}
                        {today && !selected && (
                          <span className="absolute bottom-1 w-1 h-1 bg-primary-600 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: PEMILIH JAM 24 JAM INDONESIA */}
            {mode === 'datetime' && activeTab === 'time' && (
              <div className="space-y-3">
                {/* Banner Jam Digital 24 Jam */}
                <div className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-xl p-3 text-white flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-primary-200 tracking-wider">Format Jam 24 Jam (WIB)</div>
                    <div className="text-2xl font-black font-mono tracking-wider mt-0.5">
                      {selectedHour}:{selectedMinute} <span className="text-xs font-bold text-primary-200">WIB</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {Number(selectedHour) < 12 ? 'Pagi' : Number(selectedHour) < 15 ? 'Siang' : Number(selectedHour) < 19 ? 'Sore' : 'Malam'}
                    </span>
                  </div>
                </div>

                {/* Preset Cepat Waktu */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                    Pilihan Cepat Waktu:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {TIME_PRESETS_24H.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setSelectedHour(preset.hour);
                          setSelectedMinute(preset.minute);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          selectedHour === preset.hour && selectedMinute === preset.minute
                            ? 'bg-primary-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {preset.label} <span className="text-[9px] opacity-75">({preset.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid 24 Jam (00 s.d. 23) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Pilih Jam (00 - 23 WIB)</span>
                    <span className="text-[10px] font-bold text-primary-600">Jam: {selectedHour}:00</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {HOURS_24.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setSelectedHour(h)}
                        className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                          selectedHour === h
                            ? 'bg-primary-600 text-white font-black shadow-xs scale-105'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Menit (00 s.d. 59) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Pilih Menit</span>
                    <span className="text-[10px] font-bold text-primary-600">Menit: :{selectedMinute}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {MINUTES_STEPS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMinute(m)}
                        className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                          selectedMinute === m
                            ? 'bg-primary-600 text-white font-black shadow-xs scale-105'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                        }`}
                      >
                        :{m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Aksi: Hari Ini & Terapkan */}
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSetToday}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hari Ini</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = selectedDay || new Date().getDate();
                    handleApply(d, selectedHour, selectedMinute);
                  }}
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Pilih</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
