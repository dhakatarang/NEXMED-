const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Import routes
const authRoutes = require("./routes/authRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const donaterentRoutes = require("./routes/donaterentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const cartRoutes = require("./routes/cartRoutes");
const adminRoutes = require("./routes/adminRoutes");
const equipmentScanRoutes = require("./routes/equipmentScanRoutes");

// Import database initialization
const { initAllDatabases } = require("./database/initDatabases");
const { uploadsBaseDir } = require("./database/dbConnections");

const app = express();

// ========== USE PERSISTENT STORAGE DIRECTORIES ==========
console.log('📁 Using persistent uploads directory:', uploadsBaseDir);

// Ensure all upload subdirectories exist in persistent storage
const profilesDir = path.join(uploadsBaseDir, 'profiles');
const scansDir = path.join(uploadsBaseDir, 'scans');
const itemsDir = path.join(uploadsBaseDir, 'items');
const licensesDir = path.join(uploadsBaseDir, 'licenses');

[profilesDir, scansDir, itemsDir, licensesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// ========== CORS CONFIGURATION ==========
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'https://nexmed-1.onrender.com',
  'https://nexmed.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked for origin:', origin);
      callback(null, true); // Still allow but log it
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
}));

// Handle OPTIONS preflight for ALL routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Add CORS headers manually as backup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve uploaded files statically from persistent storage
app.use('/uploads', express.static(uploadsBaseDir));

// Initialize databases when server starts
console.log("🔄 Initializing databases...");
initAllDatabases();
console.log("✅ Databases initialized successfully");

// ========== PUBLIC ROUTES ==========

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    storageLocation: process.env.RENDER ? '/data (persistent)' : 'local',
    cors_configured: true
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "NexMed Backend is Running ✅",
    version: "2.0",
    environment: process.env.NODE_ENV || 'development',
    storageLocation: process.env.RENDER ? 'Persistent (data persists after restart)' : 'Local',
    features: ["Enhanced Donate/Rent System", "Image Upload", "SQLite3 Database", "User Authentication", "Shopping Cart", "Admin Panel", "AI Vision Scan"],
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      medicines: "/api/medicines",
      equipments: "/api/equipments",
      scan: "/api/equipment-scan",
      cart: "/api/cart",
      profile: "/api/profile"
    },
    timestamp: new Date().toISOString()
  });
});

// API Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    storageLocation: process.env.RENDER ? '/data (persistent)' : 'local',
    timestamp: new Date().toISOString()
  });
});

// ========== API ROUTES ==========
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/donaterent", donaterentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/equipment-scan", equipmentScanRoutes);

// ========== DEBUG ENDPOINTS ==========
app.get("/api/debug-db", (req, res) => {
  const { mainDB } = require('./database/dbConnections');
  
  console.log("🔍 Checking database state...");
  
  const tableChecks = [
    { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
    { name: 'medicines', query: 'SELECT COUNT(*) as count FROM medicines' },
    { name: 'equipments', query: 'SELECT COUNT(*) as count FROM equipments' },
    { name: 'cart', query: 'SELECT COUNT(*) as count FROM cart' },
    { name: 'donaterent', query: 'SELECT COUNT(*) as count FROM donaterent' },
    { name: 'orders', query: 'SELECT COUNT(*) as count FROM orders' },
    { name: 'equipment_scans', query: 'SELECT COUNT(*) as count FROM equipment_scans' }
  ];

  let results = {};
  let completed = 0;

  tableChecks.forEach(({ name, query }) => {
    mainDB.get(query, [], (err, row) => {
      if (err) {
        results[name] = { error: err.message, status: 'error' };
      } else {
        results[name] = { count: row?.count || 0, status: 'ok' };
      }
      
      completed++;
      if (completed === tableChecks.length) {
        res.json({ 
          success: true,
          message: 'Database status check completed',
          database: 'nexmed.db (persistent storage)',
          storageLocation: process.env.RENDER ? '/data/nexmed.db' : 'local',
          tables: results,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
});

// Test persistence endpoint
app.get("/api/test-persistence", (req, res) => {
  const { mainDB, uploadsBaseDir } = require('./database/dbConnections');
  const fs = require('fs');
  const path = require('path');
  
  const testFile = path.join(uploadsBaseDir, 'test.txt');
  const testMessage = `Persistence test at ${new Date().toISOString()}`;
  
  try {
    // Write test file
    fs.writeFileSync(testFile, testMessage);
    
    // Read it back
    const content = fs.readFileSync(testFile, 'utf8');
    
    // Check database
    mainDB.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      res.json({
        success: true,
        message: "Persistence test completed",
        fileWritten: testMessage,
        fileRead: content,
        userCount: row?.count || 0,
        storageLocation: process.env.RENDER ? '/data on Render (persistent)' : 'local',
        uploadsPath: uploadsBaseDir,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      storageLocation: process.env.RENDER ? '/data on Render' : 'local'
    });
  }
});

// Test profile endpoint directly
app.get("/api/profile/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Profile API endpoint is working!",
    timestamp: new Date().toISOString()
  });
});

// ========== ERROR HANDLING ==========
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'NexMed API is running',
    version: '2.0',
    endpoints: {
      auth: '/api/auth',
      medicines: '/api/medicines',
      equipments: '/api/equipments',
      donaterent: '/api/donaterent',
      profile: '/api/profile',
      cart: '/api/cart',
      admin: '/api/admin',
      scan: '/api/equipment-scan'
    },
    documentation: 'https://nexmed.onrender.com/health',
    timestamp: new Date().toISOString()
  });
});
// 404 fallback
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
    availableEndpoints: [
      "/health", "/", "/api/status", "/api/test-persistence", "/api/debug-db",
      "/api/auth/*", "/api/medicines/*", "/api/equipments/*",
      "/api/equipment-scan/*", "/api/cart/*", "/api/profile/*"
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ 
    success: false,
    message: "Internal Server Error", 
    error: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong"
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5001;

// Important: Bind to 0.0.0.0 for Render
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Storage location: ${process.env.RENDER ? '/data (PERSISTENT)' : 'Local'}`);
  console.log(`🔗 Health check: https://nexmed.onrender.com/health`);
  console.log(`🔗 API status: https://nexmed.onrender.com/api/status`);
  console.log(`🔗 Test persistence: https://nexmed.onrender.com/api/test-persistence`);
  console.log(`🤖 Gemini Vision: ${process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Not configured ⚠️'}`);
  console.log(`📊 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;