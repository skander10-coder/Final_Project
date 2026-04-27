import { useEffect, useMemo, useState } from 'react';
import { companyAPI } from '../services/api';
import Card from '../components/ui/Card';
import CircularProgress from '../components/ui/CircularProgress';

export default function Candidates() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('match');
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await companyAPI.getApplications();
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!applications.length) return;
    setExpandedGroups((prev) => {
      const next = { ...prev };
      applications.forEach((app) => {
        const key = String(app.offer_id ?? app.offer_title ?? 'unknown');
        if (next[key] === undefined) next[key] = true;
      });
      return next;
    });
  }, [applications]);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const response = await companyAPI.updateApplicationStatus(applicationId, newStatus);
      if (response.data.success) {
        fetchApplications();
        alert(`Application ${newStatus} successfully!`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Error updating application');
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const normalizedApps = useMemo(
    () =>
      applications.map((app) => {
        const score = app.match_score != null && app.match_score !== '' ? Number(app.match_score) : null;
        const safeScore = Number.isNaN(score) ? null : score;
        return {
          ...app,
          score: safeScore,
          normalizedStatus: (app.status || 'pending').toLowerCase(),
          studentDisplay: app.student_name || app.student_full_name || 'Student',
          offerDisplay: app.offer_title || app.internship_title || 'Untitled internship',
          companyDisplay: app.company_name || app.offer_company || 'Company',
          skillList: app.matching_skills || app.skills || app.required_skills || [],
        };
      }),
    [applications]
  );

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return normalizedApps.filter((app) => {
      const statusOk = statusFilter === 'all' || app.normalizedStatus === statusFilter;
      if (!statusOk) return false;
      if (!q) return true;
      return (
        app.studentDisplay.toLowerCase().includes(q) ||
        app.offerDisplay.toLowerCase().includes(q) ||
        app.companyDisplay.toLowerCase().includes(q)
      );
    });
  }, [normalizedApps, statusFilter, searchQuery]);

  const groupedApplications = useMemo(() => {
    const groupedMap = filteredApplications.reduce((acc, app) => {
      const key = String(app.offer_id ?? app.offerDisplay);
      if (!acc[key]) {
        acc[key] = {
          key,
          offerTitle: app.offerDisplay,
          company: app.companyDisplay,
          items: [],
        };
      }
      acc[key].items.push(app);
      return acc;
    }, {});

    const groups = Object.values(groupedMap).map((group) => {
      const sortedItems = [...group.items].sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.applied_at || 0).getTime() - new Date(a.applied_at || 0).getTime();
        }
        return (b.score ?? -1) - (a.score ?? -1);
      });
      const withScore = sortedItems.filter((item) => item.score != null);
      const avgScore = withScore.length
        ? Math.round(withScore.reduce((sum, item) => sum + item.score, 0) / withScore.length)
        : null;
      return {
        ...group,
        items: sortedItems,
        applicantCount: sortedItems.length,
        avgScore,
      };
    });

    return groups.sort((a, b) => b.applicantCount - a.applicantCount);
  }, [filteredApplications, sortBy]);

  const stats = useMemo(() => {
    const totalApplicants = normalizedApps.length;
    const pending = normalizedApps.filter((a) => a.normalizedStatus === 'pending').length;
    const accepted = normalizedApps.filter((a) => a.normalizedStatus === 'accepted');
    const withScore = normalizedApps.filter((a) => a.score != null);
    const avgMatch = withScore.length
      ? Math.round(withScore.reduce((sum, app) => sum + app.score, 0) / withScore.length)
      : 0;
    const now = new Date();
    const acceptedThisMonth = accepted.filter((a) => {
      const dt = new Date(a.applied_at || 0);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;
    return { totalApplicants, avgMatch, pending, acceptedThisMonth };
  }, [normalizedApps]);

  const topSkills = useMemo(() => {
    const counts = {};
    normalizedApps.forEach((app) => {
      app.skillList.forEach((skill) => {
        const key = String(skill || '').trim();
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [normalizedApps]);

  const recentActivity = useMemo(
    () =>
      [...normalizedApps]
        .sort((a, b) => new Date(b.applied_at || 0).getTime() - new Date(a.applied_at || 0).getTime())
        .slice(0, 5),
    [normalizedApps]
  );

  const statusChipStyles = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const statusLabel = (status) => {
    if (status === 'pending') return 'Pending';
    if (status === 'accepted') return 'Accepted';
    if (status === 'rejected') return 'Rejected';
    return status || 'Unknown';
  };

  const exportCsv = () => {
    const rows = [
      ['Student', 'Internship', 'Company', 'Status', 'Match Score', 'Applied Date'],
      ...filteredApplications.map((app) => [
        app.studentDisplay,
        app.offerDisplay,
        app.companyDisplay,
        statusLabel(app.normalizedStatus),
        app.score ?? '',
        formatDate(app.applied_at),
      ]),
    ];
    const csv = rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'candidates-export.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const iconSearch = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
  const iconSort = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="m3 6 4-4 4 4" />
      <path d="M7 2v20" />
      <path d="m21 18-4 4-4-4" />
      <path d="M17 2v20" />
    </svg>
  );
  const iconDownload = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );

  const statCards = [
    {
      label: 'Total Applicants',
      value: stats.totalApplicants,
      tone: 'from-indigo-500 to-indigo-600 text-white border-0',
      valueTone: 'text-white',
      trend: `${Math.max(0, groupedApplications.length)} active internships`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="M20 8v6M23 11h-6" />
        </svg>
      ),
    },
    {
      label: 'Average Match Score',
      value: `${stats.avgMatch}%`,
      tone: 'from-rose-500 to-rose-600 text-white border-0',
      valueTone: 'text-white',
      trend: 'Across all applications',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
    },
    {
      label: 'Pending Reviews',
      value: stats.pending,
      tone: 'from-pink-500 to-pink-600 text-white border-0',
      valueTone: 'text-white',
      trend: 'Requires attention',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Accepted (This Month)',
      value: stats.acceptedThisMonth,
      tone: 'from-slate-300 to-slate-400 text-white border-0',
      valueTone: 'text-white',
      trend: 'Monthly hiring momentum',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <path d="m9 12 2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8 bg-slate-50 p-1">
      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-8 text-white shadow-sm sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Candidates</h1>
            <p className="mt-2 text-indigo-100">
              Review and manage internship applicants. Grouped by internship and ranked by match score.
            </p>
          </div>
          <div className="w-full md:w-[260px] lg:w-[320px] shrink-0">
            <img
              src="/Images/hero00.svg"
              alt="Student dashboard illustration"
              className="w-full h-auto object-contain 
              drop-shadow-[0_10px_30px_rgba(15,23,42,0.25)] 
              transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  {statCards.map((card) => (
    <Card
      key={card.label}
      className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md text-white ${card.tone}`}
    >
      <div className="mb-3 flex items-center justify-between">

        {/* ICON */}
        <div className="rounded-xl bg-white/20 p-2 text-white shadow-sm">
          {card.icon}
        </div>

        {/* TREND */}
        <span className="text-[11px] text-white/70">
          {card.trend}
        </span>
      </div>

      {/* VALUE */}
      <p className="text-2xl font-bold text-white">
        {card.value}
      </p>

      {/* LABEL */}
      <p className="mt-1 text-sm text-white/80">
        {card.label}
      </p>

    </Card>
  ))}
</div>

      <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-lg">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{iconSearch}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student or internship..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['all', 'pending', 'accepted', 'rejected'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-100 p-2 text-slate-500">{iconSort}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="match">Match score (highest first)</option>
              <option value="date">Date applied</option>
            </select>
            <button
              type="button"
              onClick={exportCsv}
              title="Export visible candidates to CSV"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700"
            >
              {iconDownload}
              Export CSV
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {[1, 2, 3].map((group) => (
              <Card key={group} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 w-1/3 rounded-lg bg-slate-200" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="rounded-2xl border border-slate-100 p-4">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="h-10 w-10 rounded-full bg-slate-200" />
                          <div className="h-10 w-10 rounded-full bg-slate-100" />
                        </div>
                        <div className="h-5 w-2/3 rounded bg-slate-200" />
                        <div className="mt-2 h-4 w-1/2 rounded bg-slate-100" />
                        <div className="mt-4 flex gap-2">
                          <div className="h-6 w-14 rounded-full bg-slate-100" />
                          <div className="h-6 w-16 rounded-full bg-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-5 w-1/2 rounded bg-slate-200" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-2/3 rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
            </div>
          </Card>
        </div>
      ) : groupedApplications.length === 0 ? (
        <Card className="rounded-2xl border border-slate-100 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
              <path d="M22 12h-4l-3 4H9l-3-4H2" />
              <path d="M5.45 5.11 2 12v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">No applicants yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">When students apply, they will appear here</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {groupedApplications.map((group) => {
              const open = expandedGroups[group.key] !== false;
              return (
                <Card key={group.key} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 text-left transition-colors duration-200 hover:bg-slate-50"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{group.offerTitle}</h3>
                      <p className="text-sm text-slate-500">{group.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">{group.applicantCount} applicants</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        Avg {group.avgScore != null ? `${group.avgScore}%` : '—'}
                      </span>
                      <svg className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {open ? (
                    <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                      {group.items.map((app, idx) => {
                        const initial = app.studentDisplay.charAt(0).toUpperCase();
                        const score = app.score != null ? app.score : 0;
                        return (
                          <Card
                            key={app.id}
                            style={{ animation: `fade-in 0.45s ease-out ${idx * 0.05}s both` }}
                            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white">
                                  {initial}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="truncate text-base font-semibold text-slate-900">{app.studentDisplay}</h4>
                                  <p className="mt-0.5 text-xs text-slate-500">Applied {formatDate(app.applied_at)}</p>
                                </div>
                              </div>
                              <CircularProgress value={score} size={56} stroke={6} />
                            </div>

                            <div className="mb-3 flex items-center justify-between">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusChipStyles[app.normalizedStatus] || 'bg-slate-100 text-slate-700'}`}>
                                {statusLabel(app.normalizedStatus)}
                              </span>
                            </div>

                            {app.skillList.length > 0 ? (
                              <div className="mb-4 flex flex-wrap gap-1.5">
                                {app.skillList.slice(0, 6).map((skill, skillIdx) => (
                                  <span
                                    key={`${app.id}-skill-${skillIdx}`}
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${skillIdx < 3
                                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100'
                                      : 'bg-slate-100 text-slate-700'
                                      }`}
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            {app.normalizedStatus === 'pending' ? (
                              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                                <button
                                  type="button"
                                  title="Accept this candidate"
                                  onClick={() => handleUpdateStatus(app.id, 'accepted')}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-700"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                                  </svg>
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  title="Reject this candidate"
                                  onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M6 18 18 6" />
                                  </svg>
                                  Reject
                                </button>
                              </div>
                            ) : null}
                          </Card>
                        );
                      })}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Top Skills</h3>
              <div className="mt-3 space-y-2">
                {topSkills.length ? topSkills.map(([skill, count]) => (
                  <div key={skill} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-700">{skill}</span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{count}</span>
                  </div>
                )) : <p className="text-sm text-slate-500">No skill data yet.</p>}
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <div className="mt-3 space-y-3">
                {recentActivity.length ? recentActivity.map((activity) => (
                  <div key={`activity-${activity.id}`} className="rounded-lg border border-slate-100 px-3 py-2">
                    <p className="text-sm font-medium text-slate-800">{activity.studentDisplay}</p>
                    <p className="text-xs text-slate-500">{activity.offerDisplay}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDate(activity.applied_at)}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">No recent activity.</p>}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}