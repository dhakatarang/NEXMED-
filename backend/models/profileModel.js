// backend/models/profileModel.js
const { profileDB } = require('../database/dbConnections');

const Profile = {
  getByUserId: (userId, cb) => profileDB.get(`SELECT * FROM profiles WHERE userId=?`, [userId], cb),
  createOrUpdate: (userId, phone, address, avatarUrl, cb) => {
    profileDB.get(`SELECT * FROM profiles WHERE userId=?`, [userId], (err, row) => {
      if (err) return cb(err);
      if (row) {
        profileDB.run(`UPDATE profiles SET phone=?, address=?, avatarUrl=? WHERE userId=?`,
          [phone, address, avatarUrl, userId], cb);
      } else {
        profileDB.run(`INSERT INTO profiles (userId, phone, address, avatarUrl) VALUES (?, ?, ?, ?)`,
          [userId, phone, address, avatarUrl], function(err) { cb(err, this ? this.lastID : null); });
      }
    });
  }
};

module.exports = Profile;
