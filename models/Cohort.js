import mongoose from 'mongoose';

const roadmapItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { _id: true });

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  videoUrl: {
    type: String,
    required: true,
    // Validate YouTube URL format
    validate: {
      validator: function(v) {
        return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/.test(v) || 
               /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}/.test(v);
      },
      message: 'Please provide a valid YouTube URL',
    },
  },
  duration: {
    type: String, // e.g., "15:30"
    default: null,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { _id: true });

const cohortSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Web Development',
        'Mobile Apps',
        'Data Science',
        'UI/UX Design',
        'Cloud Computing',
        'AI & ML',
        'Python',
        'JavaScript',
        'React',
        'Other'
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrolledUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    roadmap: [roadmapItemSchema],
    videos: [videoSchema],
  },
  { timestamps: true }
);

// Index for faster queries
cohortSchema.index({ isActive: 1 });
cohortSchema.index({ category: 1 });

export default mongoose.model('Cohort', cohortSchema);
