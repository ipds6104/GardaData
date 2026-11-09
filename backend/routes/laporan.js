const express = require('express');
const router = express.Router();
const pool = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { recordTableRevision } = require('../services/backupService');
const ExcelJS = require('exceljs');
const { 
  parseGoogleSheetUrl, 
  parseCsvRows, 
  inferHeaderDataType, 
  fetchSheetData, 
  pushRecordToGoogleSheet 
} = require('../services/googleSheetsSync');

// ==========================================
// KONFIGURASI MULTER UPLOAD BERKAS
// ==========================================
const uploadDir = path.join(__dirname, '../uploads/laporan');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${cleanName}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // Batas 25MB per berkas
});

// Helper URL parser Google Sheet
function getSheetCsvUrl(url, sheetName = '') {
  try {
    const urlObj = new URL(url);
    const pathnameParts = urlObj.pathname.split('/');
    const dIndex = pathnameParts.indexOf('d');
    if (dIndex === -1 || dIndex + 1 >= pathnameParts.length) return null;
    const documentId = pathnameParts[dIndex + 1];

    if (sheetName && sheetName.trim() !== '') {
      return `https://docs.google.com/spreadsheets/d/${documentId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName.trim())}`;
    }

    let gid = '0';
    if (urlObj.searchParams.has('gid')) {
      gid = urlObj.searchParams.get('gid');
    } else if (urlObj.hash && urlObj.hash.includes('gid=')) {
      gid = urlObj.hash.split('gid=')[1].split('&')[0];
    }
    return `https://docs.google.com/spreadsheets/d/${documentId}/export?format=csv&gid=${gid}`;
  } catch (e) {
    return null;
  }
}

// Parser CSV Handal (RFC-compliant)
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let curVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        curVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(curVal.trim());
      curVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(curVal.trim());
      if (row.some(c => c !== '')) {
        lines.push(row);
      }
      row = [];
      curVal = '';
    } else {
      curVal += char;
    }
  }

  if (curVal !== '' || row.length > 0) {
    row.push(curVal.trim());
    if (row.some(c => c !== '')) {
      lines.push(row);
    }
  }

  return lines;
}

// ==========================================
// 1. KEGIATAN (ACTIVITIES)
// ==========================================

// GET all activities
router.get('/activities', async (req, res) => {
  try {
    const [activities] = await pool.query('SELECT * FROM laporan_activities ORDER BY createdAt DESC');
    
    // Sertakan jumlah form, pengaturan, & rekapitulasi data per kegiatan
    for (const act of activities) {
      act.isOpen = Boolean(act.isOpen);
      if (typeof act.settings === 'string') {
        try { act.settings = JSON.parse(act.settings); } catch (e) { act.settings = {}; }
      } else if (!act.settings) {
        act.settings = {};
      }

      const [forms] = await pool.query('SELECT id, title, icon, orderIndex, sheetName, sheetUrl FROM laporan_forms WHERE activityId = ? ORDER BY orderIndex ASC', [act.id]);
      act.forms = forms;

      const [recStats] = await pool.query(
        `SELECT 
           COUNT(*) as totalRecords,
           SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as totalDraft,
           SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as totalSubmitted
         FROM laporan_records WHERE activityId = ?`,
        [act.id]
      );
      act.stats = recStats[0] || { totalRecords: 0, totalDraft: 0, totalSubmitted: 0 };
    }

    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Gagal mengambil data kegiatan' });
  }
});

