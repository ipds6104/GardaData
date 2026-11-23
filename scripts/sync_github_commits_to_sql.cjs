/**
 * sync_github_commits_to_sql.js
 * 
 * Sinkronisasi data commit GitHub ke tabel database SQL `system_github_commits`
 * dan fail-safe static JSON `public/data/latest_updates.json`.
 * Dijalankan otomatis sebelum push atau saat deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
let mysql;
try {
  mysql = require('mysql2/promise');
} catch {
  mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));
}
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

function parseCommitMessage(message) {
  const firstLine = (message || '').split('\n')[0].trim();
  const match = firstLine.match(/^(feat|fix|perf|style|refactor|docs|chore)(\(([^)]+)\))?:\s*(.*)$/i);

  if (match) {
    const type = match[1].toLowerCase();
    const rawScope = match[3] || '';
    const desc = match[4].charAt(0).toUpperCase() + match[4].slice(1);

    const scopeMap = {
      'mitra': 'Penilaian Kinerja Mitra',
      'pengolahan': 'Peta Responden SE2026',
      'se2026': 'Peta Responden SE2026',
      'laporan-lms': 'Laporan & LMS',
      'laporan': 'Laporan Pendataan',
      'lms': 'LMS Pelatihan',
      'developer': 'Halaman Developer',
      'security': 'Keamanan & Backup',
      'auth': 'Otentikasi & SSO',
      'monitoring': 'Monitoring Petugas',
      'ui': 'Antarmuka Sistem',
      'login': 'Pembaruan Fitur Terkini'
    };

    let title = rawScope ? (scopeMap[rawScope.toLowerCase()] || rawScope) : '';
    if (!title) {
      const typeMap = {
        feat: 'Fitur Baru',
        fix: 'Perbaikan Sistem',
        perf: 'Peningkatan Kinerja',
        style: 'Pembaruan Tampilan',
        refactor: 'Optimalisasi Sistem',
        docs: 'Dokumentasi',
        chore: 'Pembaruan Rutin'
      };
      title = typeMap[type] || 'Pembaruan Sistem';
    }
    return { title, desc, scope: rawScope || type };
  }

  // Fallback intelligent title detection
  const lowerMsg = firstLine.toLowerCase();
  let title = 'Pembaruan Sistem';
  let scope = 'system';
  if (lowerMsg.includes('se2026') || lowerMsg.includes('responden')) {
    title = 'Keamanan Peta Responden SE2026';
    scope = 'se2026';
  } else if (lowerMsg.includes('mitra')) {
    title = 'Penilaian Kinerja Mitra';
    scope = 'mitra';
  } else if (lowerMsg.includes('lms')) {
    title = 'LMS Pelatihan';
    scope = 'lms';
  } else if (lowerMsg.includes('laporan')) {
    title = 'Laporan Pendataan';
    scope = 'laporan';
  } else if (lowerMsg.includes('pentest') || lowerMsg.includes('keamanan') || lowerMsg.includes('security')) {
    title = 'Keamanan & Audit Sistem';
    scope = 'security';
  }

  return { title, desc: firstLine, scope };
}

async function run() {
  console.log('🔄 [Commit Sync] Mengambil log commit git terbaru...');
  let commits = [];

  try {
    const rawLog = execSync('git log -n 10 --format="%H|%ad|%an|%s" --date=iso', { encoding: 'utf-8' });
    const lines = rawLog.split('\n').filter(l => l.trim().length > 0);

    commits = lines.map(line => {
      const parts = line.split('|');
      const hash = parts[0]?.trim();
      const dateStr = parts[1]?.trim();
      const author = parts[2]?.trim();
      const msg = parts.slice(3).join('|').trim();

      const { title, desc, scope } = parseCommitMessage(msg);
      const commitDate = new Date(dateStr);

      return {
        id: `commit_${hash.slice(0, 12)}`,
        commitHash: hash,
        title,
        description: desc,
        scope,
        author: author || 'system',
        commitDate: isNaN(commitDate.getTime()) ? new Date() : commitDate,
        rawJson: {
          hash,
          date: dateStr,
          author,
          message: msg,
          title,
          desc
        }
      };
    });
  } catch (gitErr) {
    console.warn('⚠️ [Commit Sync] Gagal membaca git log, menggunakan fallback static data:', gitErr.message);
  }

  // 1. Simpan ke file static JSON fail-safe (public/data/latest_updates.json)
  try {
    const staticList = commits.slice(0, 5).map(c => ({
      title: c.title,
      date: c.commitDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      desc: c.description
    }));

    if (staticList.length > 0) {
      const publicPath = path.join(__dirname, '../public/data/latest_updates.json');
      fs.mkdirSync(path.dirname(publicPath), { recursive: true });
      fs.writeFileSync(publicPath, JSON.stringify(staticList, null, 2), 'utf-8');
      console.log('✅ [Commit Sync] public/data/latest_updates.json berhasil disinkronkan.');
    }
  } catch (fsErr) {
    console.warn('⚠️ [Commit Sync] Gagal memperbarui file static:', fsErr.message);
  }

  // 2. Simpan ke database SQL tabel `system_github_commits`
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'garda_data',
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 3
    });

    // Pastikan tabel siap
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_github_commits (
        id VARCHAR(255) PRIMARY KEY,
        commitHash VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        scope VARCHAR(100) DEFAULT NULL,
        author VARCHAR(100) DEFAULT NULL,
        commitDate DATETIME NOT NULL,
        rawJson JSON NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_commit_date (commitDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    for (const c of commits) {
      await pool.query(
        `INSERT INTO system_github_commits (id, commitHash, title, description, scope, author, commitDate, rawJson)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           title = VALUES(title),
           description = VALUES(description),
           scope = VALUES(scope),
           commitDate = VALUES(commitDate),
           rawJson = VALUES(rawJson)`,
        [c.id, c.commitHash, c.title, c.description, c.scope, c.author, c.commitDate, JSON.stringify(c.rawJson)]
      );
    }

    console.log(`✅ [Commit Sync] ${commits.length} commit berhasil disimpan ke tabel SQL 'system_github_commits'.`);
    await pool.end();
  } catch (dbErr) {
    console.warn('ℹ️ [Commit Sync] Database MySQL lokal offline, data commit tersimpan di file fail-safe static JSON (Database akan terisi otomatis saat dijalankan di server produksi):', dbErr.message);
  }
}

run();
