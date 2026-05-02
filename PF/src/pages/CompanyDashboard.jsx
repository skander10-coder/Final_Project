import { useEffect, useMemo, useState } from "react";
import { companyAPI } from "../services/api";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";

// ==================== UTILITIES ====================
const clampScore = (value) => {
  const n = Number(value);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

const scoreColor = (score) => {
  const s = clampScore(score);
  if (s >= 70) return "text-emerald-600";
  if (s >= 40) return "text-amber-600";
  return "text-rose-600";
};

const scoreRingStroke = (score) => {
  const s = clampScore(score);
  if (s >= 70) return "stroke-emerald-500";
  if (s >= 40) return "stroke-amber-500";
  return "stroke-rose-500";
};

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
};

const initials = (name) => {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
};

// ==================== COMPONENTS ====================
const MatchScoreRing = ({ score, size = 44, stroke = 6, showLabel = true }) => {
  const s = clampScore(score);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (s / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-slate-200" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`${scoreRingStroke(s)} transition-all duration-700 ease-out`}
          style={{
            strokeDasharray: `${dash} ${circumference - dash}`,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-slate-800">{Math.round(s)}%</span>
        </div>
      )}
    </div>
  );
};

const StatusPill = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isActive
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
    {isActive ? "Active" : "Closed"}
  </span>
);

const ApplicationStatusBadge = ({ status }) => {
  const config = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", label: "Pending" },
    accepted: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", label: "Accepted" },
    rejected: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", label: "Rejected" },
  };
  const style = config[status] || { bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-200", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text} ring-1 ${style.ring}`}>
      {style.label}
    </span>
  );
};

