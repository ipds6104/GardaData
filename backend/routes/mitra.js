const express = require('express');
const router = express.Router();
const pool = require('../db');
const fs = require('fs');
const path = require('path');

// Helper penentu kategori penilaian sesuai aturan BPS
function getKategoriFromNilai(nilai) {
  if (nilai === null || nilai === undefined || nilai === '') return null;
  const num = parseInt(nilai, 10);
  if (isNaN(num)) return null;
  if (num >= 90 && num <= 100) return 'Sangat Direkomendasikan';
  if (num >= 80 && num < 90) return 'Direkomendasikan';
  if (num >= 60 && num < 80) return 'Cukup';
  return 'Blacklist';
}

// GET /api/mitra - Mengambil seluruh data mitra & penilaian
router.get('/', async (req, res) => {
  try {
    const { pj, kecamatan, status, search } = req.query;
    let query = 'SELECT * FROM mitra_evaluations WHERE 1=1';
    const params = [];

    if (pj && pj !== 'all') {
      query += ' AND pj = ?';
      params.push(pj.trim());
    }

    if (kecamatan && kecamatan !== 'all') {
      query += ' AND kecamatan = ?';
      params.push(kecamatan.trim());
    }

    if (status === 'evaluated') {
      query += ' AND nilai IS NOT NULL';
    } else if (status === 'pending') {
      query += ' AND nilai IS NULL';
    } else if (status === 'sangat_direkomendasikan') {
      query += ' AND nilai >= 90';
    } else if (status === 'direkomendasikan') {
      query += ' AND nilai >= 80 AND nilai < 90';
    } else if (status === 'cukup') {
      query += ' AND nilai >= 60 AND nilai < 80';
    } else if (status === 'blacklist') {
      query += ' AND nilai IS NOT NULL AND nilai < 60';
    }

    if (search && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      query += ' AND (nama LIKE ? OR email LIKE ? OR kecamatan LIKE ? OR pj LIKE ?)';
      params.push(s, s, s, s);
    }

    query += ' ORDER BY pj ASC, kecamatan ASC, nama ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching mitra evaluations:', error);
    res.status(500).json({ error: 'Gagal mengambil data mitra' });
  }
});

