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
  
  setTimeout(() => {
    addSampleData();
  }, 1000);
}

function addSampleData() {
  console.log('📝 Adding sample data...');
  
  mainDB.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }
    
    if (row.count === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('password123', 10);
      const adminHashedPassword = bcrypt.hashSync('admin123', 10);
      
      mainDB.run(
        `INSERT INTO users (name, email, password, user_type, email_verified) VALUES (?, ?, ?, ?, ?)`,
        ['Demo User', 'demo@nexmed.com', hashedPassword, 'Individual Donor / Receiver', 1],
        function(err) {
          if (err) console.error('Error adding demo user:', err);
          else addSampleMedicines(this.lastID);
        }
      );
      
      mainDB.run(
        `INSERT INTO users (name, email, password, user_type, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Admin User', 'admin@nexmed.com', adminHashedPassword, 'Administrator', 'admin', 1],
        function(err) {
          if (err) console.error('Error adding admin user:', err);
          else console.log('✅ Admin user added');
        }
      );
    }
  });
}

function addSampleMedicines(userId) {
  const medicines = [
    { name: "Paracetamol 500mg", description: "Pain reliever and fever reducer", quantity: 150, price: 5.99, option_type: "sell", image_path: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
    { name: "Vitamin C 1000mg", description: "Immune support supplement", quantity: 200, price: 0, option_type: "donate", image_path: "https://images.unsplash.com/photo-1616671276441-2f2c3f21c9b2?w=400" }
  ];
  
  medicines.forEach(med => {
    mainDB.run(
      `INSERT INTO medicines (name, description, quantity, price, option_type, added_by, item_type, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [med.name, med.description, med.quantity, med.price, med.option_type, userId, 'medicine', med.image_path]
    );
  });
}

module.exports = { initAllDatabases };