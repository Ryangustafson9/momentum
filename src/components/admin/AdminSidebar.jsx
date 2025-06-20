
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, ChevronLeft, ChevronRight, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { navLinks } from '@/config/adminNavLinks.js';

const SidebarNavLink = ({ to, label, icon: Icon, currentPath, isExpanded, location }) => {
  // Determine if we're in staff or admin context and build the correct path
  const isStaffContext = location.pathname.startsWith('/staff-portal');
  const isAdminContext = location.pathname.startsWith('/admin');

  let linkPath = to;
  if (to === '/') {
    // Dashboard link
    linkPath = isStaffContext ? '/staff-portal/dashboard' : isAdminContext ? '/admin/dashboard' : '/dashboard';
  } else if (!to.startsWith('/staff-portal') && !to.startsWith('/admin')) {
    // Relative links - add context prefix
    if (isStaffContext) {
      linkPath = `/staff-portal${to}`;
    } else if (isAdminContext) {
      linkPath = `/admin${to}`;
    }
  }

  // More precise active state logic to avoid false matches (e.g., /members vs /memberships)
  const isActive = currentPath === linkPath ||
    (linkPath !== "/" && (currentPath.startsWith(linkPath + "/") || currentPath === linkPath));

  return (
    <NavLink
      to={linkPath}
      className={({ isActive: navIsActive }) =>
        cn(
          "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out",
          "hover:bg-indigo-50 hover:text-indigo-700",
          (isActive || navIsActive) ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600",
          !isExpanded && "justify-center"
        )
      }
      title={isExpanded ? "" : label}
    >
      <Icon className={cn("h-5 w-5", isExpanded ? "mr-3" : "mr-0")} />
      {isExpanded && <span>{label}</span>}
      {!isExpanded && <span className="sr-only">{label}</span>}
    </NavLink>
  );
};


const AdminSidebar = ({ onLogout, isExpanded, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleSettingsNavigation = () => {
    navigate('/staff-portal/settings');
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-xl print:hidden",
      isExpanded ? "w-64" : "w-20"
    )}>
      
      <div className={`flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 ${!isExpanded ? 'px-2' : ''}`}>
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center justify-center w-full"
            >
              <img
                src="/assets/momentum-logo.svg"
                alt="Momentum Gym"
                className="w-28 h-20 object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Buttons */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="hidden lg:flex hover:bg-white/50 p-2"
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto bg-white">
        {navLinks.map((link) => (
          <SidebarNavLink
            key={link.to}
            to={link.to}
            label={link.label}
            icon={link.icon}
            currentPath={currentPath}
            isExpanded={isExpanded}
            location={location}
          />
        ))}
      </nav>

      {/* Bottom Section - Settings and Sign Out */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/50">
        <div className={cn("flex items-center gap-2", isExpanded ? "justify-between" : "flex-col space-y-2")}>
          {/* Sign Out Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className={cn(
              "text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200",
              isExpanded ? "flex items-center" : "w-full p-2"
            )}
            title="Sign Out"
          >
            <LogOut className={cn("h-4 w-4", isExpanded ? "mr-2" : "")} />
            {isExpanded && <span className="text-sm">Sign Out</span>}
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettingsNavigation}
            className={cn(
              "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200",
              isExpanded ? "flex items-center" : "w-full p-2"
            )}
            title="Settings"
          >
            <Settings className={cn("h-4 w-4", isExpanded ? "mr-2" : "")} />
            {isExpanded && <span className="text-sm">Settings</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;


