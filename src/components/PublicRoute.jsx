// 🚨 DO NOT MODIFY WITHOUT REVIEW - Login flow and layout is stable
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { getDefaultRoute, getLoginRedirect } from '@/utils/accessControl';
import { AuthLoader } from '@/components/FullPageLoader.jsx';

/**
 * Enhanced PublicRoute with intended route handling
 * Redirects authenticated users away from login/signup pages
 * Preserves intended destination for post-login redirect
 */
const PublicRoute = ({ children, allowAuthenticatedUsers = false }) => {
  const { user, authReady, loading } = useAuth();
  const location = useLocation();

  console.log('🔍 PublicRoute render:', {
    user: user?.email || null,
    userId: user?.id || null,
    userRole: user?.role || null,
    authReady,
    loading,
    pathname: location.pathname,
    allowAuthenticatedUsers,
    timestamp: new Date().toISOString()
  });

  // ⭐ LOADING: Show loader while auth state is being determined
  if (!authReady || loading) {
    console.log('⏳ PublicRoute: Auth not ready, showing loader...');
    return <AuthLoader message="Checking authentication..." />;
  }

  // ⭐ SPECIAL: Some public routes might allow authenticated users
  if (allowAuthenticatedUsers) {
    console.log('✅ PublicRoute: Allowing authenticated users on this route');
    return children;
  }

  // ⭐ REDIRECT: If user is logged in, redirect to appropriate dashboard
  if (user) {
    console.log('👤 PublicRoute: User authenticated, checking redirect logic...', {
      pathname: location.pathname,
      searchParams: location.search,
      userRole: user.role
    });

    // ⭐ SPECIAL CASE: Allow users to stay on signup success page
    if (location.pathname === '/signup' && location.search.includes('success=true')) {
      console.log('✅ PublicRoute: Allowing user to stay on signup success page');
      return children;
    }

    // Check if there's an intended destination from location state
    const intendedRoute = location.state?.from?.pathname;

    let redirectTo;
    if (intendedRoute && intendedRoute !== location.pathname) {
      // Use smart redirect that considers intended route
      redirectTo = getLoginRedirect(user, intendedRoute);
      console.log('🎯 PublicRoute: Redirecting to intended route:', redirectTo);
    } else {
      // Use default role-based redirect
      redirectTo = getDefaultRoute(user.role);
      console.log('🎯 PublicRoute: Redirecting to default route:', redirectTo);
    }

    return <Navigate to={redirectTo} replace />;
  }

  // ⭐ RENDER: User not logged in, show public page
  console.log('🔓 PublicRoute: User not authenticated, showing public content');
  return children;
};

export default PublicRoute;