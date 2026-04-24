// backend/middleware/validation.js
const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Password validation
  if (!password || password.length === 0) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors 
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Email validation
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  }

  // Password validation
  if (!password || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors 
    });
  }

  next();
};

module.exports = {
  validateSignup,
  validateLogin
};