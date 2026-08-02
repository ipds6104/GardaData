const cron = require('node-cron');
const pool = require('./db');
const crypto = require('crypto');

function getExportUrl(url, sheetName = '') {
  try {
    const urlObj = new URL(url);
    const pathnameParts = urlObj.pathname.split('/');
    const dIndex = pathnameParts.indexOf('d');
    if (dIndex === -1 || dIndex + 1 >= pathnameParts.length) return null;
    const documentId = pathnameParts[dIndex + 1];

    let gid = '0';
    if (urlObj.searchParams.has('gid')) {
      gid = urlObj.searchParams.get('gid');
    } else if (urlObj.hash && urlObj.hash.includes('gid=')) {
      gid = urlObj.hash.split('gid=')[1].split('&')[0];
    }
    
    if (sheetName && sheetName.trim() !== '') {
      return `https://docs.google.com/spreadsheets/d/${documentId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName.trim())}`;
    }
    return `https://docs.google.com/spreadsheets/d/${documentId}/gviz/tq?tqx=out:json&gid=${gid}`;
  } catch (e) {
    console.error('Invalid URL:', url);
    return null;
  }
}

// (parseCSV removed in favor of JSON parsing)

// Function to run the snapshot
async function runDailySnapshot() {
  console.log('--- RUNNING DAILY MONITORING SNAPSHOT ---');
  try {
    const [configs] = await pool.query('SELECT * FROM monitoring_configs WHERE isActive = 1');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    for (const config of configs) {
      try {
        // Validate date period
        const todayDate = new Date();
        const startDate = new Date(config.startDate);
        const endDate = new Date(config.endDate);
        
        // Reset time for accurate day comparison
        todayDate.setHours(0,0,0,0);
        startDate.setHours(0,0,0,0);
        endDate.setHours(0,0,0,0);
        
        if (todayDate < startDate || todayDate > endDate) {
          console.log(`Skipping config ${config.id} - outside active period`);
          continue;
        }

        const exportUrl = getExportUrl(config.sheetUrl, config.sheetName);
        if (!exportUrl) continue;
        
        // bypass CDN cache
        const fetchUrl = `${exportUrl}&cb=${Date.now()}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          console.error(`Failed to fetch sheet for config ${config.id}`);
          continue;
        }
        
        const text = await response.text();
        const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
        let json;
        try {
          json = JSON.parse(jsonStr);
        } catch(e) {
          console.error(`Failed to parse JSON for config ${config.id}`);
          continue;
        }
        
        const rows = json.table.rows;
        if (!rows || rows.length < 1) continue; // No data
        
        let totalSubmit = 0;
        let totalDraft = 0;
        let totalTarget = 0;
        
        let lastPpl = '';
        let lastPml = '';

        // Iterate all rows
        for (let i = 0; i < rows.length; i++) {
          const rowData = rows[i];
          if (!rowData.c) continue; // skip invalid row
          
          const getVal = (idx) => rowData.c[idx] ? (rowData.c[idx].v || '') : '';
          const getNum = (idx) => rowData.c[idx] ? (parseInt(rowData.c[idx].v, 10) || 0) : 0;
          
          const pplVal = String(getVal(1)).trim();
          const pmlVal = String(getVal(2)).trim();
          const slsVal  = String(getVal(5)).trim();
          
          // Track PML/PPL name carried forward
          if (pmlVal && pmlVal !== 'nama PML' && pmlVal !== lastPml) {
            lastPml = pmlVal;
            lastPpl = ''; // Reset PPL name when PML changes
          }
          if (pplVal && pplVal !== 'nama PPL') lastPpl = pplVal;
          
          // ⚠️ Only process rows with a valid SLS (not header/summary rows)
          // This mirrors the filter in sync-live route
          if (!lastPml || lastPml === 'nama PML' || !slsVal || slsVal === 'Wilayah Tugas / SLS') continue;
          
          const effPpl = lastPpl || lastPml;
          
          const submit = getNum(6);
          const draft = getNum(7);
          const approve = getNum(8);
          const reject = getNum(9);
          const target = getNum(11);
          
          // Accumulate only from valid SLS rows
          totalSubmit += submit;
          totalDraft += draft;
          totalTarget += target;

          // Save per PPL daily log
          await pool.query(
            `INSERT INTO monitoring_log_harian (id, configId, tanggalUpdate, pml, ppl, submit, draft, approve, total, statusSiklus) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE submit = VALUES(submit), draft = VALUES(draft), approve = VALUES(approve), total = VALUES(total)`,
            [crypto.randomUUID(), config.id, today, lastPml, effPpl, submit, draft, approve, submit + draft, 'Aktif']
          );
        }
        
        // Save to database using INSERT ... ON DUPLICATE KEY UPDATE
        await pool.query(
          `INSERT INTO monitoring_snapshots (id, configId, snapshotDate, totalSubmit, totalDraft, totalTarget) 
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE totalSubmit = VALUES(totalSubmit), totalDraft = VALUES(totalDraft), totalTarget = VALUES(totalTarget)`,
          [crypto.randomUUID(), config.id, today, totalSubmit, totalDraft, totalTarget]
        );
        
        console.log(`Snapshot saved for ${config.kegiatan} - ${config.subKegiatan}: Submit=${totalSubmit}`);
      } catch (err) {
        console.error(`Error processing config ${config.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error running daily snapshot:', error);
  }
}

// Schedule task to run at 23:59 every day
cron.schedule('59 23 * * *', () => {
  runDailySnapshot();
});

// We can export it in case we want to trigger it manually via an admin endpoint
module.exports = {
  runDailySnapshot,
  getExportUrl
};
