import { useState, useEffect } from 'react';

export default function NotificationLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // عرض بسيط بدون Sidebar/Header
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-indigo-600 text-white p-4">
        <h1>Notifications - {user.role}</h1>
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}