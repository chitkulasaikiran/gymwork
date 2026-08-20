const express = require('express');
const router = express.Router();
const {
  createWorkout,
  getMyWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  getTodayWorkout,
  uploadMiddleware,
} = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/today', getTodayWorkout);
router.route('/').get(getMyWorkouts).post(uploadMiddleware, createWorkout);
router.route('/:id').get(getWorkoutById).put(uploadMiddleware, updateWorkout).delete(deleteWorkout);

module.exports = router;
