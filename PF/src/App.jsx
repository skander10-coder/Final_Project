import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentLayout from './layouts/StudentLayout';
import CompanyLayout from './layouts/CompanyLayout';
import AdminLayout from './layouts/AdminLayout';
import { StudentDashboardHome, StudentApplicationsPage, StudentInternshipsPage, StudentPlaceholder } from './pages/StudentDashboard';
import { CompanyDashboardHome, CompanyPlaceholder } from './pages/CompanyDashboard';
import { AdminDashboardHome, AdminCompaniesPage, AdminStudentsPage } from './pages/AdminDashboard';
import Candidates from './pages/Candidates';
import FillCV from './pages/FillCv';
import NotificationsPage from './pages/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationLayout from './layouts/NotificationLayout';
import NotificationsWrapper from './pages/NotificationsWrapper';
import RoleDashboardShell from './layouts/RoleDashboardShell';
import Profile from './pages/Profile';
import Settings from './pages/Settings';


function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Dashboard */}
          <Route path="/student" element={
            <ProtectedRoute allowedRole="student">
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboardHome />} />
            <Route path="fill-cv" element={<FillCV />} />
            <Route path="applications" element={<StudentApplicationsPage />} />
            <Route path="internships" element={<StudentInternshipsPage />} />
          </Route>

          {/* Company Dashboard */}
          <Route path="/company" element={
            <ProtectedRoute allowedRole="company">
              <CompanyLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CompanyDashboardHome />} />
            <Route path="postings" element={<CompanyPlaceholder title="Postings" />} />
            <Route path="candidates" element={<Candidates />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboardHome />} />
            <Route path="companies" element={<AdminCompaniesPage />} />
            <Route path="students" element={<AdminStudentsPage />} />
          </Route>

          {/* 🔥 Notifications Page - مع Layout ديناميكي */}


          

          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsWrapper />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <RoleDashboardShell>
                <Profile />
              </RoleDashboardShell>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <RoleDashboardShell>
                <Settings />
              </RoleDashboardShell>
            </ProtectedRoute>
          } />


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;