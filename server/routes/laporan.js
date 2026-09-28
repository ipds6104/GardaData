const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { google } = require('googleapis');

// Dual Storage Engine: MySQL with File-Based Fallback/Sync
const DATA_DIR = path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'laporan_store.json');
const SERVICE_ACCOUNT_KEY_FILE = path.join(__dirname, '../config/google-service-account.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get Google Sheets Client
function getGoogleSheetsClient() {
  if (!fs.existsSync(SERVICE_ACCOUNT_KEY_FILE)) {
    return null;
  }
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return google.sheets({ version: 'v4', auth });
  } catch (err) {
    console.error('Error initializing Google Sheets API Client:', err);
    return null;
  }
}

function extractSpreadsheetId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url.trim();
}

// 2-Way Write to Google Sheet via Google Sheets API v4
async function syncToGoogleSheetsAPI(sheetUrl, sheetName = 'Sheet1', recordData, action = 'UPSERT') {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return { success: false, reason: 'No service account key configured' };

  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  if (!spreadsheetId) return { success: false, reason: 'Invalid spreadsheet URL or ID' };

  try {
    const sName = sheetName || 'Sheet1';
    
    // 1. Read existing headers & data from Sheet
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sName}!A1:ZZ`
    });

    let rows = getRes.data.values || [];
    let headers = rows.length > 0 ? rows[0] : [];
    const dataObj = recordData.data || recordData;

    // Auto-append missing headers if header is empty or missing keys
    const keys = Object.keys(dataObj);
    let headersUpdated = false;
    keys.forEach(k => {
      if (k && !headers.includes(k)) {
        headers.push(k);
        headersUpdated = true;
      }
    });

    if (headersUpdated || rows.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sName}!A1:ZZ1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] }
      });
    }

    // 2. Find row index by matching ID / rowId (Col 1 or header match)
    const targetId = recordData.rowId || recordData.id || dataObj['id'] || dataObj['ID'];
    let targetRowIndex = -1;

    if (targetId && rows.length > 1) {
      for (let r = 1; r < rows.length; r++) {
        if (String(rows[r][0]) === String(targetId) || String(rows[r][1]) === String(targetId)) {
          targetRowIndex = r + 1; // 1-indexed for sheets
          break;
        }
      }
    }

    const rowValues = headers.map(h => {
      const val = dataObj[h] !== undefined ? dataObj[h] : '';
      return typeof val === 'object' ? JSON.stringify(val) : String(val);
    });

    if (targetRowIndex > 1) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sName}!A${targetRowIndex}:ZZ${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] }
      });
      return { success: true, action: 'UPDATED', row: targetRowIndex };
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sName}!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [rowValues] }
      });
      return { success: true, action: 'APPENDED' };
    }
  } catch (err) {
    console.error('Google Sheets API sync error:', err.message);
    return { success: false, error: err.message };
  }
}

// Initial Default Seed Data
const DEFAULT_ACTIVITIES = [
  {
    id: 'act_default_1',
    title: 'Survei Pendataan & Pengawasan Statistik Distribusi',
    description: 'Statistik Distribusi & Harga - Pengawasan Lapangan & Verifikasi',
    category: 'Statistik Distribusi & Harga',
    sheetUrl: '',
    sheetName: 'Sheet1',
    isOpen: true,
    icon: 'Layers',
    isPublished: true,
    publishedAt: new Date().toISOString(),
    version: 1,
    settings: {
      themeColor: '#0ea5e9',
      viewLayout: 'card_list',
      showBadges: true,
      compactMode: false,
      navMode: 'bottom_bar',
      syncFrequency: 'realtime',
      webhookUrl: '',
      enableGeofence: true,
      maxRadiusMeters: 250,
      lockOnSubmit: false,
      requireGPS: false,
      requirePhoto: false
    }
  }
];

const DEFAULT_FORMS = [
  {
    id: 'form_default_1',
    activityId: 'act_default_1',
    title: 'Formulir Pendataan Lapangan',
    icon: 'FileText',
    orderIndex: 0,
    sheetUrl: '',
    sheetName: 'Sheet1',
    groupingLevels: ['Nama PPL', 'Kecamatan', 'Desa', 'SLS / RT'],
    isPublished: true,
    publishedAt: new Date().toISOString(),
    version: 1,
    fields: [
      { id: 'f1', columnName: 'Nama PPL', label: 'Nama PPL', dataType: 'Enum', isKey: false, isLabel: true, isRequired: true, options: ['Dandy', 'Sefty Eca Putri', 'Rendi Pratama', 'Muhammad Irfan'] },
      { id: 'f2', columnName: 'Jabatan Petugas', label: 'Jabatan Petugas', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
      { id: 'f3', columnName: 'Kabupaten', label: 'Kabupaten / Kota', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
      { id: 'f4', columnName: 'Kecamatan', label: 'Kecamatan', dataType: 'Text', isKey: false, isLabel: true, isRequired: true, options: [] },
      { id: 'f5', columnName: 'Desa', label: 'Desa / Kelurahan', dataType: 'Text', isKey: false, isLabel: false, isRequired: false, options: [] },
      { id: 'f6', columnName: 'Lokasi GPS', label: 'Titik Lokasi GPS', dataType: 'LatLong', isKey: false, isLabel: false, isRequired: false, options: [] },
      { id: 'f7', columnName: 'Foto Lapangan', label: 'Foto Lapangan / Dokumen', dataType: 'Image', isKey: false, isLabel: false, isRequired: false, options: [] }
    ]
  }
];

// Helper to read JSON Store
function readStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf8');
      const data = JSON.parse(content);
      return {
        activities: Array.isArray(data.activities) ? data.activities : DEFAULT_ACTIVITIES,
        forms: Array.isArray(data.forms) ? data.forms : DEFAULT_FORMS,
        records: Array.isArray(data.records) ? data.records : []
      };
    }
  } catch (err) {
    console.error('Error reading laporan_store.json:', err);
  }
  return {
    activities: DEFAULT_ACTIVITIES,
    forms: DEFAULT_FORMS,
    records: []
  };
}

// Helper to write JSON Store
function writeStore(store) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing laporan_store.json:', err);
  }
}

// Helper to forward record data to Google Apps Script Webhook
function forwardToWebhook(webhookUrl, payload) {
  if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('http')) {
    return;
  }
  try {
    const postData = JSON.stringify(payload);
    const urlObj = new URL(webhookUrl);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 8000
    };

    const req = client.request(options, (res) => {
      res.on('data', () => {});
    });

    req.on('error', (e) => {
      console.warn('Webhook delivery error (non-fatal):', e.message);
    });

    req.write(postData);
    req.end();
  } catch (err) {
    console.warn('Failed to forward to webhook:', err.message);
  }
}

// -------------------------------------------------------------
// 0. GOOGLE SHEETS API STATUS & SERVICE ACCOUNT ENDPOINTS
// -------------------------------------------------------------

// GET /api/laporan/google-sheets/service-account-status
router.get('/google-sheets/service-account-status', (req, res) => {
  if (fs.existsSync(SERVICE_ACCOUNT_KEY_FILE)) {
    try {
      const keyData = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_FILE, 'utf8'));
      return res.json({
        configured: true,
        clientEmail: keyData.client_email,
        projectId: keyData.project_id
      });
    } catch (e) {
      return res.json({ configured: false, error: 'Invalid JSON file' });
    }
  }
  return res.json({ configured: false });
});

// POST /api/laporan/google-sheets/test-sync
router.post('/google-sheets/test-sync', async (req, res) => {
  const { sheetUrl, sheetName } = req.body;
  const result = await syncToGoogleSheetsAPI(sheetUrl, sheetName, {
    rowId: `test_${Date.now()}`,
    data: {
      'Status Uji': 'Google Sheets API v4 Terhubung Sukses!',
      'Waktu Sync': new Date().toLocaleString('id-ID')
    }
  }, 'UPSERT');

  res.json(result);
});

// -------------------------------------------------------------
// 1. ACTIVITIES ENDPOINTS (CRUD & LIVE TOGGLE)
// -------------------------------------------------------------

// GET /api/laporan/activities
router.get('/activities', (req, res) => {
  const store = readStore();
  res.json(store.activities);
});

// POST /api/laporan/activities
router.post('/activities', (req, res) => {
  const store = readStore();
  const newActivity = {
    id: req.body.id || `act_${Date.now()}`,
    title: req.body.title || 'Kegiatan Baru',
    description: req.body.description || '',
    category: req.body.category || 'Statistik Distribusi & Harga',
    sheetUrl: req.body.sheetUrl || '',
    sheetName: req.body.sheetName || 'Sheet1',
    isOpen: req.body.isOpen !== undefined ? req.body.isOpen : true,
    icon: req.body.icon || 'Layers',
    isPublished: req.body.isPublished || true,
    publishedAt: req.body.publishedAt || new Date().toISOString(),
    version: req.body.version || 1,
    settings: req.body.settings || {
      themeColor: '#0ea5e9',
      viewLayout: 'card_list',
      showBadges: true,
      compactMode: false,
      navMode: 'bottom_bar',
      syncFrequency: 'realtime',
      webhookUrl: '',
      enableGeofence: true,
      maxRadiusMeters: 250,
      lockOnSubmit: false,
      requireGPS: false,
      requirePhoto: false
    },
    createdAt: new Date().toISOString()
  };

  store.activities.push(newActivity);
  writeStore(store);
  res.status(201).json(newActivity);
});

// PUT /api/laporan/activities/:id
router.put('/activities/:id', (req, res) => {
  const store = readStore();
  const idx = store.activities.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  store.activities[idx] = {
    ...store.activities[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  writeStore(store);
  res.json(store.activities[idx]);
});

// PATCH /api/laporan/activities/:id/toggle-open
router.patch('/activities/:id/toggle-open', (req, res) => {
  const store = readStore();
  const idx = store.activities.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  store.activities[idx].isOpen = !store.activities[idx].isOpen;
  store.activities[idx].updatedAt = new Date().toISOString();

  writeStore(store);
  res.json({
    success: true,
    isOpen: store.activities[idx].isOpen,
    activity: store.activities[idx]
  });
});

// DELETE /api/laporan/activities/:id
router.delete('/activities/:id', (req, res) => {
  const store = readStore();
  store.activities = store.activities.filter(a => a.id !== req.params.id);
  store.forms = store.forms.filter(f => f.activityId !== req.params.id);
  store.records = store.records.filter(r => r.activityId !== req.params.id);

  writeStore(store);
  res.json({ success: true, message: 'Activity deleted' });
});

// -------------------------------------------------------------
// 2. FORMS ENDPOINTS (DRAFT & PUBLISH)
// -------------------------------------------------------------

// GET /api/laporan/activities/:actId/forms
router.get('/activities/:actId/forms', (req, res) => {
  const store = readStore();
  const forms = store.forms.filter(f => f.activityId === req.params.actId);
  res.json(forms);
});

// POST /api/laporan/activities/:actId/forms
router.post('/activities/:actId/forms', (req, res) => {
  const store = readStore();
  const newForm = {
    id: req.body.id || `form_${Date.now()}`,
    activityId: req.params.actId,
    title: req.body.title || 'Formulir Pendataan',
    icon: req.body.icon || 'FileText',
    orderIndex: req.body.orderIndex !== undefined ? req.body.orderIndex : store.forms.length,
    sheetUrl: req.body.sheetUrl || '',
    sheetName: req.body.sheetName || 'Sheet1',
    groupingLevels: Array.isArray(req.body.groupingLevels) ? req.body.groupingLevels : ['Nama PPL', 'Kecamatan', 'Desa', 'SLS / RT'],
    fields: Array.isArray(req.body.fields) ? req.body.fields : [],
    isPublished: req.body.isPublished || false,
    publishedAt: req.body.publishedAt || null,
    version: req.body.version || 1,
    createdAt: new Date().toISOString()
  };

  store.forms.push(newForm);
  writeStore(store);
  res.status(201).json(newForm);
});

// PUT /api/laporan/forms/:formId (Save Draft / Update Form Settings)
router.put('/forms/:formId', (req, res) => {
  const store = readStore();
  const idx = store.forms.findIndex(f => f.id === req.params.formId);
  if (idx === -1) {
    const createdForm = {
      id: req.params.formId,
      activityId: req.body.activityId || 'act_default_1',
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    store.forms.push(createdForm);
    writeStore(store);
    return res.json(createdForm);
  }

  store.forms[idx] = {
    ...store.forms[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  writeStore(store);
  res.json(store.forms[idx]);
});

// POST /api/laporan/forms/:formId/publish (PUBLISH CONFIGURATION TO PETUGAS)
router.post('/forms/:formId/publish', (req, res) => {
  const store = readStore();
  const idx = store.forms.findIndex(f => f.id === req.params.formId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Form not found' });
  }

  const currentForm = store.forms[idx];
  const newVersion = (currentForm.version || 1) + 1;
  const publishedTime = new Date().toISOString();

  store.forms[idx] = {
    ...currentForm,
    ...req.body,
    isPublished: true,
    publishedAt: publishedTime,
    version: newVersion,
    publishedSchema: JSON.parse(JSON.stringify(req.body.fields || currentForm.fields || [])),
    publishedGroupings: JSON.parse(JSON.stringify(req.body.groupingLevels || currentForm.groupingLevels || []))
  };

  // Also mark activity as published
  const actIdx = store.activities.findIndex(a => a.id === currentForm.activityId);
  if (actIdx !== -1) {
    store.activities[actIdx].isPublished = true;
    store.activities[actIdx].publishedAt = publishedTime;
    store.activities[actIdx].version = newVersion;
  }

  writeStore(store);
  res.json({
    success: true,
    message: `Formulir "${currentForm.title}" berhasil dipublish (Versi ${newVersion})!`,
    form: store.forms[idx]
  });
});

// DELETE /api/laporan/forms/:formId
router.delete('/forms/:formId', (req, res) => {
  const store = readStore();
  store.forms = store.forms.filter(f => f.id !== req.params.formId);
  store.records = store.records.filter(r => r.formId !== req.params.formId);

  writeStore(store);
  res.json({ success: true, message: 'Form deleted' });
});

// -------------------------------------------------------------
// 3. RECORDS ENDPOINTS (TRANSACTIONS & 2-WAY SYNC)
// -------------------------------------------------------------

// GET /api/laporan/forms/:formId/records
router.get('/forms/:formId/records', (req, res) => {
  const store = readStore();
  const records = store.records.filter(r => r.formId === req.params.formId);
  res.json(records);
});

// POST /api/laporan/forms/:formId/records (Create/Upsert Record + Google Sheets 2-Way Sync)
router.post('/forms/:formId/records', (req, res) => {
  const store = readStore();
  const recordData = req.body;
  const newId = recordData.id || `${req.params.formId}_rec_${Date.now()}`;

  const existingIdx = store.records.findIndex(r => r.id === newId);
  const formattedRecord = {
    ...recordData,
    id: newId,
    formId: req.params.formId,
    updatedAt: new Date().toISOString()
  };

  if (existingIdx !== -1) {
    store.records[existingIdx] = formattedRecord;
  } else {
    formattedRecord.createdAt = new Date().toISOString();
    store.records.unshift(formattedRecord);
  }

  writeStore(store);

  // Sync to Google Sheet (Method A: Google Sheets API v4, Method B: Webhook)
  const targetForm = store.forms.find(f => f.id === req.params.formId);
  const targetAct = targetForm ? store.activities.find(a => a.id === targetForm.activityId) : null;
  const sheetUrl = targetForm?.sheetUrl || targetAct?.sheetUrl;
  const sheetName = targetForm?.sheetName || targetAct?.sheetName || 'Sheet1';
  const webhookUrl = targetAct?.settings?.webhookUrl || targetAct?.webhookUrl;

  // 1. Google Sheets API v4 Automatic Sync
  if (sheetUrl) {
    syncToGoogleSheetsAPI(sheetUrl, sheetName, formattedRecord, 'UPSERT').catch(err => {
      console.warn('API sync warning:', err.message);
    });
  }

  // 2. Apps Script Webhook Fallback if configured
  if (webhookUrl) {
    forwardToWebhook(webhookUrl, {
      action: existingIdx !== -1 ? 'UPDATE' : 'CREATE',
      formId: req.params.formId,
      sheetName: sheetName,
      record: formattedRecord,
      timestamp: new Date().toISOString()
    });
  }

  res.status(201).json(formattedRecord);
});

// PUT /api/laporan/records/:recordId
router.put('/records/:recordId', (req, res) => {
  const store = readStore();
  const idx = store.records.findIndex(r => r.id === req.params.recordId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  store.records[idx] = {
    ...store.records[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  writeStore(store);

  const updatedRec = store.records[idx];
  const targetForm = store.forms.find(f => f.id === updatedRec.formId);
  const targetAct = targetForm ? store.activities.find(a => a.id === targetForm.activityId) : null;
  const sheetUrl = targetForm?.sheetUrl || targetAct?.sheetUrl;
  const sheetName = targetForm?.sheetName || targetAct?.sheetName || 'Sheet1';
  const webhookUrl = targetAct?.settings?.webhookUrl || targetAct?.webhookUrl;

  if (sheetUrl) {
    syncToGoogleSheetsAPI(sheetUrl, sheetName, updatedRec, 'UPDATE').catch(err => {
      console.warn('API sync warning:', err.message);
    });
  }

  if (webhookUrl) {
    forwardToWebhook(webhookUrl, {
      action: 'UPDATE',
      formId: updatedRec.formId,
      sheetName: sheetName,
      record: updatedRec,
      timestamp: new Date().toISOString()
    });
  }

  res.json(updatedRec);
});

// DELETE /api/laporan/records/:recordId
router.delete('/records/:recordId', (req, res) => {
  const store = readStore();
  const targetRec = store.records.find(r => r.id === req.params.recordId);
  store.records = store.records.filter(r => r.id !== req.params.recordId);

  writeStore(store);

  if (targetRec) {
    const targetForm = store.forms.find(f => f.id === targetRec.formId);
    const targetAct = targetForm ? store.activities.find(a => a.id === targetForm.activityId) : null;
    const webhookUrl = targetAct?.settings?.webhookUrl || targetAct?.webhookUrl;

    if (webhookUrl) {
      forwardToWebhook(webhookUrl, {
        action: 'DELETE',
        formId: targetRec.formId,
        sheetName: targetForm?.sheetName || 'Sheet1',
        record: targetRec,
        timestamp: new Date().toISOString()
      });
    }
  }

  res.json({ success: true, message: 'Record deleted' });
});

module.exports = router;

