import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { checkDatabaseHealth } from '@/lib/healthUtils';

// Central logging system for consistent formatting and production control
function log(message, ...args) {
  if (import.meta.env.MODE !== 'production') {
    console.log(`[Supabase] ${message}`, ...args);
  }
}

function logError(message, ...args) {
  if (import.meta.env.MODE !== 'production') {
    console.error(`[Supabase] ❌ ${message}`, ...args);
  }
}

function logWarn(message, ...args) {
  if (import.meta.env.MODE !== 'production') {
    console.warn(`[Supabase] ⚠️ ${message}`, ...args);
  }
}

function logInfo(message, ...args) {
  if (import.meta.env.MODE !== 'production') {
    console.info(`[Supabase] ℹ️ ${message}`, ...args);
  }
}

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
    log('✅ Supabase client marked as ready');
    
    // Execute all waiting callbacks
    _readyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logError('Ready callback error:', error);
      }
    });
    
    // Clear callbacks array
    _readyCallbacks.length = 0;
  }
}

// Enhanced environment variable validation for local development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Comprehensive validation with local development awareness
if (!supabaseUrl) {
  logError('VITE_SUPABASE_URL is missing from environment variables');
  logError('📋 Add VITE_SUPABASE_URL=http://127.0.0.1:54321 to your .env file');
  logError('💡 Note: Vite requires VITE_ prefix for client-side access');
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  logError('VITE_SUPABASE_ANON_KEY is missing from environment variables');
  logError('📋 Add VITE_SUPABASE_ANON_KEY=your_anon_key to your .env file');
  logError('💡 Note: Vite requires VITE_ prefix for client-side access');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Detect local vs production environment
export const isLocalDevelopment = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');

if (isLocalDevelopment) {
  log('🏠 Local Supabase development environment detected');
  log('🔗 Supabase URL:', supabaseUrl);
} else {
  // Validate production URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    logError('Invalid Supabase URL format for production:', supabaseUrl);
    logError('📋 Production URL should be: https://your-project.supabase.co');
    throw new Error('Invalid VITE_SUPABASE_URL format for production');
  }
  log('☁️ Production Supabase environment detected');
  log('🔗 Supabase URL:', supabaseUrl);
}

// Basic key validation
if (supabaseAnonKey.length < 50) {
  logError('Supabase anon key appears to be invalid (too short)');
  logError('📋 Key should be a JWT token starting with eyJ...');
  throw new Error('Invalid VITE_SUPABASE_ANON_KEY format');
}

log('✅ Environment variables validated successfully');
log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

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

// ⚡ REQUEST TIMEOUT FIX: Add timeout configuration for API calls
const REQUEST_TIMEOUT = 30000; // 30 seconds
const UPLOAD_TIMEOUT = 120000; // 2 minutes for file uploads

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: realtimeConfig,
  global: {
    headers: {
      'x-application-name': 'momentum-gym-app',
      'x-environment': isLocalDevelopment ? 'development' : 'production'
    },
    // Add request timeout configuration
    fetch: (url, options = {}) => {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        const timeout = options.timeout || REQUEST_TIMEOUT;
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      });

      // Create fetch promise with timeout
      const fetchPromise = fetch(url, {
        ...options,
        signal: options.signal || AbortSignal.timeout?.(options.timeout || REQUEST_TIMEOUT)
      });

      // Race between fetch and timeout
      return Promise.race([fetchPromise, timeoutPromise]);
    }
  }
});

log('🔧 Supabase client initialized successfully with enhanced WebSocket config');

// Realtime monitoring state
let realtimeChannel = null;
let monitoringRetries = 0;
const MAX_MONITORING_RETRIES = 3;

// Initialize realtime connection monitoring with retry logic
const initializeRealtimeMonitoring = async () => {
  if (monitoringRetries >= MAX_MONITORING_RETRIES) {
    logWarn('Max realtime monitoring retries reached, skipping for stability');
    return;
  }

  try {
    log(`📡 Initializing realtime monitoring (attempt ${monitoringRetries + 1}/${MAX_MONITORING_RETRIES})`);
    
    // Wait a moment for supabase client to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a simple monitoring channel with UUID for uniqueness
    realtimeChannel = supabase.channel(`system-status-${uuidv4()}`);
    
    // Subscribe with enhanced error handling
    const subscription = realtimeChannel.subscribe((status, err) => {
      if (err) {
        logWarn('Realtime subscription error:', err.message);
        return;
      }
      
      switch (status) {
        case 'SUBSCRIBED':
          log('✅ Supabase realtime connected successfully');
          monitoringRetries = 0; // Reset retry counter on success
          break;
        case 'CHANNEL_ERROR':
          logWarn('Supabase realtime channel error (will retry)');
          scheduleRealtimeRetry();
          break;
        case 'TIMED_OUT':
          logWarn('Supabase realtime connection timed out');
          scheduleRealtimeRetry();
          break;
        case 'CLOSED':
          log('🔌 Supabase realtime connection closed');
          break;
        default:
          log('📡 Supabase realtime status:', status);
      }
    });
    
  } catch (error) {
    logWarn(`Realtime monitoring setup failed (attempt ${monitoringRetries + 1}):`, error.message);
    scheduleRealtimeRetry();
  }
};

