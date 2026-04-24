// backend/routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authMiddleware } = require("../utils/authMiddleware");
const { mainDB } = require("../database/dbConnections");

// Ensure uploads/profiles exists
const profilesDir = path.join(__dirname, "../uploads/profiles");
if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });

// Multer config - store profile photos in uploads/profiles
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profilesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safe = `profile_${req.userId || "unknown"}_${Date.now()}${ext}`;
    cb(null, safe);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  }
});

// GET /api/profile
// returns { success: true, profile: {...}, contributions: { medicines:[], equipments:[] } }
router.get("/", authMiddleware, (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Get latest user data from DB (including profile_photo path and DOB etc)
    mainDB.get(
      `SELECT id, name, email, user_type, medical_license_path, profile_photo, phone, address, date_of_birth, created_at FROM users WHERE id = ?`,
      [userId],
      (err, userRow) => {
        if (err) {
          console.error("❌ DB error fetching profile:", err);
          return res.status(500).json({ success: false, message: "Server error" });
        }
        if (!userRow) return res.status(404).json({ success: false, message: "User not found" });

        // Convert profile_photo to accessible path if present
        if (userRow.profile_photo) {
          if (!userRow.profile_photo.startsWith("/uploads")) {
            userRow.profile_photo = `/uploads/profiles/${userRow.profile_photo}`;
          }
        }

        // Fetch medicines and equipments added by user
        const contributions = { medicines: [], equipments: [] };

        mainDB.all(`SELECT id, name, option_type, quantity, price, image_path, status FROM medicines WHERE added_by = ? ORDER BY created_at DESC LIMIT 100`, [userId], (mErr, mRows) => {
          if (!mErr && mRows) contributions.medicines = mRows;

          mainDB.all(`SELECT id, name, option_type, quantity, price, image_path, status FROM equipments WHERE added_by = ? ORDER BY created_at DESC LIMIT 100`, [userId], (eErr, eRows) => {
            if (!eErr && eRows) contributions.equipments = eRows;

            return res.json({
              success: true,
              message: "Profile retrieved",
              profile: userRow,
              contributions
            });
          });
        });
      }
    );
  } catch (error) {
    console.error("❌ /api/profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/profile
// Update basic profile fields and optionally profile photo (multipart/form-data)
router.put("/", authMiddleware, upload.single("profile_photo"), (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Fields allowed to update
    const { name, email, user_type, phone, address, date_of_birth } = req.body;
    const updates = [];
    const params = [];

    if (name) { updates.push("name = ?"); params.push(name); }
    if (email) { updates.push("email = ?"); params.push(email); }
    if (user_type) { updates.push("user_type = ?"); params.push(user_type); }
    if (phone) { updates.push("phone = ?"); params.push(phone); }
    if (address) { updates.push("address = ?"); params.push(address); }
    if (date_of_birth) { updates.push("date_of_birth = ?"); params.push(date_of_birth); }

    // If file uploaded, store filename (just filename, path will be /uploads/profiles/filename)
    if (req.file) {
      updates.push("profile_photo = ?");
      params.push(req.file.filename);
    }

    if (updates.length === 0) {
      // nothing to update
      return res.status(400).json({ success: false, message: "No update data provided" });
    }

    params.push(userId);
    const sql = `UPDATE users SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    mainDB.run(sql, params, function (err) {
      if (err) {
        console.error("❌ Error updating user:", err);
        return res.status(500).json({ success: false, message: "Error updating profile" });
      }

      // Fetch updated user row
      mainDB.get(`SELECT id, name, email, user_type, medical_license_path, profile_photo, phone, address, date_of_birth, created_at FROM users WHERE id = ?`, [userId], (err2, updatedUser) => {
        if (err2) {
          console.error("❌ Error fetching updated user:", err2);
          return res.status(500).json({ success: false, message: "Error fetching updated profile" });
        }

        // Make profile_photo accessible
        if (updatedUser.profile_photo && !updatedUser.profile_photo.startsWith("/uploads")) {
          updatedUser.profile_photo = `/uploads/profiles/${updatedUser.profile_photo}`;
        }

        return res.json({ success: true, message: "Profile updated", profile: updatedUser });
      });
    });
  } catch (error) {
    console.error("❌ PUT /api/profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
