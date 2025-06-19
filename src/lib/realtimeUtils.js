// src/lib/realtimeUtils.js
import { supabase } from './supabaseClient.js';

// Realtime monitoring state
let realtimeChannel = null;
let monitoringRetries = 0;
const MAX_MONITORING_RETRIES = 3;

// Initialize realtime connection monitoring with retry logic
const initializeRealtimeMonitoring = async () => {
  if (monitoringRetries >= MAX_MONITORING_RETRIES) {
    console.warn('⚠️ Max realtime monitoring retries reached, skipping for stability');
    return;
  }

  try {
    console.log(`📡 Initializing realtime monitoring (attempt ${monitoringRetries + 1}/${MAX_MONITORING_RETRIES})`);
    
    // Wait a moment for supabase client to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a simple monitoring channel
    realtimeChannel = supabase.channel(`system-status-${Date.now()}`);
    
    // Subscribe with enhanced error handling
    const subscription = realtimeChannel.subscribe((status, err) => {
      if (err) {
        console.warn('⚠️ Realtime subscription error:', err.message);
        return;
      }
      
      switch (status) {
        case 'SUBSCRIBED':
          console.log('✅ Supabase realtime connected successfully');
          monitoringRetries = 0; // Reset retry counter on success
          break;
        case 'CHANNEL_ERROR':
          console.warn('⚠️ Supabase realtime channel error (will retry)');
          scheduleRealtimeRetry();
          break;
        case 'TIMED_OUT':
          console.warn('⏰ Supabase realtime connection timed out');
          scheduleRealtimeRetry();
          break;
        case 'CLOSED':
          console.log('🔌 Supabase realtime connection closed');
          break;
        default:
          console.log('📡 Supabase realtime status:', status);
      }
    });
    
  } catch (error) {
    console.warn(`⚠️ Realtime monitoring setup failed (attempt ${monitoringRetries + 1}):`, error.message);
    scheduleRealtimeRetry();
  }
};

// Schedule retry for realtime monitoring
const scheduleRealtimeRetry = () => {
  monitoringRetries++;
  if (monitoringRetries < MAX_MONITORING_RETRIES) {
    console.log(`🔄 Scheduling realtime retry in ${monitoringRetries * 2} seconds...`);
    setTimeout(initializeRealtimeMonitoring, monitoringRetries * 2000);
  }
};

// Initialize realtime monitoring with delay
setTimeout(initializeRealtimeMonitoring, 2000);

// Realtime utilities with better error handling
export function getRealtimeStatus() {
  try {
    if (!realtimeChannel) {
      return 'NOT_INITIALIZED';
    }
    return realtimeChannel.state || 'UNKNOWN';
  } catch (error) {
    console.warn('⚠️ Error getting realtime status:', error.message);
    return 'ERROR';
  }
}

export function createRealtimeChannel(channelName, options = {}) {
  try {
    // Add random suffix to avoid channel name conflicts
    const uniqueChannelName = `${channelName}-${Date.now()}`;
    
    console.log(`📺 Creating realtime channel: ${uniqueChannelName}`);
    
    const channel = supabase.channel(uniqueChannelName, {
      // Enhanced channel configuration for stability
      config: {
        broadcast: { self: true },
        presence: { key: '' },
        ...options.config
      },
      ...options
    });
    
    console.log(`✅ Created realtime channel: ${uniqueChannelName}`);
    return channel;
  } catch (error) {
    console.warn(`⚠️ Failed to create realtime channel ${channelName}:`, error.message);
    return null;
  }
}

export function removeRealtimeChannel(channel) {
  try {
    if (channel && supabase.removeChannel) {
      supabase.removeChannel(channel);
      console.log('📺 Realtime channel removed successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('⚠️ Failed to remove realtime channel:', error.message);
    return false;
  }
}

// Enhanced cleanup function for graceful shutdown
export function cleanupRealtime() {
  try {
    if (realtimeChannel) {
      removeRealtimeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    monitoringRetries = 0;
    console.log('🧹 Realtime cleanup completed');
  } catch (error) {
    console.error('❌ Realtime cleanup failed:', error);
  }
}

// Export monitoring retries count for health checks
export function getMonitoringRetries() {
  return monitoringRetries;
}

// Register cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupRealtime);
}
