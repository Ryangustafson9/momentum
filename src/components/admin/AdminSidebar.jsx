
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings, LogOut, UserCircle,
  PanelLeftClose, PanelRightOpen, 
  Sun, Moon, Laptop, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/hooks/useTheme.jsx';
import { navLinks } from '@/config/adminNavLinks.js';
import { hasStaffAccess } from '@/utils/roleUtils.js';

const SidebarNavLink = ({ to, label, icon: Icon, currentPath, isExpanded }) => {
  const isActive = currentPath === to || (to !== "/" && currentPath.startsWith(to));
  return (
    <NavLink
      to={to}
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


const AdminSidebar = ({ onLogout, user, isExpanded, toggleSidebar, startRoleImpersonation }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const currentPath = location.pathname;
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'AD';
  
  const handleSettingsNavigation = () => {
    navigate('/staff/settings');
  };

  const UserCardContent = () => (
    <div className="flex items-center mr-auto overflow-hidden cursor-pointer">
      <Avatar className={cn("h-10 w-10 transition-all duration-300")}>
        <AvatarImage src={user?.profile_picture_url || `https://avatar.vercel.sh/${user?.email}.png?s=40`} alt={user?.name || 'User Avatar'} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="ml-3 text-left">
        <p className="text-sm font-medium text-foreground leading-none truncate" title={user?.name || "Staff User"}>{user?.name || "Staff User"}</p>
        <p className="text-xs text-muted-foreground leading-none mt-0.5 truncate" title={user?.email || "staff@example.com"}>{user?.email || "staff@example.com"}</p>
      </div>
    </div>
  );

  const UserDropdownContent = () => (
    <>
      <DropdownMenuItem onClick={() => navigate('/staff/settings')}>
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
      
      <div className="flex items-center p-4 h-16 border-b border-border">
        {isExpanded ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex-1 min-w-0">
                <UserCardContent />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="w-56 ml-2">
              <UserDropdownContent />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex-1 min-w-0" /> 
        )}

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className={cn(
            "text-muted-foreground hover:text-foreground",
            isExpanded ? "ml-2" : "mx-auto" 
          )}
        >
          {isExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {!isExpanded && (
        <div className="flex flex-col items-center p-4 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className={cn("h-10 w-10 transition-all duration-300 cursor-pointer")}>
                <AvatarImage src={user?.profile_picture_url || `https://avatar.vercel.sh/${user?.email}.png?s=40`} alt={user?.name || 'User Avatar'} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
               <UserDropdownContent />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => (
          <SidebarNavLink
            key={link.to}
            to={link.to}
            label={link.label}
            icon={link.icon}
            currentPath={currentPath}
            isExpanded={isExpanded}
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
            <LogOut className={cn("h-5 w-5", isExpanded ? "mr-2" : "mr-0")} />
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


