/**
 * INTERNAL: Route definitions - DO NOT IMPORT DIRECTLY
 * Import from @/utils/accessControl instead
 * 
 * This file contains pure route structure definitions and UI helpers
 * NO LOGIC - only data structures and helper functions for UI components
 */

/**
 * ⭐ PURE: Route structure definitions (no logic)
 * Used for generating navigation menus, breadcrumbs, etc.
 */
export const ROUTES = {
  // Public routes (no authentication required)
  PUBLIC: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    HOME: '/',
    ABOUT: '/about',
    CONTACT: '/contact',
  },

  // General authenticated routes
  GENERAL: {
    DASHBOARD: '/dashboard',           // Nonmember/general landing page
    PROFILE: '/profile',
    SETTINGS: '/settings',
    HELP: '/help',
    SUPPORT: '/support',
  },

  // Member-specific routes
  MEMBER: {
    DASHBOARD: '/member/memberdashboard',
    CLASSES: '/member/classes',
    BILLING: '/member/billing',
    PROFILE: '/member/profile',
    SCHEDULE: '/member/schedule',
    BOOKINGS: '/member/bookings',
    HISTORY: '/member/history',
    PAYMENTS: '/member/payments',
  },

  // Staff-specific routes
  STAFF: {
    DASHBOARD: '/staff/staffdashboard',
    MEMBERS: '/staff/members',
    CLASSES: '/staff/classes',
    REPORTS: '/staff/reports',
    SETTINGS: '/staff/settings',
    CHECKIN: '/staff/check-in',
    SCHEDULE: '/staff/schedule',
    MEMBERSHIPS: '/staff/memberships',
    TRAINERS: '/staff/trainers',
    EQUIPMENT: '/staff/equipment',
  },

  // Admin routes (extends staff routes)
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    SETTINGS: '/admin/settings',
    MEMBERS: '/admin/members',
    REPORTS: '/admin/reports',
    USERS: '/admin/users',
    SYSTEM: '/admin/system',
    BILLING: '/admin/billing',
    ANALYTICS: '/admin/analytics',
    LOGS: '/admin/logs',
    BACKUP: '/admin/backup',
  },
};

/**
 * ⭐ ENHANCED: Route metadata for UI components
 * Used for navigation menus, breadcrumbs, page titles
 */
