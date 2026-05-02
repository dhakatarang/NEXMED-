// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const { mainDB, uploadsBaseDir } = require('../database/dbConnections');
const path = require('path');
const fs = require('fs');
const { markEmailAsVerified } = require('../utils/otpService');

const signup = async (req, res) => {
  try {
    const { name, email, password, userType, isEmailVerified } = req.body;
    const medicalLicense = req.file;

    console.log('📝 Signup request:', { name, email, userType, isEmailVerified });

    // Validation
    if (!name || !email || !password || !userType) {
      if (medicalLicense && medicalLicense.path) {
        try { fs.unlinkSync(medicalLicense.path); } catch(e) {}
      }
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Check if email is verified (for OTP flow)
    if (!isEmailVerified || isEmailVerified !== 'true') {
      if (medicalLicense && medicalLicense.path) {
        try { fs.unlinkSync(medicalLicense.path); } catch(e) {}
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Email verification required before signup' 
      });
    }

    // Check if user already exists
    mainDB.get(
      "SELECT id FROM users WHERE email = ?",
      [email],
      async (err, existingUser) => {
        if (err) {
          if (medicalLicense && medicalLicense.path) {
            try { fs.unlinkSync(medicalLicense.path); } catch(e) {}
          }
          console.error('❌ Database error during signup:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Database error during registration' 
          });
        }

        if (existingUser) {
          if (medicalLicense && medicalLicense.path) {
            try { fs.unlinkSync(medicalLicense.path); } catch(e) {}
          }
          return res.status(400).json({ 
            success: false, 
            message: 'User already exists with this email' 
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Handle medical license file - use persistent storage
        let medicalLicensePath = null;
        if (medicalLicense && medicalLicense.path) {
          const licensesDir = path.join(uploadsBaseDir, 'licenses');
          if (!fs.existsSync(licensesDir)) {
            fs.mkdirSync(licensesDir, { recursive: true });
          }
          
          const fileExtension = path.extname(medicalLicense.originalname);
          const fileName = `license-${Date.now()}${fileExtension}`;
          const filePath = path.join(licensesDir, fileName);
          
          try {
            fs.renameSync(medicalLicense.path, filePath);
            medicalLicensePath = `licenses/${fileName}`;
            console.log(`📄 License saved: ${medicalLicensePath}`);
          } catch (renameErr) {
            console.error('Error moving license file:', renameErr);
          }
        }

        // Insert new user with email_verified = true
        mainDB.run(
          `INSERT INTO users (name, email, password, user_type, medical_license_path, email_verified) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [name, email, hashedPassword, userType, medicalLicensePath, 1],
          async function(err) {
            if (err) {
              if (medicalLicensePath) {
                try { 
                  fs.unlinkSync(path.join(uploadsBaseDir, medicalLicensePath)); 
                } catch(e) {}
              }
              console.error('❌ Error creating user:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Error creating user account' 
              });
            }

            const userId = this.lastID;
            
            // Mark email as verified in OTP table
            try {
              await markEmailAsVerified(email);
            } catch (verifyErr) {
              console.error('Warning: Could not mark email as verified:', verifyErr);
            }
            
            res.status(201).json({
              success: true,
              message: 'User registered successfully',
              user: {
                id: userId,
                name,
                email,
                userType
              }
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('❌ Server error during signup:', error);
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    mainDB.get(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, user) => {
        if (err) {
          console.error('❌ Database error during login:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Database error during login' 
          });
        }

        if (!user) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid email or password' 
          });
        }

        // Check if email is verified
        if (!user.email_verified) {
          return res.status(403).json({ 
            success: false, 
            message: 'Please verify your email before logging in. Check your inbox for verification link.' 
          });
        }

        // Check if user is active
        if (!user.is_active) {
          return res.status(403).json({ 
            success: false, 
            message: 'Your account has been deactivated. Please contact support.' 
          });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid email or password' 
          });
        }

        // Return user data (without password)
        const { password: _, ...userData } = user;
        
        // Map user_type to role for frontend compatibility
        const userWithRole = {
          ...userData,
          role: userData.role || userData.user_type
        };
        
        console.log('👤 User login data:', userWithRole);
        console.log('🔑 User role:', userWithRole.role);
        
        res.json({
          success: true,
          message: 'Login successful',
          user: userWithRole,
          token: user.id.toString()
        });
      }
    );

  } catch (error) {
    console.error('❌ Server error during login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
};

module.exports = { signup, login };