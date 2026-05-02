const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadsBaseDir } = require('../database/dbConnections');

// Use persistent storage directory
const uploadsDir = uploadsBaseDir;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadsDir}`);
}

// Create subdirectories
const subDirs = ['items', 'profiles', 'licenses', 'scans', 'temp'];
subDirs.forEach(subDir => {
  const dirPath = path.join(uploadsDir, subDir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created ${subDir} directory: ${dirPath}`);
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type or route
    let destFolder = 'temp';
    
    if (req.baseUrl && req.baseUrl.includes('profile')) {
      destFolder = 'profiles';
    } else if (req.baseUrl && req.baseUrl.includes('equipment-scan')) {
      destFolder = 'scans';
    } else if (req.baseUrl && req.baseUrl.includes('donaterent')) {
      destFolder = 'items';
    } else if (file.fieldname === 'medicalLicense') {
      destFolder = 'licenses';
    }
    
    const destPath = path.join(uploadsDir, destFolder);
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'medicalLicense' ? 'license' : 'upload';
    cb(null, prefix + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  // Also allow PDF for licenses
  if (file.fieldname === 'medicalLicense' && file.mimetype === 'application/pdf') {
    cb(null, true);
    return;
  }
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;