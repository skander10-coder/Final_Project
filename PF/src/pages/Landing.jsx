import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-semibold text-lg text-slate-800">Stag.io</span>
          </div>
          <nav className="flex items-center gap-8">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
            Connect Talent with Opportunity
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            The modern platform for internships. Find your next opportunity or discover top talent for your organization.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              Create Account
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
            Built for Everyone
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">For Students</h3>
              <p className="text-slate-600 text-sm">
                Discover internships, track applications, and build your professional profile.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">For Companies</h3>
              <p className="text-slate-600 text-sm">
                Post opportunities, review candidates, and manage your internship program.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">For Admins</h3>
              <p className="text-slate-600 text-sm">
                Oversee the platform, verify organizations, and ensure quality experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-200 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Stag.io. All rights reserved.
      </footer>
    </div>
  );
}
