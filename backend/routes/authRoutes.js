// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');
const { authMiddleware } = require('../utils/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendOTPEmail, storeOTP, verifyOTP, resendOTP, isEmailVerified } = require('../utils/otpService');
const { mainDB } = require('../database/dbConnections');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC, DOCX are allowed.'));
    }
  }
});

const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        error: 'File too large. Maximum size is 5MB.' 
      });
    }
  }
  next(error);
};

// Send OTP for signup verification
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // Check if email already exists
    mainDB.get(
      "SELECT id, email_verified FROM users WHERE email = ?",
      [email],
      async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Database error' 
          });
        }
        
        if (existingUser) {
          if (existingUser.email_verified) {
            return res.status(400).json({ 
              success: false, 
              message: 'Email already registered and verified' 
            });
          } else {
            return res.status(400).json({ 
              success: false, 
              message: 'Email already registered but not verified. Please login to resend verification.' 
            });
          }
        }
        
        const otp = require('../utils/otpService').generateOTP();
        await storeOTP(email, otp, 'signup');
        await sendOTPEmail(email, otp, 'signup');
        
        res.json({ 
          success: true, 
          message: 'OTP sent successfully to your email' 
        });
      }
    );
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP. Please try again.' 
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose = 'signup' } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }
    
    const verification = await verifyOTP(email, otp, purpose);
    
    if (verification.valid) {
      res.json({ 
        success: true, 
        message: 'OTP verified successfully' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: verification.message 
      });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify OTP' 
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, purpose = 'signup' } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    await resendOTP(email, purpose);
    
    res.json({ 
      success: true, 
      message: 'OTP resent successfully' 
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resend OTP' 
    });
  }
});

// Get current user details
router.get('/me', authMiddleware, (req, res) => {
  const userId = req.userId;

  mainDB.get(
    `SELECT id, name, email, user_type, medical_license_path, profile_photo, 
            phone, address, date_of_birth, emergency_contact, medical_history,
            email_verified, created_at, updated_at
     FROM users WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        console.error('❌ Error fetching user:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error fetching user data" 
        });
      }

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      const userData = {
        ...user,
        profile_photo: user.profile_photo ? `/uploads/profiles/${user.profile_photo}` : null
      };

      res.json({
        success: true,
        user: userData
      });
    }
  );
});

router.post('/signup', upload.single('medicalLicense'), handleMulterError, signup);
router.post('/login', login);

module.exports = router;