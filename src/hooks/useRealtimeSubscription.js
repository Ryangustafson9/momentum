/**
 * 🔄 ENHANCED REAL-TIME SUBSCRIPTION HOOK
 * Comprehensive real-time data synchronization with automatic cleanup
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { useNotifications } from '@/contexts/NotificationContext';
import { realtimeCapability } from '@/lib/realtimeCapability';

/**
 * Enhanced real-time subscription hook with automatic query invalidation
 * @param {Object} config - Subscription configuration
 * @param {string} config.table - Database table to subscribe to
 * @param {string} config.event - Event type ('*', 'INSERT', 'UPDATE', 'DELETE')
 * @param {string} config.filter - Optional filter for the subscription
 * @param {Array} config.queryKeys - Query keys to invalidate on changes
 * @param {Function} config.onData - Optional callback for data changes
 * @param {boolean} config.enabled - Whether subscription is enabled
 * @param {Object} config.notificationConfig - Notification configuration
 */
export const useRealtimeSubscription = ({
  table,
  event = '*',
  filter = null,
  queryKeys = [],
  onData = null,
  enabled = true,
  notificationConfig = null,
}) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const channelRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);

  // Listen for realtime capability changes
  useEffect(() => {
    const handleCapabilityChange = (capabilityEnabled) => {
      setRealtimeEnabled(capabilityEnabled);
      if (!capabilityEnabled) {
        setIsConnected(false);
        logger.info(`useRealtimeSubscription: Realtime disabled for ${table}, falling back to query-only mode`);
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
  }, [table]);

  // Create unique channel name
  const channelName = `realtime-${table}-${event}${filter ? `-${filter}` : ''}-${Date.now()}`;

  const handleDataChange = useCallback((payload) => {
    logger.info(`Real-time update received for ${table}:`, payload);

    // Invalidate related queries
    if (queryKeys.length > 0) {
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
    }

    // Call custom data handler
    if (onData) {
      onData(payload);
    }

    // Show notification if configured
    if (notificationConfig) {
      const { type, getTitle, getDescription } = notificationConfig;
      
      addNotification({
        type: type || 'info',
        title: getTitle ? getTitle(payload) : `${table} updated`,
        description: getDescription ? getDescription(payload) : `A ${payload.eventType} occurred`,
        data: payload,
      });
    }

    setError(null);
  }, [table, queryKeys, queryClient, onData, notificationConfig, addNotification]);
  const handleSubscriptionStatus = useCallback((status, err) => {
    logger.info(`Subscription status for ${table}:`, status);

    switch (status) {
      case 'SUBSCRIBED':
        setIsConnected(true);
        setError(null);
        logger.info(`✅ Successfully subscribed to ${table} changes`);
        break;
      case 'CHANNEL_ERROR':
      case 'TIMED_OUT':
        setIsConnected(false);
        setError(err || new Error(`Subscription ${status.toLowerCase()}`));
        logger.warn(`⚠️ Subscription error for ${table}:`, err);
        realtimeCapability.disable(`useRealtimeSubscription ${table} channel error: ${status}`);
        break;
      case 'CLOSED':
        setIsConnected(false);
        logger.info(`🔌 Subscription closed for ${table}`);
        break;
      default:
        logger.info(`📡 Subscription status for ${table}:`, status);
    }
  }, [table]);
  useEffect(() => {
    if (!enabled || !supabase || !realtimeEnabled) {
      if (!realtimeEnabled) {
        logger.info(`useRealtimeSubscription: Realtime disabled for ${table}, queries will work without real-time updates`);
      }
      return;
    }

    logger.info(`🔄 Setting up real-time subscription for ${table}`);

    try {
      // Create channel
      const channel = supabase.channel(channelName);

      // Configure postgres changes listener
      const changeConfig = {
        event,
        schema: 'public',
        table,
      };

      if (filter) {
        changeConfig.filter = filter;
      }

      // Set up subscription
      channel
        .on('postgres_changes', changeConfig, handleDataChange)
        .subscribe(handleSubscriptionStatus);

      channelRef.current = channel;

      logger.info(`📺 Created real-time channel: ${channelName}`);

    } catch (error) {
      logger.error(`❌ Failed to create real-time subscription for ${table}:`, error);
      setError(error);
      realtimeCapability.disable(`useRealtimeSubscription error for ${table}: ${error.message}`);
    }

    // Cleanup function
    return () => {
      if (channelRef.current) {
        logger.info(`🧹 Cleaning up real-time subscription for ${table}`);
        
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          logger.warn(`⚠️ Error during subscription cleanup for ${table}:`, error);
        }
        
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, table, event, filter, channelName, handleDataChange, handleSubscriptionStatus, realtimeEnabled]);

  return {
    isConnected,
    error,
    channel: channelRef.current,
  };
};

/**
 * Hook for real-time member updates
 */
export const useRealtimeMembers = (enabled = true) => {
  return useRealtimeSubscription({
    table: 'members',
    event: '*',
    queryKeys: [['members'], ['member-stats']],
    enabled,
    notificationConfig: {
      type: 'info',
      getTitle: (payload) => {
        switch (payload.eventType) {
          case 'INSERT': return 'New Member Joined';
          case 'UPDATE': return 'Member Updated';
          case 'DELETE': return 'Member Removed';
          default: return 'Member Change';
        }
      },
      getDescription: (payload) => {
        const member = payload.new || payload.old;
        return member?.name ? `${member.name}` : 'Member data changed';
      },
    },
  });
};

/**
 * Hook for real-time class updates
 */
export const useRealtimeClasses = (enabled = true) => {
  return useRealtimeSubscription({
    table: 'classes',
    event: '*',
    queryKeys: [['classes'], ['class-stats'], ['member-classes']],
    enabled,
    notificationConfig: {
      type: 'info',
      getTitle: (payload) => {
        switch (payload.eventType) {
          case 'INSERT': return 'New Class Added';
          case 'UPDATE': return 'Class Updated';
          case 'DELETE': return 'Class Cancelled';
          default: return 'Class Change';
        }
      },
      getDescription: (payload) => {
        const classData = payload.new || payload.old;
        return classData?.name ? `${classData.name}` : 'Class schedule changed';
      },
    },
  });
};

/**
 * Hook for real-time attendance updates
 */
export const useRealtimeAttendance = (memberId = null, enabled = true) => {
  const filter = memberId ? `member_id=eq.${memberId}` : null;
  
  return useRealtimeSubscription({
    table: 'attendance',
    event: '*',
    filter,
    queryKeys: [['attendance'], ['member-attendance'], ['attendance-stats']],
    enabled,
    notificationConfig: {
      type: 'success',
      getTitle: (payload) => {
        switch (payload.eventType) {
          case 'INSERT': return 'Check-in Recorded';
          case 'UPDATE': return 'Attendance Updated';
          default: return 'Attendance Change';
        }
      },
      getDescription: (payload) => {
        return 'Member activity recorded';
      },
    },
  });
};

/**
 * Hook for real-time billing updates
 */
export const useRealtimeBilling = (memberId = null, enabled = true) => {
  const filter = memberId ? `member_id=eq.${memberId}` : null;
  
  return useRealtimeSubscription({
    table: 'billing',
    event: '*',
    filter,
    queryKeys: [['billing'], ['member-billing']],
    enabled,
    notificationConfig: {
      type: 'info',
      getTitle: (payload) => {
        switch (payload.eventType) {
          case 'INSERT': return 'New Billing Record';
          case 'UPDATE': return 'Billing Updated';
          default: return 'Billing Change';
        }
      },
      getDescription: (payload) => {
        const billing = payload.new || payload.old;
        return billing?.amount ? `Amount: $${billing.amount}` : 'Billing information changed';
      },
    },
  });
};

