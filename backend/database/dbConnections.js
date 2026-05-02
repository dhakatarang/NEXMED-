// backend/database/dbConnections.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Simple working configuration for Render free tier
const isRender = !!process.env.RENDER;

let dbDir;
let uploadsBaseDir;

if (isRender) {
  // Use app's own directory - it's writable on free tier
  dbDir = path.join(__dirname, '../data');
  uploadsBaseDir = path.join(__dirname, '../uploads');
  console.log('📊 Render free tier mode - using app directory');
} else {
  dbDir = path.join(__dirname, '../databases');
  uploadsBaseDir = path.join(__dirname, '../uploads');
}

// Create directories
[dbDir, uploadsBaseDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created: ${dir}`);
    } catch(e) { console.error(`Failed: ${dir}`, e.message); }
  }
});

// Create upload subdirectories
['items', 'profiles', 'licenses', 'scans'].forEach(sub => {
  const dir = path.join(uploadsBaseDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const dbPath = path.join(dbDir, 'nexmed.db');
console.log('📊 Database:', dbPath);

const mainDB = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ DB Error:', err.message);
  } else {
    console.log('✅ Database connected');
    mainDB.run('PRAGMA foreign_keys = ON');
  }
});

module.exports = {
  mainDB,
  authDB: mainDB,
  medicinesDB: mainDB,
  equipmentsDB: mainDB,
  donateRentDB: mainDB,
  profileDB: mainDB,
  dbPaths: { main: dbPath },
  uploadsBaseDir: uploadsBaseDir
};