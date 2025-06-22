// 🚨 DO NOT MODIFY WITHOUT REVIEW - Login flow and layout is stable
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

  

  // ⭐ LOADING: Show loader while auth state is being determined
  if (!authReady || loading) {
    
    return <AuthLoader message="Checking authentication..." />;
  }

  // ⭐ SPECIAL: Some public routes might allow authenticated users
  if (allowAuthenticatedUsers) {
    
    return children;
  }

  // ⭐ REDIRECT: If user is logged in, redirect to appropriate dashboard
  if (user) {
    

    // ⭐ SPECIAL CASE: Allow users to stay on signup success page
    if (location.pathname === '/signup' && location.search.includes('success=true')) {
      
      return children;
    }

    // Check if there's an intended destination from location state
    const intendedRoute = location.state?.from?.pathname;

    let redirectTo;
    if (intendedRoute && intendedRoute !== location.pathname) {
      // Use smart redirect that considers intended route
      redirectTo = getLoginRedirect(user, intendedRoute);
      
    } else {
      // Use default role-based redirect
      redirectTo = getDefaultRoute(user.role);
      
    }

    return <Navigate to={redirectTo} replace />;
  }

  // ⭐ RENDER: User not logged in, show public page
  
  return children;
};

export default PublicRoute;

