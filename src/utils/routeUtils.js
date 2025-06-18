// src/utils/routeUtils.js
import { normalizeRole } from './roleUtils';

/**
 * Define all application routes with their access permissions
 */
export const ROUTES = {
  // Public routes (no authentication required)
  PUBLIC: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    HOME: '/',
  },

  // General authenticated routes
  GENERAL: {
    DASHBOARD: '/dashboard',           // Nonmember landing page
  },

  // Member-specific routes
  MEMBER: {
    DASHBOARD: '/member/memberdashboard',  // Fixed to match App.jsx
    CLASSES: '/member/classes',
    BILLING: '/member/billing',
    PROFILE: '/member/profile',
  },

  // Staff-specific routes (files in admin folder)
  STAFF: {
    DASHBOARD: '/admin/staffdashboard',    // Points to admin/StaffDashboard.jsx
    MEMBERS: '/admin/members',
    CLASSES: '/admin/classes',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
    CHECKIN: '/admin/check-in',
    SCHEDULE: '/admin/schedule',
    MEMBERSHIPS: '/admin/memberships',
    TRAINERS: '/admin/trainers',
  },

  // Admin routes (same as staff since files are in admin folder)
  ADMIN: {
    DASHBOARD: '/admin/staffdashboard',    // Same as staff
    SETTINGS: '/admin/settings',
    MEMBERS: '/admin/members',
    REPORTS: '/admin/reports',
  },
};

/**
 * Define what routes each role can access
 */
export const ROLE_PERMISSIONS = {
  nonmember: [
    ...Object.values(ROUTES.PUBLIC),
    ...Object.values(ROUTES.GENERAL),
  ],
  
  member: [
    ...Object.values(ROUTES.PUBLIC),
    ...Object.values(ROUTES.GENERAL),
    ...Object.values(ROUTES.MEMBER),
  ],
  
  staff: [
    ...Object.values(ROUTES.PUBLIC),
    ...Object.values(ROUTES.GENERAL),
    ...Object.values(ROUTES.STAFF),
  ],
  
  admin: [
    ...Object.values(ROUTES.PUBLIC),
    ...Object.values(ROUTES.GENERAL),
    ...Object.values(ROUTES.STAFF),
    ...Object.values(ROUTES.ADMIN),
  ],
};

/**
 * Get the default landing page for each role after login
 */
export const DEFAULT_ROUTES = {
  nonmember: ROUTES.GENERAL.DASHBOARD,
  member: ROUTES.MEMBER.DASHBOARD,
  staff: ROUTES.STAFF.DASHBOARD,
  admin: ROUTES.STAFF.DASHBOARD,  // Admin uses staff dashboard
};

/**
 * Helper functions
 */

// ⭐ REMOVED: getDefaultRoute() moved to roleUtils.js to avoid conflicts
// Use import { getDefaultRoute } from '@/utils/roleUtils.js' instead

/**
 * Get all accessible routes for a user role
 * @param {string} role - User role
 * @returns {Array} Array of accessible route patterns
 */
export const getAccessibleRoutes = (role) => {
  const normalizedRole = normalizeRole(role);
  
  const baseRoutes = ['/dashboard', '/profile', '/settings'];
  
  switch (normalizedRole) {
    case 'admin':
      return [
        ...baseRoutes,
        '/admin/*',
        '/staff/*',
        '/member/*'
      ];
      
    case 'staff':
      return [
        ...baseRoutes,
        '/staff/*',
        '/member/*'
      ];
      
    case 'member':
      return [
        ...baseRoutes,
        '/member/*'
      ];
      
    default:
      return baseRoutes;
  }
};

/**
 * Check if a user can access a specific route
 * @param {string} route - Route to check
 * @param {string} userRole - User's role
 * @returns {boolean} Can access route
 */
export const canAccessRoute = (route, userRole) => {
  const accessibleRoutes = getAccessibleRoutes(userRole);
  
  return accessibleRoutes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      return route.startsWith(basePath);
    }
    return route === pattern;
  });
};

/**
 * Validate if user can access a route (legacy function for compatibility)
 * @param {string} route - Route to validate
 * @param {Object} user - User object with role
 * @returns {boolean} Can access route
 */
export const validateRouteAccess = (route, user) => {
  if (!user || !user.role) {
    return false;
  }
  
  return canAccessRoute(route, user.role);
};

export default {
  getAccessibleRoutes,
  canAccessRoute,
  validateRouteAccess
};