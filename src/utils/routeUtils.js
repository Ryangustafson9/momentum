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
    DASHBOARD: '/member-portal/dashboard',  // Updated to match new structure
    CLASSES: '/member-portal/classes',
    BILLING: '/member-portal/billing',
    PROFILE: '/member-portal/profile',
  },// Staff-specific routes
  STAFF: {
    DASHBOARD: '/staff-portal/dashboard',         // Updated to match new structure
    MEMBERS: '/staff-portal/members',
    CLASSES: '/staff-portal/classes',
    REPORTS: '/staff-portal/reports',
    SETTINGS: '/staff-portal/settings',
    CHECKIN: '/staff-portal/checkin',
    SCHEDULE: '/staff-portal/schedule',
    MEMBERSHIPS: '/staff-portal/memberships',
    TRAINERS: '/staff-portal/trainers',
  },

  // Admin routes (same as staff for this app)
  ADMIN: {
    DASHBOARD: '/staff/dashboard',         // Fixed to match App.jsx
    SETTINGS: '/staff/settings',
    MEMBERS: '/staff/members',
    REPORTS: '/staff/reports',
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
