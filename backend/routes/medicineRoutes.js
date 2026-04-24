// backend/routes/medicineRoutes.js
const express = require("express");
const { mainDB } = require("../database/dbConnections");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

// Debug route to check schema
router.get("/debug-schema", (req, res) => {
  console.log('🔍 Checking medicine table schema...');
  
  mainDB.all(`PRAGMA table_info(medicines)`, [], (err, schema) => {
    if (err) {
      console.error('❌ Error checking schema:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Get all medicines to see what's in the database
    mainDB.all(`SELECT * FROM medicines`, [], (err, allMedicines) => {
      if (err) {
        console.error('❌ Error fetching medicines:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Get all tables
      mainDB.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
        res.json({
          schema: schema.map(col => ({ 
            name: col.name, 
            type: col.type,
            notnull: col.notnull
          })),
          allMedicines: allMedicines,
          allTables: tables ? tables.map(t => t.name) : [],
          medicineCount: allMedicines ? allMedicines.length : 0
        });
      });
    });
  });
});

// Get all medicines (Public route - no auth required) - CORRECTED
router.get("/all", (req, res) => {
  console.log('📍 GET /api/medicines/all - Fetching all medicines');
  
  // Use the correct column names from new schema
  const query = `
    SELECT 
      m.id,
      m.name,
      m.description,
      m.quantity,
      m.price,
      m.option_type as optionType,  -- Correct: option_type in DB, alias as optionType for frontend
      m.image_path as image,        -- Correct: image_path in DB, alias as image for frontend
      m.added_by as userId,
      m.expiry_date as expiryDate,
      m.created_at as createdAt,
      u.name as userName,
      u.email as userEmail
    FROM medicines m
    LEFT JOIN users u ON u.id = m.added_by
    WHERE m.quantity > 0
    ORDER BY m.created_at DESC
  `;
  
  mainDB.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Database error fetching medicines:', err);
      console.error('❌ Error details:', err.message);
      return res.status(500).json({ 
        success: false, 
        message: "Database error while fetching medicines", 
        error: err.message 
      });
    }
    
    console.log(`✅ Found ${rows.length} medicines`);
    
    // Ensure all medicines have required properties
    const medicines = rows.map(medicine => ({
      id: medicine.id,
      name: medicine.name || 'Unknown Medicine',
      description: medicine.description || 'No description available',
      quantity: medicine.quantity || 0,
      price: medicine.price || 0,
      optionType: medicine.optionType || 'donate',
      image: medicine.image,
      expiryDate: medicine.expiryDate,
      createdAt: medicine.createdAt,
      user: {
        id: medicine.userId,
        name: medicine.userName || 'Unknown Donor',
        email: medicine.userEmail
      }
    }));

    res.json({ 
      success: true, 
      medicines: medicines,
      count: medicines.length,
      message: `Found ${medicines.length} medicines`
    });
  });
});

// Get medicines by option type (donate/sell) - Public route
router.get("/type/:optionType", (req, res) => {
  const { optionType } = req.params;
  console.log(`📍 GET /api/medicines/type/${optionType} - Fetching medicines by type`);
  
  // Validate optionType
  if (!['donate', 'sell'].includes(optionType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid option type. Must be 'donate' or 'sell'"
    });
  }
  
  const query = `
    SELECT 
      m.id,
      m.name,
      m.description,
      m.quantity,
      m.price,
      m.option_type as optionType,
      m.image_path as image,
      m.added_by as userId,
      m.expiry_date as expiryDate,
      m.created_at as createdAt,
      u.name as userName
    FROM medicines m
    LEFT JOIN users u ON u.id = m.added_by
    WHERE m.option_type = ? AND m.quantity > 0
    ORDER BY m.created_at DESC
  `;
  
  mainDB.all(query, [optionType], (err, rows) => {
    if (err) {
      console.error(`❌ Error fetching ${optionType} medicines:`, err);
      return res.status(500).json({ 
        success: false, 
        message: `Error fetching ${optionType} medicines`, 
        error: err.message 
      });
    }
    
    console.log(`✅ Found ${rows.length} ${optionType} medicines`);
    
    const medicines = rows.map(medicine => ({
      id: medicine.id,
      name: medicine.name,
      description: medicine.description,
      quantity: medicine.quantity,
      price: medicine.price,
      optionType: medicine.optionType,
      image: medicine.image,
      expiryDate: medicine.expiryDate,
      createdAt: medicine.createdAt,
      user: {
        id: medicine.userId,
        name: medicine.userName || 'Unknown Donor'
      }
    }));

    res.json({ 
      success: true, 
      medicines: medicines,
      count: rows.length,
      optionType: optionType,
      message: `Found ${rows.length} ${optionType} medicines`
    });
  });
});

