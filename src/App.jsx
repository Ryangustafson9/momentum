import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Toaster } from '@/components/ui/toaster.jsx';
import { NotificationProvider } from '@/contexts/NotificationContext.jsx';

// ⭐ ADD: Missing import for normalizeRole
import { normalizeRole } from '@/utils/roleUtils.js';

// UPDATED: Import renamed layouts and components
import StaffDashboardLayout from '@/layouts/StaffDashboardLayout.jsx';
import MemberDashboardLayout from '@/layouts/MemberDashboardLayout.jsx';
import PrivateRoute from '@/components/PrivateRoute.jsx';
import PublicRoute from '@/components/PublicRoute.jsx';

// ⭐ UPDATED: Import from pages/staff instead of pages/admin
import StaffDashboard from '@/pages/staff/StaffDashboard.jsx';
import Classes from '@/pages/staff/Classes.jsx';
import AdminSettingsPage from '@/pages/staff/Settings.jsx';
import StaffMemberProfilePage from '@/pages/staff/StaffMemberProfile.jsx';
import CheckInPage from '@/pages/staff/CheckIn.jsx';
import ReportsPage from '@/pages/staff/Reports.jsx';
import SchedulePage from '@/pages/staff/Schedule.jsx';
import MembershipsPage from '@/pages/staff/Memberships.jsx';
import TrainersPage from '@/pages/staff/Trainers.jsx'; 
import MembersPage from '@/pages/staff/Members.jsx';
import AdminPanelPage from '@/pages/staff/AdminPanelPage.jsx';
import InstructorDashboardPage from '@/pages/staff/InstructorDashboardPage.jsx';

// ⭐ UNCHANGED: Other imports remain the same
import Login from '@/pages/Login.jsx';
import Signup from '@/pages/Signup.jsx';
import MemberDashboardPage from '@/pages/member/MemberDashboard.jsx';
import MemberProfilePage from '@/pages/member/MemberProfilePage.jsx';
import MemberClassesPage from '@/pages/member/MemberClasses.jsx';
import MemberBillingPage from '@/pages/member/MemberBilling.jsx';
import NotFound from '@/pages/NotFound.jsx';
import Welcome from '@/pages/Welcome.jsx';
import JoinOnline from '@/pages/joinOnline.jsx';
import JoinOnlineCheckout from '@/pages/JoinOnlineCheckout.jsx';
import NonmemberPrompt from '@/pages/NonmemberPrompt.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import ResetPassword from '@/pages/ResetPassword.jsx';

// ⭐ OLD: Importing getDefaultRoute from routeUtils
// import { getDefaultRoute } from '@/utils/routeUtils';

// ⭐ NEW: Importing getDefaultRoute from roleUtils
import { getDefaultRoute } from '@/utils/roleUtils.js';

function App() {
  const { user, loading, authReady } = useAuth();
  const [emergencyLoadingTimeout, setEmergencyLoadingTimeout] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !authReady) {
        console.warn('⚠️ App emergency timeout: Loading too long, showing content anyway');
        setEmergencyLoadingTimeout(true);
      }
    }, 10000); // Reduced from 20s to 10s

    return () => clearTimeout(timeout);
  }, [loading, authReady]);

  console.log('🔍 App render state:', { 
    loading, 
    authReady,
    user: user?.email || null, 
    userRole: user?.role || null,
    pathname: location.pathname,
    emergencyTimeout: emergencyLoadingTimeout 
  });

  // ⭐ IMPROVED: Show loading only when truly needed
  if ((loading || !authReady) && !emergencyLoadingTimeout) {
    console.log('⏳ App showing loading screen...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
          <p className="mt-2 text-xs text-gray-400">Connecting to authentication...</p>
        </div>
      </div>
    );
  }

  // Add debug logging to see what's happening with routes
  console.log('✅ App loading complete, rendering main app...');
  console.log('🔍 Current user:', user?.email, 'Role:', user?.role);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
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
            path="/join-online/checkout"
            element={<JoinOnlineCheckout />}
          />
          <Route
            path="/welcome"
            element={
              <PublicRoute>
                <Welcome />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/nonmember-prompt"
            element={<NonmemberPrompt />}
          />

          {/* General Dashboard for Nonmembers */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* ⭐ STAFF ROUTES: Debug what's happening */}
          <Route path="/staff/*" element={
            <PrivateRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboardLayout>
                <Routes>
                  <Route path="staffdashboard" element={<StaffDashboard />} />
                  <Route path="classes" element={<Classes />} />
                  <Route path="members" element={<MembersPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="schedule" element={<SchedulePage />} />
                  <Route path="memberships" element={<MembershipsPage />} />
                  <Route path="trainers" element={<TrainersPage />} />
                  <Route path="checkin" element={<CheckInPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="admin-panel" element={<AdminPanelPage />} />
                  <Route path="profile/:memberId" element={<StaffMemberProfilePage />} />
                  <Route path="instructor-dashboard" element={<InstructorDashboardPage />} />
                  <Route path="*" element={<Navigate to="/staff/staffdashboard" replace />} />
                </Routes>
              </StaffDashboardLayout>
            </PrivateRoute>
          } />

          {/* Admin Routes - Redirect to Staff Dashboard */}
          <Route path="/admin/*" element={<Navigate to="/staff/staffdashboard" replace />} />

          {/* Member Routes */}
          <Route path="/member/*" element={
            <PrivateRoute allowedRoles={['member', 'staff', 'admin']}>
              <MemberDashboardLayout>
                <Routes>
                  <Route path="memberdashboard" element={<MemberDashboardPage />} />
                  <Route path="profile" element={<MemberProfilePage />} />
                  <Route path="classes" element={<MemberClassesPage />} />
                  <Route path="billing" element={<MemberBillingPage />} />
                  <Route path="*" element={<Navigate to="/member/memberdashboard" replace />} />
                </Routes>
              </MemberDashboardLayout>
            </PrivateRoute>
          } />

          {/* ⭐ ROOT ROUTE: Use centralized routing logic */}
          <Route
            path="/"
            element={
              user ? (
                (() => {
                  const role = normalizeRole(user.role || 'member');
                  const defaultRoute = getDefaultRoute(role);
                  console.log('🎯 Root route - User role:', role, '-> Route:', defaultRoute);

                  return <Navigate to={defaultRoute} replace />;
                })()
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Settings Route Alias */}
          <Route 
            path="/settings" 
            element={
              <PrivateRoute allowedRoles={['staff', 'admin']}>
                <StaffDashboardLayout>
                  <AdminSettingsPage />
                </StaffDashboardLayout>
              </PrivateRoute>
            } 
          />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        <Toaster />
      </div>
    </NotificationProvider>
  );
}

export default App;


