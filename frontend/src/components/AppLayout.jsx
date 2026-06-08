import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <nav className="topbar">
        <Link to="/dashboard" className="topbar-logo">
          TASKFLOW<span>_</span>
        </Link>
        <div className="topbar-right">
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn btn-ghost btn-sm">Admin</Link>
          )}
          <span className="user-badge">{user?.name}</span>
          <span className={`role-pill ${user?.role === 'admin' ? 'admin' : ''}`}>{user?.role}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
        </div>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
