import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole, getDefaultRoute } from '@/utils/roleUtils.js';

/**
 * PublicRoute component - Protects routes that should only be accessible to non-authenticated users
 * Redirects authenticated users to their appropriate dashboard
 */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (user) {
    console.log('👤 User is authenticated, checking if should redirect...');

    // ⭐ SPECIAL CASE: Allow authenticated users to stay on signup page if showing success
    if (location.pathname === '/signup') {
      const urlParams = new URLSearchParams(location.search);
      const showingSuccess = urlParams.get('success') === 'true';

      if (showingSuccess) {
        console.log('🎉 User on signup page with success=true, allowing them to stay');
        return children; // Let them see the success message
      }
    }

    // Get the intended destination from location state, or default to role-based dashboard
    const from = location.state?.from?.pathname;

    if (from && from !== '/login' && from !== '/signup') {
      return <Navigate to={from} replace />;
    }

    // ⭐ FIXED: Use proper role-based routing from roleUtils
    const normalizedRole = normalizeRole(user.role);
    const defaultRoute = getDefaultRoute(normalizedRole);

    console.log('🔄 PublicRoute redirecting authenticated user:', {
      rawRole: user.role,
      normalizedRole,
      defaultRoute
    });

    return <Navigate to={defaultRoute} replace />;
  }

  // User is not authenticated, render the public route
  console.log('🌐 User not authenticated, showing public route');
  return children;
};

export default PublicRoute;