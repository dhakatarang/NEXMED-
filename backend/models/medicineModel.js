// backend/models/medicineModel.js
const { medicinesDB, authDB } = require('../database/dbConnections');

const Medicine = {
  create: (medicineData, cb) => {
    const {
      name, description, quantity, price, is_donated, 
      image_path, option_type, added_by, expiry_date
    } = medicineData;

    const sql = `INSERT INTO medicines 
      (name, description, quantity, price, is_donated, image_path, option_type, added_by, expiry_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      name, description, quantity, price || 0, is_donated ? 1 : 0,
      image_path, option_type, added_by, expiry_date
    ];

    medicinesDB.run(sql, params, function(err) {
      cb(err, this ? this.lastID : null);
    });
  },

  getAll: (cb) => {
    // Use a more robust approach for cross-database queries
    medicinesDB.all(`SELECT * FROM medicines ORDER BY id DESC`, [], (err, medicines) => {
      if (err) {
        return cb(err);
      }
      
      // If no medicines, return empty array
      if (!medicines || medicines.length === 0) {
        return cb(null, []);
      }

      // Get user names for each medicine
      const medicinesWithUsers = medicines.map(medicine => {
        return new Promise((resolve) => {
          if (medicine.added_by) {
            authDB.get(`SELECT name FROM users WHERE id = ?`, [medicine.added_by], (userErr, user) => {
              if (userErr || !user) {
                resolve({ ...medicine, added_by_name: 'Unknown User' });
              } else {
                resolve({ ...medicine, added_by_name: user.name });
              }
            });
          } else {
            resolve({ ...medicine, added_by_name: 'Unknown User' });
          }
        });
      });

      Promise.all(medicinesWithUsers)
        .then(results => cb(null, results))
        .catch(error => cb(error));
    });
  },

  getById: (id, cb) => {
    medicinesDB.get(`SELECT * FROM medicines WHERE id = ?`, [id], cb);
  },

  update: (id, medicineData, cb) => {
    const { name, description, quantity, price } = medicineData;
    medicinesDB.run(
      `UPDATE medicines SET name=?, description=?, quantity=?, price=? WHERE id=?`,
      [name, description, quantity, price, id],
      cb
    );
  },

  delete: (id, cb) => {
    medicinesDB.run(`DELETE FROM medicines WHERE id=?`, [id], cb);
  }
};

module.exports = Medicine;