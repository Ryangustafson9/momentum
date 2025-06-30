import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
// Import from accessControl instead of roleUtils
import {
  normalizeRole,
  canAccessRoute,
  getUnauthorizedRedirect
} from '@/utils/accessControl';
import { AuthLoader } from '@/components/shared/FullPageLoader';

/**
 * PrivateRoute - Authentication and Authorization Guard
 * ⭐ ENHANCED: Now passes location state for smart redirects
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, authReady } = useAuth();
  const location = useLocation();

  

  // ⭐ WAIT: Auth not ready
  if (!authReady) {
    return <AuthLoader message="Verifying access..." />;
  }

  // ⭐ REDIRECT: No user = login (with location state)
  if (!user) {
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ⭐ ALLOW: No role restrictions = any authenticated user
  if (allowedRoles.length === 0) {
    
    return children;
  }

  // ⭐ CHECK: Role-based access
  const userRole = normalizeRole(user.role || 'member');
  const hasPermission = allowedRoles.includes(userRole);

  if (!hasPermission) {
    const redirectTo = getUnauthorizedRedirect(location.pathname, userRole);
    return <Navigate to={redirectTo} replace />;
  }

  // ⭐ CHECK: Route-specific access
  if (!canAccessRoute(location.pathname, user.role)) {
    
    const redirectTo = getUnauthorizedRedirect(location.pathname, user.role);
    return <Navigate to={redirectTo} replace />;
  }

  
  return children;
};

export default PrivateRoute;



