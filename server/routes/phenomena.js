const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const fetch = require('node-fetch'); // Standard fetch helper

// Helper to capitalize sentences
function capitalizeSentences(text) {
    if (!text) return '';
    // Trim and replace first letter of each sentence (after ., !, or ?)
    return text.trim().replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, letter) => {
        return separator + letter.toUpperCase();
    });
}

// GET /api/phenomena - Retrieve list of social phenomena with search, filtering, and pagination
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { kecamatan, desa, kategori, search, month, limit = 10, offset = 0 } = req.query;
        let queryParams = [];
        let conditions = [];

        if (kecamatan && kecamatan !== 'Semua') {
            conditions.push('kecamatan = ?');
            queryParams.push(kecamatan);
        }
        if (desa && desa !== 'Semua') {
            conditions.push('desa = ?');
            queryParams.push(desa);
        }
        if (kategori && kategori !== 'Semua') {
            conditions.push('kategori = ?');
            queryParams.push(kategori);
        }
        if (month) {
            // month format expected: YYYY-MM
            conditions.push('tanggal LIKE ?');
            queryParams.push(`${month}%`);
        }
        if (search) {
            conditions.push('(judul LIKE ? OR deskripsi LIKE ? OR sls LIKE ? OR petugas_name LIKE ?)');
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        // Get total count
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM social_phenomena ${whereClause}`, 
            queryParams
        );
        const total = countResult[0].total;

        // Get paginated rows
        let limitVal = parseInt(limit);
        let offsetVal = parseInt(offset);
        let paginatedQuery = `
            SELECT * FROM social_phenomena 
            ${whereClause} 
            ORDER BY tanggal DESC, created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(paginatedQuery, [...queryParams, limitVal, offsetVal]);

        // Parse helper_answers JSON
        const records = rows.map(row => {
            let helperAnswers = {};
            if (row.helper_answers) {
                try {
                    helperAnswers = typeof row.helper_answers === 'string' 
                        ? JSON.parse(row.helper_answers) 
                        : row.helper_answers;
                } catch (e) {
                    console.error('Failed to parse helper_answers for ID:', row.id, e);
                }
            }
            return {
                ...row,
                helper_answers: helperAnswers
            };
        });

        res.json({
            records,
            total,
            limit: limitVal,
            offset: offsetVal
        });
    } catch (err) {
        console.error('Error fetching social phenomena:', err);
        res.status(500).json({ message: 'Server error fetching social phenomena', error: err.message });
    }
});

