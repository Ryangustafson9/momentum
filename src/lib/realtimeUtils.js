// src/lib/realtimeUtils.js
import { supabase } from './supabaseClient.js';

// Realtime monitoring state
let realtimeChannel = null;
let monitoringRetries = 0;
const MAX_MONITORING_RETRIES = 3;

// Initialize realtime connection monitoring with retry logic
const initializeRealtimeMonitoring = async () => {
  if (monitoringRetries >= MAX_MONITORING_RETRIES) {
    
    return;
  }

  try {
    
    
    // Wait a moment for supabase client to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a simple monitoring channel
    realtimeChannel = supabase.channel(`system-status-${Date.now()}`);
    
    // Subscribe with enhanced error handling
    const subscription = realtimeChannel.subscribe((status, err) => {
      if (err) {
        
        return;
      }
      
      switch (status) {
        case 'SUBSCRIBED':
          
          monitoringRetries = 0; // Reset retry counter on success
          break;
        case 'CHANNEL_ERROR':
          
          scheduleRealtimeRetry();
          break;
        case 'TIMED_OUT':
          
          scheduleRealtimeRetry();
          break;
        case 'CLOSED':
          
          break;
        default:
          
      }
    });
    
  } catch (error) {
    
    scheduleRealtimeRetry();
  }
};

// Schedule retry for realtime monitoring
const scheduleRealtimeRetry = () => {
  monitoringRetries++;
  if (monitoringRetries < MAX_MONITORING_RETRIES) {
    
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
    
    return 'ERROR';
  }
}

export function createRealtimeChannel(channelName, options = {}) {
  try {
    // Add random suffix to avoid channel name conflicts
    const uniqueChannelName = `${channelName}-${Date.now()}`;
    
    
    
    const channel = supabase.channel(uniqueChannelName, {
      // Enhanced channel configuration for stability
      config: {
        broadcast: { self: true },
        presence: { key: '' },
        ...options.config
      },
      ...options
    });
    
    
    return channel;
  } catch (error) {
    
    return null;
  }
}

export function removeRealtimeChannel(channel) {
  try {
    if (channel && supabase.removeChannel) {
      supabase.removeChannel(channel);
      
      return true;
    }
    return false;
  } catch (error) {
    
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
    
  } catch (error) {
    
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

