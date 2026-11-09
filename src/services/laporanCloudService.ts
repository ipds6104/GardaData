/**
 * Laporan Cloud Service
 * Dual-Persistence Engine: Realtime Firebase Firestore + Self-Hosted MySQL REST API + LocalStorage
 * Ensures instantaneous cloud sync across all devices with enterprise fallback.
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CloudActivity {
  id: string;
  [key: string]: any;
}

export interface CloudForm {
  id: string;
  activityId?: string;
  [key: string]: any;
}

export interface CloudRecord {
  id: string;
  formId?: string;
  activityId?: string;
  [key: string]: any;
}

const getBaseUrl = (): string => {
  try {
    return (import.meta as any).env?.VITE_API_URL || '';
  } catch {
    return '';
  }
};

const getAuthHeaders = (custom: Record<string, string> = {}): Record<string, string> => {
  const token = localStorage.getItem('navigasi_token') || localStorage.getItem('token');
  const headers: Record<string, string> = { ...custom };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// Helper: membersihkan objek dari properti undefined agar aman disimpan ke Firestore
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && typeof val !== 'function') {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
}

// ==========================================
// 1. ACTIVITIES PERSISTENCE (DUAL-WRITE)
// ==========================================

export async function getCloudActivities(): Promise<CloudActivity[]> {
  let activitiesFromFirestore: CloudActivity[] = [];
  
  // 1. Coba ambil dari Firebase Firestore (Realtime Cloud DB)
  try {
    const snap = await getDocs(collection(db, 'laporan_activities'));
    if (!snap.empty) {
      activitiesFromFirestore = snap.docs.map(d => ({ id: d.id, ...d.data() })) as CloudActivity[];
    }
  } catch (firestoreErr) {
    console.warn('Firebase Firestore activities fetch fallback:', firestoreErr);
  }

  // 2. Coba ambil dari Backend MySQL REST API (VPS Coolify)
  let activitiesFromMySQL: CloudActivity[] = [];
  try {
    const res = await fetch(`${getBaseUrl()}/api/laporan/activities?t=${Date.now()}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        activitiesFromMySQL = data;
      }
    }
  } catch (mysqlErr) {
    console.warn('Backend MySQL activities fetch fallback:', mysqlErr);
  }

  // 3. Gabungkan hasil (Merge: Firestore skema/setting + MySQL stats/records)
  if (activitiesFromFirestore.length > 0 || activitiesFromMySQL.length > 0) {
    const map = new Map<string, CloudActivity>();
    activitiesFromMySQL.forEach(a => map.set(a.id, a));
    activitiesFromFirestore.forEach(a => {
      const existing = map.get(a.id);
      map.set(a.id, existing ? { ...existing, ...a } : a);
    });
    const combined = Array.from(map.values());
    try {
      localStorage.setItem('garda_laporan_activities', JSON.stringify(combined));
    } catch {}
    return combined;
  }

  // 4. Fallback ke Local Storage jika offline
  try {
    const raw = localStorage.getItem('garda_laporan_activities');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCloudActivity(activity: CloudActivity): Promise<void> {
  if (!activity || !activity.id) return;
  const clean = sanitizeForFirestore(activity);

  // 1. Simpan ke Cache Lokal (Instan)
  try {
    const current = await getCloudActivities();
    const idx = current.findIndex(a => a.id === activity.id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...activity };
    } else {
      current.push(activity);
    }
    localStorage.setItem('garda_laporan_activities', JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save activity to local cache:', e);
  }

  // 2. DUAL-WRITE: Simpan ke Firebase Firestore (Realtime Cloud)
  try {
    await setDoc(doc(db, 'laporan_activities', activity.id), clean, { merge: true });
  } catch (firestoreErr) {
    console.warn('Firebase Firestore save activity warning:', firestoreErr);
  }

  // 3. DUAL-WRITE: Simpan ke Backend MySQL REST API (Server VPS Coolify)
  try {
    await fetch(`${getBaseUrl()}/api/laporan/activities/${activity.id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(activity)
    });
  } catch (mysqlErr) {
    console.warn('Backend MySQL save activity warning:', mysqlErr);
  }
}

export async function deleteCloudActivity(id: string): Promise<void> {
  if (!id) return;

  // 1. Hapus dari Local Storage
  try {
    const current = await getCloudActivities();
    const filtered = current.filter(a => a.id !== id);
    localStorage.setItem('garda_laporan_activities', JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete activity from local cache:', e);
  }

  // 2. DUAL-DELETE: Hapus dari Firebase Firestore
  try {
    await deleteDoc(doc(db, 'laporan_activities', id));
  } catch (firestoreErr) {
    console.warn('Firebase Firestore delete activity warning:', firestoreErr);
  }

  // 3. DUAL-DELETE: Hapus dari Backend MySQL REST API
  try {
    await fetch(`${getBaseUrl()}/api/laporan/activities/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (mysqlErr) {
    console.warn('Backend MySQL delete activity warning:', mysqlErr);
  }
}

// ==========================================
// 2. FORMS & SCHEMA PERSISTENCE (DUAL-WRITE)
// ==========================================

export async function getCloudForms(activityId: string): Promise<CloudForm[]> {
  if (!activityId) return [];

  let formsFromFirestore: CloudForm[] = [];
  // 1. Coba ambil dari Firebase Firestore
  try {
    const q = query(collection(db, 'laporan_forms'), where('activityId', '==', activityId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      formsFromFirestore = snap.docs.map(d => ({ id: d.id, ...d.data() })) as CloudForm[];
    }
  } catch (firestoreErr) {
    console.warn('Firebase Firestore forms fetch fallback:', firestoreErr);
  }

  // 2. Coba ambil dari Backend MySQL REST API
  let formsFromMySQL: CloudForm[] = [];
  try {
    const res = await fetch(`${getBaseUrl()}/api/laporan/activities/${activityId}/forms?t=${Date.now()}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        formsFromMySQL = data;
      }
    }
  } catch (mysqlErr) {
    console.warn('Backend MySQL forms fetch fallback:', mysqlErr);
  }

  // 3. Gabungkan hasil (Merge: Firestore skema/setting + MySQL stats/counts)
  if (formsFromFirestore.length > 0 || formsFromMySQL.length > 0) {
    const map = new Map<string, CloudForm>();
    formsFromMySQL.forEach(f => map.set(f.id, f));
    formsFromFirestore.forEach(f => {
      const existing = map.get(f.id);
      if (existing) {
        map.set(f.id, {
          ...existing,
          ...f,
          fields: (Array.isArray(f.fields) && f.fields.length > 0) ? f.fields : existing.fields,
          stats: existing.stats || f.stats
        });
      } else {
        map.set(f.id, f);
      }
    });

    const combined = Array.from(map.values()).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    try {
      localStorage.setItem(`garda_laporan_forms_${activityId}`, JSON.stringify(combined));
    } catch {}
    return combined;
  }

  // 4. Fallback ke Local Storage jika offline
  try {
    const raw = localStorage.getItem(`garda_laporan_forms_${activityId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCloudForm(form: CloudForm): Promise<void> {
  if (!form || !form.id) return;
  const actId = form.activityId || 'default';
  const clean = sanitizeForFirestore(form);

  // 1. Simpan ke Cache Lokal (Instan)
  try {
    const current = await getCloudForms(actId);
    const idx = current.findIndex(f => f.id === form.id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...form };
    } else {
      current.push(form);
    }
    localStorage.setItem(`garda_laporan_forms_${actId}`, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save cloud form to local cache:', e);
  }

  // 2. DUAL-WRITE: Simpan ke Firebase Firestore (Realtime Cloud DB)
  try {
    await setDoc(doc(db, 'laporan_forms', form.id), clean, { merge: true });
  } catch (firestoreErr) {
    console.warn('Firebase Firestore save form warning:', firestoreErr);
  }

  // 3. DUAL-WRITE: Simpan ke Backend MySQL REST API (Server VPS Coolify)
  try {
    await fetch(`${getBaseUrl()}/api/laporan/forms/${form.id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(form)
    });
  } catch (mysqlErr) {
    console.warn('Backend MySQL save form warning:', mysqlErr);
  }
}

export async function saveCloudFormsBatch(activityId: string, forms: CloudForm[]): Promise<void> {
  if (!Array.isArray(forms)) return;

  // 1. Simpan ke Cache Lokal
  try {
    localStorage.setItem(`garda_laporan_forms_${activityId}`, JSON.stringify(forms));
  } catch (e) {
    console.error('Failed to batch save forms to local cache:', e);
  }

  // 2. DUAL-WRITE: Simpan setiap formulir ke Firebase Firestore & MySQL
  for (const f of forms) {
    const formWithAct = { ...f, activityId };
    const clean = sanitizeForFirestore(formWithAct);

    // Firebase Firestore
    try {
      await setDoc(doc(db, 'laporan_forms', f.id), clean, { merge: true });
    } catch (firestoreErr) {
      console.warn('Firebase Firestore batch save warning:', f.id, firestoreErr);
    }

    // Backend MySQL REST API
    try {
      await fetch(`${getBaseUrl()}/api/laporan/forms/${f.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(formWithAct)
      });
    } catch (mysqlErr) {}
  }
}

export async function deleteCloudForm(activityId: string, formId: string): Promise<void> {
  if (!formId) return;

  // 1. Hapus dari Local Storage
  try {
    const current = await getCloudForms(activityId);
    const filtered = current.filter(f => f.id !== formId);
    localStorage.setItem(`garda_laporan_forms_${activityId}`, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete form from local cache:', e);
  }

  // 2. DUAL-DELETE: Hapus dari Firebase Firestore
  try {
    await deleteDoc(doc(db, 'laporan_forms', formId));
  } catch (firestoreErr) {
    console.warn('Firebase Firestore delete form warning:', firestoreErr);
  }

  // 3. DUAL-DELETE: Hapus dari Backend MySQL REST API
  try {
    await fetch(`${getBaseUrl()}/api/laporan/forms/${formId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (mysqlErr) {
    console.warn('Backend MySQL delete form warning:', mysqlErr);
  }
}

// ==========================================
// 3. RECORDS PERSISTENCE (SERVER-FIRST WITH MYSQL CHUNKING)
// ==========================================

// ---- Pending Sync Queue ----
// Key localStorage: garda_pending_sync_records
// Struktur: { formId, activityId, queuedAt }[]
// Catatan: antrian HANYA menyimpan referensi formId. Data record diambil dari cache
// `garda_laporan_records_${formId}` saat retry, agar tidak menggandakan data di localStorage (kuota ~5MB).
const PENDING_SYNC_KEY = 'garda_pending_sync_records';

// Server membatasi body JSON 2MB (backend/server.js) → kirim per chunk agar tidak ditolak (HTTP 413)
const RECORDS_CHUNK_SIZE = 200;

function enqueuePendingSync(formId: string, _records: CloudRecord[], activityId?: string): void {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    const queue: any[] = raw ? JSON.parse(raw) : [];
    // Hapus antrian lama untuk formId yang sama, lalu tambahkan yang baru
    const filtered = queue.filter((q: any) => q.formId !== formId);
    filtered.push({ formId, activityId, queuedAt: new Date().toISOString() });
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to enqueue pending sync:', e);
  }
}

/** Jumlah formulir yang masih menunggu sinkronisasi ke MySQL */
export function getPendingSyncCount(): number {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    return Array.isArray(queue) ? queue.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Kirim records ke MySQL per chunk. Endpoint /records/batch memakai UPSERT
 * (ON DUPLICATE KEY UPDATE), jadi aman diulang (idempotent) bila retry.
 */
async function postRecordsInChunks(formId: string, records: CloudRecord[], activityId?: string): Promise<{ ok: boolean; sent: number }> {
  let sent = 0;
  for (let i = 0; i < records.length; i += RECORDS_CHUNK_SIZE) {
    const chunk = records.slice(i, i + RECORDS_CHUNK_SIZE);
    let success = false;
    // Retry hingga 3x per chunk dengan jeda bertahap
    for (let attempt = 0; attempt < 3 && !success; attempt++) {
      try {
        const res = await fetch(`${getBaseUrl()}/api/laporan/forms/${formId}/records/batch`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ records: chunk, activityId })
        });
        if (res.ok) {
          success = true;
        } else if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
          // Error klien (mis. 401/403) tidak akan berhasil dengan retry
          return { ok: false, sent };
        }
      } catch (e) {
        // network error → retry
      }
      if (!success) await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }
    if (!success) return { ok: false, sent };
    sent += chunk.length;
  }
  return { ok: true, sent };
}

