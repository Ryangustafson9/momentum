/**
 * 📱 MOBILE BOTTOM NAVIGATION
 * Touch-friendly bottom navigation for mobile devices
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Settings,
  User,
  Activity,
  CreditCard,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMobile } from '@/hooks/useResponsive';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from 'react-error-boundary';

const MobileBottomNavigationContent = ({ className = '' }) => {
  const { isMobile } = useMobile();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on desktop or if no user
  if (!isMobile || !user) return null;

  // Different navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        id: 'home',
        label: 'Home',
        icon: Home,
        path: user.role === 'member' ? '/member-portal/dashboard' : '/staff-portal/dashboard',
      },
    ];

    if (user.role === 'member') {
      return [
        ...baseItems,
        {
          id: 'classes',
          label: 'Classes',
          icon: Calendar,
          path: '/member/classes',
        },
        {
          id: 'activity',
          label: 'Activity',
          icon: Activity,
          path: '/member/activity',
        },
        {
          id: 'billing',
          label: 'Billing',
          icon: CreditCard,
          path: '/member/billing',
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          path: '/member/profile',
        },
      ];
    } else {
      // Staff/Admin navigation
      return [
        ...baseItems,
        {
          id: 'classes',
          label: 'Classes',
          icon: Calendar,
          path: '/staff-portal/classes',
        },
        {
          id: 'notifications',
          label: 'Alerts',
          icon: Bell,
          path: '/staff-portal/notifications',
          badge: unreadCount > 0 ? unreadCount : null,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/staff-portal/settings',
        },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (item) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    navigate(item.path);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white/95 backdrop-blur-md border-t border-gray-200',
        'safe-area-pb', // Handle safe area for devices with home indicators
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-w-[60px] py-2 px-3 rounded-lg',
                'transition-all duration-200',
                'touch-manipulation select-none',
                active 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Icon with badge */}
              <div className="relative">
                <Icon 
                  className={cn(
                    'h-5 w-5 transition-all duration-200',
                    active && 'scale-110'
                  )} 
                />
                
                {/* Notification badge */}
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 min-w-4 text-xs p-0 flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              
              {/* Label */}
              <span 
                className={cn(
                  'text-xs font-medium mt-1 transition-all duration-200',
                  active ? 'text-primary' : 'text-gray-600'
                )}
              >
                {item.label}
              </span>
              
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                  transition={{ type: 'spring', duration: 0.3 }}
                />
              )}
            </motion.button>
          );        })}
      </div>
    </motion.nav>
  );
};

const MobileBottomNavigation = (props) => {
  return (
    <ErrorBoundary
      fallback={<div className="hidden">Navigation error</div>}
      onError={(error) => console.error('Mobile navigation error:', error)}
    >
      <MobileBottomNavigationContent {...props} />
    </ErrorBoundary>
  );
};

export default MobileBottomNavigation;

