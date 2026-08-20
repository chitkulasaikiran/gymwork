import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workoutService } from '../services/workoutService';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';

const WorkoutDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { addToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchWorkout();
  }, [id]);

  const fetchWorkout = async () => {
    try {
      const res = await workoutService.getWorkoutById(id);
      setWorkout(res.data.data);
    } catch (error) {
      addToast('Failed to load workout', 'error');
      navigate('/dashboard/workouts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await workoutService.deleteWorkout(id);
      addToast('Workout deleted successfully');
      navigate('/dashboard/workouts');
    } catch (error) {
      addToast('Failed to delete workout', 'error');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container"><div className="loading">Loading workout...</div></div>
      </div>
    );
  }

  if (!workout) return null;

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Workout Details</h1>
        </div>

        <div className="card">
          <div className="detail-row">
            <div className="detail-label">Date</div>
            <div className="detail-value">{formatDate(workout.date)}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Workout Name</div>
            <div className="detail-value">{workout.workoutName}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Exercises</div>
            <div className="detail-value">{workout.exercises}</div>
          </div>

          {workout.duration && (
            <div className="detail-row">
              <div className="detail-label">Duration</div>
              <div className="detail-value">{workout.duration} minutes</div>
            </div>
          )}

          {workout.notes && (
            <div className="detail-row">
              <div className="detail-label">Notes</div>
              <div className="detail-value">{workout.notes}</div>
            </div>
          )}

          {workout.progressImage && (
            <img
              src={workout.progressImage}
              alt="Progress"
              className="detail-image"
            />
          )}

          <div className="detail-actions">
            <Link
              to={`/dashboard/workout?edit=${workout._id}`}
              className="btn btn-outline"
            >
              Edit Workout
            </Link>
            <button
              className="btn btn-danger"
              onClick={() => setShowConfirm(true)}
            >
              Delete Workout
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Workout?</h3>
            <p>This action cannot be undone.</p>
            <div className="confirm-actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastComponent />
    </div>
  );
};

export default WorkoutDetails;
