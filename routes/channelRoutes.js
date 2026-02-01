import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getChannelInfo,
  getChannelMessages,
  sendMessage,
  muteUser,
  unmuteUser,
  removeUserFromChannel,
  addUserToChannel,
  createChannel,
  getAllCohortsForChannels,
} from '../controllers/channelController.js';

const router = express.Router();

// Public routes (requires enrollment verification)
router.get('/:channelKey', protect, getChannelInfo);
router.get('/:channelKey/messages', protect, getChannelMessages);
router.post('/:channelKey/messages', protect, sendMessage);

// Admin-only routes
router.patch('/:channelKey/mute', protect, adminOnly, muteUser);
router.patch('/:channelKey/unmute', protect, adminOnly, unmuteUser);
router.delete('/:channelKey/members/:userId', protect, adminOnly, removeUserFromChannel);
router.post('/:channelKey/members', protect, adminOnly, addUserToChannel);

// Admin channel management routes
router.post('/admin/create', protect, adminOnly, createChannel);
router.get('/admin/cohorts', protect, adminOnly, getAllCohortsForChannels);

export default router;
