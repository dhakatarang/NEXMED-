// backend/middleware/optionalAuth.js
const { authDB } = require('../database/dbConnections');

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Verify token logic here
        // For now, we'll just continue
        console.log('Token provided:', token);
    } else {
        console.log('No token provided, continuing as guest');
    }
    
    // Always continue to next middleware
    next();
};

module.exports = optionalAuth;