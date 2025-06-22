
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, Sun, Moon, Bell, Search as SearchIcon } from 'lucide-react';
import MemberSearch from '@/components/admin/topnav_parts/MemberSearch.jsx';
import { useTheme } from '@/hooks/useTheme.jsx';
import { cn } from '@/lib/utils';

const AdminHeader = ({ 
  toggleSidebar, 
  userRole, 
  currentPathTitle, 
  allMembers 
}) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

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
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden mr-2 text-muted-foreground hover:text-foreground">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <h1 className="text-lg md:text-xl font-semibold text-foreground whitespace-nowrap">{currentPathTitle}</h1>
      </div>
      
      <div className="flex-1" />

      <div className="flex items-center gap-2 md:gap-3">
        {userRole === 'staff' && (
          <div className="relative hidden sm:block">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <MemberSearch allMembers={allMembers} navigate={navigate} inputClassName="pl-8 sm:w-[180px] md:w-[220px] lg:w-[280px] rounded-lg h-9" />
          </div>
        )}
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;



