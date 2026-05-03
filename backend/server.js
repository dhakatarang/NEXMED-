const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

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

// Import services
const geminiVisionService = require("./services/geminiVisionService");
const { processOCR, extractMedicineDetails } = require("./services/ocrService");

const app = express();

// ========== MULTER CONFIGURATION FOR TEMP FILES ==========
const tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "temp-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadTemp = multer({
  storage: tempStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// ========== STORAGE ==========
console.log("📁 Using persistent uploads directory:", uploadsBaseDir);

const dirs = ["profiles", "scans", "items", "licenses"];

dirs.forEach((folder) => {
  const dirPath = path.join(uploadsBaseDir, folder);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
});

// Create temp directory
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`📁 Created temp directory: ${tempDir}`);
}

// ========== ✅ CORS FOR LOCAL DEVELOPMENT ==========
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ========== BODY PARSING ==========
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ========== LOGGING ==========
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ========== STATIC FILES ==========
app.use("/uploads", express.static(uploadsBaseDir));

// ========== INIT DATABASE ==========
console.log("🔄 Initializing databases...");
try {
  initAllDatabases();
  console.log("✅ Databases initialized successfully");
} catch (error) {
  console.error("❌ Database initialization failed:", error);
}

// ========== AUTHENTICATION MIDDLEWARE ==========
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

// ========== HEALTH CHECK ENDPOINTS ==========
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "NexMed Backend is Running ✅",
    version: "2.0",
    environment: "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// ========== OCR ENDPOINT FOR MEDICINES ==========
app.post(
  "/api/medicines/ocr-process",
  authenticateToken,
  uploadTemp.single("image"),
  async (req, res) => {
    let tempImagePath = null;

    try {
      console.log("🔍 Starting OCR processing for medicine");

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image of the medicine",
        });
      }

      tempImagePath = req.file.path;
      console.log(`📸 Processing image: ${tempImagePath}`);

      // Process OCR
      const ocrText = await processOCR(tempImagePath);
      console.log(`📝 OCR Text extracted (${ocrText.length} characters)`);

      const medicineDetails = extractMedicineDetails(ocrText);

      // Clean up temp file
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
        console.log("🧹 Cleaned up temp file");
      }

      res.json({
        success: true,
        message: "OCR processing completed",
        ocrResults: medicineDetails,
        extractedText: ocrText.substring(0, 500), // Send first 500 chars for preview
      });
    } catch (error) {
      console.error("💥 OCR Error:", error);

      // Clean up temp file if it exists
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }

      res.status(500).json({
        success: false,
        message: "OCR processing failed",
        error: error.message,
      });
    }
  }
);

// ========== GEMINI AI ENDPOINT FOR EQUIPMENT ==========
app.post(
  "/api/equipments/analyze-with-gemini",
  authenticateToken,
  uploadTemp.single("image"),
  async (req, res) => {
    let tempImagePath = null;

    try {
      console.log("🤖 Starting Gemini analysis for equipment");

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload an image of the equipment",
        });
      }

      tempImagePath = req.file.path;
      const equipmentName = req.body.name || "medical equipment";
      const userDescription = req.body.description || "";

      console.log(`📸 Analyzing equipment: ${equipmentName}`);
      console.log(`📁 Image path: ${tempImagePath}`);

      // Call Gemini Vision Service
      const analysisResult = await geminiVisionService.analyzeEquipmentCondition(
        tempImagePath,
        equipmentName,
        userDescription
      );

      // Clean up temp file
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
        console.log("🧹 Cleaned up temp file");
      }

      if (!analysisResult.success) {
        return res.status(500).json({
          success: false,
          message: "AI analysis failed",
          error: analysisResult.error,
        });
      }

      // Calculate suggested prices based on condition
      const suggestedPrices = calculateSuggestedPrices(
        equipmentName,
        analysisResult.analysis.overallCondition
      );

      res.json({
        success: true,
        message: "Equipment analysis completed successfully",
        analysis: {
          overallCondition: analysisResult.analysis.overallCondition,
          confidence: analysisResult.analysis.confidence,
          detailedAnalysis: analysisResult.analysis.detailedAnalysis,
          summary: analysisResult.analysis.summary,
          recommendations: analysisResult.analysis.recommendations,
          estimatedLifespan: analysisResult.analysis.estimatedLifespan,
          safetyScore: analysisResult.analysis.safetyScore,
          suggestedPrice: suggestedPrices.salePrice,
          suggestedRentPrice: suggestedPrices.rentPrice,
        },
        rawAnalysis: analysisResult.rawResponse,
        timestamp: analysisResult.timestamp,
      });
    } catch (error) {
      console.error("💥 Gemini Analysis Error:", error);

      // Clean up temp file if it exists
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }

      res.status(500).json({
        success: false,
        message: "Error analyzing equipment with AI",
        error: error.message,
      });
    }
  }
);

// Helper function to calculate suggested prices
function calculateSuggestedPrices(equipmentName, condition) {
  const basePrice = getBasePrice(equipmentName);
  const conditionMultiplier = {
    excellent: 0.9,
    good: 0.7,
    fair: 0.5,
    poor: 0.3,
    critical: 0.1,
  };

  const multiplier = conditionMultiplier[condition] || 0.5;
  const salePrice = Math.round(basePrice * multiplier);
  const rentPrice = Math.round(salePrice * 0.04); // Daily rent is 4% of sale price

  return { salePrice, rentPrice };
}

function getBasePrice(equipmentName) {
  const name = equipmentName.toLowerCase();
  if (name.includes("wheelchair")) return 15000;
  if (name.includes("hospital bed")) return 25000;
  if (name.includes("oxygen concentrator")) return 35000;
  if (name.includes("cpap")) return 40000;
  if (name.includes("monitor")) return 20000;
  if (name.includes("ventilator")) return 50000;
  if (name.includes("infusion pump")) return 15000;
  if (name.includes("nebulizer")) return 3000;
  if (name.includes("sphygmomanometer")) return 1500;
  if (name.includes("stethoscope")) return 2000;
  return 10000; // Default base price
}

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
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ========== CLEANUP INTERVAL FOR TEMP FILES ==========
setInterval(() => {
  const tempDir = path.join(__dirname, "temp");
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      // Delete files older than 1 hour
      if (now - stats.mtimeMs > 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Cleaned up old temp file: ${file}`);
      }
    });
  }
}, 60 * 60 * 1000); // Run every hour

// ========== START SERVER ==========
const PORT = process.env.PORT || 5001;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📍 Environment: development`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Uploads directory: ${uploadsBaseDir}`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Not configured"}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? "✅ Configured" : "⚠️ Using default"}`);
});

module.exports = app;