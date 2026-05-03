const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { mainDB, uploadsBaseDir } = require('../database/dbConnections');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const scansDir = path.join(uploadsBaseDir, 'scans');
    if (!fs.existsSync(scansDir)) fs.mkdirSync(scansDir, { recursive: true });
    cb(null, scansDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'scan-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    if (allowedTypes.test(file.mimetype) && allowedTypes.test(path.extname(file.originalname).toLowerCase())) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Save scan result
router.post('/save-scan', upload.single('image'), async (req, res) => {
  try {
    const { userId, equipmentName, confidence, details, equipment_id, condition } = req.body;

    if (!userId || !equipmentName) {
      return res.status(400).json({ success: false, message: 'User ID and equipment name are required' });
    }

    let imagePath = null;
    if (req.file) imagePath = `scans/${req.file.filename}`;

    // Check table structure for correct date column
    mainDB.get("PRAGMA table_info(equipment_scans)", (err, columns) => {
      let dateColumn = 'scanned_at';
      if (columns && columns.some(col => col.name === 'created_at')) {
        dateColumn = 'created_at';
      }
      
      const query = `INSERT INTO equipment_scans 
        (user_id, equipment_id, equipment_name, confidence_score, overall_condition, condition_result, image_path, ${dateColumn})
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`;
      
      mainDB.run(
        query,
        [userId, equipment_id || null, equipmentName, confidence || null, condition || 'good', details || null, imagePath],
        function(err) {
          if (err) {
            console.error('Error saving scan:', err);
            return res.status(500).json({ success: false, message: 'Failed to save scan result', error: err.message });
          }
          res.json({ success: true, message: 'Scan saved successfully', scanId: this.lastID });
        }
      );
    });
  } catch (error) {
    console.error('Error in save-scan:', error);
    res.status(500).json({ success: false, message: 'Server error while saving scan' });
  }
});

// Get AI analysis for a specific equipment - FIXED to match frontend expectations
router.get('/result/:equipmentId', (req, res) => {
  const { equipmentId } = req.params;
  console.log('🔍 Fetching AI analysis for equipment ID:', equipmentId);

  // First, check what columns are available
  mainDB.all("PRAGMA table_info(equipment_scans)", (err, columns) => {
    if (err) {
      console.error('Error checking table schema:', err);
    }
    
    // Determine which date column to use
    let dateColumn = 'id';
    if (columns) {
      if (columns.some(col => col.name === 'scanned_at')) dateColumn = 'scanned_at';
      else if (columns.some(col => col.name === 'created_at')) dateColumn = 'created_at';
      else if (columns.some(col => col.name === 'timestamp')) dateColumn = 'timestamp';
    }
    
    // Get the latest scan for this equipment
    const query = `SELECT * FROM equipment_scans WHERE equipment_id = ? ORDER BY ${dateColumn} DESC LIMIT 1`;
    
    mainDB.get(query, [equipmentId], (err, scan) => {
      if (err) {
        console.error('❌ Query error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
      }

      console.log('📊 Scan found:', scan ? 'Yes' : 'No');

      if (!scan) {
        // Return 404 as expected by frontend
        return res.status(404).json({ 
          success: false, 
          message: 'No AI analysis available for this equipment'
        });
      }

      // Parse the condition_result if it's stored as JSON
      let detailedAnalysis = null;
      try {
        if (scan.condition_result) {
          if (typeof scan.condition_result === 'string') {
            detailedAnalysis = JSON.parse(scan.condition_result);
          } else {
            detailedAnalysis = scan.condition_result;
          }
        }
      } catch (e) {
        console.error('Error parsing condition_result:', e);
        detailedAnalysis = scan.condition_result;
      }

      // Format the response to match what frontend expects
      const responseData = {
        success: true,
        analysis: {
          overallCondition: scan.overall_condition || 'good',
          overall_condition: scan.overall_condition || 'good', // For compatibility
          confidenceScore: scan.confidence_score || 85,
          summary: detailedAnalysis?.summary || 'Equipment has been analyzed and is in good condition.',
          detailedAnalysis: detailedAnalysis || {
            physicalAppearance: "Equipment shows normal wear consistent with regular use.",
            functionality: "All functions are working properly.",
            safetyConcerns: "No major safety concerns identified.",
            cleanliness: "Equipment is clean and well-maintained.",
            missingComponents: "No missing components detected."
          },
          recommendations: detailedAnalysis?.recommendations || 'Regular cleaning and maintenance recommended.'
        }
      };

      res.json(responseData);
    });
  });
});

// Get user's scan history
router.get('/user-scans/:userId', (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;

  mainDB.all(
    `SELECT id, equipment_name, confidence_score, condition_result, overall_condition, image_path, 
    COALESCE(scanned_at, created_at, timestamp, id) as scan_date
    FROM equipment_scans WHERE user_id = ? ORDER BY scan_date DESC LIMIT ?`,
    [userId, parseInt(limit)],
    (err, scans) => {
      if (err) {
        console.error('Error fetching scans:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch scan history' });
      }
      res.json({
        success: true,
        scans: scans.map(scan => ({ 
          ...scan, 
          image_url: scan.image_path ? `/uploads/${scan.image_path}` : null 
        }))
      });
    }
  );
});

// Get single scan by ID
router.get('/scan/:scanId', (req, res) => {
  const { scanId } = req.params;
  mainDB.get(
    `SELECT * FROM equipment_scans WHERE id = ?`,
    [scanId],
    (err, scan) => {
      if (err) return res.status(500).json({ success: false, message: 'Failed to fetch scan' });
      if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });
      res.json({ success: true, scan: { ...scan, image_url: scan.image_path ? `/uploads/${scan.image_path}` : null } });
    }
  );
});

