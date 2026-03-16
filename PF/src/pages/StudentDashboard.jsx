import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { recentInternships, studentApplications } from '../data/mockData.jsx';

export function StudentDashboardHome() {
  const progressCards = [
    { label: 'Active Applications', count: '3/10', icon: '📋' },
    { label: 'Saved Internships', count: '8', icon: '🔖' },
    { label: 'Interviews Scheduled', count: '1', icon: '📅' },
  ];

  const applicationColumns = [
    { key: 'company', label: 'Company' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <Card variant="hero" className="p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Find Your Next Opportunity</h2>
            <p className="text-indigo-100 opacity-90">
              Discover internships tailored to your skills and career goals.
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors inline-flex items-center gap-2 shrink-0">
            Browse Internships
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </Card>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {progressCards.map((card) => (
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

      {/* Recent Internships */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Recommended Internships</h3>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">See all</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentInternships.map((internship) => (
            <Card key={internship.id} className="p-6 hover:shadow-md transition-shadow">
              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 mb-3">
                {internship.category}
              </span>
              <h4 className="font-semibold text-slate-900 mb-2">{internship.title}</h4>
              <p className="text-sm text-slate-600 mb-4">{internship.company}</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                  {internship.company.charAt(0)}
                </div>
                <span className="text-xs text-slate-500">{internship.company}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">My Applications</h3>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">See all</button>
        </div>
        <Table columns={applicationColumns} data={studentApplications} />
      </div>
    </div>
  );
}

export function StudentPlaceholder({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-slate-500">{title} (skeleton)</p>
    </div>
  );
}
