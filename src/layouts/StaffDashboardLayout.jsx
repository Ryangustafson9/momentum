import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar.jsx';
import TopNavbar from '@/components/admin/TopNavbar.jsx';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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
  return pageTitles[pathname] || 'Staff Portal';
};

const AdminDashboardLayout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const storedSidebarState = localStorage.getItem('sidebarExpanded');
    return storedSidebarState ? JSON.parse(storedSidebarState) : true;
  });

  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };
    useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {      if (user?.role === 'staff' || user?.role === 'admin') {
        try {
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, display_name, email, role, system_member_id, phone')
            .order('first_name', { ascending: true });
          
          if (error) {
            
            return;
          }
            // Transform data for search component
          const transformedMembers = profiles?.map(profile => ({
            id: profile.id,
            name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            full_name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            role: profile.role,
            system_member_id: profile.system_member_id,
            phone: profile.phone
          })) || [];
            if (isMounted) {
            setAllMembers(transformedMembers);
          }
        } catch (error) {
          
          if (isMounted) setAllMembers([]);
        }
      }
    };
    
    fetchMembers();
    return () => { isMounted = false; };
  }, [user?.role]);
  const handleStartImpersonation = null; // Impersonation disabled for now

  if (!user) {
    return null; 
  }

  return (
    <div className="flex h-screen bg-muted/40 dark:bg-slate-950 overflow-hidden">
      <AdminSidebar
        onLogout={logout}
        user={user}
        isExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
      />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 ease-in-out",
        isSidebarExpanded ? "md:ml-64" : "md:ml-20" 
      )}>        <TopNavbar
          user={user}
          onLogout={logout}
          startRoleImpersonation={handleStartImpersonation}
          allMembers={allMembers}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900">
          <div className="w-full">
            {children ? children : <Outlet key={location.pathname} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;



