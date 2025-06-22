/**
 * Role Utilities - Centralized role management functions
 * 
 * This file consolidates role-related utilities from various helpers
 * to provide a single import point for role management functions.
 */

/**
 * Normalize role names to handle variations and ensure consistency
 * @param {string} role - Raw role string
 * @returns {string} - Normalized role
 */
export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') {
    return 'member'; // Default fallback
  }
  
  const normalized = role.toLowerCase().trim();
  
  // Handle common variations
  const roleMap = {
    'administrator': 'admin',
    'admin': 'admin',
    'staff': 'staff',
    'employee': 'staff',
    'trainer': 'staff',
    'instructor': 'staff',
    'member': 'member',
    'user': 'member',
    'customer': 'member',
    'family_member': 'member',
    'nonmember': 'nonmember',
  };
  
  return roleMap[normalized] || 'member';
};

/**
 * Check if a role has admin privileges
 * @param {string} role - Role to check
 * @returns {boolean} - Whether role has admin privileges
 */
export const isAdmin = (role) => {
  return normalizeRole(role) === 'admin';
};

/**
 * Check if a role has staff privileges
 * @param {string} role - Role to check
 * @returns {boolean} - Whether role has staff privileges
 */
export const isStaff = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'staff' || normalized === 'admin';
};

/**
 * Check if a role is a member
 * @param {string} role - Role to check
 * @returns {boolean} - Whether role is a member
 */
export const isMember = (role) => {
  return normalizeRole(role) === 'member';
};

/**
 * Get role hierarchy level (higher number = more privileges)
 * @param {string} role - Role to check
 * @returns {number} - Hierarchy level
 */
export const getRoleLevel = (role) => {
  const levels = {
    'admin': 3,
    'staff': 2,
    'member': 1,
    'nonmember': 0,
  };
  
  return levels[normalizeRole(role)] || 0;
};

/**
 * Get the default dashboard route for a user role
 * @param {string|Object} userOrRole - User object with role property or role string
 * @returns {string} - Default route path
 */
export const getDefaultRoute = (userOrRole) => {
  // Handle both user object and role string
  const role = typeof userOrRole === 'string' 
    ? userOrRole 
    : userOrRole?.role || 'nonmember';
  
  const normalizedRole = normalizeRole(role);
  // Define default routes for each role
  const defaultRoutes = {
    admin: '/staff-portal/dashboard',
    staff: '/staff-portal/dashboard',
    member: '/member-portal/dashboard',
    nonmember: '/dashboard',
  };
  
  return defaultRoutes[normalizedRole] || '/dashboard';
};

/**
 * Get dashboard route - alias for getDefaultRoute for backwards compatibility
 * @param {Object} user - User object with role property
 * @returns {string} - Dashboard route path
 */
export const getDashboardRoute = (user) => {
  return getDefaultRoute(user);
};

/**
 * Check if a user can access a specific route based on their role
 * @param {string} route - Route to check
 * @param {string} userRole - User's role
 * @returns {boolean} - Can access route
 */
export const canAccessRoute = (route, userRole) => {
  const normalizedRole = normalizeRole(userRole);
    // Define route patterns for each role
  const roleRoutes = {
    admin: [
      '/admin/*',
      '/staff-portal/*',
      '/member-portal/*',
      '/dashboard',
      '/profile',
      '/settings',
    ],
    staff: [
      '/staff-portal/*',
      '/member-portal/*',
      '/dashboard',
      '/profile',
      '/settings',
    ],    member: [
      '/member-portal/*',
      '/dashboard',
      '/profile',
    ],
    nonmember: [
      '/dashboard',
      '/join-online',
      '/join-online/*',
    ],
  };
  
  const allowedRoutes = roleRoutes[normalizedRole] || [];
  
  return allowedRoutes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      return route.startsWith(basePath);
    }
    return route === pattern;
  });
};

/**
 * Get all accessible routes for a user role
 * @param {string} role - User role
 * @returns {Array} Array of accessible route patterns
 */
export const getAccessibleRoutes = (role) => {
  const normalizedRole = normalizeRole(role);
  
  const baseRoutes = ['/dashboard', '/profile'];
  
  switch (normalizedRole) {    case 'admin':
      return [
        ...baseRoutes,
        '/admin/*',
        '/staff-portal/*',
        '/member-portal/*',
        '/settings',
      ];
      
    case 'staff':
      return [
        ...baseRoutes,
        '/staff-portal/*',
        '/member-portal/*',
        '/settings',
      ];
        case 'member':
      return [
        ...baseRoutes,
        '/member-portal/*',
      ];
      
    case 'nonmember':
      return [
        '/dashboard',
        '/join-online',
        '/join-online/*',
      ];
      
    default:
      return baseRoutes;
  }
};

/**
 * Check if user has admin access
 * @param {string} role - User role
 * @returns {boolean} - Has admin access
 */
export const hasAdminAccess = (role) => {
  return normalizeRole(role) === 'admin';
};

/**
 * Check if user has staff access (staff or admin)
 * @param {string} role - User role
 * @returns {boolean} - Has staff access
 */
export const hasStaffAccess = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'staff' || normalized === 'admin';
};

/**
 * Check if user has member access
 * @param {string} role - User role
 * @returns {boolean} - Has member access
 */
export const hasMemberAccess = (role) => {
  const normalized = normalizeRole(role);
  return ['member', 'staff', 'admin'].includes(normalized);
};

/**
 * Get unauthorized redirect path
 * @param {string} currentPath - Current path user is trying to access
 * @param {string} userRole - User's role
 * @returns {string} - Redirect path
 */
export const getUnauthorizedRedirect = (currentPath, userRole) => {
  // If user is trying to access a route they can't access, redirect to their default route
  if (!canAccessRoute(currentPath, userRole)) {
    return getDefaultRoute(userRole);
  }
  
  return currentPath;
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

// Default export for convenience
export default {
  normalizeRole,
  isAdmin,
  isStaff,
  isMember,
  getRoleLevel,
  getDefaultRoute,
  getDashboardRoute,
  canAccessRoute,
  getAccessibleRoutes,
  hasAdminAccess,
  hasStaffAccess,
  hasMemberAccess,
  getUnauthorizedRedirect,
  validateRouteAccess,
};

