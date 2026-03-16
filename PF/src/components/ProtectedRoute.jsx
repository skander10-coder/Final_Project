import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRole }) {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If user role doesn't match allowed role, redirect to home
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  
  // If everything is fine, show the page
  return children;
}