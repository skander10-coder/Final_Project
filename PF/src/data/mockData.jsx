// Mock data for dashboards - no API calls, static only

const DashboardIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ApplicationsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const InternshipsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const BuildingIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const StudentIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
  </svg>
);

export const studentNavItems = [
  { path: '/student', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/student/applications', label: 'Applications', icon: <ApplicationsIcon /> },
  { path: '/student/internships', label: 'Internships', icon: <InternshipsIcon /> },
];

export const companyNavItems = [
  { path: '/company', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/company/postings', label: 'Postings', icon: <PlusIcon /> },
  { path: '/company/candidates', label: 'Candidates', icon: <UsersIcon /> },
];

export const adminNavItems = [
  { path: '/admin', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/admin/companies', label: 'Companies', icon: <BuildingIcon /> },
  { path: '/admin/students', label: 'Students', icon: <StudentIcon /> },
];

export const recentInternships = [
  { id: 1, title: 'Software Development Intern', company: 'TechCorp', category: 'ENGINEERING', status: 'Open' },
  { id: 2, title: 'Marketing Intern', company: 'Growth Labs', category: 'MARKETING', status: 'Open' },
  { id: 3, title: 'Product Design Intern', company: 'Design Studio', category: 'DESIGN', status: 'Closed' },
];

export const studentApplications = [
  { company: 'TechCorp', type: 'Software Intern', status: 'Under Review', date: 'Feb 5, 2025' },
  { company: 'Growth Labs', type: 'Marketing Intern', status: 'Interview Scheduled', date: 'Feb 3, 2025' },
  { company: 'Design Studio', type: 'Product Design', status: 'Applied', date: 'Feb 1, 2025' },
];

export const companyPostings = [
  { title: 'Software Development Intern', applicants: 24, status: 'Active', date: 'Feb 1, 2025' },
  { title: 'Data Analytics Intern', applicants: 12, status: 'Active', date: 'Jan 28, 2025' },
  { title: 'UI/UX Design Intern', applicants: 8, status: 'Closed', date: 'Jan 15, 2025' },
];

export const adminStats = {
  totalCompanies: 156,
  totalStudents: 2847,
  pendingVerifications: 12,
};
