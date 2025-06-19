/**
 * SINGLE IMPORT PATH for all access control, roles, and routing
 * This is the ONLY file components should import from for access logic
 * 
 * ⭐ UNIFIED: One source for all access/route/role functions
 */

// ⭐ IMPORT: All role logic from roleUtils
import {
  normalizeRole,
  getDefaultRoute,
  getAccessibleRoutes,
  canAccessRoute,
  validateRouteAccess,
  hasAdminAccess,
  hasStaffAccess,
  hasMemberAccess,
  getUnauthorizedRedirect,
} from './roleUtils';

// ⭐ IMPORT: All route definitions from routeUtils
import {
  ROUTES,
} from './routeUtils';

// Export only what's actually available from our dependencies
export {
  // From routeUtils
  ROUTES,
  // From roleUtils  
  normalizeRole,
  hasAdminAccess,
  hasStaffAccess,
  hasMemberAccess,
  getDefaultRoute,
  getAccessibleRoutes,
  canAccessRoute,
  validateRouteAccess,
  getUnauthorizedRedirect,
};

// Additional convenience functions
export const hasElevatedAccess = (user) => {
  return hasStaffAccess(user?.role) || hasAdminAccess(user?.role);
};

export const getDashboardRoute = (user) => {
  if (!user || !user.role) {
    return '/login';
  }
  return getDefaultRoute(user.role);
};

// validateUserRole function that components expect
export const validateUserRole = (user) => {
  if (!user) {
    return { role: 'member', isValid: false };
  }
  
  const role = normalizeRole(user.role || 'member');
  return {
    role,
    isValid: ['admin', 'staff', 'member'].includes(role),
    originalRole: user.role
  };
};

// Default export for backward compatibility
export default {
  ROUTES,
  normalizeRole,
  hasAdminAccess,
  hasStaffAccess,
  hasMemberAccess,
  getDefaultRoute,
  canAccessRoute,
  getAccessibleRoutes,
  validateRouteAccess,
  getUnauthorizedRedirect,
  hasElevatedAccess,
  getDashboardRoute,
  validateUserRole,
};
