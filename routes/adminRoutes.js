import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { getDashboardStats, inviteAdmin } from '../controllers/adminController.js';

const router = express.Router();

// @desc    Get dashboard stats (admin only)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', protect, adminOnly, getDashboardStats);

// @desc    Invite a new admin (admin only)
// @route   POST /api/admin/invite
// @access  Private/Admin
router.post('/invite', protect, adminOnly, inviteAdmin);

export default router;
