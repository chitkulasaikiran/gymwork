import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">Gym & Work</Link>
      <div className="navbar-user">
        <ul className="navbar-nav">
          <li><Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Dashboard</Link></li>
          <li><Link to="/dashboard/workout" className={isActive('/dashboard/workout') ? 'active' : ''}>Today</Link></li>
          <li><Link to="/dashboard/workouts" className={isActive('/dashboard/workouts') ? 'active' : ''}>History</Link></li>
        </ul>
        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
