require('dotenv').config();
const { runDailySnapshot } = require('./cron.js');

async function testCron() {
  console.log('Menjalankan Log Submit Harian (Otomatis) secara manual untuk testing...');
  await runDailySnapshot();
  console.log('Selesai.');
  process.exit(0);
}

testCron();
