import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Search as SearchIcon,
  UserCircle,
  Eye,
  Sun,
  Moon,
  Laptop,
  ArrowLeft,
  ChevronDown,
  Filter
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
import AdvancedMemberSearchModal from '@/components/admin/topnav_parts/AdvancedMemberSearchModal.jsx';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme.jsx';
import { brandingService } from '@/services/brandingService.js';
import LocationSwitcher from './LocationSwitcher';
const ClubHeader = () => {
  const [branding, setBranding] = useState({ logo_url: '', avatar_url: '' });
  // LocationSwitcher will handle its own location context

  useEffect(() => {
    brandingService.getBranding().then(setBranding).catch(() => {});
  }, []);

  // Add this effect to refetch branding when the window regains focus
  useEffect(() => {
    const handleFocus = () => {
      brandingService.getBranding().then(setBranding).catch(() => {});
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <img
          src={branding.logo_url || "/assets/NordicFitness.png"}
          alt="Club Logo"
          className="h-12 w-auto object-contain"
        />
        <LocationSwitcher variant="dropdown" className="ml-2" />
      </div>
    </div>
  );
};

const pageTitles = {
  '/': 'Dashboard',
  '/dashboard': 'Admin Panel',
  '/check-in': 'Member Check-In',
  '/memberships': 'Membership Plans',
  '/classes': 'Class Management',
  '/schedule': 'Class Schedule',
  '/reports': 'Reports & Analytics',
  '/instructor-dashboard': 'Instructor Dashboard',
  '/settings': 'Application Settings',
  '/admin-panel': 'Admin Panel',
  '/trainers': 'Trainers Management',
  '/corporate-management': 'Corporate Partners',
};

const getPageTitle = (pathname) => {
  if (pathname.startsWith('/member/')) return 'Member Profile';
  return pageTitles[pathname] || null; // Return null for default club header
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
        <DropdownMenuSeparator />        <DropdownMenuItem onClick={() => navigate('/staff-portal/settings')}>
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

const StaffSearch = ({ allMembers, navigate, onOpenAdvancedSearch }) => (
  <div className="flex items-center gap-2">
    <div className="relative">
      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <MemberSearch
        allMembers={allMembers}
        navigate={navigate}
        inputClassName="pl-8 sm:w-[180px] md:w-[220px] lg:w-[280px] rounded-lg h-9"
      />
    </div>
    <Button
      variant="outline"
      size="sm"
      onClick={onOpenAdvancedSearch}
      className="h-9 px-3 text-xs font-medium whitespace-nowrap border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
      title="Advanced Search (Ctrl+K)"
    >
      <Filter className="h-3.5 w-3.5 mr-1.5" />
      Advanced
    </Button>
  </div>
);

const TopNavbar = ({ user, onLogout, startRoleImpersonation, allMembers = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPathTitle, setCurrentPathTitle] = useState(getPageTitle(location.pathname));
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  useEffect(() => {
    setCurrentPathTitle(getPageTitle(location.pathname));
  }, [location.pathname]);
  
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

  // Add keyboard shortcut for Advanced Search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsAdvancedSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAdvancedSearch = () => {
    setIsAdvancedSearchOpen(true);
  };

  const handleCloseAdvancedSearch = () => {
    setIsAdvancedSearchOpen(false);
  };

  const handleSelectMember = (member) => {
    // Navigate to member profile using system_member_id
    const profileId = member.system_member_id || member.id;
    if (profileId) {
      navigate(`/staff-portal/profile/${profileId}`);
    }
    setIsAdvancedSearchOpen(false);
  };

  return (
    <>
      <header className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card dark:bg-slate-900 px-4 md:px-6 transition-shadow duration-200 print:hidden",
        isScrolled ? "shadow-md" : "shadow-sm"
      )}>
        {/* Left side - Logo/Title */}
        <div className="flex items-center">
          {currentPathTitle ? (
            <h1 className="text-lg md:text-xl font-semibold text-foreground whitespace-nowrap">{currentPathTitle}</h1>
          ) : (
            <ClubHeader />
          )}
        </div>

        <div className="flex-1" />

        {/* Right side - Search, Notifications and User Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          <StaffSearch
            allMembers={allMembers}
            navigate={navigate}
            onOpenAdvancedSearch={handleOpenAdvancedSearch}
          />
          <NotificationsButton />
          <UserProfileDropdown
            user={user}
            onLogout={onLogout}
            startRoleImpersonation={startRoleImpersonation}
          />
        </div>
      </header>

      <AdvancedMemberSearchModal
        isOpen={isAdvancedSearchOpen}
        onClose={handleCloseAdvancedSearch}
        onSelectMember={handleSelectMember}
        navigate={navigate}
      />
    </>
  );
};

export default TopNavbar;



