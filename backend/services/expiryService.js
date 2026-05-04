// backend/services/expiryService.js
const { mainDB } = require('../database/dbConnections');

class ExpiryService {
  constructor() {
    this.initExpiryCheck();
  }

  // Initialize periodic expiry check (runs every day at midnight)
  initExpiryCheck() {
    // Run once on startup
    setTimeout(() => this.checkAllExpiries(), 5000);
    
    // Then run every day at midnight
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0
    );
    const msToMidnight = night.getTime() - now.getTime();
    
    setTimeout(() => {
      this.checkAllExpiries();
      setInterval(() => this.checkAllExpiries(), 24 * 60 * 60 * 1000);
    }, msToMidnight);
  }

  // Check all medicines for expiry
  async checkAllExpiries() {
    console.log('🔍 Running expiry check...');
    
    const query = `
      SELECT id, name, expiry_date, quantity, added_by, option_type
      FROM medicines 
      WHERE expiry_date IS NOT NULL 
      AND status != 'expired'
    `;
    
    mainDB.all(query, [], (err, medicines) => {
      if (err) {
        console.error('Expiry check error:', err);
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      medicines.forEach(medicine => {
        const expiryDate = new Date(medicine.expiry_date);
        expiryDate.setHours(0, 0, 0, 0);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        this.processMedicineExpiry(medicine, daysUntilExpiry);
      });
    });
  }

  processMedicineExpiry(medicine, daysUntilExpiry) {
    // Case 1: Expired - Remove listing
    if (daysUntilExpiry < 0) {
      this.handleExpiredMedicine(medicine);
    }
    // Case 2: 7 days before expiry - Hide listing
    else if (daysUntilExpiry <= 7) {
      this.handleExpiringSoon(medicine, daysUntilExpiry);
    }
    // Case 3: 30 days before expiry - Warn donor
    else if (daysUntilExpiry <= 30) {
      this.handleExpiryWarning(medicine, daysUntilExpiry);
    }
  }

  handleExpiredMedicine(medicine) {
    console.log(`❌ Medicine expired: ${medicine.name} (ID: ${medicine.id})`);
    
    // Update medicine status to expired
    mainDB.run(
      `UPDATE medicines SET status = 'expired', is_active = 0 WHERE id = ?`,
      [medicine.id],
      (err) => {
        if (err) console.error('Error updating expired medicine:', err);
      }
    );
    
    // Create notification for donor
    this.createNotification(
      medicine.added_by,
      'medicine_expired',
      `Your medicine "${medicine.name}" has expired and has been removed from listings.`,
      'warning',
      medicine.id
    );
  }

  handleExpiringSoon(medicine, daysUntilExpiry) {
    console.log(`⚠️ Medicine expiring soon: ${medicine.name} (${daysUntilExpiry} days left)`);
    
    // Hide listing by setting is_active to 0
    mainDB.run(
      `UPDATE medicines SET is_active = 0, status = 'expiring_soon' WHERE id = ?`,
      [medicine.id],
      (err) => {
        if (err) console.error('Error hiding expiring medicine:', err);
      }
    );
    
    // Create notification for donor
    this.createNotification(
      medicine.added_by,
      'medicine_expiring_soon',
      `⚠️ Your medicine "${medicine.name}" will expire in ${daysUntilExpiry} days and has been hidden from listings.`,
      'warning',
      medicine.id
    );
  }

  handleExpiryWarning(medicine, daysUntilExpiry) {
    console.log(`📧 Expiry warning: ${medicine.name} (${daysUntilExpiry} days left)`);
    
    // Create notification for donor
    this.createNotification(
      medicine.added_by,
      'medicine_expiry_warning',
      `Your medicine "${medicine.name}" will expire in ${daysUntilExpiry} days. Please consider donating it soon.`,
      'info',
      medicine.id
    );
  }

  createNotification(userId, type, message, priority, relatedId = null) {
    const query = `
      INSERT INTO notifications (user_id, type, message, priority, related_id, created_at, is_read)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 0)
    `;
    
    mainDB.run(query, [userId, type, message, priority, relatedId], (err) => {
      if (err) console.error('Error creating notification:', err);
      else console.log(`✅ Notification created for user ${userId}`);
    });
  }

  // Get expiry status for UI display
  getExpiryStatus(expiryDate) {
    if (!expiryDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { text: 'Expired', class: 'expired', severity: 'danger', icon: '❌' };
    } else if (daysUntilExpiry <= 7) {
      return { text: `Expires in ${daysUntilExpiry} days`, class: 'expiring-soon', severity: 'critical', icon: '🔴' };
    } else if (daysUntilExpiry <= 30) {
      return { text: `Expires in ${daysUntilExpiry} days`, class: 'expiring-month', severity: 'warning', icon: '🟡' };
    } else {
      return { text: `Expires in ${Math.floor(daysUntilExpiry / 30)} months`, class: 'valid', severity: 'good', icon: '🟢' };
    }
  }

  // Get user notifications
  getUserNotifications(userId, limit = 20) {
    return new Promise((resolve, reject) => {
      mainDB.all(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limit],
        (err, notifications) => {
          if (err) reject(err);
          else resolve(notifications);
        }
      );
    });
  }

  // Mark notification as read
  markNotificationAsRead(notificationId) {
    return new Promise((resolve, reject) => {
      mainDB.run(
        `UPDATE notifications SET is_read = 1 WHERE id = ?`,
        [notificationId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Get unread count for user
  getUnreadCount(userId) {
    return new Promise((resolve, reject) => {
      mainDB.get(
        `SELECT COUNT(*) as count FROM notifications 
         WHERE user_id = ? AND is_read = 0`,
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result?.count || 0);
        }
      );
    });
  }
}

module.exports = new ExpiryService();