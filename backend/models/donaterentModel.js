// backend/models/donaterentModel.js
const { donateRentDB, medicinesDB, equipmentsDB } = require('../database/dbConnections');

const DonateRent = {
  create: (donateRentData, cb) => {
    const {
      user_id, item_type, item_id, option_type, name, description,
      quantity, price, rent_price, duration, image_path
    } = donateRentData;

    const sql = `INSERT INTO donaterent 
      (user_id, item_type, item_id, option_type, name, description, 
       quantity, price, rent_price, duration, image_path) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      user_id, item_type, item_id, option_type, name, description,
      quantity, price, rent_price, duration, image_path
    ];

    donateRentDB.run(sql, params, function(err) {
      cb(err, this ? this.lastID : null);
    });
  },

  getAll: (cb) => {
    donateRentDB.all(`
      SELECT dr.*, u.name as user_name, u.email as user_email
      FROM donaterent dr
      LEFT JOIN auth.db.users u ON dr.user_id = u.id
      ORDER BY dr.id DESC
    `, [], cb);
  },

  getById: (id, cb) => {
    donateRentDB.get(`
      SELECT dr.*, u.name as user_name, u.email as user_email
      FROM donaterent dr
      LEFT JOIN auth.db.users u ON dr.user_id = u.id
      WHERE dr.id = ?
    `, [id], cb);
  },

  getByUserId: (userId, cb) => {
    donateRentDB.all(`
      SELECT * FROM donaterent 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId], cb);
  }
};

module.exports = DonateRent;
