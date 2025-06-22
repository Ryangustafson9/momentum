import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

// ⭐ FIXED: Import from accessControl instead of roleUtils
import {
  canAccessRoute,
  getDefaultRoute,
  normalizeRole,
  hasAdminAccess,
  hasStaffAccess,
  hasMemberAccess,
  getUnauthorizedRedirect
} from '@/utils/accessControl';

/**
 * ⭐ HOOK: Route access validation and redirection logic
 * @returns {Object} Route access information and helper functions
 */
export const useRouteAccess = () => {
  const { user } = useAuth();
  const location = useLocation();

  // ⭐ MEMOIZED: Calculate route access data
  const routeAccess = useMemo(() => {
    const currentPath = location.pathname;
    const userRole = normalizeRole(user?.role);

    // Check access permissions
    const canAccess = user ? canAccessRoute(currentPath, userRole) : false;
    const isAdmin = hasAdminAccess(userRole);
    const isStaff = hasStaffAccess(userRole);
    const isMember = hasMemberAccess(userRole);

    // Get redirect paths
    const defaultRoute = getDefaultRoute(userRole);
    const unauthorizedRedirect = getUnauthorizedRedirect(currentPath, userRole);

    return {
      currentPath,
      userRole,
      canAccess,
      isAdmin,
      isStaff,
      isMember,
      defaultRoute,
      unauthorizedRedirect,
      user: user || null
    };
  }, [user, location.pathname]);

  return routeAccess;
};

/**
 * ⭐ HOOK: Simple route access check
 * @param {string} routePath - Optional specific route to check (defaults to current)
 * @returns {boolean} Can user access the route
 */
export const useCanAccessRoute = (routePath = null) => {
  const { user } = useAuth();
  const location = useLocation();
  
  return useMemo(() => {
    const pathToCheck = routePath || location.pathname;
    const userRole = normalizeRole(user?.role);
    return user ? canAccessRoute(pathToCheck, userRole) : false;
  }, [user, location.pathname, routePath]);
};

/**
 * ⭐ HOOK: Role-based checks
 * @returns {Object} Role checking functions
 */
export const useRoleChecks = () => {
  const { user } = useAuth();
  
  return useMemo(() => {
    const userRole = normalizeRole(user?.role);
    
    return {
      isAdmin: hasAdminAccess(userRole),
      isStaff: hasStaffAccess(userRole),
      isMember: hasMemberAccess(userRole),
      role: userRole,
      isAuthenticated: !!user
    };
  }, [user]);
};

export default useRouteAccess;

