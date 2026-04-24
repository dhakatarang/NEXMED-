// backend/routes/adminRoutes.js
const express = require("express");
const { mainDB } = require("../database/dbConnections");
const { authMiddleware } = require("../utils/authMiddleware");
const { adminMiddleware } = require("../utils/adminMiddleware");

const router = express.Router();

// Apply both auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Admin dashboard statistics
router.get("/dashboard", (req, res) => {
  console.log('📍 GET /api/admin/dashboard - Fetching admin dashboard data');
  
  const queries = {
    totalUsers: "SELECT COUNT(*) as count FROM users",
    totalMedicines: "SELECT COUNT(*) as count FROM medicines",
    totalEquipment: "SELECT COUNT(*) as count FROM equipments",
    totalOrders: "SELECT COUNT(*) as count FROM orders",
    pendingOrders: "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'",
    recentOrders: `
      SELECT o.*, u.name as user_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC 
      LIMIT 5
    `,
    lowStockMedicines: "SELECT * FROM medicines WHERE quantity < 10 LIMIT 5",
    lowStockEquipment: "SELECT * FROM equipments WHERE quantity < 5 LIMIT 5",
    recentUsers: `
      SELECT id, name, email, user_type, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.keys(queries).forEach(key => {
    mainDB.all(queries[key], [], (err, rows) => {
      if (err) {
        console.error(`❌ Error fetching ${key}:`, err);
        results[key] = [];
      } else {
        results[key] = rows;
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json({
          success: true,
          dashboard: {
            stats: {
              totalUsers: results.totalUsers[0]?.count || 0,
              totalMedicines: results.totalMedicines[0]?.count || 0,
              totalEquipment: results.totalEquipment[0]?.count || 0,
              totalOrders: results.totalOrders[0]?.count || 0,
              pendingOrders: results.pendingOrders[0]?.count || 0
            },
            recentOrders: results.recentOrders,
            lowStockItems: [...results.lowStockMedicines, ...results.lowStockEquipment],
            recentUsers: results.recentUsers
          }
        });
      }
    });
  });
});

// User management routes
router.get("/users", (req, res) => {
  console.log('📍 GET /api/admin/users - Fetching all users');
  
  const query = `
    SELECT 
      id, name, email, user_type, role, is_active,
      phone, address, created_at, updated_at
    FROM users 
    ORDER BY created_at DESC
  `;
  
  mainDB.all(query, [], (err, users) => {
    if (err) {
      console.error('❌ Error fetching users:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching users" 
      });
    }
    
    res.json({ success: true, users });
  });
});

// Update user role
router.put("/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  console.log(`📍 PUT /api/admin/users/${id}/role - Updating role to ${role}`);
  
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid role" 
    });
  }
  
  mainDB.run(
    "UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [role, id],
    function(err) {
      if (err) {
        console.error('❌ Error updating user role:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error updating user role" 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "User role updated successfully" 
      });
    }
  );
});

// Toggle user active status
router.put("/users/:id/status", (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  console.log(`📍 PUT /api/admin/users/${id}/status - Setting active to ${is_active}`);
  
  mainDB.run(
    "UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [is_active ? 1 : 0, id],
    function(err) {
      if (err) {
        console.error('❌ Error updating user status:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error updating user status" 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      res.json({ 
        success: true, 
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully` 
      });
    }
  );
});

// Get all medicines for admin
router.get("/medicines", (req, res) => {
  console.log('📍 GET /api/admin/medicines - Fetching all medicines');
  
  const query = `
    SELECT 
      m.*,
      u.name as added_by_name
    FROM medicines m
    LEFT JOIN users u ON m.added_by = u.id
    ORDER BY m.created_at DESC
  `;
  
  mainDB.all(query, [], (err, medicines) => {
    if (err) {
      console.error('❌ Error fetching medicines:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching medicines" 
      });
    }
    
    res.json({ success: true, medicines });
  });
});

// Get all equipment for admin
router.get("/equipment", (req, res) => {
  console.log('📍 GET /api/admin/equipment - Fetching all equipment');
  
  const query = `
    SELECT 
      e.*,
      u.name as added_by_name
    FROM equipments e
    LEFT JOIN users u ON e.added_by = u.id
    ORDER BY e.created_at DESC
  `;
  
  mainDB.all(query, [], (err, equipment) => {
    if (err) {
      console.error('❌ Error fetching equipment:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching equipment" 
      });
    }
    
    res.json({ success: true, equipment });
  });
});

// Get all orders for admin
router.get("/orders", (req, res) => {
  console.log('📍 GET /api/admin/orders - Fetching all orders');
  
  const query = `
    SELECT 
      o.*,
      u.name as user_name,
      u.email as user_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;
  
  mainDB.all(query, [], (err, orders) => {
    if (err) {
      console.error('❌ Error fetching orders:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching orders" 
      });
    }
    
    res.json({ success: true, orders });
  });
});

// Update order status
router.put("/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log(`📍 PUT /api/admin/orders/${id}/status - Updating status to ${status}`);
  
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid status" 
    });
  }
  
  mainDB.run(
    "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, id],
    function(err) {
      if (err) {
        console.error('❌ Error updating order status:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error updating order status" 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "Order status updated successfully" 
      });
    }
  );
});

// Delete medicine
router.delete("/medicines/:id", (req, res) => {
  const { id } = req.params;
  
  console.log(`📍 DELETE /api/admin/medicines/${id} - Deleting medicine`);
  
  mainDB.run(
    "DELETE FROM medicines WHERE id = ?",
    [id],
    function(err) {
      if (err) {
        console.error('❌ Error deleting medicine:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error deleting medicine" 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Medicine not found" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "Medicine deleted successfully" 
      });
    }
  );
});

// Delete equipment
router.delete("/equipment/:id", (req, res) => {
  const { id } = req.params;
  
  console.log(`📍 DELETE /api/admin/equipment/${id} - Deleting equipment`);
  
  mainDB.run(
    "DELETE FROM equipments WHERE id = ?",
    [id],
    function(err) {
      if (err) {
        console.error('❌ Error deleting equipment:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error deleting equipment" 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: "Equipment not found" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "Equipment deleted successfully" 
      });
    }
  );
});

module.exports = router;