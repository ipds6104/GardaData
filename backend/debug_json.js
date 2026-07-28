// Test: baca sheet via JSON dan tampilkan SEMUA baris lengkap dengan nilai formulaValue
const sheetId = '1Gzrvqn1MplBh0Xhw8vNrYVkWz4EuLgSOkWZtji44Lqs';
const jsonUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Sheet1`;
const proxyUrl = 'https://gardadata.dvlpid.my.id/api/monitoring/proxy-sheet?url=' + encodeURIComponent(jsonUrl);

fetch(proxyUrl).then(r => r.text()).then(rawText => {
  const jsonStr = rawText.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
  const json = JSON.parse(jsonStr);
  const rows = json.table.rows;

  // Rekap per PPL (dengan carry-forward untuk PPL kosong)
  let lastPpl = '', lastPml = '';
  const pplMap = {};
  
  rows.forEach((r, i) => {
    const ppl = r.c[1] ? (r.c[1].v || '').trim() : '';
    const pml = r.c[2] ? (r.c[2].v || '').trim() : '';
    
    if (pml && pml !== lastPml) { lastPml = pml; lastPpl = ''; }
    if (ppl) lastPpl = ppl;
    
    const effPpl = lastPpl || lastPml;
    const submit = r.c[6] ? (r.c[6].v || 0) : 0;
    const draft = r.c[7] ? (r.c[7].v || 0) : 0;
    const target = r.c[11] ? (r.c[11].v || 0) : 0;
    
    const key = `${effPpl}|${lastPml}`;
    if (!pplMap[key]) pplMap[key] = { ppl: effPpl, pml: lastPml, submit: 0, draft: 0, target: 0, sls: 0 };
    pplMap[key].submit += submit;
    pplMap[key].draft += draft;
    pplMap[key].target += target;
    pplMap[key].sls++;
  });
  
  console.log('\n=== REKAPITULASI PER PPL (JSON MODE) ===');
  let totalSubmit = 0, totalDraft = 0, totalTarget = 0;
  Object.values(pplMap).forEach(p => {
    totalSubmit += p.submit;
    totalDraft += p.draft;
    totalTarget += p.target;
    console.log(`${p.ppl.padEnd(35)} | PML: ${p.pml.padEnd(25)} | Submit: ${p.submit} | Draft: ${p.draft} | Target: ${p.target} | SLS: ${p.sls}`);
  });
  console.log('\nTOTAL Submit:', totalSubmit, '| Draft:', totalDraft, '| Target:', totalTarget);
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
