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

    console.log('✅ Database tables verified/created successfully.');
    connection.release();
  } catch (error) {
    console.error('❌ Database Initialization Failed:', error);
  }
}

initDB();

module.exports = pool;
