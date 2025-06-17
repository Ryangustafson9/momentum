/**
 * 🟢 REAL-TIME PRESENCE SYSTEM
 * Track online users, staff activity, and live interactions
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { useAuthContext } from '@/providers/AuthProvider';

/**
 * Real-time presence hook for tracking online users
 * @param {string} room - Room/channel name for presence
 * @param {Object} userMetadata - Additional user data to share
 * @param {boolean} enabled - Whether presence is enabled
 */
export const useRealtimePresence = (room = 'general', userMetadata = {}, enabled = true) => {
  const { user } = useAuthContext();
  const channelRef = useRef(null);
  const [presenceState, setPresenceState] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const channelName = `presence-${room}`;

  // Update online users from presence state
  const updateOnlineUsers = useCallback((state) => {
    const users = [];
    
    Object.keys(state).forEach(userId => {
      const presences = state[userId];
      if (presences && presences.length > 0) {
        // Get the most recent presence for this user
        const latestPresence = presences[presences.length - 1];
        users.push({
          id: userId,
          ...latestPresence,
          lastSeen: new Date(),
        });
      }
    });

    setOnlineUsers(users);
    logger.info(`👥 Online users in ${room}:`, users.length);
  }, [room]);

  // Handle presence sync
  const handlePresenceSync = useCallback(() => {
    if (!channelRef.current) return;

    const state = channelRef.current.presenceState();
    setPresenceState(state);
    updateOnlineUsers(state);
    
    logger.info(`🔄 Presence sync for ${room}:`, state);
  }, [room, updateOnlineUsers]);

  // Handle user join
  const handlePresenceJoin = useCallback((key, currentPresences, newPresences) => {
    logger.info(`👋 User joined ${room}:`, { key, newPresences });
    
    if (channelRef.current) {
      const state = channelRef.current.presenceState();
      setPresenceState(state);
      updateOnlineUsers(state);
    }
  }, [room, updateOnlineUsers]);

  // Handle user leave
  const handlePresenceLeave = useCallback((key, currentPresences, leftPresences) => {
    logger.info(`👋 User left ${room}:`, { key, leftPresences });
    
    if (channelRef.current) {
      const state = channelRef.current.presenceState();
      setPresenceState(state);
      updateOnlineUsers(state);
    }
  }, [room, updateOnlineUsers]);

  // Track user's own presence
  const trackPresence = useCallback(async (metadata = {}) => {
    if (!channelRef.current || !user) return;

    const presenceData = {
      user_id: user.id,
      name: user.name || user.email,
      email: user.email,
      role: user.role,
      avatar: user.avatar_url,
      status: 'online',
      lastActivity: new Date().toISOString(),
      ...userMetadata,
      ...metadata,
    };

    try {
      await channelRef.current.track(presenceData);
      logger.info(`📍 Tracking presence in ${room}:`, presenceData);
    } catch (error) {
      logger.error(`❌ Failed to track presence in ${room}:`, error);
    }
  }, [user, room, userMetadata]);

  // Update user status
  const updateStatus = useCallback(async (status, metadata = {}) => {
    await trackPresence({ status, ...metadata });
  }, [trackPresence]);

  // Send broadcast message
  const broadcast = useCallback(async (event, payload) => {
    if (!channelRef.current) return;

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event,
        payload: {
          ...payload,
          from: user?.id,
          timestamp: new Date().toISOString(),
        },
      });
      
      logger.info(`📡 Broadcast sent in ${room}:`, { event, payload });
    } catch (error) {
      logger.error(`❌ Failed to broadcast in ${room}:`, error);
    }
  }, [room, user]);

  useEffect(() => {
    if (!enabled || !user || !supabase) {
      return;
    }

    logger.info(`🟢 Setting up presence in room: ${room}`);

    try {
      // Create presence channel
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      // Set up presence event listeners
      channel
        .on('presence', { event: 'sync' }, handlePresenceSync)
        .on('presence', { event: 'join' }, handlePresenceJoin)
        .on('presence', { event: 'leave' }, handlePresenceLeave)
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            await trackPresence();
            logger.info(`✅ Presence connected in ${room}`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false);
            logger.warn(`⚠️ Presence connection error in ${room}:`, status);
          }
        });

      channelRef.current = channel;

    } catch (error) {
      logger.error(`❌ Failed to setup presence in ${room}:`, error);
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        logger.info(`🧹 Cleaning up presence in ${room}`);
        
        try {
          channelRef.current.untrack();
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          logger.warn(`⚠️ Error during presence cleanup in ${room}:`, error);
        }
        
        channelRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
        setPresenceState({});
      }
    };
  }, [enabled, user, room, channelName, handlePresenceSync, handlePresenceJoin, handlePresenceLeave, trackPresence]);

  // Update activity periodically
  useEffect(() => {
    if (!isConnected || !enabled) return;

    const interval = setInterval(() => {
      trackPresence({ lastActivity: new Date().toISOString() });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, enabled, trackPresence]);

  return {
    onlineUsers,
    presenceState,
    isConnected,
    updateStatus,
    broadcast,
    trackPresence,
  };
};

/**
 * Hook for staff presence tracking
 */
export const useStaffPresence = (enabled = true) => {
  const { user } = useAuthContext();
  const isStaff = user?.role === 'staff' || user?.role === 'admin';

  return useRealtimePresence(
    'staff-room',
    {
      department: user?.department || 'general',
      shift: user?.shift || 'day',
    },
    enabled && isStaff
  );
};

/**
 * Hook for member presence in specific areas
 */
export const useMemberPresence = (area = 'gym', enabled = true) => {
  const { user } = useAuthContext();
  const isMember = user?.role === 'member';

  return useRealtimePresence(
    `member-${area}`,
    {
      membershipType: user?.membership_type,
      area,
    },
    enabled && isMember
  );
};

/**
 * Hook for class presence tracking
 */
export const useClassPresence = (classId, enabled = true) => {
  const { user } = useAuthContext();

  return useRealtimePresence(
    `class-${classId}`,
    {
      classId,
      role: user?.role,
    },
    enabled && classId
  );
};
