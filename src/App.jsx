// 🚨 DO NOT MODIFY WITHOUT REVIEW - Login flow and layout is stable
import { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster.jsx';
import { NotificationProvider } from '@/contexts/NotificationContext.jsx';
import { getDefaultRoute } from '@/helpers/routingHelper';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { PageErrorBoundary } from '@/shared/components/ErrorBoundary';
import { PageLoading, SuspenseFallback } from '@/shared/components/LoadingStates';
import { createLogger } from '@/lib/logger';

// ⭐ NEW: Mobile enhancements
import MobileBottomNavigation from '@/components/mobile/MobileBottomNavigation';
import PWAInstallPrompt from '@/components/mobile/PWAInstallPrompt';

// Create logger for App component
const logger = createLogger('App');

// Import components directly for now (will convert to lazy loading later)
import Login from '@/pages/Login.jsx';
import Signup from '@/pages/Signup.jsx';
import NotFound from '@/pages/NotFound.jsx';

import JoinOnline from '@/pages/joinOnline.jsx';
import JoinOnlineCustomize from '@/pages/joinOnlineCustomize.jsx';
import JoinOnlineCheckout from '@/pages/JoinOnlineCheckout.jsx';

import Profile from '@/pages/Profile.jsx';
import NonmemberPrompt from '@/pages/NonmemberPrompt.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import SettingsPage from '@/pages/staff/Settings.jsx';
import StaffDashboardLayout from '@/layouts/StaffDashboardLayout';
import MemberDashboardLayout from '@/layouts/MemberDashboardLayout';

// Routes configuration
import { staffRoutes, adminRoutes, memberRoutes } from '@/routes';

// Import the proper PublicRoute component
import PublicRoute from '@/components/PublicRoute.jsx';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, authReady } = useAuth();
  const location = useLocation();
  
  if (loading || !authReady) {
    return <SuspenseFallback message="Checking authentication..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

function App() {
  const { user, loading, authReady, logout } = useAuth();
  const [emergencyLoadingTimeout, setEmergencyLoadingTimeout] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      logger.info('✅ Logout successful');
    } catch (error) {
      logger.error('❌ Logout error:', error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !authReady) {
        logger.warn('⚠️ App emergency timeout: Loading too long, showing content anyway');
        setEmergencyLoadingTimeout(true);
      }
    }, 5000); // Reduced from 10 seconds to 5 seconds

    return () => clearTimeout(timeout);
  }, [loading, authReady]);

  logger.debug('🔍 App render state:', {
    loading,
    authReady,
    user: user?.email || null,
    userRole: user?.role || null,
    pathname: location.pathname,
    emergencyTimeout: emergencyLoadingTimeout
  });

  // Show loading screen during auth initialization
  if ((loading || !authReady) && !emergencyLoadingTimeout) {
    logger.debug('⏳ App showing loading screen...');
    return <PageLoading message="Initializing application..." />;
  }

  // Show error if auth failed to initialize
  if (!authReady && emergencyLoadingTimeout) {
    return <PageLoading message="Authentication timeout. Please refresh the page." />;
  }

  logger.info('✅ App loading complete, rendering main app...');

  return (
    <PageErrorBoundary>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50">

          <Suspense fallback={<SuspenseFallback />}>
            <Routes>
              {/* ===== PUBLIC ROUTES ===== */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <PublicRoute>
                    <Signup />
                  </PublicRoute>
                } 
              />
              <Route
                path="/join-online"
                element={<JoinOnline />}
              />
              <Route
                path="/join-online/customize"
                element={<JoinOnlineCustomize />}
              />
              <Route
                path="/join-online/checkout"
                element={<JoinOnlineCheckout />}
              />
              <Route
                path="/profile"
                element={<Profile />}
              />


              <Route 
                path="/nonmember-prompt" 
                element={<NonmemberPrompt />} 
              />

              {/* ===== NONMEMBER DASHBOARD ===== */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute allowedRoles={['nonmember']}>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              {/* ===== STAFF ROUTES ===== */}
              <Route 
                path="/staff/*" 
                element={
                  <PrivateRoute allowedRoles={['staff', 'admin']}>
                    <StaffDashboardLayout onLogout={handleLogout}>
                      <Routes>
                        {staffRoutes.map((route, index) => (
                          <Route
                            key={index}
                            path={route.path}
                            element={route.element}
                          />
                        ))}
                      </Routes>
                    </StaffDashboardLayout>
                  </PrivateRoute>
                } 
              />

              {/* ===== ADMIN ROUTES ===== */}
              <Route 
                path="/admin/*" 
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <StaffDashboardLayout onLogout={handleLogout}>
                      <Routes>
                        {adminRoutes.map((route, index) => (
                          <Route
                            key={index}
                            path={route.path}
                            element={route.element}
                          />
                        ))}
                      </Routes>
                    </StaffDashboardLayout>
                  </PrivateRoute>
                } 
              />

              {/* ===== MEMBER ROUTES ===== */}
              <Route
                path="/member-portal/*"
                element={
                  <PrivateRoute allowedRoles={['member', 'staff', 'admin']}>
                    <MemberDashboardLayout>
                      <Routes>
                        {memberRoutes.map((route, index) => (
                          <Route
                            key={index}
                            path={route.path}
                            element={route.element}
                          />
                        ))}
                      </Routes>
                    </MemberDashboardLayout>
                  </PrivateRoute>
                }
              />

              {/* ===== TEST MEMBER ROUTE ===== */}
              <Route
                path="/member-portal/test"
                element={
                  <PrivateRoute allowedRoles={['member', 'staff', 'admin']}>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">Test Member Route</h1>
                      <p>If you see this, member routing is working!</p>
                      <p>User: {user?.email}</p>
                      <p>Role: {user?.role}</p>
                    </div>
                  </PrivateRoute>
                }
              />

              {/* ===== ROOT ROUTE ===== */}
              <Route
                path="/"
                element={
                  authReady ? (
                    user ? (
                      <Navigate to={getDefaultRoute(user)} replace />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  ) : (
                    <SuspenseFallback message="Loading..." />
                  )
                }
              />

              {/* ===== SETTINGS ROUTE ALIAS ===== */}
              <Route 
                path="/settings" 
                element={
                  <PrivateRoute allowedRoles={['staff', 'admin']}>
                    <StaffDashboardLayout onLogout={handleLogout}>
                      <SettingsPage />
                    </StaffDashboardLayout>
                  </PrivateRoute>
                } 
              />

              {/* ===== 404 CATCH-ALL ===== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {/* ⭐ NEW: Mobile enhancements */}
          <MobileBottomNavigation />
          <PWAInstallPrompt />

          <Toaster />
        </div>
      </NotificationProvider>
    </PageErrorBoundary>
  );
}

export default App;