// POST create activity
router.post('/activities', async (req, res) => {
  try {
    const { id: customId, title, description, category, startDate, endDate, isOpen, icon, sheetUrl, sheetName, webhookUrl, settings } = req.body;
    if (!title) return res.status(400).json({ error: 'Judul kegiatan wajib diisi' });

    const id = customId || `act_${Date.now()}`;
    const cleanDesc = description || category || '';
    const stringifiedSettings = settings ? (typeof settings === 'string' ? settings : JSON.stringify(settings)) : null;

    await pool.query(
      `INSERT INTO laporan_activities (id, title, description, category, startDate, endDate, isOpen, icon, sheetUrl, sheetName, settings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         description = VALUES(description),
         category = VALUES(category),
         startDate = VALUES(startDate),
         endDate = VALUES(endDate),
         isOpen = VALUES(isOpen),
         icon = VALUES(icon),
         sheetUrl = VALUES(sheetUrl),
         sheetName = VALUES(sheetName),
         settings = VALUES(settings)`,
      [
        id, 
        title, 
        cleanDesc, 
        category || '', 
        startDate || null, 
        endDate || null, 
        isOpen !== false, 
        icon || 'Layers',
        sheetUrl ? sheetUrl.trim() : '',
        sheetName ? sheetName.trim() : 'Sheet1',
        stringifiedSettings
      ]
    );

    let createdFormId = null;
    // Jika sheetUrl disertakan, otomatis buat formulir default yang terhubung ke Google Sheet
    if (sheetUrl && sheetUrl.trim() !== '') {
      createdFormId = `form_${Date.now()}`;
      await pool.query(
        `INSERT INTO laporan_forms (id, activityId, title, icon, orderIndex, sheetUrl, sheetName, webhookUrl, groupingLevels)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          createdFormId,
          id,
          title,
          icon || 'FileSpreadsheet',
          0,
          sheetUrl.trim(),
          sheetName ? sheetName.trim() : 'Sheet1',
          webhookUrl ? webhookUrl.trim() : '',
          JSON.stringify([])
        ]
      );
    }

    res.status(201).json({ 
      id, 
      formId: createdFormId,
      message: 'Kegiatan berhasil disimpan' 
    });
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Gagal membuat kegiatan' });
  }
});

// PUT update activity
router.put('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, startDate, endDate, isOpen, icon, sheetUrl, sheetName, settings } = req.body;
    const stringifiedSettings = settings ? (typeof settings === 'string' ? settings : JSON.stringify(settings)) : null;

    await pool.query(
      `INSERT INTO laporan_activities (id, title, description, category, startDate, endDate, isOpen, icon, sheetUrl, sheetName, settings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         title = COALESCE(VALUES(title), title),
         description = COALESCE(VALUES(description), description),
         category = COALESCE(VALUES(category), category),
         startDate = VALUES(startDate),
         endDate = VALUES(endDate),
         isOpen = COALESCE(VALUES(isOpen), isOpen),
         icon = COALESCE(VALUES(icon), icon),
         sheetUrl = COALESCE(VALUES(sheetUrl), sheetUrl),
         sheetName = COALESCE(VALUES(sheetName), sheetName),
         settings = COALESCE(VALUES(settings), settings)`,
      [
        id, 
        title || 'Kegiatan', 
        description || category || '', 
        category || '',
        startDate || null, 
        endDate || null, 
        isOpen !== undefined ? (isOpen ? 1 : 0) : 1, 
        icon || 'Layers',
        sheetUrl || '',
        sheetName || 'Sheet1',
        stringifiedSettings
      ]
    );

    res.json({ message: 'Kegiatan berhasil diperbarui' });
  } catch (err) {
    console.error('Error updating activity:', err);
    res.status(500).json({ error: 'Gagal memperbarui kegiatan' });
  }
});

// DELETE activity
router.delete('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM laporan_records WHERE activityId = ?', [id]);
    await pool.query('DELETE FROM laporan_fields WHERE formId IN (SELECT id FROM laporan_forms WHERE activityId = ?)', [id]);
    await pool.query('DELETE FROM laporan_forms WHERE activityId = ?', [id]);
    await pool.query('DELETE FROM laporan_activities WHERE id = ?', [id]);
    res.json({ message: 'Kegiatan berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting activity:', err);
    res.status(500).json({ error: 'Gagal menghapus kegiatan' });
  }
});

// ==========================================
// 2. FORMULIR (FORMS)
// ==========================================

// GET forms for an activity
router.get('/activities/:actId/forms', async (req, res) => {
  try {
    const { actId } = req.params;
    const [forms] = await pool.query('SELECT * FROM laporan_forms WHERE activityId = ? ORDER BY orderIndex ASC', [actId]);

    for (const f of forms) {
      if (typeof f.groupingLevels === 'string') {
        try { f.groupingLevels = JSON.parse(f.groupingLevels); } catch (e) { f.groupingLevels = []; }
      } else if (!f.groupingLevels) {
        f.groupingLevels = [];
      }

      if (typeof f.settings === 'string') {
        try { f.settings = JSON.parse(f.settings); } catch (e) { f.settings = {}; }
      } else if (!f.settings) {
        f.settings = {};
      }

      let parsedFields = [];
      if (typeof f.fields === 'string') {
        try { parsedFields = JSON.parse(f.fields); } catch (e) { parsedFields = []; }
      } else if (Array.isArray(f.fields)) {
        parsedFields = f.fields;
      }

      const [fields] = await pool.query('SELECT * FROM laporan_fields WHERE formId = ? ORDER BY orderIndex ASC', [f.id]);
      if (fields && fields.length > 0) {
        f.fields = fields.map(field => {
          let opts = [];
          try {
            opts = typeof field.options === 'string' ? JSON.parse(field.options) : (field.options || []);
          } catch(e) {}
          return {
            ...field,
            isRequired: Boolean(field.isRequired),
            isKey: Boolean(field.isKey),
            isLabel: Boolean(field.isLabel),
            isEditable: field.isEditable !== undefined ? Boolean(field.isEditable) : true,
            options: opts
          };
        });
      } else {
        f.fields = parsedFields;
      }

      const [stats] = await pool.query(
        `SELECT 
           COUNT(*) as totalRecords,
           SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as totalDraft,
           SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as totalSubmitted
         FROM laporan_records WHERE formId = ?`,
        [f.id]
      );
      f.stats = stats[0] || { totalRecords: 0, totalDraft: 0, totalSubmitted: 0 };
    }

    res.json(forms);
  } catch (err) {
    console.error('Error fetching forms:', err);
    res.status(500).json({ error: 'Gagal mengambil formulir' });
  }
});

// GET single form by ID
router.get('/forms/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const [forms] = await pool.query('SELECT * FROM laporan_forms WHERE id = ?', [formId]);
    if (!forms || forms.length === 0) {
      return res.status(404).json({ error: 'Formulir tidak ditemukan' });
    }

    const form = forms[0];
    try {
      form.groupingLevels = typeof form.groupingLevels === 'string' ? JSON.parse(form.groupingLevels) : (form.groupingLevels || []);
    } catch(e) {
      form.groupingLevels = [];
    }

    try {
      form.settings = typeof form.settings === 'string' ? JSON.parse(form.settings) : (form.settings || {});
    } catch(e) {
      form.settings = {};
    }

    let parsedFields = [];
    try {
      parsedFields = typeof form.fields === 'string' ? JSON.parse(form.fields) : (form.fields || []);
    } catch(e) {
      parsedFields = [];
    }

    const [fields] = await pool.query('SELECT * FROM laporan_fields WHERE formId = ? ORDER BY orderIndex ASC', [formId]);
    if (fields && fields.length > 0) {
      form.fields = fields.map(field => {
        let opts = [];
        try {
          opts = typeof field.options === 'string' ? JSON.parse(field.options) : (field.options || []);
        } catch(e) {}
        return {
          ...field,
          isRequired: Boolean(field.isRequired),
          isKey: Boolean(field.isKey),
          isLabel: Boolean(field.isLabel),
          isEditable: field.isEditable !== undefined ? Boolean(field.isEditable) : true,
          options: opts
        };
      });
    } else {
      form.fields = parsedFields;
    }

    res.json(form);
  } catch (err) {
    console.error('Error fetching single form:', err);
    res.status(500).json({ error: 'Gagal mengambil data formulir' });
  }
});

// POST create form in activity
router.post('/activities/:actId/forms', async (req, res) => {
  try {
    const { actId } = req.params;
    const { id: customId, title, icon, orderIndex, sheetUrl, sheetName, webhookUrl, groupingLevels, settings, fields } = req.body;
    if (!title) return res.status(400).json({ error: 'Judul form wajib diisi' });

    const id = customId || `form_${Date.now()}`;
    const stringifiedGrouping = groupingLevels ? JSON.stringify(groupingLevels) : JSON.stringify([]);
    const stringifiedSettings = settings ? (typeof settings === 'string' ? settings : JSON.stringify(settings)) : null;
    const stringifiedFields = fields ? (typeof fields === 'string' ? fields : JSON.stringify(fields)) : null;

    await pool.query(
      `INSERT INTO laporan_forms (id, activityId, title, icon, orderIndex, sheetUrl, sheetName, webhookUrl, groupingLevels, settings, fields)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         icon = VALUES(icon),
         orderIndex = VALUES(orderIndex),
         sheetUrl = VALUES(sheetUrl),
         sheetName = VALUES(sheetName),
         webhookUrl = VALUES(webhookUrl),
         groupingLevels = VALUES(groupingLevels),
         settings = VALUES(settings),
         fields = VALUES(fields)`,
      [
        id, 
        actId, 
        title, 
        icon || 'FileText', 
        orderIndex || 0, 
        sheetUrl || '', 
        sheetName || '', 
        webhookUrl || '', 
        stringifiedGrouping,
        stringifiedSettings,
        stringifiedFields
      ]
    );

    if (Array.isArray(fields) && fields.length > 0) {
      await pool.query('DELETE FROM laporan_fields WHERE formId = ?', [id]);
      for (let i = 0; i < fields.length; i++) {
        const fld = fields[i];
        const fieldId = fld.id || `fld_${Date.now()}_${i}`;
        await pool.query(
          `INSERT INTO laporan_fields (id, formId, label, columnName, dataType, isRequired, groupSection, orderIndex, options, isKey, isLabel, isEditable)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fieldId,
            id,
            fld.label || fld.columnName || `Kolom ${i+1}`,
            fld.columnName || fld.label || `kolom_${i+1}`,
            fld.dataType || 'Text',
            fld.isRequired ? 1 : 0,
            fld.groupSection || '',
            i,
            JSON.stringify(fld.options || []),
            fld.isKey ? 1 : 0,
            fld.isLabel ? 1 : 0,
            fld.isEditable !== undefined ? (fld.isEditable ? 1 : 0) : 1
          ]
        );
      }
    }

    res.status(201).json({ id, message: 'Formulir berhasil ditambahkan' });
  } catch (err) {
    console.error('Error creating form:', err);
    res.status(500).json({ error: 'Gagal menambahkan formulir' });
  }
});

