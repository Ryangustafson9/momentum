
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, ChevronLeft, ChevronRight, Settings, GripVertical, Edit3,
  Home, Users, Calendar, BarChart2, UserCheck, Zap, UserCog, Briefcase,
  Mail, CreditCard, Wrench, ShoppingCart, Building, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { navLinks } from '@/config/adminNavLinks.js';
import { useToast } from '@/hooks/use-toast';

// Icon mapping for safe rendering
const iconMap = {
  Home,
  Users,
  Calendar,
  BarChart2,
  UserCheck,
  Zap,
  UserCog,
  Briefcase,
  Mail,
  CreditCard,
  Wrench,
  ShoppingCart,
  Building,
  GitBranch,
  Edit3,
  LogOut,
  Settings
};

// Safe icon renderer using iconMap
const renderIcon = (iconName, className = "h-4 w-4") => {
  const IconComponent = iconMap[iconName];

  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback for unknown icons
  return <div className={`${className} bg-gray-400 rounded`} />;
};





// Sortable wrapper for nav links
const SortableNavLink = ({ link, currentPath, isExpanded, location, isEditMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.to });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'z-50' : ''}>
      <div 
        className="relative group"
        {...attributes}
        {...listeners}
      >
        {isEditMode && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}        <SidebarNavLink
          to={link.to}
          label={link.label}
          icon={link.icon}
          currentPath={currentPath}
          isExpanded={isExpanded}
          location={location}
          isEditMode={isEditMode}
        />
      </div>
    </div>
  );
};

const SidebarNavLink = ({ to, label, icon, currentPath, isExpanded, location, isEditMode }) => {
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
  // If in edit mode, render as a div instead of NavLink to disable navigation
  if (isEditMode) {
    return (
      <div
        className={cn(
          "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out",
          "cursor-grab active:cursor-grabbing select-none",
          isActive ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600",
          !isExpanded && "justify-center"
        )}        title={isExpanded ? "" : label}
      >
        {renderIcon(icon, cn("h-5 w-5", isExpanded ? "mr-3" : "mr-0"))}
        {isExpanded && <span>{label}</span>}
        {!isExpanded && <span className="sr-only">{label}</span>}
      </div>
    );
  }

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
      }      title={isExpanded ? "" : label}
    >
      {renderIcon(icon, cn("h-5 w-5", isExpanded ? "mr-3" : "mr-0"))}
      {isExpanded && <span>{label}</span>}
      {!isExpanded && <span className="sr-only">{label}</span>}
    </NavLink>
  );
};


