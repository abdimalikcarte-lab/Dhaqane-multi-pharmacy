import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

export default function ProtectedRoute({ permission, children }) {
  const { user, loading, can } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <Navigate to="/" replace />;
  return children;
}
