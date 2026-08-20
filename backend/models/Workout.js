const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
    },
    workoutName: {
      type: String,
      required: [true, 'Please add a workout name'],
      trim: true,
      maxlength: [100, 'Workout name cannot exceed 100 characters'],
    },
    exercises: {
      type: String,
      required: [true, 'Please add exercises'],
      trim: true,
    },
    duration: {
      type: Number,
      min: [1, 'Duration must be at least 1 minute'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    progressImage: {
      type: String,
    },
  },
  { timestamps: true }
);

workoutSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Workout', workoutSchema);
