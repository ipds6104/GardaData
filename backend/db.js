const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'garda_data',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
async function initDB() {
  try {
    const connection = await pool.getConnection();
    
    // Tabel Luas Bangunan
    await connection.query(`
      CREATE TABLE IF NOT EXISTS building_measurements (
        id VARCHAR(255) PRIMARY KEY,
        petugasId VARCHAR(255) NOT NULL,
        petugasName VARCHAR(255),
        timestamp BIGINT NOT NULL,
        geojson JSON NOT NULL,
        luasAtap FLOAT NOT NULL,
        jumlahLantai INT NOT NULL,
        jenisBangunan VARCHAR(255) NOT NULL,
        perkiraanLuasLantai FLOAT NOT NULL,
        longitude DOUBLE,
        latitude DOUBLE,
        metodeDigitasi VARCHAR(50),
        syncStatus VARCHAR(50) DEFAULT 'synced',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Auto-migrate column name if it exists
    try {
      await connection.query(`ALTER TABLE building_measurements CHANGE luasTapak luasAtap FLOAT NOT NULL`);
      console.log('✅ Migrated column luasTapak to luasAtap');
    } catch (e) {
      // Column probably already migrated or doesn't exist, ignore
    }

    // Tabel Monitoring Configs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS monitoring_configs (
        id VARCHAR(255) PRIMARY KEY,
        kegiatan VARCHAR(255) NOT NULL,
        subKegiatan VARCHAR(255),
        sheetUrl TEXT NOT NULL,
        sheetName VARCHAR(255) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        isActive BOOLEAN DEFAULT true,
        isArchived BOOLEAN DEFAULT false,
        icon VARCHAR(50) DEFAULT 'pertanian',
        color VARCHAR(50) DEFAULT 'emerald',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Auto-migrate to add isArchived if missing
    try {
      await connection.query(`ALTER TABLE monitoring_configs ADD COLUMN isArchived BOOLEAN DEFAULT false`);
      console.log('✅ Added isArchived column to monitoring_configs');
    } catch (e) {
      // Column probably already exists, ignore
    }

    // Auto-migrate to add icon and color if missing
    try {
      await connection.query(`ALTER TABLE monitoring_configs ADD COLUMN icon VARCHAR(50) DEFAULT 'pertanian', ADD COLUMN color VARCHAR(50) DEFAULT 'emerald'`);
      console.log('✅ Added icon and color columns to monitoring_configs');
    } catch (e) {
      // Columns probably already exist, ignore
    }

    // Tabel Monitoring Snapshots
    await connection.query(`
      CREATE TABLE IF NOT EXISTS monitoring_snapshots (
        id VARCHAR(255) PRIMARY KEY,
        configId VARCHAR(255) NOT NULL,
        snapshotDate DATE NOT NULL,
        totalSubmit INT NOT NULL,
        totalDraft INT NOT NULL,
        totalTarget INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_snapshot (configId, snapshotDate)
      )
    `);

    // Tabel LMS Trainings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lms_trainings (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        startDate DATE,
        endDate DATE,
        period VARCHAR(100),
        icon VARCHAR(50) DEFAULT 'pendidikan',
        isActive BOOLEAN DEFAULT true,
        buttons JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabel Cerdas Report Links
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cerdas_report_links (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        isOpen BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables verified/created successfully.');
    
    // Tabel Monitoring Log Harian (Per PPL)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS monitoring_log_harian (
        id VARCHAR(255) PRIMARY KEY,
        configId VARCHAR(255) NOT NULL,
        tanggalUpdate DATE NOT NULL,
        pml VARCHAR(255),
        ppl VARCHAR(255),
        submit INT DEFAULT 0,
        draft INT DEFAULT 0,
        approve INT DEFAULT 0,
        total INT DEFAULT 0,
        statusSiklus VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_log (configId, tanggalUpdate, ppl),
        INDEX idx_config_tanggal (configId, tanggalUpdate)
      )
    `);

    // Ensure UNIQUE KEY exists if table was already created without it
    try {
      await connection.query(`ALTER TABLE monitoring_log_harian ADD UNIQUE KEY unique_log (configId, tanggalUpdate, ppl)`);
    } catch (e) {
      // Key probably already exists or table has duplicates
    }

    // Ensure approve column exists
    try {
      await connection.query(`ALTER TABLE monitoring_log_harian ADD COLUMN approve INT DEFAULT 0`);
    } catch (e) {
      // Column probably already exists
    }

    // Tabel Monitoring Data Live
    await connection.query(`
      CREATE TABLE IF NOT EXISTS monitoring_data_live (
        id VARCHAR(255) PRIMARY KEY,
        configId VARCHAR(255) NOT NULL,
        kodeWilayah VARCHAR(50),
        namaPpl VARCHAR(255),
        namaPml VARCHAR(255),
        kecamatan VARCHAR(255),
        desa VARCHAR(255),
        sls VARCHAR(255),
        submit INT DEFAULT 0,
        draft INT DEFAULT 0,
        approve INT DEFAULT 0,
        reject INT DEFAULT 0,
        open INT DEFAULT 0,
        target INT DEFAULT 0,
        totalSubmit INT DEFAULT 0,
        lastSynced TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_live_row (configId, kodeWilayah, namaPpl, namaPml, kecamatan, desa, sls),
        INDEX idx_live_config (configId)
      )
    `);

    // Tabel Imputation Data
    await connection.query(`
      CREATE TABLE IF NOT EXISTS imputation_data (
        id VARCHAR(255) PRIMARY KEY,
        data JSON NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabel Monitoring SLS Status (Persetujuan Admin)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS monitoring_sls_status (
        id VARCHAR(255) PRIMARY KEY,
        configId VARCHAR(255) NOT NULL,
        kecamatan VARCHAR(255) NOT NULL,
        desa VARCHAR(255) NOT NULL,
        sls VARCHAR(255) NOT NULL,
        isSelesai BOOLEAN DEFAULT false,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_status (configId, kecamatan, desa, sls),
        INDEX idx_status_config (configId)
      )
    `);

    // Tabel Users (untuk auth lokal)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','petugas','pengunjung') DEFAULT 'petugas',
        name VARCHAR(255),
        kecamatan VARCHAR(255),
        desa VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Auto-migrate: tambahkan kolom kecamatan/desa ke users jika belum ada
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN kecamatan VARCHAR(255)`);
    } catch(e) { /* already exists */ }
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN desa VARCHAR(255)`);
    } catch(e) { /* already exists */ }

    // Tabel Infrastruktur Desa
    await connection.query(`
      CREATE TABLE IF NOT EXISTS infrastructure_items (
        id VARCHAR(255) PRIMARY KEY,
        category VARCHAR(255) NOT NULL,
        item TEXT NOT NULL,
        village VARCHAR(255) NOT NULL,
        source VARCHAR(255),
        year VARCHAR(10),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_infra_village (village),
        INDEX idx_infra_category (category)
      )
    `);

    // Tabel Statistik Kependudukan Desa
    await connection.query(`
      CREATE TABLE IF NOT EXISTS village_stats (
        id VARCHAR(255) PRIMARY KEY,
        village VARCHAR(255) NOT NULL,
        year VARCHAR(10),
        male VARCHAR(50),
        female VARCHAR(50),
        total VARCHAR(50),
        kk VARCHAR(50),
        agriFamily VARCHAR(50),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_stats_village (village)
      )
    `);

    // Tabel Fenomena Sosial Ekonomi
    await connection.query(`
      CREATE TABLE IF NOT EXISTS social_phenomenon (
        id VARCHAR(255) PRIMARY KEY,
        judul VARCHAR(500) NOT NULL,
        desa VARCHAR(255),
        kecamatan VARCHAR(255),
        isi TEXT,
        petugasId VARCHAR(255),
        petugasName VARCHAR(255),
        timestamp BIGINT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_social_desa (desa)
      )
    `);

    // Tabel Data Klasifikasi KBLI/KBJI (mapping pekerjaan)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS classifications (
        id VARCHAR(255) PRIMARY KEY,
        mjj_occtle TEXT NOT NULL,
        mjj_occmtd TEXT,
        mjj_bidang TEXT,
        mjj_kbji_label TEXT,
        mjj_kbli_label TEXT,
        updatedBy VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Tabel klasifikasi siap.');


    // Auto-migrate: tambahkan kolom totalSubmit jika belum ada
    try {
      await connection.query(`ALTER TABLE monitoring_data_live ADD COLUMN totalSubmit INT DEFAULT 0`);
      console.log('✅ Added totalSubmit column to monitoring_data_live');
    } catch (e) {
      // Column already exists, ignore
    }

    // Cleanup: hapus baris sampah/invalid (header/kosong) yang terlanjur masuk
    try {
      await connection.query(`
        DELETE FROM monitoring_data_live 
        WHERE sls = '' OR sls = 'Wilayah Tugas / SLS' OR namaPml = 'nama PML' OR namaPml IS NULL OR namaPml = ''
      `);
      console.log('✅ Cleaned up invalid rows from monitoring_data_live');
    } catch (e) {
      // Ignore
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Database Initialization Failed:', error);
  }
}

initDB();

module.exports = pool;
