import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { getNavigationRoutes } from '@/utils/accessControl';
import { cn } from '@/lib/utils';

/**
 * ⭐ SMART: Navigation component that shows only accessible routes
 */
export const PermissionNavigation = ({ className = '', itemClassName = '' }) => {
  const { role } = usePermissions();
  const location = useLocation();
  
  // ⭐ GET: Only routes accessible to user's role
  const navigationRoutes = getNavigationRoutes(role);
  
  if (!navigationRoutes.length) {
    return null;
  }

  return (
    <nav className={cn('flex flex-col space-y-1', className)}>
      {navigationRoutes.map((route) => {
        const isActive = location.pathname === route.path;
        
        return (
          <Link
            key={route.path}
            to={route.path}
            className={cn(
              'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              itemClassName
            )}
          >
            {route.icon && (
              <span className="mr-3 text-lg">
                {/* You can replace this with actual icon components */}
                📁
              </span>
            )}
            <span>{route.title}</span>
          </Link>
        );
      })}
    </nav>
  );
};

/**
 * ⭐ GROUPED: Navigation with role-based sections
 */
export const GroupedPermissionNavigation = ({ className = '' }) => {
  const { role } = usePermissions();
  const location = useLocation();
  
  const navigationRoutes = getNavigationRoutes(role);
  
  // ⭐ GROUP: Routes by category
  const groupedRoutes = navigationRoutes.reduce((groups, route) => {
    const category = route.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(route);
    return groups;
  }, {});

  const categoryTitles = {
    general: 'General',
    member: 'Member',
    staff: 'Staff',
    admin: 'Administration'
  };

  return (
    <nav className={cn('space-y-6', className)}>
      {Object.entries(groupedRoutes).map(([category, routes]) => (
        <div key={category}>
          <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {categoryTitles[category] || category}
          </h3>
          <div className="space-y-1">
            {routes.map((route) => {
              const isActive = location.pathname === route.path;
              
              return (
                <Link
                  key={route.path}
                  to={route.path}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {route.icon && (
                    <span className="mr-3 text-lg">
                      📁
                    </span>
                  )}
                  <span>{route.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
};

export default PermissionNavigation;
