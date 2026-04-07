import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRole }) {
  const rawUser = localStorage.getItem('user');
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    // If localStorage is corrupted/unexpected, treat as logged out.
    user = null;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}