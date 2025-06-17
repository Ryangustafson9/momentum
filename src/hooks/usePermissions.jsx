/**
 * 🔐 USE PERMISSIONS HOOK
 * Enhanced React hook for checking user permissions throughout the application
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
} from '@/lib/services/permissionService';
import { normalizeRole } from '@/utils/accessControl';
import { Lock } from 'lucide-react';

export const usePermissions = () => {
  const { user } = useAuthQuery();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==================== FETCH PERMISSIONS ====================

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userPermissions = await getUserPermissions(user.id);
      setPermissions(userPermissions);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err.message);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // ==================== PERMISSION CHECKERS ====================

  /**
   * Check if user has a specific permission
   */
  const can = useCallback((permission) => {
    if (!user) return false;

    // Admin users have all permissions
    if (user.role === 'admin') return true;

    return permissions[permission] === true;
  }, [user, permissions]);

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = useCallback((permissionList) => {
    if (!user) return false;

    // Admin users have all permissions
    if (user.role === 'admin') return true;

    return permissionList.some(permission => permissions[permission] === true);
  }, [user, permissions]);

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = useCallback((permissionList) => {
    if (!user) return false;

    // Admin users have all permissions
    if (user.role === 'admin') return true;

    return permissionList.every(permission => permissions[permission] === true);
  }, [user, permissions]);

  // ==================== LEGACY COMPATIBILITY ====================

  // Maintain compatibility with existing code
  const checkPermission = (permission) => can(permission);
  const checkAllPermissions = (...permissionList) => canAll(permissionList);
  const checkAnyPermission = (...permissionList) => canAny(permissionList);

  // ⭐ ROLE: Helper functions for common role checks
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff' || isAdmin;
  const isMember = ['member', 'staff', 'admin'].includes(role);
  const isNonMember = role === 'nonmember';
  const isInactive = role === 'inactive';

  /**
   * Refresh permissions (useful after role changes)
   */
  const refreshPermissions = useCallback(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // ==================== RETURN VALUES ====================

  return {
    // Permission data
    permissions,
    loading,
    error,

    // New permission checkers
    can,
    canAny,
    canAll,

    // Legacy permission checking functions (for compatibility)
    hasPermission: checkPermission,
    hasAllPermissions: checkAllPermissions,
    hasAnyPermission: checkAnyPermission,

    // Role helpers
    role,
    isAdmin,
    isStaff,
    isMember,
    isNonMember,
    isInactive,

    // Utilities
    refreshPermissions,

    // Enhanced permission shortcuts
    canManageMembers: can('manage_members'),
    canViewMembers: can('view_members'),
    canManageClasses: can('manage_classes'),
    canManageBilling: can('manage_billing'),
    canViewReports: can('view_reports'),
    canManageStaff: can('manage_staff'),
    canManageSettings: can('manage_settings'),
    canCheckInMembers: can('member_checkin'),
    canImpersonateMembers: can('impersonate_members'),
    canProcessPayments: can('process_payments'),
    canManageSchedule: can('manage_schedule'),
    canTrackAttendance: can('track_attendance'),

    // Legacy shortcuts (for compatibility)
    canManageUsers: checkPermission('canManageUsers'),
    canBookClasses: checkPermission('canBookClasses'),
    canEditProfile: checkPermission('canEditProfile'),
    canViewDashboard: checkPermission('canViewDashboard'),
    canAccessAdminPanel: checkPermission('canAccessAdminPanel'),
  };
};

/**
 * ⭐ SPECIFIC: Hook for a single permission check
 * @param {string} permission - Permission to check
 * @returns {boolean} Has permission
 */
export const usePermission = (permission) => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};

/**
 * ⭐ MULTIPLE: Hook for multiple permission checks (AND logic)
 * @param {...string} permissions - Permissions to check
 * @returns {boolean} Has all permissions
 */
export const useAllPermissions = (...permissions) => {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(...permissions);
};

/**
 * ⭐ MULTIPLE: Hook for multiple permission checks (OR logic)
 * @param {...string} permissions - Permissions to check
 * @returns {boolean} Has any permission
 */
export const useAnyPermission = (...permissions) => {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(...permissions);
};

/**
 * ⭐ ROLE: Hook for role-based checks
 * @returns {Object} Role checking functions
 */
export const useRole = () => {
  const { role, isAdmin, isStaff, isMember, isNonMember, isInactive } = usePermissions();
  
  return {
    role,
    isAdmin,
    isStaff,
    isMember,
    isNonMember,
    isInactive,
  };
};

// ==================== PERMISSION COMPONENT ====================

/**
 * Component wrapper for conditional rendering based on permissions
 */
export const PermissionGate = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}) => {
  const { can, canAny, canAll } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  return hasAccess ? children : fallback;
};

// ==================== PERMISSION UTILITIES ====================

/**
 * Higher-order component for permission-based access control
 */
export const withPermissions = (requiredPermissions, requireAll = false) => {
  return (WrappedComponent) => {
    return (props) => {
      const { canAny, canAll } = usePermissions();

      const hasAccess = requireAll
        ? canAll(requiredPermissions)
        : canAny(requiredPermissions);

      if (!hasAccess) {
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600">
                You don't have permission to access this feature.
              </p>
            </div>
          </div>
        );
      }

      return <WrappedComponent {...props} />;
    };
  };
};

export default usePermissions;