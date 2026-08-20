const Workout = require('../models/Workout');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage - files go to buffer, then streamed to Cloudinary
const storage = multer.memoryStorage();

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
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'progressImage', maxCount: 1 },
  { name: 'mealImage', maxCount: 1 },
]);

exports.uploadMiddleware = upload;

const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

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
    if (req.files && req.files.progressImage) {
      progressImageUrl = await uploadToCloudinary(req.files.progressImage[0], 'gym-workouts');
    }

    let mealImageUrl = '';
    if (req.files && req.files.mealImage) {
      mealImageUrl = await uploadToCloudinary(req.files.mealImage[0], 'gym-meals');
    }

    const workout = await Workout.create({
      userId: req.user.id,
      date: workoutDate,
      workoutName,
      exercises,
      duration: duration || undefined,
      notes: notes || '',
      progressImage: progressImageUrl,
      mealImage: mealImageUrl,
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

    if (req.files && req.files.progressImage) {
      updateData.progressImage = await uploadToCloudinary(req.files.progressImage[0], 'gym-workouts');
    }

    if (req.files && req.files.mealImage) {
      updateData.mealImage = await uploadToCloudinary(req.files.mealImage[0], 'gym-meals');
    }

    if (!req.files?.progressImage && updateData.progressImage === undefined) {
      delete updateData.progressImage;
    }
    if (!req.files?.mealImage && updateData.mealImage === undefined) {
      delete updateData.mealImage;
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
