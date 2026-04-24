const { mainDB } = require('./database/dbConnections');
const fs = require('fs');
const path = require('path');

console.log('🔄 Resetting database...');

// Delete the database file to start fresh
const dbPath = path.join(__dirname, 'databases', 'nexmed.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Database file deleted');
} else {
  console.log('📊 Database file does not exist, creating new one...');
}

// Reinitialize databases
const { initAllDatabases } = require('./database/initDatabases');
setTimeout(() => {
  initAllDatabases();
  console.log('✅ Database reset completed. Restart your server.');
}, 1000);