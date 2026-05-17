import { openDB, DBSchema } from 'idb';
import { db } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { ImputationData } from '../types/imputation';
import { DEFAULT_IMPUTATION_DATA } from '../data/imputationSeed';

interface ImputationDB extends DBSchema {
  imputation_cache: {
    key: string;
    value: ImputationData;
  };
}

const DB_NAME = 'garda_data_imputation';
const DB_VERSION = 1;

export const initImputationDB = async () => {
  return openDB<ImputationDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('imputation_cache')) {
        db.createObjectStore('imputation_cache', { keyPath: 'id' });
      }
    },
  });
};

export const syncImputationFromFirebase = async (): Promise<ImputationData[]> => {
  try {
    const token = localStorage.getItem('navigasi_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/imputations', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();
    
    // Auto seed if empty
    if (data.length === 0) {
      console.log("Database empty, seeding predefined data...");
      await batchUpsertImputationData(DEFAULT_IMPUTATION_DATA);
      data = DEFAULT_IMPUTATION_DATA;
    }

    // Save to local cache
    const localDb = await initImputationDB();
    const tx = localDb.transaction('imputation_cache', 'readwrite');
    await tx.objectStore('imputation_cache').clear();
    for (const item of data) {
      await tx.objectStore('imputation_cache').put(item);
    }
    await tx.done;
    
    return data;
  } catch (error) {
    console.error('Error syncing from API, falling back to local cache:', error);
    
    // Check if we already have cache
    const cached = await getLocalImputationData();
    if (cached.length > 0) {
      return cached;
    }

    // If cache is empty, seed IndexedDB with default data so the app works even offline
    console.log("IndexedDB empty, seeding with default seed data...");
    const localDb = await initImputationDB();
    const tx = localDb.transaction('imputation_cache', 'readwrite');
    for (const item of DEFAULT_IMPUTATION_DATA) {
      await tx.objectStore('imputation_cache').put(item);
    }
    await tx.done;
    return DEFAULT_IMPUTATION_DATA;
  }
};

export const getLocalImputationData = async (): Promise<ImputationData[]> => {
  try {
    const localDb = await initImputationDB();
    return await localDb.getAll('imputation_cache');
  } catch (error) {
    console.error('Failed to read from local DB', error);
    return [];
  }
};

export const batchUpsertImputationData = async (data: ImputationData[]): Promise<void> => {
  try {
    const token = localStorage.getItem('navigasi_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/imputations/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to batch upsert via API, falling back to local DB cache only:', error);
  }
};
