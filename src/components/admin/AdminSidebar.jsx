
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Settings, ArrowLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { navLinks } from '@/config/adminNavLinks.js';
import { hasStaffAccess } from '@/utils/roleUtils.js';

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
          "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20",
          (isActive || navIsActive) ? "bg-primary/10 text-primary dark:bg-primary/20" : "text-muted-foreground",
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

  const UserDropdownContent = () => (
    <>
      <DropdownMenuItem onClick={() => navigate('/staff-portal/settings')}>
        <UserCircle className="mr-2 h-4 w-4" />
        Profile
      </DropdownMenuItem>
      {startRoleImpersonation && hasStaffAccess(user?.role) && (
        <DropdownMenuItem onClick={() => startRoleImpersonation('member')}>
          <Eye className="mr-2 h-4 w-4" />
          Impersonate Member
        </DropdownMenuItem>
      )}
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
          {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
          {theme === 'system' && <Laptop className="mr-2 h-4 w-4" />}
          Theme
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Laptop className="mr-2 h-4 w-4" /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onLogout}>
        <LogOut className="mr-2 h-4 w-4 text-destructive" />
        <span className="text-destructive">Logout</span>
      </DropdownMenuItem>
    </>
  );

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out shadow-lg print:hidden",
      isExpanded ? "w-64" : "w-20"
    )}>
      
      <div className="flex items-center justify-between p-4 h-20 border-b border-border">
        <div className="flex items-center justify-center w-full">
          <img
            src="/assets/momentum-logo.svg"
            alt="Momentum Gym"
            className="w-24 h-16 object-contain"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        >
          {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
      
      <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto">
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

      <div className="px-3 py-3 border-t border-border mt-auto">
        <div className={cn("flex items-center", isExpanded ? "justify-between" : "flex-col space-y-2")}>
          <Button 
            variant="ghost" 
            onClick={onLogout} 
            className={cn(
              "flex items-center text-muted-foreground hover:text-destructive", 
              isExpanded ? "w-auto" : "w-full justify-center"
            )}
            title="Logout"
          >
            <ArrowLeft className={cn("h-5 w-5", isExpanded ? "mr-2" : "mr-0")} />
            {isExpanded && <span className="text-sm">Logout</span>}
            {!isExpanded && <span className="sr-only">Logout</span>}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSettingsNavigation} 
            className={cn(
              "flex items-center text-muted-foreground hover:text-primary",
              isExpanded ? "w-auto" : "w-full justify-center"
            )}
            title="Settings"
          >
            <Settings className={cn("h-5 w-5", isExpanded ? "mr-2" : "mr-0")} />
            {isExpanded && <span className="text-sm">Settings</span>}
            {!isExpanded && <span className="sr-only">Settings</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;


