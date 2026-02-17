import Channel from '../models/Channel.js';
import Message from '../models/Message.js';
import Cohort from '../models/Cohort.js';

// @desc    Get channel info (public - checks enrollment)
// @route   GET /api/channels/:channelKey
// @access  Private
export const getChannelInfo = async (req, res) => {
  try {
    const { channelKey } = req.params;
    const userId = req.user._id;

    // Find channel
    let channel = await Channel.findOne({ channelKey })
      .populate('cohortId', 'title enrolledUsers')
      .populate('members.user', 'fullName email profileImage');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Check if user is enrolled in the cohort (admins can bypass)
    const cohort = channel.cohortId;
    const isEnrolled = cohort.enrolledUsers.includes(userId);
    const isAdmin = req.user.isAdmin;

    if (!isEnrolled && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this cohort',
      });
    }

    // Get user's permission in this channel
    let member = channel.members.find(m => m.user._id.toString() === userId.toString());
    
    // Auto-add user to channel if not already a member (with canChat: true by default)
    // Admins are always added with canChat: true
    if (!member) {
      channel.members.push({ user: userId, canChat: true });
      await channel.save();
      
      // Reload to get populated member data
      channel = await Channel.findOne({ channelKey })
        .populate('cohortId', 'title enrolledUsers')
        .populate('members.user', 'fullName email profileImage');
      
      member = channel.members.find(m => m.user._id.toString() === userId.toString());
    }
    
    // Ensure admins always have canChat: true
    if (isAdmin && member && !member.canChat) {
      member.canChat = true;
      await channel.save();
    }

    const canChat = member ? member.canChat : true;
    const isMuted = member && !member.canChat;

    res.status(200).json({
      success: true,
      data: {
        channelKey: channel.channelKey,
        cohortId: channel.cohortId._id,
        cohortTitle: channel.cohortId.title,
        members: channel.members,
        canChat,
        isMuted,
        isEnrolled: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get channel messages
// @route   GET /api/channels/:channelKey/messages
// @access  Private
export const getChannelMessages = async (req, res) => {
  try {
    const { channelKey } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const userId = req.user._id;

    // Find channel
    const channel = await Channel.findOne({ channelKey })
      .populate('cohortId', 'enrolledUsers');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Check if user is enrolled in the cohort (admins can bypass)
    const isEnrolled = channel.cohortId.enrolledUsers.includes(userId);
    const isAdmin = req.user.isAdmin;
    if (!isEnrolled && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this cohort',
      });
    }

    // Fetch messages
    const messages = await Message.find({
      channel: channel._id,
      isDeleted: false,
    })
      .populate('sender', 'fullName profileImage email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalMessages = await Message.countDocuments({
      channel: channel._id,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: {
        total: totalMessages,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send message to channel
// @route   POST /api/channels/:channelKey/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { channelKey } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required',
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long (max 1000 characters)',
      });
    }

    // Find channel
    const channel = await Channel.findOne({ channelKey })
      .populate('cohortId', 'enrolledUsers');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Check if user is enrolled in the cohort (admins can bypass)
    const isEnrolled = channel.cohortId.enrolledUsers.includes(userId);
    const isAdmin = req.user.isAdmin;
    if (!isEnrolled && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this cohort',
      });
    }

    // Check if user is muted (admins cannot be muted)
    const member = channel.members.find(m => m.user.toString() === userId.toString());
    if ((!member || !member.canChat) && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are muted in this channel',
      });
    }

    // Auto-add admin to channel if not already a member
    if (isAdmin && !member) {
      channel.members.push({ user: userId, canChat: true });
      await channel.save();
    }

    // Create message
    const message = await Message.create({
      channel: channel._id,
      sender: userId,
      text: text.trim(),
    });

    // Populate sender info
    await message.populate('sender', 'fullName profileImage email');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mute user in channel (admin only)
