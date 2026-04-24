// backend/routes/cartRoutes.js
const express = require("express");
const { mainDB } = require("../database/dbConnections");
const { authMiddleware } = require("../utils/authMiddleware");

const router = express.Router();

// Get user's cart items
router.get("/", authMiddleware, (req, res) => {
  const userId = req.userId;
  
  console.log(`📍 GET /api/cart - Fetching cart for user ${userId}`);
  
  const query = `
    SELECT 
      c.id,
      c.item_id as itemId,
      c.item_type as itemType,
      c.name,
      c.description,
      c.quantity,
      c.price,
      c.rent_price as rentPrice,
      c.option_type as optionType,
      c.image,
      c.rental_days as rentalDays,
      c.created_at as createdAt
    FROM cart c
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `;
  
  mainDB.all(query, [userId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching cart:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching cart items", 
        error: err.message 
      });
    }
    
    console.log(`✅ Found ${rows.length} cart items for user ${userId}`);
    res.json({ 
      success: true, 
      cartItems: rows,
      count: rows.length 
    });
  });
});

// Add item to cart
router.post("/add", authMiddleware, (req, res) => {
  const userId = req.userId;
  const {
    itemId,
    itemType,
    name,
    description,
    quantity,
    price,
    rentPrice,
    optionType,
    image,
    rentalDays
  } = req.body;

  console.log(`📍 POST /api/cart/add - User ${userId} adding item to cart`);

  // Check if item already exists in cart
  const checkQuery = `
    SELECT id, quantity FROM cart 
    WHERE user_id = ? AND item_id = ? AND item_type = ?
  `;
  
  mainDB.get(checkQuery, [userId, itemId, itemType], (err, existingItem) => {
    if (err) {
      console.error('❌ Error checking existing cart item:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Error checking cart", 
        error: err.message 
      });
    }

    if (existingItem) {
      // Update quantity if item already exists
      const newQuantity = existingItem.quantity + quantity;
      mainDB.run(
        "UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newQuantity, existingItem.id],
        function(err) {
          if (err) {
            console.error('❌ Error updating cart item:', err);
            return res.status(500).json({ 
              success: false, 
              message: "Error updating cart item", 
              error: err.message 
            });
          }
          
          console.log(`✅ Updated cart item quantity to ${newQuantity}`);
          res.json({ 
            success: true, 
            message: "Item quantity updated in cart",
            cartItemId: existingItem.id,
            newQuantity: newQuantity
          });
        }
      );
    } else {
      // Add new item to cart
      const insertQuery = `
        INSERT INTO cart (
          user_id, item_id, item_type, name, description, quantity, 
          price, rent_price, option_type, image, rental_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        userId, itemId, itemType, name, description, quantity,
        price || 0, rentPrice || 0, optionType, image, rentalDays || 0
      ];
      
      mainDB.run(insertQuery, params, function(err) {
        if (err) {
          console.error('❌ Error adding to cart:', err);
          return res.status(500).json({ 
            success: false, 
            message: "Error adding item to cart", 
            error: err.message 
          });
        }
        
        console.log(`✅ Added new item to cart with ID: ${this.lastID}`);
        res.json({ 
          success: true, 
          message: "Item added to cart successfully",
          cartItemId: this.lastID
        });
      });
    }
  });
});

// Update cart item quantity
router.put("/:id", authMiddleware, (req, res) => {
  const cartId = req.params.id;
  const { quantity } = req.body;
  const userId = req.userId;

  console.log(`📍 PUT /api/cart/${cartId} - Updating quantity to ${quantity}`);

  if (quantity < 1) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be at least 1"
    });
  }

  mainDB.run(
    "UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
    [quantity, cartId, userId],
    function(err) {
      if (err) {
        console.error('❌ Error updating cart item:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error updating cart item", 
          error: err.message 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Cart item not found" 
        });
      }
      
      console.log(`✅ Updated cart item ${cartId} quantity to ${quantity}`);
      res.json({ 
        success: true, 
        message: "Cart item updated successfully",
        newQuantity: quantity
      });
    }
  );
});

// Remove item from cart
router.delete("/:id", authMiddleware, (req, res) => {
  const cartId = req.params.id;
  const userId = req.userId;

  console.log(`📍 DELETE /api/cart/${cartId} - Removing cart item`);

  mainDB.run(
    "DELETE FROM cart WHERE id = ? AND user_id = ?",
    [cartId, userId],
    function(err) {
      if (err) {
        console.error('❌ Error removing cart item:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error removing cart item", 
          error: err.message 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Cart item not found" 
        });
      }
      
      console.log(`✅ Removed cart item ${cartId}`);
      res.json({ 
        success: true, 
        message: "Item removed from cart successfully" 
      });
    }
  );
});

// Clear user's cart
router.delete("/clear", authMiddleware, (req, res) => {
  const userId = req.userId;

  console.log(`📍 DELETE /api/cart/clear - Clearing cart for user ${userId}`);

  mainDB.run(
    "DELETE FROM cart WHERE user_id = ?",
    [userId],
    function(err) {
      if (err) {
        console.error('❌ Error clearing cart:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error clearing cart", 
          error: err.message 
        });
      }
      
      console.log(`✅ Cleared ${this.changes} items from cart for user ${userId}`);
      res.json({ 
        success: true, 
        message: "Cart cleared successfully",
        itemsCleared: this.changes
      });
    }
  );
});

module.exports = router;