
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  History,
  CreditCard,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Dumbbell,
  Star,
  Users,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

// Member navigation links
const memberNavLinks = [
  { to: '/member-portal/dashboard', label: 'Dashboard', icon: 'Home' },
  { to: '/member-portal/classes', label: 'My Classes', icon: 'Calendar' },
  { to: '/member-portal/profile', label: 'Profile', icon: 'User' },
  { to: '/member-portal/billing', label: 'Billing', icon: 'CreditCard' },
  { to: '/member-portal/advanced', label: 'Advanced Features', icon: 'Star' },
];

// Icon mapping for safe rendering
const iconMap = {
  Home,
  Calendar,
  History,
  CreditCard,
  User,
  Settings,
  LogOut,
  Edit3,
  Dumbbell,
  Star,
  Users,
  GripVertical
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
const SortableMemberNavLink = ({ link, currentPath, isExpanded, location, isEditMode }) => {
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
        )}
        <MemberSidebarNavLink
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

const MemberSidebarNavLink = ({ to, label, icon, currentPath, isExpanded, location, isEditMode }) => {
  // More precise active state logic to avoid false matches
  const isActive = currentPath === to ||
    (to !== "/" && (currentPath.startsWith(to + "/") || currentPath === to));

  // If in edit mode, render as a div instead of NavLink to disable navigation
  if (isEditMode) {
    return (
      <div
        className={cn(
          "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out",
          "cursor-grab active:cursor-grabbing select-none",
          isActive ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600",
          !isExpanded && "justify-center"
        )}
        title={isExpanded ? "" : label}
      >
        {renderIcon(icon, cn("h-5 w-5", isExpanded ? "mr-3" : "mr-0"))}
        {isExpanded && <span>{label}</span>}
        {!isExpanded && <span className="sr-only">{label}</span>}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
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
      {renderIcon(icon, cn("h-5 w-5", isExpanded ? "mr-3" : "mr-0"))}
      {isExpanded && <span>{label}</span>}
      {!isExpanded && <span className="sr-only">{label}</span>}
    </NavLink>
  );
};

const MemberSidebar = ({ isExpanded, toggleSidebar, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const currentPath = location.pathname;

  // Initialize sidebar state from localStorage or default to true
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (isExpanded !== undefined) return isExpanded;
    const stored = localStorage.getItem('memberSidebarExpanded');
    return stored ? JSON.parse(stored) : true;
  });

  // Sidebar organization state
  const [isEditMode, setIsEditMode] = useState(false);
  const [orderedNavLinks, setOrderedNavLinks] = useState(() => {
    const saved = localStorage.getItem('memberSidebarOrder');
    return saved ? JSON.parse(saved) : memberNavLinks;
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
    localStorage.setItem('memberSidebarOrder', JSON.stringify(orderedNavLinks));
  }, [orderedNavLinks]);

  // Use prop if provided, otherwise use internal state
  const actualIsExpanded = isExpanded !== undefined ? isExpanded : sidebarExpanded;
  // Save to localStorage when state changes
  useEffect(() => {
    if (isExpanded === undefined) {
      localStorage.setItem('memberSidebarExpanded', JSON.stringify(sidebarExpanded));
    }
  }, [sidebarExpanded, isExpanded]);

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

  const handleToggle = () => {
    if (toggleSidebar) {
      toggleSidebar();
    } else {
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  // Get user display information
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'M';
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Member';
  };

  const handleSettingsNavigation = () => {
    navigate('/member-portal/profile');
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      try {
        const { logout } = useAuth();
        await logout();
        navigate('/login');
      } catch (error) {
        
      }
    }
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-xl print:hidden",
      actualIsExpanded ? "w-64" : "w-20"
    )}>
      {/* Sidebar Toggle Tab - Blended seamlessly into sidebar */}
      <div
        className="absolute top-20 -right-6 w-6 h-16 z-50 hidden lg:flex items-center justify-center bg-white
          border-t border-b border-r border-gray-200 transition-colors duration-300 rounded-r-full"
      >
        <button
          onClick={handleToggle}
          title={actualIsExpanded ? "Collapse sidebar" : "Expand sidebar"}
          className="w-full h-full flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors duration-300"
          style={{
            borderRadius: '0 9999px 9999px 0', // fully round right side
          }}
        >
          {actualIsExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Header with Logo/Avatar */}
      <div className={`relative flex flex-col space-y-1.5 p-6 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-100 to-purple-100 ${!actualIsExpanded ? 'px-2' : ''}`}>
        <AnimatePresence mode="wait">
          {actualIsExpanded ? (
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
          )}
        </AnimatePresence>
      </div>      {/* Navigation */}
      <nav className="flex-grow px-3 py-4 overflow-y-auto bg-white">
        {isEditMode ? (
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
                  <SortableMemberNavLink
                    key={link.to}
                    link={link}
                    currentPath={currentPath}
                    isExpanded={actualIsExpanded}
                    location={location}
                    isEditMode={isEditMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-1">
            {orderedNavLinks.map((link) => (
              <MemberSidebarNavLink
                key={link.to}
                to={link.to}
                label={link.label}
                icon={link.icon}
                currentPath={currentPath}
                isExpanded={actualIsExpanded}
                location={location}
                isEditMode={isEditMode}
              />
            ))}
          </div>
        )}      </nav>

      {/* Edit Sidebar Button and Controls */}
      {actualIsExpanded && (
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
                        setOrderedNavLinks(memberNavLinks);
                        localStorage.removeItem('memberSidebarOrder');
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
          <div className={cn("flex items-center gap-2", actualIsExpanded ? "justify-between" : "flex-col space-y-2")}>
            {/* Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={cn(
                "text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200",
                actualIsExpanded ? "flex items-center" : "w-full p-2"
              )}
              title="Sign Out"
            >
              {renderIcon("LogOut", cn("h-4 w-4", actualIsExpanded ? "mr-2" : ""))}
              {actualIsExpanded && <span className="text-sm">Sign Out</span>}
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSettingsNavigation}
              className={cn(
                "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200",
                actualIsExpanded ? "flex items-center" : "w-full p-2"
              )}
              title="Settings"
            >
              {renderIcon("Settings", cn("h-4 w-4", actualIsExpanded ? "mr-2" : ""))}
              {actualIsExpanded && <span className="text-sm">Settings</span>}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default MemberSidebar;

