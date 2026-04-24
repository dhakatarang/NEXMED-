const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { mainDB } = require("../database/dbConnections");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/items');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF)'));
    }
  }
});

// Error handling for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File too large. Maximum size is 5MB.' 
      });
    }
  }
  next(error);
};

// Debug endpoint to check donaterent table schema
router.get("/debug-schema", (req, res) => {
  console.log('🔍 Checking donaterent table schema...');
  
  mainDB.all(`PRAGMA table_info(donaterent)`, [], (err, schema) => {
    if (err) {
      console.error('❌ Error checking schema:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      schema: schema.map(col => ({ 
        name: col.name, 
        type: col.type,
        notnull: col.notnull
      }))
    });
  });
});

// Add item to donaterent (Protected route) - SIMPLIFIED VERSION
router.post("/add", authMiddleware, upload.single('image'), handleMulterError, async (req, res) => {
  try {
    console.log('📦 Starting item addition process...');
    
    const {
      itemType,
      optionType,
      name,
      description,
      quantity,
      price,
      rentPrice,
      duration,
      termsAccepted
    } = req.body;

    const userId = req.userId;

    console.log('📋 Form data received:', { 
      itemType, optionType, name, quantity, price, rentPrice, duration, termsAccepted, userId 
    });
    console.log('📁 File received:', req.file ? req.file.filename : 'No file');

    // Validation
    if (!termsAccepted || termsAccepted === 'false') {
      return res.status(400).json({ 
        success: false, 
        message: "Please accept terms and conditions" 
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Item name is required" 
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid quantity is required" 
      });
    }

    // Validate option types
    if (itemType === 'medicine' && !['donate', 'sell'].includes(optionType)) {
      return res.status(400).json({ 
        success: false, 
        message: "For medicines, only 'donate' or 'sell' options are allowed" 
      });
    }

    if (itemType === 'medicalequipment' && !['donate', 'sell', 'rent'].includes(optionType)) {
      return res.status(400).json({ 
        success: false, 
        message: "For medical equipment, only 'donate', 'sell', or 'rent' options are allowed" 
      });
    }

    const image_path = req.file ? `items/${req.file.filename}` : null;

    // First, let's just insert into donaterent table (simplified)
    console.log('💾 Inserting into donaterent table...');
    
    const donaterentQuery = `
      INSERT INTO donaterent 
      (user_id, item_type, item_id, option_type, name, description, quantity, price, rent_price, duration, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // For now, set item_id to 0 since we're not creating medicines/equipments yet
    const item_id = 0;

    mainDB.run(donaterentQuery, [
      userId,           // user_id
      itemType,         // item_type
      item_id,          // item_id (temporary)
      optionType,       // option_type
      name.trim(),      // name
      description ? description.trim() : '', // description
      parseInt(quantity), // quantity
      price ? parseFloat(price) : null, // price
      rentPrice ? parseFloat(rentPrice) : null, // rent_price
      duration ? parseInt(duration) : null, // duration
      image_path        // image_path
    ], function(err) {
      if (err) {
        console.error('❌ Database error adding to donaterent:', err);
        console.error('❌ Error details:', err.message);
        
        // Clean up uploaded file if database error
        if (req.file) {
          fs.unlinkSync(req.file.path);
          console.log('🗑️ Cleaned up uploaded file due to error');
        }
        
        return res.status(500).json({ 
          success: false, 
          message: "Database error while adding item", 
          error: err.message,
          details: "Check server console for more information"
        });
      }

      const donaterentId = this.lastID;
      console.log(`✅ Item added to donaterent with ID: ${donaterentId}`);

      // Now try to add to the respective table (medicines or equipments)
      addToSpecificTable(itemType, optionType, name, description, quantity, price, rentPrice, duration, image_path, userId, donaterentId)
        .then(() => {
          // Update donaterent with the actual item_id
          if (itemType === 'medicine' || itemType === 'medicalequipment') {
            // We'll update this after the specific table insertion
            console.log(`🔄 Donaterent record ${donaterentId} completed`);
          }

          res.json({
            success: true,
            message: "Item added successfully!",
            id: donaterentId,
            itemType: itemType
          });
        })
        .catch((error) => {
          console.error('❌ Error adding to specific table, but donaterent was saved:', error);
          // Even if specific table fails, donaterent was successful
          res.json({
            success: true,
            message: "Item added to donations! (Some features may be limited)",
            id: donaterentId,
            itemType: itemType,
            warning: "Item was added to donations but there was an issue with the specific category"
          });
        });

    });

  } catch (error) {
    console.error('❌ Server error in donaterent/add:', error);
    // Clean up uploaded file on server error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Server error while processing your request",
      error: error.message
    });
  }
});

// Helper function to add to specific tables
function addToSpecificTable(itemType, optionType, name, description, quantity, price, rentPrice, duration, image_path, userId, donaterentId) {
  return new Promise((resolve, reject) => {
    if (itemType === 'medicine') {
      console.log('💊 Adding to medicines table...');
      
      const medicineQuery = `
        INSERT INTO medicines 
        (item_type, option_type, name, description, quantity, price, image_path, added_by, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Set expiry date to 1 year from now for medicines
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      mainDB.run(medicineQuery, [
        itemType, optionType, name, description, parseInt(quantity), 
        price ? parseFloat(price) : 0, image_path, userId, expiryDate.toISOString().split('T')[0]
      ], function(err) {
        if (err) {
          console.error('❌ Error adding to medicines:', err);
          reject(err);
        } else {
          const medicineId = this.lastID;
          console.log(`✅ Medicine added with ID: ${medicineId}`);
          
          // Update donaterent with the actual medicine ID
          mainDB.run(
            'UPDATE donaterent SET item_id = ? WHERE id = ?',
            [medicineId, donaterentId],
            (updateErr) => {
              if (updateErr) {
                console.error('⚠️ Error updating donaterent item_id:', updateErr);
              }
              resolve();
            }
          );
        }
      });

    } else if (itemType === 'medicalequipment') {
      console.log('🏥 Adding to equipments table...');
      
      const equipmentQuery = `
        INSERT INTO equipments 
        (item_type, option_type, name, description, quantity, price, rent_price, min_rental_days, image_path, added_by, condition)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      mainDB.run(equipmentQuery, [
        itemType, optionType, name, description, parseInt(quantity), 
        price ? parseFloat(price) : 0,
        rentPrice ? parseFloat(rentPrice) : 0,
        duration ? parseInt(duration) : 0, 
        image_path, userId, 'good' // default condition
      ], function(err) {
        if (err) {
          console.error('❌ Error adding to equipments:', err);
          reject(err);
        } else {
          const equipmentId = this.lastID;
          console.log(`✅ Equipment added with ID: ${equipmentId}`);
          
          // Update donaterent with the actual equipment ID
          mainDB.run(
            'UPDATE donaterent SET item_id = ? WHERE id = ?',
            [equipmentId, donaterentId],
            (updateErr) => {
              if (updateErr) {
                console.error('⚠️ Error updating donaterent item_id:', updateErr);
              }
              resolve();
            }
          );
        }
      });
    } else {
      resolve(); // Not a specific type, just resolve
    }
  });
}

// Get all donaterent items (Public route)
router.get("/all", (req, res) => {
  mainDB.all(
    `SELECT dr.*, u.name as user_name 
     FROM donaterent dr 
     LEFT JOIN users u ON dr.user_id = u.id 
     ORDER BY dr.created_at DESC`, 
    [], 
    (err, rows) => {
      if (err) {
        console.error('❌ Error fetching donaterent items:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error fetching items", 
          error: err.message 
        });
      }
      
      const items = rows.map(item => ({
        ...item,
        user: {
          id: item.user_id,
          name: item.user_name
        }
      }));

      res.json({ 
        success: true, 
        items: items,
        count: items.length 
      });
    }
  );
});

// Test endpoint with sample data insertion
router.get("/test-add", authMiddleware, (req, res) => {
  const userId = req.userId;
  
  console.log('🧪 Testing item addition...');
  
  // Test with simple data
  const testQuery = `
    INSERT INTO donaterent 
    (user_id, item_type, item_id, option_type, name, description, quantity, price, image_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  mainDB.run(testQuery, [
    userId, 'medicine', 0, 'donate', 'Test Medicine', 'This is a test item', 10, 0, null
  ], function(err) {
    if (err) {
      console.error('❌ Test insertion failed:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Test failed", 
        error: err.message 
      });
    }

    console.log('✅ Test insertion successful, ID:', this.lastID);
    res.json({ 
      success: true, 
      message: "Test item added successfully!",
      id: this.lastID 
    });
  });
});

module.exports = router;
