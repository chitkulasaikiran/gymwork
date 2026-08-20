import { Link } from 'react-router-dom';

const WorkoutCard = ({ workout }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="workout-card">
      <div className="workout-card-date">{formatDate(workout.date)}</div>
      <div className="workout-card-name">{workout.workoutName}</div>
      {workout.duration && (
        <div className="workout-card-duration">{workout.duration} min</div>
      )}
      {workout.progressImage && (
        <img
          src={workout.progressImage}
          alt="Progress"
          className="workout-card-image"
        />
      )}
      <Link to={`/dashboard/workouts/${workout._id}`} className="workout-card-link">
        View Details
      </Link>
    </div>
  );
};

export default WorkoutCard;
