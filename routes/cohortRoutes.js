import express from 'express';
import {
  getAllCohorts,
  getUpcomingCohorts,
  getCohortById,
  getCohortDetails,
  createCohort,
  enrollInCohort,
  unenrollFromCohort,
  getUserEnrolledCohorts,
} from '../controllers/cohortController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllCohorts);
// NOTE: keep this BEFORE `/:id` so 'upcoming' is not treated as an :id
router.get('/upcoming', getUpcomingCohorts);
router.get('/:id', getCohortById);

// Protected routes (authenticated users)
router.get('/user/enrolled', protect, getUserEnrolledCohorts);
router.get('/:id/details', protect, getCohortDetails); // Must come before /:id/enroll
router.post('/:id/enroll', protect, enrollInCohort);
router.post('/:id/unenroll', protect, unenrollFromCohort);

// Admin routes
router.post('/', protect, adminOnly, createCohort);

export default router;
