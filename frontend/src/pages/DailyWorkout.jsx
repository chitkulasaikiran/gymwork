import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { workoutService } from '../services/workoutService';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';

const MEAL_TYPES = [
  { key: 'preWorkout', label: 'Pre-Workout Meal', icon: '⚡', placeholder: 'e.g., Banana, oats, protein shake' },
  { key: 'postWorkout', label: 'Post-Workout Meal', icon: '💪', placeholder: 'e.g., Protein shake, chicken breast' },
  { key: 'breakfast', label: 'Breakfast', icon: '🍳', placeholder: 'e.g., Eggs, toast, oats' },
  { key: 'lunch', label: 'Lunch', icon: '🍱', placeholder: 'e.g., Rice, chicken, veggies' },
  { key: 'dinner', label: 'Dinner', icon: '🍽️', placeholder: 'e.g., Fish, salad, sweet potato' },
];

const DailyWorkout = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();
  const { addToast, ToastComponent } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workoutName: '',
    exercises: '',
    duration: '',
    notes: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [mealFiles, setMealFiles] = useState({});
  const [mealPreviews, setMealPreviews] = useState({});
  const [existingMeals, setExistingMeals] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!editId);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editId) {
      fetchWorkout(editId);
    }
  }, [editId]);

  const fetchWorkout = async (id) => {
    try {
      const res = await workoutService.getWorkoutById(id);
      const workout = res.data.data;
      setFormData({
        date: new Date(workout.date).toISOString().split('T')[0],
        workoutName: workout.workoutName,
        exercises: workout.exercises,
        duration: workout.duration || '',
        notes: workout.notes || '',
      });
      if (workout.progressImage) {
        setExistingImage(workout.progressImage);
      }
      if (workout.meals) {
        setExistingMeals(workout.meals);
      }
    } catch (error) {
      addToast('Failed to load workout', 'error');
      navigate('/dashboard');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateImage = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Only JPG, JPEG, PNG, and WebP files are allowed', 'error');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size must be less than 5MB', 'error');
      return false;
    }
    return true;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !validateImage(file)) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExistingImage('');
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage('');
  };

  const handleMealChange = (key, e) => {
    const file = e.target.files[0];
    if (!file || !validateImage(file)) return;
    setMealFiles((prev) => ({ ...prev, [key]: file }));
    setMealPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
    setExistingMeals((prev) => ({ ...prev, [key]: '' }));
  };

  const removeMeal = (key) => {
    setMealFiles((prev) => ({ ...prev, [key]: null }));
    setMealPreviews((prev) => ({ ...prev, [key]: null }));
    setExistingMeals((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.workoutName.trim()) {
      newErrors.workoutName = 'Workout name is required';
    }
    if (!formData.exercises.trim()) {
      newErrors.exercises = 'Exercises are required';
    }
    if (formData.duration && (isNaN(formData.duration) || Number(formData.duration) < 1)) {
      newErrors.duration = 'Duration must be a positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('date', formData.date);
      fd.append('workoutName', formData.workoutName);
      fd.append('exercises', formData.exercises);
      if (formData.duration) fd.append('duration', formData.duration);
      if (formData.notes) fd.append('notes', formData.notes);
      if (imageFile) fd.append('progressImage', imageFile);

      for (const key of Object.keys(mealFiles)) {
        if (mealFiles[key]) {
          fd.append(`meal_${key}`, mealFiles[key]);
        }
      }

      if (editId) {
        await workoutService.updateWorkout(editId, fd);
        addToast('Workout updated successfully');
      } else {
        await workoutService.createWorkout(fd);
        addToast('Workout saved successfully');
      }
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save workout';
      if (error.response?.data?.existingWorkoutId) {
        addToast(msg, 'error');
        navigate(`/dashboard/workouts/${error.response.data.existingWorkoutId}`);
      } else {
        addToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div>
        <Navbar />
        <div className="container"><div className="loading">Loading workout...</div></div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>{editId ? 'Edit Workout' : "Today's Workout"}</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Workout Name *</label>
            <input
              type="text"
              name="workoutName"
              value={formData.workoutName}
              onChange={handleChange}
              className={errors.workoutName ? 'error' : ''}
              placeholder="e.g., Chest & Triceps"
            />
            {errors.workoutName && <div className="error-text">{errors.workoutName}</div>}
          </div>

          <div className="form-group">
            <label>Exercises / What I Did *</label>
            <textarea
              name="exercises"
              value={formData.exercises}
              onChange={handleChange}
              className={errors.exercises ? 'error' : ''}
              rows={6}
              placeholder={"Bench Press - 4 x 10\nIncline Dumbbell Press - 3 x 12\nCable Fly - 3 x 15"}
            />
            {errors.exercises && <div className="error-text">{errors.exercises}</div>}
          </div>

          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className={errors.duration ? 'error' : ''}
              placeholder="e.g., 60"
              min="1"
            />
            {errors.duration && <div className="error-text">{errors.duration}</div>}
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="How did it feel?"
            />
          </div>

          <div className="form-group">
            <label>Progress Image</label>
            {(imagePreview || existingImage) ? (
              <div className="image-preview-container">
                <img
                  src={imagePreview || existingImage}
                  alt="Preview"
                  className="image-preview"
                />
                <button type="button" className="image-remove" onClick={removeImage}>
                  ×
                </button>
              </div>
            ) : (
              <label className="image-upload">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageChange}
                />
                <div className="image-upload-icon">💪</div>
                <div className="image-upload-text">
                  <span>Click to upload</span> progress photo
                  <br />
                  JPG, PNG, WebP (max 5MB)
                </div>
              </label>
            )}
          </div>

          <div className="section-divider">
            <span>Meals</span>
          </div>

          {MEAL_TYPES.map((meal) => (
            <div className="form-group" key={meal.key}>
              <label>{meal.icon} {meal.label}</label>
              {(mealPreviews[meal.key] || existingMeals[meal.key]) ? (
                <div className="image-preview-container">
                  <img
                    src={mealPreviews[meal.key] || existingMeals[meal.key]}
                    alt={meal.label}
                    className="image-preview"
                  />
                  <button type="button" className="image-remove" onClick={() => removeMeal(meal.key)}>
                    ×
                  </button>
                </div>
              ) : (
                <label className="image-upload">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleMealChange(meal.key, e)}
                  />
                  <div className="image-upload-icon">{meal.icon}</div>
                  <div className="image-upload-text">
                    <span>Click to upload</span> {meal.label.toLowerCase()} photo
                    <br />
                    JPG, PNG, WebP (max 5MB)
                  </div>
                </label>
              )}
            </div>
          ))}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving Workout...' : 'SAVE WORKOUT'}
          </button>
        </form>
      </div>
      <ToastComponent />
    </div>
  );
};

export default DailyWorkout;
