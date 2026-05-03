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

// ========== STORAGE ==========
console.log('📁 Using persistent uploads directory:', uploadsBaseDir);

const dirs = ['profiles', 'scans', 'items', 'licenses'];

dirs.forEach(folder => {
  const dirPath = path.join(uploadsBaseDir, folder);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
});

// ========== ✅ FIXED CORS FOR PRODUCTION ==========
const allowedOrigins = [
  'https://nexmed-1.onrender.com',     // Your frontend URL
  'https://nexmed.onrender.com',        // Alternative frontend URL (if any)
  'http://localhost:5173',              // Local Vite dev server
  'http://localhost:3000',              // Alternative local dev port
  'http://localhost:5000'               // Common dev port
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      console.warn(`❌ CORS blocked request from: ${origin}`);
      return callback(new Error(msg), false);
    }
    console.log(`✅ CORS allowed request from: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ========== BODY PARSING ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== LOGGING ==========
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ========== STATIC FILES ==========
app.use('/uploads', express.static(uploadsBaseDir));

// ========== INIT DATABASE ==========
console.log("🔄 Initializing databases...");
try {
  initAllDatabases();
  console.log("✅ Databases initialized successfully");
} catch (error) {
  console.error("❌ Database initialization failed:", error);
  // Don't crash the server, but log the error
}

// ========== HEALTH CHECK ENDPOINTS ==========

// Simple health check (for Render)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed health check
app.get("/health/detailed", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "2.0",
    environment: process.env.NODE_ENV || "production",
    storageLocation: uploadsBaseDir
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "NexMed Backend is Running ✅",
    version: "2.0",
    environment: process.env.NODE_ENV || "production",
    storageLocation: "Persistent (data persists after restart)",
    features: [
      "Enhanced Donate/Rent System",
      "Image Upload",
      "SQLite3 Database",
      "User Authentication",
      "Shopping Cart",
      "Admin Panel",
      "AI Vision Scan"
    ],
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      medicines: "/api/medicines",
      equipments: "/api/equipments",
      scan: "/api/equipment-scan",
      cart: "/api/cart",
      profile: "/api/profile",
      donaterent: "/api/donaterent"
    },
    timestamp: new Date().toISOString()
  });
});

// API Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
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

// ========== 404 HANDLER ==========
app.use((req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  console.error("Error stack:", err.stack);
  
  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === "production";
  const errorMessage = isProduction 
    ? "Internal Server Error" 
    : err.message;
  
  res.status(500).json({
    success: false,
    message: errorMessage,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ========== START SERVER ==========
// Use Render's PORT or default to 10000 (Render's default)
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📁 Uploads directory: ${uploadsBaseDir}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("🛑 Received shutdown signal, closing server gracefully...");
  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error("❌ Could not close connections in time, forcing shutdown");
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error("💥 Uncaught Exception:", error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});

module.exports = app; // For testing purposes