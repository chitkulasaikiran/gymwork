import { useState, useEffect } from 'react';
import { workoutService } from '../services/workoutService';
import Navbar from '../components/Navbar';
import WorkoutCard from '../components/WorkoutCard';
import { useToast } from '../components/Toast';

const WorkoutHistory = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await workoutService.getMyWorkouts();
      setWorkouts(res.data.data);
    } catch (error) {
      addToast('Failed to load workouts', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Workout History</h1>
          <p>All your logged workouts</p>
        </div>

        {loading ? (
          <div className="loading">Loading workouts...</div>
        ) : workouts.length === 0 ? (
          <div className="empty-state">
            <p>No workouts logged yet.</p>
          </div>
        ) : (
          workouts.map((workout) => (
            <WorkoutCard key={workout._id} workout={workout} />
          ))
        )}
      </div>
      <ToastComponent />
    </div>
  );
};

export default WorkoutHistory;
