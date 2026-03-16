import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ navItems, searchPlaceholder }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar navItems={navItems} />
      <div
        className="min-h-screen flex flex-col"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <Header searchPlaceholder={searchPlaceholder} />
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
