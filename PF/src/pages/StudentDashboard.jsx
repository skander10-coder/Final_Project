import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import CircularProgress from '../components/ui/CircularProgress';
import api, { studentAPI } from '../services/api';

export function StudentDashboardHome() {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [hasCV, setHasCV] = useState(false);
  const [checkingCV, setCheckingCV] = useState(true);
  const [student, setStudent] = useState(null);
  const [cvCompletion, setCvCompletion] = useState(0);

  useEffect(() => {
    fetchInternships();
    fetchApplications();
    checkCV();
  }, []);

  const fetchInternships = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getInternships();
      if (response.data.success) {
        setInternships(response.data.offers || []);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const response = await studentAPI.getApplications();
      if (response.data.success) {
        setApplications(response.data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApps(false);
    }
  };

  const checkCV = async () => {
    try {
      const res = await studentAPI.getProfile();
      if (res.data.success) {
        const profile = res.data.profile;
        setStudent(profile || null);
        const completed = profile && profile.skills?.length > 0 && profile.university && profile.level && profile.major;
        setHasCV(Boolean(completed));
        const completionChecks = [
          Boolean(profile?.skills?.length),
          Boolean(profile?.university),
          Boolean(profile?.level),
          Boolean(profile?.major),
        ];
        const completion = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100);
        setCvCompletion(completion);
      }
    } catch (err) {
      console.error('Error checking CV:', err);
    } finally {
      setCheckingCV(false);
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const acceptedOrInterviewCount = applications.filter(
    (a) => a.status === 'accepted' || a.status === 'validated'
  ).length;

  const averageMatchScore = useMemo(() => {
    if (!hasCV) return null;
    const numericScores = internships
      .map((item) => Number(item.match_score))
      .filter((score) => !Number.isNaN(score));
    if (numericScores.length === 0) return null;
    const avg = numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length;
    return Math.round(avg);
  }, [internships, hasCV]);

  const topMatches = useMemo(() => {
    if (!hasCV) return [];
    return [...internships]
      .filter((item) => !Number.isNaN(Number(item.match_score)))
      .sort((a, b) => Number(b.match_score) - Number(a.match_score))
      .slice(0, 3);
  }, [internships, hasCV]);

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => new Date(b.applied_at || 0).getTime() - new Date(a.applied_at || 0).getTime())
        .slice(0, 3),
    [applications]
  );

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  const statsCards = [
    { label: 'Total Applications', value: applications.length, icon: '📨', tone: 'bg-indigo-50 text-indigo-700' },
    { label: 'Pending Reviews', value: pendingCount, icon: '⏳', tone: 'bg-amber-50 text-amber-700' },
    { label: 'Accepted / Interviews', value: acceptedOrInterviewCount, icon: '🎉', tone: 'bg-emerald-50 text-emerald-700' },
    {
      label: 'Average Match Score',
      value: hasCV && averageMatchScore != null ? `${averageMatchScore}%` : '—',
      icon: '🎯',
      tone: 'bg-violet-50 text-violet-700',
    },
  ];

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      validated: 'bg-indigo-100 text-indigo-700',
    };
    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      validated: 'Interview / Validated',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-600'}`}>
        {labels[status] || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="space-y-8 bg-slate-50 min-h-full p-1 sm:p-2 rounded-2xl">
      <Card
        variant="elevated"
        className="relative overflow-hidden rounded-2xl border border-indigo-200/60 
        bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 
        p-6 sm:p-8 lg:p-10 shadow-xl shadow-indigo-500/20"
      >
        {/* subtle glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_45%)] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-10">

          {/* TEXT */}
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Welcome back,{" "}
              {JSON.parse(localStorage.getItem("user") || "{}")?.name ||
                student?.full_name ||
                "Student"}
            </h2>

            <p className="mt-3 text-indigo-100 text-sm sm:text-base leading-relaxed max-w-md">
              Track your applications and discover new internship opportunities.
            </p>

            <p className="mt-4 text-indigo-100/80 text-sm">
              {formattedDate}
            </p>

            <Link
              to="/student/internships"
              className="inline-flex items-center mt-6 px-4 py-2.5 rounded-xl 
        bg-white text-indigo-700 text-sm font-medium 
        shadow-sm transition-all duration-200 
        hover:bg-indigo-50 hover:shadow-md"
            >
              Explore opportunities
            </Link>
          </div>

          {/* IMAGE */}
          <div className="w-full md:w-[260px] lg:w-[320px] shrink-0">
            <img
              src="/Images/hero44.svg"
              alt="Student dashboard illustration"
              className="w-full h-auto object-contain 
        drop-shadow-[0_10px_30px_rgba(15,23,42,0.25)] 
        transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>

        </div>
      </Card>

      {!checkingCV && !hasCV && (
        <Card className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">Your CV is {cvCompletion}% complete</p>
              <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-amber-100">
                <div className="h-2 rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${cvCompletion}%` }} />
              </div>
            </div>
            <button
              onClick={() => navigate('/student/fill-cv')}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all duration-200 hover:shadow-md"
            >
              Complete CV →
            </button>
          </div>
        </Card>
      )}

      {!checkingCV && hasCV && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          ✓ CV ready
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <Card
            key={card.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${card.tone}`}>{card.icon}</div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-900">{card.value}</p>
                <p className="text-sm text-slate-600">{card.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/student/internships"
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
          >
            <p className="text-2xl mb-2">🧭</p>
            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Browse Internships</h4>
            <p className="text-sm text-slate-500 mt-1">Explore opportunities matched to your profile.</p>
          </Link>
          <Link
            to="/student/fill-cv"
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
          >
            <p className="text-2xl mb-2">📄</p>
            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">My CV</h4>
            <p className="text-sm text-slate-500 mt-1">Update your profile to improve internship matching.</p>
          </Link>
          <Link
            to="/student/applications"
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
          >
            <p className="text-2xl mb-2">🗂️</p>
            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">My Applications</h4>
            <p className="text-sm text-slate-500 mt-1">Track your application statuses and updates.</p>
          </Link>
        </div>
      </div>

      {hasCV && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Top Matches</h3>
            <Link to="/student/internships" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all internships →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-100 bg-white p-5 animate-pulse h-40" />
              ))}
            </div>
          ) : topMatches.length === 0 ? (
            <Card className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
              No match scores available yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {topMatches.map((internship) => (
                <Card
                  key={internship.id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 line-clamp-1">{internship.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">{internship.company_name || 'Company'}</p>
                    </div>
                    <CircularProgress value={Number(internship.match_score)} size={52} stroke={5} />
                  </div>
                  <div className="mt-4 text-sm text-slate-600 space-y-1">
                    <p>📍 {internship.location || 'Remote'}</p>
                    <p>⏱️ {internship.duration || 'Not specified'}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Applications</h3>
          <Link to="/student/applications" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all applications →
          </Link>
        </div>

        {loadingApps ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : recentApplications.length === 0 ? (
          <Card className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-500 font-medium">No applications yet</p>
            <p className="text-slate-400 text-sm mt-1">Your latest applications will appear here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentApplications.map((app) => (
              <Card
                key={app.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{app.offer_title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{app.offer_company}</p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                <p className="text-xs text-slate-400 mt-2">Applied on: {formatAppliedDate(app.applied_at)}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function ApplicationStatusBadge({ status }) {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    validated: 'bg-indigo-100 text-indigo-700',
  };
  const label =
    status === 'pending'
      ? 'Pending'
      : status === 'accepted'
        ? 'Accepted'
        : status === 'rejected'
          ? 'Rejected'
          : status === 'validated'
            ? 'Validated'
            : status || 'Unknown';
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-slate-100 text-slate-600'}`}
    >
      {label}
    </span>
  );
}

function formatAppliedDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function StudentApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentAPI.getApplications();
      if (response.data.success) {
        setApplications(response.data.applications || []);
      } else {
        setError(response.data.message || 'Failed to load applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === 'pending').length;
    const accepted = applications.filter((a) => a.status === 'accepted').length;
    return { total, pending, accepted };
  }, [applications]);

  const filteredSorted = useMemo(() => {
    let list = [...applications];
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((a) => {
        const title = (a.offer_title || '').toLowerCase();
        const company = (a.offer_company || '').toLowerCase();
        return title.includes(q) || company.includes(q);
      });
    }
    if (sortBy === 'match') {
      list.sort((a, b) => {
        const sa = a.match_score != null ? Number(a.match_score) : -1;
        const sb = b.match_score != null ? Number(b.match_score) : -1;
        return sb - sa;
      });
    } else {
      list.sort((a, b) => {
        const ta = new Date(a.applied_at || 0).getTime();
        const tb = new Date(b.applied_at || 0).getTime();
        return tb - ta;
      });
    }
    return list;
  }, [applications, statusFilter, searchQuery, sortBy]);

  const statusFilters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'validated', label: 'Validated' },
  ];

  const downloadPdf = async (app) => {
    if (app.agreement_id != null) {
      setPdfLoadingId(app.id);
      try {
        const res = await api.get(`/api/download-pdf/${app.agreement_id}`, { responseType: 'blob' });
        const href = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = href;
        a.download = `internship-agreement-${app.agreement_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
      } catch (e) {
        console.error(e);
        alert('Could not download the PDF. Please try again later.');
      } finally {
        setPdfLoadingId(null);
      }
      return;
    }
    const raw = app.pdf_url;
    if (raw) {
      const base = api.defaults.baseURL || '';
      const url = raw.startsWith('http') ? raw : `${base.replace(/\/$/, '')}${raw.startsWith('/') ? '' : '/'}${raw}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const skillsForApp = (app) => app.required_skills || app.offer_required_skills || [];

  const companyInitial = (company) => {
    const value = (company || '').trim();
    if (!value) return '?';
    return value.charAt(0).toUpperCase();
  };

  const iconBriefcase = (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M2 12h20" />
    </svg>
  );
  const iconClock = (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
  const iconCheck = (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
  const iconSearch = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
  const iconDownload = (
    <svg className="h-4.5 w-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
  const iconInbox = (
    <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="M22 12h-4l-3 4H9l-3-4H2" />
      <path d="M5.45 5.11 2 12v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );

  return (
    <div className="space-y-8 bg-slate-50/70 p-1">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 px-8 py-10 text-white shadow-lg sm:px-10 sm:py-12">

        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl"></div>

        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

          {/* TEXT */}
          <div className="max-w-lg space-y-3">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Manage Your <span className="text-indigo-200">Applications</span>
            </h1>

            <p className="text-sm text-indigo-100 sm:text-base">
              Stay organized and track all your internship applications in one place.
              Never miss an update again.
            </p>

          </div>

          {/* IMAGE */}
          <div className="w-full md:w-[260px] lg:w-[320px] shrink-0">
            <img
              src="/Images/hero77.svg"
              alt="Student dashboard illustration"
              className="w-full h-auto object-contain 
              drop-shadow-[0_10px_30px_rgba(15,23,42,0.25)] 
              transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">{iconBriefcase}</div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Applications</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">{iconClock}</div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.pending}</p>
              <p className="text-sm text-slate-600">Pending Reviews</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">{iconCheck}</div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.accepted}</p>
              <p className="text-sm text-slate-600">Accepted / Interview</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${statusFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{iconSearch}</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by internship title or company..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="app-sort" className="text-sm font-medium text-slate-600">
                Sort by
              </label>
              <select
                id="app-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="date">Date (newest first)</option>
                <option value="match">Match score</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {error && !loading ? (
        <Card className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchApplications}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-5 w-44 rounded-lg bg-slate-200" />
                    <div className="h-4 w-28 rounded-lg bg-slate-100" />
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100" />
              </div>
              <div className="mb-4 h-4 w-36 rounded-lg bg-slate-100" />
              <div className="mb-4 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-slate-100" />
                <div className="h-6 w-20 rounded-full bg-slate-100" />
                <div className="h-6 w-14 rounded-full bg-slate-100" />
              </div>
              <div className="h-8 w-32 rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card className="rounded-2xl border border-slate-100 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            {iconInbox}
          </div>
          <h2 className="text-xl font-semibold text-slate-900">No applications yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Apply to internships to see them here</p>
          <Link
            to="/student/internships"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg"
          >
            Browse Internships
          </Link>
        </Card>
      ) : filteredSorted.length === 0 ? (
        <Card className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
          <p className="font-medium text-slate-700">No applications match your filters</p>
          <p className="mt-1 text-sm text-slate-500">Try changing the status filter or search terms.</p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Clear filters
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredSorted.map((app, idx) => {
            const skills = skillsForApp(app);
            const hasScore = app.match_score != null && app.match_score !== '' && !Number.isNaN(Number(app.match_score));
            const canPdf = app.status === 'validated' && (app.agreement_id != null || Boolean(app.pdf_url));
            const initial = companyInitial(app.offer_company);

            return (
              <Card
                key={app.id}
                style={{ animation: `fade-in 0.5s ease-out ${idx * 0.06}s both` }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-900">
                        {app.offer_title || 'Untitled position'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">{app.offer_company || 'Company'}</p>
                      <p className="mt-1 text-xs text-slate-500">Applied on {formatAppliedDate(app.applied_at)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <ApplicationStatusBadge status={app.status} />
                    {hasScore ? <CircularProgress value={Number(app.match_score)} size={54} stroke={6} /> : null}
                  </div>
                </div>

                {skills.length > 0 ? (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {skills.slice(0, 8).map((skill, skillIdx) => (
                        <span key={`${app.id}-skill-${skillIdx}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {skill}
                        </span>
                      ))}
                      {skills.length > 8 ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">+{skills.length - 8}</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {app.status === 'validated' ? (
                  <div className="border-t border-slate-100 pt-4">
                    {canPdf ? (
                      <button
                        type="button"
                        onClick={() => downloadPdf(app)}
                        disabled={pdfLoadingId === app.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-60"
                      >
                        {pdfLoadingId === app.id ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" aria-hidden />
                        ) : (
                          iconDownload
                        )}
                        Download PDF
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500">Agreement PDF will be available once it is generated.</p>
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InternshipCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden relative">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        aria-hidden
      >
        <div
          className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-white/75 to-transparent opacity-90"
          style={{ animation: 'internship-skeleton-shimmer 2s ease-in-out infinite' }}
        />
      </div>
      <div className="relative flex justify-between gap-4 mb-5">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-full bg-slate-200/90 shrink-0 animate-pulse" />
          <div className="space-y-2 flex-1 pt-1">
            <div className="h-4 bg-slate-200/90 rounded-lg w-2/5 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded-lg w-1/3 animate-pulse" />
          </div>
        </div>
        <div className="w-14 h-14 rounded-full bg-slate-200/90 shrink-0 animate-pulse" />
      </div>
      <div className="relative h-6 bg-slate-200/90 rounded-lg w-4/5 mb-3 animate-pulse" />
      <div className="relative space-y-2 mb-4">
        <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
        <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse" />
      </div>
      <div className="relative flex gap-2 mb-6">
        <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-7 w-20 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-7 w-14 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      <div className="relative h-11 bg-slate-200/90 rounded-xl w-full animate-pulse" />
    </div>
  );
}

export function StudentInternshipsPage() {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('match');
  const [hasCV, setHasCV] = useState(false);
  const [checkingCV, setCheckingCV] = useState(true);

  const fetchInternships = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentAPI.getInternships();
      if (response.data.success) {
        setInternships(response.data.offers || []);
      } else {
        setError(response.data.message || 'Failed to load internships');
      }
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const response = await studentAPI.getApplications();
      if (response.data.success) {
        setApplications(response.data.applications || []);
      }
    } catch (e) {
      console.error('Error fetching applications:', e);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  const checkCV = useCallback(async () => {
    try {
      const res = await studentAPI.getProfile();
      if (res.data.success) {
        const profile = res.data.profile;
        const completed =
          profile && profile.skills?.length > 0 && profile.university && profile.level && profile.major;
        setHasCV(Boolean(completed));
      }
    } catch (err) {
      console.error('Error checking CV:', err);
    } finally {
      setCheckingCV(false);
    }
  }, []);

  useEffect(() => {
    fetchInternships();
    fetchApplications();
    checkCV();
  }, [fetchInternships, fetchApplications, checkCV]);

  const locations = useMemo(
    () => [...new Set(internships.map((i) => i.location).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [internships]
  );

  const filteredBySearchAndLocation = useMemo(() => {
    let list = internships;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((inv) => {
        const title = (inv.title || '').toLowerCase();
        const company = (inv.company_name || '').toLowerCase();
        const skillsMatch = (inv.required_skills || []).some((s) => String(s).toLowerCase().includes(q));
        return title.includes(q) || company.includes(q) || skillsMatch;
      });
    }
    if (locationFilter) {
      list = list.filter((inv) => inv.location === locationFilter);
    }
    return list;
  }, [internships, searchQuery, locationFilter]);

  const filteredSorted = useMemo(() => {
    const list = [...filteredBySearchAndLocation];
    switch (sortBy) {
      case 'newest':
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'duration':
        list.sort((a, b) => String(a.duration || '').localeCompare(String(b.duration || '')));
        break;
      case 'match':
      default:
        list.sort((a, b) => {
          const sa = a.match_score != null && !Number.isNaN(Number(a.match_score)) ? Number(a.match_score) : -1;
          const sb = b.match_score != null && !Number.isNaN(Number(b.match_score)) ? Number(b.match_score) : -1;
          return sb - sa;
        });
        break;
    }
    return list;
  }, [filteredBySearchAndLocation, sortBy]);

  const topMatchId = useMemo(() => {
    let best = -1;
    let id = null;
    for (const inv of filteredSorted) {
      const s = Number(inv.match_score);
      if (!Number.isNaN(s) && s > best) {
        best = s;
        id = inv.id;
      }
    }
    return id;
  }, [filteredSorted]);

  const hasActiveFilters = Boolean(searchQuery.trim() || locationFilter);

  const clearAllFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setSortBy('match');
  };

  const getApplicationStatus = (offerId) => {
    const app = applications.find((a) => a.offer_id === offerId);
    return app?.status ?? null;
  };

  const handleApply = async (offerId) => {
    if (!hasCV) {
      navigate('/student/fill-cv');
      return;
    }
    try {
      const response = await studentAPI.apply(offerId);
      if (response.data.success) {
        fetchApplications();
      }
    } catch (err) {
      console.error('Error applying:', err);
      alert(err.response?.data?.message || 'Error applying for internship');
    }
  };

  const isSkillMatching = (skill) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    return String(skill).toLowerCase().includes(q);
  };

  const availableCount = internships.length;

  const topMatchScore = useMemo(() => {
    let best = -1;
    for (const inv of internships) {
      const s = Number(inv.match_score);
      if (!Number.isNaN(s) && s > best) best = s;
    }
    return best >= 0 ? Math.round(best) : null;
  }, [internships]);

  return (
    <div className="space-y-8 -mx-1 sm:mx-0">
      <style>{`
        @keyframes internship-skeleton-shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-6 py-10 sm:px-10 shadow-lg shadow-indigo-600/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)] pointer-events-none" />
        <div className="relative max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Find Your Internship</h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Discover opportunities that match your skills and career goals
          </p>
        </div>
      </header>

      {!checkingCV && !hasCV && (
        <Card className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-lg font-semibold">
                CV
              </div>
              <div>
                <p className="font-semibold text-amber-900">Complete your CV for better matches</p>
                <p className="text-sm text-amber-800/90 mt-0.5">
                  Add your skills and education so we can surface roles that fit you—and show match scores.
                </p>
              </div>
            </div>
            <Link
              to="/student/fill-cv"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm shrink-0"
            >
              Complete CV
            </Link>
          </div>
        </Card>
      )}

      {!checkingCV && !hasCV && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Match scores</span> appear after your CV is complete. You can
          still browse and apply once your profile is ready.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card variant="elevated" className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{availableCount}</p>
              <p className="text-sm text-slate-600">Available Internships</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-xl" aria-hidden>
              🏆
            </div>
            <div>
              {hasCV && topMatchScore != null ? (
                <>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{topMatchScore}%</p>
                  <p className="text-sm text-slate-600">Top match in your list</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-slate-700">—</p>
                  <p className="text-sm text-slate-600">Top match (complete CV to see)</p>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search by title, company, or skills…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1 min-w-0">
              <label htmlFor="int-loc" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Location
              </label>
              <div className="relative">
                <select
                  id="int-loc"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none cursor-pointer pr-10"
                >
                  <option value="">All locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0 lg:max-w-xs">
              <label htmlFor="int-sort" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Sort by
              </label>
              <div className="relative">
                <select
                  id="int-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none cursor-pointer pr-10"
                >
                  <option value="match">Match score (highest first)</option>
                  <option value="newest">Newest first</option>
                  <option value="duration">Duration</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {(hasActiveFilters || sortBy !== 'match') && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-500">Active:</span>
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium">
                  Search: &quot;{searchQuery.trim()}&quot;
                </span>
              )}
              {locationFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                  {locationFilter}
                </span>
              )}
              {sortBy !== 'match' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                  Sort: {sortBy === 'newest' ? 'Newest' : 'Duration'}
                </span>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-auto text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </Card>

      {error && !loading && (
        <Card className="p-6 rounded-2xl border border-red-100 bg-red-50/90">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-red-800 text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchInternships}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <InternshipCardSkeleton key={i} />
          ))}
        </div>
      ) : !error && internships.length === 0 ? (
        <Card className="p-12 sm:p-16 rounded-2xl border border-slate-200/80 bg-white text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-slate-100 text-slate-400 mb-6 mx-auto">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No internships yet</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            There are no open listings right now. Check back soon—new roles are added regularly.
          </p>
        </Card>
      ) : !error && filteredSorted.length === 0 ? (
        <Card className="p-12 sm:p-16 rounded-2xl border border-slate-200/80 bg-white text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-indigo-50 text-indigo-500 mb-6 mx-auto">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No internships found</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
            Nothing matches your search or filters. Try different keywords or broaden your location.
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
          >
            Clear filters
          </button>
        </Card>
      ) : !error ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSorted.map((internship) => {
            const appStatus = getApplicationStatus(internship.id);
            const hasApplied = appStatus !== null;
            const skills = internship.required_skills || [];
            const showTop = hasCV && topMatchId === internship.id && filteredSorted.length > 0;
            const scoreNum = Number(internship.match_score);
            const hasScore = hasCV && !Number.isNaN(scoreNum);

            return (
              <article
                key={internship.id}
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300/70 flex flex-col h-full"
              >
                {showTop && (
                  <div className="absolute -top-2.5 left-4 z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold shadow-sm border border-amber-200/80">
                      🏆 Top Match
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-4 pt-1">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/25 shrink-0"
                      aria-hidden
                    >
                      {(internship.company_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{internship.company_name || 'Company'}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{internship.location || 'Location TBD'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {hasScore ? (
                      <CircularProgress value={scoreNum} size={56} stroke={5} />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 text-center leading-tight px-1 bg-slate-50"
                        title="Complete your CV to see match scores"
                      >
                        —
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug line-clamp-2 mb-2">{internship.title}</h2>

                <p className="text-sm text-slate-600 line-clamp-2 min-h-[2.5rem] mb-4">{internship.description || '—'}</p>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={`${internship.id}-s-${idx}`}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${isSkillMatching(skill)
                          ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200'
                          : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-xs font-semibold">
                        +{skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                    {internship.duration || 'Duration TBD'}
                  </span>
                </div>

                <div className="mt-auto pt-2">
                  {hasApplied ? (
                    <div className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center">
                      <span className="text-sm font-semibold text-emerald-800">Applied ✓</span>
                      {loadingApps ? null : appStatus === 'pending' ? (
                        <p className="text-xs text-emerald-700/80 mt-1">Pending review</p>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApply(internship.id)}
                      className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-md shadow-indigo-600/25 group-hover:shadow-lg group-hover:shadow-indigo-600/30"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function StudentPlaceholder({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-5xl mb-4">🚧</div>
        <p className="text-slate-500 font-medium">{title}</p>
        <p className="text-slate-400 text-sm mt-1">Coming soon</p>
      </div>
    </div>
  );
}