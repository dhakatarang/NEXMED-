const express = require("express");
const { mainDB } = require("../database/dbConnections");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

// Get all medical equipment - Public route
router.get("/all", (req, res) => {
  console.log('📍 GET /api/equipments/all - Fetching all equipment');
  
  const query = `
    SELECT 
      e.id,
      e.name,
      e.description,
      e.quantity,
      e.price,
      e.rent_price as rentPrice,
      e.min_rental_days as duration,
      e.option_type as optionType,
      e.image_path as image,
      e.condition,
      e.added_by as userId,
      e.created_at as createdAt,
      u.name as userName
    FROM equipments e
    LEFT JOIN users u ON u.id = e.added_by
    WHERE e.quantity > 0
    ORDER BY e.created_at DESC
  `;
  
  mainDB.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Database error fetching equipment:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Database error while fetching equipment", 
        error: err.message 
      });
    }
    
    console.log(`✅ Found ${rows.length} equipment items`);
    
    const equipments = rows.map(equipment => ({
      id: equipment.id,
      name: equipment.name || 'Unknown Equipment',
      description: equipment.description || 'No description available',
      quantity: equipment.quantity || 0,
      price: equipment.price || 0,
      rentPrice: equipment.rentPrice || 0,
      duration: equipment.duration || 0,
      optionType: equipment.optionType || 'donate',
      image: equipment.image,
      condition: equipment.condition || 'good',
      createdAt: equipment.createdAt,
      user: {
        id: equipment.userId,
        name: equipment.userName || 'Unknown Donor'
      }
    }));

    res.json({ 
      success: true, 
      equipments: equipments,
      count: equipments.length,
      message: `Found ${equipments.length} equipment items`
    });
  });
});

// Get single equipment by ID - Public route
router.get("/:id", (req, res) => {
  const { id } = req.params;
  console.log(`📍 GET /api/equipments/${id} - Fetching single equipment`);

  const query = `
    SELECT 
      e.id,
      e.name,
      e.description,
      e.quantity,
      e.price,
      e.rent_price as rentPrice,
      e.min_rental_days as duration,
      e.option_type as optionType,
      e.image_path as image,
      e.condition,
      e.added_by as userId,
      e.created_at as createdAt,
      u.name as userName,
      u.email as userEmail
    FROM equipments e
    LEFT JOIN users u ON u.id = e.added_by
    WHERE e.id = ?
  `;
  
  mainDB.get(query, [id], (err, equipment) => {
    if (err) {
      console.error('❌ Database error fetching equipment:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Database error while fetching equipment", 
        error: err.message 
      });
    }
    
    if (!equipment) {
      console.log(`❌ Equipment ${id} not found`);
      return res.status(404).json({ 
        success: false, 
        message: "Equipment not found" 
      });
    }
    
    console.log(`✅ Found equipment: ${equipment.name}`);
    
    const formattedEquipment = {
      id: equipment.id,
      name: equipment.name || 'Unknown Equipment',
      description: equipment.description || 'No description available',
      quantity: equipment.quantity || 0,
      price: equipment.price || 0,
      rentPrice: equipment.rentPrice || 0,
      duration: equipment.duration || 0,
      optionType: equipment.optionType || 'donate',
      image: equipment.image,
      condition: equipment.condition || 'good',
      createdAt: equipment.createdAt,
      user: {
        id: equipment.userId,
        name: equipment.userName || 'Unknown Donor',
        email: equipment.userEmail
      }
    };

    res.json({ 
      success: true, 
      equipment: formattedEquipment,
      message: "Equipment found successfully"
    });
  });
});

