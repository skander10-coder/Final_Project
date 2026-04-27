import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI, notificationAPI } from '../services/api';

function buildDashboardChartWeeks(pendingOffers, acceptedApplications, notifications) {
  const weeks = 6;
  const data = Array.from({ length: weeks }, (_, i) => ({
    label: `W${weeks - i}`,
    pending: 0,
    accepted: 0,
    rejected: 0,
  }));
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const bucketIndex = (iso) => {
    if (!iso) return -1;
    const t = new Date(iso).getTime();
    const diff = now - t;
    if (diff < 0) return -1;
    const w = Math.floor(diff / weekMs);
    if (w >= weeks) return -1;
    return weeks - 1 - w;
  };

  pendingOffers.forEach((o) => {
    const idx = bucketIndex(o.created_at);
    if (idx >= 0) data[idx].pending += 1;
  });
  acceptedApplications.forEach((a) => {
    const idx = bucketIndex(a.applied_at);
    if (idx >= 0) data[idx].accepted += 1;
  });
  (notifications || []).forEach((n) => {
    const t = n.created_at;
    const isRej = /reject|rejected|❌/i.test(n.title || n.message || '');
    const idx = bucketIndex(t);
    if (idx >= 0 && isRej) data[idx].rejected += 1;
  });

  return data;
}

function DashboardHomeSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-36 rounded-2xl bg-slate-200/80" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-100" />
      <div className="h-48 rounded-2xl bg-slate-100" />
      <div className="h-72 rounded-2xl bg-slate-100" />
    </div>
  );
}