// PUT update form
router.put('/forms/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const { activityId, title, icon, orderIndex, sheetUrl, sheetName, webhookUrl, groupingLevels, settings, fields } = req.body;

    const stringifiedGrouping = groupingLevels ? JSON.stringify(groupingLevels) : JSON.stringify([]);
    const stringifiedSettings = settings ? (typeof settings === 'string' ? settings : JSON.stringify(settings)) : null;
    const stringifiedFields = fields ? (typeof fields === 'string' ? fields : JSON.stringify(fields)) : null;

    // 1. Upsert form ke laporan_forms
    await pool.query(
      `INSERT INTO laporan_forms (id, activityId, title, icon, orderIndex, sheetUrl, sheetName, webhookUrl, groupingLevels, settings, fields)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = COALESCE(VALUES(title), title),
         icon = COALESCE(VALUES(icon), icon),
         orderIndex = COALESCE(VALUES(orderIndex), orderIndex),
         sheetUrl = COALESCE(VALUES(sheetUrl), sheetUrl),
         sheetName = COALESCE(VALUES(sheetName), sheetName),
         webhookUrl = COALESCE(VALUES(webhookUrl), webhookUrl),
         groupingLevels = COALESCE(VALUES(groupingLevels), groupingLevels),
         settings = COALESCE(VALUES(settings), settings),
         fields = COALESCE(VALUES(fields), fields)`,
      [
        formId,
        activityId || '',
        title || 'Formulir',
        icon || 'FileText',
        orderIndex || 0,
        sheetUrl || '',
        sheetName || 'Sheet1',
        webhookUrl || '',
        stringifiedGrouping,
        stringifiedSettings,
        stringifiedFields
      ]
    );

    // 2. Sinkronkan ke tabel laporan_fields jika fields array disertakan
    if (Array.isArray(fields) && fields.length > 0) {
      await pool.query('DELETE FROM laporan_fields WHERE formId = ?', [formId]);
      for (let i = 0; i < fields.length; i++) {
        const fld = fields[i];
        const fieldId = fld.id || `fld_${Date.now()}_${i}`;
        await pool.query(
          `INSERT INTO laporan_fields (id, formId, label, columnName, dataType, isRequired, groupSection, orderIndex, options, isKey, isLabel, isEditable)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fieldId,
            formId,
            fld.label || fld.columnName || `Kolom ${i+1}`,
            fld.columnName || fld.label || `kolom_${i+1}`,
            fld.dataType || 'Text',
            fld.isRequired ? 1 : 0,
            fld.groupSection || '',
            i,
            JSON.stringify(fld.options || []),
            fld.isKey ? 1 : 0,
            fld.isLabel ? 1 : 0,
            fld.isEditable !== undefined ? (fld.isEditable ? 1 : 0) : 1
          ]
        );
      }
    }

    res.json({ message: 'Formulir dan pertanyaan berhasil diperbarui' });
  } catch (err) {
    console.error('Error updating form:', err);
    res.status(500).json({ error: 'Gagal memperbarui formulir' });
  }
});

// DELETE form
router.delete('/forms/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    await pool.query('DELETE FROM laporan_records WHERE formId = ?', [formId]);
    await pool.query('DELETE FROM laporan_fields WHERE formId = ?', [formId]);
    await pool.query('DELETE FROM laporan_forms WHERE id = ?', [formId]);
    res.json({ message: 'Formulir berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting form:', err);
    res.status(500).json({ error: 'Gagal menghapus formulir' });
  }
});

// ==========================================
// 3. PERTANYAAN / FIELDS
// ==========================================

// GET fields of a form
router.get('/forms/:formId/fields', async (req, res) => {
  try {
    const { formId } = req.params;
    const [fields] = await pool.query('SELECT * FROM laporan_fields WHERE formId = ? ORDER BY orderIndex ASC', [formId]);
    res.json(fields.map(f => ({ ...f, isRequired: Boolean(f.isRequired) })));
  } catch (err) {
    console.error('Error fetching fields:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar pertanyaan' });
  }
});

// POST batch save/replace fields of a form
router.post('/forms/:formId/fields', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { formId } = req.params;
    const { fields } = req.body; // Array of field objects

    if (!Array.isArray(fields)) {
      connection.release();
      return res.status(400).json({ error: 'Format fields harus berupa array' });
    }

    // Hapus fields lama
    await connection.query('DELETE FROM laporan_fields WHERE formId = ?', [formId]);

    // Masukkan fields baru
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const id = f.id || `fld_${Date.now()}_${i}`;
      await connection.query(
        `INSERT INTO laporan_fields (id, formId, label, columnName, dataType, isRequired, groupSection, orderIndex, options)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          formId,
          f.label || f.columnName || 'Pertanyaan',
          f.columnName || f.label || `kolom_${i+1}`,
          f.dataType || 'teks',
          f.isRequired ? 1 : 0,
          f.groupSection || '',
          i,
          JSON.stringify(f.options || [])
        ]
      );
    }

    await connection.commit();
    connection.release();

    res.json({ message: 'Daftar pertanyaan berhasil disimpan', count: fields.length });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error saving fields:', err);
    res.status(500).json({ error: 'Gagal menyimpan pertanyaan' });
  }
});