// ==================== MAIN COMPONENT ====================
export function CompanyDashboardHome() {
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    required_skills: "",
    location: "",
    duration: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [openApplicants, setOpenApplicants] = useState({});
  const [updatingAppId, setUpdatingAppId] = useState(null);

  // Fetch data
  useEffect(() => {
    fetchOffers();
    fetchApplications();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await companyAPI.getInternships();
      if (res.data.success) setOffers(res.data.offers || []);
    } catch (err) {
      console.error("Error fetching offers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await companyAPI.getApplications();
      if (res.data.success) setApplications(res.data.applications || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchOffers(), fetchApplications()]);
    setRefreshing(false);
  };

  // Form handlers
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const resetForm = () => {
    setFormData({ title: "", description: "", required_skills: "", location: "", duration: "" });
    setEditingOffer(null);
  };

  const handleEditClick = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      required_skills: offer.required_skills ? offer.required_skills.join(", ") : "",
      location: offer.location || "",
      duration: offer.duration || "",
    });
    setShowEditModal(true);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        required_skills: formData.required_skills.split(",").map(s => s.trim()).filter(Boolean),
      };
      const res = await companyAPI.createInternship(data);
      if (res.data.success) {
        setShowPostModal(false);
        resetForm();
        fetchOffers();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error creating offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        required_skills: formData.required_skills.split(",").map(s => s.trim()).filter(Boolean),
      };
      const res = await companyAPI.updateInternship(editingOffer.id, data);
      if (res.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchOffers();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error updating offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      await companyAPI.deleteInternship(id);
      await fetchOffers();
      await fetchApplications();
    } catch (err) {
      console.error(err);
      alert("Error deleting offer");
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    setUpdatingAppId(appId);
    try {
      const res = await companyAPI.updateApplicationStatus(appId, status);
      if (res.data.success) await fetchApplications();
    } catch (err) {
      console.error(err);
      alert("Error updating application status");
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Computed metrics
  const metrics = useMemo(() => {
    const active = offers.filter(o => o.is_active).length;
    const totalApps = applications.length;
    const pending = applications.filter(a => a.status === "pending").length;
    const accepted = applications.filter(a => a.status === "accepted").length;
    const avgMatch = applications.reduce((sum, a) => sum + clampScore(a.match_score), 0) / (applications.length || 1);
    return { active, totalApps, pending, accepted, avgMatch };
  }, [offers, applications]);

  const groupedApps = useMemo(() => {
    const map = new Map();
    applications.forEach(app => {
      const key = app.offer_id || app.offer?.id;
      const list = map.get(key) || [];
      list.push(app);
      map.set(key, list);
    });
    for (const list of map.values()) {
      list.sort((a, b) => clampScore(b.match_score) - clampScore(a.match_score));
    }
    return map;
  }, [applications]);

  // Sort offers by date (newest first)
  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
  }, [offers]);

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-xl">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative px-8 py-12 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-xl text-center lg:text-left space-y-4">
              <p className="text-indigo-100 text-sm font-medium tracking-wide">Company Dashboard</p>
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">Build your pipeline faster</h1>
              <p className="text-indigo-100/90 text-base">
                Manage internships, review candidates, and hire smarter using{" "}
                <span className="font-semibold text-white">match scores</span>.
              </p>
              <div className="flex flex-wrap gap-4 pt-3 justify-center lg:justify-start">
                <button
                  onClick={() => setShowPostModal(true)}
                  className="px-6 py-3 rounded-xl bg-white text-indigo-600 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Post Internship
                </button>
                <button
                  onClick={refreshAll}
                  disabled={refreshing}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all disabled:opacity-50"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
            <div className="max-w-sm">
              <img src="/Images/landing1.svg" alt="Illustration" className="drop-shadow-xl animate-[float_5s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-3xl font-bold">{Math.round(metrics.avgMatch)}%</p>
                <p className="text-sm opacity-80 mt-2 tracking-wide">MATCH SCORE</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16l6-6 4 4 6-6" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-3xl font-bold">{metrics.active}</p>
                <p className="text-sm opacity-80 mt-2 tracking-wide">ACTIVE POSTS</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-3xl font-bold">{metrics.totalApps}</p>
                <p className="text-sm opacity-80 mt-2 tracking-wide">APPLICANTS</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-3xl font-bold">{metrics.accepted}</p>
                <p className="text-sm opacity-80 mt-2 tracking-wide">ACCEPTED</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions + Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900">Quick actions</h3>
            <p className="text-sm text-slate-500 mt-1">Common actions to keep you moving.</p>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => setShowPostModal(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Post internship</p>
                  <p className="text-xs text-slate-500">Create a new listing</p>
                </div>
              </button>
              <a
                href="/company/Candidates"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
                    <circle cx="12" cy="7" r="4" />
                    <path d="M20 8v6M23 11h-6" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">View all candidates</p>
                  <p className="text-xs text-slate-500">Filter and manage</p>
                </div>
              </a>
            </div>
          </Card>

          <Card className="lg:col-span-2 p-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">Match score legend</h3>
                <p className="text-sm text-slate-500 mt-1">Green ≥70%, Amber 40–69%, Red &lt;40%.</p>
              </div>
              <div className="flex gap-3">
                <MatchScoreRing score={82} size={40} />
                <MatchScoreRing score={55} size={40} />
                <MatchScoreRing score={28} size={40} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-sm font-semibold">Strong match</span></div>
                <p className="text-xs text-slate-600 mt-1">≥ 70%</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-sm font-semibold">Medium match</span></div>
                <p className="text-xs text-slate-600 mt-1">40–69%</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-sm font-semibold">Low match</span></div>
                <p className="text-xs text-slate-600 mt-1">&lt; 40%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Internship Postings */}
        {/* Internship Postings */}
        <div className="space-y-6">

          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Internship Postings</h2>
              <p className="text-sm text-slate-400 mt-0.5">Manage your listings and review applicants</p>
            </div>
          </div>

          {/* States */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-slate-100 rounded-full w-1/3" />
                      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedOffers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073a2.25 2.25 0 0 1-2.25 2.25h-12a2.25 2.25 0 0 1-2.25-2.25V6a2.25 2.25 0 0 1 2.25-2.25h4.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 2.25v6m3-3h-6" />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-800">No internships posted yet</p>
              <p className="text-sm text-slate-400 mt-1 max-w-xs">Start attracting top talent by publishing your first internship listing.</p>
              <button
                onClick={() => setShowPostModal(true)}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all duration-150 shadow-sm shadow-indigo-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Post your first internship
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedOffers.map((offer) => {
                const appList = groupedApps.get(offer.id) || [];
                const avgMatch = appList.length
                  ? appList.reduce((s, a) => s + clampScore(a.match_score), 0) / appList.length
                  : 0;
                const isOpen = !!openApplicants[offer.id];

                return (
                  <div
                    key={offer.id}
                    className="group rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200"
                  >
                    {/* Card Body */}
                    <div className="p-6 space-y-5">

                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          {/* Avatar - Modified to use Indigo gradient */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                            {offer.title?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">{offer.title}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                </svg>
                                {offer.location || "Remote"}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                </svg>
                                {formatDate(offer.created_at)}
                              </span>
                              {offer.duration && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                  {offer.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <StatusPill isActive={offer.is_active} />
                      </div>

                      {/* Skills */}
                      {offer.required_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {offer.required_skills.slice(0, 6).map(skill => (
                            <span
                              key={skill}
                              className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 ring-1 ring-slate-200/80"
                            >
                              {skill}
                            </span>
                          ))}
                          {offer.required_skills.length > 6 && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100">
                              +{offer.required_skills.length - 6} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats + Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 leading-none">Applicants</p>
                              <p className="text-sm font-bold text-slate-900 mt-0.5">{appList.length}</p>
                            </div>
                          </div>
                          <div className="w-px h-8 bg-slate-100" />
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 leading-none">Avg match</p>
                              <p className={`text-sm font-bold mt-0.5 ${scoreColor(avgMatch)}`}>{Math.round(avgMatch)}%</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOpenApplicants(prev => ({ ...prev, [offer.id]: !prev[offer.id] }))}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors duration-150"
                          >
                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                            </svg>
                            {isOpen ? "Hide" : "Applicants"}
                          </button>
                          <button
                            onClick={() => handleEditClick(offer)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors duration-150"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors duration-150"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Applicants Panel */}
                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50 rounded-b-2xl px-6 py-5 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Applicants — sorted by match score
                          </p>
                          <span className="text-xs font-medium text-slate-400">{appList.length} total</span>
                        </div>

                        {loadingApps ? (
                          <div className="py-10 text-center text-sm text-slate-400">Loading applicants...</div>
                        ) : appList.length === 0 ? (
                          <div className="py-10 text-center">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                              </svg>
                            </div>
                            <p className="text-sm text-slate-400">No applicants yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {appList.map((app, idx) => (
                              <div
                                key={app.id}
                                className="bg-white rounded-xl border border-slate-100 px-4 py-3.5 flex flex-wrap items-center justify-between gap-4 hover:border-slate-200 transition-colors duration-150"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-slate-300 w-4 text-center">{idx + 1}</span>
                                  {/* Modified avatar: pure Indigo gradient */}
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {initials(app.student_name)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 leading-tight">{app.student_name || "Anonymous"}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Applied {formatDate(app.applied_at)}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                  <MatchScoreRing score={app.match_score} size={40} />
                                  <ApplicationStatusBadge status={app.status} />
                                  {app.status === "pending" && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleUpdateStatus(app.id, "accepted")}
                                        disabled={updatingAppId === app.id}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors duration-150 shadow-sm"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleUpdateStatus(app.id, "rejected")}
                                        disabled={updatingAppId === app.id}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-50 disabled:opacity-50 transition-colors duration-150"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Post Modal */}
      <Modal
        isOpen={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          resetForm();
        }}
        title="📢 Post New Internship"
        submitText="Post Internship"
      >
        <form onSubmit={handleSubmitOffer} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Position Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
              placeholder="e.g., Frontend Developer Intern"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="4"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
              placeholder="Describe the internship responsibilities and requirements..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Required Skills</label>
            <input
              type="text"
              name="required_skills"
              value={formData.required_skills}
              onChange={handleInputChange}
              placeholder="React, Python, Flask, SQL (comma separated)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
            />
            <p className="text-xs text-slate-400 mt-1">Separate skills with commas</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Location (Wilaya)</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
              >
                <option value="">Select a Wilaya</option>
                <option value="Algiers">Algiers</option>
                <option value="Oran">Oran</option>
                <option value="Constantine">Constantine</option>
                <option value="Annaba">Annaba</option>
                <option value="Blida">Blida</option>
                <option value="Setif">Setif</option>
                <option value="Tizi Ouzou">Tizi Ouzou</option>
                <option value="Bejaia">Bejaia</option>
                <option value="Biskra">Biskra</option>
                <option value="Tlemcen">Tlemcen</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">Select the location for this internship</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="3 months, 6 months"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowPostModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Internship"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="✏️ Edit Internship"
        submitText="Save Changes"
      >
        <form onSubmit={handleUpdateOffer} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Position Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
              placeholder="e.g., Frontend Developer Intern"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="4"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
              placeholder="Describe the internship responsibilities and requirements..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Required Skills</label>
            <input
              type="text"
              name="required_skills"
              value={formData.required_skills}
              onChange={handleInputChange}
              placeholder="React, Python, Flask, SQL (comma separated)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
            />
            <p className="text-xs text-slate-400 mt-1">Separate skills with commas</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Location (Wilaya)</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
              >
                <option value="">Select a Wilaya</option>
                <option value="Algiers">Algiers</option>
                <option value="Oran">Oran</option>
                <option value="Constantine">Constantine</option>
                <option value="Annaba">Annaba</option>
                <option value="Blida">Blida</option>
                <option value="Setif">Setif</option>
                <option value="Tizi Ouzou">Tizi Ouzou</option>
                <option value="Bejaia">Bejaia</option>
                <option value="Biskra">Biskra</option>
                <option value="Tlemcen">Tlemcen</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">Select the location for this internship</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="3 months, 6 months"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none bg-white"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function CompanyPlaceholder({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-slate-50">
      <div className="text-center">
        <div className="text-5xl mb-4">🚧</div>
        <p className="text-slate-600 font-medium">{title}</p>
        <p className="text-slate-500 text-sm mt-1">Coming soon</p>
      </div>
    </div>
  );
}