function dequeuePendingSync(formId: string): void {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw) return;
    const queue: any[] = JSON.parse(raw);
    const filtered = queue.filter((q: any) => q.formId !== formId);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
  } catch (e) {}
}

/**
 * Flush semua antrian pending sync ke MySQL backend.
 * Dipanggil saat koneksi kembali tersedia.
 * Returns: jumlah formId yang berhasil di-flush, dan daftar yang gagal.
 */
export async function flushPendingSyncQueue(): Promise<{ flushed: number; failed: string[] }> {
  let flushed = 0;
  const failed: string[] = [];
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw) return { flushed: 0, failed: [] };
    const queue: any[] = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return { flushed: 0, failed: [] };

    for (const item of queue) {
      try {
        // Ambil data terbaru dari cache lokal (kompatibel juga dengan format antrian lama yang menyimpan records)
        let records: CloudRecord[] = Array.isArray(item.records) ? item.records : [];
        if (records.length === 0) {
          const cached = localStorage.getItem(`garda_laporan_records_${item.formId}`);
          records = cached ? JSON.parse(cached) : [];
        }
        if (!Array.isArray(records) || records.length === 0) {
          dequeuePendingSync(item.formId);
          continue;
        }
        const result = await postRecordsInChunks(item.formId, records, item.activityId);
        if (result.ok) {
          dequeuePendingSync(item.formId);
          flushed++;
        } else {
          failed.push(item.formId);
        }
      } catch (e) {
        failed.push(item.formId);
      }
    }
  } catch (e) {
    console.warn('flushPendingSyncQueue error:', e);
  }
  return { flushed, failed };
}

