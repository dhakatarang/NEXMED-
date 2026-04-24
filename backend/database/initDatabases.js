const { mainDB } = require('./dbConnections');

function initAllDatabases() {
  console.log('🔄 Starting database initialization...');

  if (!mainDB) {
    console.error('❌ Database connection not available');
    return;
  }

  // Create users table
  mainDB.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    user_type TEXT DEFAULT 'Individual Donor / Receiver',
    role TEXT DEFAULT 'user',
    medical_license_path TEXT,
    profile_photo TEXT,
    phone TEXT,
    address TEXT,
    date_of_birth TEXT,
    emergency_contact TEXT,
    medical_history TEXT,
    is_active INTEGER DEFAULT 1,
    email_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err);
    } else {
      console.log('✅ Users table created/verified');
      addMissingColumns();
    }
  });

  // Create OTP verification table
  mainDB.run(`CREATE TABLE IF NOT EXISTS otp_verification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    purpose TEXT DEFAULT 'signup',
    is_verified INTEGER DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating OTP table:', err);
    } else {
      console.log('✅ OTP verification table created/verified');
    }
  });

  // Create medicines table
  mainDB.run(`CREATE TABLE IF NOT EXISTS medicines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT DEFAULT 'medicine',
    option_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL DEFAULT 0,
    is_donated INTEGER DEFAULT 0,
    image_path TEXT,
    added_by INTEGER NOT NULL,
    expiry_date TEXT,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating medicines table:', err);
    } else {
      console.log('✅ Medicines table created/verified');
    }
  });

  // Create equipments table
  mainDB.run(`CREATE TABLE IF NOT EXISTS equipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT DEFAULT 'medicalequipment',
    option_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL DEFAULT 0,
    rent_price REAL DEFAULT 0,
    min_rental_days INTEGER DEFAULT 0,
    is_for_rent INTEGER DEFAULT 0,
    is_donated INTEGER DEFAULT 0,
    image_path TEXT,
    added_by INTEGER NOT NULL,
    condition TEXT DEFAULT 'good',
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating equipments table:', err);
    } else {
      console.log('✅ Equipments table created/verified');
    }
  });

  // Create cart table
  mainDB.run(`CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL DEFAULT 0,
    rent_price REAL DEFAULT 0,
    option_type TEXT NOT NULL,
    image TEXT,
    rental_days INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, item_id, item_type)
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating cart table:', err);
    } else {
      console.log('✅ Cart table created/verified');
    }
  });

  // Create donaterent table
  mainDB.run(`CREATE TABLE IF NOT EXISTS donaterent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    option_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL,
    rent_price REAL,
    duration INTEGER,
    image_path TEXT,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating donaterent table:', err);
    } else {
      console.log('✅ DonateRent table created/verified');
    }
  });

  // Create orders table
  mainDB.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    option_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_amount REAL,
    status TEXT DEFAULT 'pending',
    shipping_address TEXT,
    contact_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating orders table:', err);
    } else {
      console.log('✅ Orders table created/verified');
    }
  });

  console.log('📊 All database tables initialized');
  
  // Add sample data after tables are created
  setTimeout(() => {
    addSampleData();
  }, 1000);
}

function addMissingColumns() {
  console.log('🔧 Adding missing columns...');
  
  mainDB.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error checking columns:', err);
      return;
    }
    
    const columnNames = columns.map(c => c.name);
    
    if (!columnNames.includes('role')) {
      mainDB.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (err) => {
        if (err) console.error('Error adding role column:', err);
        else console.log('✅ Added role column');
      });
    }
    
    if (!columnNames.includes('is_active')) {
      mainDB.run("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1", (err) => {
        if (err) console.error('Error adding is_active column:', err);
        else console.log('✅ Added is_active column');
      });
    }
    
    if (!columnNames.includes('email_verified')) {
      mainDB.run("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0", (err) => {
        if (err) console.error('Error adding email_verified column:', err);
        else console.log('✅ Added email_verified column');
      });
    }
  });
}

function addSampleData() {
  console.log('📝 Adding sample data...');
  
  // Check if users exist
  mainDB.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }
    
    if (row.count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('password123', 10);
      const adminHashedPassword = bcrypt.hashSync('admin123', 10);
      
      // Add demo user
      mainDB.run(
        `INSERT INTO users (name, email, password, user_type, email_verified) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Demo User', 'demo@nexmed.com', hashedPassword, 'Individual Donor / Receiver', 1],
        function(err) {
          if (err) {
            console.error('Error adding demo user:', err);
          } else {
            const userId = this.lastID;
            console.log('✅ Demo user added with ID:', userId);
            addSampleMedicines(userId);
            addSampleEquipments(userId);
          }
        }
      );
      
      // Add admin user
      mainDB.run(
        `INSERT INTO users (name, email, password, user_type, role, email_verified) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Admin User', 'admin@nexmed.com', adminHashedPassword, 'Administrator', 'admin', 1],
        function(err) {
          if (err) {
            console.error('Error adding admin user:', err);
          } else {
            console.log('✅ Admin user added (admin@nexmed.com / admin123)');
          }
        }
      );
    } else {
      console.log('📊 Users already exist, fetching demo user ID...');
      mainDB.get("SELECT id FROM users WHERE email = 'demo@nexmed.com'", (err, user) => {
        if (err) {
          console.error('Error fetching demo user:', err);
        } else if (user) {
          addSampleMedicines(user.id);
          addSampleEquipments(user.id);
        } else {
          // If no demo user exists, create one
          const bcrypt = require('bcryptjs');
          const hashedPassword = bcrypt.hashSync('password123', 10);
          mainDB.run(
            `INSERT INTO users (name, email, password, user_type, email_verified) 
             VALUES (?, ?, ?, ?, ?)`,
            ['Demo User', 'demo@nexmed.com', hashedPassword, 'Individual Donor / Receiver', 1],
            function(err) {
              if (err) {
                console.error('Error creating demo user:', err);
              } else {
                console.log('✅ Demo user created with ID:', this.lastID);
                addSampleMedicines(this.lastID);
                addSampleEquipments(this.lastID);
              }
            }
          );
        }
      });
    }
  });
}

function addSampleMedicines(userId) {
  if (!userId) {
    console.log('⚠️ No user ID available for medicines sample data');
    return;
  }
  
  mainDB.get("SELECT COUNT(*) as count FROM medicines", (err, row) => {
    if (err) {
      console.error('Error checking medicines:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('📊 Adding sample medicines with real images...');
      
      const medicines = [
        {
          name: "Paracetamol 500mg",
          description: "Effective pain reliever and fever reducer. Used for headaches, muscle aches, backaches, and fever. Non-prescription medication.",
          quantity: 150,
          price: 5.99,
          option_type: "sell",
          is_donated: 0,
          expiry_date: "2025-12-31",
          image_path: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop"
        },
        {
          name: "Amoxicillin 250mg",
          description: "Antibiotic used to treat bacterial infections including pneumonia, bronchitis, and ear infections. Prescription required.",
          quantity: 85,
          price: 12.99,
          option_type: "sell",
          is_donated: 0,
          expiry_date: "2025-08-15",
          image_path: "https://images.unsplash.com/photo-1622630998479-7aa5dc5c6f6c?w=400&h=300&fit=crop"
        },
        {
          name: "Vitamin C 1000mg",
          description: "Immune support supplement with zinc. Boosts immune system, helps fight colds, and supports overall health.",
          quantity: 200,
          price: 0,
          option_type: "donate",
          is_donated: 1,
          expiry_date: "2025-10-30",
          image_path: "https://images.unsplash.com/photo-1616671276441-2f2c3f21c9b2?w=400&h=300&fit=crop"
        },
        {
          name: "Insulin Pen",
          description: "Fast-acting insulin for diabetes management. Easy-to-use pre-filled pen with 300 units.",
          quantity: 30,
          price: 89.99,
          option_type: "sell",
          is_donated: 0,
          expiry_date: "2025-06-20",
          image_path: "https://images.unsplash.com/photo-1616606103915-dea7be788566?w=400&h=300&fit=crop"
        },
        {
          name: "Ibuprofen 200mg",
          description: "Anti-inflammatory pain reliever. Reduces fever, pain, and inflammation. Effective for arthritis and menstrual pain.",
          quantity: 300,
          price: 0,
          option_type: "donate",
          is_donated: 1,
          expiry_date: "2025-11-15",
          image_path: "https://images.unsplash.com/photo-1541264990817-99698026b804?w=400&h=300&fit=crop"
        },
        {
          name: "First Aid Kit",
          description: "Complete 100-piece first aid kit for home or travel. Includes bandages, antiseptic wipes, gauze, and medical tape.",
          quantity: 50,
          price: 0,
          option_type: "donate",
          is_donated: 1,
          expiry_date: "2026-01-01",
          image_path: "https://images.unsplash.com/photo-1603398938378-e54eab446d6a?w=400&h=300&fit=crop"
        },
        {
          name: "Aspirin 81mg",
          description: "Low-dose aspirin for heart health. Daily use for cardiovascular support and blood thinning.",
          quantity: 180,
          price: 8.99,
          option_type: "sell",
          is_donated: 0,
          expiry_date: "2025-09-30",
          image_path: "https://images.unsplash.com/photo-1550572017-edd4b1f895a1?w=400&h=300&fit=crop"
        },
        {
          name: "Cough Syrup",
          description: "Relieves cough, chest congestion, and throat irritation. Alcohol-free formula.",
          quantity: 120,
          price: 7.99,
          option_type: "sell",
          is_donated: 0,
          expiry_date: "2025-07-15",
          image_path: "https://images.unsplash.com/photo-1584017911766-d451b3d6e2dd?w=400&h=300&fit=crop"
        }
      ];
      
      let completed = 0;
      medicines.forEach((med) => {
        mainDB.run(
          `INSERT INTO medicines (name, description, quantity, price, option_type, is_donated, added_by, expiry_date, status, item_type, image_path) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            med.name,
            med.description,
            med.quantity,
            med.price,
            med.option_type,
            med.is_donated,
            userId,
            med.expiry_date,
            'available',
            'medicine',
            med.image_path
          ],
          function(err) {
            if (err) {
              console.error('Error adding medicine:', err);
            } else {
              console.log(`✅ Medicine added: ${med.name}`);
            }
            completed++;
            if (completed === medicines.length) {
              console.log('✅ All 8 sample medicines added successfully!');
            }
          }
        );
      });
    } else {
      console.log(`📊 Medicines table already has ${row.count} items, skipping sample data`);
    }
  });
}