export function AdminDashboardHome() {
  const navigate = useNavigate();
  const [pendingOffers, setPendingOffers] = useState([]);
  const [acceptedApplications, setAcceptedApplications] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingAll, setLoadingAll] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, applicationId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [appSearch, setAppSearch] = useState('');
  const [appPage, setAppPage] = useState(1);
  const [appPageSize, setAppPageSize] = useState(10);
  const offersRef = useRef(null);
  const appsRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0); // 🔥 Add this

  // Auto-refresh time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // 60,000 ms = 1 minute
    
    return () => clearInterval(interval);
  }, []);

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);

  const refreshAll = useCallback(async () => {
    const [offersRes, appsRes, stRes, coRes, notifRes] = await Promise.allSettled([
      adminAPI.getPendingOffers(),
      adminAPI.getAcceptedApplications(),
      adminAPI.getAllStudents(),
      adminAPI.getAllCompanies(),
      notificationAPI.getNotifications(1),
    ]);

    if (offersRes.status === 'fulfilled' && offersRes.value.data?.success) {
      setPendingOffers(offersRes.value.data.offers || []);
    } else {
      setPendingOffers([]);
    }
    if (appsRes.status === 'fulfilled' && appsRes.value.data?.success) {
      setAcceptedApplications(appsRes.value.data.applications || []);
    } else {
      setAcceptedApplications([]);
    }
    if (stRes.status === 'fulfilled' && stRes.value.data?.success) {
      setStudentsList(stRes.value.data.students || []);
    } else {
      setStudentsList([]);
    }
    if (coRes.status === 'fulfilled' && coRes.value.data?.success) {
      setCompaniesList(coRes.value.data.companies || []);
    } else {
      setCompaniesList([]);
    }
    if (notifRes.status === 'fulfilled' && notifRes.value.data?.success) {
      setNotifications(notifRes.value.data.notifications || []);
      setUnreadCount(notifRes.value.data.unread_count ?? 0);
    } else {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingAll(true);
      try {
        await refreshAll();
      } finally {
        if (!cancelled) setLoadingAll(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAll]);

  const stats = useMemo(() => {
    const now = new Date();
    const py = now.getFullYear();
    const pm = now.getMonth();
    const offersThisMonth = countInMonth(pendingOffers, (o) => o.created_at, py, pm);
    const offersLastMonth = countInMonth(pendingOffers, (o) => o.created_at, pm === 0 ? py - 1 : py, pm === 0 ? 11 : pm - 1);
    const appsThisMonth = countInMonth(acceptedApplications, (a) => a.applied_at, py, pm);
    const appsLastMonth = countInMonth(acceptedApplications, (a) => a.applied_at, pm === 0 ? py - 1 : py, pm === 0 ? 11 : pm - 1);
    const stThisMonth = countInMonth(studentsList, (s) => s.created_at, py, pm);
    const stLastMonth = countInMonth(studentsList, (s) => s.created_at, pm === 0 ? py - 1 : py, pm === 0 ? 11 : pm - 1);
    const coThisMonth = countInMonth(companiesList, (c) => c.created_at, py, pm);
    const coLastMonth = countInMonth(companiesList, (c) => c.created_at, pm === 0 ? py - 1 : py, pm === 0 ? 11 : pm - 1);
    return {
      offersTrend: growthPercent(offersThisMonth, offersLastMonth),
      appsTrend: growthPercent(appsThisMonth, appsLastMonth),
      studentsTrend: growthPercent(stThisMonth, stLastMonth),
      companiesTrend: growthPercent(coThisMonth, coLastMonth),
    };
  }, [pendingOffers, acceptedApplications, studentsList, companiesList]);

  const chartData = useMemo(
    () => buildDashboardChartWeeks(pendingOffers, acceptedApplications, notifications),
    [pendingOffers, acceptedApplications, notifications]
  );

  const filteredApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    if (!q) return acceptedApplications;
    return acceptedApplications.filter(
      (a) =>
        (a.student_name || '').toLowerCase().includes(q) ||
        (a.offer_title || '').toLowerCase().includes(q) ||
        (a.offer_company || '').toLowerCase().includes(q)
    );
  }, [acceptedApplications, appSearch]);

  useEffect(() => {
    setAppPage(1);
  }, [appSearch, appPageSize]);

  const paginatedApps = useMemo(() => {
    const start = (appPage - 1) * appPageSize;
    return filteredApps.slice(start, start + appPageSize);
  }, [filteredApps, appPage, appPageSize]);

  const handleApprove = async (offerId) => {
    setActionLoading(offerId);
    try {
      const response = await adminAPI.approveOffer(offerId);
      if (response.data.success) {
        setPendingOffers((prev) => prev.filter((offer) => offer.id !== offerId));
        showToast(response.data.message || 'Offer approved.', 'success');
      }
    } catch (error) {
      console.error('Error approving offer:', error);
      showToast(error.response?.data?.message || 'Error approving offer', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async (offerId) => {
    if (!confirm('Are you sure you want to reject this offer?')) return;
    setActionLoading(offerId);
    try {
      const response = await adminAPI.rejectOffer(offerId);
      if (response.data.success) {
        setPendingOffers((prev) => prev.filter((offer) => offer.id !== offerId));
        showToast(response.data.message || 'Offer rejected.', 'success');
      }
    } catch (error) {
      console.error('Error rejecting offer:', error);
      showToast(error.response?.data?.message || 'Error rejecting offer', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidate = async (applicationId) => {
    setActionLoading(applicationId);
    try {
      const response = await adminAPI.validateApplication(applicationId);
      if (response.data.success) {
        showToast('Application validated and PDF generated.', 'success');
        await refreshAll();
      }
    } catch (error) {
      console.error('Error validating:', error);
      showToast(error.response?.data?.message || 'Error validating application', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectApplication = async () => {
    if (!rejectReason.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }
    setActionLoading(rejectModal.applicationId);
    try {
      const response = await adminAPI.rejectApplication(rejectModal.applicationId, rejectReason);
      if (response.data.success) {
        setAcceptedApplications((prev) => prev.filter((app) => app.id !== rejectModal.applicationId));
        setRejectModal({ isOpen: false, applicationId: null });
        setRejectReason('');
        showToast('Application rejected successfully.', 'success');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      showToast(error.response?.data?.message || 'Error rejecting application', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const exportReport = () => {
    const header = ['Student', 'Internship', 'Company', 'Status', 'Applied At'];
    const rows = acceptedApplications.map((a) => [
      a.student_name,
      a.offer_title,
      a.offer_company,
      a.status,
      a.applied_at,
    ]);
    downloadCsv(`admin-report-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
    showToast('Report exported.', 'success');
  };

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const statCardConfigs = useMemo(
    () => [
      {
        key: 'offers',
        label: 'Pending offers',
        value: pendingOffers.length,
        trend: stats.offersTrend,
        icon: '⏳',
        ring: 'ring-amber-100',
        bg: 'bg-amber-50',
      },
      {
        key: 'apps',
        label: 'Validation queue',
        value: acceptedApplications.length,
        trend: stats.appsTrend,
        icon: '✅',
        ring: 'ring-emerald-100',
        bg: 'bg-emerald-50',
      },
      {
        key: 'internships',
        label: 'Total internships',
        value: pendingOffers.length,
        trend: null,
        sub: 'Listings pending approval',
        icon: '📋',
        ring: 'ring-indigo-100',
        bg: 'bg-indigo-50',
      },
      {
        key: 'students',
        label: 'Active students',
        value: studentsList.length,
        trend: stats.studentsTrend,
        icon: '🎓',
        ring: 'ring-violet-100',
        bg: 'bg-violet-50',
      },
      {
        key: 'companies',
        label: 'Total companies',
        value: companiesList.length,
        trend: stats.companiesTrend,
        icon: '🏢',
        ring: 'ring-sky-100',
        bg: 'bg-sky-50',
      },
      {
        key: 'applications',
        label: 'Total applications',
        value: acceptedApplications.length,
        trend: stats.appsTrend,
        sub: 'Accepted • pending validation',
        icon: '📨',
        ring: 'ring-slate-100',
        bg: 'bg-slate-50',
      },
    ],
    [pendingOffers.length, acceptedApplications.length, studentsList.length, companiesList.length, stats]
  );

  const handleStatClick = (key) => {
    setActiveFilter(key);
    if (key === 'offers' || key === 'internships') {
      scrollTo(offersRef);
    } else if (key === 'apps' || key === 'applications') {
      scrollTo(appsRef);
    } else if (key === 'students') {
      navigate('/admin/students');
    } else if (key === 'companies') {
      navigate('/admin/companies');
    }
  };

  const recentActivity = useMemo(() => {
    return (notifications || [])
      .slice(0, 10)
      .map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: timeAgo(n.created_at),
        type: n.type || 'info',
      }));
  }, [notifications , refreshKey]);

  const maxChart = useMemo(() => {
    let m = 1;
    chartData.forEach((w) => {
      const s = w.pending + w.accepted + w.rejected;
      if (s > m) m = s;
    });
    return m;
  }, [chartData]);

  if (loadingAll) {
    return <DashboardHomeSkeleton />;
  }

  return (
    <div className="space-y-8">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Card variant="hero" className="overflow-hidden p-8 bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">Admin overview</h2>
            <p className="text-indigo-100 opacity-90 max-w-xl">
              Review internship listings, validate agreements, and monitor platform activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => scrollTo(offersRef)}
              className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Review all offers
            </button>
            <button
              type="button"
              onClick={() => scrollTo(appsRef)}
              className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              View applications
            </button>
            <button
              type="button"
              onClick={exportReport}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Export report
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCardConfigs.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => handleStatClick(card.key)}
            className={`text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 rounded-2xl ${activeFilter === card.key ? 'ring-2 ring-indigo-500 shadow-md' : ''
              }`}
          >
            <Card variant="elevated" className={`h-full p-6 border-0 ring-1 ${card.ring} ${card.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-slate-100">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
                    <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{card.value}</p>
                    {card.sub && <p className="mt-0.5 text-xs text-slate-500">{card.sub}</p>}
                    {card.trend != null && (
                      <p className={`mt-2 text-xs font-semibold ${card.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}% vs last month
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden border-slate-200/80 p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Activity volume</h3>
            <p className="text-sm text-slate-500">Pending offers vs accepted applications vs rejections (6-week window)</p>
          </div>
        </div>
        <div className="flex h-56 items-end gap-2 sm:gap-3">
          {chartData.map((w, i) => {
            const p = maxChart ? (w.pending / maxChart) * 100 : 0;
            const a = maxChart ? (w.accepted / maxChart) * 100 : 0;
            const r = maxChart ? (w.rejected / maxChart) * 100 : 0;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full max-w-[80px] items-end justify-center gap-0.5 sm:gap-1">
                  <div
                    className="w-1/3 min-h-[4px] rounded-t-md bg-amber-400 transition-all duration-500"
                    style={{ height: `${Math.max(8, p)}%` }}
                    title={`Pending: ${w.pending}`}
                  />
                  <div
                    className="w-1/3 min-h-[4px] rounded-t-md bg-emerald-500 transition-all duration-500"
                    style={{ height: `${Math.max(8, a)}%` }}
                    title={`Accepted: ${w.accepted}`}
                  />
                  <div
                    className="w-1/3 min-h-[4px] rounded-t-md bg-rose-400 transition-all duration-500"
                    style={{ height: `${Math.max(4, r)}%` }}
                    title={`Rejected: ${w.rejected}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-400 sm:text-xs">{w.label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-400" /> Pending offers</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Accepted apps</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-rose-400" /> Rejections (from notifications)</span>
        </div>
      </Card>

      <div ref={appsRef} className="scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Accepted applications</h3>
            <p className="text-sm text-slate-500">Pending validation — {acceptedApplications.length} in queue</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
              placeholder="Search student, role, company…"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {acceptedApplications.length === 0 ? (
          <Card className="border-dashed border-slate-200 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">✅</div>
            <p className="font-medium text-slate-700">No applications in the validation queue</p>
            <p className="mt-1 text-sm text-slate-500">Accepted internships will appear here for PDF validation.</p>
          </Card>
        ) : filteredApps.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-slate-700 font-medium">No matches</p>
            <button type="button" onClick={() => setAppSearch('')} className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">
              Clear search
            </button>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="px-4 py-3 font-semibold text-slate-500">Student</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Internship</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Company</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Applied</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedApps.map((app) => (
                    <tr key={app.id} className="transition-colors hover:bg-indigo-50/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white shadow-sm">
                            {(app.student_name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{app.student_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{app.offer_title}</td>
                      <td className="px-4 py-4 text-slate-600">{app.offer_company}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${app.status === 'validated'
                            ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                            : 'bg-amber-50 text-amber-800 ring-amber-200'
                            }`}
                        >
                          {app.status === 'validated' ? 'Validated' : 'Pending validation'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600" title={formatDateTime(app.applied_at)}>
                        {formatDateOnly(app.applied_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleValidate(app.id)}
                            disabled={actionLoading === app.id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Validate & PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectModal({ isOpen: true, applicationId: app.id })}
                            disabled={actionLoading === app.id}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Showing {(appPage - 1) * appPageSize + 1}–{Math.min(appPage * appPageSize, filteredApps.length)} of {filteredApps.length}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={appPageSize}
                  onChange={(e) => setAppPageSize(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={appPage <= 1}
                  onClick={() => setAppPage((p) => p - 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={appPage * appPageSize >= filteredApps.length}
                  onClick={() => setAppPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={offersRef} className="scroll-mt-24 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Pending internship offers</h3>
            <p className="text-sm text-slate-500">{pendingOffers.length} awaiting your review</p>
          </div>
        </div>

        {pendingOffers.length === 0 ? (
          <Card className="border-dashed border-slate-200 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">✨</div>
            <p className="font-medium text-slate-700">All caught up</p>
            <p className="mt-1 text-sm text-slate-500">No internship listings are waiting for approval.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingOffers.map((offer) => {
              const skills = Array.isArray(offer.required_skills) ? offer.required_skills : [];
              return (
                <Card
                  key={offer.id}
                  className="group border border-slate-100 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-lg font-bold text-white shadow-sm">
                      {(offer.company_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900 leading-snug">{offer.title}</h4>
                      <p className="text-sm text-slate-600">{offer.company_name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {offer.location || '—'} · {offer.duration || '—'} · Posted {timeAgo(offer.created_at)}
                      </p>
                    </div>
                  </div>
                  {skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {skills.slice(0, 5).map((s) => (
                        <span key={s} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800 ring-1 ring-indigo-100">
                          {s}
                        </span>
                      ))}
                      {skills.length > 5 && <span className="text-xs text-slate-400">+{skills.length - 5}</span>}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(offer.id)}
                      disabled={actionLoading === offer.id}
                      className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectOffer(offer.id)}
                      disabled={actionLoading === offer.id}
                      className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-slate-200/80 p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">Recent activity</h3>
          <p className="text-sm text-slate-500">From your notifications {unreadCount > 0 && `(${unreadCount} unread)`}</p>
          <div className="relative mt-6 space-y-0 pl-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-slate-200">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent notifications yet.</p>
            ) : (
              recentActivity.map((item, idx) => (
                <div key={item.id || idx} className="relative pb-6 pl-6 last:pb-0">
                  <span className="absolute left-0 top-1.5 flex h-3.5 w-3.5 -translate-x-[2px] rounded-full border-2 border-white bg-indigo-500 shadow ring-1 ring-slate-200" />
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.time}</p>
                </div>
              ))
            )}
          </div>
          <Link to="/notifications" className="mt-4 inline-flex text-sm font-semibold text-indigo-600 hover:underline">
            View all notifications →
          </Link>
        </Card>

        <Card className="border-slate-200/80 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Shortcuts</h3>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/admin/companies"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              Company directory
            </Link>
            <Link
              to="/admin/students"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              Student roster
            </Link>
            <button type="button" onClick={exportReport} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50">
              Export validation queue (CSV)
            </button>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => {
          setRejectModal({ isOpen: false, applicationId: null });
          setRejectReason('');
        }}
        title="Reject Application"
        submitText="Reject"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for rejection</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="3"
              placeholder="Please provide a reason for rejecting this application..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setRejectModal({ isOpen: false, applicationId: null });
                setRejectReason('');
              }}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRejectApplication}
              className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AdminPlaceholder({ title }) {
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

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

// function timeAgo(iso) {
//   if (!iso) return '—';
//   try {
//     const then = new Date(iso).getTime();
//     const now = new Date().getTime(); 


//     const diffSeconds = Math.floor((now - then) / 1000);

//     if (diffSeconds < 60) return 'Just now';
//     if (diffSeconds < 3600) {
//       const minutes = Math.floor(diffSeconds / 60);
//       return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
//     }
//     if (diffSeconds < 86400) {
//       const hours = Math.floor(diffSeconds / 3600);
//       return `${hours} hour${hours === 1 ? '' : 's'} ago`;
//     }
//     if (diffSeconds < 2592000) {
//       const days = Math.floor(diffSeconds / 86400);
//       return `${days} day${days === 1 ? '' : 's'} ago`;
//     }
//     if (diffSeconds < 31536000) {
//       const months = Math.floor(diffSeconds / 2592000);
//       return `${months} month${months === 1 ? '' : 's'} ago`;
//     }
//     const years = Math.floor(diffSeconds / 31536000);
//     return `${years} year${years === 1 ? '' : 's'} ago`;
//   } catch {
//     return '—';
//   }
// }

function timeAgo(iso) {
  if (!iso) return '—';
  try {
    // Parse UTC date correctly
    const then = new Date(iso + 'Z'); // Add Z to treat as UTC
    const now = new Date();
    const diffSeconds = Math.floor((now - then) / 1000);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    }
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    if (diffSeconds < 2592000) {
      const days = Math.floor(diffSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    if (diffSeconds < 31536000) {
      const months = Math.floor(diffSeconds / 2592000);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.floor(diffSeconds / 31536000);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  } catch {
    return '—';
  }
}

// Format date only (without time) - for tables
function formatDateOnly(iso) {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '—';
  }
}

function isInCalendarMonth(iso, ref) {
  if (!iso) return false;
  const t = new Date(iso);
  return t.getFullYear() === ref.getFullYear() && t.getMonth() === ref.getMonth();
}

function countInMonth(items, getDate, year, month) {
  const ref = new Date(year, month, 1);
  return items.filter((row) => isInCalendarMonth(getDate(row), ref)).length;
}

function growthPercent(thisMonth, lastMonth) {
  if (lastMonth === 0) return thisMonth > 0 ? 100 : null;
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10;
}

function isRecentlyActive(iso, days = 30) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Date.now() - t < days * 24 * 60 * 60 * 1000;
}

function escapeCsvCell(val) {
  const s = val == null ? '' : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename, headerRow, rows) {
  const lines = [headerRow.join(','), ...rows.map((r) => r.map(escapeCsvCell).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminToast({ message, type = 'info', onClose }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const t = setTimeout(() => closeRef.current(), 4200);
    return () => clearTimeout(t);
  }, [message, type]);
  const styles =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : type === 'error'
        ? 'border-red-200 bg-red-50 text-red-900'
        : 'border-slate-200 bg-white text-slate-800';
  return (
    <div
      className={`fixed bottom-6 right-6 z-[180] max-w-md rounded-xl border px-4 py-3 shadow-lg shadow-slate-200/80 ${styles} transition-opacity duration-300`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <p className="text-sm font-medium flex-1">{message}</p>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors" aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}

function Avatar({ name, className = '' }) {
  const ch = (name && name.trim().charAt(0)) || '?';
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-semibold text-white shadow-sm ring-2 ring-white ${className}`}
    >
      {ch.toUpperCase()}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${active ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
        }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function TableSkeleton({ cols = 7, rows = 8 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 flex-1 max-w-[120px] rounded-md bg-slate-200/80 animate-pulse" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} className="flex items-center gap-4 px-4 py-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 animate-pulse" />
            {Array.from({ length: cols - 1 }).map((__, ci) => (
              <div key={ci} className="h-4 flex-1 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${ci * 50}ms` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RowActionsDropdown({ onView, onBlockToggle, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative flex justify-end" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
        aria-expanded={open}
        aria-label="Open actions"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-52 origin-top-right rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
            onClick={() => {
              setOpen(false);
              onView();
            }}
          >
            View details
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
            onClick={() => {
              setOpen(false);
              onBlockToggle();
            }}
          >
            Block / Activate
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function PaginationBar({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing <span className="font-medium text-slate-900">{from}</span>–<span className="font-medium text-slate-900">{to}</span> of{' '}
        <span className="font-medium text-slate-900">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-2 text-sm text-slate-600">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [locationFilters, setLocationFilters] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detail, setDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminAPI.getAllCompanies();
        if (cancelled) return;
        if (res.data?.success) {
          setCompanies(res.data.companies || []);
        } else {
          setError(res.data?.message || 'Failed to load companies.');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || e.message || 'Failed to load companies.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const uniqueLocations = useMemo(() => {
    const locs = new Set();
    companies.forEach((c) => {
      if (c.location && String(c.location).trim()) locs.add(String(c.location).trim());
    });
    return Array.from(locs).sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const matchSearch = !q || name.includes(q) || email.includes(q);
      const loc = c.location ? String(c.location).trim() : '';
      const matchLoc = locationFilters.size === 0 || (loc && locationFilters.has(loc));
      return matchSearch && matchLoc;
    });
  }, [companies, search, locationFilters]);

  const stats = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const total = companies.length;
    const activeThisMonth = countInMonth(companies, (c) => c.created_at, now.getFullYear(), now.getMonth());
    const lastMonth = countInMonth(companies, (c) => c.created_at, prev.getFullYear(), prev.getMonth());
    const g = growthPercent(activeThisMonth, lastMonth);
    const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    return { total, activeThisMonth, lastMonth, growth: g, monthLabel };
  }, [companies]);

  useEffect(() => {
    setPage(1);
  }, [search, locationFilters, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const toggleLocation = (loc) => {
    setLocationFilters((prev) => {
      const next = new Set(prev);
      if (next.has(loc)) next.delete(loc);
      else next.add(loc);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setLocationFilters(new Set());
  };

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);

  const exportCsv = () => {
    const header = ['Company Name', 'Email', 'Description', 'Location', 'Website', 'Created At'];
    const rows = filtered.map((c) => [
      c.name,
      c.email,
      c.description || '',
      c.location || '',
      c.website || '',
      c.created_at || '',
    ]);
    downloadCsv(`companies-export-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
    showToast('CSV exported successfully.', 'success');
  };

  const handleBlock = () => {
    showToast('Block / Activate will be available when the account API is connected.', 'info');
  };

  const handleDeleteRequest = (row) => {
    setDeleteConfirm(row);
  };

  const confirmDelete = () => {
    setDeleteConfirm(null);
    showToast('Delete requires a backend endpoint. This action is not persisted yet.', 'info');
  };

  const hero = (
    <Card variant="hero" className="p-8 bg-gradient-to-r from-indigo-600 to-indigo-700">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Companies</h2>
          <p className="text-indigo-100 opacity-90 max-w-xl">Directory of registered organizations—search, filter, and export.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || !!error || companies.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
    </Card>
  );

  const statCards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card variant="elevated" className="p-6 transition-shadow hover:shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total companies</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stats.total}</p>
        <p className="mt-1 text-sm text-slate-500">All registered accounts</p>
      </Card>
      <Card variant="elevated" className="p-6 transition-shadow hover:shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">New this month</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-indigo-600">{stats.activeThisMonth}</p>
        <p className="mt-1 text-sm text-slate-500">Joined in {stats.monthLabel}</p>
      </Card>
      <Card variant="elevated" className="p-6 transition-shadow hover:shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">MoM growth</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {stats.growth == null ? '—' : `${stats.growth > 0 ? '+' : ''}${stats.growth}%`}
        </p>
        <p className="mt-1 text-sm text-slate-500">vs previous month ({stats.lastMonth} new)</p>
      </Card>
    </div>
  );

  const toolbar = !loading && !error && companies.length > 0 && (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name or email…"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          Export CSV
        </button>
      </div>
      {uniqueLocations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Location</span>
          <button
            type="button"
            onClick={() => setLocationFilters(new Set())}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${locationFilters.size === 0 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            All
          </button>
          {uniqueLocations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => toggleLocation(loc)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${locationFilters.has(loc) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {hero}
      {!loading && !error && companies.length > 0 && statCards}

      {toolbar}

      {loading ? (
        <TableSkeleton cols={7} rows={8} />
      ) : error ? (
        <Card className="p-8 border-red-100 bg-red-50/50">
          <p className="text-red-800 font-medium">{error}</p>
        </Card>
      ) : companies.length === 0 ? (
        <Card className="overflow-hidden border-slate-200 p-0">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="flex flex-col justify-center bg-gradient-to-br from-indigo-50 to-slate-50 p-10 md:p-14">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-md ring-1 ring-slate-100">
                <svg className="h-12 w-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-center text-lg font-semibold text-slate-900">No companies yet</h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
                When employers sign up, they will appear in this directory with profiles and contact details.
              </p>
              <button
                type="button"
                onClick={() => showToast('Share your registration link with partner companies.', 'info')}
                className="mx-auto mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Invite a company
              </button>
            </div>
            <div className="border-t border-slate-100 p-10 md:border-l md:border-t-0 md:p-14">
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">1</span>
                  Share the platform with hiring partners
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">2</span>
                  Approve internship postings from the dashboard
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">3</span>
                  Export company lists anytime for reporting
                </li>
              </ul>
            </div>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-slate-700 font-medium">No companies match your filters</p>
          <p className="mt-1 text-sm text-slate-500">Try adjusting search or location chips.</p>
          <button type="button" onClick={clearFilters} className="mt-6 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50">
            Clear filters
          </button>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-4 font-semibold text-slate-500">Company</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Email</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Description</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Location</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Website</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Joined</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-4 text-right font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((c) => (
                  <tr
                    key={c.id}
                    className="group transition-colors hover:bg-indigo-50/40"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <span className="font-medium text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{c.email}</td>
                    <td className="max-w-[220px] px-4 py-4 text-slate-700">
                      <span className="line-clamp-2" title={c.description || ''}>{c.description || '—'}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{c.location || '—'}</td>
                    <td className="px-4 py-4">
                      {c.website ? (
                        <a
                          href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          Link
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600" title={formatDateTime(c.created_at)}>
                      {formatDateOnly(c.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge active={isRecentlyActive(c.created_at)} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <RowActionsDropdown
                        onView={() => setDetail(c)}
                        onBlockToggle={handleBlock}
                        onDelete={() => handleDeleteRequest(c)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDetail(null)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Company details</h3>
            <dl className="mt-6 space-y-4 text-sm">
              {[
                ['Name', detail.name],
                ['Email', detail.email],
                ['Description', detail.description || '—'],
                ['Location', detail.location || '—'],
                ['Website', detail.website || '—'],
                ['Created', formatDateTime(detail.created_at)],
                ['Relative', timeAgo(detail.created_at)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
                  <dd className="mt-1 text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="mt-8 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Delete company?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will require a backend delete endpoint. Continue only to preview the confirmation flow.
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">{deleteConfirm.name}</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STUDENT_LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2'];

export function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [levelFilters, setLevelFilters] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detail, setDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminAPI.getAllStudents();
        if (cancelled) return;
        if (res.data?.success) {
          setStudents(res.data.students || []);
        } else {
          setError(res.data?.message || 'Failed to load students.');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || e.message || 'Failed to load students.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const name = (s.name || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const matchSearch = !q || name.includes(q) || email.includes(q);
      const lvl = s.level || '';
      const matchLevel = levelFilters.size === 0 || (lvl && levelFilters.has(lvl));
      return matchSearch && matchLevel;
    });
  }, [students, search, levelFilters]);

  const stats = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const total = students.length;
    const activeThisMonth = countInMonth(students, (s) => s.created_at, now.getFullYear(), now.getMonth());
    const lastMonth = countInMonth(students, (s) => s.created_at, prev.getFullYear(), prev.getMonth());
    const g = growthPercent(activeThisMonth, lastMonth);
    const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    return { total, activeThisMonth, lastMonth, growth: g, monthLabel };
  }, [students]);

  useEffect(() => {
    setPage(1);
  }, [search, levelFilters, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const toggleLevel = (lvl) => {
    setLevelFilters((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setLevelFilters(new Set());
  };

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);

  const exportCsv = () => {
    const header = ['Name', 'Email', 'University', 'Level', 'Major', 'Skills', 'Created At'];
    const rows = filtered.map((s) => [
      s.name,
      s.email,
      s.university || '',
      s.level || '',
      s.major || '',
      Array.isArray(s.skills) ? s.skills.join('; ') : '',
      s.created_at || '',
    ]);
    downloadCsv(`students-export-${new Date().toISOString().slice(0, 10)}.csv`, header, rows);
    showToast('CSV exported successfully.', 'success');
  };

  const handleBlock = () => {
    showToast('Block / Activate will be available when the account API is connected.', 'info');
  };

  const handleDeleteRequest = (row) => setDeleteConfirm(row);
  const confirmDelete = () => {
    setDeleteConfirm(null);
    showToast('Delete requires a backend endpoint. This action is not persisted yet.', 'info');
  };

  const hero = (
    <Card variant="hero" className="p-8 bg-gradient-to-r from-indigo-600 to-indigo-700">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-white">Students</h2>
          <p className="text-indigo-100 opacity-90 max-w-xl">Student roster with academic filters, exports, and quick actions.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={loading || !!error || students.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>
    </Card>
  );

  const statCards = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card variant="elevated" className="p-6 transition-shadow hover:shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total students</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stats.total}</p>
        <p className="mt-1 text-sm text-slate-500">Registered accounts</p>
      </Card>
      <Card variant="elevated" className="p-6 transition-shadow hover:shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">New this month</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-indigo-600">{stats.activeThisMonth}</p>
        <p className="mt-1 text-sm text-slate-500">{stats.monthLabel}</p>
      </Card>
      <Card variant="elevated" className="p-6 transition-shadow hover:shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">MoM growth</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {stats.growth == null ? '—' : `${stats.growth > 0 ? '+' : ''}${stats.growth}%`}
        </p>
        <p className="mt-1 text-sm text-slate-500">vs previous month ({stats.lastMonth} new)</p>
      </Card>
    </div>
  );

  const toolbar = !loading && !error && students.length > 0 && (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50"
        >
          Export CSV
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Level</span>
        <button
          type="button"
          onClick={() => setLevelFilters(new Set())}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${levelFilters.size === 0 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
        >
          All
        </button>
        {STUDENT_LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => toggleLevel(lvl)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${levelFilters.has(lvl) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            {lvl}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {hero}
      {!loading && !error && students.length > 0 && statCards}

      {toolbar}

      {loading ? (
        <TableSkeleton cols={8} rows={8} />
      ) : error ? (
        <Card className="p-8 border-red-100 bg-red-50/50">
          <p className="text-red-800 font-medium">{error}</p>
        </Card>
      ) : students.length === 0 ? (
        <Card className="overflow-hidden border-slate-200 p-0">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="flex flex-col justify-center bg-gradient-to-br from-indigo-50 to-slate-50 p-10 md:p-14">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-md ring-1 ring-slate-100">
                <svg className="h-12 w-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h3 className="text-center text-lg font-semibold text-slate-900">No students yet</h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
                Student accounts will show up here with university, level, and skills from their CV profile.
              </p>
              <button
                type="button"
                onClick={() => showToast('Promote student registration from your landing page.', 'info')}
                className="mx-auto mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Share signup link
              </button>
            </div>
            <div className="border-t border-slate-100 p-10 md:border-l md:border-t-0 md:p-14">
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">1</span>
                  Encourage students to complete their CV
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">2</span>
                  Filter by level when reviewing cohorts
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">3</span>
                  Export rosters for reporting
                </li>
              </ul>
            </div>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-slate-700 font-medium">No students match your filters</p>
          <p className="mt-1 text-sm text-slate-500">Try clearing search or level filters.</p>
          <button type="button" onClick={clearFilters} className="mt-6 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50">
            Clear filters
          </button>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-4 font-semibold text-slate-500">Student</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Email</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">University</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Level</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Major</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Skills</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Joined</th>
                  <th className="px-4 py-4 font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-4 text-right font-semibold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((s) => {
                  const skills = Array.isArray(s.skills) ? s.skills : [];
                  return (
                    <tr key={s.id} className="group transition-colors hover:bg-indigo-50/40">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} />
                          <span className="font-medium text-slate-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{s.email}</td>
                      <td className="px-4 py-4 text-slate-600">{s.university || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">{s.level || '—'}</span>
                      </td>
                      <td className="max-w-[140px] px-4 py-4 text-slate-700">
                        <span className="line-clamp-2" title={s.major || ''}>{s.major || '—'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex max-w-[240px] flex-wrap gap-1">
                          {skills.length ? (
                            skills.slice(0, 6).map((sk) => (
                              <span key={sk} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800 ring-1 ring-indigo-100">
                                {sk}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {skills.length > 6 && <span className="text-xs text-slate-400">+{skills.length - 6}</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600" title={formatDateTime(s.created_at)}>
                        {formatDateOnly(s.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge active={isRecentlyActive(s.created_at)} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <RowActionsDropdown
                          onView={() => setDetail(s)}
                          onBlockToggle={handleBlock}
                          onDelete={() => handleDeleteRequest(s)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Student details</h3>
            <dl className="mt-6 space-y-4 text-sm">
              {[
                ['Name', detail.name],
                ['Email', detail.email],
                ['University', detail.university || '—'],
                ['Level', detail.level || '—'],
                ['Major', detail.major || '—'],
                ['Skills', Array.isArray(detail.skills) ? detail.skills.join(', ') : '—'],
                ['Created', formatDateTime(detail.created_at)],
                ['Relative', timeAgo(detail.created_at)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
                  <dd className="mt-1 text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="mt-8 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Delete student?</h3>
            <p className="mt-2 text-sm text-slate-600">Backend support is required to remove accounts. This confirms the UI flow only.</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{deleteConfirm.name}</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}