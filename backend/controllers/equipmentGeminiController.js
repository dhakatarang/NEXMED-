// backend/controllers/equipmentGeminiController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const geminiVisionService = require('../services/geminiVisionService');

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'equipment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const analyzeEquipmentWithGemini = async (req, res) => {
  let tempImagePath = null;
  
  try {
    console.log('🔍 Starting Gemini analysis for equipment');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image of the equipment'
      });
    }
    
    tempImagePath = req.file.path;
    const equipmentName = req.body.name || 'medical equipment';
    const userDescription = req.body.description || '';
    
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
      console.log('🧹 Cleaned up temp file');
    }
    
    if (!analysisResult.success) {
      return res.status(500).json({
        success: false,
        message: 'AI analysis failed',
        error: analysisResult.error
      });
    }
    
    // Return the analysis results
    res.json({
      success: true,
      message: 'Equipment analysis completed successfully',
      analysis: {
        overallCondition: analysisResult.analysis.overallCondition,
        confidence: analysisResult.analysis.confidence,
        detailedAnalysis: analysisResult.analysis.detailedAnalysis,
        summary: analysisResult.analysis.summary,
        recommendations: analysisResult.analysis.recommendations,
        suggestedPrice: calculateSuggestedPrice(equipmentName, analysisResult.analysis.overallCondition),
        suggestedRentPrice: calculateSuggestedRentPrice(equipmentName, analysisResult.analysis.overallCondition)
      },
      rawAnalysis: analysisResult.rawResponse,
      timestamp: analysisResult.timestamp
    });
    
  } catch (error) {
    console.error('💥 Gemini Analysis Error:', error);
    
    // Clean up temp file if it exists
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error analyzing equipment with AI',
      error: error.message
    });
  }
};

// Helper function to calculate suggested price based on condition
function calculateSuggestedPrice(equipmentName, condition) {
  const basePrice = getBasePrice(equipmentName);
  const conditionMultiplier = {
    'excellent': 0.9,
    'good': 0.7,
    'fair': 0.5,
    'poor': 0.3,
    'critical': 0.1
  };
  
  const multiplier = conditionMultiplier[condition] || 0.5;
  return Math.round(basePrice * multiplier);
}

function calculateSuggestedRentPrice(equipmentName, condition) {
  const suggestedPrice = calculateSuggestedPrice(equipmentName, condition);
  // Daily rent is typically 3-5% of sale price
  return Math.round(suggestedPrice * 0.04);
}

function getBasePrice(equipmentName) {
  const name = equipmentName.toLowerCase();
  if (name.includes('wheelchair')) return 15000;
  if (name.includes('hospital bed')) return 25000;
  if (name.includes('oxygen concentrator')) return 35000;
  if (name.includes('cpap')) return 40000;
  if (name.includes('monitor')) return 20000;
  if (name.includes('ventilator')) return 50000;
  if (name.includes('infusion pump')) return 15000;
  if (name.includes('nebulizer')) return 3000;
  if (name.includes('sphygmomanometer')) return 1500;
  if (name.includes('stethoscope')) return 2000;
  return 10000; // Default base price
}

module.exports = {
  analyzeEquipmentWithGemini,
  upload
};