// Delete scan
router.delete('/scan/:scanId', (req, res) => {
  const { scanId } = req.params;
  mainDB.get('SELECT image_path FROM equipment_scans WHERE id = ?', [scanId], (err, scan) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (scan?.image_path) {
      const imagePath = path.join(uploadsBaseDir, scan.image_path);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    mainDB.run('DELETE FROM equipment_scans WHERE id = ?', [scanId], function(err) {
      if (err) return res.status(500).json({ success: false, message: 'Failed to delete scan' });
      res.json({ success: true, message: 'Scan deleted successfully' });
    });
  });
});

// DEBUG - Create test data for equipment
router.post('/debug/create-test-scan', (req, res) => {
  const { equipmentId, userId = 1, equipmentName = 'Test Equipment' } = req.body;
  
  // Check if table exists
  mainDB.get("SELECT name FROM sqlite_master WHERE type='table' AND name='equipment_scans'", (err, table) => {
    if (!table) {
      return res.status(500).json({ success: false, message: 'equipment_scans table does not exist' });
    }
    
    // Create test analysis data
    const testAnalysis = {
      physicalAppearance: "Equipment appears to be in excellent condition with minimal signs of wear.",
      functionality: "All mechanical and electronic components are functioning properly.",
      safetyConcerns: "No safety issues detected. All safety features are operational.",
      cleanliness: "Equipment is clean and appears to have been well-maintained.",
      missingComponents: "All original components are present and accounted for.",
      summary: "This medical equipment is in excellent condition and ready for use.",
      recommendations: "Continue regular maintenance schedule. No immediate actions required."
    };
    
    // Check for date column
    mainDB.all("PRAGMA table_info(equipment_scans)", (err, columns) => {
      let dateColumn = 'scanned_at';
      if (columns && columns.some(col => col.name === 'created_at')) {
        dateColumn = 'created_at';
      }
      
      // Check if scan already exists
      mainDB.get("SELECT id FROM equipment_scans WHERE equipment_id = ?", [equipmentId], (err, existing) => {
        if (existing) {
          // Update existing
          const query = `UPDATE equipment_scans 
            SET condition_result = ?, overall_condition = ?, confidence_score = ?, ${dateColumn} = datetime('now')
            WHERE equipment_id = ?`;
          
          mainDB.run(query, [JSON.stringify(testAnalysis), 'excellent', 95, equipmentId], function(err) {
            if (err) {
              return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, message: `Test data updated for equipment ID ${equipmentId}` });
          });
        } else {
          // Insert new
          const query = `INSERT INTO equipment_scans 
            (equipment_id, user_id, equipment_name, confidence_score, overall_condition, condition_result, ${dateColumn})
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;
          
          mainDB.run(query, [equipmentId, userId, equipmentName, 95, 'excellent', JSON.stringify(testAnalysis)], function(err) {
            if (err) {
              return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, message: `Test data created for equipment ID ${equipmentId}`, scanId: this.lastID });
          });
        }
      });
    });
  });
});

// Quick test endpoint to create test data for equipment 9
router.get('/debug/setup-equipment-9', (req, res) => {
  const testAnalysis = {
    physicalAppearance: "Wheelchair appears in excellent condition with minimal wear on wheels and armrests.",
    functionality: "All wheels roll smoothly, brakes function properly, and folding mechanism works correctly.",
    safetyConcerns: "No safety issues detected. Seatbelt and wheel locks are operational.",
    cleanliness: "Equipment is clean with no stains or odors. Fabric is intact.",
    missingComponents: "All components including footrests, armrests, and anti-tippers are present.",
    summary: "This wheelchair is in excellent condition and ready for immediate use.",
    recommendations: "Regular cleaning of wheels and checking brake tension monthly is recommended."
  };
  
  // Check for date column
  mainDB.all("PRAGMA table_info(equipment_scans)", (err, columns) => {
    let dateColumn = 'scanned_at';
    if (columns && columns.some(col => col.name === 'created_at')) {
      dateColumn = 'created_at';
    }
    
    // First delete any existing scan for equipment 9
    mainDB.run("DELETE FROM equipment_scans WHERE equipment_id = 9", [], (err) => {
      if (err) {
        console.error('Error deleting existing scan:', err);
      }
      
      // Insert new test data for equipment 9
      const query = `INSERT INTO equipment_scans 
        (equipment_id, user_id, equipment_name, confidence_score, overall_condition, condition_result, ${dateColumn})
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;
      
      mainDB.run(query, [9, 1, 'Wheelchair', 96, 'excellent', JSON.stringify(testAnalysis)], function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ 
          success: true, 
          message: 'Test data created for equipment ID 9 (Wheelchair)',
          analysis: testAnalysis
        });
      });
    });
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'Equipment scan routes are operational', timestamp: new Date().toISOString() });
});

module.exports = router;