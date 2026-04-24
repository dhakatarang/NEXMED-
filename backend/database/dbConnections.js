// backend/database/dbConnections.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure databases directory exists
const dbDir = path.join(__dirname, '../databases');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Created databases directory');
}

// Ensure uploads directories exist
const uploadsDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/items'),
  path.join(__dirname, '../uploads/profiles'),
  path.join(__dirname, '../uploads/licenses')
];

uploadsDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created uploads directory: ${dir}`);
  }
});

// Database file path
const dbPath = path.join(dbDir, 'nexmed.db');
console.log('📊 Database path:', dbPath);

// Create database connection
const mainDB = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    // Enable foreign keys
    mainDB.run('PRAGMA foreign_keys = ON');
    mainDB.run('PRAGMA journal_mode = WAL');
  }
});

module.exports = {
  mainDB,
  authDB: mainDB,
  medicinesDB: mainDB,
  equipmentsDB: mainDB,
  donateRentDB: mainDB,
  profileDB: mainDB,
  dbPaths: { main: dbPath }
};