import Cohort from '../models/Cohort.js';

// @desc    Get all active cohorts
// @route   GET /api/cohorts
// @access  Public
export const getAllCohorts = async (req, res) => {
  try {
    const { category } = req.query;

    let query = { isActive: true };

    // Filter by category if provided
    if (category && category !== 'All') {
      query.category = category;
    }

    const cohorts = await Cohort.find(query)
      .populate('createdBy', 'fullName profileImage')
      .select('title description category enrolledUsers createdBy createdAt');

    res.status(200).json({
      success: true,
      count: cohorts.length,
      data: cohorts,
    });
  } catch (error) {
    console.error('[Cohort] Get all cohorts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cohorts',
      error: error.message,
    });
  }
};

// @desc    Get single cohort by ID (public - no enrollment check)
// @route   GET /api/cohorts/:id
// @access  Public
export const getCohortById = async (req, res) => {
  try {
    const { id } = req.params;

    const cohort = await Cohort.findById(id)
      .populate('createdBy', 'fullName profileImage email')
      .select('-enrolledUsers'); // Don't return full enrolledUsers list for public view

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    res.status(200).json({
      success: true,
      data: cohort,
    });
  } catch (error) {
    console.error('[Cohort] Get cohort by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cohort',
      error: error.message,
    });
  }
};

// @desc    Get cohort details (enrolled users only)
// @route   GET /api/cohorts/:id/details
// @access  Private (Enrolled users)
export const getCohortDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find cohort
    const cohort = await Cohort.findById(id)
      .populate('createdBy', 'fullName profileImage email');

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    // Check if user is enrolled
    const isEnrolled = cohort.enrolledUsers.includes(userId);

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this cohort',
      });
    }

    console.log('[Cohort] User accessed cohort details:', { userId, cohortId: id });

    // Return full cohort data including roadmap and videos
    res.status(200).json({
      success: true,
      data: {
        _id: cohort._id,
        title: cohort.title,
        description: cohort.description,
        category: cohort.category,
        createdBy: cohort.createdBy,
        roadmap: cohort.roadmap || [],
        videos: cohort.videos || [],
        enrolledUsers: cohort.enrolledUsers || [],
        enrolledCount: cohort.enrolledUsers.length,
        isActive: cohort.isActive,
        createdAt: cohort.createdAt,
        updatedAt: cohort.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Cohort] Get cohort details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cohort details',
      error: error.message,
    });
  }
};
    
// @desc    Create cohort (Admin only)
// @route   POST /api/cohorts
// @access  Private/Admin
export const createCohort = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    // Validation
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category',
      });
    }

    const cohort = await Cohort.create({
      title,
      description,
      category,
      createdBy: req.user._id,
      isActive: true,
      enrolledUsers: [],
    });

    res.status(201).json({
      success: true,
      message: 'Cohort created successfully',
      data: cohort,
    });
  } catch (error) {
    console.error('[Cohort] Create cohort error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating cohort',
      error: error.message,
    });
  }
};

// @desc    Enroll user into cohort
// @route   POST /api/cohorts/:id/enroll
// @access  Private
export const enrollInCohort = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find cohort
    const cohort = await Cohort.findById(id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    // Check if cohort is active
    if (!cohort.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This cohort is no longer active',
      });
    }

    // Check if user already enrolled
    if (cohort.enrolledUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this cohort',
      });
    }

    // Add user to enrolledUsers
    cohort.enrolledUsers.push(userId);
    await cohort.save();

    console.log('[Cohort] User enrolled:', { userId, cohortId: id });

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in cohort',
      data: cohort,
    });
  } catch (error) {
    console.error('[Cohort] Enroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in cohort',
      error: error.message,
    });
  }
};

// @desc    Unenroll user from cohort
// @route   POST /api/cohorts/:id/unenroll
// @access  Private
export const unenrollFromCohort = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find cohort
    const cohort = await Cohort.findById(id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    // Check if user is enrolled
    if (!cohort.enrolledUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this cohort',
      });
    }

    // Remove user from enrolledUsers
    cohort.enrolledUsers = cohort.enrolledUsers.filter(
      (id) => id.toString() !== userId.toString()
    );
    await cohort.save();

    console.log('[Cohort] User unenrolled:', { userId, cohortId: id });

    res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from cohort',
      data: cohort,
    });
  } catch (error) {
    console.error('[Cohort] Unenroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unenrolling from cohort',
      error: error.message,
    });
  }
};

// @desc    Get user's enrolled cohorts
// @route   GET /api/cohorts/user/enrolled
// @access  Private
export const getUserEnrolledCohorts = async (req, res) => {
  try {
    const userId = req.user._id;

    const cohorts = await Cohort.find({
      enrolledUsers: userId,
      isActive: true,
    })
      .populate('createdBy', 'fullName profileImage')
      .select('title description category enrolledUsers createdBy createdAt');

    res.status(200).json({
      success: true,
      count: cohorts.length,
      data: cohorts,
    });
  } catch (error) {
    console.error('[Cohort] Get user enrolled cohorts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled cohorts',
      error: error.message,
    });
  }
};

export default {
  getAllCohorts,
  getCohortById,
  getCohortDetails,
  createCohort,
  enrollInCohort,
  unenrollFromCohort,
  getUserEnrolledCohorts,
};
