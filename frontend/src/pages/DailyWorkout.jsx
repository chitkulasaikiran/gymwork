import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { workoutService } from '../services/workoutService';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';

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
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!editId);

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
    } catch (error) {
      addToast('Failed to load workout', 'error');
      navigate('/dashboard');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Only JPG, JPEG, PNG, and WebP files are allowed', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size must be less than 5MB', 'error');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExistingImage('');
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.workoutName.trim()) {
      addToast('Workout name is required', 'error');
      return;
    }
    if (!formData.exercises.trim()) {
      addToast('Exercises are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('date', formData.date);
      fd.append('workoutName', formData.workoutName);
      fd.append('exercises', formData.exercises);
      if (formData.duration) fd.append('duration', formData.duration);
      if (formData.notes) fd.append('notes', formData.notes);
      if (imageFile) fd.append('progressImage', imageFile);

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

        <form onSubmit={handleSubmit}>
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
              required
              placeholder="e.g., Chest & Triceps"
            />
          </div>

          <div className="form-group">
            <label>Exercises / What I Did *</label>
            <textarea
              name="exercises"
              value={formData.exercises}
              onChange={handleChange}
              required
              rows={6}
              placeholder={"Bench Press - 4 x 10\nIncline Dumbbell Press - 3 x 12\nCable Fly - 3 x 15"}
            />
          </div>

          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 60"
              min="1"
            />
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
                <div className="image-upload-icon">📷</div>
                <div className="image-upload-text">
                  <span>Click to upload</span> or drag and drop
                  <br />
                  JPG, PNG, WebP (max 5MB)
                </div>
              </label>
            )}
          </div>

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
