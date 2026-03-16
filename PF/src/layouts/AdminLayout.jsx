import DashboardLayout from '../components/layout/DashboardLayout';
import { adminNavItems } from '../data/mockData.jsx';

export default function AdminLayout() {
  return (
    <DashboardLayout
      navItems={adminNavItems}
      searchPlaceholder="Search companies or students..."
    />
  );
}
