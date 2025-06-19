import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bell, Trash2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext.jsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge.jsx';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast.js";
import MemberTopNavbar from '@/components/member/MemberTopNavbar';
import MemberSidebar from '@/components/member/MemberSidebar';

const FloatingNotificationButton = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full h-10 w-10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-lg relative border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 min-w-min p-0 flex items-center justify-center text-xs rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96 max-h-[70vh] overflow-y-auto mb-2">
        <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notifications</span>
            {notifications.length > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-auto py-0.5 px-1" onClick={clearAllNotifications} aria-label="Clear all notifications">
                    <Trash2 className="h-3 w-3 mr-1"/> Clear All
                </Button>
            )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <DropdownMenuItem key={notification.id} onClick={() => handleNotificationClick(notification)} className={cn("flex flex-col items-start whitespace-normal cursor-pointer", !notification.read ? 'bg-primary/5' : '')}>
              <div className="flex justify-between w-full">
                <span className={cn("font-medium text-sm", !notification.read ? 'text-primary' : '')}>{notification.type ? notification.type.charAt(0).toUpperCase() + notification.type.slice(1) : 'Notification'}</span>
                <span className="text-xs text-muted-foreground">{notification.timestamp ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : ''}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled className="text-center text-sm text-muted-foreground py-4">No new notifications</DropdownMenuItem>
        )}
        {notifications.length > 0 && unreadCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={markAllAsRead} className="justify-center text-sm text-primary cursor-pointer">
              Mark all as read
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MemberDashboardLayout = ({ onLogout, children }) => {
  const { isImpersonating, impersonatedRoleName, stopImpersonation } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth(); // UPDATED: Use useAuth hook

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation();
      navigate('/'); 
      toast({ title: "Impersonation Ended", description: "You have returned to your original account."});
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-900 ${isImpersonating ? 'pt-10' : ''}`}>
      <MemberTopNavbar 
        onLogout={onLogout} 
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        closeMobileMenu={closeMobileMenu}
        isImpersonating={isImpersonating}
        impersonatedUserName={impersonatedRoleName}
        stopImpersonation={handleStopImpersonation}
      />
      <div className="flex">
        {/* Sidebar */}
        <MemberSidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-2 md:pt-4">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, type: 'spring', stiffness: 120 }}
        className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 items-end"
      >
        <FloatingNotificationButton />
        <Button
          size="icon"
          className="rounded-full h-12 w-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
          onClick={() => toast({title: "AI Assistant", description: "Chat feature coming soon!"})}
          aria-label="Open Chat"
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </Button>
      </motion.div>
    </div>
  );
};

export default MemberDashboardLayout;


