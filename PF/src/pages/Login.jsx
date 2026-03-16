import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(message || '');

  // Prevent going back to protected pages after logout
  useEffect(() => {
    // Clear history and prevent back navigation
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = () => {
      // If user tries to go back, redirect to login
      window.location.href = '/login';
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await api.post('/api/login', formData);
      
      if (response.data.success) {
        // Save user to localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Force full page reload and redirect based on role
        switch(response.data.user.role) {
          case 'student':
            window.location.href = '/student';
            break;
          case 'company':
            window.location.href = '/company';
            break;
          case 'admin':
            window.location.href = '/admin';
            break;
          default:
            window.location.href = '/';
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="font-semibold text-lg text-slate-800">Stag.io</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in</h1>
          <p className="text-slate-600 text-sm mb-6">
            Enter your credentials to access your account.
          </p>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength="6"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </Link>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}