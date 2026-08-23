import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemePreset = 'original' | 'greentea' | 'auntum' | 'notebook' | 'persik' | 'sky';

export interface PresetInfo {
  id: ThemePreset;
  name: string;
  description: string;
  font: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
}

export const PRESET_LIST: PresetInfo[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Desain orisinil Garda Data dengan nuansa warm orange & terracotta klasik',
    font: 'Inter & Outfit',
    colors: {
      primary: '#f17e3a',
      secondary: '#e29578',
      accent: '#f5e496',
      bg: '#f8fafc'
    }
  },
  {
    id: 'sky',
    name: 'Sky',
    description: 'Nuansa biru cerah dan profesional ala layanan kesehatan / rumah sakit',
    font: 'Plus Jakarta Sans',
    colors: {
      primary: '#007BFF',
      secondary: '#3B82F6',
      accent: '#93C5FD',
      bg: '#F8F9FA'
    }
  },
  {
    id: 'greentea',
    name: 'GreenTea',
    description: 'Nuansa teh hijau segar, mint cerah, dan toska modern yang menenangkan',
    font: 'Plus Jakarta Sans',
    colors: {
      primary: '#22c55e',
      secondary: '#14b8a6',
      accent: '#a3e635',
      bg: '#f4f8f5'
    }
  },
  {
    id: 'auntum',
    name: 'Auntum',
    description: 'Warna hangat musim gugur dengan nuansa karamel, tembaga, dan amber',
    font: 'Plus Jakarta Sans',
    colors: {
      primary: '#ea580c',
      secondary: '#d97706',
      accent: '#fbbf24',
      bg: '#fff9f2'
    }
  },
  {
    id: 'notebook',
    name: 'Notebook',
    description: 'Estetika pastel playful lembut (rose peach, soft lavender, mint sorbet)',
    font: 'Nunito (Rounded)',
    colors: {
      primary: '#f43f5e',
      secondary: '#3b82f6',
      accent: '#d946ef',
      bg: '#faf8f5'
    }
  },
  {
    id: 'persik',
    name: 'Persik',
    description: 'Kombinasi trendy modern electric violet lilac dengan sentuhan peach coral',
    font: 'Plus Jakarta Sans',
    colors: {
      primary: '#8b5cf6',
      secondary: '#f43f5e',
      accent: '#a855f7',
      bg: '#faf7ff'
    }
  }
];

interface ThemeContextType {

  preset: ThemePreset;
  setPreset: (preset: ThemePreset) => void;
  presetInfo: PresetInfo;
}

const ThemeContext = createContext<ThemeContextType>({
  preset: 'original',
  setPreset: () => {},
  presetInfo: PRESET_LIST[0]
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preset, setPresetState] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('garda_theme_preset') as ThemePreset;
    if (saved && ['original', 'greentea', 'auntum', 'notebook', 'persik'].includes(saved)) {
      return saved;
    }
    return 'original';
  });

  const setPreset = (newPreset: ThemePreset) => {
    setPresetState(newPreset);
    localStorage.setItem('garda_theme_preset', newPreset);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preset);
  }, [preset]);

  const presetInfo = PRESET_LIST.find(p => p.id === preset) || PRESET_LIST[0];

  return (
    <ThemeContext.Provider value={{ preset, setPreset, presetInfo }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
