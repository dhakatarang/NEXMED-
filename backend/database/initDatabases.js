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
    if (err) console.error('❌ Error creating users table:', err);
    else console.log('✅ Users table created/verified');
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
    if (err) console.error('❌ Error creating OTP table:', err);
    else console.log('✅ OTP verification table created/verified');
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
    if (err) console.error('❌ Error creating medicines table:', err);
    else console.log('✅ Medicines table created/verified');
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
    if (err) console.error('❌ Error creating equipments table:', err);
    else console.log('✅ Equipments table created/verified');
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
    if (err) console.error('❌ Error creating cart table:', err);
    else console.log('✅ Cart table created/verified');
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
    if (err) console.error('❌ Error creating donaterent table:', err);
    else console.log('✅ DonateRent table created/verified');
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
    if (err) console.error('❌ Error creating orders table:', err);
    else console.log('✅ Orders table created/verified');
  });

  // Create equipment_scans table
  mainDB.run(`CREATE TABLE IF NOT EXISTS equipment_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    equipment_id INTEGER,
    equipment_name TEXT NOT NULL,
    image_path TEXT,
    condition_result TEXT,
    overall_condition TEXT,
    confidence_score INTEGER,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE SET NULL
  )`, (err) => {
    if (err) console.error('❌ Error creating equipment_scans table:', err);
    else console.log('✅ Equipment scans table created/verified');
  });

  console.log('📊 All database tables initialized');
  
  // Wait for tables to be created before adding sample data
  setTimeout(() => {
    addSampleData();
  }, 2000);
}

function addSampleData() {
  console.log('📝 Checking for sample data...');
  
  // First check if users exist
  mainDB.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error('❌ Error checking users:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('📝 No users found, adding sample users...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('password123', 10);
      const adminHashedPassword = bcrypt.hashSync('admin123', 10);
      
      // Add Demo User
      mainDB.run(
        `INSERT INTO users (name, email, password, user_type, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Demo User', 'demo@nexmed.com', hashedPassword, 'Individual Donor / Receiver', 'user', 1],
        function(err) {
          if (err) {
            console.error('❌ Error adding demo user:', err.message);
          } else {
            console.log(`✅ Demo user added with ID: ${this.lastID}`);
            // Add sample medicines and equipment for this user
            addSampleMedicines(this.lastID);
            addSampleEquipments(this.lastID);  // ✅ ADD THIS LINE
          }
        }
      );
      
      // Add Admin User
      mainDB.run(
        `INSERT INTO users (name, email, password, user_type, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Admin User', 'admin@nexmed.com', adminHashedPassword, 'Administrator', 'admin', 1],
        function(err) {
          if (err) {
            console.error('❌ Error adding admin user:', err.message);
          } else {
            console.log(`✅ Admin user added with ID: ${this.lastID}`);
          }
        }
      );
    } else {
      console.log(`✅ Users already exist (${row.count} users found), checking for sample data...`);
      
      // Check if medicines exist, if not add them
      mainDB.get("SELECT COUNT(*) as count FROM medicines", (err, medRow) => {
        if (err) {
          console.error('Error checking medicines:', err);
          return;
        }
        
        if (medRow.count === 0) {
          console.log('📝 No medicines found, adding sample medicines...');
          mainDB.get("SELECT id FROM users WHERE email = 'demo@nexmed.com'", (err, userRow) => {
            if (err) {
              console.error('Error finding demo user:', err);
              return;
            }
            if (userRow) {
              addSampleMedicines(userRow.id);
            } else {
              console.log('⚠️ Demo user not found, skipping medicine samples');
            }
          });
        } else {
          console.log(`✅ Medicines already exist (${medRow.count} medicines found)`);
        }
      });
      
      // ✅ ADD THIS: Check if equipments exist, if not add them
      mainDB.get("SELECT COUNT(*) as count FROM equipments", (err, equipRow) => {
        if (err) {
          console.error('Error checking equipments:', err);
          return;
        }
        
        if (equipRow.count === 0) {
          console.log('📝 No equipments found, adding sample equipments...');
          mainDB.get("SELECT id FROM users WHERE email = 'demo@nexmed.com'", (err, userRow) => {
            if (err) {
              console.error('Error finding demo user:', err);
              return;
            }
            if (userRow) {
              addSampleEquipments(userRow.id);
            } else {
              console.log('⚠️ Demo user not found, trying user ID 1');
              addSampleEquipments(1);
            }
          });
        } else {
          console.log(`✅ Equipments already exist (${equipRow.count} equipments found)`);
        }
      });
    }
  });
}

