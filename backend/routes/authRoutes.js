const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');
const { authMiddleware } = require('../utils/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { sendOTPEmail, storeOTP, verifyOTP, resendOTP, generateOTP } = require('../utils/otpService');
const { mainDB } = require('../database/dbConnections');

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
    
    // Check if email already exists and verified
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
        
        if (existingUser && existingUser.email_verified) {
          return res.status(400).json({ 
            success: false, 
            message: 'Email already registered and verified' 
          });
        }
        
        const otp = generateOTP();
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

      // Format profile photo URL
      const userData = {
        ...user,
        profile_photo: user.profile_photo ? `/uploads/${user.profile_photo}` : null,
        medical_license_path: user.medical_license_path ? `/uploads/${user.medical_license_path}` : null
      };

      res.json({
        success: true,
        user: userData
      });
    }
  );
});

router.post('/signup', upload.single('medicalLicense'), signup);
router.post('/login', login);

module.exports = router;