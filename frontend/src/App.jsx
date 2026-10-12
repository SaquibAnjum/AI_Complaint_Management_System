import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
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

/*
 * ThemeRouteSync
 *
 * Public pages such as Login and Signup are always Light Mode.
 * Authenticated application pages use the user's saved theme preference.
 *
 * IMPORTANT:
 * - Does not modify backend
 * - Does not modify authentication
 * - Does not remove saved theme preference
 * - Existing Dashboard Light/Dark Mode remains available
 */
const ThemeRouteSync = () => {
  const location = useLocation();
  const { isDark } = useTheme();

  useEffect(() => {
    const publicPaths = [
      '/login',
      '/signup',
      '/register',
      '/join',
      '/unauthorized',
    ];

    const isPublicPage =
      publicPaths.includes(location.pathname) ||
      location.pathname.startsWith('/join/');

    const shouldUseDarkMode = !isPublicPage && isDark;

    document.documentElement.classList.toggle(
      'dark',
      shouldUseDarkMode
    );

    document.body.classList.toggle(
      'dark-mode',
      shouldUseDarkMode
    );

    return () => {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    };
  }, [location.pathname, isDark]);

  return null;
};

// Root Layout Shell for Authenticated Pages
const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content-wrapper">
        <Navbar />

        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

// Role-aware root redirector
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/user/dashboard" replace />;
};

// Organization join redirect
const JoinRedirect = () => {
  const { orgSlug } = useParams();

  return (
    <Navigate
      to={
        orgSlug
          ? `/signup?org=${encodeURIComponent(orgSlug)}`
          : '/signup?org=lookup'
      }
      replace
    />
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* Controls theme according to the current route */}
      <ThemeRouteSync />

      <AuthProvider>
        <ToastProvider>
          <Routes>

            {/* =========================================================
                ROOT ROUTE
            ========================================================= */}
            <Route
              path="/"
              element={<RootRedirect />}
            />

            {/* =========================================================
                PUBLIC AUTH ROUTES
                These pages are always Light Mode.
            ========================================================= */}

            {/* Login */}
            <Route
              path="/login"
              element={<Login />}
            />

            {/* Organization creation / User registration */}
            <Route
              path="/signup"
              element={<Signup />}
            />

            {/* Legacy register route */}
            <Route
              path="/register"
              element={
                <Navigate
                  to="/signup"
                  replace
                />
              }
            />

            {/* User join route */}
            <Route
              path="/join"
              element={
                <Navigate
                  to="/signup?org=lookup"
                  replace
                />
              }
            />

            {/* Organization-specific join route */}
            <Route
              path="/join/:orgSlug"
              element={<JoinRedirect />}
            />

            {/* Unauthorized */}
            <Route
              path="/unauthorized"
              element={<Unauthorized />}
            />

            {/* =========================================================
                USER ROUTES
            ========================================================= */}

            <Route
              path="/user/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['USER']}>
                    <AppLayout>
                      <Routes>

                        {/* /user */}
                        <Route
                          index
                          element={<UserDashboard />}
                        />

                        {/* /user/dashboard */}
                        <Route
                          path="dashboard"
                          element={<UserDashboard />}
                        />

                        {/* /user/submit */}
                        <Route
                          path="submit"
                          element={<SubmitComplaint />}
                        />

                        {/* /user/complaints */}
                        <Route
                          path="complaints"
                          element={<MyComplaints />}
                        />

                        {/* /user/complaints/:id */}
                        <Route
                          path="complaints/:id"
                          element={<ComplaintDetails />}
                        />

                        {/* Unknown user route */}
                        <Route
                          path="*"
                          element={
                            <Navigate
                              to="/user/dashboard"
                              replace
                            />
                          }
                        />

                      </Routes>
                    </AppLayout>
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* =========================================================
                ADMIN ROUTES
            ========================================================= */}

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <AppLayout>
                      <Routes>

                        {/* /admin/dashboard */}
                        <Route
                          path="dashboard"
                          element={<AdminDashboard />}
                        />

                        {/* /admin/complaints */}
                        <Route
                          path="complaints"
                          element={<ManageComplaints />}
                        />

                        {/* /admin/complaints/:id */}
                        <Route
                          path="complaints/:id"
                          element={<ComplaintReview />}
                        />

                        {/* /admin/users */}
                        <Route
                          path="users"
                          element={<ManageUsers />}
                        />

                        {/* Unknown admin route */}
                        <Route
                          path="*"
                          element={
                            <Navigate
                              to="/admin/dashboard"
                              replace
                            />
                          }
                        />

                      </Routes>
                    </AppLayout>
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            {/* =========================================================
                FALLBACK
            ========================================================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;