
const jwt = require('jsonwebtoken');
const { mainDB } = require('../database/dbConnections');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    console.log('🔑 Auth header:', authHeader);
    
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Extract token - handle both "Bearer token" and just "token"
    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    console.log('🔑 Extracted token:', token);

    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Invalid token format');
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Invalid token format.' 
      });
    }

    // Check if token is a user ID (for development without JWT)
    if (/^\d+$/.test(token)) {
      const userId = parseInt(token);
      console.log('✅ Using user ID as token:', userId);
      
      // Verify user exists in database
      mainDB.get('SELECT id FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid user token' 
          });
        }
        req.userId = userId;
        next();
      });
      return;
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    
    console.log('✅ Auth success for user:', req.userId);
    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please login again.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error. Please try again.' 
    });
  }
};

module.exports = { authMiddleware };
