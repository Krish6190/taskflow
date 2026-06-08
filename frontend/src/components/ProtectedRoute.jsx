import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><span className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><span className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><span className="spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
