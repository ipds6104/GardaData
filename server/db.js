const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'garda_data',
    port: parseInt(process.env.DB_PORT || '3306')
};

const pool = mysql.createPool(dbConfig);

// Initialize tables
const initDb = async () => {
    try {
        console.log(`Connecting to MySQL database: ${dbConfig.database} on ${dbConfig.host}...`);
        
        // 1. Create users table with SSO support (NIP & Email)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                nip VARCHAR(30) NULL,
                email VARCHAR(100) NULL,
                role ENUM('admin', 'petugas', 'petugas_pengolahan', 'pengunjung') NOT NULL DEFAULT 'petugas',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Safe migration for existing installations: add nip and email columns if missing
        try {
            const [colsNip] = await pool.query("SHOW COLUMNS FROM users LIKE 'nip'");
            if (colsNip.length === 0) {
                await pool.query("ALTER TABLE users ADD COLUMN nip VARCHAR(30) NULL AFTER name");
                console.log('✔ Migrated users table: Added nip column');
            }
        } catch (colErr) {
            console.warn('Note on users.nip column check:', colErr.message);
        }

        try {
            const [colsEmail] = await pool.query("SHOW COLUMNS FROM users LIKE 'email'");
            if (colsEmail.length === 0) {
                await pool.query("ALTER TABLE users ADD COLUMN email VARCHAR(100) NULL AFTER nip");
                console.log('✔ Migrated users table: Added email column');
            }
        } catch (colErr) {
            console.warn('Note on users.email column check:', colErr.message);
        }
        
        // 2. Create building_measurements table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS building_measurements (
                id VARCHAR(50) PRIMARY KEY,
                petugas_id VARCHAR(50) NOT NULL,
                petugas_name VARCHAR(100) NOT NULL,
                timestamp BIGINT NOT NULL,
                geojson LONGTEXT NOT NULL,
                luas_tapak DOUBLE NOT NULL,
                jumlah_lantai INT NOT NULL,
                jenis_bangunan VARCHAR(50) NOT NULL,
                perkiraan_luas_lantai DOUBLE NOT NULL,
                latitude DOUBLE NOT NULL,
                longitude DOUBLE NOT NULL,
                metode_digitasi VARCHAR(50) NOT NULL,
                sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
                synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 3. Create social_phenomena table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS social_phenomena (
                id VARCHAR(50) PRIMARY KEY,
                judul VARCHAR(255) NOT NULL,
                kategori VARCHAR(100) NOT NULL,
                kecamatan VARCHAR(100) NOT NULL,
                desa VARCHAR(100) NOT NULL,
                sls VARCHAR(255) NOT NULL,
                petugas_name VARCHAR(100) NOT NULL,
                tanggal DATE NOT NULL,
                deskripsi TEXT NOT NULL,
                dampak TEXT NOT NULL,
                rekomendasi TEXT,
                helper_answers JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_kecamatan (kecamatan),
                INDEX idx_desa (desa),
                INDEX idx_kategori (kategori),
                INDEX idx_tanggal (tanggal)
            )
        `);
        
        // Seed legacy external users (Petugas Pendataan & Pengolahan)
        // Per rule: Administrator role is now exclusively managed via Pegawai SSO rIDM
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(12);

        // Decommission legacy static admin user if present to prevent password backdoor
        try {
            const [oldAdmin] = await pool.query('SELECT id FROM users WHERE username = ?', ['admin']);
            if (oldAdmin.length > 0) {
                // Invalidate static password so it cannot be used with form login
                const disabledHash = await bcrypt.hash(`disabled_sso_migrated_${Date.now()}`, 12);
                await pool.query('UPDATE users SET password_hash = ? WHERE username = ?', [disabledHash, 'admin']);
                console.log('ℹ Legacy adminjosjis password decommissioned. Admin authentication is now managed via Pegawai SSO rIDM.');
            }
        } catch (e) {
            console.warn('Note on legacy admin decommissioning:', e.message);
        }

        const [petugasRows] = await pool.query('SELECT * FROM users WHERE username = ?', ['petugas']);
        if (petugasRows.length === 0) {
            console.log('Seeding default petugas into users table...');
            const hashedPassword = await bcrypt.hash('petugas6104', salt);
            await pool.query(
                'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
                ['user_petugas', 'petugas', hashedPassword, 'Petugas BPS', 'petugas']
            );
            console.log('Default petugas seeded (username: petugas, password: petugas6104)');
        }

        const [pengolahanRows] = await pool.query('SELECT * FROM users WHERE username = ?', ['petugas.pengolahan@josjis.com']);
        if (pengolahanRows.length === 0) {
            console.log('Seeding default petugas pengolahan into users table...');
            const hashedPassword = await bcrypt.hash('petugas.pengolahan', salt);
            await pool.query(
                'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
                ['user_pengolahan', 'petugas.pengolahan@josjis.com', hashedPassword, 'Petugas Pengolahan BPS', 'petugas_pengolahan']
            );
            console.log('Default petugas pengolahan seeded (username: petugas.pengolahan@josjis.com, password: petugas.pengolahan)');
        }
        
        console.log('✔ MySQL Database and Tables initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize MySQL Database:', error.message);
        console.log('Please ensure that your MySQL server is running and the database specified in .env exists.');
    }
};

initDb();

module.exports = pool;
