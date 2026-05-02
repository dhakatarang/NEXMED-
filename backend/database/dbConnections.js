// backend/database/dbConnections.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Determine storage location
const isRender = !!process.env.RENDER;
const isProduction = process.env.NODE_ENV === 'production';

let dbDir;
if (isRender) {
  // On Render, use the persistent disk mounted at /data
  dbDir = '/data';
  console.log('📊 Running on Render - using persistent storage at /data');
} else {
  // Local development
  dbDir = path.join(__dirname, '../databases');
}

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`📁 Created database directory: ${dbDir}`);
}

// Ensure uploads directories exist (use persistent storage on Render)
let uploadsBaseDir;
if (isRender) {
  uploadsBaseDir = path.join('/data', 'uploads');
} else {
  uploadsBaseDir = path.join(__dirname, '../uploads');
}

const uploadsDirs = [
  uploadsBaseDir,
  path.join(uploadsBaseDir, 'items'),
  path.join(uploadsBaseDir, 'profiles'),
  path.join(uploadsBaseDir, 'licenses'),
  path.join(uploadsBaseDir, 'scans')
];

uploadsDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created uploads directory: ${dir}`);
  }
});

// Database file path - store on persistent disk
const dbPath = path.join(dbDir, 'nexmed.db');
console.log('📊 Database path:', dbPath);

// Create database connection
const mainDB = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    // Enable foreign keys and WAL mode for better performance
    mainDB.run('PRAGMA foreign_keys = ON');
    mainDB.run('PRAGMA journal_mode = WAL');
    mainDB.run('PRAGMA synchronous = NORMAL'); // Good balance of safety and performance
  }
});

// Export both database connection AND uploads path for other modules
module.exports = {
  mainDB,
  authDB: mainDB,
  medicinesDB: mainDB,
  equipmentsDB: mainDB,
  donateRentDB: mainDB,
  profileDB: mainDB,
  dbPaths: { main: dbPath },
  uploadsBaseDir: uploadsBaseDir  // Export this so other modules know where to store files
};