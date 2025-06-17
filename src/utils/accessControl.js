/**
 * SINGLE IMPORT PATH for all access control, roles, and routing
 * This is the ONLY file components should import from for access logic
 * 
 * ⭐ UNIFIED: One source for all access/route/role functions
 */

// ⭐ IMPORT: All role logic from roleUtils (internal)
import {
  VALID_ROLES,
  ROLE_HIERARCHY,
  ROLE_DEFAULT_ROUTES,
  ROLE_ACCESSIBLE_ROUTES,
  ROLE_PERMISSIONS,
  normalizeRole,
  getDefaultRoute,
  getAccessibleRoutes,
  canAccessRoute,
  validateRouteAccess,
  getUserPermissions,
  hasPermission,
  compareRoles,
  hasAdminAccess,
  hasStaffAccess,
  hasMemberAccess,
  getRoleDisplayName,
  createSafeUser,
  getEffectiveRole,
  validateUserRole,
  getUnauthorizedRedirect,
  getUniversalRedirect,
  getLoginRedirect,
  getUnauthorizedAccessRedirect
} from './internal/roleUtils';

// ⭐ IMPORT: All route definitions from routeUtils (internal)
import {
  ROUTES,
  ROUTE_METADATA,
  getRouteMetadata,
  getNavigationRoutes,
  getBreadcrumbs,
  isValidRouteFormat
} from './internal/routeUtils';

/**
 * ⭐ UNIFIED: Single export for all access control functionality
 * Components should ONLY import from this file
 */

// ========================================
// ROLE CONSTANTS
// ========================================
export {
  VALID_ROLES,
  ROLE_HIERARCHY,
  ROLE_DEFAULT_ROUTES,
  ROLE_ACCESSIBLE_ROUTES,
  ROLE_PERMISSIONS
};

// ========================================
// ROUTE CONSTANTS
// ========================================
export {
  ROUTES,
  ROUTE_METADATA
};

// ========================================
// ROLE FUNCTIONS
// ========================================
export {
  normalizeRole,
  getUserPermissions,
  hasPermission,
  compareRoles,
  hasAdminAccess,
  hasStaffAccess,
  hasMemberAccess,
  getRoleDisplayName,
  createSafeUser,
  getEffectiveRole,
  validateUserRole
};

// ========================================
// ROUTE ACCESS FUNCTIONS
// ========================================
export {
  getDefaultRoute,
  getAccessibleRoutes,
  canAccessRoute,
  validateRouteAccess
};

// ========================================
// REDIRECT FUNCTIONS
// ========================================
export {
  getUnauthorizedRedirect,
  getUniversalRedirect,
  getLoginRedirect,
  getUnauthorizedAccessRedirect
};

// ========================================
// UI HELPER FUNCTIONS
// ========================================
export {
  getRouteMetadata,
  getNavigationRoutes,
  getBreadcrumbs,
  isValidRouteFormat
};

// ========================================
// CONVENIENCE FUNCTIONS
// ========================================

/**
 * ⭐ CONVENIENCE: Check if user can access current page
 * @param {Object} user - User object
 * @param {string} currentRoute - Current route path
 * @returns {boolean} Can access current page
 */
export const canUserAccessCurrentPage = (user, currentRoute) => {
  if (!user || !currentRoute) return false;
  return canAccessRoute(currentRoute, user.role);
};

/**
 * ⭐ CONVENIENCE: Get user's homepage
 * @param {Object} user - User object
 * @returns {string} User's default homepage
 */
export const getUserHomepage = (user) => {
  return getDefaultRoute(user?.role);
};

/**
 * ⭐ CONVENIENCE: Check if route requires authentication
 * @param {string} route - Route to check
 * @returns {boolean} Requires authentication
 */
export const routeRequiresAuth = (route) => {
  const metadata = getRouteMetadata(route);
  return metadata.requiresAuth !== false; // Default to true
};

/**
 * ⭐ CONVENIENCE: Get user's navigation menu
 * @param {Object} user - User object
 * @returns {Array} Navigation menu items
 */
export const getUserNavigationMenu = (user) => {
  return getNavigationRoutes(user?.role);
};

/**
 * ⭐ CONVENIENCE: Check if user has elevated privileges
 * @param {Object} user - User object
 * @returns {boolean} Has staff or admin access
 */
export const hasElevatedAccess = (user) => {
  return hasStaffAccess(user?.role) || hasAdminAccess(user?.role);
};

/**
 * ⭐ CONVENIENCE: Get redirect after login
 * @param {Object} user - User object
 * @param {string} intendedRoute - Where user wanted to go
 * @returns {string} Redirect path
 */
export const getPostLoginRedirect = (user, intendedRoute = null) => {
  return getLoginRedirect(user, intendedRoute);
};

/**
 * ⭐ CONVENIENCE: Get redirect for unauthorized access
 * @param {Object} user - User object
 * @param {string} attemptedRoute - Route user tried to access
 * @returns {string} Redirect path
 */
export const getUnauthorizedAccessRedirectForUser = (user, attemptedRoute) => {
  return getUnauthorizedRedirect(attemptedRoute, user?.role);
};

// Add this function to handle role-based dashboard routing
export const getDashboardRoute = (user) => {
  if (!user || !user.role) {
    console.warn('⚠️ getDashboardRoute: No user or role provided');
    return '/login';
  }

  const normalizedRole = normalizeRole(user.role);
  
  switch (normalizedRole) {
    case 'admin':
      return '/staff/dashboard';
    case 'staff':
      return '/staff/dashboard';
    case 'member':
      return '/member-portal/memberdashboard';
    default:
      console.warn('⚠️ getDashboardRoute: Unknown role:', normalizedRole);
      return '/member-portal/memberdashboard'; // Default fallback
  }
};

// ========================================
// DEFAULT EXPORT
// ========================================
export default {
  // Constants
  VALID_ROLES,
  ROLE_HIERARCHY,
  ROUTES,
  ROUTE_METADATA,
  
  // Role functions
  normalizeRole,
  getUserPermissions,
  hasPermission,
  hasAdminAccess,
  hasStaffAccess,
  hasMemberAccess,
  getRoleDisplayName,
  
  // Route functions
  getDefaultRoute,
  canAccessRoute,
  getAccessibleRoutes,
  validateRouteAccess,
  
  // Redirect functions
  getLoginRedirect,
  getUnauthorizedRedirect,
  
  // UI helpers
  getRouteMetadata,
  getNavigationRoutes,
  getBreadcrumbs,
  
  // Convenience functions
  canUserAccessCurrentPage,
  getUserHomepage,
  routeRequiresAuth,
  getUserNavigationMenu,
  hasElevatedAccess,
  getPostLoginRedirect,
  getUnauthorizedAccessRedirectForUser,
  getDashboardRoute
};