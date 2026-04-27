import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('student');
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const registerData = {
      email: formData.email,
      password: formData.password,
      role: accountType
    };

    if (accountType === 'student') {
      registerData.full_name = formData.full_name;
    } else {
      registerData.company_name = formData.company_name;
    }

    try {
      const response = await api.post('/api/register', registerData);
      if (response.data.success) {
        navigate('/login', {
          state: { message: 'Account created successfully. Please login.' }
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">

      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex relative bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-12 flex-col justify-center">

          <div className="absolute inset-0 bg-white/5"></div>

          <div className="relative z-10 max-w-md">
            <h2 className="text-4xl font-bold mb-6">
              Create Your Account
            </h2>

            <p className="text-indigo-100 text-lg mb-10 leading-relaxed">
              Join our platform and start connecting with opportunities tailored for you.
            </p>

            {/* SVG PLACE */}
            <div className="w-full h-56 flex items-center justify-center">
              <img 
                src="/Images/register2.svg"
                alt="Register illustration"
                className="max-h-full max-w-full object-contain drop-shadow-xl"
              />
            </div>
          </div>

          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/10 rounded-full"></div>
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full"></div>
        </div>

        {/* RIGHT SIDE (FORM) */}
        <div className="flex items-center justify-center px-8 py-12 bg-white">
          <div className="w-full max-w-md">

            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Register
            </h1>

            <p className="text-slate-500 text-sm mb-8">
              Choose your account type
            </p>

            {/* Account Type */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAccountType('student');
                  setFormData({ ...formData, company_name: '' });
                }}
                className={`p-3 rounded-xl border-2 ${
                  accountType === 'student'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200'
                }`}
              >
                Student
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType('company');
                  setFormData({ ...formData, full_name: '' });
                }}
                className={`p-3 rounded-xl border-2 ${
                  accountType === 'company'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200'
                }`}
              >
                Company
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {accountType === 'student' && (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
                />
              )}

              {accountType === 'company' && (
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Company name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
                />
              )}

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
              />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
              />

              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold"
              >
                {loading ? 'Creating...' : 'Create account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold">
                Sign in
              </Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}