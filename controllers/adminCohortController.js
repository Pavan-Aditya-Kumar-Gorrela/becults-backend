import Cohort from '../models/Cohort.js';

// @desc    Create a new cohort (admin only)
// @route   POST /api/admin/cohorts
// @access  Private/Admin
export const createCohort = async (req, res) => {
  try {
    const { title, description, category, roadmap = [], videos = [] } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category',
      });
    }

    // Create cohort
    const cohort = await Cohort.create({
      title,
      description,
      category,
      createdBy: req.user._id,
      roadmap,
      videos,
      isActive: true,
      enrolledUsers: [],
    });

    res.status(201).json({
      success: true,
      message: 'Cohort created successfully',
      data: cohort,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all cohorts (admin - includes inactive)
// @route   GET /api/admin/cohorts
// @access  Private/Admin
export const getAllCohortsAdmin = async (req, res) => {
  try {
    const cohorts = await Cohort.find()
      .populate('createdBy', 'fullName email')
      .populate('enrolledUsers', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cohorts,
      count: cohorts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single cohort details (admin)
// @route   GET /api/admin/cohorts/:id
// @access  Private/Admin
export const getCohortAdmin = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .populate('enrolledUsers', 'fullName email');

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update cohort details (admin)
// @route   PATCH /api/admin/cohorts/:id
// @access  Private/Admin
export const updateCohort = async (req, res) => {
  try {
    const { title, description, category, roadmap, videos } = req.body;

    // Find cohort
    let cohort = await Cohort.findById(req.params.id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    // Update fields if provided
    if (title !== undefined) cohort.title = title;
    if (description !== undefined) cohort.description = description;
    if (category !== undefined) cohort.category = category;
    if (roadmap !== undefined) cohort.roadmap = roadmap;
    if (videos !== undefined) cohort.videos = videos;

    // Save
    cohort = await cohort.save();

    res.status(200).json({
      success: true,
      message: 'Cohort updated successfully',
      data: cohort,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle cohort active/inactive status
// @route   PATCH /api/admin/cohorts/:id/toggle
// @access  Private/Admin
export const toggleCohortStatus = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    cohort.isActive = !cohort.isActive;
    await cohort.save();

    res.status(200).json({
      success: true,
      message: `Cohort ${cohort.isActive ? 'activated' : 'deactivated'} successfully`,
      data: cohort,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add roadmap item to cohort
// @route   POST /api/admin/cohorts/:id/roadmap
// @access  Private/Admin
export const addRoadmapItem = async (req, res) => {
  try {
    const { title, description, order } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and description',
      });
    }

    const cohort = await Cohort.findById(req.params.id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    cohort.roadmap.push({
      title,
      description,
      order: order || cohort.roadmap.length + 1,
    });

    await cohort.save();

    res.status(201).json({
      success: true,
      message: 'Roadmap item added',
      data: cohort,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete roadmap item from cohort
// @route   DELETE /api/admin/cohorts/:id/roadmap/:itemId
// @access  Private/Admin
export const deleteRoadmapItem = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    cohort.roadmap = cohort.roadmap.filter(item => item._id.toString() !== req.params.itemId);
    await cohort.save();

    res.status(200).json({
      success: true,
      message: 'Roadmap item deleted',
      data: cohort,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add video to cohort
// @route   POST /api/admin/cohorts/:id/videos
// @access  Private/Admin
export const addVideo = async (req, res) => {
  try {
    const { title, videoUrl, duration, order } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and videoUrl',
      });
    }

    const cohort = await Cohort.findById(req.params.id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    cohort.videos.push({
      title,
      videoUrl,
      duration: duration || null,
      order: order || cohort.videos.length + 1,
    });

    await cohort.save();

    res.status(201).json({
      success: true,
      message: 'Video added',
      data: cohort,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete video from cohort
// @route   DELETE /api/admin/cohorts/:id/videos/:videoId
// @access  Private/Admin
export const deleteVideo = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    cohort.videos = cohort.videos.filter(video => video._id.toString() !== req.params.videoId);
    await cohort.save();

    res.status(200).json({
      success: true,
      message: 'Video deleted',
      data: cohort,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete entire cohort
// @route   DELETE /api/admin/cohorts/:id
// @access  Private/Admin
export const deleteCohort = async (req, res) => {
  try {
    const cohort = await Cohort.findByIdAndDelete(req.params.id);

    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cohort deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
