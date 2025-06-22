
import React from 'react';
import { NavLink } from 'react-router-dom';
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

const navLinkClasses = ({ isActive }) =>
  `flex items-center px-2.5 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out
  ${isActive
    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-purple-700 dark:hover:text-purple-400'
  }`;

const DesktopNavLinks = () => {
  return (
    <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 flex-grow justify-center px-2">
      {staffNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={navLinkClasses}
          aria-current={({isActive}) => isActive ? "page" : undefined}
        >
          <item.icon className="h-4 w-4 mr-1.5 flex-shrink-0" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default DesktopNavLinks;



