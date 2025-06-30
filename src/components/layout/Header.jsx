// src/components/Header.jsx
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Import from existing accessControl.js
import {
  getNavigationRoutes,
  getDefaultRoute,
  normalizeRole,
  hasAdminAccess,
  hasStaffAccess
} from '@/utils/accessControl';

const Header = () => {
  const { user, authReady, logout } = useAuth();
  const navigate = useNavigate();
  
  // ⭐ MEMOIZED: Calculate role-based data only when user changes
  const roleData = useMemo(() => {
    if (!user) {
      return {
        userRole: null,
        navigationItems: [],
        defaultRoute: '/login',
        isAdmin: false,
        isStaff: false
      };
    }

    const userRole = normalizeRole(user.role);
    const navigationItems = getNavigationRoutes(userRole);
    const defaultRoute = getDefaultRoute(userRole);
    const isAdmin = hasAdminAccess(userRole);
    const isStaff = hasStaffAccess(userRole);

    return {
      userRole,
      navigationItems,
      defaultRoute,
      isAdmin,
      isStaff
    };
  }, [user]);

  // ⭐ MEMOIZED: User display data
  const userDisplayData = useMemo(() => {
    if (!user) return null;

    return {
      displayName: user.first_name || user.display_name || user.email?.split('@')[0] || 'User',
      roleBadge: roleData.isAdmin ? 'Admin' : roleData.isStaff ? 'Staff' : null,
      badgeColor: roleData.isAdmin ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
    };
  }, [user, roleData.isAdmin, roleData.isStaff]);

  // ⭐ MEMOIZED: Handle logout
  const handleLogout = useMemo(() => async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      
    }
  }, [logout, navigate]);

  return (
    <header className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* ⭐ LOGO: Brand logo only */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center">
            <img
              src="/assets/momentum-logo.svg"
              alt="Momentum Gym"
              className="h-10 w-16 object-contain"
            />
          </Link>
        </div>

        {/* ⭐ NAVIGATION: Quick navigation items for logged-in users */}
        {user && roleData.navigationItems.length > 0 && (
          <nav className="hidden md:flex items-center space-x-6">
            {roleData.navigationItems.slice(0, 4).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-600 hover:text-indigo-600 transition-colors font-medium"
                title={item.description}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        )}
        
        {/* ⭐ USER: User menu and actions */}
        <div className="flex items-center space-x-4">
          {!authReady ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
              <span className="text-gray-500">Loading...</span>
            </div>
          ) : user && userDisplayData ? (
            <>
              {/* ⭐ USER: Welcome message with role badge */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 font-medium">
                  Welcome, {userDisplayData.displayName}!
                </span>
                
                {/* ⭐ ROLE: Role badge */}
                {userDisplayData.roleBadge && (
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${userDisplayData.badgeColor}`}>
                    {userDisplayData.roleBadge}
                  </span>
                )}
              </div>
              
              {/* ⭐ DASHBOARD: Link to user's dashboard */}
              <Link 
                to={roleData.defaultRoute} 
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium"
              >
                Dashboard
              </Link>
              
              {/* ⭐ LOGOUT: Logout button */}
              <button 
                onClick={handleLogout} 
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link 
                to="/login" 
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-medium"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ⭐ MEMOIZED: Prevent unnecessary re-renders
export default React.memo(Header);




