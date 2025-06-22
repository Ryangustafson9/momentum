// 🚨 DO NOT MODIFY WITHOUT REVIEW - Login flow and layout is stable
import { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LocationProvider } from '@/contexts/LocationContext';
import PrivateRoute from '@/components/PrivateRoute'; // ✅ FIXED: This file exists
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'; // ✅ FIXED: Correct path
import { JoinOnlineRoute } from '@/components/ClubSettingsRoute.jsx';

// Import pages
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';

// Member pages - ✅ FIXED: Updated to correct paths
import MemberDashboard from '@/pages/member-portal/Dashboard';
import MemberProfilePage from '@/pages/member-portal/MemberProfilePage';
import MemberClassesPage from '@/pages/member-portal/MemberClasses';
import MemberBillingPage from '@/pages/member-portal/MemberBilling';
import AdvancedFeatures from '@/pages/member-portal/AdvancedFeatures';

// Staff pages - Updated to correct staff-portal paths
import StaffDashboard from '@/pages/staff-portal/Dashboard';
// import Members from '@/pages/staff-portal/Members'; // DEACTIVATED: Member search available in navbar
import Classes from '@/pages/staff-portal/Classes';
import CheckIn from '@/pages/staff-portal/CheckIn';
import Memberships from '@/pages/staff-portal/Memberships';
import Schedule from '@/pages/staff-portal/Schedule';
import Attendance from '@/pages/staff-portal/Attendance';
import Billing from '@/pages/staff-portal/Billing';
import Communications from '@/pages/staff-portal/Communications';
import Equipment from '@/pages/staff-portal/Equipment';
import Reports from '@/pages/staff-portal/Reports';
import Settings from '@/pages/staff-portal/Settings';
import Trainers from '@/pages/staff-portal/Trainers';
import PointOfSale from '@/pages/staff-portal/PointOfSale';
import POSManagement from '@/pages/staff-portal/POSManagement';
import StaffMemberProfile from '@/pages/staff-portal/MemberProfile';
import MemberRegistration from '@/pages/staff-portal/MemberRegistration';
import CorporateManagement from '@/pages/staff-portal/CorporateManagement';
import TagManagement from '@/pages/staff-portal/TagManagement';

// Admin pages
import AdminPanelPage from '@/pages/staff-portal/AdminPanelPage';

// Layout components
import StaffDashboardLayout from '@/layouts/StaffDashboardLayout';
import MemberDashboardLayout from '@/layouts/MemberDashboardLayout';

// Public pages
import JoinOnline from '@/pages/joinOnline';
import JoinOnlineCheckout from '@/pages/JoinOnlineCheckout';
import JoinOnlineCustomize from '@/pages/joinOnlineCustomize';
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
  logger.info('✅ App loading complete, rendering main app...');

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <LocationProvider>
          <div className="App min-h-screen bg-gray-50">
            <Suspense fallback={<SuspenseFallback />}>
              <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />              <Route path="/join-online" element={
                <JoinOnlineRoute>
                  <JoinOnline />
                </JoinOnlineRoute>
              } />
              <Route path="/join-online/customize" element={
                <JoinOnlineRoute>
                  <JoinOnlineCustomize />
                </JoinOnlineRoute>
              } />
              <Route path="/join-online/checkout" element={
                <JoinOnlineRoute>
                  <JoinOnlineCheckout />
                </JoinOnlineRoute>
              } />
              <Route path="/nonmember-prompt" element={<NonmemberPrompt />} />                {/* Member routes - using proper nested routing with Outlet */}
                <Route
                  path="/member-portal"
                  element={
                    <PrivateRoute allowedRoles={['member', 'staff', 'admin']}>
                      <MemberDashboardLayout />
                    </PrivateRoute>
                  }
                >                  <Route path="dashboard" element={<MemberDashboard />} />
                  <Route path="profile" element={<MemberProfilePage />} />
                  <Route path="classes" element={<MemberClassesPage />} />
                  <Route path="billing" element={<MemberBillingPage />} />
                  <Route path="advanced" element={<AdvancedFeatures />} />
                  <Route index element={<Navigate to="/member-portal/dashboard" replace />} />
                </Route>                <Route 
                  path="/member-portal/attendance" 
                  element={
                    <PrivateRoute allowedRoles={['member', 'staff', 'admin']}>
                      <MemberClassesPage />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/member-portal/settings" 
                  element={
                    <PrivateRoute allowedRoles={['member', 'staff', 'admin']}>
                      <MemberProfilePage />
                    </PrivateRoute>
                  } 
                />                {/* Legacy member routes - redirect to new paths */}
                <Route 
                  path="/member/dashboard" 
                  element={<Navigate to="/member-portal/dashboard" replace />}
                />
                <Route 
                  path="/member-portal/memberdashboard" 
                  element={<Navigate to="/member-portal/dashboard" replace />}
                />
                <Route 
                  path="/member/memberdashboard" 
                  element={<Navigate to="/member-portal/dashboard" replace />}
                />
                <Route 
                  path="/member/profile" 
                  element={<Navigate to="/member-portal/profile" replace />}
                />
                <Route 
                  path="/member/classes" 
                  element={<Navigate to="/member-portal/classes" replace />}
                />
                <Route 
                  path="/member/billing" 
                  element={<Navigate to="/member-portal/billing" replace />}
                />
                <Route 
                  path="/member/attendance" 
                  element={<Navigate to="/member-portal/attendance" replace />}
                />
                <Route 
                  path="/member/settings" 
                  element={<Navigate to="/member-portal/settings" replace />}
                />{/* Staff routes - using proper nested routing with Outlet */}
                <Route
                  path="/staff-portal"
                  element={
                    <PrivateRoute allowedRoles={['staff', 'admin']}>
                      <StaffDashboardLayout />
                    </PrivateRoute>
                  }
                >                  <Route path="dashboard" element={<StaffDashboard />} />
                  {/* <Route path="members" element={<Members />} /> */} {/* DEACTIVATED: Member search available in navbar */}
                  <Route path="classes" element={<Classes />} />
                  <Route path="checkin" element={<CheckIn />} />
                  <Route path="memberships" element={<Memberships />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="communications" element={<Communications />} />
                  <Route path="equipment" element={<Equipment />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="trainers" element={<Trainers />} />
                  <Route path="pos" element={<PointOfSale />} />
                  <Route path="pos/manage" element={<POSManagement />} />
                  <Route path="member/:id" element={<StaffMemberProfile />} />
                  <Route path="register-member" element={<MemberRegistration />} />
                  <Route path="corporate-management" element={
                    <PrivateRoute allowedRoles={['admin', 'staff']}>
                      <CorporateManagement />
                    </PrivateRoute>
                  } />
                  <Route path="tag-management" element={
                    <PrivateRoute allowedRoles={['admin', 'staff']}>
                      <TagManagement />
                    </PrivateRoute>
                  } />
                  <Route index element={<Navigate to="/staff-portal/dashboard" replace />} />
                </Route>


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
                  path="/admin/adminpanel"
                  element={
                    <PrivateRoute allowedRoles={['admin']}>
                      <StaffDashboardLayout>
                        <AdminPanelPage />
                      </StaffDashboardLayout>
                    </PrivateRoute>
                  }
                />                <Route 
                  path="/admin/super-admin" 
                  element={<Navigate to="/staff-portal/settings/admin-panel" replace />}
                />
                
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
          </LocationProvider>
        </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;