// Schedule retry for realtime monitoring
const scheduleRealtimeRetry = () => {
  monitoringRetries++;
  if (monitoringRetries < MAX_MONITORING_RETRIES) {
    log(`🔄 Scheduling realtime retry in ${monitoringRetries * 2} seconds...`);
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
    logWarn('Error getting realtime status:', error.message);
    return 'ERROR';
  }
}

export function createRealtimeChannel(channelName, options = {}) {
  try {
    // Use UUID for truly unique channel names instead of timestamp
    const uniqueChannelName = `${channelName}-${uuidv4()}`;
    
    log(`📺 Creating realtime channel: ${uniqueChannelName}`);
    
    const channel = supabase.channel(uniqueChannelName, {
      // Enhanced channel configuration for stability
      config: {
        broadcast: { self: true },
        presence: { key: '' },
        ...options.config
      },
      ...options
    });
    
    log(`✅ Created realtime channel: ${uniqueChannelName}`);
    return channel;
  } catch (error) {
    logWarn(`Failed to create realtime channel ${channelName}:`, error.message);
    return null;
  }
}

export function removeRealtimeChannel(channel) {
  try {
    if (channel) {
      // Unsubscribe from the channel first
      if (channel.unsubscribe) {
        channel.unsubscribe();
        log('📺 Channel unsubscribed successfully');
      }
      
      // Then remove the channel from Supabase
      if (supabase.removeChannel) {
        supabase.removeChannel(channel);
        log('📺 Realtime channel removed successfully');
      }
      
      return true;
    }
    return false;
  } catch (error) {
    logWarn('Failed to remove realtime channel:', error.message);
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
        log('📺 System channel unsubscribed');
      }
      
      removeRealtimeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    monitoringRetries = 0;
    log('🧹 Supabase client cleanup completed');
  } catch (error) {
    logError('Cleanup failed:', error);
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
      logError('Error fetching users:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    logError('Unexpected error in getPublicUsers:', err);
    return [];
  }
}

export async function testConnection() {
  try {
    log('🔍 Testing Supabase connection...');
    
    // Wait for client to be ready if not already
    if (!_ready) {
      log('⏳ Waiting for Supabase client to be ready...');
      await waitForSupabase();
    }
    
    // Test with a simple query that should work in both local and production
    const { data, error } = await supabase
      .from('general_settings')
      .select('count')
      .limit(1);
    
    log('📊 Connection test result:', { data, error });
    
    if (error) {
      logError('Connection test failed:', error);
      // For local development, try alternative test
      if (isLocalDevelopment) {
        log('🔄 Trying alternative connection test for local environment...');
        const { error: healthError } = await supabase.from('general_settings').select('*').limit(1);
        return !healthError;
      }
      return false;
    }
    
    log('✅ Supabase connection confirmed');
    return true;
    
  } catch (err) {
    logError('Connection test failed:', err);
    return false;
  }
}

// ⚠️ DUPLICATE FUNCTION REMOVED: Use checkDatabaseHealth from healthUtils.js instead
// This prevents code duplication and ensures consistent health checking behavior

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
    log('🔄 Initializing Supabase connection...');
    
    const connected = await testConnection();
    if (connected) {
      log('🚀 Application ready for database operations');
      
      // Mark Supabase as ready for use
      markSupabaseReady();
      
      // Run health check after successful connection
      setTimeout(async () => {
        try {
          await checkDatabaseHealth();
        } catch (error) {
          logWarn('Background health check failed:', error);
          // Don't throw - this is a background operation
        }
      }, 5000);
    } else {
      logWarn('Database connection issues detected - some features may not work');
      
      // Still mark as ready for offline functionality
      markSupabaseReady();
    }
  } catch (error) {
    logError('Startup connection test failed:', error);
    
    // Mark as ready even if connection fails (for offline handling)
    markSupabaseReady();
  } finally {
    _initializing = false;
  }
})();

export default supabase;


