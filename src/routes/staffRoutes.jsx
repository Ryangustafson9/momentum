import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

// ⭐ LAZY: Load heavy components only when needed
const StaffHomepage = React.lazy(() => import('@/pages/staff/StaffHomepage.jsx'));
const Classes = React.lazy(() => import('@/pages/staff/Classes.jsx'));
const MembersPage = React.lazy(() => import('@/pages/staff/Members.jsx'));
const ReportsPage = React.lazy(() => import('@/pages/staff/Reports.jsx'));
const SchedulePage = React.lazy(() => import('@/pages/staff/Schedule.jsx'));
const MembershipsPage = React.lazy(() => import('@/pages/staff/Memberships.jsx'));
const TrainersPage = React.lazy(() => import('@/pages/staff/Trainers.jsx'));
const CheckInPage = React.lazy(() => import('@/pages/staff/CheckIn.jsx'));
const StaffMemberProfilePage = React.lazy(() => import('@/pages/staff/StaffMemberProfile.jsx'));
const InstructorDashboardPage = React.lazy(() => import('@/pages/staff/InstructorDashboardPage.jsx'));
const CommunicationsPage = React.lazy(() => import('@/pages/staff/Communications.jsx'));
const BillingPage = React.lazy(() => import('@/pages/staff/Billing.jsx'));
const EquipmentPage = React.lazy(() => import('@/pages/staff/Equipment.jsx'));

// ⭐ LOADING: Reusable loading component
const PageLoadingSpinner = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-2 text-sm text-gray-600">Loading page...</p>
    </div>
  </div>
);

// ⭐ WRAPPER: Lazy component wrapper with Suspense
const LazyWrapper = ({ Component }) => (
  <Suspense fallback={<PageLoadingSpinner />}>
    <Component />
  </Suspense>
);

export const staffRoutes = [
  {
    path: 'dashboard', // Updated to clean path
    element: <LazyWrapper Component={StaffHomepage} />,
    title: 'Staff Dashboard',
    description: 'Staff homepage with overview and quick actions',
    lazy: true
  },
  {
    path: 'staffdashboard', // Admin-preferred route
    element: <LazyWrapper Component={StaffHomepage} />,
    title: 'Staff Dashboard',
    description: 'Staff homepage with overview and quick actions (admin route)',
    lazy: true
  },
  { 
    path: 'classes', 
    element: <LazyWrapper Component={Classes} />,
    title: 'Class Management',
    description: 'Manage gym classes, schedules, and instructors',
    lazy: true
  },
  { 
    path: 'members', 
    element: <LazyWrapper Component={MembersPage} />,
    title: 'Member Management',
    description: 'View and manage gym members',
    lazy: true
  },
  { 
    path: 'reports', 
    element: <LazyWrapper Component={ReportsPage} />,
    title: 'Reports & Analytics',
    description: 'View gym performance reports and analytics',
    lazy: true,
    heavy: true // Mark as heavy component
  },
  { 
    path: 'schedule', 
    element: <LazyWrapper Component={SchedulePage} />,
    title: 'Class Schedule',
    description: 'Manage class schedules and bookings',
    lazy: true
  },
  {
    path: 'memberships',
    element: <LazyWrapper Component={MembershipsPage} />,
    title: 'Plan Management',
    description: 'Manage membership plans and pricing',
    lazy: true
  },
  { 
    path: 'trainers', 
    element: <LazyWrapper Component={TrainersPage} />,
    title: 'Trainer Management',
    description: 'Manage trainers and their schedules',
    lazy: true
  },
  { 
    path: 'checkin', 
    element: <LazyWrapper Component={CheckInPage} />,
    title: 'Member Check-In',
    description: 'Check-in members and track attendance',
    lazy: true
  },
  { 
    path: 'profile/:memberId', 
    element: <LazyWrapper Component={StaffMemberProfilePage} />,
    title: 'Member Profile',
    description: 'View and edit member profiles',
    lazy: true
  },
  {
    path: 'instructor-dashboard',
    element: <LazyWrapper Component={InstructorDashboardPage} />,
    title: 'Instructor Dashboard',
    description: 'Dashboard for gym instructors',
    lazy: true
  },
  {
    path: 'communications',
    element: <LazyWrapper Component={CommunicationsPage} />,
    title: 'Member Communications',
    description: 'Send emails and manage member communications',
    lazy: true
  },
  {
    path: 'billing',
    element: <LazyWrapper Component={BillingPage} />,
    title: 'Billing Management',
    description: 'Manage payments, transactions, and billing',
    lazy: true
  },
  {
    path: 'equipment',
    element: <LazyWrapper Component={EquipmentPage} />,
    title: 'Equipment Management',
    description: 'Track equipment status and maintenance',
    lazy: true
  },
  { 
    path: '*', 
    element: <Navigate to="/staff/dashboard" replace />, // Updated redirect path
    title: 'Redirect',
    description: 'Redirect to staff dashboard'
  }
];

export default staffRoutes;