// GET /api/mitra/monitoring-pj - Rekapitulasi progres pengisian per PJ SE2026
router.get('/monitoring-pj', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pj,
        COUNT(*) as totalMitra,
        SUM(CASE WHEN nilai IS NOT NULL THEN 1 ELSE 0 END) as sudahDinilai,
        SUM(CASE WHEN nilai IS NULL THEN 1 ELSE 0 END) as belumDinilai,
        ROUND(AVG(nilai), 1) as avgNilai,
        GROUP_CONCAT(DISTINCT kecamatan ORDER BY kecamatan SEPARATOR ', ') as daftarKecamatan,
        SUM(CASE WHEN nilai >= 90 THEN 1 ELSE 0 END) as sangatDirekomendasikan,
        SUM(CASE WHEN nilai >= 80 AND nilai < 90 THEN 1 ELSE 0 END) as direkomendasikan,
        SUM(CASE WHEN nilai >= 60 AND nilai < 80 THEN 1 ELSE 0 END) as cukup,
        SUM(CASE WHEN nilai IS NOT NULL AND nilai < 60 THEN 1 ELSE 0 END) as blacklist
      FROM mitra_evaluations
      GROUP BY pj
      ORDER BY totalMitra DESC, pj ASC
    `);

    const result = rows.map(r => {
      const total = r.totalMitra || 0;
      const sudah = r.sudahDinilai || 0;
      const persen = total > 0 ? Math.round((sudah / total) * 100) : 0;
      return {
        ...r,
        persenSelesai: persen,
        status: persen === 100 ? 'Selesai' : (persen > 0 ? 'Sedang Berjalan' : 'Belum Mulai')
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching PJ monitoring summary:', error);
    res.status(500).json({ error: 'Gagal merekap monitoring per PJ' });
  }
});

// PUT /api/mitra/:identifier - Memperbarui penilaian 1 mitra (berdasarkan id unik atau email+role)
router.put('/:identifier', async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier).trim();
    const { nilai, catatan, penilai, role } = req.body;

    let finalNilai = null;
    let kategori = null;

    if (nilai !== null && nilai !== undefined && nilai !== '') {
      const num = parseInt(nilai, 10);
      if (isNaN(num) || num < 0 || num > 100) {
        return res.status(400).json({ error: 'Nilai harus berupa bilangan bulat antara 0 dan 100.' });
      }
      finalNilai = num;
      kategori = getKategoriFromNilai(finalNilai);
    }

    const query = `
      UPDATE mitra_evaluations 
      SET nilai = ?, kategori = ?, catatan = ?, penilai = ?
      WHERE id = ? OR (LOWER(email) = LOWER(?) AND (role = ? OR ? IS NULL))
    `;

    const [result] = await pool.execute(query, [
      finalNilai,
      kategori,
      catatan || null,
      penilai || 'Admin',
      identifier,
      identifier,
      role || null,
      role || null
    ]);

    if (result.affectedRows === 0) {
      // Jika baris belum ada di database MySQL, lakukan insert (UPSERT)
      const email = req.body.email ? String(req.body.email).trim().toLowerCase() : identifier.split('_')[0];
      const role = req.body.role ? String(req.body.role).trim().toUpperCase() : 'PPL';
      const nama = req.body.nama ? String(req.body.nama).trim() : 'Mitra Lapangan';
      const pj = req.body.pj ? String(req.body.pj).trim() : '-';
      const kecamatan = req.body.kecamatan ? String(req.body.kecamatan).trim() : '-';
      const id = `${email}_${role.toLowerCase()}`;

      await pool.execute(`
        INSERT INTO mitra_evaluations 
        (id, email, nama, role, pj, kecamatan, nilai, kategori, catatan, penilai)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        nilai = VALUES(nilai),
        kategori = VALUES(kategori),
        catatan = VALUES(catatan),
        penilai = VALUES(penilai)
      `, [id, email, nama, role, pj, kecamatan, finalNilai, kategori, catatan || null, penilai || 'Admin']);
    }

    res.json({
      success: true,
      message: 'Penilaian berhasil disimpan',
      data: { identifier, nilai: finalNilai, kategori, catatan }
    });
  } catch (error) {
    console.error('Error updating mitra evaluation:', error);
    res.status(500).json({ error: 'Gagal memperbarui nilai mitra' });
  }
});

// POST /api/mitra/bulk - Simpan nilai massal (batch save via UPSERT)
router.post('/bulk', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Payload harus berupa array items.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const item of items) {
      if (!item.id && !item.email) continue;
      const email = String(item.email || '').trim().toLowerCase();
      const role = String(item.role || 'PPL').trim().toUpperCase();
      const id = item.id || `${email}_${role.toLowerCase()}`;
      const nama = String(item.nama || 'Mitra Lapangan').trim();
      const pj = String(item.pj || '-').trim();
      const kecamatan = String(item.kecamatan || '-').trim();
      let finalNilai = null;
      let kategori = null;

      if (item.nilai !== null && item.nilai !== undefined && item.nilai !== '') {
        const num = parseInt(item.nilai, 10);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          finalNilai = num;
          kategori = getKategoriFromNilai(finalNilai);
        }
      }

      await connection.execute(`
        INSERT INTO mitra_evaluations 
        (id, email, nama, role, pj, kecamatan, nilai, kategori, catatan, penilai)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        nilai = VALUES(nilai),
        kategori = VALUES(kategori),
        catatan = COALESCE(VALUES(catatan), catatan),
        penilai = VALUES(penilai)
      `, [id, email, nama, role, pj, kecamatan, finalNilai, kategori, item.catatan || null, item.penilai || 'Admin']);
    }

    await connection.commit();
    res.json({ success: true, message: `Berhasil menyimpan nilai untuk ${items.length} mitra.` });
  } catch (error) {
    await connection.rollback();
    console.error('Error bulk updating mitra:', error);
    res.status(500).json({ error: 'Gagal menyimpan nilai massal' });
  } finally {
    connection.release();
  }
});

// DELETE /api/mitra/:identifier - Menghapus 1 mitra
router.delete('/:identifier', async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier).trim();
    await pool.execute('DELETE FROM mitra_evaluations WHERE id = ? OR LOWER(email) = LOWER(?)', [identifier, identifier]);
    res.json({ success: true, message: 'Data mitra berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting mitra:', err);
    res.status(500).json({ error: 'Gagal menghapus data mitra' });
  }
});

// POST /api/mitra/import - Import / tambah mitra dari file Excel/CSV dengan pemetaan kolom
router.post('/import', async (req, res) => {
  const { items, upsert = true } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Data import tidak boleh kosong.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let inserted = 0;
    let updated = 0;

    for (const row of items) {
      if (!row.email || !String(row.email).trim()) continue;
      const email = String(row.email).trim().toLowerCase();
      const role = String(row.role || 'PPL').trim();
      const id = row.id || `${email}_${role.toLowerCase()}`;
      const nama = String(row.nama || 'Tanpa Nama').trim();
      const pj = String(row.pj || '-').trim();
      const kecamatan = String(row.kecamatan || '-').trim();
      
      let nilai = null;
      let kategori = null;
      if (row.nilai !== null && row.nilai !== undefined && row.nilai !== '') {
        const num = parseInt(row.nilai, 10);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          nilai = num;
          kategori = getKategoriFromNilai(nilai);
        }
      }

      if (upsert) {
        const query = `
          INSERT INTO mitra_evaluations 
          (id, email, nama, role, pj, kecamatan, nilai, kategori, catatan)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          nama = VALUES(nama),
          role = VALUES(role),
          pj = VALUES(pj),
          kecamatan = VALUES(kecamatan),
          nilai = COALESCE(VALUES(nilai), nilai),
          kategori = COALESCE(VALUES(kategori), kategori),
          catatan = CASE 
            WHEN VALUES(catatan) IS NOT NULL AND VALUES(catatan) != '' THEN VALUES(catatan) 
            ELSE catatan 
          END
        `;
        const [resUpsert] = await connection.execute(query, [id, email, nama, role, pj, kecamatan, nilai, kategori, row.catatan || null]);
        if (resUpsert.affectedRows === 1) {
          inserted++;
        } else {
          updated++;
        }
      } else {
        const query = `
          INSERT IGNORE INTO mitra_evaluations 
          (id, email, nama, role, pj, kecamatan, nilai, kategori, catatan)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [resIns] = await connection.execute(query, [id, email, nama, role, pj, kecamatan, nilai, kategori, row.catatan || null]);
        if (resIns.affectedRows > 0) inserted++;
      }
    }

    await connection.commit();
    res.json({
      success: true,
      inserted,
      updated,
      message: `Berhasil memproses import data mitra (${updated} data diperbarui, ${inserted} mitra baru ditambahkan).`
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error importing mitra:', error);
    res.status(500).json({ error: 'Gagal memproses import data: ' + error.message });
  } finally {
    connection.release();
  }
});

