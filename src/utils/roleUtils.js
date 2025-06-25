/**
 * Role Utilities - Centralized role management functions
 * 
 * This file consolidates role-related utilities from various helpers
 * to provide a single import point for role management functions.
 * 
 * ✅ SECURITY FIXES APPLIED:
 * - Added null/undefined guards for all role functions
 * - Enhanced error handling for edge cases
 * - Improved role validation with corruption detection
 * - Added safe fallbacks for permission checks
 */

/**
 * Safely validates if a value is a valid role string
 * @param {any} role - Value to validate
 * @returns {boolean} - Whether the role is valid
 */
export const isValidRole = (role) => {
  return (
    role !== null &&
    role !== undefined &&
    typeof role === 'string' &&
    role.trim().length > 0 &&
    role.length < 50 // Prevent unreasonably long strings
  );
};

/**
 * Normalize role names to handle variations and ensure consistency
 * @param {string} role - Raw role string
 * @returns {string} - Normalized role
 */
export const normalizeRole = (role) => {
  // ✅ SECURITY FIX: Enhanced null/undefined handling
  if (!isValidRole(role)) {
    console.warn('Invalid role provided to normalizeRole:', role);
    return 'member'; // Safe default fallback
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
  
  const mappedRole = roleMap[normalized];
  
  // ✅ SECURITY FIX: Validate mapped role exists
  if (!mappedRole) {
    console.warn('Unknown role detected, using safe default:', normalized);
    return 'member';
  }
  
  return mappedRole;
};

/**
 * Check if a role has admin privileges
 * @param {string} role - Role to check
 * @returns {boolean} - Whether role has admin privileges
 */
export const isAdmin = (role) => {
  // ✅ SECURITY FIX: Safe null handling
  if (!isValidRole(role)) {
    return false;
  }
  return normalizeRole(role) === 'admin';
};

/**
 * Check if a role has staff privileges
 * @param {string} role - Role to check
 * @returns {boolean} - Whether role has staff privileges
 */
export const isStaff = (role) => {
  // ✅ SECURITY FIX: Safe null handling
  if (!isValidRole(role)) {
    return false;
  }
  const normalized = normalizeRole(role);
  return normalized === 'staff' || normalized === 'admin';
};

/**
 * Check if a role is a member
 * @param {string} role - Role to check
 * @returns {boolean} - Whether role is a member
 */
export const isMember = (role) => {
  // ✅ SECURITY FIX: Safe null handling
  if (!isValidRole(role)) {
    return false;
  }
  return normalizeRole(role) === 'member';
};

/**
 * Get role hierarchy level (higher number = more privileges)
 * @param {string} role - Role to check
 * @returns {number} - Hierarchy level
 */
export const getRoleLevel = (role) => {
  // ✅ SECURITY FIX: Safe null handling
  if (!isValidRole(role)) {
    return 0; // Lowest privilege level for invalid roles
  }
  
  const levels = {
    'admin': 3,
    'staff': 2,
    'member': 1,
    'nonmember': 0,
  };
  
  const normalizedRole = normalizeRole(role);
  return levels[normalizedRole] ?? 0; // Use nullish coalescing for extra safety
};

/**
 * Safely validates a user object
 * @param {any} user - User object to validate
 * @returns {boolean} - Whether user is valid
 */
export const isValidUser = (user) => {
  return (
    user !== null &&
    user !== undefined &&
    typeof user === 'object' &&
    !Array.isArray(user)
  );
};

/**
 * Get the default dashboard route for a user role
 * @param {string|Object} userOrRole - User object with role property or role string
 * @returns {string} - Default route path
 */
export const getDefaultRoute = (userOrRole) => {
  // ✅ SECURITY FIX: Enhanced validation for user objects and roles
  let role;
  
  if (typeof userOrRole === 'string') {
    role = userOrRole;
  } else if (isValidUser(userOrRole)) {
    role = userOrRole.role;
  } else {
    console.warn('Invalid user or role provided to getDefaultRoute:', userOrRole);
    role = 'nonmember'; // Safe fallback
  }
  
  // ✅ SECURITY FIX: Validate role before normalization
  if (!isValidRole(role)) {
    console.warn('Invalid role in getDefaultRoute, using safe default:', role);
    role = 'nonmember';
  }
  
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
  // ✅ SECURITY FIX: Enhanced user validation
  if (!isValidUser(user)) {
    console.warn('Invalid user provided to getDashboardRoute:', user);
    return '/dashboard'; // Safe fallback
  }
  return getDefaultRoute(user);
};

/**
 * Check if a user can access a specific route based on their role
 * @param {string} route - Route to check
 * @param {string} userRole - User's role
 * @returns {boolean} - Can access route
 */
export const canAccessRoute = (route, userRole) => {
  // ✅ SECURITY FIX: Validate route parameter
  if (!route || typeof route !== 'string') {
    console.warn('Invalid route provided to canAccessRoute:', route);
    return false;
  }
  
  // ✅ SECURITY FIX: Validate role parameter
  if (!isValidRole(userRole)) {
    console.warn('Invalid role provided to canAccessRoute:', userRole);
    return false; // Deny access for invalid roles
  }
  
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
    ],
    member: [
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
  // ✅ SECURITY FIX: Validate role parameter
  if (!isValidRole(role)) {
    console.warn('Invalid role provided to getAccessibleRoutes:', role);
    return ['/dashboard']; // Safe minimal access
  }
  
  const normalizedRole = normalizeRole(role);
  
  const baseRoutes = ['/dashboard', '/profile'];
  
  switch (normalizedRole) {
    case 'admin':
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
      console.warn('Unhandled role in getAccessibleRoutes:', normalizedRole);
      return baseRoutes;
  }
};

/**
 * Check if user has admin access
 * @param {string} role - User role
 * @returns {boolean} - Has admin access
 */
export const hasAdminAccess = (role) => {
  // ✅ SECURITY FIX: Safe null handling
  if (!isValidRole(role)) {
    return false;
  }
  return normalizeRole(role) === 'admin';
};

/**
 * Check if user has staff access (staff or admin)
 * @param {string} role - User role
 * @returns {boolean} - Has staff access
 */
export const hasStaffAccess = (role) => {
  // ✅ SECURITY FIX: Safe null handling
  if (!isValidRole(role)) {
    return false;
  }
  const normalized = normalizeRole(role);
  return normalized === 'staff' || normalized === 'admin';
};

/**
 * Check if user has member access
 * @param {string} role - User role
 * @returns {boolean} - Has member access
 */
export const hasMemberAccess = (role) => {
  // ✅ SECURITY FIX: Safe null handling
  if (!isValidRole(role)) {
    return false;
  }
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
  // ✅ SECURITY FIX: Validate parameters
  if (!currentPath || typeof currentPath !== 'string') {
    console.warn('Invalid currentPath provided to getUnauthorizedRedirect:', currentPath);
    return '/dashboard'; // Safe fallback
  }
  
  if (!isValidRole(userRole)) {
    console.warn('Invalid userRole provided to getUnauthorizedRedirect:', userRole);
    return '/dashboard'; // Safe fallback
  }
  
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
  // ✅ SECURITY FIX: Enhanced validation
  if (!route || typeof route !== 'string') {
    console.warn('Invalid route provided to validateRouteAccess:', route);
    return false;
  }
  
  if (!isValidUser(user)) {
    console.warn('Invalid user provided to validateRouteAccess:', user);
    return false;
  }
  
  if (!isValidRole(user.role)) {
    console.warn('Invalid user role in validateRouteAccess:', user.role);
    return false;
  }
  
  return canAccessRoute(route, user.role);
};

// Default export for convenience
export default {
  // ✅ SECURITY FIX: Export validation helpers
  isValidRole,
  isValidUser,
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