const AdminSidebar = ({ onLogout, isExpanded, toggleSidebar, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { toast } = useToast();
  // Sidebar organization state
  const [isEditMode, setIsEditMode] = useState(false);  const [orderedNavLinks, setOrderedNavLinks] = useState(() => {
    const saved = localStorage.getItem('adminSidebarOrder');
    let baseLinks = saved ? JSON.parse(saved) : navLinks;

    // Remove any links that no longer exist in the main navLinks configuration
    baseLinks = baseLinks.filter(link => 
      navLinks.some(nl => nl.label === link.label)
    );

    // Ensure all links have correct paths (fix any localStorage corruption)
    baseLinks = baseLinks.map(link => {
      const correctLink = navLinks.find(nl => nl.label === link.label);
      return correctLink ? { ...link, to: correctLink.to, icon: correctLink.icon } : link;
    });

    // Filter links based on user role
    const filteredLinks = baseLinks.filter(link => {
      if (link.adminOnly && user?.role !== 'admin') {
        return false;
      }
      return true;
    });

    return filteredLinks;
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  // Save order to localStorage
  useEffect(() => {
    localStorage.setItem('adminSidebarOrder', JSON.stringify(orderedNavLinks));
  }, [orderedNavLinks]);
  // Update links when user role changes
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarOrder');
    let baseLinks = saved ? JSON.parse(saved) : navLinks;

    // Remove any links that no longer exist in the main navLinks configuration
    baseLinks = baseLinks.filter(link => 
      navLinks.some(nl => nl.label === link.label)
    );

    // Ensure all links have correct paths (fix any localStorage corruption)
    baseLinks = baseLinks.map(link => {
      const correctLink = navLinks.find(nl => nl.label === link.label);
      return correctLink ? { ...link, to: correctLink.to, icon: correctLink.icon } : link;
    });

    // Filter links based on user role
    const filteredLinks = baseLinks.filter(link => {
      if (link.adminOnly && user?.role !== 'admin') {
        return false;
      }
      return true;
    });

    setOrderedNavLinks(filteredLinks);
  }, [user?.role]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedNavLinks((items) => {
        const oldIndex = items.findIndex(item => item.to === active.id);
        const newIndex = items.findIndex(item => item.to === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Show success toast
        toast({
          title: "Sidebar Updated",
          description: "Navigation items have been reordered successfully.",
          duration: 2000,
        });

        return newOrder;
      });
    }
  };

  // Generate user initials and display name
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const handleSettingsNavigation = () => {
    navigate('/staff-portal/settings');
  };

  return (    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-xl print:hidden",
      isExpanded ? "w-64" : "w-20"
    )}>      {/* Sidebar Toggle Tab - Blended seamlessly into sidebar */}
      <div
        className="absolute top-20 -right-6 w-6 h-16 z-50 hidden lg:flex items-center justify-center bg-white 
          border-t border-b border-r border-gray-200 transition-colors duration-300 rounded-r-full"
      >
        <button
          onClick={toggleSidebar}
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          className="w-full h-full flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors duration-300"
          style={{
            borderRadius: '0 9999px 9999px 0', // fully round right side
          }}
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
      
      <div className={`relative flex items-center justify-between h-16 px-4 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-100 to-purple-100 ${!isExpanded ? 'px-2' : ''}`}>
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center justify-center w-full"
            >
              <img
                src="/assets/momentum-logo.svg"
                alt="Momentum Gym"
                className="w-40 h-28 object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center w-full"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user?.profile_picture_url || user?.avatar_url || `/assets/momentum-avatar.svg`}
                  alt={getDisplayName()}
                  className="object-contain p-1"
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          )}        </AnimatePresence>
      </div>

      <nav className="flex-grow px-3 py-4 overflow-y-auto bg-white">        {isEditMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedNavLinks.map(link => link.to)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {orderedNavLinks.map((link) => (
                  <SortableNavLink
                    key={link.to}
                    link={link}
                    currentPath={currentPath}
                    isExpanded={isExpanded}
                    location={location}
                    isEditMode={isEditMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (          <div className="space-y-1">
            {orderedNavLinks.map((link) => (
              <SidebarNavLink
                key={link.to}
                to={link.to}
                label={link.label}
                icon={link.icon}
                currentPath={currentPath}
                isExpanded={isExpanded}
                location={location}
                isEditMode={isEditMode}
              />
            ))}
          </div>)}      </nav>      {/* Edit Sidebar Button and Controls */}
      {isExpanded && (
        <div className="p-2 justify-start">
          {isEditMode ? (
            <div className="space-y-2">
              {/* Edit controls panel */}
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-blue-700 font-medium">
                    Organize Sidebar
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOrderedNavLinks(navLinks);
                        localStorage.removeItem('adminSidebarOrder');
                        toast({
                          title: "Sidebar Reset",
                          description: "Navigation has been reset to default order.",
                          duration: 2000,
                        });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 h-auto p-1"
                    >
                      Reset
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditMode(false)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors duration-200 font-medium h-auto p-1"
                      title="Save changes"
                    >
                      Save
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-blue-600">
                  Drag items to reorder your navigation
                </p>
              </div>
                {/* Pencil button below the edit controls - left justified */}
              <div className="flex justify-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditMode(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors duration-300 opacity-70 hover:opacity-90"
                  title="Cancel edits"
                >
                  {renderIcon("Edit3", "h-4 w-4")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-start">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors duration-300 opacity-70 hover:opacity-90"
                title="Organize sidebar"
              >
                {renderIcon("Edit3", "h-4 w-4")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bottom Section */}
      <div className="bg-gray-50/50 border-t border-b border-gray-200">
        {/* Settings and Sign Out - Horizontal */}
        <div className="p-3">
          <div className={cn("flex items-center gap-2", isExpanded ? "justify-between" : "flex-col space-y-2")}>
            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className={cn(
                "text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200",
                isExpanded ? "flex items-center" : "w-full p-2"
              )}
              title="Sign Out"
            >
              {renderIcon("LogOut", cn("h-4 w-4 rotate-180 text-red-600", isExpanded ? "mr-2" : ""))}
              {isExpanded && <span className="text-sm text-red-600">Sign Out</span>}
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSettingsNavigation}
              className={cn(
                "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200",
                isExpanded ? "flex items-center" : "w-full p-2"
              )}              title="Settings"
            >
              {renderIcon("Settings", cn("h-4 w-4", isExpanded ? "mr-2" : ""))}
              {isExpanded && <span className="text-sm">Settings</span>}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;


