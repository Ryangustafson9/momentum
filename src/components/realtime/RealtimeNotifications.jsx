/**
 * 🔔 REAL-TIME NOTIFICATIONS COMPONENT
 * Live notification system with toast integration
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const RealtimeNotifications = ({ 
  className = '',
  showBadge = true,
  maxDisplay = 5,
  autoToast = true 
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotifications();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // Auto-toast new notifications
  useEffect(() => {
    if (autoToast && notifications.length > lastNotificationCount && lastNotificationCount > 0) {
      const newNotifications = notifications.slice(0, notifications.length - lastNotificationCount);
      
      newNotifications.forEach(notification => {
        if (!notification.read) {
          toast({
            title: notification.title || 'New Notification',
            description: notification.description,
            variant: getToastVariant(notification.type),
          });
        }
      });
    }
    
    setLastNotificationCount(notifications.length);
  }, [notifications.length, lastNotificationCount, autoToast, toast, notifications]);

  const getToastVariant = (type) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'success':
        return 'default';
      case 'warning':
        return 'default';
      default:
        return 'default';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return notificationTime.toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle notification action if provided
    if (notification.action) {
      notification.action();
    }
  };

  const displayNotifications = notifications.slice(0, maxDisplay);

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        
        {/* Connection Status Indicator */}
        <div className={cn(
          'absolute -top-1 -left-1 h-3 w-3 rounded-full border-2 border-white',
          isConnected ? 'bg-green-500' : 'bg-gray-400'
        )} />
        
        {/* Unread Badge */}
        {showBadge && unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 min-w-5 text-xs p-0 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notifications Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-80 z-50"
            >
              <Card className="shadow-lg border-0">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {/* Connection Status */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className={cn(
                          'h-2 w-2 rounded-full',
                          isConnected ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        {isConnected ? 'Live' : 'Offline'}
                      </div>
                      
                      {/* Mark All Read */}
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs h-6 px-2"
                        >
                          Mark all read
                        </Button>
                      )}
                      
                      {/* Close Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-0 max-h-96 overflow-y-auto">
                  {displayNotifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {displayNotifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
                            !notification.read && 'bg-blue-50/50'
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Notification Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* Notification Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className={cn(
                                    'text-sm font-medium',
                                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                                  )}>
                                    {notification.title}
                                  </p>
                                  {notification.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {notification.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatTimestamp(notification.timestamp)}
                                  </p>
                                </div>

                                {/* Unread Indicator */}
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Show More Link */}
                  {notifications.length > maxDisplay && (
                    <div className="p-3 border-t border-gray-100 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-600"
                        onClick={() => {
                          // Navigate to full notifications page
                          setIsOpen(false);
                        }}
                      >
                        View all {notifications.length} notifications
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RealtimeNotifications;

