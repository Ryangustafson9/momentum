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
  isValidRole,
  isValidUser,
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
  // ✅ SECURITY FIX: Export validation helpers
  isValidRole,
  isValidUser,
};

// Additional convenience functions
export const hasElevatedAccess = (user) => {
  // ✅ SECURITY FIX: Validate user parameter
  if (!isValidUser(user) || !isValidRole(user.role)) {
    return false;
  }
  return hasStaffAccess(user.role) || hasAdminAccess(user.role);
};

export const getDashboardRoute = (user) => {
  // ✅ SECURITY FIX: Validate user parameter
  if (!isValidUser(user) || !isValidRole(user.role)) {
    return '/login';
  }
  return getDefaultRoute(user.role);
};

// validateUserRole function that components expect
export const validateUserRole = (user) => {
  // ✅ SECURITY FIX: Enhanced user validation
  if (!isValidUser(user)) {
    return { role: 'member', isValid: false, error: 'Invalid user object' };
  }
  
  if (!isValidRole(user.role)) {
    return { 
      role: 'member', 
      isValid: false, 
      originalRole: user.role,
      error: 'Invalid role value'
    };
  }
  
  const role = normalizeRole(user.role);
  const validRoles = ['admin', 'staff', 'member', 'nonmember'];
  
  return {
    role,
    isValid: validRoles.includes(role),
    originalRole: user.role,
    error: validRoles.includes(role) ? null : 'Unrecognized role'
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
  // ✅ SECURITY FIX: Include validation helpers
  isValidRole,
  isValidUser,
};

