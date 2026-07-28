// Debug: baca semua baris dari sheet yang aktif
const sheetUrl = 'https://docs.google.com/spreadsheets/d/1Gzrvqn1MplBh0Xhw8vNrYVkWz4EuLgSOkWZtji44Lqs/gviz/tq?tqx=out:csv&sheet=Sheet1';
const proxyUrl = 'https://gardadata.dvlpid.my.id/api/monitoring/proxy-sheet?url=' + encodeURIComponent(sheetUrl);

function parseRow(line) {
  const cols = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { cols.push(cur.trim()); cur = ''; }
      else cur += c;
    }
  }
  cols.push(cur.trim());
  return cols;
}

fetch(proxyUrl).then(r => r.text()).then(t => {
  const lines = t.split('\n').filter(l => l.trim());
  console.log('Total baris (termasuk header):', lines.length);
  console.log('\nSemua baris - PPL | PML | Submit | Target:');
  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    console.log(`Row ${i}: PPL=[${cols[1]}] | PML=[${cols[2]}] | Submit=${cols[6]} | Target=${cols[11]}`);
  }
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
