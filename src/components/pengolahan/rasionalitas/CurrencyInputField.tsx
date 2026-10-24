import React, { useRef, useLayoutEffect } from 'react';

interface CurrencyInputFieldProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const CurrencyInputField: React.FC<CurrencyInputFieldProps> = ({
  id,
  value,
  onChange,
  placeholder = '0',
  hasError = false,
  className = '',
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const targetCursorRef = useRef<number | null>(null);

  // Preserve correct cursor position after React re-renders formatted value
  useLayoutEffect(() => {
    if (inputRef.current && targetCursorRef.current !== null) {
      const pos = Math.min(targetCursorRef.current, inputRef.current.value.length);
      inputRef.current.setSelectionRange(pos, pos);
      targetCursorRef.current = null;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawText = input.value;
    const cursorPos = input.selectionStart ?? rawText.length;

    // Count how many numeric digits were typed before the cursor
    const digitsBeforeCursor = rawText.slice(0, cursorPos).replace(/\D/g, '').length;

    // Clean all non-digit characters
    const allDigits = rawText.replace(/\D/g, '');

    if (!allDigits) {
      targetCursorRef.current = 0;
      onChange('');
      return;
    }

    // Format as Indonesian Rupiah grouping (e.g. 7000000 -> 7.000.000)
    let formatted = '';
    try {
      formatted = new Intl.NumberFormat('id-ID').format(BigInt(allDigits));
    } catch {
      formatted = new Intl.NumberFormat('id-ID').format(parseInt(allDigits, 10));
    }

    // Compute cursor position in newly formatted string matching the digits before cursor
    let targetCursorPos = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      if (digitCount === digitsBeforeCursor) {
        targetCursorPos = i + 1;
        break;
      }
    }
    if (digitCount < digitsBeforeCursor) {
      targetCursorPos = formatted.length;
    }

    targetCursorRef.current = targetCursorPos;
    onChange(formatted);
  };

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value || ''}
      onChange={handleChange}
      autoFocus={autoFocus}
      className={className || `w-full pl-10 pr-4 py-2 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border transition-all focus:outline-none focus:ring-2 ${
        hasError
          ? 'border-rose-400 text-rose-900 dark:text-rose-200 focus:ring-rose-200'
          : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-[#5B58DE] focus:ring-[#5B58DE]/20'
      }`}
    />
  );
};

