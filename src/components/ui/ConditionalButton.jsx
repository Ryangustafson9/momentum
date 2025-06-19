import React from 'react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * ⭐ SMART: Button that shows/hides based on permissions
 * @param {Object} props - Button props + permission props
 * @param {string|Array} props.permission - Required permission(s)
 * @param {string|Array} props.role - Required role(s)
 * @param {string} props.logic - 'and' or 'or' for multiple permissions
 * @param {boolean} props.hideIfNoAccess - Hide button if no access (default: true)
 * @param {boolean} props.disableIfNoAccess - Disable button if no access (default: false)
 * @param {string} props.noAccessText - Text to show when disabled
 * @param {...Object} buttonProps - All other button props
 */
export const ConditionalButton = ({
  permission = null,
  role = null,
  logic = 'and',
  hideIfNoAccess = true,
  disableIfNoAccess = false,
  noAccessText = 'No Permission',
  children,
  ...buttonProps
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

  // ⭐ HIDE: Don't render if no access and hideIfNoAccess is true
  if (!hasAccess && hideIfNoAccess) {
    return null;
  }

  // ⭐ DISABLE: Render disabled button
  if (!hasAccess && disableIfNoAccess) {
    return (
      <Button 
        {...buttonProps} 
        disabled={true}
        title={noAccessText}
      >
        {noAccessText}
      </Button>
    );
  }

  // ⭐ RENDER: Normal button
  return (
    <Button {...buttonProps}>
      {children}
    </Button>
  );
};

export default ConditionalButton;