// Get equipment by option type (donate/sell/rent) - Public route
router.get("/type/:optionType", (req, res) => {
  const { optionType } = req.params;
  console.log(`📍 GET /api/equipments/type/${optionType} - Fetching equipment by type`);
  
  if (!['donate', 'sell', 'rent'].includes(optionType)) {
    return res.status(400).json({
      success: false,
      message: "Invalid option type. Must be 'donate', 'sell', or 'rent'"
    });
  }
  
  const query = `
    SELECT 
      e.id,
      e.name,
      e.description,
      e.quantity,
      e.price,
      e.rent_price as rentPrice,
      e.min_rental_days as duration,
      e.option_type as optionType,
      e.image_path as image,
      e.condition,
      e.added_by as userId,
      e.created_at as createdAt,
      u.name as userName
    FROM equipments e
    LEFT JOIN users u ON u.id = e.added_by
    WHERE e.option_type = ? AND e.quantity > 0
    ORDER BY e.created_at DESC
  `;
  
  mainDB.all(query, [optionType], (err, rows) => {
    if (err) {
      console.error(`❌ Error fetching ${optionType} equipment:`, err);
      return res.status(500).json({ 
        success: false, 
        message: `Error fetching ${optionType} equipment`, 
        error: err.message 
      });
    }
    
    console.log(`✅ Found ${rows.length} ${optionType} equipment items`);
    
    const equipments = rows.map(equipment => ({
      id: equipment.id,
      name: equipment.name,
      description: equipment.description,
      quantity: equipment.quantity,
      price: equipment.price,
      rentPrice: equipment.rentPrice,
      duration: equipment.duration,
      optionType: equipment.optionType,
      image: equipment.image,
      condition: equipment.condition,
      createdAt: equipment.createdAt,
      user: {
        id: equipment.userId,
        name: equipment.userName || 'Unknown Donor'
      }
    }));

    res.json({ 
      success: true, 
      equipments: equipments,
      count: rows.length,
      optionType: optionType,
      message: `Found ${rows.length} ${optionType} equipment items`
    });
  });
});

// Buy/Rent equipment - Protected route
router.post("/action/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { action, quantity = 1, rentalDays = 1 } = req.body;
  const userId = req.userId;

  console.log(`📍 POST /api/equipments/action/${id} - User ${userId} performing ${action} on ${quantity} items`);

  if (quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be greater than 0"
    });
  }

  mainDB.get(
    "SELECT * FROM equipments WHERE id = ? AND quantity > 0", 
    [id], 
    (err, equipment) => {
      if (err) {
        console.error('❌ Database error finding equipment:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Database error while finding equipment", 
          error: err.message 
        });
      }
      
      if (!equipment) {
        console.log(`❌ Equipment ${id} not found or out of stock`);
        return res.status(404).json({ 
          success: false, 
          message: "Equipment not found or out of stock" 
        });
      }

      if (equipment.quantity < quantity) {
        console.log(`❌ Insufficient quantity. Available: ${equipment.quantity}, Requested: ${quantity}`);
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient quantity available. Only ${equipment.quantity} items left.` 
        });
      }

      if (equipment.added_by === userId) {
        return res.status(400).json({
          success: false,
          message: "You cannot purchase or rent your own listed equipment"
        });
      }

      const newQuantity = equipment.quantity - quantity;
      
      mainDB.run(
        "UPDATE equipments SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newQuantity, id],
        function(err) {
          if (err) {
            console.error('❌ Error updating equipment quantity:', err);
            return res.status(500).json({ 
              success: false, 
              message: "Error updating equipment quantity", 
              error: err.message 
            });
          }

          console.log(`✅ Equipment ${id} quantity updated from ${equipment.quantity} to ${newQuantity}`);

          const optionType = equipment.option_type;
          let totalAmount = 0;
          
          if (optionType === 'sell') {
            totalAmount = (equipment.price || 0) * quantity;
          } else if (optionType === 'rent') {
            totalAmount = (equipment.rent_price || 0) * quantity * rentalDays;
          }
          
          if (optionType === 'sell' || optionType === 'rent') {
            mainDB.run(
              `INSERT INTO orders (user_id, item_type, item_id, option_type, quantity, total_amount, status, created_at) 
               VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [userId, 'medicalequipment', id, optionType, quantity, totalAmount, 'confirmed'],
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
            message: `${action} successful!`,
            purchasedQuantity: quantity,
            remainingQuantity: newQuantity,
            equipment: {
              id: equipment.id,
              name: equipment.name,
              optionType: optionType,
              price: equipment.price,
              rentPrice: equipment.rent_price,
              totalPaid: totalAmount
            }
          });
        }
      );
    }
  );
});

// Test endpoint
router.get("/test", (req, res) => {
  console.log('📍 GET /api/equipments/test - Testing endpoint');
  res.json({ 
    success: true, 
    message: "Equipment API is working!",
    database: "Using mainDB (single database)",
    timestamp: new Date().toISOString(),
    endpoints: {
      "GET /all": "Get all equipment (Public)",
      "GET /:id": "Get single equipment by ID (Public)",
      "GET /type/:optionType": "Get equipment by type (Public)",
      "POST /action/:id": "Buy/Rent equipment (Protected)"
    }
  });
});

module.exports = router;