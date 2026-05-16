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
    const snap = await getDocs(collection(db, 'imputation_data'));
    let data = snap.docs.map(doc => doc.data() as ImputationData);
    
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
    console.error('Error syncing from firebase, falling back to local cache:', error);
    return await getLocalImputationData();
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
  const batches = [];
  for (let i = 0; i < data.length; i += 500) {
    const batch = writeBatch(db);
    const chunk = data.slice(i, i + 500);
    for (const item of chunk) {
      const ref = doc(collection(db, 'imputation_data'), item.id);
      batch.set(ref, item, { merge: true });
    }
    batches.push(batch.commit());
  }
  await Promise.all(batches);
};
