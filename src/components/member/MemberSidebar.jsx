
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';

const MemberSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/member/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      )
    },
    { 
      name: 'Profile', 
      href: '/member/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      name: 'Classes', 
      href: '/member/classes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: 'Billing', 
      href: '/member/billing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
  ];

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
      <div className="p-6">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Momentum</h1>
          <p className="text-sm text-gray-500">Fitness Dashboard</p>
        </div>

        {/* User Info */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-lg">
                {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email?.split('@')[0] || 'Member'
                }
              </p>
              <p className="text-sm text-gray-500">Member</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`sidebar-nav-item ${
                  isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item-inactive'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="sidebar-nav-item text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberSidebar;