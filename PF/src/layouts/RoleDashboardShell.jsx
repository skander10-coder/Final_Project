import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { studentNavItems, companyNavItems, adminNavItems } from '../data/mockData.jsx';

const ROLE_CONFIG = {
  student: { navItems: studentNavItems, searchPlaceholder: 'Search internships...' },
  company: { navItems: companyNavItems, searchPlaceholder: 'Search candidates...' },
  admin: { navItems: adminNavItems, searchPlaceholder: 'Search companies or students...' },
};

function readUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function RoleDashboardShell({ children }) {
  const [user, setUser] = useState(readUser);

  useEffect(() => {
    const onStorage = () => setUser(readUser());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const config = user?.role ? ROLE_CONFIG[user.role] : null;

  if (!user?.role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!config) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout navItems={config.navItems} searchPlaceholder={config.searchPlaceholder}>
      {children}
    </DashboardLayout>
  );
}
