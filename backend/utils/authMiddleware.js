// backend/utils/authMiddleware.js
const { mainDB } = require('../database/dbConnections');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('🔐 Auth Header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid authorization header');
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided, authorization denied' 
    });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('🔐 Extracted Token:', token);
  
  if (!token) {
    console.log('❌ No token after Bearer');
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided, authorization denied' 
    });
  }

  try {
    // For now, we'll use a simple user ID from token
    const userId = parseInt(token);
    
    if (!userId || isNaN(userId)) {
      console.log('❌ Invalid token format - not a number:', token);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }

    console.log('🔍 Looking for user with ID:', userId);

    // Verify user exists in database
    mainDB.get(
      "SELECT id, name, email, user_type FROM users WHERE id = ?",
      [userId],
      (err, user) => {
        if (err) {
          console.error('❌ Database error in auth middleware:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication' 
          });
        }
        
        if (!user) {
          console.log('❌ User not found for ID:', userId);
          return res.status(401).json({ 
            success: false, 
            message: 'User not found' 
          });
        }

        console.log('✅ User authenticated:', user.name);
        
        // Make sure user object is properly attached to req
        req.userId = user.id;
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          user_type: user.user_type
        };
        
        console.log('👤 req.user set to:', req.user);
        next();
      }
    );
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

module.exports = { authMiddleware };