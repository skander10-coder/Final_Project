import { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import { studentAPI } from '../services/api';

export function StudentDashboardHome() {
  const { searchTerm } = useOutletContext();
  const navigate = useNavigate();
  
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');
  const [hasCV, setHasCV] = useState(false);
  const [checkingCV, setCheckingCV] = useState(true);
  
  const internshipsSectionRef = useRef(null);

  // جلب العروض عند تحميل الصفحة
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
        setInternships(response.data.offers);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  };

  // جلب طلبات الطالب
  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const response = await studentAPI.getApplications();
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApps(false);
    }
  };

  // 🔥 التحقق من اكتمال الـ CV
  const checkCV = async () => {
    try {
      const res = await studentAPI.getProfile();
      if (res.data.success) {
        const profile = res.data.profile;
        const completed = profile && profile.skills?.length > 0 && profile.university && profile.level && profile.major;
        setHasCV(completed);
      }
    } catch (err) {
      console.error('Error checking CV:', err);
    } finally {
      setCheckingCV(false);
    }
  };

  // البحث في Frontend (في العنوان والمهارات)
  const filteredInternships = useMemo(() => {
    let results = internships;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(internship => {
        const titleMatch = internship.title?.toLowerCase().includes(term);
        const skillsMatch = internship.required_skills?.some(skill => 
          skill.toLowerCase().includes(term)
        );
        return titleMatch || skillsMatch;
      });
    }
    
    if (locationFilter) {
      results = results.filter(internship => internship.location === locationFilter);
    }
    
    return results;
  }, [internships, searchTerm, locationFilter]);

  // Smooth Scroll عند البحث
  useEffect(() => {
    if (searchTerm && internshipsSectionRef.current && filteredInternships.length > 0) {
      setTimeout(() => {
        internshipsSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 200);
    }
  }, [searchTerm, filteredInternships.length]);

  const locations = [...new Set(internships.map(i => i.location).filter(Boolean))];

  const isSkillMatching = (skill) => {
    if (!searchTerm) return false;
    return skill.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // إحصائيات الطلبات
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const acceptedCount = applications.filter(a => a.status === 'accepted').length;

  const progressCards = [
    { label: 'Active Applications', count: pendingCount, icon: '📋', color: 'bg-indigo-100', textColor: 'text-indigo-600' },
    { label: 'Available Internships', count: filteredInternships.length, icon: '🎯', color: 'bg-emerald-100', textColor: 'text-emerald-600' },
    { label: 'Interviews', count: acceptedCount, icon: '📅', color: 'bg-amber-100', textColor: 'text-amber-600' },
  ];

  // 🔥 دالة التقديم مع التحقق من الـ CV
  const handleApply = async (offerId) => {
    if (!hasCV) {
      alert('Please complete your CV first before applying');
      navigate('/student/fill-cv');
      return;
    }
    try {
      const response = await studentAPI.apply(offerId);
      if (response.data.success) {
        alert('Application submitted successfully!');
        fetchApplications();
      }
    } catch (error) {
      console.error('Error applying:', error);
      alert(error.response?.data?.message || 'Error applying for internship');
    }
  };

  // الحصول على حالة الطلب لعرض معين
  const getApplicationStatus = (offerId) => {
    const app = applications.find(a => a.offer_id === offerId);
    return app?.status || null;
  };

  // تنسيق عرض الحالة
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">⏳ Pending</span>;
      case 'accepted':
        return <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">✅ Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">❌ Rejected</span>;
      case 'validated':
        return <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">📄 Validated</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <Card variant="hero" className="p-8 bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">🚀 Find Your Next Opportunity</h2>
            <p className="text-indigo-100 opacity-90">
              Discover internships tailored to your skills and career goals.
            </p>
          </div>
          {searchTerm && (
            <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm animate-pulse">
              <p className="text-white text-sm">
                🔍 Searching for: <span className="font-semibold">"{searchTerm}"</span>
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 🔥 رسالة تحذير إذا لم يكتمل الـ CV */}
      {!checkingCV && !hasCV && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-amber-800">Complete Your CV First</p>
              <p className="text-sm text-amber-700">You need to complete your CV before applying for internships.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/fill-cv')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
          >
            Fill CV →
          </button>
        </div>
      )}

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {progressCards.map((card) => (
          <Card key={card.label} variant="elevated" className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center text-xl`}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{card.count}</p>
                <p className="text-sm text-slate-600">{card.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* فلتر الولاية */}
      <div className="flex justify-end">
        <div className="w-64">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            📍 Filter by Location
          </label>
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none cursor-pointer"
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {locationFilter && (
            <button
              onClick={() => setLocationFilter('')}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Internships Grid - مع ارتفاع موحد */}
      <div ref={internshipsSectionRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">📋 Available Internships</h3>
          <p className="text-sm text-slate-500">{filteredInternships.length} opportunities found</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : filteredInternships.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-500 font-medium">No internships found</p>
            <p className="text-slate-400 text-sm mt-1">
              {searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your filters or check back later'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInternships.map((internship) => {
              const appStatus = getApplicationStatus(internship.id);
              const hasApplied = appStatus !== null;
              
              return (
                <Card key={internship.id} className="p-6 hover:shadow-xl transition-all duration-200 border border-slate-100 hover:border-indigo-200 group flex flex-col h-full">
                  {/* Company Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {internship.company_name?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{internship.company_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span>📍</span> {internship.location || 'Remote'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium whitespace-nowrap">
                      {internship.duration || 'Not specified'}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h4 className="font-bold text-lg text-slate-900 mb-2 line-clamp-1">
                    {internship.title}
                  </h4>
                  
                  {/* Description - ارتفاع ثابت */}
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
                    {internship.description}
                  </p>
                  
                  {/* Skills */}
                  {internship.required_skills && internship.required_skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {internship.required_skills.slice(0, 3).map((skill, idx) => (
                          <span 
                            key={idx} 
                            className={`px-2 py-1 rounded-full text-xs transition-all ${
                              isSkillMatching(skill)
                                ? 'bg-indigo-100 text-indigo-700 font-medium ring-2 ring-indigo-300 shadow-sm'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                        {internship.required_skills.length > 3 && (
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                            +{internship.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Spacer لدفع الزر للأسفل */}
                  <div className="flex-1"></div>
                  
                  {/* Apply Button / Status Badge */}
                  {hasApplied ? (
                    <div className="mt-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Application:</span>
                        {getStatusBadge(appStatus)}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApply(internship.id)}
                      className="w-full mt-4 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors group-hover:shadow-md"
                    >
                      Apply Now
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Applications Section - مع عرض الطلبات */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">📝 My Applications</h3>
          <p className="text-sm text-slate-500">{applications.length} total</p>
        </div>
        
        {loadingApps ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : applications.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-slate-500 font-medium">No applications yet</p>
            <p className="text-slate-400 text-sm mt-1">Apply to internships above to track your progress</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((app) => (
              <Card key={app.id} className="p-5 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{app.offer_title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{app.offer_company}</p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Applied on: {new Date(app.applied_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
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