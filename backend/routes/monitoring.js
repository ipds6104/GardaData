const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const archiver = require('archiver');

// GET: All monitoring configs (Active & Not Archived)
router.get('/configs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM monitoring_configs WHERE isArchived = 0 ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching configs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST: Add new config
router.post('/configs', async (req, res) => {
  try {
    const { kegiatan, subKegiatan, sheetUrl, sheetName, startDate, endDate, isActive, icon, color } = req.body;
    const id = crypto.randomUUID();
    
    await pool.query(
      `INSERT INTO monitoring_configs (id, kegiatan, subKegiatan, sheetUrl, sheetName, startDate, endDate, isActive, icon, color) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, kegiatan, subKegiatan || '', sheetUrl, sheetName, startDate, endDate, isActive !== false, icon || 'pertanian', color || 'emerald']
    );
    
    res.status(201).json({ id, message: 'Config created successfully' });
  } catch (error) {
    console.error('Error creating config:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT: Update config
router.put('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { kegiatan, subKegiatan, sheetUrl, sheetName, startDate, endDate, isActive, icon, color } = req.body;
    
    await pool.query(
      `UPDATE monitoring_configs 
       SET kegiatan=?, subKegiatan=?, sheetUrl=?, sheetName=?, startDate=?, endDate=?, isActive=?, icon=?, color=? 
       WHERE id=?`,
      [kegiatan, subKegiatan || '', sheetUrl, sheetName, startDate, endDate, isActive !== false, icon || 'pertanian', color || 'emerald', id]
    );
    
    res.json({ message: 'Config updated successfully' });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE: Soft Remove config (Archive)
router.delete('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE monitoring_configs SET isArchived = 1 WHERE id=?', [id]);
    res.json({ message: 'Config archived successfully' });
  } catch (error) {
    console.error('Error deleting config:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET: Snapshots for a config
router.get('/snapshots/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM monitoring_snapshots WHERE configId=? ORDER BY snapshotDate ASC',
      [configId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET: Daily Logs for a config
router.get('/logs/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM monitoring_log_harian WHERE configId=? ORDER BY tanggalUpdate DESC',
      [configId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET: Proxy to fetch Google Sheet to bypass CORS
router.get('/proxy-sheet', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    if (!url.startsWith('https://docs.google.com/')) {
       return res.status(403).json({ error: 'Invalid URL' });
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch from Google Sheets');
    const text = await response.text();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(text);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request' });
  }
});

// POST: Manually trigger daily snapshot (admin only)
router.post('/trigger-snapshot', async (req, res) => {
  try {
    const { runDailySnapshot } = require('../cron');
    // Run in background, respond immediately
    res.json({ message: 'Snapshot trigger started. Data akan direkam dalam beberapa detik.' });
    await runDailySnapshot();
    console.log('[MANUAL TRIGGER] Daily snapshot completed successfully.');
  } catch (error) {
    console.error('[MANUAL TRIGGER] Error:', error);
  }
});

// GET: Live data from SQL
router.get('/live-data/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM monitoring_data_live WHERE configId=?',
      [configId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching live data:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST: Trigger manual live sync for a config
router.post('/sync-live/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const [configs] = await pool.query('SELECT * FROM monitoring_configs WHERE id=?', [configId]);
    if (configs.length === 0) return res.status(404).json({ error: 'Config not found' });
    const config = configs[0];

    const { getExportUrl } = require('../cron');
    const exportUrl = getExportUrl(config.sheetUrl, config.sheetName);
    if (!exportUrl) return res.status(400).json({ error: 'Invalid sheet URL' });

    const fetchUrl = `${exportUrl}&cb=${Date.now()}`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Failed to fetch from Google Sheets');
    
    const text = await response.text();
    const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
    let json = JSON.parse(jsonStr);
    const rows = json?.table?.rows || [];

    let lastPpl = '';
    let lastPml = '';
    let lastKec = '';
    let lastDesa = '';

    for (let i = 0; i < rows.length; i++) {
      const rowData = rows[i];
      if (!rowData.c) continue;
      
      const getVal = (idx) => rowData.c[idx] ? (rowData.c[idx].v || '') : '';
      const getNum = (idx) => rowData.c[idx] ? (parseInt(rowData.c[idx].v, 10) || 0) : 0;
      
      const pmlVal = String(getVal(2)).trim();
      const pplVal = String(getVal(1)).trim();
      const kodeWilayah = String(getVal(0)).trim();
      
      if (pmlVal && pmlVal !== 'nama PML' && pmlVal !== lastPml) {
        lastPml = pmlVal;
        lastPpl = ''; 
      }
      if (pplVal && pplVal !== 'nama PPL') lastPpl = pplVal;
      
      const kec = String(getVal(3)).trim();
      if (kec && kec !== 'Kecamatan') lastKec = kec;
      
      const desa = String(getVal(4)).trim();
      if (desa && desa !== 'Desa') lastDesa = desa;

      const sls = String(getVal(5)).trim();
      if (!lastPml || lastPml === 'nama PML' || !sls || sls === 'Wilayah Tugas / SLS') continue;

      const effPpl = lastPpl || lastPml;

      const submit = getNum(6);
      const draft = getNum(7);
      const approve = getNum(8);
      const reject = getNum(9);
      const open = getNum(10);
      const target = getNum(11);

      await pool.query(
        `INSERT INTO monitoring_data_live (id, configId, kodeWilayah, namaPpl, namaPml, kecamatan, desa, sls, submit, draft, approve, reject, open, target) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         submit = VALUES(submit), draft = VALUES(draft), approve = VALUES(approve), reject = VALUES(reject), 
         open = VALUES(open), target = VALUES(target)`,
        [crypto.randomUUID(), configId, kodeWilayah, effPpl, lastPml, lastKec, lastDesa, sls, submit, draft, approve, reject, open, target]
      );
    }
    
    res.json({ message: 'Sync successful' });
  } catch (error) {
    console.error('Error syncing live data:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// GET: Export Archive as ZIP
router.get('/export-archive/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [configs] = await pool.query('SELECT * FROM monitoring_configs WHERE id=?', [id]);
    if (configs.length === 0) return res.status(404).json({ error: 'Config not found' });
    const config = configs[0];

    const [liveData] = await pool.query('SELECT * FROM monitoring_data_live WHERE configId=?', [id]);
    const [logsData] = await pool.query('SELECT * FROM monitoring_log_harian WHERE configId=? ORDER BY tanggalUpdate ASC', [id]);
    const [snapshots] = await pool.query('SELECT * FROM monitoring_snapshots WHERE configId=? ORDER BY snapshotDate ASC', [id]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Garda Data Admin';

    // Sheet 1: Live Data
    const sheet1 = workbook.addWorksheet('Data Live (Terakhir)');
    sheet1.columns = [
      { header: 'Kecamatan', key: 'kecamatan', width: 20 },
      { header: 'Desa', key: 'desa', width: 20 },
      { header: 'SLS', key: 'sls', width: 25 },
      { header: 'PML', key: 'namaPml', width: 20 },
      { header: 'PPL', key: 'namaPpl', width: 20 },
      { header: 'Target', key: 'target', width: 10 },
      { header: 'Open', key: 'open', width: 10 },
      { header: 'Submit', key: 'submit', width: 10 },
      { header: 'Draft', key: 'draft', width: 10 },
      { header: 'Approve', key: 'approve', width: 10 },
      { header: 'Reject', key: 'reject', width: 10 },
      { header: 'Last Synced', key: 'lastSynced', width: 20 }
    ];
    sheet1.addRows(liveData);

    // Sheet 2: Daily Logs
    const sheet2 = workbook.addWorksheet('Riwayat Harian Petugas');
    sheet2.columns = [
      { header: 'Tanggal', key: 'tanggalUpdate', width: 15 },
      { header: 'PML', key: 'pml', width: 20 },
      { header: 'PPL', key: 'ppl', width: 20 },
      { header: 'Submit', key: 'submit', width: 10 },
      { header: 'Draft', key: 'draft', width: 10 },
      { header: 'Approve', key: 'approve', width: 10 },
      { header: 'Total', key: 'total', width: 10 }
    ];
    sheet2.addRows(logsData.map(r => ({ ...r, tanggalUpdate: new Date(r.tanggalUpdate).toISOString().split('T')[0] })));

    // Sheet 3: Snapshots
    const sheet3 = workbook.addWorksheet('Riwayat Snapshot Global');
    sheet3.columns = [
      { header: 'Tanggal', key: 'snapshotDate', width: 15 },
      { header: 'Total Submit', key: 'totalSubmit', width: 15 },
      { header: 'Total Draft', key: 'totalDraft', width: 15 },
      { header: 'Total Target', key: 'totalTarget', width: 15 }
    ];
    sheet3.addRows(snapshots.map(r => ({ ...r, snapshotDate: new Date(r.snapshotDate).toISOString().split('T')[0] })));

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', \`attachment; filename="\${config.kegiatan}_Archive.zip"\`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    const buffer = await workbook.xlsx.writeBuffer();
    archive.append(buffer, { name: \`\${config.kegiatan}_Data.xlsx\` });
    
    await archive.finalize();

  } catch (error) {
    console.error('Error generating archive:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate archive' });
  }
});

module.exports = router;
