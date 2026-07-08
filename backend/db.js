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
        icon VARCHAR(50) DEFAULT 'pertanian',
        color VARCHAR(50) DEFAULT 'emerald',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        total INT DEFAULT 0,
        statusSiklus VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_config_tanggal (configId, tanggalUpdate)
      )
    `);
    
    connection.release();
  } catch (error) {
    console.error('❌ Database Initialization Failed:', error);
  }
}

initDB();

module.exports = pool;
