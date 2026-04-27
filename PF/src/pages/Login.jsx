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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(message || '');

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return;
    try {
      const user = JSON.parse(rawUser);
      if (!user?.role) return;
      navigate(`/${user.role}`, { replace: true });
    } catch { }
  }, [navigate]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
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

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    try {
      const response = await api.post('/api/login', formData);
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate(`/${response.data.user.role}`, { replace: true });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">

      {/* Container */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">

        {/* LEFT SIDE (Design) */}
        <div className="hidden lg:flex relative bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-12 flex-col justify-center">

          {/* overlay light */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>

          <div className="relative z-10 max-w-md">

            <h2 className="text-4xl font-bold leading-tight mb-6">
              Welcome Back
            </h2>

            <p className="text-indigo-100 text-lg leading-relaxed mb-10">
              Access your dashboard, track your applications and continue your journey toward your dream internship.
            </p>

            {/* IMAGE PLACE */}
            <div className="w-full h-56 flex items-center justify-center">
              <img
                src="/Images/login.svg"
                alt="Login illustration"
                className="max-h-full max-w-full object-contain"
              />
            </div>

          </div>

          {/* decorative circles */}
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/10 rounded-full"></div>
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full"></div>
        </div>

        {/* RIGHT SIDE (Form) */}
        <div className="flex items-center justify-center px-8 py-12 bg-white">
          <div className="w-full max-w-md">

            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Login
            </h1>

            <p className="text-slate-500 text-sm mb-8">
              Sign in to your account
            </p>

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              />

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-slate-600">Remember me</span>
                </label>

                <Link to="/forgot-password" className="text-indigo-600 font-medium">
                  Forgot password?
                </Link>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold hover:shadow-lg transition-all"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-indigo-600 font-semibold">
                Create account
              </Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}