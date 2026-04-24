const { mainDB } = require('../database/dbConnections');

const adminMiddleware = (req, res, next) => {
  const userId = req.userId;
  
  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }

  console.log('👑 Admin middleware checking user:', userId);

  // Check both role and user_type for admin
  const query = "SELECT role, user_type FROM users WHERE id = ? AND is_active = 1";
  mainDB.get(query, [userId], (err, user) => {
    if (err) {
      console.error('❌ Admin middleware error:', err);
      return res.status(500).json({ 
        success: false, 
        message: "Database error" 
      });
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    // Check if user is admin (check both role and user_type)
    const isAdmin = user.role === 'admin' || user.user_type === 'admin' || user.user_type === 'Administrator';
    
    console.log('🔍 Admin check - Role:', user.role, 'User Type:', user.user_type, 'Is Admin:', isAdmin);
    
    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin privileges required." 
      });
    }
    
    console.log('✅ Admin access granted');
    next();
  });
};

module.exports = { adminMiddleware };