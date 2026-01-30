import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get dashboard stats (admin only)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', protect, adminOnly, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Welcome to admin dashboard',
      admin: req.user,
      stats: {
        totalUsers: 150,
        totalAdmins: 5,
        activeLogins: 42,
        pendingRequests: 8,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
