/**
 * SINGLE SOURCE OF TRUTH for all role-related logic
 * All role definitions, permissions, and access rules are defined here
 */

// ⭐ MASTER: Valid roles in the system
export const VALID_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff', 
  MEMBER: 'member',
  NONMEMBER: 'nonmember',
  INACTIVE: 'inactive'
};

// ⭐ MASTER: Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  [VALID_ROLES.ADMIN]: 100,
  [VALID_ROLES.STAFF]: 50,
  [VALID_ROLES.MEMBER]: 25,
  [VALID_ROLES.NONMEMBER]: 10,
  [VALID_ROLES.INACTIVE]: 0
};

// ⭐ FIXED: Consistent route paths matching your App.jsx structure
export const ROLE_DEFAULT_ROUTES = {
  [VALID_ROLES.ADMIN]: '/staff/staffdashboard',    // Admin uses staff dashboard, accesses Admin Panel via Settings
  [VALID_ROLES.STAFF]: '/staff/staffdashboard',    // Staff dashboard
  [VALID_ROLES.MEMBER]: '/member-portal/memberdashboard',  // Updated folder name
  [VALID_ROLES.NONMEMBER]: '/dashboard',
  [VALID_ROLES.INACTIVE]: '/dashboard'
};

// ⭐ FIXED: Route patterns matching your actual file structure
export const ROLE_ACCESSIBLE_ROUTES = {
  [VALID_ROLES.ADMIN]: [
    '/dashboard', '/profile', '/settings',
    '/admin/*', '/staff/*', '/member/*'
  ],
  [VALID_ROLES.STAFF]: [
    '/dashboard', '/profile', '/settings',
    '/staff/*', '/member/*'  // Staff can access member areas for support
  ],
  [VALID_ROLES.MEMBER]: [
    '/dashboard', '/profile', '/settings',
    '/member/*'
  ],
  [VALID_ROLES.NONMEMBER]: [
    '/dashboard', '/profile'
  ],
  [VALID_ROLES.INACTIVE]: [
    '/dashboard'
  ]
};

// ⭐ MASTER: Component access permissions
export const ROLE_PERMISSIONS = {
  [VALID_ROLES.ADMIN]: {
    // Dashboard & Navigation
    canViewDashboard: true,
    canEditProfile: true,
    canAccessAdminPanel: true,
    
    // User Management
    canManageUsers: true,
    canImpersonateUsers: true,
    canViewAllProfiles: true,
    canDeleteUsers: true,
    
    // Content Management
    canManageClasses: true,
    canManageMembers: true,
    canManageSettings: true,
    canManageReports: true,
    
    // Financial
    canViewReports: true,
    canManageBilling: true,
    canViewRevenue: true,
    
    // System
    canCheckInMembers: true,
    canManageEquipment: true,
    canViewLogs: true
  },
  
  [VALID_ROLES.STAFF]: {
    // Dashboard & Navigation
    canViewDashboard: true,
    canEditProfile: true,
    canAccessAdminPanel: false,
    
    // User Management
    canManageUsers: false,
    canImpersonateUsers: false,
    canViewAllProfiles: true,
    canDeleteUsers: false,
    
    // Content Management
    canManageClasses: true,
    canManageMembers: true,
    canManageSettings: false,
    canManageReports: true,
    
    // Financial
    canViewReports: true,
    canManageBilling: false,
    canViewRevenue: false,
    
    // System
    canCheckInMembers: true,
    canManageEquipment: true,
    canViewLogs: false
  },
  
  [VALID_ROLES.MEMBER]: {
    // Dashboard & Navigation
    canViewDashboard: true,
    canEditProfile: true,
    canAccessAdminPanel: false,
    
    // User Management
    canManageUsers: false,
    canImpersonateUsers: false,
    canViewAllProfiles: false,
    canDeleteUsers: false,
    
    // Content Management
    canManageClasses: false,
    canManageMembers: false,
    canManageSettings: false,
    canManageReports: false,
    
    // Financial
    canViewReports: false,
    canManageBilling: true, // Own billing only
    canViewRevenue: false,
    
    // System
    canCheckInMembers: false,
    canManageEquipment: false,
    canViewLogs: false,
    
    // Member-specific
    canBookClasses: true,
    canViewSchedule: true,
    canCancelBookings: true
  },
  
  [VALID_ROLES.NONMEMBER]: {
    canViewDashboard: true,
    canEditProfile: true,
    canViewSchedule: true, // Limited view
    canBookClasses: false
  },
  
  [VALID_ROLES.INACTIVE]: {
    canViewDashboard: true,
    canEditProfile: false
  }
};

/**
 * Normalize user role to standard values
 * @param {string} role - Raw role from database
 * @returns {string} Normalized role
 */
