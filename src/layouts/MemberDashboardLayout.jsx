import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bell, Trash2, CreditCard } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext.jsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge.jsx';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast.js";
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const storedSidebarState = localStorage.getItem('memberSidebarExpanded');
    return storedSidebarState ? JSON.parse(storedSidebarState) : true;
  });
  const location = useLocation();
  const { user, loading } = useAuth(); // UPDATED: Use useAuth hook

  useEffect(() => {
    localStorage.setItem('memberSidebarExpanded', JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
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
    <div className="flex h-screen bg-muted/40 dark:bg-slate-950 overflow-hidden">
      <MemberSidebar
        onLogout={onLogout}
        user={user}
        isExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
      />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 ease-in-out",
        isSidebarExpanded ? "md:ml-64" : "md:ml-20"
      )}>        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Member Portal</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.first_name || 'Member'}!</p>
          </div>          <div className="flex items-center gap-3">            {/* View My Bill Button */}
            <Button
              onClick={() => navigate('/member-portal/billing')}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              size="sm"
            >
              <CreditCard className="h-4 w-4" />
              View My Bill
            </Button>
          </div>
        </header>{/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background dark:bg-slate-900">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
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


