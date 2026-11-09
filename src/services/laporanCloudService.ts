/**
 * Laporan Cloud Service
 * Handles persistence and syncing of Laporan Kegiatan Activities, Forms, and Records
 * across Backend MySQL REST API and Local Storage.
 */

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

export async function getCloudActivities(): Promise<CloudActivity[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/laporan/activities?t=${Date.now()}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('garda_laporan_activities', JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn('Backend API for activities offline, using local cache:', e);
  }

  try {
    const raw = localStorage.getItem('garda_laporan_activities');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCloudActivity(activity: CloudActivity): Promise<void> {
  // 1. Save local cache immediately
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
    console.error('Failed to save activity to cache:', e);
  }

  // 2. Persist to Backend REST API
  try {
    await fetch(`${getBaseUrl()}/api/laporan/activities/${activity.id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(activity)
    });
  } catch (e) {
    console.warn('Backend API save activity failed:', e);
  }
}

export async function deleteCloudActivity(id: string): Promise<void> {
  try {
    const current = await getCloudActivities();
    const filtered = current.filter(a => a.id !== id);
    localStorage.setItem('garda_laporan_activities', JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete cloud activity:', e);
  }

  try {
    await fetch(`${getBaseUrl()}/api/laporan/activities/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (e) {
    console.warn('Backend API delete activity failed:', e);
  }
}

export async function getCloudForms(activityId: string): Promise<CloudForm[]> {
  if (!activityId) return [];
  try {
    const res = await fetch(`${getBaseUrl()}/api/laporan/activities/${activityId}/forms?t=${Date.now()}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(`garda_laporan_forms_${activityId}`, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn('Backend API for forms offline, using local cache:', e);
  }

  try {
    const raw = localStorage.getItem(`garda_laporan_forms_${activityId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCloudForm(form: CloudForm): Promise<void> {
  if (!form.id) return;
  const actId = form.activityId || 'default';

  // 1. Save local cache
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
    console.error('Failed to save cloud form to cache:', e);
  }

  // 2. Persist to Backend REST API
  try {
    await fetch(`${getBaseUrl()}/api/laporan/forms/${form.id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(form)
    });
  } catch (e) {
    console.warn('Backend API save form failed:', e);
  }
}

export async function saveCloudFormsBatch(activityId: string, forms: CloudForm[]): Promise<void> {
  try {
    localStorage.setItem(`garda_laporan_forms_${activityId}`, JSON.stringify(forms));
  } catch (e) {
    console.error('Failed to batch save cloud forms to cache:', e);
  }

  for (const f of forms) {
    try {
      await fetch(`${getBaseUrl()}/api/laporan/forms/${f.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...f, activityId })
      });
    } catch (e) {}
  }
}

export async function deleteCloudForm(activityId: string, formId: string): Promise<void> {
  try {
    const current = await getCloudForms(activityId);
    const filtered = current.filter(f => f.id !== formId);
    localStorage.setItem(`garda_laporan_forms_${activityId}`, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete cloud form:', e);
  }

  try {
    await fetch(`${getBaseUrl()}/api/laporan/forms/${formId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (e) {
    console.warn('Backend API delete form failed:', e);
  }
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

export async function saveCloudRecords(formId: string, records: CloudRecord[], activityId?: string): Promise<void> {
  if (!formId) return;

  // 1. Save local cache
  try {
    localStorage.setItem(`garda_laporan_records_${formId}`, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save cloud records to cache:', e);
  }

  // 2. Persist to Backend REST API
  try {
    await fetch(`${getBaseUrl()}/api/laporan/forms/${formId}/records/batch`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ records, activityId })
    });
  } catch (e) {
    console.warn('Backend API save batch records failed:', e);
  }
}

export const saveCloudRecordsBatch = saveCloudRecords;
