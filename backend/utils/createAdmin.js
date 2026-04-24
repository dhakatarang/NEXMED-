const bcrypt = require('bcryptjs');
const { mainDB } = require('../database/dbConnections');

const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@nexmed.com';
    const adminPassword = 'admin123';
    
    // Check if admin already exists
    mainDB.get("SELECT id FROM users WHERE email = ?", [adminEmail], async (err, row) => {
      if (err) {
        console.error('❌ Error checking admin:', err);
        return;
      }

      if (row) {
        console.log('✅ Admin user already exists');
        return;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      mainDB.run(
        `INSERT INTO users (name, email, password, user_type, role, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['System Admin', adminEmail, hashedPassword, 'Administrator', 'admin', 1],
        function(err) {
          if (err) {
            console.error('❌ Error creating admin:', err);
          } else {
            console.log('✅ Admin user created successfully!');
            console.log('📧 Email:', adminEmail);
            console.log('🔑 Password:', adminPassword);
            console.log('👑 Role: admin');
          }
        }
      );
    });
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

// Run immediately
createAdminUser();