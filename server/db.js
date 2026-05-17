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
        
        // 1. Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role ENUM('admin', 'petugas') NOT NULL DEFAULT 'petugas',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
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
        
        // Seed default admin if table is empty
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
        if (rows[0].count === 0) {
            console.log('Seeding default administrator into users table...');
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt); // Default password: admin123
            
            await pool.query(
                'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
                ['user_admin', 'admin', hashedPassword, 'Administrator BPS', 'admin']
            );
            console.log('Default admin seeded (username: admin, password: admin123)');
        }
        
        console.log('✔ MySQL Database and Tables initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize MySQL Database:', error.message);
        console.log('Please ensure that your MySQL server is running and the database specified in .env exists.');
    }
};

initDb();

module.exports = pool;
