import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Public Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import SubmitComplaint from './pages/user/SubmitComplaint';
import MyComplaints from './pages/user/MyComplaints';
import ComplaintDetails from './pages/user/ComplaintDetails';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageComplaints from './pages/admin/ManageComplaints';
import ComplaintReview from './pages/admin/ComplaintReview';
import ManageUsers from './pages/admin/ManageUsers';

// Root Layout Shell for Authenticated Pages
const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-wrapper">
        <Navbar />
        <main>{children}</main>
      </div>
    </div>
  );
};

// Role-aware root redirector
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
};

const JoinRedirect = () => {
  const { orgSlug } = useParams();
  return <Navigate to={orgSlug ? `/signup?org=${encodeURIComponent(orgSlug)}` : '/signup?org=lookup'} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Root Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* ── Public Auth Routes ──────────────────────────────────────── */}
            {/* Unified login page */}
            <Route path="/login" element={<Login />} />

            {/* Organization creation & user registration */}
            <Route path="/signup" element={<Signup />} />

            {/* Legacy /register redirect → /signup */}
            <Route path="/register" element={<Navigate to="/signup" replace />} />

            {/* User join redirect → /signup?org=... */}
            <Route path="/join" element={<Navigate to="/signup?org=lookup" replace />} />
            <Route path="/join/:orgSlug" element={<JoinRedirect />} />

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ── User Routes ─────────────────────────────────────────────── */}
            <Route
              path="/user/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['USER']}>
                    <AppLayout>
                      <Routes>
                        <Route index element={<UserDashboard />} />
                        <Route path="dashboard" element={<UserDashboard />} />
                        <Route path="submit" element={<SubmitComplaint />} />
                        <Route path="complaints" element={<MyComplaints />} />
                        <Route path="complaints/:id" element={<ComplaintDetails />} />
                        <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
                      </Routes>
                    </AppLayout>
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* ── Admin Routes ─────────────────────────────────────────────── */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="complaints" element={<ManageComplaints />} />
                        <Route path="complaints/:id" element={<ComplaintReview />} />
                        <Route path="users" element={<ManageUsers />} />
                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                      </Routes>
                    </AppLayout>
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
