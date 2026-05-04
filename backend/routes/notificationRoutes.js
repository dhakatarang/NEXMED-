// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { mainDB } = require('../database/dbConnections');
const { authMiddleware } = require('../utils/authMiddleware');
const expiryService = require('../services/expiryService');

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = await expiryService.getUserNotifications(userId);
    const unreadCount = await expiryService.getUnreadCount(userId);
    
    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await expiryService.markNotificationAsRead(req.params.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    mainDB.run(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [userId],
      (err) => {
        if (err) throw err;
        res.json({ success: true, message: 'All notifications marked as read' });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await expiryService.getUnreadCount(req.userId);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get expiry status for a medicine
router.get('/medicine-expiry/:medicineId', authMiddleware, async (req, res) => {
  try {
    mainDB.get(
      `SELECT expiry_date FROM medicines WHERE id = ?`,
      [req.params.medicineId],
      (err, medicine) => {
        if (err) throw err;
        const status = expiryService.getExpiryStatus(medicine?.expiry_date);
        res.json({ success: true, status });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;