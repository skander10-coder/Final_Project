import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { adminStats } from '../data/mockData.jsx';

export function AdminDashboardHome() {
  const statCards = [
    { label: 'Total Companies', count: adminStats.totalCompanies, icon: '🏢' },
    { label: 'Total Students', count: adminStats.totalStudents.toLocaleString(), icon: '👥' },
    { label: 'Pending Verifications', count: adminStats.pendingVerifications, icon: '⏳' },
  ];

  const recentActivity = [
    { company: 'NewTech Inc.', action: 'Registration Pending', date: 'Feb 6, 2025' },
    { company: 'Design Co.', action: 'Verified', date: 'Feb 5, 2025' },
    { company: 'Data Labs', action: 'Registration Pending', date: 'Feb 5, 2025' },
  ];

  const activityColumns = [
    { key: 'company', label: 'Organization' },
    { key: 'action', label: 'Action' },
    { key: 'date', label: 'Date' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <Card variant="hero" className="p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Platform Overview</h2>
            <p className="text-indigo-100 opacity-90">
              Monitor and manage the Stag.io internship platform.
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors inline-flex items-center gap-2 shrink-0">
            View Verifications
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} variant="elevated" className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-xl">
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

      {/* Progress Chart Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Platform Activity</h3>
        <div className="h-48 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-slate-500 text-sm">Chart placeholder (1–10 Feb, 11–20 Feb, 21–30 Feb)</p>
        </div>
      </Card>

      {/* Recent Activity Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">See all</button>
        </div>
        <Table columns={activityColumns} data={recentActivity} />
      </div>
    </div>
  );
}

export function AdminPlaceholder({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-slate-500">{title} (skeleton)</p>
    </div>
  );
}