// Get single medicine by ID - Public route
router.get("/:id", (req, res) => {
  const { id } = req.params;
  console.log(`📍 GET /api/medicines/${id} - Fetching single medicine`);

  const query = `
    SELECT 
      m.id,
      m.name,
      m.description,
      m.quantity,
      m.price,
      m.option_type as optionType,
      m.image_path as image,
      m.added_by as userId,
      m.expiry_date as expiryDate,
      m.created_at as createdAt,
      u.name as userName,
      u.email as userEmail
    FROM medicines m
    LEFT JOIN users u ON u.id = m.added_by
    WHERE m.id = ?
  `;
  
  mainDB.get(query, [id], (err, medicine) => {
    if (err) {
      console.error('❌ Database error fetching medicine:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Database error while fetching medicine", 
        error: err.message 
      });
    }
    
    if (!medicine) {
      console.log(`❌ Medicine ${id} not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Medicine not found" 
      });
    }
    
    console.log(`✅ Found medicine: ${medicine.name}`);
    
    // Format the response
    const formattedMedicine = {
      id: medicine.id,
      name: medicine.name || 'Unknown Medicine',
      description: medicine.description || 'No description available',
      quantity: medicine.quantity || 0,
      price: medicine.price || 0,
      optionType: medicine.optionType || 'donate',
      image: medicine.image,
      expiryDate: medicine.expiryDate,
      createdAt: medicine.createdAt,
      user: {
        id: medicine.userId,
        name: medicine.userName || 'Unknown Donor',
        email: medicine.userEmail
      }
    };

    res.json({ 
      success: true, 
      medicine: formattedMedicine,
      message: "Medicine found successfully"
    });
  });
});

// Get medicine by ID (alternative endpoint for compatibility)
router.get("/id/:id", (req, res) => {
  const { id } = req.params;
  console.log(`📍 GET /api/medicines/id/${id} - Fetching medicine by ID`);
  
  // Reuse the same logic as above
  const query = `
    SELECT 
      m.id,
      m.name,
      m.description,
      m.quantity,
      m.price,
      m.option_type as optionType,
      m.image_path as image,
      m.added_by as userId,
      m.expiry_date as expiryDate,
      m.created_at as createdAt,
      u.name as userName
    FROM medicines m
    LEFT JOIN users u ON u.id = m.added_by
    WHERE m.id = ?
  `;
  
  mainDB.get(query, [id], (err, medicine) => {
    if (err) {
      console.error('❌ Error fetching medicine:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching medicine", 
        error: err.message 
      });
    }
    
    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: "Medicine not found" 
      });
    }
    
    res.json({ 
      success: true, 
      medicine: medicine
    });
  });
});

// Buy medicine (reduce quantity) - Protected route
router.post("/buy/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { quantity = 1 } = req.body;
  const userId = req.userId;

  console.log(`📍 POST /api/medicines/buy/${id} - User ${userId} buying ${quantity} items`);

  // Validate quantity
  if (quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be greater than 0"
    });
  }

  mainDB.get(
    "SELECT * FROM medicines WHERE id = ? AND quantity > 0", 
    [id], 
    (err, medicine) => {
      if (err) {
        console.error('❌ Database error finding medicine:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Database error while finding medicine", 
          error: err.message 
        });
      }
      
      if (!medicine) {
        console.log(`❌ Medicine ${id} not found or out of stock`);
        return res.status(404).json({ 
          success: false, 
          message: "Medicine not found or out of stock" 
        });
      }

      if (medicine.quantity < quantity) {
        console.log(`❌ Insufficient quantity. Available: ${medicine.quantity}, Requested: ${quantity}`);
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient quantity available. Only ${medicine.quantity} items left.` 
        });
      }

      // Check if user is trying to buy their own medicine
      if (medicine.added_by === userId) {
        return res.status(400).json({
          success: false,
          message: "You cannot buy your own listed medicine"
        });
      }

      const newQuantity = medicine.quantity - quantity;
      
      // Update medicine quantity
      mainDB.run(
        "UPDATE medicines SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newQuantity, id],
        function(err) {
          if (err) {
            console.error('❌ Error updating medicine quantity:', err);
            return res.status(500).json({ 
              success: false, 
              message: "Error updating medicine quantity", 
              error: err.message 
            });
          }

          console.log(`✅ Medicine ${id} quantity updated from ${medicine.quantity} to ${newQuantity}`);

          // Create order record
          const optionType = medicine.option_type;
          const price = medicine.price || 0;
          
          if (optionType === 'sell') {
            mainDB.run(
              `INSERT INTO orders (user_id, item_type, item_id, option_type, quantity, total_amount, status, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [userId, 'medicine', id, 'sell', quantity, (price * quantity), 'confirmed'],
              (err) => {
                if (err) {
                  console.error('⚠️ Error creating order record:', err);
                } else {
                  console.log('✅ Order record created');
                }
              }
            );
          }

          res.json({ 
            success: true, 
            message: "Purchase successful!",
            purchasedQuantity: quantity,
            remainingQuantity: newQuantity,
            medicine: {
              id: medicine.id,
              name: medicine.name,
              optionType: optionType,
              price: price,
              totalPaid: price * quantity
            }
          });
        }
      );
    }
  );
});

// Simple test endpoint
router.get("/test-simple", (req, res) => {
  console.log('📍 GET /api/medicines/test-simple - Testing simple query');
  
  // Simple test without joins
  mainDB.all("SELECT id, name, quantity, option_type as optionType FROM medicines WHERE quantity > 0", [], (err, rows) => {
    if (err) {
      console.error('❌ Simple test error:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Simple test failed", 
        error: err.message 
      });
    }
    
    res.json({ 
      success: true, 
      medicines: rows,
      count: rows.length,
      message: `Simple test: Found ${rows.length} medicines`
    });
  });
});

// Test endpoint
router.get("/test", (req, res) => {
  console.log('📍 GET /api/medicines/test - Testing endpoint');
  res.json({ 
    success: true, 
    message: "Medicines API is working!",
    database: "Using mainDB (single database)",
    timestamp: new Date().toISOString(),
    endpoints: {
      "GET /all": "Get all medicines (Public)",
      "GET /type/:optionType": "Get medicines by type (Public)",
      "GET /:id": "Get single medicine by ID (Public)",
      "GET /id/:id": "Get medicine by ID (alternative)",
      "GET /test-simple": "Simple test without joins",
      "GET /debug-schema": "Debug database schema",
      "POST /buy/:id": "Buy medicine (Protected)"
    }
  });
});

module.exports = router;