export const ROUTE_METADATA = {
  // Public routes
  [ROUTES.PUBLIC.LOGIN]: {
    title: 'Sign In',
    description: 'Sign in to your account',
    requiresAuth: false,
    showInNav: false,
    icon: 'log-in',
    order: 0,
  },
  [ROUTES.PUBLIC.SIGNUP]: {
    title: 'Create Account',
    description: 'Create a new account',
    requiresAuth: false,
    showInNav: false,
    icon: 'user-plus',
    order: 1,
  },
  [ROUTES.PUBLIC.HOME]: {
    title: 'Home',
    description: 'Welcome to our gym',
    requiresAuth: false,
    showInNav: true,
    icon: 'home',
    order: 0,
  },

  // General routes
  [ROUTES.GENERAL.DASHBOARD]: {
    title: 'Dashboard',
    description: 'Overview and quick actions',
    requiresAuth: true,
    showInNav: true,
    icon: 'dashboard',
    order: 1,
  },
  [ROUTES.GENERAL.PROFILE]: {
    title: 'Profile',
    description: 'Manage your profile',
    requiresAuth: true,
    showInNav: true,
    icon: 'user',
    order: 90,
  },
  [ROUTES.GENERAL.SETTINGS]: {
    title: 'Settings',
    description: 'Account settings',
    requiresAuth: true,
    showInNav: true,
    icon: 'settings',
    order: 95,
  },

  // Member routes
  [ROUTES.MEMBER.DASHBOARD]: {
    title: 'Member Dashboard',
    description: 'Your member overview',
    requiresAuth: true,
    requiredRole: 'member',
    showInNav: true,
    icon: 'home',
    order: 1,
    category: 'member',
  },
  [ROUTES.MEMBER.CLASSES]: {
    title: 'Classes',
    description: 'Browse and book classes',
    requiresAuth: true,
    requiredRole: 'member',
    showInNav: true,
    icon: 'calendar',
    order: 10,
    category: 'member',
  },
  [ROUTES.MEMBER.SCHEDULE]: {
    title: 'Schedule',
    description: 'View class schedule',
    requiresAuth: true,
    requiredRole: 'member',
    showInNav: true,
    icon: 'clock',
    order: 15,
    category: 'member',
  },
  [ROUTES.MEMBER.BOOKINGS]: {
    title: 'My Bookings',
    description: 'Manage your bookings',
    requiresAuth: true,
    requiredRole: 'member',
    showInNav: true,
    icon: 'bookmark',
    order: 20,
    category: 'member',
  },
  [ROUTES.MEMBER.BILLING]: {
    title: 'Billing',
    description: 'Manage payments and invoices',
    requiresAuth: true,
    requiredRole: 'member',
    showInNav: true,
    icon: 'credit-card',
    order: 80,
    category: 'member',
  },

  // Staff routes
  [ROUTES.STAFF.DASHBOARD]: {
    title: 'Staff Dashboard',
    description: 'Staff overview and tools',
    requiresAuth: true,
    requiredRole: 'staff',
    showInNav: true,
    icon: 'briefcase',
    order: 1,
    category: 'staff',
  },
  [ROUTES.STAFF.MEMBERS]: {
    title: 'Members',
    description: 'Manage gym members',
    requiresAuth: true,
    requiredRole: 'staff',
    showInNav: true,
    icon: 'users',
    order: 10,
    category: 'staff',
  },
  [ROUTES.STAFF.CHECKIN]: {
    title: 'Check-In',
    description: 'Member check-in system',
    requiresAuth: true,
    requiredRole: 'staff',
    showInNav: true,
    icon: 'check',
    order: 5,
    category: 'staff',
  },
  [ROUTES.STAFF.CLASSES]: {
    title: 'Class Management',
    description: 'Manage classes and schedules',
    requiresAuth: true,
    requiredRole: 'staff',
    showInNav: true,
    icon: 'calendar-plus',
    order: 15,
    category: 'staff',
  },
  [ROUTES.STAFF.REPORTS]: {
    title: 'Reports',
    description: 'View reports and analytics',
    requiresAuth: true,
    requiredRole: 'staff',
    showInNav: true,
    icon: 'bar-chart',
    order: 70,
    category: 'staff',
  },

  // Admin routes
  [ROUTES.ADMIN.DASHBOARD]: {
    title: 'Admin Dashboard',
    description: 'System administration',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
    icon: 'shield',
    order: 1,
    category: 'admin',
  },
  [ROUTES.ADMIN.USERS]: {
    title: 'User Management',
    description: 'Manage system users',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
    icon: 'user-cog',
    order: 10,
    category: 'admin',
  },
  [ROUTES.ADMIN.SYSTEM]: {
    title: 'System Settings',
    description: 'Configure system settings',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
    icon: 'server',
    order: 80,
    category: 'admin',
  },
  [ROUTES.ADMIN.ANALYTICS]: {
    title: 'Analytics',
    description: 'Detailed analytics and insights',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
    icon: 'trending-up',
    order: 60,
    category: 'admin',
  },
  [ROUTES.ADMIN.LOGS]: {
    title: 'System Logs',
    description: 'View system logs',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: false,
    icon: 'file-text',
    order: 90,
    category: 'admin',
  },
};

/**
 * ⭐ HELPER: Get route metadata
 * @param {string} route - Route path
 * @returns {Object} Route metadata
 */
export const getRouteMetadata = (route) => {
  return ROUTE_METADATA[route] || {
    title: 'Page',
    description: '',
    requiresAuth: true,
    showInNav: false,
    icon: 'file',
    order: 100,
  };
};

