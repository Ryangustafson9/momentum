import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar.jsx';
import TopNavbar from '@/components/admin/TopNavbar.jsx';
import { getMembers } from '@/services/dataService';
import { cn } from '@/lib/utils';
import { useAuthQuery as useAuth } from '@/hooks/useAuthQuery';
import { useAuthContext } from '@/providers/AuthProvider';
import { useToast } from "@/hooks/use-toast.js";

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

const AdminDashboardLayout = ({ onLogout, children }) => {
  const { user } = useAuth();
  const { startRoleImpersonation: authStartImpersonation } = useAuthContext();
  const { toast } = useToast();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const storedSidebarState = localStorage.getItem('sidebarExpanded');
    return storedSidebarState ? JSON.parse(storedSidebarState) : true;
  });
  
  const location = useLocation(); 
  const navigate = useNavigate();
  const [allMembers, setAllMembers] = useState([]);
  const currentPathTitle = getPageTitle(location.pathname);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };
  
  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      if (user?.role === 'staff') {
        try {
          const membersData = await getMembers();
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
  }, [user?.role]);

  const handleStartImpersonation = async (roleToImpersonate) => {
    try {
      await authStartImpersonation(roleToImpersonate);
      navigate('/dashboard'); 
      toast({ title: "Role Impersonation Started", description: `You are now viewing the app as a ${roleToImpersonate}.`});
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (!user) {
    return null; 
  }

  return (
    <div className="flex h-screen bg-muted/40 dark:bg-slate-950 overflow-hidden">
      <AdminSidebar
        onLogout={onLogout}
        isExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
      />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 ease-in-out",
        isSidebarExpanded ? "md:ml-64" : "md:ml-20" 
      )}>
        <TopNavbar
          toggleSidebar={toggleSidebar}
          userRole={user?.role}
          user={user}
          onLogout={onLogout}
          startRoleImpersonation={handleStartImpersonation}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background dark:bg-slate-900">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;