// ==========================================
// 4. DOWNLOAD TEMPLATE EXCEL
// ==========================================

router.get('/forms/:formId/template-excel', async (req, res) => {
  try {
    const { formId } = req.params;
    const [forms] = await pool.query('SELECT * FROM laporan_forms WHERE id = ?', [formId]);
    if (forms.length === 0) return res.status(404).json({ error: 'Formulir tidak ditemukan' });
    const form = forms[0];

    const [fields] = await pool.query('SELECT * FROM laporan_fields WHERE formId = ? ORDER BY orderIndex ASC', [formId]);
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Formulir belum memiliki pertanyaan. Silakan buat pertanyaan terlebih dahulu.' });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Garda Data - BPS Mempawah';
    const worksheet = workbook.addWorksheet(form.title.slice(0, 31) || 'Database Form');

    // Buat kolom header dari fields
    const columns = [];
    const sampleRow = {};

    fields.forEach(field => {
      const colName = field.columnName || field.label;
      columns.push({
        header: colName,
        key: colName,
        width: Math.max(colName.length + 4, 18)
      });

      // Berikan nilai sampel berdasarkan jenis data
      switch (field.dataType) {
        case 'angka':
          sampleRow[colName] = 1;
          break;
        case 'tanggal':
          sampleRow[colName] = new Date().toISOString().split('T')[0];
          break;
        case 'jam':
          sampleRow[colName] = '08:30';
          break;
        case 'lokasi':
          sampleRow[colName] = '-0.0245, 109.1234';
          break;
        case 'file':
          sampleRow[colName] = 'https://gardadata.dvlpid.my.id/uploads/laporan/contoh.jpg';
          break;
        default:
          sampleRow[colName] = field.columnName.toLowerCase().includes('id') ? '1' : 'Contoh Isian';
      }
    });

    worksheet.columns = columns;

    // Styling Header
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E7FF' } // Indigo soft
      };
      cell.font = {
        bold: true,
        color: { argb: 'FF1E1B4B' },
        size: 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF6366F1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Tambahkan 1 baris contoh
    worksheet.addRow(sampleRow);
    const dataRow = worksheet.getRow(2);
    dataRow.eachCell(cell => {
      cell.alignment = { vertical: 'middle' };
      cell.font = { color: { argb: 'FF64748B' }, italic: true };
    });

    const cleanTitle = (form.title || 'Form').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Template_${cleanTitle}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating excel template:', err);
    res.status(500).json({ error: 'Gagal membuat template excel' });
  }
});

