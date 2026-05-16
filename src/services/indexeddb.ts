import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface MeasurementRecord {
  id: string; // unique offline id
  petugasId: string;
  petugasName: string;
  timestamp: number;
  geojson: any; // The polygon GeoJSON
  luasTapak: number; // m²
  jumlahLantai: number;
  jenisBangunan: string;
  perkiraanLuasLantai: number; // User input
  latitude: number;
  longitude: number;
  metodeDigitasi: 'manual' | 'auto_polygon';
  syncStatus: 'pending' | 'synced';
}

interface NavigasiDB extends DBSchema {
  measurements: {
    key: string;
    value: MeasurementRecord;
    indexes: { 'by-sync-status': string };
  };
}

let dbPromise: Promise<IDBPDatabase<NavigasiDB>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<NavigasiDB>('navigasi-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('measurements')) {
          const store = db.createObjectStore('measurements', { keyPath: 'id' });
          store.createIndex('by-sync-status', 'syncStatus');
        }
      },
    });
  }
  return dbPromise;
};

export const saveMeasurementOffline = async (data: MeasurementRecord) => {
  const db = await initDB();
  await db.put('measurements', data);
};

export const getPendingMeasurements = async (): Promise<MeasurementRecord[]> => {
  const db = await initDB();
  return db.getAllFromIndex('measurements', 'by-sync-status', 'pending');
};

export const markMeasurementAsSynced = async (id: string) => {
  const db = await initDB();
  const tx = db.transaction('measurements', 'readwrite');
  const store = tx.objectStore('measurements');
  const record = await store.get(id);
  if (record) {
    record.syncStatus = 'synced';
    await store.put(record);
  }
  await tx.done;
};

export const getAllMeasurementsLocal = async (): Promise<MeasurementRecord[]> => {
  const db = await initDB();
  return db.getAll('measurements');
};
