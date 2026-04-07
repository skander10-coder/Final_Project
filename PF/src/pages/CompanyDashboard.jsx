import { useState, useEffect } from 'react';
import { companyAPI } from "../services/api";
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';

export function CompanyDashboardHome() {
  const [offers, setOffers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_skills: '',
    location: '',
    duration: ''
  });
  const [submitting, setSubmitting] = useState(false);

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
      console.error('Error fetching offers:', error);
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
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      required_skills: '',
      location: '',
      duration: ''
    });
    setEditingOffer(null);
  };

  const handleEditClick = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      required_skills: offer.required_skills ? offer.required_skills.join(', ') : '',
      location: offer.location || '',
      duration: offer.duration || ''
    });
    setShowEditModal(true);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const data = {
        ...formData,
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s)
      };
      
      const response = await companyAPI.createInternship(data);
      
      if (response.data.success) {
        setShowPostModal(false);
        resetForm();
        fetchOffers();
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      alert(error.response?.data?.message || 'Error creating offer');
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
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s)
      };
      
      const response = await companyAPI.updateInternship(editingOffer.id, data);
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchOffers();
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      alert(error.response?.data?.message || 'Error updating offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      const response = await companyAPI.deleteInternship(id);
      if (response.data.success) {
        fetchOffers();
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Error deleting offer');
    }
  };

  const activeOffers = offers.filter(o => o.is_active).length;
  const totalApplicants = applications.length;
  const pendingApplications = applications.filter(a => a.status === 'pending').length;

  const statCards = [
    { label: 'Active Postings', count: activeOffers, icon: '📝', color: 'bg-indigo-100' },
    { label: 'Total Applicants', count: totalApplicants, icon: '👥', color: 'bg-emerald-100' },
    { label: 'Pending Review', count: pendingApplications, icon: '⏳', color: 'bg-amber-100' },
  ];

  const postingColumns = [
    { key: 'title', label: 'Position' },
    { key: 'location', label: 'Location' },
    { key: 'duration', label: 'Duration' },
    { key: 'skills', label: 'Skills' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '' },
  ];

  const postingData = offers.map(offer => ({
    ...offer,
    skills: offer.required_skills ? offer.required_skills.slice(0, 2).join(', ') + (offer.required_skills.length > 2 ? '...' : '') : '-',
    status: offer.is_active ? (
      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Active</span>
    ) : (
      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">Closed</span>
    ),
    actions: (
      <div className="flex gap-2">
        <button 
          onClick={() => handleEditClick(offer)}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Edit
        </button>
        <button 
          onClick={() => handleDeleteOffer(offer.id)}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    )
  }));

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">⏳ Pending</span>;
      case 'accepted':
        return <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">✅ Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">❌ Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">{status}</span>;
    }
  };

  // آخر 5 متقدمين فقط
  const recentApplications = applications.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <Card variant="hero" className="p-8 bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">🚀 Attract Top Talent</h2>
            <p className="text-indigo-100 opacity-90">
              Post internships and connect with qualified candidates for your team.
            </p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setShowPostModal(true);
            }}
            className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Post Internship
          </button>
        </div>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
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

      {/* 🔥 Recent Candidates Preview - فقط آخر 5 متقدمين */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">👥 Recent Candidates</h3>
          <a 
            href="/company/Candidates" 
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all →
          </a>
        </div>
        
        {loadingApps ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : recentApplications.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-slate-500 font-medium">No applications yet</p>
            <p className="text-slate-400 text-sm mt-1">When students apply, they will appear here</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentApplications.map((app) => (
              <Card key={app.id} className="p-5 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{app.student_name}</h4>
                    <p className="text-sm text-slate-500 mt-1">{app.offer_title}</p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Applied: {new Date(app.applied_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Postings Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">📋 Your Internship Postings</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : offers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-slate-500 font-medium">No internships posted yet</p>
            <p className="text-slate-400 text-sm mt-1">Click "Post Internship" to get started!</p>
          </Card>
        ) : (
          <Table columns={postingColumns} data={postingData} />
        )}
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Separate skills with commas</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
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
              {submitting ? 'Posting...' : 'Post Internship'}
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
          {/* نفس محتوى الفورم السابق */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Position Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Separate skills with commas</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Placeholder for other company pages
export function CompanyPlaceholder({ title }) {
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