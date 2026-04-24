// backend/models/equipmentModel.js
const { equipmentsDB, authDB } = require('../database/dbConnections');

const Equipment = {
  create: (equipmentData, cb) => {
    const {
      name, description, quantity, price, rent_price, min_rental_days,
      is_for_rent, is_donated, image_path, option_type, condition, added_by
    } = equipmentData;

    const sql = `INSERT INTO equipments 
      (name, description, quantity, price, rent_price, min_rental_days,
       is_for_rent, is_donated, image_path, option_type, condition, added_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      name, description, quantity, price || 0, rent_price || 0, min_rental_days || 0,
      is_for_rent ? 1 : 0, is_donated ? 1 : 0, image_path, option_type, condition, added_by
    ];

    equipmentsDB.run(sql, params, function(err) {
      cb(err, this ? this.lastID : null);
    });
  },

  getAll: (cb) => {
    equipmentsDB.all(`SELECT * FROM equipments ORDER BY id DESC`, [], (err, equipments) => {
      if (err) {
        return cb(err);
      }
      
      if (!equipments || equipments.length === 0) {
        return cb(null, []);
      }

      const equipmentsWithUsers = equipments.map(equipment => {
        return new Promise((resolve) => {
          if (equipment.added_by) {
            authDB.get(`SELECT name FROM users WHERE id = ?`, [equipment.added_by], (userErr, user) => {
              if (userErr || !user) {
                resolve({ ...equipment, added_by_name: 'Unknown User' });
              } else {
                resolve({ ...equipment, added_by_name: user.name });
              }
            });
          } else {
            resolve({ ...equipment, added_by_name: 'Unknown User' });
          }
        });
      });

      Promise.all(equipmentsWithUsers)
        .then(results => cb(null, results))
        .catch(error => cb(error));
    });
  },

  getById: (id, cb) => {
    equipmentsDB.get(`SELECT * FROM equipments WHERE id = ?`, [id], cb);
  },

  update: (id, equipmentData, cb) => {
    const { name, description, quantity, price, rent_price } = equipmentData;
    equipmentsDB.run(
      `UPDATE equipments SET name=?, description=?, quantity=?, price=?, rent_price=? WHERE id=?`,
      [name, description, quantity, price, rent_price, id],
      cb
    );
  },

  delete: (id, cb) => {
    equipmentsDB.run(`DELETE FROM equipments WHERE id=?`, [id], cb);
  }
};

module.exports = Equipment;