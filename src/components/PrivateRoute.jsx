import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth as useAuth } from '@/hooks/useUnifiedAuth';
// ⭐ FIXED: Import from accessControl instead of roleUtils
import { 
  normalizeRole, 
  canAccessRoute,
  getUnauthorizedRedirect 
} from '@/utils/accessControl';
import { AuthLoader } from '@/components/FullPageLoader.jsx';

/**
 * PrivateRoute - Authentication and Authorization Guard
 * ⭐ ENHANCED: Now passes location state for smart redirects
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, authReady } = useAuth();
  const location = useLocation();

  console.log('🔐 PrivateRoute check:', {
    user: user?.email || 'none',
    userRole: user?.role || 'none',
    allowedRoles,
    pathname: location.pathname,
    authReady
  });

  // ⭐ WAIT: Auth not ready
  if (!authReady) {
    return <AuthLoader message="Verifying access..." />;
  }

  // ⭐ REDIRECT: No user = login (with location state)
  if (!user) {
    console.log('🚫 No user, redirecting to login with return path:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ⭐ ALLOW: No role restrictions = any authenticated user
  if (allowedRoles.length === 0) {
    console.log('✅ No role restrictions, allowing access');
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
    console.log('🚫 PrivateRoute: Cannot access route');
    const redirectTo = getUnauthorizedRedirect(location.pathname, user.role);
    return <Navigate to={redirectTo} replace />;
  }

  console.log('✅ Access granted');
  return children;
};

export default PrivateRoute;


