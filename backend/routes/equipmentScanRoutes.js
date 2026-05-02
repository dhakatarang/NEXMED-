const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { mainDB, uploadsBaseDir } = require('../database/dbConnections');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const scansDir = path.join(uploadsBaseDir, 'scans');
    if (!fs.existsSync(scansDir)) {
      fs.mkdirSync(scansDir, { recursive: true });
    }
    cb(null, scansDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'scan-' + uniqueSuffix + path.extname(file.originalname));
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

// Save scan result
router.post('/save-scan', upload.single('image'), async (req, res) => {
  try {
    const { userId, equipmentName, confidence, details } = req.body;
    const imageFile = req.file;

    if (!userId || !equipmentName) {
      return res.status(400).json({
        success: false,
        message: 'User ID and equipment name are required'
      });
    }

    let imagePath = null;
    if (imageFile) {
      imagePath = `scans/${imageFile.filename}`;
    }

    mainDB.run(
      `INSERT INTO equipment_scans (user_id, equipment_name, confidence_score, details, image_path, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [userId, equipmentName, confidence || null, details || null, imagePath],
      function(err) {
        if (err) {
          console.error('Error saving scan:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to save scan result'
          });
        }

        res.json({
          success: true,
          message: 'Scan saved successfully',
          scanId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Error in save-scan:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving scan'
    });
  }
});

// Get user's scan history
router.get('/user-scans/:userId', (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;

  mainDB.all(
    `SELECT id, equipment_name, confidence_score, details, image_path, created_at
     FROM equipment_scans 
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, parseInt(limit)],
    (err, scans) => {
      if (err) {
        console.error('Error fetching scans:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch scan history'
        });
      }

      // Add full image URLs
      const scansWithUrls = scans.map(scan => ({
        ...scan,
        image_url: scan.image_path ? `/uploads/${scan.image_path}` : null
      }));

      res.json({
        success: true,
        scans: scansWithUrls
      });
    }
  );
});

// Get single scan details
router.get('/scan/:scanId', (req, res) => {
  const { scanId } = req.params;

  mainDB.get(
    `SELECT id, user_id, equipment_name, confidence_score, details, image_path, created_at
     FROM equipment_scans 
     WHERE id = ?`,
    [scanId],
    (err, scan) => {
      if (err) {
        console.error('Error fetching scan:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch scan details'
        });
      }

      if (!scan) {
        return res.status(404).json({
          success: false,
          message: 'Scan not found'
        });
      }

      res.json({
        success: true,
        scan: {
          ...scan,
          image_url: scan.image_path ? `/uploads/${scan.image_path}` : null
        }
      });
    }
  );
});

// Delete scan
router.delete('/scan/:scanId', (req, res) => {
  const { scanId } = req.params;

  // First get the image path to delete the file
  mainDB.get('SELECT image_path FROM equipment_scans WHERE id = ?', [scanId], (err, scan) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    // Delete the image file if it exists
    if (scan && scan.image_path) {
      const imagePath = path.join(uploadsBaseDir, scan.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the database record
    mainDB.run('DELETE FROM equipment_scans WHERE id = ?', [scanId], function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete scan'
        });
      }

      res.json({
        success: true,
        message: 'Scan deleted successfully'
      });
    });
  });
});

// AI Vision Scan endpoint (placeholder for Gemini AI integration)
router.post('/ai-scan', upload.single('image'), async (req, res) => {
  try {
    const { userId } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: 'Image is required for AI scan'
      });
    }

    // This is where you would integrate with Gemini AI
    // For now, return a placeholder response
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Placeholder response - replace with actual Gemini API call
    const mockResult = {
      equipmentName: "Medical Equipment Detected",
      confidence: 0.85,
      details: "AI scan result - Integration with Gemini API pending. Configure GEMINI_API_KEY in environment variables."
    };
    
    res.json({
      success: true,
      message: 'AI scan completed',
      result: mockResult
    });
    
  } catch (error) {
    console.error('AI scan error:', error);
    res.status(500).json({
      success: false,
      message: 'AI scan failed',
      error: error.message
    });
  }
});

// Health check for equipment scan routes
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Equipment scan routes are operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;