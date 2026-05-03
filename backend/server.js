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

// ========== ✅ FIXED CORS ==========
app.use(cors({
  origin: true, // allow all (safe for now)
  credentials: true
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
initAllDatabases();
console.log("✅ Databases initialized successfully");

// ========== ROUTES ==========

// Health
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Root
app.get("/", (req, res) => {
  res.json({
    message: "NexMed Backend is Running ✅",
    timestamp: new Date().toISOString()
  });
});

// API Status
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "API is running"
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/donaterent", donaterentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/equipment-scan", equipmentScanRoutes);

// ========== 404 ==========
app.use((req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});