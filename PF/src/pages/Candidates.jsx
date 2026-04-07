
import { useState, useEffect } from 'react';
import { companyAPI } from '../services/api';
import Card from '../components/ui/Card';

export default function Candidates() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">👥 Candidates</h1>
        <p className="text-slate-500 mt-1">Review and manage all internship applications</p>
      </div>

      {/* Stats Buttons */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border transition-all ${filter === 'all' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <p className="text-2xl font-bold text-slate-900">{stats.all}</p>
          <p className="text-sm text-slate-500">All</p>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-xl border transition-all ${filter === 'pending' ? 'border-amber-600 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-sm text-slate-500">⏳ Pending</p>
        </button>
        <button
          onClick={() => setFilter('accepted')}
          className={`p-4 rounded-xl border transition-all ${filter === 'accepted' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <p className="text-2xl font-bold text-emerald-600">{stats.accepted}</p>
          <p className="text-sm text-slate-500">✅ Accepted</p>
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`p-4 rounded-xl border transition-all ${filter === 'rejected' ? 'border-red-600 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-slate-500">❌ Rejected</p>
        </button>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-500 font-medium">No applications found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.map((app) => (
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
              
              {app.status === 'pending' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'accepted')}
                    className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'rejected')}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}