function addSampleEquipments(userId) {
  if (!userId) {
    console.log('⚠️ No user ID available for equipments sample data');
    return;
  }
  
  mainDB.get("SELECT COUNT(*) as count FROM equipments", (err, row) => {
    if (err) {
      console.error('Error checking equipments:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('📊 Adding sample equipments with real images...');
      
      const equipments = [
        {
          name: "Oxygen Concentrator",
          description: "5L portable oxygen machine for respiratory support. Lightweight, quiet operation, and energy efficient.",
          quantity: 8,
          price: 0,
          rent_price: 25.00,
          option_type: "rent",
          is_donated: 0,
          is_for_rent: 1,
          condition: "excellent",
          min_rental_days: 7,
          image_path: "https://images.unsplash.com/photo-1629909613654-28e377c37c1e?w=400&h=300&fit=crop"
        },
        {
          name: "Wheelchair",
          description: "Lightweight foldable wheelchair with adjustable footrests, comfortable seating, and durable wheels.",
          quantity: 12,
          price: 0,
          rent_price: 15.00,
          option_type: "rent",
          is_donated: 0,
          is_for_rent: 1,
          condition: "good",
          min_rental_days: 3,
          image_path: "https://images.unsplash.com/photo-1588710949779-944d6c2b7ac4?w=400&h=300&fit=crop"
        },
        {
          name: "Hospital Bed",
          description: "Adjustable electric hospital bed with side rails, mattress included, and remote control.",
          quantity: 5,
          price: 0,
          rent_price: 50.00,
          option_type: "rent",
          is_donated: 0,
          is_for_rent: 1,
          condition: "excellent",
          min_rental_days: 14,
          image_path: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=300&fit=crop"
        },
        {
          name: "Digital Thermometer",
          description: "Non-contact infrared forehead thermometer. Fast, accurate readings with backlit display.",
          quantity: 45,
          price: 0,
          rent_price: 0,
          option_type: "donate",
          is_donated: 1,
          is_for_rent: 0,
          condition: "new",
          min_rental_days: 0,
          image_path: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop"
        },
        {
          name: "CPAP Machine",
          description: "Auto-adjusting CPAP machine for sleep apnea treatment. Includes mask, tubing, and humidifier.",
          quantity: 6,
          price: 450.00,
          rent_price: 35.00,
          option_type: "both",
          is_donated: 0,
          is_for_rent: 1,
          condition: "excellent",
          min_rental_days: 30,
          image_path: "https://images.unsplash.com/photo-1629909613654-28e377c37c1e?w=400&h=300&fit=crop"
        },
        {
          name: "Crutches",
          description: "Adjustable aluminum crutches with padded armrests and non-slip tips. Lightweight and durable.",
          quantity: 30,
          price: 0,
          rent_price: 5.00,
          option_type: "rent",
          is_donated: 0,
          is_for_rent: 1,
          condition: "good",
          min_rental_days: 2,
          image_path: "https://images.unsplash.com/photo-1584308972272-4e2e6bfa1b9c?w=400&h=300&fit=crop"
        },
        {
          name: "Nebulizer Machine",
          description: "Portable mesh nebulizer for respiratory treatments. Quiet, efficient, and easy to clean.",
          quantity: 15,
          price: 65.00,
          rent_price: 10.00,
          option_type: "both",
          is_donated: 0,
          is_for_rent: 1,
          condition: "excellent",
          min_rental_days: 5,
          image_path: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop"
        },
        {
          name: "Walking Cane",
          description: "Adjustable height walking cane with ergonomic handle, wrist strap, and non-slip base.",
          quantity: 40,
          price: 0,
          rent_price: 0,
          option_type: "donate",
          is_donated: 1,
          is_for_rent: 0,
          condition: "good",
          min_rental_days: 0,
          image_path: "https://images.unsplash.com/photo-1584308972272-4e2e6bfa1b9c?w=400&h=300&fit=crop"
        }
      ];
      
      let completed = 0;
      equipments.forEach((eq) => {
        mainDB.run(
          `INSERT INTO equipments (
            name, description, quantity, price, rent_price, option_type, 
            is_donated, is_for_rent, condition, min_rental_days, added_by, status, item_type, image_path
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            eq.name,
            eq.description,
            eq.quantity,
            eq.price,
            eq.rent_price,
            eq.option_type,
            eq.is_donated,
            eq.is_for_rent,
            eq.condition,
            eq.min_rental_days,
            userId,
            'available',
            'medicalequipment',
            eq.image_path
          ],
          function(err) {
            if (err) {
              console.error('Error adding equipment:', err);
            } else {
              console.log(`✅ Equipment added: ${eq.name}`);
            }
            completed++;
            if (completed === equipments.length) {
              console.log('✅ All 8 sample equipments added successfully!');
              console.log('🎉 Database initialization completed with sample data!');
            }
          }
        );
      });
    } else {
      console.log(`📊 Equipments table already has ${row.count} items, skipping sample data`);
    }
  });
}

module.exports = { initAllDatabases };