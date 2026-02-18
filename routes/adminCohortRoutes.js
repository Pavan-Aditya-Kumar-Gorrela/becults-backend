import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  createCohort,
  getAllCohortsAdmin,
  getCohortAdmin,
  updateCohort,
  toggleCohortStatus,
  addRoadmapItem,
  deleteRoadmapItem,
  addVideo,
  deleteVideo,
  deleteCohort,
  addResource,
  deleteResource,
} from '../controllers/adminCohortController.js';

const router = express.Router();

// Apply protect and adminOnly middleware to all routes
router.use(protect, adminOnly);

// @route   GET /api/admin/cohorts
// @desc    Get all cohorts (admin - includes inactive)
router.get('/', getAllCohortsAdmin);

// @route   POST /api/admin/cohorts
// @desc    Create a new cohort
router.post('/', createCohort);

// @route   GET /api/admin/cohorts/:id
// @desc    Get single cohort details
router.get('/:id', getCohortAdmin);

// @route   PATCH /api/admin/cohorts/:id
// @desc    Update cohort details
router.patch('/:id', updateCohort);

// @route   PATCH /api/admin/cohorts/:id/toggle
// @desc    Toggle cohort active/inactive status
router.patch('/:id/toggle', toggleCohortStatus);

// @route   DELETE /api/admin/cohorts/:id
// @desc    Delete entire cohort
router.delete('/:id', deleteCohort);

// Roadmap management
// @route   POST /api/admin/cohorts/:id/roadmap
// @desc    Add roadmap item
router.post('/:id/roadmap', addRoadmapItem);

// @route   DELETE /api/admin/cohorts/:id/roadmap/:itemId
// @desc    Delete roadmap item
router.delete('/:id/roadmap/:itemId', deleteRoadmapItem);

// Video management
// @route   POST /api/admin/cohorts/:id/videos
// @desc    Add video
router.post('/:id/videos', addVideo);

// @route   DELETE /api/admin/cohorts/:id/videos/:videoId
// @desc    Delete video
router.delete('/:id/videos/:videoId', deleteVideo);

// Resource management
// @route   POST /api/admin/cohorts/:id/resources
// @desc    Add generic resource (image, pdf, link, etc.)
router.post('/:id/resources', addResource);

// @route   DELETE /api/admin/cohorts/:id/resources/:resourceId
// @desc    Delete resource
router.delete('/:id/resources/:resourceId', deleteResource);

export default router;
