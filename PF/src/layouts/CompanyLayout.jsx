import DashboardLayout from '../components/layout/DashboardLayout';
import { companyNavItems } from '../data/mockData.jsx';

export default function CompanyLayout() {
  return (
    <DashboardLayout
      navItems={companyNavItems}
      searchPlaceholder="Search candidates..."
    />
  );
}
