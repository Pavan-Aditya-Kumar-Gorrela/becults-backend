import express from 'express';
import {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getCurrentUser,
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Protected routes
// router.get('/me', protect, getCurrentUser);

export default router;
