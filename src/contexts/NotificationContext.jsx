import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { realtimeCapability } from '@/lib/realtimeCapability';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false); // Start as false

  // Listen for realtime capability changes
  useEffect(() => {
    const handleCapabilityChange = (enabled) => {
      setRealtimeEnabled(enabled);
      if (!enabled) {
        setIsConnected(false);
        logger.info('🔄 NotificationContext: Realtime disabled, using polling mode');
      }
    };

    realtimeCapability.onCapabilityChange(handleCapabilityChange);
    
    // Set initial state
    const capability = realtimeCapability.getCapability();
    if (capability.testCompleted) {
      setRealtimeEnabled(capability.isEnabled);
    }

    return () => {
      realtimeCapability.removeCallback(handleCapabilityChange);
    };
  }, []);

  // Real-time notification handler
  const handleRealtimeNotification = useCallback((payload) => {
    logger.info('Real-time notification received:', payload);

    if (payload.eventType === 'INSERT' && payload.new) {
      const notification = {
        id: payload.new.id,
        type: payload.new.type,
        title: payload.new.title,
        description: payload.new.description,
        timestamp: payload.new.created_at,
        read: payload.new.read,
        data: payload.new.data,
      };

      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === payload.new.id
            ? { ...notif, read: payload.new.read }
            : notif
        )
      );

      if (payload.old?.read === false && payload.new?.read === true) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  }, []);  // Set up real-time subscription for user notifications
  useEffect(() => {
    if (!user?.id || !supabase || !realtimeEnabled) {
      if (!realtimeEnabled) {
        logger.info('📤 NotificationContext: Realtime disabled, notifications will work in polling mode');
      }
      return;
    }

    logger.info('Setting up real-time notifications for user:', user.id);

    let channel;
    
    try {
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          handleRealtimeNotification
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            logger.info('✅ Real-time notifications connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            logger.warn('⚠️ Real-time notifications connection error:', status);
            // Disable realtime capability on persistent errors
            realtimeCapability.disable(`Notification subscription error: ${status}`);
          }
        });
    } catch (error) {
      logger.error('❌ Failed to setup real-time notifications:', error);
      logger.info('🔄 Disabling real-time notifications due to transport error');
      setIsConnected(false);
      realtimeCapability.disable(`Transport error: ${error.message}`);
      return;
    }

    return () => {
      if (channel) {
        logger.info('🧹 Cleaning up real-time notifications');
        try {
          channel.unsubscribe();
          supabase.removeChannel(channel);
        } catch (error) {
          logger.warn('Error cleaning up notification channel:', error);
        }
        setIsConnected(false);
      }
    };
  }, [user?.id, handleRealtimeNotification, realtimeEnabled]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    // Update local state immediately
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Update in database if it's a real notification
    if (user?.id && typeof notificationId === 'string') {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', user.id);
      } catch (error) {
        logger.error('Failed to mark notification as read:', error);
      }
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    // Update local state
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);

    // Update in database
    if (user?.id) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
      } catch (error) {
        logger.error('Failed to mark all notifications as read:', error);
      }
    }
  }, [user?.id]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return default values if context doesn't exist
    return {
      notifications: [],
      unreadCount: 0,
      isConnected: false,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearNotifications: () => {},
    };
  }
  return context;
};



