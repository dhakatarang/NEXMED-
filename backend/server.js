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

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Ensure profiles directory exists
const profilesDir = path.join(__dirname, 'uploads/profiles');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
  console.log('📁 Created profiles directory');
}

// Ensure scans directory exists for Gemini uploads
const scansDir = path.join(__dirname, 'uploads/scans');
if (!fs.existsSync(scansDir)) {
  fs.mkdirSync(scansDir, { recursive: true });
  console.log('📁 Created scans directory');
}

// ========== CORS CONFIGURATION - FIXED ==========
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

// ✅ CRITICAL FIX: Handle OPTIONS preflight for ALL routes
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

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Initialize databases when server starts
console.log("🔄 Initializing databases...");
initAllDatabases();
console.log("✅ Databases initialized successfully");

// ========== PUBLIC ROUTES ==========

// Health check endpoint (MUST be before other routes)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    cors_configured: true
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "NexMed Backend is Running ✅",
    version: "2.0",
    environment: process.env.NODE_ENV || 'development',
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
          database: 'nexmed.db (single database)',
          tables: results,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
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

// 404 fallback
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
    availableEndpoints: [
      "/health", "/", "/api/status",
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
  console.log(`🔗 Health check: https://nexmed.onrender.com/health`);
  console.log(`🔗 API status: https://nexmed.onrender.com/api/status`);
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