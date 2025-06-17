import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole, canAccessRoute } from '@/utils/roleUtils';
import { getGeneralSettings } from '@/utils/settingsUtils'; // Import the settings function
import { validateRouteAccess } from '@/utils/routeUtils';

/**
 * PrivateRoute component - Protects routes that require authentication
 * Supports hierarchical role system: admin > staff > member
 * Handles nonmember redirection based on settings
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, authReady } = useAuth(); // Remove loading state
  const location = useLocation();
  const [settings, setSettings] = useState({ NonmemberSignupPrompt: false });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings for nonmember handling
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const generalSettings = await getGeneralSettings();
        if (generalSettings) {
          setSettings(generalSettings);
        }
      } catch (error) {
        console.error('Error loading settings in PrivateRoute:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Show loading spinner while authentication state is being determined
  if (!authReady || !settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!authReady ? 'Authenticating...' : 'Loading settings...'}
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    console.log('🔒 User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedRole = normalizeRole(user.role);
  const routeValidation = validateRouteAccess(normalizedRole, location.pathname);

  // Check route access using route utils
  if (!routeValidation.hasAccess) {
    console.log(`🚫 Access denied for ${normalizedRole} to ${location.pathname}`);
    console.log(`🔄 Redirecting to: ${routeValidation.redirectTo}`);
    return <Navigate to={routeValidation.redirectTo} replace />;
  }

  // FIXED: Handle nonmember users BEFORE role checking
  if (user && (user.role === 'nonmember' || user.role === 'inactive' || !user.role)) {
    console.log(`👤 User role '${user.role || 'undefined'}' identified as nonmember`);
    
    // If we're already on the dashboard, don't redirect again
    if (location.pathname === '/dashboard') {
      console.log('✅ Already on dashboard, allowing access');
      return children;
    }
    
    if (settings.NonmemberSignupPrompt) {
      console.log('🔄 Redirecting nonmember to signup prompt');
      return <Navigate to="/nonmember-prompt" replace />;
    } else {
      console.log('🔄 Redirecting nonmember to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If allowedRoles is specified, do additional check
  if (allowedRoles.length > 0 && !allowedRoles.includes(normalizedRole)) {
    console.log(`🚫 Role ${normalizedRole} not in allowed roles: ${allowedRoles}`);
    return <Navigate to={routeValidation.redirectTo} replace />;
  }

  // User is authenticated and has permission
  console.log('✅ User authenticated and authorized:', normalizedRole);
  return children;
};

export default PrivateRoute;


