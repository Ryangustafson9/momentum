
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Search as SearchIcon,
  UserCircle,
  Settings,
  Eye,
  Sun,
  Moon,
  Laptop,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import MemberSearch from '@/components/admin/topnav_parts/MemberSearch.jsx';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme.jsx';

const pageTitles = {
  '/': 'Dashboard',
  '/super-admin': 'Super Admin Dashboard',
  '/dashboard': 'Admin Panel',
  '/members': 'Members Management',
  '/check-in': 'Member Check-In',
  '/memberships': 'Membership Plans',
  '/classes': 'Class Management',
  '/schedule': 'Class Schedule',
  '/reports': 'Reports & Analytics',
  '/instructor-dashboard': 'Instructor Dashboard',
  '/settings': 'Application Settings',
  '/admin-panel': 'Admin Panel',
  '/trainers': 'Trainers Management',
};

const getPageTitle = (pathname) => {
  if (pathname.startsWith('/member/')) return 'Member Profile';
  return pageTitles[pathname] || 'GymPro Admin';
};

const NotificationsButton = () => (
  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative">
    <Bell className="h-5 w-5" />
    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
      3
    </span>
    <span className="sr-only">Notifications</span>
  </Button>
);

const UserProfileDropdown = ({ user, onLogout, startRoleImpersonation }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  const displayName = user?.name ||
    (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '') ||
    user?.email?.split('@')[0] || 'Staff User';

  const displayEmail = user?.email || 'staff@example.com';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 h-9 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <Avatar className="h-7 w-7">
            <AvatarImage
              src={user?.profile_picture_url || `https://avatar.vercel.sh/${displayEmail}.png?s=32`}
              alt={displayName}
            />
            <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
              {displayName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
              {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-gray-500 hidden md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
            <Badge variant="outline" className="w-fit mt-1">
              {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('/staff/settings')}>
          <UserCircle className="mr-2 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>

        {startRoleImpersonation && user?.role === 'admin' && (
          <DropdownMenuItem onClick={() => startRoleImpersonation('member')}>
            <Eye className="mr-2 h-4 w-4" />
            View as Member
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
        <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const StaffSearch = ({ allMembers, navigate }) => (
  <div className="relative hidden sm:block">
    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <MemberSearch 
      allMembers={allMembers} 
      navigate={navigate} 
      inputClassName="pl-8 sm:w-[180px] md:w-[220px] lg:w-[280px] rounded-lg h-9" 
    />
  </div>
);

const TopNavbar = ({ userRole, toggleSidebar, user, onLogout, startRoleImpersonation }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allMembers, setAllMembers] = useState([]);
  const [currentPathTitle, setCurrentPathTitle] = useState(getPageTitle(location.pathname));
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setCurrentPathTitle(getPageTitle(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      if (userRole === 'staff') {
        try {
          const { data: membersData, error } = await supabase
            .from('profiles')
            .select(`
              id,
              email,
              first_name,
              last_name,
              phone,
              role,
              status
            `)
            .eq('role', 'member')
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (isMounted && membersData) {
            setAllMembers(membersData);
          }
        } catch (error) {
          console.error("Failed to fetch members for search:", error);
          if (isMounted) setAllMembers([]);
        }
      }
    };

    fetchMembers();
    return () => { isMounted = false; };
  }, [userRole]);
  
  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
         setIsScrolled(mainContent.scrollTop > 10);
      }
    };
    const mainContentArea = document.querySelector('main');
    mainContentArea?.addEventListener('scroll', handleScroll);
    return () => mainContentArea?.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card dark:bg-slate-900 px-4 md:px-6 transition-shadow duration-200 print:hidden",
      isScrolled ? "shadow-md" : "shadow-sm"
    )}>
      <div className="flex items-center">
        {/* Mobile sidebar toggle button removed as per request */}
        <h1 className="text-lg md:text-xl font-semibold text-foreground whitespace-nowrap">{currentPathTitle}</h1>
      </div>
      
      <div className="flex-1" />

      <div className="flex items-center gap-2 md:gap-3">
        {userRole === 'staff' && (
          <StaffSearch allMembers={allMembers} navigate={navigate} />
        )}
        <NotificationsButton />
      </div>
    </header>
  );
};

export default TopNavbar;


