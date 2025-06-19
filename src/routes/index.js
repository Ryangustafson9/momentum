import { staffRoutes } from './staffRoutes.jsx';
import { adminRoutes } from './adminRoutes.jsx';
import { memberRoutes } from './memberRoutes.jsx';

/**
 * Central export for all route configurations
 */
export {
  staffRoutes,
  adminRoutes,
  memberRoutes
};

/**
 * Get all routes for a specific role
 * @param {string} role - User role
 * @returns {Array} Array of route objects
 */
export const getRoutesForRole = (role) => {
  switch (role) {
    case 'admin':
      return adminRoutes;
    case 'staff':
      return staffRoutes;
    case 'member':
      return memberRoutes;
    default:
      return [];
  }
};

/**
 * Get route titles for navigation
 * @param {Array} routes - Route array
 * @returns {Array} Array of route titles
 */
export const getRouteTitles = (routes) => {
  return routes
    .filter(route => route.path !== '*')
    .map(route => ({
      path: route.path,
      title: route.title,
      description: route.description,
      lazy: route.lazy || false,
      heavy: route.heavy || false
    }));
};

/**
 * Get all available routes as a flat array
 * @returns {Array} All routes from all roles
 */
export const getAllRoutes = () => {
  return [
    ...staffRoutes,
    ...adminRoutes,
    ...memberRoutes
  ];
};

/**
 * Find a route by path across all roles
 * @param {string} path - Route path to find
 * @returns {Object|null} Route object or null if not found
 */
export const findRouteByPath = (path) => {
  const allRoutes = getAllRoutes();
  return allRoutes.find(route => route.path === path) || null;
};

/**
 * Get lazy-loaded routes only
 * @returns {Array} Routes that use lazy loading
 */
export const getLazyRoutes = () => {
  return getAllRoutes().filter(route => route.lazy === true);
};

/**
 * Get heavy routes (charts, analytics, etc.)
 * @returns {Array} Routes marked as heavy
 */
export const getHeavyRoutes = () => {
  return getAllRoutes().filter(route => route.heavy === true);
};

export default {
  staffRoutes,
  adminRoutes,
  memberRoutes,
  getRoutesForRole,
  getRouteTitles,
  getAllRoutes,
  findRouteByPath,
  getLazyRoutes,
  getHeavyRoutes
};
