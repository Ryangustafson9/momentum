import { normalizeRole } from '@/utils/roleUtils.js';

/**
 * Get the appropriate dashboard route based on user role
 * @param {Object} user - User object with role property
 * @returns {string} - Dashboard route path
 */
export const getDashboardRoute = (user) => {
  if (!user || !user.role) {
    console.warn('⚠️ getDashboardRoute: No user or role provided');
    return '/login';
  }

  const role = normalizeRole(user.role);
    switch (role) {
    case 'admin':
      console.log('🔍 Routing admin to /staff/dashboard');
      return '/staff/dashboard';
    case 'staff':
      console.log('🔍 Routing staff to /staff/dashboard');
      return '/staff/dashboard';
    case 'member':
      console.log('🔍 Routing member to /member-portal/memberdashboard');
      return '/member-portal/memberdashboard';
    case 'nonmember':
      console.log('🔍 Routing nonmember to /dashboard');
      return '/dashboard';
    default:
      console.warn('⚠️ getDashboardRoute: Unknown role:', role);
      return '/dashboard'; // Default fallback for unknown roles
  }
};

/**
 * Get default route - alias for getDashboardRoute for backwards compatibility
 * @param {Object} user - User object with role property
 * @returns {string} - Default route path
 */
export const getDefaultRoute = (user) => {
  return getDashboardRoute(user);
};

/**
 * Get all allowed routes for a specific role
 * @param {string} role - User role
 * @returns {Array} - Array of allowed route patterns
 */
export const getAllowedRoutes = (role) => {
  const normalizedRole = normalizeRole(role);
  
  const routeMap = {
    admin: [
      '/admin/*',
      '/staff/*', // Admin can access staff routes
      '/member/*', // Admin can access member routes
    ],
    staff: [
      '/staff/*',
      '/member/profile/*', // Staff can view member profiles
    ],
    member: [
      '/member/*',
    ],
  };

  return routeMap[normalizedRole] || [];
};

/**
 * Check if user has access to a specific route
 * @param {Object} user - User object
 * @param {string} route - Route to check
 * @returns {boolean} - Whether user has access
 */
export const hasRouteAccess = (user, route) => {
  if (!user || !user.role) return false;
  
  const allowedRoutes = getAllowedRoutes(user.role);
  
  return allowedRoutes.some(allowedRoute => {
    if (allowedRoute.endsWith('/*')) {
      const basePath = allowedRoute.slice(0, -2);
      return route.startsWith(basePath);
    }
    return route === allowedRoute;
  });
};

/**
 * Redirect user to appropriate page based on their role and current route
 * @param {Object} user - User object
 * @param {string} currentRoute - Current route user is trying to access
 * @returns {string} - Route to redirect to
 */
export const getRedirectRoute = (user, currentRoute) => {
  if (!user) return '/login';
  
  // If user has access to current route, stay there
  if (hasRouteAccess(user, currentRoute)) {
    return currentRoute;
  }
  
  // Otherwise redirect to their dashboard
  return getDashboardRoute(user);
};

/**
 * Route configuration for different roles
 */
export const roleRouteConfig = {
  admin: {
    dashboard: '/staff/dashboard',
    defaultRedirect: '/staff/dashboard',
    allowedRoles: ['admin'],
  },
  staff: {
    dashboard: '/staff/dashboard',
    defaultRedirect: '/staff/dashboard',
    allowedRoles: ['staff', 'admin'],
  },
  member: {
    dashboard: '/member-portal/memberdashboard',
    defaultRedirect: '/member-portal/memberdashboard',
    allowedRoles: ['member', 'staff', 'admin'],
  },
};

/**
 * Get navigation items based on user role
 * @param {Object} user - User object
 * @returns {Array} - Navigation items for the user's role
 */
export const getNavigationItems = (user) => {
  if (!user || !user.role) return [];
  
  const role = normalizeRole(user.role);
    const navigationMap = {
    admin: [
      { path: '/staff/dashboard', label: 'Homepage', icon: 'Home' },
      { path: '/admin/settings', label: 'System Settings', icon: 'Settings' },
      { path: '/admin/super-admin', label: 'Super Admin', icon: 'Shield' },
    ],
    staff: [
      { path: '/staff-portal/dashboard', label: 'Dashboard', icon: 'Home' },
      { path: '/staff-portal/members', label: 'Members', icon: 'Users' },
      { path: '/staff-portal/classes', label: 'Classes', icon: 'Calendar' },
      { path: '/staff-portal/reports', label: 'Reports', icon: 'BarChart' },
    ],
    member: [
      { path: '/member/memberdashboard', label: 'Dashboard', icon: 'Home' },
      { path: '/member/classes', label: 'My Classes', icon: 'Calendar' },
      { path: '/member/profile', label: 'Profile', icon: 'User' },
      { path: '/member/billing', label: 'Billing', icon: 'CreditCard' },
    ],
  };

  return navigationMap[role] || [];
};
