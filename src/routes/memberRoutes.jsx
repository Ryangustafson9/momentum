import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';

// ⭐ DIRECT: Member components (updated folder structure)
import MemberDashboard from '@/pages/member-portal/MemberDashboard.jsx';
import MemberProfilePage from '@/pages/member-portal/MemberProfilePage.jsx';
import MemberClassesPage from '@/pages/member-portal/MemberClasses.jsx';
import MemberBillingPage from '@/pages/member-portal/MemberBilling.jsx';
import AdvancedFeatures from '@/pages/member-portal/AdvancedFeatures.jsx';

// ⭐ LOADING: Member-specific loading
const MemberPageLoadingSpinner = () => (
  <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-2 text-sm text-blue-700 font-medium">Loading your dashboard...</p>
    </div>
  </div>
);

// ⭐ WRAPPER: Member lazy wrapper
const MemberLazyWrapper = ({ Component }) => (
  <Suspense fallback={<MemberPageLoadingSpinner />}>
    <Component />
  </Suspense>
);

export const memberRoutes = [
  {
    path: 'memberdashboard',
    element: <MemberDashboard />,
    title: 'Member Dashboard',
    description: 'Member dashboard with personal overview and quick actions',
    lazy: false,
    heavy: true // Dashboard can have charts and data
  },
  {
    path: 'profile',
    element: <MemberProfilePage />,
    title: 'My Profile',
    description: 'View and edit personal profile information',
    lazy: false
  },
  {
    path: 'classes',
    element: <MemberClassesPage />,
    title: 'My Classes',
    description: 'View and manage class bookings',
    lazy: false
  },
  {
    path: 'billing',
    element: <MemberBillingPage />,
    title: 'Billing & Payments',
    description: 'Manage membership billing and payment methods',
    lazy: false
  },
  {
    path: 'advanced',
    element: <AdvancedFeatures />,
    title: 'Advanced Features',
    description: 'Premium member features including photo upload, workout tracking, and more',
    lazy: false,
    heavy: true // Contains multiple feature components
  },
  {
    path: '*',
    element: <Navigate to="/member-portal/memberdashboard" replace />,
    title: 'Redirect',
    description: 'Redirect to member dashboard'
  }
];

export default memberRoutes;