export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') {
    return VALID_ROLES.MEMBER; // Default role
  }

  const normalizedRole = role.toLowerCase().trim();
  
  switch (normalizedRole) {
    case 'admin':
    case 'administrator':
    case 'super_admin':
      return VALID_ROLES.ADMIN;
      
    case 'staff':
    case 'employee':
    case 'instructor':
    case 'trainer':
      return VALID_ROLES.STAFF;
      
    case 'member':
    case 'active':
    case 'active_member':
    case 'family_member': // Fix: family_member should be treated as member
      return VALID_ROLES.MEMBER;
      
    case 'nonmember':
    case 'non_member':
    case 'inactive':
    case 'expired':
    case 'guest':
      return VALID_ROLES.NONMEMBER;
      
    default:
      console.warn('🔧 Unknown role:', role, '- defaulting to member');
      return VALID_ROLES.MEMBER;
  }
};

/**
 * ⭐ SINGLE SOURCE: Get default route for a role
 * @param {string} role - User role
 * @returns {string} Default route path
 */
export const getDefaultRoute = (role) => {
  const normalized = normalizeRole(role);
  const defaultRoute = ROLE_DEFAULT_ROUTES[normalized];
  
  console.log('🎯 getDefaultRoute:', role, '->', normalized, '->', defaultRoute);
  
  return defaultRoute || '/dashboard';
};

/**
 * ⭐ SINGLE SOURCE: Get accessible routes for a role
 * @param {string} role - User role
 * @returns {Array} Array of accessible route patterns
 */
export const getAccessibleRoutes = (role) => {
  const normalized = normalizeRole(role);
  return ROLE_ACCESSIBLE_ROUTES[normalized] || ['/dashboard'];
};

/**
 * ⭐ SINGLE SOURCE: Check if a role can access a specific route
 * @param {string} route - Route to check
 * @param {string} role - User role
 * @returns {boolean} Can access route
 */
export const canAccessRoute = (route, role) => {
  const normalizedRole = normalizeRole(role);
  const accessibleRoutes = ROLE_ACCESSIBLE_ROUTES[normalizedRole] || [];
  
  // ⭐ SPECIAL: Always allow access to general dashboard
  if (route === '/dashboard') {
    return true;
  }
  
  // ⭐ CHECK: Route patterns
  return accessibleRoutes.some(pattern => {
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      return route.startsWith(basePath);
    }
    return route === pattern;
  });
};

/**
 * ⭐ SINGLE SOURCE: Validate if a route exists and is accessible
 * @param {string} route - Route to validate
 * @param {string} role - User role
 * @returns {Object} { isValid: boolean, reason: string }
 */
export const validateRouteAccess = (route, role) => {
  if (!route || route === '/') {
    return { isValid: false, reason: 'Root route requires redirect' };
  }
  
  if (route === '/login' || route === '/signup') {
    return { isValid: false, reason: 'Public route for logged-in user' };
  }
  
  if (!canAccessRoute(route, role)) {
    return { isValid: false, reason: 'Insufficient permissions' };
  }
  
  return { isValid: true, reason: 'Access granted' };
};

/**
 * Get user permissions for a role
 * @param {string} role - User role
 * @returns {Object} Permissions object
 */
export const getUserPermissions = (role) => {
  const normalized = normalizeRole(role);
  return ROLE_PERMISSIONS[normalized] || ROLE_PERMISSIONS[VALID_ROLES.NONMEMBER];
};

/**
 * Check if user has specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} Has permission
 */
export const hasPermission = (role, permission) => {
  const permissions = getUserPermissions(role);
  return permissions[permission] === true;
};

/**
 * Compare role hierarchy levels
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {number} -1 if role1 < role2, 0 if equal, 1 if role1 > role2
 */
export const compareRoles = (role1, role2) => {
  const level1 = ROLE_HIERARCHY[normalizeRole(role1)] || 0;
  const level2 = ROLE_HIERARCHY[normalizeRole(role2)] || 0;
  
  if (level1 < level2) return -1;
  if (level1 > level2) return 1;
  return 0;
};

/**
 * Check if a role has admin privileges
 * @param {string} role - Role to check
 * @returns {boolean} Has admin access
 */
export const hasAdminAccess = (role) => {
  return normalizeRole(role) === VALID_ROLES.ADMIN;
};

/**
 * Check if a role has staff privileges
 * @param {string} role - Role to check
 * @returns {boolean} Has staff access
 */
export const hasStaffAccess = (role) => {
  const normalized = normalizeRole(role);
  return normalized === VALID_ROLES.ADMIN || normalized === VALID_ROLES.STAFF;
};

/**
 * Check if a role has member privileges
 * @param {string} role - Role to check
 * @returns {boolean} Has member access
 */
export const hasMemberAccess = (role) => {
  const normalized = normalizeRole(role);
  return [VALID_ROLES.ADMIN, VALID_ROLES.STAFF, VALID_ROLES.MEMBER].includes(normalized);
};

/**
 * Get role display name
 * @param {string} role - Role to format
 * @returns {string} Display name
 */
export const getRoleDisplayName = (role) => {
  const normalized = normalizeRole(role);
  
  switch (normalized) {
    case VALID_ROLES.ADMIN:
      return 'Administrator';
    case VALID_ROLES.STAFF:
      return 'Staff';
    case VALID_ROLES.MEMBER:
      return 'Member';
    case VALID_ROLES.NONMEMBER:
      return 'Non-Member';
    case VALID_ROLES.INACTIVE:
      return 'Inactive';
    default:
      return 'Unknown';
  }
};