export async function getCloudRecords(formId: string): Promise<CloudRecord[]> {
  if (!formId) return [];
  try {
    const res = await fetch(`${getBaseUrl()}/api/laporan/forms/${formId}/records?t=${Date.now()}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        localStorage.setItem(`garda_laporan_records_${formId}`, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn('Backend API for records offline, using local cache:', e);
  }

  try {
    const raw = localStorage.getItem(`garda_laporan_records_${formId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Simpan records ke localStorage + MySQL backend.
 * Jika backend gagal, data di-antri di pending queue dan akan di-retry
 * secara otomatis saat koneksi pulih (via flushPendingSyncQueue).
 * Returns: { savedToMySQL: boolean, pendingQueued: boolean }
 */
export async function saveCloudRecords(
  formId: string,
  records: CloudRecord[],
  activityId?: string
): Promise<{ savedToMySQL: boolean; pendingQueued: boolean }> {
  if (!formId) return { savedToMySQL: false, pendingQueued: false };

  // 1. Simpan ke localStorage (instan, selalu berhasil)
  try {
    localStorage.setItem(`garda_laporan_records_${formId}`, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save cloud records to cache:', e);
  }

  if (!Array.isArray(records) || records.length === 0) {
    return { savedToMySQL: true, pendingQueued: false };
  }

  // 2. Kirim ke MySQL Backend per chunk (dengan retry per chunk) + verifikasi response
  const result = await postRecordsInChunks(formId, records, activityId);
  if (result.ok) {
    // Berhasil → hapus dari antrian jika sebelumnya ada
    dequeuePendingSync(formId);
    return { savedToMySQL: true, pendingQueued: false };
  }

  // Gagal (offline / server error) → antri untuk retry otomatis
  enqueuePendingSync(formId, records, activityId);
  console.warn(`Backend save records gagal (${result.sent}/${records.length} terkirim) — diantrikan untuk retry`);
  return { savedToMySQL: false, pendingQueued: true };
}

export const saveCloudRecordsBatch = saveCloudRecords;
