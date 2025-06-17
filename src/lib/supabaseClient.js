import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@/lib/logger';
import { env } from '@/lib/env';

// Create logger for Supabase operations
const logger = createLogger('Supabase');

// Supabase ready state management
let _ready = false;
let _initializing = false;
const _readyCallbacks = [];

export function supabaseReady() {
  return _ready;
}

export function onSupabaseReady(callback) {
  if (_ready) {
    callback();
  } else {
    _readyCallbacks.push(callback);
  }
}

export function waitForSupabase() {
  return new Promise((resolve) => {
    if (_ready) {
      resolve(true);
    } else {
      _readyCallbacks.push(() => resolve(true));
    }
  });
}

function markSupabaseReady() {
  if (!_ready) {
    _ready = true;
    logger.info('✅ Supabase client marked as ready');
    
    // Execute all waiting callbacks
    _readyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logger.error('Ready callback error:', error);
      }
    });
    
    // Clear callbacks array
    _readyCallbacks.length = 0;
  }
}

// Enhanced environment variable validation for local development
const supabaseUrl = env.SUPABASE.URL;
const supabaseAnonKey = env.SUPABASE.ANON_KEY;

// Comprehensive validation with local development awareness
if (!supabaseUrl) {
  logger.error('VITE_SUPABASE_URL is missing from environment variables');
  logger.error('📋 Add VITE_SUPABASE_URL=http://127.0.0.1:54321 to your .env file');
  logger.error('💡 Note: Vite requires VITE_ prefix for client-side access');
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  logger.error('VITE_SUPABASE_ANON_KEY is missing from environment variables');
  logger.error('📋 Add VITE_SUPABASE_ANON_KEY=your_anon_key to your .env file');
  logger.error('💡 Note: Vite requires VITE_ prefix for client-side access');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Detect local vs production environment
export const isLocalDevelopment = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');

if (isLocalDevelopment) {
  logger.info('🏠 Local Supabase development environment detected');
  logger.info('🔗 Supabase URL:', supabaseUrl);
} else {
  // Validate production URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    logger.error('Invalid Supabase URL format for production:', supabaseUrl);
    logger.error('📋 Production URL should be: https://your-project.supabase.co');
    throw new Error('Invalid VITE_SUPABASE_URL format for production');
  }
  logger.info('☁️ Production Supabase environment detected');
  logger.info('🔗 Supabase URL:', supabaseUrl);
}

// Basic key validation
if (supabaseAnonKey.length < 50) {
  logger.error('Supabase anon key appears to be invalid (too short)');
  logger.error('📋 Key should be a JWT token starting with eyJ...');
  throw new Error('Invalid VITE_SUPABASE_ANON_KEY format');
}

logger.info('✅ Environment variables validated successfully');
logger.info('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

// Enhanced WebSocket transport configuration for local development
const realtimeConfig = {
  params: {
    eventsPerSecond: 10,
  },
  // Fix transport configuration for browser compatibility
  ...(isLocalDevelopment ? {
    // For local development, use minimal config to avoid transport errors
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: () => Math.random() * 5000 + 1000,
  } : {
    // Production configuration
    transport: 'websocket',
    timeout: 20000,
  })
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    debug: isLocalDevelopment, // Enable debug in development
    flowType: 'pkce' // Use PKCE flow for better security and session handling
  },
  realtime: realtimeConfig,
  global: {
    headers: {
      'x-application-name': 'momentum-gym-app',
      'x-environment': isLocalDevelopment ? 'development' : 'production'
    }
  }
});

logger.info('🔧 Supabase client initialized successfully with enhanced WebSocket config');

// Realtime monitoring state
let realtimeChannel = null;
let monitoringRetries = 0;
const MAX_MONITORING_RETRIES = 3;

// Initialize realtime connection monitoring with retry logic
const initializeRealtimeMonitoring = async () => {
  if (monitoringRetries >= MAX_MONITORING_RETRIES) {
    logger.warn('Max realtime monitoring retries reached, skipping for stability');
    return;
  }

  try {
    logger.info(`📡 Initializing realtime monitoring (attempt ${monitoringRetries + 1}/${MAX_MONITORING_RETRIES})`);

    // Wait a moment for supabase client to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a simple monitoring channel with UUID for uniqueness
    realtimeChannel = supabase.channel(`system-status-${uuidv4()}`);

    // Subscribe with enhanced error handling
    const subscription = realtimeChannel.subscribe((status, err) => {
      if (err) {
        logger.warn('Realtime subscription error:', err.message);
        return;
      }

      switch (status) {
        case 'SUBSCRIBED':
          logger.info('✅ Supabase realtime connected successfully');
          monitoringRetries = 0; // Reset retry counter on success
          break;
        case 'CHANNEL_ERROR':
          logger.warn('Supabase realtime channel error (will retry)');
          scheduleRealtimeRetry();
          break;
        case 'TIMED_OUT':
          logger.warn('Supabase realtime connection timed out');
          scheduleRealtimeRetry();
          break;
        case 'CLOSED':
          logger.info('🔌 Supabase realtime connection closed');
          break;
        default:
          logger.info('📡 Supabase realtime status:', status);
      }
    });

  } catch (error) {
    logger.warn(`Realtime monitoring setup failed (attempt ${monitoringRetries + 1}):`, error.message);
    scheduleRealtimeRetry();
  }
};

