import DashboardLayout from '../components/layout/DashboardLayout';
import { studentNavItems } from '../data/mockData.jsx';

export default function StudentLayout() {
  return (
    <DashboardLayout
      navItems={studentNavItems}
      searchPlaceholder="Search internships..."
    />
  );
}
