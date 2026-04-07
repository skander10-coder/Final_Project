import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import NotificationsPage from './Notifications';
import { studentNavItems, companyNavItems, adminNavItems } from '../data/mockData';

export default function NotificationsWrapper() {
  const [user, setUser] = useState(null);
  const [navItems, setNavItems] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      
      if (parsed.role === 'student') setNavItems(studentNavItems);
      else if (parsed.role === 'company') setNavItems(companyNavItems);
      else if (parsed.role === 'admin') setNavItems(adminNavItems);
    }
  }, []);

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar navItems={navItems} />
      <div className="min-h-screen flex flex-col" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <Header searchPlaceholder="Search notifications..." user={user} />
        <main className="flex-1 p-8 overflow-auto">
          <NotificationsPage />
        </main>
      </div>
    </div>
  );
}