/**
 * ⭐ HELPER: Get navigation routes for a role
 * @param {string} role - User role
 * @returns {Array} Array of navigation items
 */
export const getNavigationRoutes = (role) => {
  // Dynamic import to avoid circular dependency
  let canAccessRoute;
  try {
    canAccessRoute = require('../accessControl').canAccessRoute;
  } catch (error) {
    console.warn('Cannot import canAccessRoute, using fallback');
    canAccessRoute = () => true; // Fallback for development
  }
  
  return Object.entries(ROUTE_METADATA)
    .filter(([route, metadata]) => {
      // Must show in nav and be accessible to role
      return metadata.showInNav && canAccessRoute(route, role);
    })
    .map(([route, metadata]) => ({
      path: route,
      ...metadata,
    }))
    .sort((a, b) => {
      // Sort by category first, then by order
      if (a.category !== b.category) {
        const categoryOrder = { member: 1, staff: 2, admin: 3 };
        return (categoryOrder[a.category] || 4) - (categoryOrder[b.category] || 4);
      }
      return (a.order || 100) - (b.order || 100);
    });
};

/**
 * ⭐ HELPER: Get navigation grouped by category
 * @param {string} role - User role
 * @returns {Object} Navigation grouped by category
 */
export const getGroupedNavigationRoutes = (role) => {
  const routes = getNavigationRoutes(role);
  
  return routes.reduce((groups, route) => {
    const category = route.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(route);
    return groups;
  }, {});
};

/**
 * ⭐ HELPER: Get breadcrumb trail for a route
 * @param {string} route - Current route
 * @returns {Array} Breadcrumb items
 */
export const getBreadcrumbs = (route) => {
  const parts = route.split('/').filter(Boolean);
  const breadcrumbs = [{ path: '/', title: 'Home' }];
  
  let currentPath = '';
  parts.forEach(part => {
    currentPath += `/${part}`;
    const metadata = getRouteMetadata(currentPath);
    breadcrumbs.push({
      path: currentPath,
      title: metadata.title,
      icon: metadata.icon,
    });
  });
  
  return breadcrumbs;
};

/**
 * ⭐ HELPER: Validate route format
 * @param {string} route - Route to validate
 * @returns {boolean} Is valid route format
 */
export const isValidRouteFormat = (route) => {
  if (!route || typeof route !== 'string') return false;
  if (!route.startsWith('/')) return false;
  if (route.includes('//')) return false;
  if (route.includes(' ')) return false;
  return true;
};

/**
 * ⭐ HELPER: Get all routes for a specific role category
 * @param {string} category - Route category ('member', 'staff', 'admin')
 * @returns {Array} Array of routes in category
 */
export const getRoutesByCategory = (category) => {
  return Object.entries(ROUTE_METADATA)
    .filter(([route, metadata]) => metadata.category === category)
    .map(([route, metadata]) => ({
      path: route,
      ...metadata,
    }))
    .sort((a, b) => (a.order || 100) - (b.order || 100));
};

/**
 * ⭐ HELPER: Check if route is in a specific section
 * @param {string} route - Route to check
 * @param {string} section - Section to check ('member', 'staff', 'admin')
 * @returns {boolean} Is route in section
 */
export const isRouteInSection = (route, section) => {
  return route.startsWith(`/${section}/`);
};

/**
 * ⭐ HELPER: Get section from route
 * @param {string} route - Route to analyze
 * @returns {string} Section name or 'general'
 */
export const getRouteSection = (route) => {
  const parts = route.split('/').filter(Boolean);
  if (parts.length === 0) return 'general';
  
  const firstPart = parts[0];
  if (['member', 'staff', 'admin'].includes(firstPart)) {
    return firstPart;
  }
  
  return 'general';
};

export default {
  ROUTES,
  ROUTE_METADATA,
  getRouteMetadata,
  getNavigationRoutes,
  getGroupedNavigationRoutes,
  getBreadcrumbs,
  isValidRouteFormat,
  getRoutesByCategory,
  isRouteInSection,
  getRouteSection,
};