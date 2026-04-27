import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react'; 
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ navItems, searchPlaceholder, children }) {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar navItems={navItems} />
      <div
        className="min-h-screen flex flex-col"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <Header 
          searchPlaceholder={searchPlaceholder}
          user={user}
          onSearch={setSearchTerm}
        />
        <main className="flex-1 p-8 overflow-auto">
          {children ?? <Outlet context={{ searchTerm }} />}
        </main>
      </div>
    </div>
  );
}