import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workoutService } from '../services/workoutService';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast, ToastComponent } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodayWorkout();
  }, []);

  const fetchTodayWorkout = async () => {
    try {
      const res = await workoutService.getTodayWorkout();
      setTodayWorkout(res.data.data);
    } catch (error) {
      console.error('Error fetching today workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Welcome, {user?.name}</h1>
          <p>Your fitness dashboard</p>
        </div>

        <div className="card">
          <h3>Today's Workout</h3>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : todayWorkout ? (
            <div className="daily-card">
              <div className="workout-name">{todayWorkout.workoutName}</div>
              <div className="workout-meta">
                {formatDate(todayWorkout.date)}
                {todayWorkout.duration && ` • ${todayWorkout.duration} min`}
              </div>
              {todayWorkout.progressImage && (
                <img
                  src={todayWorkout.progressImage}
                  alt="Progress"
                  className="workout-card-image"
                />
              )}
              <div className="duplicate-actions">
                <Link
                  to={`/dashboard/workouts/${todayWorkout._id}`}
                  className="btn btn-outline btn-sm"
                >
                  View Details
                </Link>
                <Link
                  to={`/dashboard/workout?edit=${todayWorkout._id}`}
                  className="btn btn-outline btn-sm"
                >
                  Edit Workout
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">💪</div>
              <p>You haven't logged today's workout yet.</p>
              <Link to="/dashboard/workout" className="btn btn-primary">
                Log Today's Workout
              </Link>
            </div>
          )}
        </div>
      </div>
      <ToastComponent />
    </div>
  );
};

export default Dashboard;
