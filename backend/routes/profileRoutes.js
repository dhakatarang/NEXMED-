const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authMiddleware } = require("../utils/authMiddleware");
const { mainDB, uploadsBaseDir } = require("../database/dbConnections");

// Use persistent storage directory for profiles
const profilesDir = path.join(uploadsBaseDir, "profiles");
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
  console.log(`📁 Created profiles directory: ${profilesDir}`);
}

// Multer config - store profile photos in persistent storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
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
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, JPG allowed."));
    }
  }
});

// GET /api/profile
router.get("/", authMiddleware, (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Get latest user data from DB
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

// PUT /api/profile - Update profile with photo upload
router.put("/", authMiddleware, upload.single("profile_photo"), (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Fields allowed to update
    const { name, email, user_type, phone, address, date_of_birth } = req.body;
    const updates = [];
    const params = [];

    if (name && name.trim()) { 
      updates.push("name = ?"); 
      params.push(name.trim()); 
    }
    if (email && email.trim()) { 
      updates.push("email = ?"); 
      params.push(email.trim()); 
    }
    if (user_type && user_type.trim()) { 
      updates.push("user_type = ?"); 
      params.push(user_type.trim()); 
    }
    if (phone && phone.trim()) { 
      updates.push("phone = ?"); 
      params.push(phone.trim()); 
    }
    if (address && address.trim()) { 
      updates.push("address = ?"); 
      params.push(address.trim()); 
    }
    if (date_of_birth) { 
      updates.push("date_of_birth = ?"); 
      params.push(date_of_birth); 
    }

    // If file uploaded, store filename
    if (req.file) {
      updates.push("profile_photo = ?");
      params.push(req.file.filename);
      console.log(`📸 Uploaded profile photo: ${req.file.filename}`);
    }

    if (updates.length === 0) {
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