function addSampleMedicines(userId) {
  console.log(`📝 Adding sample medicines for user ID: ${userId}...`);
  
  const medicines = [
    {
      name: "Paracetamol 500mg",
      description: "Pain reliever and fever reducer. Effective for headaches, muscle aches, and fever.",
      quantity: 150,
      price: 5.99,
      option_type: "sell",
      item_type: "medicine",
      image_path: "paracetamol.jpg",
      status: "available"
    },
    {
      name: "Vitamin C 1000mg",
      description: "Immune support supplement. Boosts immunity and helps fight common cold.",
      quantity: 200,
      price: 0,
      option_type: "donate",
      item_type: "medicine",
      image_path: "vitaminc.jpg",
      status: "available"
    },
    {
      name: "Amoxicillin 250mg",
      description: "Antibiotic for bacterial infections. Prescription required.",
      quantity: 80,
      price: 12.99,
      option_type: "sell",
      item_type: "medicine",
      image_path: "amoxicillin.jpg",
      status: "available"
    },
    {
      name: "Insulin Pen",
      description: "Diabetes management medication. Keep refrigerated.",
      quantity: 30,
      price: 0,
      option_type: "donate",
      item_type: "medicine",
      image_path: "insulin.jpg",
      status: "available"
    }
  ];
  
  let addedCount = 0;
  
  medicines.forEach((med) => {
    mainDB.run(
      `INSERT INTO medicines (name, description, quantity, price, option_type, added_by, item_type, image_path, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [med.name, med.description, med.quantity, med.price, med.option_type, userId, med.item_type, med.image_path, med.status],
      function(err) {
        if (err) {
          console.error(`❌ Error adding medicine "${med.name}":`, err.message);
        } else {
          addedCount++;
          console.log(`✅ Added medicine: ${med.name} (${med.option_type})`);
        }
        
        if (addedCount === medicines.length) {
          console.log(`✅ All ${addedCount} sample medicines added successfully!`);
        }
      }
    );
  });
}

// ✅ NEW FUNCTION: Add sample equipments
function addSampleEquipments(userId) {
  console.log(`📝 Adding sample equipments for user ID: ${userId}...`);
  
  const equipments = [
    {
      name: "Standard Wheelchair",
      description: "Lightweight foldable wheelchair with armrests and footrests. Perfect for mobility assistance.",
      quantity: 10,
      price: 15000,
      rent_price: 500,
      option_type: "rent",
      item_type: "medicalequipment",
      condition: "good",
      min_rental_days: 7,
      image_path: "wheelchair.jpg",
      status: "available"
    },
    {
      name: "Digital Blood Pressure Monitor",
      description: "Automatic upper arm blood pressure monitor with large display. Easy to use at home.",
      quantity: 25,
      price: 2500,
      rent_price: 0,
      option_type: "sell",
      item_type: "medicalequipment",
      condition: "excellent",
      min_rental_days: 0,
      image_path: "bp_monitor.jpg",
      status: "available"
    },
    {
      name: "Hospital Bed",
      description: "Adjustable hospital bed with side rails and remote control. Electric operation for patient comfort.",
      quantity: 5,
      price: 0,
      rent_price: 3000,
      option_type: "donate",
      item_type: "medicalequipment",
      condition: "good",
      min_rental_days: 30,
      image_path: "hospital_bed.jpg",
      status: "available"
    },
    {
      name: "Oxygen Concentrator",
      description: "5L oxygen concentrator with nebulizer function. Portable and quiet operation.",
      quantity: 8,
      price: 35000,
      rent_price: 2000,
      option_type: "rent",
      item_type: "medicalequipment",
      condition: "excellent",
      min_rental_days: 14,
      image_path: "oxygen_concentrator.jpg",
      status: "available"
    },
    {
      name: "Walking Cane",
      description: "Adjustable aluminum walking cane with ergonomic handle. Lightweight and sturdy.",
      quantity: 50,
      price: 800,
      rent_price: 0,
      option_type: "sell",
      item_type: "medicalequipment",
      condition: "excellent",
      min_rental_days: 0,
      image_path: "walking_cane.jpg",
      status: "available"
    },
    {
      name: "Nebulizer Machine",
      description: "Portable mesh nebulizer for respiratory treatments. Quiet and efficient.",
      quantity: 20,
      price: 3500,
      rent_price: 300,
      option_type: "sell",
      item_type: "medicalequipment",
      condition: "good",
      min_rental_days: 0,
      image_path: "nebulizer.jpg",
      status: "available"
    },
    {
      name: "CPAP Machine",
      description: "For sleep apnea treatment. Includes mask and humidifier.",
      quantity: 12,
      price: 45000,
      rent_price: 2500,
      option_type: "rent",
      item_type: "medicalequipment",
      condition: "excellent",
      min_rental_days: 30,
      image_path: "cpap.jpg",
      status: "available"
    }
  ];
  
  let addedCount = 0;
  
  equipments.forEach((equip) => {
    mainDB.run(
      `INSERT INTO equipments (name, description, quantity, price, rent_price, option_type, added_by, item_type, condition, min_rental_days, image_path, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [equip.name, equip.description, equip.quantity, equip.price, equip.rent_price, 
       equip.option_type, userId, equip.item_type, equip.condition, equip.min_rental_days, 
       equip.image_path, equip.status],
      function(err) {
        if (err) {
          console.error(`❌ Error adding equipment "${equip.name}":`, err.message);
        } else {
          addedCount++;
          console.log(`✅ Added equipment: ${equip.name} (${equip.option_type})`);
        }
        
        if (addedCount === equipments.length) {
          console.log(`✅ All ${addedCount} sample equipments added successfully!`);
        }
      }
    );
  });
}

module.exports = { initAllDatabases };