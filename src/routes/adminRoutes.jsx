import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

// ⭐ LAZY: Heavy admin components (updated to staff-portal paths)
const AdminPanelPage = React.lazy(() => import('@/pages/staff-portal/AdminPanelPage.jsx'));
const SettingsPage = React.lazy(() => import('@/pages/staff-portal/Settings.jsx'));
const StaffHomepage = React.lazy(() => import('@/pages/staff-portal/Homepage.jsx'));
const Classes = React.lazy(() => import('@/pages/staff-portal/Classes.jsx'));

const ReportsPage = React.lazy(() => import('@/pages/staff-portal/Reports.jsx'));
const SchedulePage = React.lazy(() => import('@/pages/staff-portal/Schedule.jsx'));
const MembershipsPage = React.lazy(() => import('@/pages/staff-portal/Memberships.jsx'));
const TrainersPage = React.lazy(() => import('@/pages/staff-portal/Trainers.jsx'));
const SuperAdminPanel = React.lazy(() => import('@/pages/staff-portal/SuperAdminPanel.jsx'));

// ⭐ LOADING: Enhanced loading for admin pages
const AdminPageLoadingSpinner = () => (
  <div className="min-h-[500px] flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto"></div>
      <p className="mt-3 text-sm text-gray-700 font-medium">Loading admin panel...</p>
      <p className="mt-1 text-xs text-gray-500">This may take a moment</p>
    </div>
  </div>
);

// ⭐ WRAPPER: Admin lazy wrapper with enhanced loading
const AdminLazyWrapper = ({ Component }) => (
  <Suspense fallback={<AdminPageLoadingSpinner />}>
    <Component />
  </Suspense>
);

export const adminRoutes = [
  {
    path: 'dashboard',
    element: <AdminLazyWrapper Component={AdminPanelPage} />,
    title: 'Admin Dashboard',
    description: 'Administrative dashboard with system-wide controls',
    lazy: true,
    heavy: true // Admin panel is heavy
  },
  {
    path: 'settings',    element: <AdminLazyWrapper Component={SettingsPage} />,
    title: 'System Settings',
    description: 'Configure application settings and preferences',
    lazy: true,
    heavy: true // Settings page can be complex
  },
  {
    path: 'adminpanel',
    element: <AdminLazyWrapper Component={SuperAdminPanel} />,
    title: 'Super Admin Panel',
    description: 'Master administrative control panel with backend settings',
    lazy: true,
    heavy: true // Admin panel with permissions is heavy
  },
  {
    path: 'classes',
    element: <AdminLazyWrapper Component={Classes} />,
    title: 'Class Management',
    description: 'Advanced class management with admin privileges',
    lazy: true
  },

  { 
    path: 'reports', 
    element: <AdminLazyWrapper Component={ReportsPage} />,
    title: 'Analytics & Reports',
    description: 'Comprehensive reports and business analytics',
    lazy: true,
    heavy: true // Reports with charts are heavy
  },
  { 
    path: 'schedule', 
    element: <AdminLazyWrapper Component={SchedulePage} />,
    title: 'Schedule Management',
    description: 'Advanced schedule management',
    lazy: true
  },
  { 
    path: 'memberships', 
    element: <AdminLazyWrapper Component={MembershipsPage} />,
    title: 'Membership Administration',
    description: 'Advanced membership plan management',
    lazy: true
  },
  { 
    path: 'trainers', 
    element: <AdminLazyWrapper Component={TrainersPage} />,
    title: 'Trainer Administration',
    description: 'Full trainer management with admin controls',
    lazy: true
  },
  {
    path: '',
    element: <Navigate to="/admin/dashboard" replace />,
    title: 'Redirect',
    description: 'Redirect to admin dashboard'
  },
  {
    path: '*',
    element: <Navigate to="/admin/dashboard" replace />,
    title: 'Redirect',
    description: 'Redirect to admin dashboard'
  }
];

export default adminRoutes;

