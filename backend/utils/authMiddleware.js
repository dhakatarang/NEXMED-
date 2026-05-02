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
            message: 'Please verify your email before logging in.' 
          });
        }

        // Check if user is active
        if (user.is_active === 0) {
          return res.status(403).json({ 
            success: false, 
            message: 'Your account has been deactivated.' 
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
        
        // IMPORTANT: Return user ID as token (since your middleware uses simple token)
        const token = user.id.toString(); // Convert to string for consistency
        
        console.log('✅ Login successful for:', user.email);
        console.log('🔑 Token (User ID):', token);
        
        res.json({
          success: true,
          message: 'Login successful',
          user: userData,
          token: token  // Return user ID as token
        });
      }
    );

  } catch (error) {
    console.error('❌ Server error during login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login'
    });
  }
};