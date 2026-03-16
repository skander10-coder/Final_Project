import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentLayout from './layouts/StudentLayout';
import CompanyLayout from './layouts/CompanyLayout';
import AdminLayout from './layouts/AdminLayout';
import { StudentDashboardHome, StudentPlaceholder } from './pages/StudentDashboard';
import { CompanyDashboardHome, CompanyPlaceholder } from './pages/CompanyDashboard';
import { AdminDashboardHome, AdminPlaceholder } from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute'; // ✅ استيراد الحماية

function App() {
  return (
    <BrowserRouter>
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
          <Route path="applications" element={<StudentPlaceholder title="Applications" />} />
          <Route path="internships" element={<StudentPlaceholder title="Internships" />} />
        </Route>

        {/* Company Dashboard*/}
        <Route path="/company" element={
          <ProtectedRoute allowedRole="company">
            <CompanyLayout />
          </ProtectedRoute>
        }>
          <Route index element={<CompanyDashboardHome />} />
          <Route path="postings" element={<CompanyPlaceholder title="Postings" />} />
          <Route path="candidates" element={<CompanyPlaceholder title="Candidates" />} />
        </Route>

        {/*  Admin Dashboard */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboardHome />} />
          <Route path="companies" element={<AdminPlaceholder title="Companies" />} />
          <Route path="students" element={<AdminPlaceholder title="Students" />} />
        </Route>

        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;