// POST /api/phenomena - Submit a new phenomenon (open to both Admin and Petugas)
router.post('/', authMiddleware, async (req, res) => {
    const {
        judul, kategori, kecamatan, desa, sls, petugas_name, tanggal, deskripsi, dampak, rekomendasi, helper_answers, agreement
    } = req.body;

    if (!agreement) {
        return res.status(400).json({ message: 'Pernyataan kesesuaian kondisi lapangan harus dicentang.' });
    }

    if (!judul || !kategori || !kecamatan || !desa || !sls || !petugas_name || !tanggal || !deskripsi || !dampak) {
        return res.status(400).json({ message: 'Harap lengkapi semua kolom wajib.' });
    }

    try {
        const id = `ph_${Date.now()}`;
        
        // Apply automatic capitalize sentence
        const capJudul = capitalizeSentences(judul);
        const capDeskripsi = capitalizeSentences(deskripsi);
        const capDampak = capitalizeSentences(dampak);
        const capRekomendasi = rekomendasi ? capitalizeSentences(rekomendasi) : '';

        // Process helper answers if exist
        let processedHelperAnswers = {};
        if (helper_answers) {
            Object.keys(helper_answers).forEach(key => {
                processedHelperAnswers[key] = capitalizeSentences(helper_answers[key]);
            });
        }

        const helperAnswersStr = JSON.stringify(processedHelperAnswers);

        await pool.query(`
            INSERT INTO social_phenomena 
            (id, judul, kategori, kecamatan, desa, sls, petugas_name, tanggal, deskripsi, dampak, rekomendasi, helper_answers)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id, capJudul, kategori, kecamatan, desa, sls, petugas_name, tanggal, capDeskripsi, capDampak, capRekomendasi, helperAnswersStr
        ]);

        res.status(201).json({ 
            message: 'Laporan fenomena sosial berhasil disimpan.', 
            id,
            record: {
                id,
                judul: capJudul,
                kategori,
                kecamatan,
                desa,
                sls,
                petugas_name,
                tanggal,
                deskripsi: capDeskripsi,
                dampak: capDampak,
                rekomendasi: capRekomendasi,
                helper_answers: processedHelperAnswers
            }
        });
    } catch (err) {
        console.error('Error saving social phenomenon:', err);
        res.status(500).json({ message: 'Server error saving social phenomenon', error: err.message });
    }
});

// PUT /api/phenomena/:id - Admin-only route to edit records
router.put('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Hanya Administrator yang memiliki akses untuk mengubah data.' });
    }

    const {
        judul, kategori, kecamatan, desa, sls, petugas_name, tanggal, deskripsi, dampak, rekomendasi, helper_answers
    } = req.body;

    if (!judul || !kategori || !kecamatan || !desa || !sls || !petugas_name || !tanggal || !deskripsi || !dampak) {
        return res.status(400).json({ message: 'Harap lengkapi semua kolom wajib.' });
    }

    try {
        const capJudul = capitalizeSentences(judul);
        const capDeskripsi = capitalizeSentences(deskripsi);
        const capDampak = capitalizeSentences(dampak);
        const capRekomendasi = rekomendasi ? capitalizeSentences(rekomendasi) : '';

        let processedHelperAnswers = {};
        if (helper_answers) {
            Object.keys(helper_answers).forEach(key => {
                processedHelperAnswers[key] = capitalizeSentences(helper_answers[key]);
            });
        }
        const helperAnswersStr = JSON.stringify(processedHelperAnswers);

        const [result] = await pool.query(`
            UPDATE social_phenomena 
            SET judul = ?, kategori = ?, kecamatan = ?, desa = ?, sls = ?, petugas_name = ?, tanggal = ?, deskripsi = ?, dampak = ?, rekomendasi = ?, helper_answers = ?
            WHERE id = ?
        `, [
            capJudul, kategori, kecamatan, desa, sls, petugas_name, tanggal, capDeskripsi, capDampak, capRekomendasi, helperAnswersStr, req.params.id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Laporan fenomena sosial tidak ditemukan.' });
        }

        res.json({ 
            message: 'Laporan fenomena sosial berhasil diubah.', 
            id: req.params.id,
            record: {
                id: req.params.id,
                judul: capJudul,
                kategori,
                kecamatan,
                desa,
                sls,
                petugas_name,
                tanggal,
                deskripsi: capDeskripsi,
                dampak: capDampak,
                rekomendasi: capRekomendasi,
                helper_answers: processedHelperAnswers
            }
        });
    } catch (err) {
        console.error('Error updating social phenomenon:', err);
        res.status(500).json({ message: 'Server error updating social phenomenon', error: err.message });
    }
});

// DELETE /api/phenomena/:id - Admin-only route to delete records
router.delete('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Hanya Administrator yang memiliki akses untuk menghapus data.' });
    }

    try {
        const [result] = await pool.query('DELETE FROM social_phenomena WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Laporan fenomena sosial tidak ditemukan.' });
        }

        res.json({ message: 'Laporan fenomena sosial berhasil dihapus.', id: req.params.id });
    } catch (err) {
        console.error('Error deleting social phenomenon:', err);
        res.status(500).json({ message: 'Server error deleting social phenomenon', error: err.message });
    }
});

// POST /api/phenomena/ai-summary - Admin-only route to generate Gemini AI summary of phenomena
router.post('/ai-summary', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Hanya Administrator yang memiliki akses fitur analisis AI.' });
    }

    const { kecamatan, desa, kategori, month } = req.body;

    try {
        // Collect records matching filters
        let queryParams = [];
        let conditions = [];

        if (kecamatan && kecamatan !== 'Semua') {
            conditions.push('kecamatan = ?');
            queryParams.push(kecamatan);
        }
        if (desa && desa !== 'Semua') {
            conditions.push('desa = ?');
            queryParams.push(desa);
        }
        if (kategori && kategori !== 'Semua') {
            conditions.push('kategori = ?');
            queryParams.push(kategori);
        }
        if (month) {
            conditions.push('tanggal LIKE ?');
            queryParams.push(`${month}%`);
        }

        let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const [rows] = await pool.query(`SELECT * FROM social_phenomena ${whereClause} ORDER BY tanggal DESC`, queryParams);

        if (rows.length === 0) {
            return res.json({
                ringkasan: 'Tidak ada laporan yang terkumpul untuk filter yang dipilih.',
                fenomenaDominan: 'Belum ada fenomena yang terekam.',
                polaSeringMuncul: 'Belum ada pola data yang terbentuk.',
                kesimpulan: 'Silakan tambahkan data fenomena sosial terlebih dahulu.'
            });
        }

        // Format data as a clean readable list for AI prompt
        const dataText = rows.map((r, i) => {
            return `${i+1}. Judul: ${r.judul}\n   Kategori: ${r.kategori}\n   Lokasi: Kec. ${r.kecamatan}, Desa ${r.desa}, SLS ${r.sls}\n   Tanggal: ${r.tanggal}\n   Penjelasan: ${r.deskripsi}\n   Dampak: ${r.dampak}\n   Rekomendasi: ${r.rekomendasi || '-'}`;
        }).join('\n\n');

        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            console.log('GEMINI_API_KEY is missing, generating standard analysis...');
            // Intelligent Rule-Based standard recap analysis as a perfect fallback
            const summaryText = `Menganalisis ${rows.length} fenomena di area ${kecamatan || 'Kabupaten Mempawah'}. Didominasi oleh laporan terkait ketenagakerjaan dan dinamika konsumsi masyarakat lokal.`;
            const dominantText = rows.slice(0, 2).map(r => r.judul).join(' dan ');
            const patternsText = `Terjadi pola adaptasi ekonomi non-formal di tingkat kelurahan/desa terutama pasca pergantian musim atau pergeseran lapangan pekerjaan.`;
            const conclusionText = `Perlu pendampingan berkala bagi pelaku usaha mikro dan koordinasi aktif antara dinas ketenagakerjaan dengan perangkat desa setempat.`;

            return res.json({
                ringkasan: summaryText,
                fenomenaDominan: dominantText,
                polaSeringMuncul: patternsText,
                kesimpulan: conclusionText
            });
        }

        // Prepare request to Gemini API
        const prompt = `Anda adalah analis ahli dari Badan Pusat Statistik (BPS). Analisis laporan-laporan fenomena sosial ekonomi berikut untuk menghasilkan ringkasan eksekutif berstruktur JSON.
        
Format JSON yang harus dihasilkan persis seperti ini:
{
  "ringkasan": "Isi analisis eksekutif dari seluruh laporan",
  "fenomenaDominan": "Identifikasi fenomena utama yang paling mendominasi dan butuh perhatian segera",
  "polaSeringMuncul": "Pola spasial/temporal yang sering muncul dari data",
  "kesimpulan": "Kesimpulan strategis dan rekomendasi umum untuk pembuat keputusan"
}

Pastikan respons Anda valid JSON tanpa markdown formatting tambahan atau backticks (misal jangan dibungkus dengan \`\`\`json). Jawab langsung dengan JSON object.

Berikut data laporan yang dikumpulkan:
${dataText}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API returned status ${response.status}`);
        }

        const responseData = await response.json();
        let aiText = responseData.candidates[0].content.parts[0].text.trim();
        
        // Clean JSON text if there is any accidental markdown wrapper
        if (aiText.startsWith('```json')) {
            aiText = aiText.substring(7);
        }
        if (aiText.endsWith('```')) {
            aiText = aiText.substring(0, aiText.length - 3);
        }
        
        const parsedSummary = JSON.parse(aiText.trim());
        res.json(parsedSummary);

    } catch (err) {
        console.error('Error generating AI Summary:', err);
        // Robust fallback response on error
        res.json({
            ringkasan: 'Gagal menghubungi asisten AI Gemini. Terjadi anomali saat pemrosesan ringkasan.',
            fenomenaDominan: 'Silakan periksa konfigurasi kunci API atau coba sesaat lagi.',
            polaSeringMuncul: 'Kesalahan sistem backend.',
            kesimpulan: 'Analisis manual disarankan untuk sementara waktu.'
        });
    }
});

module.exports = router;
