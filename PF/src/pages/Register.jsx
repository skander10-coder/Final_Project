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
          state: { message: 'Account created successfully! Please login.' } 
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Create account</h1>
          <p className="text-slate-600 text-sm mb-6">
            Choose your account type to get started.
          </p>

          {/* Account Type Selection - مع icons كاملة */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setAccountType('student');
                setFormData({...formData, company_name: ''});
              }}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                accountType === 'student'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20v-6" />
                </svg>
              </div>
              <p className="font-medium">Student</p>
              <p className="text-xs opacity-80 mt-0.5">Find internships</p>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setAccountType('company');
                setFormData({...formData, full_name: ''});
              }}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                accountType === 'company'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="font-medium">Company</p>
              <p className="text-xs opacity-80 mt-0.5">Post opportunities</p>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Field - يظهر فقط للطالب */}
            {accountType === 'student' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>
            )}
            
            {/* Company Field - يظهر فقط للشركة */}
            {accountType === 'company' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>
            )}
            
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength="6"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}