// ==========================================
// 5. SYNC GOOGLE SHEET KE DATABASE (PREDEFINED DATA)
// ==========================================

router.post('/forms/:formId/sync-sheet', async (req, res) => {
  try {
    const { formId } = req.params;
    const { maxRows = 50000, schemaOnly = false, sheetUrl: reqSheetUrl, sheetName: reqSheetName, activityId: reqActivityId } = req.body || {};

    let [forms] = await pool.query('SELECT * FROM laporan_forms WHERE id = ?', [formId]);
    let form = forms.length > 0 ? forms[0] : null;

    const effectiveSheetUrl = reqSheetUrl || (form && form.sheetUrl) || '';
    const effectiveSheetName = reqSheetName || (form && form.sheetName) || 'Sheet1';
    const effectiveActId = reqActivityId || (form && form.activityId) || '';

    if (!effectiveSheetUrl) {
      return res.status(400).json({ error: 'Tautan Google Sheet belum dikonfigurasi pada form ini.' });
    }

    if (!form) {
      await pool.query(
        `INSERT INTO laporan_forms (id, activityId, title, icon, orderIndex, sheetUrl, sheetName, groupingLevels)
         VALUES (?, ?, 'Formulir Google Sheet', 'FileSpreadsheet', 0, ?, ?, '[]')`,
        [formId, effectiveActId, effectiveSheetUrl, effectiveSheetName]
      );
      form = { id: formId, activityId: effectiveActId, sheetUrl: effectiveSheetUrl, sheetName: effectiveSheetName };
    } else if (reqSheetUrl && reqSheetUrl !== form.sheetUrl) {
      await pool.query('UPDATE laporan_forms SET sheetUrl = ?, sheetName = ? WHERE id = ?', [effectiveSheetUrl, effectiveSheetName, formId]);
      form.sheetUrl = effectiveSheetUrl;
      form.sheetName = effectiveSheetName;
    }

    // Gunakan Master Sync Engine dengan proteksi Big Data
    const sheetResult = await fetchSheetData(effectiveSheetUrl, effectiveSheetName, { 
      maxRows: Number(maxRows) || 50000, 
      schemaOnly: Boolean(schemaOnly) 
    });

    const { headers, schema, records, totalRows, totalAvailableRows, isTruncated } = sheetResult;

    if (headers.length === 0) {
      return res.status(400).json({ error: 'Google Sheet tidak memiliki header kolom yang valid.' });
    }

    // Simpan skema fields ke tabel laporan_fields dan laporan_forms.fields
    await pool.query('UPDATE laporan_forms SET fields = ? WHERE id = ?', [JSON.stringify(schema), formId]);

    // 1. Auto-discover & buat field jika belum ada
    const [existingFields] = await pool.query('SELECT COUNT(*) as count FROM laporan_fields WHERE formId = ?', [formId]);
    if (existingFields[0].count === 0 && schema.length > 0) {
      for (let hIdx = 0; hIdx < schema.length; hIdx++) {
        const item = schema[hIdx];
        const fieldId = `fld_${Date.now()}_${hIdx}`;
        await pool.query(
          `INSERT INTO laporan_fields (id, formId, label, columnName, dataType, isRequired, groupSection, orderIndex, options)
           VALUES (?, ?, ?, ?, ?, 0, '', ?, ?)`,
          [fieldId, formId, item.label, item.columnName, item.dataType, hIdx, JSON.stringify(item.options || [])]
        );
      }
    }

    if (schemaOnly || records.length === 0) {
      return res.json({
        success: true,
        message: `Skema kolom berhasil dibaca (${headers.length} kolom ditemukan).`,
        schema,
        fields: schema,
        headers,
        totalRows: 0,
        importedCount: 0,
        updatedCount: 0
      });
    }

    // 2. Batch Processing ke Database Lokal Garda Data (Chunking 250 per batch untuk efisiensi tinggi)
    let importedCount = 0;
    let updatedCount = 0;

    // Ambil daftar record yang sudah ada di database lokal untuk form ini
    const [existingRows] = await pool.query('SELECT id, data FROM laporan_records WHERE formId = ?', [formId]);
    const existingMap = new Map();
    existingRows.forEach(r => {
      let d = {};
      try { d = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {}); } catch(e) { d = {}; }
      existingMap.set(r.id, d);
    });

    const chunkSize = 250;
    for (let c = 0; c < records.length; c += chunkSize) {
      const chunk = records.slice(c, c + chunkSize);
      
      for (const rec of chunk) {
        const recordData = rec.data;
        const rowId = rec.rowId;
        const recordId = `${formId}_${rowId}`;

        let lat = null;
        let lng = null;
        if (recordData['Latitude'] || recordData['latitude']) {
          lat = parseFloat(recordData['Latitude'] || recordData['latitude']) || null;
        }
        if (recordData['Longitude'] || recordData['longitude']) {
          lng = parseFloat(recordData['Longitude'] || recordData['longitude']) || null;
        }

        if (existingMap.has(recordId)) {
          const mergedData = { ...existingMap.get(recordId), ...recordData };
          await pool.query(
            `UPDATE laporan_records 
             SET data = ?, 
                 latitude = COALESCE(?, latitude), 
                 longitude = COALESCE(?, longitude),
                 syncStatus = 'synced'
             WHERE id = ?`,
            [JSON.stringify(mergedData), lat, lng, recordId]
          );
          updatedCount++;
        } else {
          await pool.query(
            `INSERT INTO laporan_records (id, activityId, formId, rowId, data, status, latitude, longitude, syncStatus)
             VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, 'synced')`,
            [recordId, form.activityId, formId, String(rowId), JSON.stringify(recordData), lat, lng]
          );
          importedCount++;
        }
      }
    }

    let note = '';
    if (isTruncated) {
      note = ` (Diproses ${records.length} data pertama dari total ${totalAvailableRows} baris untuk performa optimal)`;
    }

    res.json({
      success: true,
      message: `Sinkronisasi berhasil! ${importedCount} data baru ditambahkan, ${updatedCount} data diperbarui.${note}`,
      schema,
      fields: schema,
      headers,
      importedCount,
      updatedCount,
      totalRows: records.length,
      totalAvailableRows,
      isTruncated,
      records
    });
  } catch (err) {
    console.error('Error syncing sheet:', err);
    res.status(500).json({ error: 'Gagal menyinkronkan data dari Google Sheet', details: err.message });
  }
});

