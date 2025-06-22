import { getUserPermissions, hasPermission } from '@/utils/accessControl';

/**
 * ⭐ FILTER: Filter array items based on user permissions
 * @param {Array} items - Items to filter
 * @param {string} userRole - User's role
 * @param {Function} permissionGetter - Function to get required permission from item
 * @returns {Array} Filtered items
 */
export const filterByPermission = (items, userRole, permissionGetter) => {
  return items.filter(item => {
    const requiredPermission = permissionGetter(item);
    if (!requiredPermission) return true; // No permission required
    return hasPermission(userRole, requiredPermission);
  });
};

/**
 * ⭐ MENU: Filter menu items by permissions
 * @param {Array} menuItems - Menu items with requiredPermission property
 * @param {string} userRole - User's role
 * @returns {Array} Filtered menu items
 */
export const filterMenuByPermissions = (menuItems, userRole) => {
  return filterByPermission(menuItems, userRole, item => item.requiredPermission);
};

/**
 * ⭐ ACTIONS: Filter action buttons by permissions
 * @param {Array} actions - Action objects with permission property
 * @param {string} userRole - User's role
 * @returns {Array} Filtered actions
 */
export const filterActionsByPermissions = (actions, userRole) => {
  return filterByPermission(actions, userRole, action => action.permission);
};

export default {
  filterByPermission,
  filterMenuByPermissions,
  filterActionsByPermissions,
};

