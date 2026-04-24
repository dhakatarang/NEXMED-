// backend/server.js
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
const adminRoutes = require("./routes/adminRoutes"); // NEW: Admin routes

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

// Initialize databases when server starts
console.log("🔄 Initializing databases...");
initAllDatabases();
console.log("✅ Databases initialized successfully");

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your React app URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Public routes (no auth required)
app.get("/", (req, res) => {
  res.json({ 
    message: "NexMed Backend is Running ✅",
    version: "2.0",
    features: ["Enhanced Donate/Rent System", "Image Upload", "SQLite3 Database", "User Authentication", "Shopping Cart", "Admin Panel"],
    timestamp: new Date().toISOString()
  });
});

// Public debug routes
app.get("/api/debug-db", (req, res) => {
  const { mainDB } = require('./database/dbConnections');
  
  console.log("🔍 Checking database state...");
  
  const tableChecks = [
    { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
    { name: 'medicines', query: 'SELECT COUNT(*) as count FROM medicines' },
    { name: 'equipments', query: 'SELECT COUNT(*) as count FROM equipments' },
    { name: 'cart', query: 'SELECT COUNT(*) as count FROM cart' },
    { name: 'donaterent', query: 'SELECT COUNT(*) as count FROM donaterent' },
    { name: 'orders', query: 'SELECT COUNT(*) as count FROM orders' }
  ];

  let results = {};
  let completed = 0;

  tableChecks.forEach(({ name, query }) => {
    mainDB.get(query, [], (err, row) => {
      if (err) {
        results[name] = { error: err.message, status: 'error' };
      } else {
        results[name] = { count: row.count, status: 'ok' };
      }
      
      completed++;
      if (completed === tableChecks.length) {
        res.json({ 
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

// Protected API routes
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/donaterent", donaterentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes); // NEW: Admin routes

// 404 fallback
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ 
    success: false,
    message: "Internal Server Error", 
    error: err.message 
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/`);
  console.log(`🔍 Database debug: http://localhost:${PORT}/api/debug-db`);
  console.log(`👤 Profile test: http://localhost:${PORT}/api/profile/test`);
  console.log(`📁 Uploads served from: ${uploadsDir}`);
  console.log(`💊 Medicines API: http://localhost:${PORT}/api/medicines`);
  console.log(`🏥 Equipment API: http://localhost:${PORT}/api/equipments`);
  console.log(`🛒 Cart API: http://localhost:${PORT}/api/cart`);
  console.log(`👑 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`🤝 Donate/Rent API: http://localhost:${PORT}/api/donaterent`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👤 Profile API: http://localhost:${PORT}/api/profile`);
});