// POST batch save records (from client fallback or direct upload)
router.post('/forms/:formId/records/batch', async (req, res) => {
  try {
    const { formId } = req.params;
    const { records, activityId: passedActivityId } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.json({ success: true, count: 0, message: 'Tidak ada data untuk disimpan' });
    }

    let actId = passedActivityId;
    if (!actId) {
      const [forms] = await pool.query('SELECT activityId FROM laporan_forms WHERE id = ?', [formId]);
      if (forms.length > 0) {
        actId = forms[0].activityId;
      }
    }

    let savedCount = 0;
    const chunkSize = 200;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      for (const rec of chunk) {
        const recId = rec.id || `${formId}_${rec.rowId || (i + 1)}`;
        const rowId = rec.rowId || String(i + 1);
        const effectiveActId = rec.activityId || actId || '';
        const dataPayload = typeof rec.data === 'string' ? rec.data : JSON.stringify(rec.data || {});
        const status = rec.status === 'submitted' ? 'submitted' : 'draft';
        const lat = rec.latitude !== undefined && rec.latitude !== null ? Number(rec.latitude) : null;
        const lng = rec.longitude !== undefined && rec.longitude !== null ? Number(rec.longitude) : null;
        const submittedBy = rec.submittedBy || null;

        await pool.query(
          `INSERT INTO laporan_records (id, activityId, formId, rowId, data, status, latitude, longitude, submittedBy, syncStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
           ON DUPLICATE KEY UPDATE
             data = VALUES(data),
             status = VALUES(status),
             latitude = COALESCE(VALUES(latitude), latitude),
             longitude = COALESCE(VALUES(longitude), longitude),
             submittedBy = COALESCE(VALUES(submittedBy), submittedBy)`,
          [recId, effectiveActId, formId, rowId, dataPayload, status, isNaN(lat) ? null : lat, isNaN(lng) ? null : lng, submittedBy]
        );
        savedCount++;
      }
    }

    res.json({
      success: true,
      count: savedCount,
      message: `Berhasil menyimpan ${savedCount} data laporan ke database server!`
    });
  } catch (err) {
    console.error('Error saving batch records:', err);
    res.status(500).json({ error: 'Gagal menyimpan data laporan ke server', details: err.message });
  }
});