/**
 * ⭐ ENHANCED: Create safe user object with normalized role
 * @param {Object} user - Original user object
 * @param {string} fallbackRole - Fallback role if user has none
 * @returns {Object} Safe user object with normalized role
 */
export const createSafeUser = (user, fallbackRole = 'member') => {
  if (!user) {
    return null;
  }

  const normalizedRole = normalizeRole(user.role || fallbackRole);
  
  // ⭐ IMMUTABLE: Return new object, don't mutate original
  return {
    ...user,
    role: normalizedRole,
    originalRole: user.role // Keep track of original for debugging
  };
};

/**
 * ⭐ ENHANCED: Get user's effective role (what they should be treated as)
 * @param {Object} user - User object
 * @returns {string} Effective role for permissions and routing
 */
export const getEffectiveRole = (user) => {
  if (!user) {
    return VALID_ROLES.NONMEMBER;
  }
  
  return normalizeRole(user.role || 'member');
};

/**
 * ⭐ ENHANCED: Validate user role and provide feedback
 * @param {Object} user - User object
 * @returns {Object} { role: string, isValid: boolean, warning: string|null }
 */
export const validateUserRole = (user) => {
  if (!user) {
    return {
      role: VALID_ROLES.NONMEMBER,
      isValid: false,
      warning: 'No user provided'
    };
  }

  const originalRole = user.role;
  const normalizedRole = normalizeRole(originalRole);
  
  if (!originalRole) {
    return {
      role: normalizedRole,
      isValid: false,
      warning: 'User has no role assigned - using default member access'
    };
  }

  if (originalRole !== normalizedRole) {
    return {
      role: normalizedRole,
      isValid: true,
      warning: `Role "${originalRole}" normalized to "${normalizedRole}"`
    };
  }

  return {
    role: normalizedRole,
    isValid: true,
    warning: null
  };
};

/**
 * ⭐ SIMPLIFIED: Get redirect path after unauthorized access
 * @param {string} currentRoute - Route user tried to access
 * @param {string} userRole - User's role
 * @returns {string} Redirect path
 */
export const getUnauthorizedRedirect = (currentRoute, userRole) => {
  const normalizedRole = normalizeRole(userRole);
  
  console.log('🚫 Unauthorized access:', {
    currentRoute,
    userRole,
    normalizedRole,
    redirectTo: ROLE_DEFAULT_ROUTES[normalizedRole]
  });
  
  return ROLE_DEFAULT_ROUTES[normalizedRole] || '/dashboard';
};

/**
 * ⭐ ULTIMATE: Single function for all role-based redirects
 * Handles login redirects, unauthorized access, and default routing
 * @param {Object} options - Redirect options
 * @param {string} options.userRole - User's role
 * @param {string} options.intendedRoute - Where user wanted to go (optional)
 * @param {string} options.currentRoute - Where user is now (optional)
 * @param {string} options.context - Context: 'login', 'unauthorized', 'default'
 * @returns {string} Redirect path
 */
export const getUniversalRedirect = ({
  userRole,
  intendedRoute = null,
  currentRoute = null,
  context = 'default'
} = {}) => {
  const normalizedRole = normalizeRole(userRole);
  
  console.log('🎯 Universal redirect:', {
    userRole,
    normalizedRole,
    intendedRoute,
    currentRoute,
    context
  });

  // ⭐ INTENDED: User wanted to go somewhere specific
  if (intendedRoute && intendedRoute !== '/login' && intendedRoute !== '/') {
    if (canAccessRoute(intendedRoute, normalizedRole)) {
      console.log('✅ Redirecting to intended route:', intendedRoute);
      return intendedRoute;
    } else {
      console.log('🚫 Cannot access intended route, using default');
    }
  }

  // ⭐ CONTEXT: Handle different redirect contexts
  switch (context) {
    case 'login':
    case 'unauthorized':
    case 'default':
    default:
      // All contexts use the same default route logic
      return getDefaultRoute(normalizedRole);
  }
};

/**
 * ⭐ SIMPLIFIED: Login redirect helper
 * @param {Object} user - User object
 * @param {string} intendedRoute - Where user wanted to go
 * @returns {string} Redirect path
 */
export const getLoginRedirect = (user, intendedRoute = null) => {
  return getUniversalRedirect({
    userRole: user?.role,
    intendedRoute,
    context: 'login'
  });
};

/**
 * ⭐ SIMPLIFIED: Unauthorized access redirect helper
 * @param {string} currentRoute - Current route user tried to access
 * @param {string} userRole - User's role
 * @returns {string} Redirect path
 */
export const getUnauthorizedAccessRedirect = (currentRoute, userRole) => {
  return getUnauthorizedRedirect(currentRoute, userRole);
};

// ⭐ EXPORT: Everything needed throughout the app
export default {
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
};