const cron = require('node-cron');
const pool = require('./db');
const crypto = require('crypto');

// Helper to convert google sheet URL to TSV export URL
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
    
    // Fallback: If sheetName is provided, we can't reliably get GID without Google API, 
    // so we trust the URL's GID or default to 0. 
    return `https://docs.google.com/spreadsheets/d/${documentId}/export?format=tsv&gid=${gid}`;
  } catch (e) {
    console.error('Invalid URL:', url);
    return null;
  }
}

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

        const exportUrl = getExportUrl(config.sheetUrl);
        if (!exportUrl) continue;
        
        const response = await fetch(exportUrl);
        if (!response.ok) {
          console.error(`Failed to fetch sheet for config ${config.id}`);
          continue;
        }
        
        const text = await response.text();
        const lines = text.split('\n');
        if (lines.length < 2) continue; // No data
        
        const header = lines[0].toLowerCase().split('\t').map(h => h.trim());
        const idxSubmit = header.findIndex(h => h.includes('submit'));
        const idxDraft = header.findIndex(h => h === 'draf' || h === 'draft');
        const idxApprove = header.findIndex(h => h === 'approve' || h === 'approved');
        const idxReject = header.findIndex(h => h === 'reject' || h === 'rejected');
        const idxTarget = header.findIndex(h => h === 'target');
        
        const idxPpl = header.findIndex(h => h.includes('nama ppl'));
        const idxPml = header.findIndex(h => h.includes('nama pml'));
        
        let totalSubmit = 0;
        let totalDraft = 0;
        let totalTarget = 0;
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split('\t').map(c => c.trim());
          if (cols.length < 3) continue; // Empty row
          
          const submit = idxSubmit !== -1 && cols[idxSubmit] ? (parseInt(cols[idxSubmit], 10) || 0) : 0;
          const draft = idxDraft !== -1 && cols[idxDraft] ? (parseInt(cols[idxDraft], 10) || 0) : 0;
          const approve = idxApprove !== -1 && cols[idxApprove] ? (parseInt(cols[idxApprove], 10) || 0) : 0;
          const reject = idxReject !== -1 && cols[idxReject] ? (parseInt(cols[idxReject], 10) || 0) : 0;
          const target = idxTarget !== -1 && cols[idxTarget] ? (parseInt(cols[idxTarget], 10) || 0) : 0;
          
          const rowSubmit = submit + approve + reject;
          totalSubmit += rowSubmit;
          totalDraft += draft;
          totalTarget += target;

          const pplName = idxPpl !== -1 && cols[idxPpl] ? cols[idxPpl] : 'Unknown PPL';
          const pmlName = idxPml !== -1 && cols[idxPml] ? cols[idxPml] : 'Unknown PML';

          // Save per PPL log
          await pool.query(
            `INSERT INTO monitoring_log_harian (id, configId, tanggalUpdate, pml, ppl, submit, draft, total, statusSiklus) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE submit = VALUES(submit), draft = VALUES(draft), total = VALUES(total)`,
            [crypto.randomUUID(), config.id, today, pmlName, pplName, rowSubmit, draft, rowSubmit + draft, 'Aktif']
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
  runDailySnapshot
};