// ==========================================
// 5. EKSPOR CSV OTOMATIS (UNTUK =IMPORTDATA DI GOOGLE SHEET TANPA SCRIPT)
// ==========================================
router.get('/forms/:formId/export-csv', async (req, res) => {
  try {
    const { formId } = req.params;
    const [forms] = await pool.query('SELECT * FROM laporan_forms WHERE id = ?', [formId]);
    if (forms.length === 0) return res.status(404).send('Formulir tidak ditemukan');

    const [fields] = await pool.query('SELECT * FROM laporan_fields WHERE formId = ? ORDER BY orderIndex ASC', [formId]);
    const [records] = await pool.query('SELECT * FROM laporan_records WHERE formId = ? ORDER BY createdAt ASC', [formId]);

    const headers = [];
    const colSet = new Set();
    
    // Header dari field yang didefinisikan
    fields.forEach(f => {
      const col = f.columnName || f.label;
      if (col && !colSet.has(col)) {
        headers.push(col);
        colSet.add(col);
      }
    });

    // Header dari data aktual
    records.forEach(r => {
      let d = {};
      try { d = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {}); } catch (e) { d = {}; }
      Object.keys(d).forEach(k => {
        if (!colSet.has(k)) {
          headers.push(k);
          colSet.add(k);
        }
      });
    });

    // Kolom pelengkap status
    ['Status', 'SubmittedBy', 'SubmittedAt', 'Latitude', 'Longitude'].forEach(m => {
      if (!colSet.has(m)) headers.push(m);
    });

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [];
    csvLines.push(headers.map(escapeCsv).join(','));

    records.forEach(r => {
      let d = {};
      try { d = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {}); } catch (e) { d = {}; }
      d['Status'] = r.status || '';
      d['SubmittedBy'] = r.submittedBy || '';
      d['SubmittedAt'] = r.submittedAt ? new Date(r.submittedAt).toISOString() : '';
      d['Latitude'] = r.latitude !== null && r.latitude !== undefined ? r.latitude : '';
      d['Longitude'] = r.longitude !== null && r.longitude !== undefined ? r.longitude : '';

      const row = headers.map(h => escapeCsv(d[h]));
      csvLines.push(row.join(','));
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="laporan_${formId}.csv"`);
    res.send(csvLines.join('\r\n'));
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).send('Gagal mengekspor data CSV');
  }
});

// ==========================================
// 6. UPLOAD BERKAS KE SERVER (FOTO / DOKUMEN)
// ==========================================

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/laporan/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Gagal mengunggah file' });
  }
});

// ==========================================
// 7. DATA ISIAN / RECORDS (PETUGAS & ADMIN)
// ==========================================

// GET records of a form
router.get('/forms/:formId/records', async (req, res) => {
  try {
    const { formId } = req.params;
    const [records] = await pool.query(
      'SELECT * FROM laporan_records WHERE formId = ? ORDER BY createdAt ASC', 
      [formId]
    );

    const parsed = records.map(r => {
      let d = {};
      if (typeof r.data === 'string') {
        try { d = JSON.parse(r.data); } catch (e) { d = {}; }
      } else {
        d = r.data || {};
      }
      return {
        ...r,
        data: d
      };
    });

    res.json(parsed);
  } catch (err) {
    console.error('Error fetching records:', err);
    res.status(500).json({ error: 'Gagal mengambil data laporan' });
  }
});

// GET single record
router.get('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [records] = await pool.query('SELECT * FROM laporan_records WHERE id = ?', [id]);
    if (records.length === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });

    const r = records[0];
    if (typeof r.data === 'string') {
      try { r.data = JSON.parse(r.data); } catch (e) { r.data = {}; }
    }

    res.json(r);
  } catch (err) {
    console.error('Error fetching record:', err);
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

// Helper: Auto-sync ke Google Sheet (Two-Way Sync Engine)
async function triggerGoogleSheetWebhook(form, record, rowId, data, status, latitude, longitude, submittedBy) {
  if (!form) return;

  try {
    const payload = {
      rowId: rowId,
      status: status,
      data: data,
      latitude: latitude,
      longitude: longitude,
      submittedBy: submittedBy
    };

    // Jalankan push ke Google Sheet via service Master Sync Engine
    pushRecordToGoogleSheet(form, payload).catch(err => {
      console.warn(`[MasterSync Push] Background sync note for row ${rowId}:`, err.message);
    });
  } catch (e) {
    console.warn('[MasterSync Push] Error:', e.message);
  }
}

// POST create or update record
router.post('/forms/:formId/records', async (req, res) => {
  try {
    const { formId } = req.params;
    const { id, rowId, data, status, latitude, longitude, submittedBy } = req.body;

    const [forms] = await pool.query('SELECT * FROM laporan_forms WHERE id = ?', [formId]);
    if (forms.length === 0) return res.status(404).json({ error: 'Formulir tidak ditemukan' });
    const form = forms[0];

    // Cek apakah kegiatan form ini sedang dibuka oleh admin
    const [acts] = await pool.query('SELECT * FROM laporan_activities WHERE id = ?', [form.activityId]);
    if (acts.length > 0 && !acts[0].isOpen) {
      return res.status(403).json({ error: 'Aplikasi laporan untuk kegiatan ini sedang ditutup oleh Administrator.' });
    }

    const effectiveRowId = rowId || (data && (data['ID'] || data['id'])) || `rec_${Date.now()}`;
    const recordId = id || `${formId}_${effectiveRowId}`;
    const cleanStatus = status === 'submitted' ? 'submitted' : 'draft';

    const [existing] = await pool.query('SELECT id, data FROM laporan_records WHERE id = ?', [recordId]);

    if (existing.length > 0) {
      let existingData = {};
      try {
        existingData = typeof existing[0].data === 'string' ? JSON.parse(existing[0].data) : existing[0].data;
      } catch (e) { existingData = {}; }

      const mergedData = { ...existingData, ...data };
      if (latitude) mergedData['Latitude'] = latitude;
      if (longitude) mergedData['Longitude'] = longitude;
      mergedData['Status'] = cleanStatus;

      await pool.query(
        `UPDATE laporan_records
         SET data = ?,
             status = ?,
             latitude = COALESCE(?, latitude),
             longitude = COALESCE(?, longitude),
             submittedBy = COALESCE(?, submittedBy),
             submittedAt = ${cleanStatus === 'submitted' ? 'CURRENT_TIMESTAMP' : 'submittedAt'}
         WHERE id = ?`,
        [JSON.stringify(mergedData), cleanStatus, latitude || null, longitude || null, submittedBy || null, recordId]
      );

      // Trigger Webhook ke Google Sheet di latar belakang
      triggerGoogleSheetWebhook(form, existing[0], effectiveRowId, mergedData, cleanStatus, latitude, longitude, submittedBy);

      res.json({
        success: true,
        message: cleanStatus === 'submitted' ? 'Laporan berhasil dikirim!' : 'Draf berhasil disimpan!',
        id: recordId,
        status: cleanStatus
      });
    } else {
      const fullData = { ...data };
      if (latitude) fullData['Latitude'] = latitude;
      if (longitude) fullData['Longitude'] = longitude;
      fullData['Status'] = cleanStatus;

      await pool.query(
        `INSERT INTO laporan_records (id, activityId, formId, rowId, data, status, submittedBy, submittedAt, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ${cleanStatus === 'submitted' ? 'CURRENT_TIMESTAMP' : 'NULL'}, ?, ?)`,
        [
          recordId, 
          form.activityId, 
          formId, 
          String(effectiveRowId), 
          JSON.stringify(fullData), 
          cleanStatus, 
          submittedBy || null, 
          latitude || null, 
          longitude || null
        ]
      );

      triggerGoogleSheetWebhook(form, null, effectiveRowId, fullData, cleanStatus, latitude, longitude, submittedBy);

      res.status(201).json({
        success: true,
        message: cleanStatus === 'submitted' ? 'Laporan berhasil dikirim!' : 'Draf berhasil disimpan!',
        id: recordId,
        status: cleanStatus
      });
    }
  } catch (err) {
    console.error('Error saving record:', err);
    res.status(500).json({ error: 'Gagal menyimpan laporan', details: err.message });
  }
});

// ==========================================
// 8. MONITORING KEGIATAN & PROGRES PETUGAS
// ==========================================

router.get('/activities/:actId/monitoring', async (req, res) => {
  try {
    const { actId } = req.params;
    const [forms] = await pool.query('SELECT id, title FROM laporan_forms WHERE activityId = ? ORDER BY orderIndex ASC', [actId]);
    const [records] = await pool.query('SELECT formId, data, status, submittedBy FROM laporan_records WHERE activityId = ?', [actId]);

    // 1. Rekapitulasi per Form
    const formStats = forms.map(f => {
      const fRecords = records.filter(r => r.formId === f.id);
      const total = fRecords.length;
      const draft = fRecords.filter(r => r.status === 'draft').length;
      const submitted = fRecords.filter(r => r.status === 'submitted').length;
      const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;

      return {
        formId: f.id,
        title: f.title,
        total,
        draft,
        submitted,
        percent
      };
    });

    // 2. Rekapitulasi per Petugas (dikelompokkan dari data 'Nama PPL' / 'Nama PML' / submittedBy)
    const petugasMap = {};

    records.forEach(r => {
      let d = {};
      try { d = typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {}); } catch (e) { d = {}; }

      const ppl = d['Nama PPL'] || d['PPL'] || d['nama PPL'] || r.submittedBy || 'Petugas Lain';
      const pml = d['Nama PML'] || d['PML'] || d['nama PML'] || '-';

      if (!petugasMap[ppl]) {
        petugasMap[ppl] = {
          name: ppl,
          pml: pml,
          total: 0,
          draft: 0,
          submitted: 0
        };
      }

      petugasMap[ppl].total += 1;
      if (r.status === 'submitted') {
        petugasMap[ppl].submitted += 1;
      } else {
        petugasMap[ppl].draft += 1;
      }
    });

    const petugasStats = Object.values(petugasMap).map(p => ({
      ...p,
      percent: p.total > 0 ? Math.round((p.submitted / p.total) * 100) : 0
    })).sort((a, b) => b.percent - a.percent);

    res.json({
      formStats,
      petugasStats,
      totalAllRecords: records.length,
      totalAllSubmitted: records.filter(r => r.status === 'submitted').length,
      totalAllDraft: records.filter(r => r.status === 'draft').length
    });
  } catch (err) {
    console.error('Error calculating monitoring:', err);
    res.status(500).json({ error: 'Gagal mengambil data monitoring' });
  }
});

// ==========================================
// 9. TAUTAN EKSTERNAL (LEGACY LINKS)
// ==========================================

router.get('/links', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM laporan_report_links ORDER BY createdAt ASC');
    res.json(rows.map(r => ({ ...r, isOpen: Boolean(r.isOpen) })));
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/links', async (req, res) => {
  try {
    const { title, url, isOpen } = req.body;
    const id = `link_${Date.now()}`;
    await pool.query(
      `INSERT INTO laporan_report_links (id, title, url, isOpen) VALUES (?, ?, ?, ?)`,
      [id, title, url, isOpen !== false]
    );
    res.status(201).json({ id, message: 'Link created' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.put('/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, isOpen } = req.body;
    await pool.query(
      `UPDATE laporan_report_links SET title=?, url=?, isOpen=? WHERE id=?`,
      [title, url, isOpen !== false, id]
    );
    res.json({ message: 'Link updated' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM laporan_report_links WHERE id=?', [id]);
    res.json({ message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;