// @route   PATCH /api/channels/:channelKey/mute
// @access  Private/Admin
export const muteUser = async (req, res) => {
  try {
    const { channelKey } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const channel = await Channel.findOne({ channelKey });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Find member
    const member = channel.members.find(m => m.user.toString() === userId.toString());
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this channel',
      });
    }

    // Mute user
    member.canChat = false;
    member.mutedAt = new Date();
    await channel.save();

    res.status(200).json({
      success: true,
      message: 'User muted successfully',
      data: channel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Unmute user in channel (admin only)
// @route   PATCH /api/channels/:channelKey/unmute
// @access  Private/Admin
export const unmuteUser = async (req, res) => {
  try {
    const { channelKey } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const channel = await Channel.findOne({ channelKey });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Find member
    const member = channel.members.find(m => m.user.toString() === userId.toString());
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this channel',
      });
    }

    // Unmute user
    member.canChat = true;
    member.mutedAt = null;
    await channel.save();

    res.status(200).json({
      success: true,
      message: 'User unmuted successfully',
      data: channel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove user from channel (admin only)
// @route   DELETE /api/channels/:channelKey/members/:userId
// @access  Private/Admin
export const removeUserFromChannel = async (req, res) => {
  try {
    const { channelKey, userId } = req.params;

    const channel = await Channel.findOne({ channelKey });

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    // Remove user from members
    channel.members = channel.members.filter(m => m.user.toString() !== userId.toString());
    await channel.save();

    res.status(200).json({
      success: true,
      message: 'User removed from channel',
      data: channel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add user to channel (called when user enrolls)
// @route   POST /api/channels/:channelKey/members
// @access  Private/Admin
export const addUserToChannel = async (req, res) => {
  try {
    const { channelKey } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    let channel = await Channel.findOne({ channelKey });

    // Create channel if it doesn't exist
    if (!channel) {
      const cohortId = req.body.cohortId;
      if (!cohortId) {
        return res.status(400).json({
          success: false,
          message: 'cohortId is required',
        });
      }

      channel = await Channel.create({
        channelKey,
        cohortId,
        members: [{ user: userId, canChat: true }],
        createdBy: req.user._id,
      });
    } else {
      // Add user if not already a member
      const isMember = channel.members.some(m => m.user.toString() === userId.toString());
      if (!isMember) {
        channel.members.push({ user: userId, canChat: true });
        await channel.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'User added to channel',
      data: channel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create a new community channel for a cohort (admin only)
// @route   POST /api/channels/admin/create
// @access  Private/Admin
export const createChannel = async (req, res) => {
  try {
    const { cohortId, description } = req.body;

    // Validate cohortId
    if (!cohortId) {
      return res.status(400).json({
        success: false,
        message: 'cohortId is required',
      });
    }

    // Verify cohort exists
    const cohort = await Cohort.findById(cohortId);
    if (!cohort) {
      return res.status(404).json({
        success: false,
        message: 'Cohort not found',
      });
    }

    // Check if channel already exists
    const channelKey = `cohort-${cohortId}`;
    const existingChannel = await Channel.findOne({ channelKey });
    if (existingChannel) {
      return res.status(400).json({
        success: false,
        message: 'Channel already exists for this cohort',
      });
    }

    // Create the channel
    const channel = await Channel.create({
      channelKey,
      cohortId,
      members: [],
      createdBy: req.user._id,
      description: description || `Community channel for ${cohort.title}`,
    });

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: channel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all cohorts for admin channel management
// @route   GET /api/channels/admin/cohorts
// @access  Private/Admin
export const getAllCohortsForChannels = async (req, res) => {
  try {
    const cohorts = await Cohort.find()
      .select('_id title description category enrolledUsers')
      .populate('createdBy', 'fullName email');

    // Add channel status for each cohort
    const cohortsWithChannelStatus = await Promise.all(
      cohorts.map(async (cohort) => {
        const channel = await Channel.findOne({ cohortId: cohort._id });
        return {
          ...cohort.toObject(),
          hasChannel: !!channel,
          channelKey: channel ? channel.channelKey : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: cohortsWithChannelStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
