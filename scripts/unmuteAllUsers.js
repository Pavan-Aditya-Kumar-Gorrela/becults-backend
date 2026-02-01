import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Channel from '../models/Channel.js';

dotenv.config();

async function unmuteAllUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected');

    // Find all channels
    const channels = await Channel.find();
    console.log(`Found ${channels.length} channels`);

    let totalUnmuted = 0;

    // Unmute all users in each channel
    for (const channel of channels) {
      let channelUnmuted = 0;

      // Update all members to canChat: true
      for (const member of channel.members) {
        if (!member.canChat) {
          member.canChat = true;
          member.mutedAt = null;
          channelUnmuted++;
          totalUnmuted++;
        }
      }

      if (channelUnmuted > 0) {
        await channel.save();
        console.log(`✓ Channel ${channel.channelKey}: Unmuted ${channelUnmuted} users`);
      }
    }

    console.log(`\n✓ Successfully unmuted ${totalUnmuted} total users across all channels`);
    console.log('✓ All users can now message in their channels');

    process.exit(0);
  } catch (err) {
    console.error('Error unmuting users:', err);
    process.exit(1);
  }
}

unmuteAllUsers();
