import { useEffect, useMemo, useState } from "react";
import { companyAPI } from "../services/api";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";

function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function scoreColor(score) {
  const s = clampScore(score);
  if (s >= 70) return "text-green-500";
  if (s >= 40) return "text-amber-500";
  return "text-red-500";
}

function scoreRingStroke(score) {
  const s = clampScore(score);
  if (s >= 70) return "stroke-green-500";
  if (s >= 40) return "stroke-amber-500";
  return "stroke-red-500";
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

function getOfferIdFromApplication(app) {
  return (
    app?.offer_id ??
    app?.internship_id ??
    app?.offerId ??
    app?.internshipId ??
    app?.offer?.id ??
    null
  );
}

function getApplicantSkills(app) {
  const raw =
    app?.student_skills ??
    app?.skills ??
    app?.student?.skills ??
    app?.student?.required_skills ??
    [];

  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function initials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

function MatchScoreRing({ score, size = 44, stroke = 6, showLabel = true }) {
  const s = clampScore(score);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (s / 100) * c;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-slate-200"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`${scoreRingStroke(s)} transition-[stroke-dasharray] duration-700 ease-out`}
          style={{
            strokeDasharray: `${dash} ${c - dash}`,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>
      {showLabel ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-xs font-semibold text-slate-900">{Math.round(s)}%</div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, trend }) {
  return (
    <Card className="group p-6 bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          {trend ? (
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                {trend}
              </span>
              <span>vs. last week</span>
            </div>
          ) : null}
        </div>

        <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 grid place-items-center ring-1 ring-indigo-100 group-hover:scale-[1.02] transition-transform">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function StatusPill({ isActive }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Closed
    </span>
  );
}

function ApplicationStatusBadge({ status }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
          ⏳ Pending
        </span>
      );
    case "accepted":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          ✅ Accepted
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
          ❌ Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          {String(status ?? "—")}
        </span>
      );
  }
}

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
  const [updatingApplicationId, setUpdatingApplicationId] = useState(null);

  useEffect(() => {
    fetchOffers();
    fetchApplications();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await companyAPI.getInternships();
      if (response.data.success) {
        setOffers(response.data.offers);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const response = await companyAPI.getApplications();
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoadingApps(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchOffers(), fetchApplications()]);
    setRefreshing(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      required_skills: "",
      location: "",
      duration: "",
    });
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
        required_skills: formData.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      };

      const response = await companyAPI.createInternship(data);

      if (response.data.success) {
        setShowPostModal(false);
        resetForm();
        fetchOffers();
      }
    } catch (error) {
      console.error("Error creating offer:", error);
      alert(error.response?.data?.message || "Error creating offer");
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
        required_skills: formData.required_skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      };

      const response = await companyAPI.updateInternship(editingOffer.id, data);

      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchOffers();
      }
    } catch (error) {
      console.error("Error updating offer:", error);
      alert(error.response?.data?.message || "Error updating offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const response = await companyAPI.deleteInternship(id);
      if (response.data.success) {
        fetchOffers();
        fetchApplications();
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      alert("Error deleting offer");
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    setUpdatingApplicationId(applicationId);
    try {
      const response = await companyAPI.updateApplicationStatus(applicationId, status);
      if (response.data.success) {
        await fetchApplications();
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      alert(error.response?.data?.message || "Error updating application");
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const appsByOfferId = useMemo(() => {
    const map = new Map();
    for (const app of applications || []) {
      const offerId = getOfferIdFromApplication(app);
      const key = offerId ?? `unknown:${app?.offer_title ?? "Unknown"}`;
      const list = map.get(key) ?? [];
      list.push(app);
      map.set(key, list);
    }

    for (const [k, list] of map.entries()) {
      list.sort((a, b) => clampScore(b?.match_score) - clampScore(a?.match_score));
      map.set(k, list);
    }

    return map;
  }, [applications]);

  const offerMetrics = useMemo(() => {
    const metrics = new Map();
    for (const offer of offers || []) {
      const offerId = offer?.id;
      const apps = appsByOfferId.get(offerId) ?? [];
      const count = apps.length;
      const avg =
        count === 0 ? null : apps.reduce((sum, a) => sum + clampScore(a?.match_score), 0) / count;
      metrics.set(offerId, { count, avg });
    }
    return metrics;
  }, [offers, appsByOfferId]);

  const activeOffers = (offers || []).filter((o) => o.is_active).length;
  const totalApplicants = (applications || []).length;
  const pendingApplications = (applications || []).filter((a) => a.status === "pending").length;
  const acceptedApplications = (applications || []).filter((a) => a.status === "accepted").length;

  const overallAverageMatch = useMemo(() => {
    const scored = (applications || []).map((a) => clampScore(a?.match_score));
    if (scored.length === 0) return null;
    return scored.reduce((s, n) => s + n, 0) / scored.length;
  }, [applications]);

  const offersSorted = useMemo(() => {
    const list = [...(offers || [])];
    list.sort((a, b) => {
      const da = new Date(a?.created_at ?? a?.posted_at ?? a?.createdAt ?? 0).getTime() || 0;
      const db = new Date(b?.created_at ?? b?.posted_at ?? b?.createdAt ?? 0).getTime() || 0;
      return db - da;
    });
    return list;
  }, [offers]);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-lg">

          {/* background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-32 -right-32 h-80 w-80 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="relative px-8 py-12 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-10">

            {/* TEXT */}
            <div className="max-w-xl space-y-5 text-center lg:text-left">
              <p className="text-indigo-100 text-sm font-medium tracking-wide">
                Company Dashboard
              </p>

              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Build your pipeline faster
              </h1>

              <p className="text-indigo-100/90 text-base leading-relaxed">
                Manage internships, review candidates and hire smarter using
                <span className="text-white font-semibold"> match scores</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-3">
                <button
                  onClick={() => {
                    resetForm();
                    setShowPostModal(true);
                  }}
                  className="px-6 py-3 rounded-2xl bg-white text-indigo-600 font-semibold shadow-md hover:shadow-xl hover:scale-[1.03] transition-all"
                >
                  Post Internship
                </button>

                <button
                  onClick={refreshAll}
                  className="px-6 py-3 rounded-2xl bg-white/10 text-white font-medium backdrop-blur hover:bg-white/20 transition-all"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* IMAGE */}
            <div className="w-full max-w-sm flex justify-center">
              <img
                src="/Images/landing1.svg"
                alt=""
                className="object-contain drop-shadow-xl animate-[float_5s_ease-in-out_infinite]"
              />
            </div>

          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-5">

          {/* MATCH */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">

            <div className="flex justify-between items-start">
              <div>
                <p className="text-3xl font-bold">
                  {overallAverageMatch == null ? "—" : `${Math.round(overallAverageMatch)}%`}
                </p>
                <p className="text-sm opacity-80 mt-2 tracking-wide">
                  MATCH SCORE
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16l6-6 4 4 6-6" strokeLinecap="round" />
                </svg>
              </div>
            </div>

          </div>


          {/* ACTIVE */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">

            <div className="flex justify-between items-start">
              <div>
                <p className="text-3xl font-bold">
                  {activeOffers}
                </p>
                <p className="text-sm opacity-80 mt-2 tracking-wide">
                  ACTIVE POSTS
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
              </div>
            </div>

          </div>


          {/* APPLICANTS */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg">

            <div className="flex justify-between items-start">
              <div>
                <p className="text-3xl font-bold">
                  {totalApplicants}
                </p>
                <p className="text-sm opacity-80 mt-2 tracking-wide">
                  APPLICANTS
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>

          </div>


          {/* ACCEPTED */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-lg">

            <div className="flex justify-between items-start">
              <div>
                <p className="text-3xl font-bold">
                  {acceptedApplications}
                </p>
                <p className="text-sm opacity-80 mt-2 tracking-wide">
                  ACCEPTED
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
            </div>

          </div>

        </div>

        {/* Quick actions + legend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-6 bg-white shadow-sm border border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
              <p className="mt-1 text-sm text-slate-600">Common actions to keep you moving.</p>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowPostModal(true);
                }}
                className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center ring-1 ring-indigo-100 group-hover:bg-white">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Post internship</p>
                    <p className="text-xs text-slate-600">Create a new listing</p>
                  </div>
                </div>
              </button>

              <a
                href="/company/Candidates"
                className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center ring-1 ring-indigo-100 group-hover:bg-white">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path
                        d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">View all candidates</p>
                    <p className="text-xs text-slate-600">Filter and manage</p>
                  </div>
                </div>
              </a>
            </div>
          </Card>

          <Card className="p-6 bg-white shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Match score legend</h2>
                <p className="mt-1 text-sm text-slate-600">Green ≥70%, Amber 40–69%, Red &lt;40%.</p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <MatchScoreRing score={82} size={40} stroke={6} />
                <MatchScoreRing score={55} size={40} stroke={6} />
                <MatchScoreRing score={28} size={40} stroke={6} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <p className="text-sm font-semibold text-slate-900">Strong match</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">≥ 70%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <p className="text-sm font-semibold text-slate-900">Medium match</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">40–69%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <p className="text-sm font-semibold text-slate-900">Low match</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">&lt; 40%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Internship postings */}
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Internship postings</h2>
              <p className="mt-1 text-sm text-slate-600">Grid view with applicants and match insights.</p>
            </div>
          </div>

          {loading ? (
            <Card className="p-10 bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-1/3 rounded bg-slate-100 animate-pulse" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            </Card>
          ) : offersSorted.length === 0 ? (
            <Card className="p-12 text-center bg-white border border-slate-100 shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">No internships posted yet</h3>
              <p className="mt-1 text-sm text-slate-600">Click “Post Internship” to get started.</p>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => {
                    resetForm();
                    setShowPostModal(true);
                  }}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Post Internship
                </button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {offersSorted.map((offer) => {
                const m = offerMetrics.get(offer?.id) ?? { count: 0, avg: null };
                const avg = m.avg;
                const applicantCount = m.count;
                const skills = Array.isArray(offer?.required_skills) ? offer.required_skills : [];
                const postedAt = offer?.created_at ?? offer?.posted_at ?? offer?.createdAt;

                const avgScoreDisplay = avg == null ? "—" : `${Math.round(avg)}%`;
                const isOpen = Boolean(openApplicants[offer.id]);

                return (
                  <Card
                    key={offer.id}
                    className="p-6 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-slate-900">{offer.title}</h3>
                          <StatusPill isActive={offer.is_active} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 21s7-4.35 7-11a7 7 0 0 0-14 0c0 6.65 7 11 7 11Z" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {offer.location || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M8 7V3m8 4V3M4 11h16M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Posted {formatDate(postedAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {offer.duration || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-medium text-slate-600">Avg match</p>
                          <p className={`text-sm font-semibold ${avg == null ? "text-slate-400" : scoreColor(avg)}`}>
                            {avgScoreDisplay}
                          </p>
                        </div>
                        <MatchScoreRing score={avg ?? 0} size={46} stroke={6} showLabel={avg != null} />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {skills.length === 0 ? (
                        <span className="text-sm text-slate-500">No skills specified</span>
                      ) : (
                        skills.slice(0, 8).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                          >
                            {skill}
                          </span>
                        ))
                      )}
                      {skills.length > 8 ? (
                        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                          +{skills.length - 8} more
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-medium text-slate-600">Applicants</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{applicantCount}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-medium text-slate-600">Average match</p>
                        <p className={`mt-1 text-sm font-semibold ${avg == null ? "text-slate-400" : scoreColor(avg)}`}>
                          {avgScoreDisplay}
                        </p>
                      </div>
                      <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs font-medium text-slate-600">Status</p>
                        <div className="mt-2">
                          <StatusPill isActive={offer.is_active} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                      <button
                        onClick={() =>
                          setOpenApplicants((prev) => ({
                            ...prev,
                            [offer.id]: !prev[offer.id],
                          }))
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                      >
                        <svg
                          className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        View Applicants
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(offer)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div
                      className={`mt-4 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="pt-4 border-t border-slate-100">
                        {loadingApps ? (
                          <div className="py-8 flex items-center justify-center">
                            <div className="h-7 w-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                          </div>
                        ) : (appsByOfferId.get(offer.id) ?? []).length === 0 ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-center">
                            <p className="text-sm font-semibold text-slate-900">No applicants yet</p>
                            <p className="mt-1 text-sm text-slate-600">When students apply, they’ll show up here.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(appsByOfferId.get(offer.id) ?? []).map((app) => {
                              const s = clampScore(app?.match_score);
                              const skills2 = getApplicantSkills(app);

                              return (
                                <div
                                  key={app.id}
                                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 hover:shadow-sm transition-shadow"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 grid place-items-center font-semibold">
                                        {initials(app?.student_name)}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="truncate text-sm font-semibold text-slate-900">
                                            {app?.student_name ?? "Unnamed applicant"}
                                          </p>
                                          <ApplicationStatusBadge status={app?.status} />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-600">
                                          Applied {formatDate(app?.applied_at ?? app?.created_at ?? app?.appliedAt)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="text-right">
                                          <p className="text-xs font-medium text-slate-600">Match score</p>
                                          <p className={`text-sm font-semibold ${scoreColor(s)}`}>{Math.round(s)}%</p>
                                        </div>
                                        <MatchScoreRing score={s} size={48} stroke={6} />
                                      </div>

                                      {app?.status === "pending" ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleUpdateApplicationStatus(app.id, "accepted")}
                                            disabled={updatingApplicationId === app.id}
                                            className="rounded-2xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                          >
                                            Accept
                                          </button>
                                          <button
                                            onClick={() => handleUpdateApplicationStatus(app.id, "rejected")}
                                            disabled={updatingApplicationId === app.id}
                                            className="rounded-2xl bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {skills2.length === 0 ? (
                                      <span className="text-xs text-slate-500">No skills listed</span>
                                    ) : (
                                      skills2.slice(0, 10).map((sk) => (
                                        <span
                                          key={sk}
                                          className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                                        >
                                          {sk}
                                        </span>
                                      ))
                                    )}
                                    {skills2.length > 10 ? (
                                      <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                        +{skills2.length - 10} more
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!loadingApps && (appsByOfferId.get(offer.id) ?? []).length > 1 ? (
                          <p className="mt-3 text-xs text-slate-500">
                            Applicants are sorted by match score (highest first).
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Applicants summary */}
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Applicants</h2>
              <p className="mt-1 text-sm text-slate-600">
                Collapsible per internship above. Here’s a quick overview.
              </p>
            </div>
            <a href="/company/Candidates" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              View all →
            </a>
          </div>

          <Card className="p-6 bg-white border border-slate-100 shadow-sm">
            {loadingApps ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-10">
                <h3 className="text-base font-semibold text-slate-900">No applications yet</h3>
                <p className="mt-1 text-sm text-slate-600">When students apply to your internships, they’ll appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-600">Highest match score</p>
                  {(() => {
                    const best = [...applications].sort(
                      (a, b) => clampScore(b?.match_score) - clampScore(a?.match_score)
                    )[0];
                    const bestScore = clampScore(best?.match_score);
                    return (
                      <div className="mt-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{best?.student_name ?? "—"}</p>
                          <p className="mt-1 text-xs text-slate-600">{best?.offer_title ?? "—"}</p>
                        </div>
                        <MatchScoreRing score={bestScore} size={46} stroke={6} />
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-600">Average match score</p>
                  <div className="mt-3 flex items-center gap-3">
                    <MatchScoreRing
                      score={overallAverageMatch ?? 0}
                      size={46}
                      stroke={6}
                      showLabel={overallAverageMatch != null}
                    />
                    <div>
                      <p className={`text-sm font-semibold ${overallAverageMatch == null ? "text-slate-400" : scoreColor(overallAverageMatch)}`}>
                        {overallAverageMatch == null ? "—" : `${Math.round(overallAverageMatch)}%`}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">Across {applications.length} applicants</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-600">Pending decisions</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-2xl font-semibold text-slate-900">{pendingApplications}</p>
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                      Action needed
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
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