// src/lib/healthUtils.js
import { supabase, isLocalDevelopment } from './supabaseClient.js';
import { getRealtimeStatus, getMonitoringRetries } from './realtimeUtils.js';

// Central logging system for consistent formatting and production control
function log(message, ...args) {
  if (import.meta.env.MODE !== 'production') {
    console.log(`[HealthUtils] ${message}`, ...args);
  }
}

function logError(message, ...args) {
  if (import.meta.env.MODE !== 'production') {
    console.error(`[HealthUtils] ❌ ${message}`, ...args);
  }
}

function logWarn(message, ...args) {
  if (import.meta.env.MODE !== 'production') {
    console.warn(`[HealthUtils] ⚠️ ${message}`, ...args);
  }
}

// Health check caching
let lastHealthCheck = null;
let lastHealthCheckTime = 0;
const HEALTH_CHECK_CACHE_DURATION = 30000; // 30 seconds

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

// Database health check utility with caching
export async function checkDatabaseHealth(force = false) {
  const now = Date.now();
  
  // Return cached result if still valid and not forced
  if (!force && lastHealthCheck && (now - lastHealthCheckTime) < HEALTH_CHECK_CACHE_DURATION) {
    log('📋 Returning cached health check result');
    return {
      ...lastHealthCheck,
      cached: true,
      cacheAge: Math.round((now - lastHealthCheckTime) / 1000)
    };
  }
  
  try {
    log('🏥 Running database health check...');
    
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
      realtimeRetries: getMonitoringRetries(),
      timestamp: new Date().toISOString(),
      cached: false
    };
    
    // Cache the result
    lastHealthCheck = healthReport;
    lastHealthCheckTime = now;
    
    log('🏥 Database health check completed:', healthReport);
    return healthReport;
    
  } catch (error) {
    logError('Database health check failed:', error);
    
    const errorReport = {
      settings: false,
      profiles: false,
      overall: false,
      realtime: 'ERROR',
      realtimeRetries: getMonitoringRetries(),
      error: error.message,
      timestamp: new Date().toISOString(),
      cached: false
    };
    
    // Cache error result for shorter duration
    lastHealthCheck = errorReport;
    lastHealthCheckTime = now - (HEALTH_CHECK_CACHE_DURATION * 0.7); // Cache errors for shorter time
    
    return errorReport;
  }
}

// Get cached health status without running new check
export function getCachedHealthStatus() {
  const now = Date.now();
  
  if (lastHealthCheck && (now - lastHealthCheckTime) < HEALTH_CHECK_CACHE_DURATION) {
    return {
      ...lastHealthCheck,
      cached: true,
      cacheAge: Math.round((now - lastHealthCheckTime) / 1000)
    };
  }
  
  return null;
}

// Clear health cache (useful for manual refresh)
export function clearHealthCache() {
  log('🗑️ Clearing health check cache');
  lastHealthCheck = null;
  lastHealthCheckTime = 0;
}

// Get health cache info
export function getHealthCacheInfo() {
  const now = Date.now();
  return {
    hasCached: !!lastHealthCheck,
    cacheAge: lastHealthCheckTime ? Math.round((now - lastHealthCheckTime) / 1000) : 0,
    cacheValid: lastHealthCheckTime && (now - lastHealthCheckTime) < HEALTH_CHECK_CACHE_DURATION,
    cacheDuration: HEALTH_CHECK_CACHE_DURATION / 1000
  };
}

// Initialize connection test and health monitoring
export async function initializeHealthMonitoring() {
  try {
    log('🔄 Initializing health monitoring...');
    
    const connected = await testConnection();
    if (connected) {
      log('🚀 Application ready for database operations');
      
      // Run initial health check after successful connection
      setTimeout(async () => {
        await checkDatabaseHealth(true); // Force initial check
      }, 5000);
      
      // Set up periodic health checks (every 5 minutes)
      setInterval(async () => {
        await checkDatabaseHealth(true);
      }, 300000); // 5 minutes
      
    } else {
      logWarn('Database connection issues detected - some features may not work');
    }
  } catch (error) {
    logError('Startup connection test failed:', error);
  }
}

// Auto-initialize health monitoring
initializeHealthMonitoring();
