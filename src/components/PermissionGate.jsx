import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * ⭐ MAIN: Component that renders children based on permissions
 * @param {Object} props - Component props
 * @param {string|Array} props.permission - Permission(s) to check
 * @param {string} props.logic - 'and' or 'or' for multiple permissions (default: 'and')
 * @param {string|Array} props.role - Required role(s)
 * @param {React.ReactNode} props.children - Content to render if allowed
 * @param {React.ReactNode} props.fallback - Content to render if not allowed
 * @param {boolean} props.showFallback - Whether to show fallback content (default: false)
 * @returns {React.ReactNode} Conditional content
 */
export const PermissionGate = ({ 
  permission = null,
  logic = 'and',
  role = null,
  children,
  fallback = null,
  showFallback = false 
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, role: userRole } = usePermissions();

  let hasAccess = true;

  // ⭐ PERMISSION: Check permission-based access
  if (permission) {
    if (Array.isArray(permission)) {
      if (logic === 'or') {
        hasAccess = hasAnyPermission(...permission);
      } else {
        hasAccess = hasAllPermissions(...permission);
      }
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  // ⭐ ROLE: Check role-based access
  if (role && hasAccess) {
    if (Array.isArray(role)) {
      hasAccess = role.includes(userRole);
    } else {
      hasAccess = userRole === role;
    }
  }

  // ⭐ RENDER: Conditional rendering
  if (hasAccess) {
    return children;
  }

  if (showFallback && fallback) {
    return fallback;
  }

  return null;
};

/**
 * ⭐ ADMIN: Component for admin-only content
 */
export const AdminOnly = ({ children, fallback = null, showFallback = false }) => (
  <PermissionGate 
    role="admin" 
    fallback={fallback} 
    showFallback={showFallback}
  >
    {children}
  </PermissionGate>
);

/**
 * ⭐ STAFF: Component for staff+ content
 */
export const StaffOnly = ({ children, fallback = null, showFallback = false }) => (
  <PermissionGate 
    role={['staff', 'admin']} 
    logic="or"
    fallback={fallback} 
    showFallback={showFallback}
  >
    {children}
  </PermissionGate>
);

/**
 * ⭐ MEMBER: Component for member+ content
 */
export const MemberOnly = ({ children, fallback = null, showFallback = false }) => (
  <PermissionGate 
    role={['member', 'staff', 'admin']} 
    logic="or"
    fallback={fallback} 
    showFallback={showFallback}
  >
    {children}
  </PermissionGate>
);

/**
 * ⭐ PERMISSION: Component for specific permission checks
 */
export const RequirePermission = ({ permission, children, fallback = null, showFallback = false }) => (
  <PermissionGate 
    permission={permission}
    fallback={fallback} 
    showFallback={showFallback}
  >
    {children}
  </PermissionGate>
);

export default PermissionGate;
