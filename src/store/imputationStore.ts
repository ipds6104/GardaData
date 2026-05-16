import { create } from 'zustand';
import { ImputationData } from '../types/imputation';

interface ImputationState {
  data: ImputationData[];
  recentSearches: string[];
  favorites: string[];
  isOffline: boolean;
  isLoading: boolean;
  setData: (data: ImputationData[]) => void;
  addRecentSearch: (query: string) => void;
  toggleFavorite: (id: string) => void;
  setOfflineStatus: (status: boolean) => void;
  setLoading: (status: boolean) => void;
}

export const useImputationStore = create<ImputationState>((set) => ({
  data: [],
  recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
  favorites: JSON.parse(localStorage.getItem('imputationFavorites') || '[]'),
  isOffline: !navigator.onLine,
  isLoading: false,
  
  setData: (data) => set({ data }),
  
  addRecentSearch: (query) => set((state) => {
    if (!query.trim()) return state;
    const newHistory = [query, ...state.recentSearches.filter(q => q !== query)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(newHistory));
    return { recentSearches: newHistory };
  }),
  
  toggleFavorite: (id) => set((state) => {
    const isFav = state.favorites.includes(id);
    const newFavorites = isFav ? state.favorites.filter(fav => fav !== id) : [...state.favorites, id];
    localStorage.setItem('imputationFavorites', JSON.stringify(newFavorites));
    return { favorites: newFavorites };
  }),
  
  setOfflineStatus: (status) => set({ isOffline: status }),
  setLoading: (status) => set({ isLoading: status }),
}));