// Schedule retry for realtime monitoring
const scheduleRealtimeRetry = () => {
  monitoringRetries++;
  if (monitoringRetries < MAX_MONITORING_RETRIES) {
    logger.info(`🔄 Scheduling realtime retry in ${monitoringRetries * 2} seconds...`);
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
    logger.warn('Error getting realtime status:', error.message);
    return 'ERROR';
  }
}

export function createRealtimeChannel(channelName, options = {}) {
  try {
    // Use UUID for truly unique channel names instead of timestamp
    const uniqueChannelName = `${channelName}-${uuidv4()}`;
    
    logger.info(`📺 Creating realtime channel: ${uniqueChannelName}`);
    
    const channel = supabase.channel(uniqueChannelName, {
      // Enhanced channel configuration for stability
      config: {
        broadcast: { self: true },
        presence: { key: '' },
        ...options.config
      },
      ...options
    });
    
    logger.info(`✅ Created realtime channel: ${uniqueChannelName}`);
    return channel;
  } catch (error) {
    logger.warn(`Failed to create realtime channel ${channelName}:`, error.message);
    return null;
  }
}

export function removeRealtimeChannel(channel) {
  try {
    if (channel) {
      // Unsubscribe from the channel first
      if (channel.unsubscribe) {
        channel.unsubscribe();
        logger.info('📺 Channel unsubscribed successfully');
      }
      
      // Then remove the channel from Supabase
      if (supabase.removeChannel) {
        supabase.removeChannel(channel);
        logger.info('📺 Realtime channel removed successfully');
      }
      
      return true;
    }
    return false;
  } catch (error) {
    logger.warn('Failed to remove realtime channel:', error.message);
    return false;
  }
}

// Enhanced cleanup function for graceful shutdown
export function cleanup() {
  try {
    if (realtimeChannel) {
      // Unsubscribe before removing
      if (realtimeChannel.unsubscribe) {
        realtimeChannel.unsubscribe();
        logger.info('📺 System channel unsubscribed');
      }
      
      removeRealtimeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    monitoringRetries = 0;
    logger.info('🧹 Supabase client cleanup completed');
  } catch (error) {
    logger.error('Cleanup failed:', error);
  }
}

// Register cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}

// Utility functions
export async function getPublicUsers() {
  try {
    const { data, error } = await supabase
      .from('users') 
      .select('*');
    
    if (error) {
      logger.error('Error fetching users:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    logger.error('Unexpected error in getPublicUsers:', err);
    return [];
  }
}

export async function testConnection() {
  try {
    logger.info('🔍 Testing Supabase connection...');
    
    // Wait for client to be ready if not already
    if (!_ready) {
      logger.info('⏳ Waiting for Supabase client to be ready...');
      await waitForSupabase();
    }
    
    // Test with a simple query that should work in both local and production
    const { data, error } = await supabase
      .from('general_settings')
      .select('count')
      .limit(1);
    
    logger.info('📊 Connection test result:', { data, error });
    
    if (error) {
      logger.error('Connection test failed:', error);
      // For local development, try alternative test
      if (isLocalDevelopment) {
        logger.info('🔄 Trying alternative connection test for local environment...');
        const { error: healthError } = await supabase.from('general_settings').select('*').limit(1);
        return !healthError;
      }
      return false;
    }
    
    logger.info('✅ Supabase connection confirmed');
    return true;
    
  } catch (err) {
    logger.error('Connection test failed:', err);
    return false;
  }
}

// ENHANCED: Database health check utility
export async function checkDatabaseHealth() {
  try {
    const results = await Promise.allSettled([
      // Test critical tables
      supabase.from('general_settings').select('count').limit(1),
      supabase.from('profiles').select('count').limit(1)
    ]);
    
    const healthReport = {
      settings: results[0].status === 'fulfilled' && !results[0].value.error,
      profiles: results[1].status === 'fulfilled' && !results[1].value.error,
      overall: results.every(r => r.status === 'fulfilled' && !r.value.error),
      realtime: getRealtimeStatus(),
      realtimeRetries: monitoringRetries
    };
    
    logger.info('🏥 Database health check:', healthReport);
    return healthReport;
    
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      settings: false,
      profiles: false,
      overall: false,
      realtime: 'ERROR',
      realtimeRetries: monitoringRetries,
      error: error.message
    };
  }
}

export function getSupabaseLoadingState() {
  return {
    ready: _ready,
    initializing: _initializing,
    status: _ready ? 'ready' : _initializing ? 'initializing' : 'pending'
  };
}

// Initialize connection test (non-blocking)
(async () => {
  if (_initializing) return; // Prevent multiple initialization
  _initializing = true;
  
  try {
    logger.info('🔄 Initializing Supabase connection...');
    
    const connected = await testConnection();
    if (connected) {
      logger.info('🚀 Application ready for database operations');
      
      // Mark Supabase as ready for use
      markSupabaseReady();
      
      // Run health check after successful connection
      setTimeout(async () => {
        await checkDatabaseHealth();
      }, 5000);
    } else {
      logger.warn('Database connection issues detected - some features may not work');
      
      // Still mark as ready for offline functionality
      markSupabaseReady();
    }
  } catch (error) {
    logger.error('Startup connection test failed:', error);
    
    // Mark as ready even if connection fails (for offline handling)
    markSupabaseReady();
  } finally {
    _initializing = false;
  }
})();

export default supabase;


