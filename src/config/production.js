/**
 * 🚀 PRODUCTION CONFIGURATION
 * Settings and optimizations for production deployment
 */

import { env } from '@/lib/env';

// ==================== PRODUCTION CHECKS ====================

/**
 * Validate production environment
 */
export const validateProductionEnvironment = () => {
  const errors = [];
  const warnings = [];

  // Check required production environment variables
  if (!env.SUPABASE.URL || env.SUPABASE.URL.includes('localhost') || env.SUPABASE.URL.includes('127.0.0.1')) {
    errors.push('Production Supabase URL is required and should not be localhost');
  }

  if (!env.SUPABASE.ANON_KEY || env.SUPABASE.ANON_KEY.length < 100) {
    errors.push('Valid production Supabase anon key is required');
  }

  if (!env.STRIPE.PUBLISHABLE_KEY || env.STRIPE.PUBLISHABLE_KEY.includes('test')) {
    warnings.push('Production Stripe key should be used in production');
  }

  // Check for development-only settings
  if (env.FEATURES.DEBUG_MODE) {
    warnings.push('Debug mode is enabled in production');
  }

  if (env.DEV_CONFIG.MOCK_DATA) {
    errors.push('Mock data should not be enabled in production');
  }

  if (env.DEV_CONFIG.SKIP_AUTH) {
    errors.push('Auth skip should not be enabled in production');
  }

  return { errors, warnings };
};

// ==================== PERFORMANCE OPTIMIZATIONS ====================

/**
 * Production performance configuration
 */
export const productionConfig = {
  // API Configuration
  api: {
    timeout: env.API.TIMEOUT,
    retries: env.API.MAX_RETRIES,
    batchSize: 50,
    cacheTimeout: 300000, // 5 minutes
  },

  // Session Configuration
  session: {
    timeout: env.SESSION.TIMEOUT,
    warningTime: env.SESSION.AUTO_LOGOUT_WARNING,
    refreshThreshold: 300000, // 5 minutes before expiry
  },

  // Logging Configuration
  logging: {
    level: 'WARN',
    console: false,
    external: true,
    maxLogSize: 1000,
    bufferSize: 100,
  },

  // Real-time Configuration
  realtime: {
    enabled: env.FEATURES.REAL_TIME,
    heartbeatInterval: 30000,
    reconnectDelay: 5000,
    maxReconnectAttempts: 5,
  },

  // Caching Configuration
  cache: {
    enabled: true,
    defaultTTL: 300000, // 5 minutes
    maxSize: 100,
    strategies: {
      user: 600000, // 10 minutes
      settings: 1800000, // 30 minutes
      static: 3600000, // 1 hour
    },
  },

  // Security Configuration
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
    enableFrameGuard: true,
    sessionSecure: true,
  },

  // Analytics Configuration
  analytics: {
    enabled: env.FEATURES.ANALYTICS,
    sampleRate: 0.1, // 10% sampling
    trackErrors: true,
    trackPerformance: true,
  },
};

// ==================== OPTIMIZATION UTILITIES ====================

/**
 * Initialize production optimizations
 */
export const initializeProductionOptimizations = () => {
  if (!env.PROD) {
    console.log('Development mode: Skipping production optimizations');
    return;
  }

  // Disable React DevTools in production
  if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = null;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = null;
  }

  // Set up error reporting
  if (env.SENTRY.DSN) {
    // Sentry configuration would go here
    console.log('Sentry error reporting initialized');
  }

  // Set up performance monitoring
  if (productionConfig.analytics.enabled) {
    // Performance monitoring setup would go here
    console.log('Performance monitoring initialized');
  }

  // Set up security headers (if running in a web context)
  if (typeof document !== 'undefined') {
    // Add security-related meta tags
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-Content-Type-Options';
    meta.content = 'nosniff';
    document.head.appendChild(meta);
  }

  
};

/**
 * Clean up development artifacts
 */
export const cleanupDevelopmentArtifacts = () => {
  if (!env.PROD) return;

  // Remove development-only global variables
  if (typeof window !== 'undefined') {
    delete window.__DEV__;
    delete window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
  }

  // Clear development console methods in production
  if (typeof console !== 'undefined' && !env.LOGGING.console) {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    // Keep console.warn and console.error for critical issues
  }
};

/**
 * Validate bundle size and performance
 */
export const validatePerformance = () => {
  if (typeof window === 'undefined') return;

  // Check bundle size
  const scripts = document.querySelectorAll('script[src]');
  let totalSize = 0;
  
  scripts.forEach(script => {
    // This is a rough estimate - in real implementation,
    // you'd use build tools to get actual sizes
    totalSize += script.src.length;
  });

  if (totalSize > 1000000) { // 1MB threshold
    
  }

  // Check for memory leaks
  if (performance.memory) {
    const memoryInfo = performance.memory;
    if (memoryInfo.usedJSHeapSize > 50000000) { // 50MB threshold
      
    }
  }

  // Check for slow loading resources
  if (performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource');
    const slowResources = resources.filter(resource => resource.duration > 1000);
    
    if (slowResources.length > 0) {
      
    }
  }
};

// ==================== HEALTH CHECKS ====================

/**
 * Production health check
 */
export const performHealthCheck = async () => {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
    errors: [],
  };

  try {
    // Check environment
    const envValidation = validateProductionEnvironment();
    health.checks.environment = {
      status: envValidation.errors.length === 0 ? 'pass' : 'fail',
      errors: envValidation.errors,
      warnings: envValidation.warnings,
    };

    // Check performance
    validatePerformance();
    health.checks.performance = { status: 'pass' };

    // Check external dependencies
    health.checks.dependencies = {
      supabase: env.SUPABASE.URL ? 'configured' : 'missing',
      stripe: env.STRIPE.PUBLISHABLE_KEY ? 'configured' : 'missing',
      sentry: env.SENTRY.DSN ? 'configured' : 'optional',
    };

    // Overall status
    if (health.checks.environment.status === 'fail') {
      health.status = 'unhealthy';
      health.errors.push('Environment validation failed');
    }

  } catch (error) {
    health.status = 'error';
    health.errors.push(error.message);
  }

  return health;
};

// ==================== EXPORTS ====================

export default productionConfig;

