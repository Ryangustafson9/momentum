
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Settings, CheckSquare, FileText, CalendarClock, Award, Briefcase
} from 'lucide-react';

const staffNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/check-in', label: 'Check-In', icon: CheckSquare },
  { path: '/memberships', label: 'Memberships', icon: Award },
  { path: '/classes', label: 'Classes', icon: Calendar },
  { path: '/schedule', label: 'Schedule', icon: CalendarClock },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/instructor-dashboard', label: 'Instructor View', icon: Briefcase },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const mobileMenuVariants = {
  open: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: 'easeInOut' } },
  closed: { opacity: 0, height: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
};

const MobileNavMenu = ({ closeMobileMenu }) => {
  return (
    <motion.nav 
      variants={mobileMenuVariants}
      initial="closed"
      animate="open"
      exit="closed"
      className="md:hidden bg-white dark:bg-slate-800 shadow-lg border-b border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[calc(100vh-3.5rem)] z-20"
      aria-label="Main mobile navigation"
    >
      <div className="flex flex-col px-2 py-3 space-y-1">
        {staffNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({isActive}) => `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            onClick={closeMobileMenu} 
            aria-current={({isActive}) => isActive ? "page" : undefined}
          >
            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </motion.nav>
  );
};

export default MobileNavMenu;



