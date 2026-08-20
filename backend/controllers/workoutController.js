const Workout = require('../models/Workout');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure cloudinary if credentials are provided
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Local storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WebP files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single('progressImage');

exports.uploadMiddleware = upload;

// @desc    Create a workout
// @route   POST /api/workouts
exports.createWorkout = async (req, res) => {
  try {
    const { date, workoutName, exercises, duration, notes } = req.body;

    if (!date || !workoutName || !exercises) {
      return res.status(400).json({ success: false, message: 'Date, workout name, and exercises are required' });
    }

    const workoutDate = new Date(date);
    workoutDate.setHours(0, 0, 0, 0);

    // Check for duplicate workout on same day
    const existingWorkout = await Workout.findOne({
      userId: req.user.id,
      date: {
        $gte: new Date(workoutDate.setHours(0, 0, 0, 0)),
        $lt: new Date(workoutDate.setHours(23, 59, 59, 999)),
      },
    });

    if (existingWorkout) {
      return res.status(400).json({
        success: false,
        message: 'You have already logged a workout for this date',
        existingWorkoutId: existingWorkout._id,
      });
    }

    let progressImageUrl = '';
    if (req.file) {
      if (process.env.UPLOAD_TYPE === 'cloudinary' && process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'gym-workouts',
          resource_type: 'image',
        });
        progressImageUrl = result.secure_url;
      } else {
        progressImageUrl = `/uploads/${req.file.filename}`;
      }
    }

    const workout = await Workout.create({
      userId: req.user.id,
      date: workoutDate,
      workoutName,
      exercises,
      duration: duration || undefined,
      notes: notes || '',
      progressImage: progressImageUrl,
    });

    res.status(201).json({ success: true, data: workout });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already logged a workout for this date',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all workouts for authenticated user
// @route   GET /api/workouts
exports.getMyWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.user.id }).sort({ date: -1 });
    res.status(200).json({ success: true, count: workouts.length, data: workouts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single workout by ID
// @route   GET /api/workouts/:id
exports.getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (workout.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this workout' });
    }

    res.status(200).json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a workout
// @route   PUT /api/workouts/:id
exports.updateWorkout = async (req, res) => {
  try {
    let workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (workout.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this workout' });
    }

    let updateData = { ...req.body };

    // Handle image upload if new image provided
    if (req.file) {
      if (process.env.UPLOAD_TYPE === 'cloudinary' && process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'gym-workouts',
          resource_type: 'image',
        });
        updateData.progressImage = result.secure_url;
      } else {
        updateData.progressImage = `/uploads/${req.file.filename}`;
      }
    }

    // Remove progressImage from updateData if no new file
    if (!req.file && updateData.progressImage === undefined) {
      delete updateData.progressImage;
    }

    workout = await Workout.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a workout
// @route   DELETE /api/workouts/:id
exports.deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (workout.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this workout' });
    }

    await Workout.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Workout deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's workout
// @route   GET /api/workouts/today
exports.getTodayWorkout = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const workout = await Workout.findOne({
      userId: req.user.id,
      date: { $gte: today, $lt: tomorrow },
    });

    res.status(200).json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
