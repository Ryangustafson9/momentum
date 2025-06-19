// 🚨 DO NOT MODIFY WITHOUT REVIEW - Login flow and layout is stable
import { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import PrivateRoute from '@/components/PrivateRoute'; // ✅ FIXED: This file exists
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'; // ✅ FIXED: Correct path

// Import pages
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';

// Member pages - ✅ FIXED: Updated to correct paths
import MemberDashboard from '@/pages/member-portal/MemberDashboard';
import MemberProfilePage from '@/pages/member-portal/MemberProfilePage';

// Staff pages - Updated to correct staff-portal paths
import StaffDashboard from '@/pages/staff-portal/Dashboard';
import Members from '@/pages/staff-portal/Members';
import Classes from '@/pages/staff-portal/Classes';
import CheckIn from '@/pages/staff-portal/CheckIn';
import Memberships from '@/pages/staff-portal/Memberships';
import StaffMemberProfile from '@/pages/staff-portal/MemberProfile';
import MemberRegistration from '@/pages/staff-portal/MemberRegistration';

// Admin pages
import AdminPanelPage from '@/pages/staff-portal/AdminPanelPage';
import SuperAdminPanel from '@/pages/staff-portal/SuperAdminPanel';
import StaffRolesPermissionsPage from '@/pages/staff-portal/StaffRolesPermissionsPage';

// Layout components
import StaffDashboardLayout from '@/layouts/StaffDashboardLayout';

// Public pages
import JoinOnline from '@/pages/joinOnline';
import JoinOnlineCheckout from '@/pages/JoinOnlineCheckout';
import NonmemberPrompt from '@/pages/NonmemberPrompt';

// Mobile components
import MobileBottomNavigation from '@/components/mobile/MobileBottomNavigation';
import PWAInstallPrompt from '@/components/mobile/PWAInstallPrompt';

// Utils
import { normalizeRole } from '@/utils/accessControl';
import { createLogger } from '@/lib/logger';

// Create logger for App component
const logger = createLogger('App');

// Loading fallback component
const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function App() {
  const { user, authReady } = useAuth();
  const [emergencyLoadingTimeout, setEmergencyLoadingTimeout] = useState(false);
  
  // Emergency timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authReady) {
        setEmergencyLoadingTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [authReady]);

  logger.info('🔍 App render:', {
    user: user?.email || 'none',
    role: user?.role || 'none',
    authReady
  });

  // Show loading during auth initialization
  if (!authReady && !emergencyLoadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  // Show error if auth failed to initialize
  if (!authReady && emergencyLoadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-sm text-muted-foreground">Authentication timeout. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  logger.info('✅ App loading complete, rendering main app...');  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="App min-h-screen bg-gray-50">
          <Suspense fallback={<SuspenseFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/join-online" element={<JoinOnline />} />
              <Route path="/join-online/checkout" element={<JoinOnlineCheckout />} />
              <Route path="/nonmember-prompt" element={<NonmemberPrompt />} />
                  {/* Member routes */}
                <Route 
                  path="/member-portal/dashboard" 
                  element={
                    <PrivateRoute allowedRoles={['member', 'staff', 'admin']}>
                      <MemberDashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/member-portal/profile" 
                  element={
                    <PrivateRoute allowedRoles={['member', 'staff', 'admin']}>
                      <MemberProfilePage />
                    </PrivateRoute>
                  } 
                />
                  {/* Legacy member routes - redirect to new paths */}
                <Route 
                  path="/member/dashboard" 
                  element={<Navigate to="/member-portal/dashboard" replace />}
                />
                <Route 
                  path="/member-portal/memberdashboard" 
                  element={<Navigate to="/member-portal/dashboard" replace />}
                />
                <Route 
                  path="/member/profile" 
                  element={<Navigate to="/member-portal/profile" replace />}
                />                  {/* Staff routes */}
                <Route 
                  path="/staff-portal/dashboard" 
                  element={
                    <PrivateRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboardLayout>
                        <StaffDashboard />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/staff-portal/members" 
                  element={
                    <PrivateRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboardLayout>
                        <Members />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/staff-portal/classes" 
                  element={
                    <PrivateRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboardLayout>
                        <Classes />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/staff-portal/checkin" 
                  element={
                    <PrivateRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboardLayout>
                        <CheckIn />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  } 
                />                <Route 
                  path="/staff-portal/memberships" 
                  element={
                    <PrivateRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboardLayout>
                        <Memberships />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/staff-portal/register-member" 
                  element={
                    <PrivateRoute allowedRoles={['staff', 'admin']}>
                      <MemberRegistration />
                    </PrivateRoute>
                  } 
                />
                <Route
                  path="/staff-portal/member/:id"
                  element={
                    <PrivateRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboardLayout>
                        <StaffMemberProfile />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile=:id"
                  element={
                    <PrivateRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboardLayout>
                        <StaffMemberProfile />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  }
                />
                  {/* Admin routes */}
                <Route 
                  path="/admin/panel" 
                  element={
                    <PrivateRoute allowedRoles={['admin']}>
                      <StaffDashboardLayout>
                        <AdminPanelPage />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/admin/super-admin" 
                  element={
                    <PrivateRoute allowedRoles={['admin']}>
                      <StaffDashboardLayout>
                        <SuperAdminPanel />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/admin/roles" 
                  element={
                    <PrivateRoute allowedRoles={['admin']}>
                      <StaffDashboardLayout>
                        <StaffRolesPermissionsPage />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  }                />
                
                {/* Legacy staff routes - redirect to new staff-portal paths */}
                <Route 
                  path="/staff/dashboard" 
                  element={<Navigate to="/staff-portal/dashboard" replace />}
                />
                <Route 
                  path="/staff/staffdashboard" 
                  element={<Navigate to="/staff-portal/dashboard" replace />}
                />
                <Route 
                  path="/staff/members" 
                  element={<Navigate to="/staff-portal/members" replace />}
                />
                <Route 
                  path="/staff/classes" 
                  element={<Navigate to="/staff-portal/classes" replace />}
                />
                <Route 
                  path="/staff/checkin" 
                  element={<Navigate to="/staff-portal/checkin" replace />}
                />
                <Route 
                  path="/staff/memberships" 
                  element={<Navigate to="/staff-portal/memberships" replace />}
                />
                <Route 
                  path="/staff/member/:id" 
                  element={<Navigate to="/staff-portal/member/:id" replace />}
                />
                  {/* Redirects */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/dashboard" element={<Navigate to="/member-portal/dashboard" replace />} />
                  {/* 404 fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>              {/* ⭐ NEW: Mobile enhancements - Temporarily disabled due to hook issues */}
            {/* <MobileBottomNavigation /> */}
            {/* <PWAInstallPrompt /> */}
          </div>
        </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
