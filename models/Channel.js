import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    canChat: {
      type: Boolean,
      default: true,
    },
    mutedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const channelSchema = new mongoose.Schema(
  {
    channelKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // Format: cohort-${cohortId}
    },
    cohortId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cohort',
      required: true,
    },
    members: [memberSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
channelSchema.index({ channelKey: 1 });
channelSchema.index({ cohortId: 1 });

const Channel = mongoose.model('Channel', channelSchema);

export default Channel;
