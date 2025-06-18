
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell,
  Search as SearchIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MemberSearch from '@/components/admin/topnav_parts/MemberSearch.jsx';
import { apiService } from '@/services/apiService';
import { cn } from '@/lib/utils';

const pageTitles = {
  '/': 'Dashboard',
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
    <span className="sr-only">Notifications</span>
  </Button>
);

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

const TopNavbar = ({ userRole, toggleSidebar }) => {
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
          const membersData = await dataService.getMembers();
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


