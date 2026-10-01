/**
 * Laporan Cloud Service
 * Handles persistence and syncing of Laporan Kegiatan Activities, Forms, and Records
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

export async function getCloudActivities(): Promise<CloudActivity[]> {
  try {
    const raw = localStorage.getItem('garda_laporan_activities');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCloudActivity(activity: CloudActivity): Promise<void> {
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
    console.error('Failed to save cloud activity:', e);
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
}

export async function getCloudForms(activityId: string): Promise<CloudForm[]> {
  try {
    const raw = localStorage.getItem(`garda_laporan_forms_${activityId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCloudForm(form: CloudForm): Promise<void> {
  if (!form.activityId && !form.id) return;
  const actId = form.activityId || 'default';
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
    console.error('Failed to save cloud form:', e);
  }
}

export async function saveCloudFormsBatch(activityId: string, forms: CloudForm[]): Promise<void> {
  try {
    localStorage.setItem(`garda_laporan_forms_${activityId}`, JSON.stringify(forms));
  } catch (e) {
    console.error('Failed to batch save cloud forms:', e);
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
}

export async function getCloudRecords(formId: string): Promise<CloudRecord[]> {
  try {
    const raw = localStorage.getItem(`garda_laporan_records_${formId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCloudRecords(formId: string, records: CloudRecord[]): Promise<void> {
  try {
    localStorage.setItem(`garda_laporan_records_${formId}`, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save cloud records:', e);
  }
}