// POST /api/mitra/seed - Reset / re-seed data awal
router.post('/seed', async (req, res) => {
  try {
    const initialJsonPath = path.join(__dirname, '../../public/data/initial_mitra_se2026.json');
    if (!fs.existsSync(initialJsonPath)) {
      return res.status(404).json({ error: 'Berkas initial_mitra_se2026.json tidak ditemukan' });
    }

    const mitraList = JSON.parse(fs.readFileSync(initialJsonPath, 'utf8'));
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      for (const m of mitraList) {
        const id = m.id || `${String(m.email).toLowerCase()}_${String(m.role || 'ppl').toLowerCase()}`;
        await connection.execute(`
          INSERT INTO mitra_evaluations 
          (id, email, nama, role, pj, kecamatan, nilai, kategori, catatan)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          nama = VALUES(nama),
          role = VALUES(role),
          pj = VALUES(pj),
          kecamatan = VALUES(kecamatan)
        `, [
          id,
          m.email,
          m.nama,
          m.role || 'PPL',
          m.pj || '-',
          m.kecamatan || '-',
          m.nilai !== undefined ? m.nilai : null,
          m.kategori || null,
          m.catatan || ''
        ]);
      }
      await connection.commit();
      res.json({ success: true, message: `Berhasil re-seed ${mitraList.length} mitra awal.` });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error seeding mitra:', error);
    res.status(500).json({ error: 'Gagal seeding mitra: ' + error.message });
  }
});

module.exports = router;

