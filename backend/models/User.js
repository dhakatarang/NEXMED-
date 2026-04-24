// backend/models/User.js
const { authDB } = require('../database/dbConnections');

const User = {
    create: (name, email, hashedPassword, userType, medicalLicensePath = null) => {
        return new Promise((resolve, reject) => {
            authDB.run(
                `INSERT INTO users (name, email, password, user_type, medical_license_path, created_at) 
                 VALUES (?, ?, ?, ?, ?, datetime('now'))`,
                [name, email, hashedPassword, userType, medicalLicensePath],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    },

    findByEmail: (email) => {
        return new Promise((resolve, reject) => {
            authDB.get(
                `SELECT * FROM users WHERE email = ?`, 
                [email], 
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    },

    findById: (id) => {
        return new Promise((resolve, reject) => {
            authDB.get(
                `SELECT id, name, email, user_type, medical_license_path, created_at 
                 FROM users WHERE id = ?`, 
                [id], 
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }
};

module.exports = User;