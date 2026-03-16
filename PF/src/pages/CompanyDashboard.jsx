import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { companyPostings } from '../data/mockData.jsx';

export function CompanyDashboardHome() {
  const statCards = [
    { label: 'Active Postings', count: '2', icon: '📝' },
    { label: 'Total Applicants', count: '36', icon: '👥' },
    { label: 'Interviews Pending', count: '5', icon: '📅' },
  ];

  const postingColumns = [
    { key: 'title', label: 'Position' },
    { key: 'applicants', label: 'Applicants' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Posted' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Card */}
      <Card variant="hero" className="p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Attract Top Talent</h2>
            <p className="text-indigo-100 opacity-90">
              Post internships and connect with qualified candidates for your team.
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors inline-flex items-center gap-2 shrink-0">
            Post Internship
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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

      {/* Recent Applicants Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Recent Applicants</h3>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">See all</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Sarah M.', 'James K.', 'Emma L.'].map((name, i) => (
            <Card key={i} className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600">
                {name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-slate-900">{name}</p>
                <p className="text-sm text-slate-500">Software Intern applicant</p>
              </div>
              <button className="ml-auto text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Postings Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Active Postings</h3>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">See all</button>
        </div>
        <Table columns={postingColumns} data={companyPostings} />
      </div>
    </div>
  );
}

export function CompanyPlaceholder({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-slate-500">{title} (skeleton)</p>
    </div>
  );
}
