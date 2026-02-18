import User from '../models/User.js';
import Cohort from '../models/Cohort.js';
import { sendAdminInvitationEmail } from '../services/mailerService.js';

// @desc    Get dashboard stats (admin only)
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Fetch statistics in parallel for better performance
    const [
      totalUsers,
      totalAdmins,
      totalCohorts,
      activeCohorts,
      upcomingCohorts,
      allCohorts,
      recentUsers,
      recentCohorts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isAdmin: true }),
      Cohort.countDocuments(),
      Cohort.countDocuments({ isActive: true }),
      Cohort.countDocuments({ isActive: false }),
      Cohort.find().populate('createdBy', 'fullName email').sort({ createdAt: -1 }).limit(10),
      User.find().select('fullName email createdAt').sort({ createdAt: -1 }).limit(5),
      Cohort.find().populate('createdBy', 'fullName email').select('title createdAt isActive category').sort({ createdAt: -1 }).limit(5),
    ]);

    // Calculate total enrollments across all cohorts
    const totalEnrollments = allCohorts.reduce((sum, cohort) => {
      return sum + (cohort.enrolledUsers?.length || 0);
    }, 0);

    // Format recent activity
    const recentActivity = [];

    // Add recent cohorts
    recentCohorts.forEach((cohort) => {
      recentActivity.push({
        type: 'cohort',
        action: cohort.isActive ? 'created' : 'created (upcoming)',
        title: cohort.title,
        description: `Cohort "${cohort.title}" was ${cohort.isActive ? 'created' : 'created as upcoming'}`,
        category: cohort.category,
        timestamp: cohort.createdAt,
        createdBy: cohort.createdBy?.fullName || 'Unknown',
      });
    });

    // Add recent users
    recentUsers.forEach((user) => {
      recentActivity.push({
        type: 'user',
        action: 'registered',
        title: user.fullName,
        description: `New user "${user.fullName}" registered`,
        timestamp: user.createdAt,
      });
    });

    // Sort by timestamp (most recent first) and limit to 10
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    recentActivity.splice(10);

    // Format timestamps for display
    const formatTimeAgo = (date) => {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      if (seconds < 60) return `${seconds} seconds ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minutes ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hours ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days} days ago`;
      const weeks = Math.floor(days / 7);
      return `${weeks} weeks ago`;
    };

    const formattedActivity = recentActivity.map((activity) => ({
      ...activity,
      timeAgo: formatTimeAgo(activity.timestamp),
    }));

    res.status(200).json({
      success: true,
      message: 'Welcome to admin dashboard',
      admin: {
        id: req.user._id,
        name: req.user.fullName,
        email: req.user.email,
      },
      stats: {
        totalUsers,
        totalAdmins,
        totalCohorts,
        activeCohorts,
        upcomingCohorts,
        totalEnrollments,
      },
      recentActivity: formattedActivity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching dashboard statistics',
    });
  }
};

// @desc    Invite a new admin (admin only)
// @route   POST /api/admin/invite
// @access  Private/Admin
export const inviteAdmin = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Extract name from email if fullName not provided
    const nameToUse = fullName || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Create new admin user
    const newAdmin = await User.create({
      email: email.toLowerCase(),
      password,
      fullName: nameToUse,
      isAdmin: true,
      authProvider: 'local',
    });

    // Send invitation email
    try {
      await sendAdminInvitationEmail(email, password, req.user.fullName || 'Admin');
    } catch (emailError) {
      console.error('Failed to send admin invitation email:', emailError.message);
      // Continue even if email fails - admin is already created
      // Optionally, you could delete the user here if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Admin invitation sent successfully',
      data: {
        id: newAdmin._id,
        email: newAdmin.email,
        fullName: newAdmin.fullName,
        isAdmin: newAdmin.isAdmin,
      },
    });
  } catch (error) {
    console.error('Error inviting admin:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error inviting admin',
    });
  }
};
