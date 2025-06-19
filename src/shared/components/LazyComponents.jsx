import React, { Suspense, lazy } from 'react';
import { SuspenseFallback } from './LoadingStates';
import { ComponentErrorBoundary } from './ErrorBoundary';

/**
 * Higher-order component for lazy loading with error boundary and suspense
 */
export const withLazyLoading = (
  importFn, 
  fallback = <SuspenseFallback />,
  errorFallback = null
) => {
  const LazyComponent = lazy(importFn);
  
  return React.forwardRef((props, ref) => (
    <ComponentErrorBoundary 
      fallback={errorFallback}
      componentName={LazyComponent.displayName || 'LazyComponent'}
    >
      <Suspense fallback={fallback}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </ComponentErrorBoundary>
  ));
};

/**
 * Lazy-loaded page components
 */

// Auth pages
export const LazyLogin = withLazyLoading(
  () => import('@/pages/Login'),
  <SuspenseFallback message="Loading login page..." />
);

export const LazySignup = withLazyLoading(
  () => import('@/pages/Signup'),
  <SuspenseFallback message="Loading signup page..." />
);

// Dashboard pages
export const LazyMemberDashboard = withLazyLoading(
  () => import('@/pages/member/MemberDashboard'),
  <SuspenseFallback message="Loading member dashboard..." />
);

export const LazyStaffDashboard = withLazyLoading(
  () => import('@/pages/staff/StaffDashboard'),
  <SuspenseFallback message="Loading staff dashboard..." />
);

export const LazyDashboard = withLazyLoading(
  () => import('@/pages/Dashboard'),
  <SuspenseFallback message="Loading dashboard..." />
);

// Feature pages
export const LazyMembers = withLazyLoading(
  () => import('@/pages/Members'),
  <SuspenseFallback message="Loading members..." />
);

export const LazyClasses = withLazyLoading(
  () => import('@/pages/Classes'),
  <SuspenseFallback message="Loading classes..." />
);

export const LazyAttendance = withLazyLoading(
  () => import('@/pages/Attendance'),
  <SuspenseFallback message="Loading attendance..." />
);

export const LazySettings = withLazyLoading(
  () => import('@/pages/staff/Settings'),
  <SuspenseFallback message="Loading settings..." />
);

// Other pages
export const LazyWelcome = withLazyLoading(
  () => import('@/pages/Welcome'),
  <SuspenseFallback message="Loading welcome page..." />
);

export const LazyJoinOnline = withLazyLoading(
  () => import('@/pages/joinOnline'),
  <SuspenseFallback message="Loading join page..." />
);

export const LazyNonmemberPrompt = withLazyLoading(
  () => import('@/pages/NonmemberPrompt'),
  <SuspenseFallback message="Loading page..." />
);

export const LazyNotFound = withLazyLoading(
  () => import('@/pages/NotFound'),
  <SuspenseFallback message="Loading page..." />
);

/**
 * Lazy-loaded layout components
 */
export const LazyMemberDashboardLayout = withLazyLoading(
  () => import('@/layouts/MemberDashboardLayout'),
  <SuspenseFallback message="Loading layout..." />
);

export const LazyStaffDashboardLayout = withLazyLoading(
  () => import('@/layouts/StaffDashboardLayout'),
  <SuspenseFallback message="Loading layout..." />
);

/**
 * Preload utility for better UX
 */
export const preloadComponent = (importFn) => {
  const componentImport = importFn();
  return componentImport;
};

/**
 * Preload critical components on app start
 */
export const preloadCriticalComponents = () => {
  // Preload login page since it's likely to be needed
  preloadComponent(() => import('@/pages/Login'));
  
  // Preload dashboard components based on user role
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'member') {
    preloadComponent(() => import('@/pages/member/MemberDashboard'));
  } else if (['staff', 'admin'].includes(userRole)) {
    preloadComponent(() => import('@/pages/staff/StaffDashboard'));
  }
};

/**
 * Route-based preloading hook
 */
export const useRoutePreloading = () => {
  const preloadRoute = React.useCallback((routeName) => {
    const routeMap = {
      'member-dashboard': () => import('@/pages/member/MemberDashboard'),
      'staff-dashboard': () => import('@/pages/staff/StaffDashboard'),
      'members': () => import('@/pages/Members'),
      'classes': () => import('@/pages/Classes'),
      'attendance': () => import('@/pages/Attendance'),
      'settings': () => import('@/pages/staff/Settings'),
    };

    const importFn = routeMap[routeName];
    if (importFn) {
      preloadComponent(importFn);
    }
  }, []);

  return { preloadRoute };
};

/**
 * Component for preloading on hover
 */
export const PreloadOnHover = ({ 
  children, 
  importFn, 
  delay = 100 
}) => {
  const [hasPreloaded, setHasPreloaded] = React.useState(false);

  const handleMouseEnter = React.useCallback(() => {
    if (!hasPreloaded) {
      setTimeout(() => {
        preloadComponent(importFn);
        setHasPreloaded(true);
      }, delay);
    }
  }, [hasPreloaded, importFn, delay]);

  return (
    <div onMouseEnter={handleMouseEnter}>
      {children}
    </div>
  );
};

export default withLazyLoading;
