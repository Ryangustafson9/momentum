/**
 * 🌍 ENVIRONMENT CONFIGURATION
 * Centralized environment variable management with validation
 */

// ==================== REQUIRED ENVIRONMENT VARIABLES ====================

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const OPTIONAL_ENV_VARS = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_APP_ENVIRONMENT',
  'VITE_ENABLE_ANALYTICS',
  'VITE_ENABLE_NOTIFICATIONS',
  'VITE_ENABLE_REAL_TIME',
  'VITE_ENABLE_DEBUG_MODE',
  'VITE_LOG_LEVEL',
  'VITE_ENABLE_CONSOLE_LOGGING',
  'VITE_ENABLE_EXTERNAL_LOGGING',
  'VITE_SENTRY_DSN',
  'VITE_SENTRY_ENVIRONMENT',
  'VITE_API_TIMEOUT',
  'VITE_MAX_RETRIES',
  'VITE_SESSION_TIMEOUT',
  'VITE_AUTO_LOGOUT_WARNING',
  'VITE_MAX_FILE_SIZE',
  'VITE_ALLOWED_FILE_TYPES',
  'VITE_DEV_MOCK_DATA',
  'VITE_DEV_SKIP_AUTH',
  'VITE_DEV_SHOW_QUERIES'
];

// ==================== ENVIRONMENT VALIDATION ====================

/**
 * Validate that all required environment variables are present
 */
const validateEnvironment = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!import.meta.env[varName]) {
      missing.push(varName);
    }
  });

  // Check for common issues
  if (import.meta.env.VITE_SUPABASE_URL?.includes('your_supabase_project_url')) {
    warnings.push('VITE_SUPABASE_URL appears to be using the example value');
  }

  if (import.meta.env.VITE_SUPABASE_ANON_KEY?.includes('your_supabase_anon_key')) {
    warnings.push('VITE_SUPABASE_ANON_KEY appears to be using the example value');
  }

  // Report missing variables
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please check your .env file and ensure all required variables are set.');
    console.error('📋 See .env.example for reference.');
    
    if (import.meta.env.MODE !== 'test') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  // Report warnings
  if (warnings.length > 0) {
    console.warn('⚠️ Environment configuration warnings:');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }

  // Success message in development
  if (import.meta.env.MODE === 'development' && missing.length === 0) {
    console.log('✅ Environment configuration validated successfully');
  }
};

// ==================== ENVIRONMENT CONFIGURATION ====================

/**
 * Centralized environment configuration object
 */
export const env = {
  // ==================== MODE & ENVIRONMENT ====================
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  
  // ==================== APP CONFIGURATION ====================
  APP: {
    NAME: import.meta.env.VITE_APP_NAME || 'Momentum Gym Management',
    VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || import.meta.env.MODE,
  },

  // ==================== SUPABASE CONFIGURATION ====================
  SUPABASE: {
    URL: import.meta.env.VITE_SUPABASE_URL,
    ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },

  // ==================== STRIPE CONFIGURATION ====================
  STRIPE: {
    PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  },

  // ==================== FEATURE FLAGS ====================
  FEATURES: {
    ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
    NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME !== 'false',
    DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true' || import.meta.env.DEV,
  },

  // ==================== LOGGING CONFIGURATION ====================
  LOGGING: {
    LEVEL: import.meta.env.VITE_LOG_LEVEL || (import.meta.env.PROD ? 'WARN' : 'DEBUG'),
    CONSOLE: import.meta.env.VITE_ENABLE_CONSOLE_LOGGING !== 'false',
    EXTERNAL: import.meta.env.VITE_ENABLE_EXTERNAL_LOGGING === 'true',
  },

  // ==================== SENTRY CONFIGURATION ====================
  SENTRY: {
    DSN: import.meta.env.VITE_SENTRY_DSN,
    ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
  },

  // ==================== API CONFIGURATION ====================
  API: {
    TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
    MAX_RETRIES: parseInt(import.meta.env.VITE_MAX_RETRIES) || 3,
  },

  // ==================== SESSION CONFIGURATION ====================
  SESSION: {
    TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000, // 30 minutes
    AUTO_LOGOUT_WARNING: parseInt(import.meta.env.VITE_AUTO_LOGOUT_WARNING) || 300000, // 5 minutes
  },

  // ==================== FILE UPLOAD CONFIGURATION ====================
  UPLOAD: {
    MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 5242880, // 5MB
    ALLOWED_TYPES: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ],
  },

  // ==================== DEVELOPMENT CONFIGURATION ====================
  DEV_CONFIG: {
    MOCK_DATA: import.meta.env.VITE_DEV_MOCK_DATA === 'true',
    SKIP_AUTH: import.meta.env.VITE_DEV_SKIP_AUTH === 'true',
    SHOW_QUERIES: import.meta.env.VITE_DEV_SHOW_QUERIES === 'true',
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature) => {
  return env.FEATURES[feature.toUpperCase()] === true;
};

/**
 * Get environment-specific configuration
 */
export const getConfig = (key, defaultValue = null) => {
  const keys = key.split('.');
  let value = env;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      return defaultValue;
    }
  }
  
  return value;
};

/**
 * Check if running in development mode
 */
export const isDevelopment = () => env.DEV;

/**
 * Check if running in production mode
 */
export const isProduction = () => env.PROD;

/**
 * Check if running in test mode
 */
export const isTest = () => env.MODE === 'test';

/**
 * Get app information
 */
export const getAppInfo = () => ({
  name: env.APP.NAME,
  version: env.APP.VERSION,
  environment: env.APP.ENVIRONMENT,
  mode: env.MODE,
});

// ==================== INITIALIZATION ====================

// Validate environment on import (except in test mode)
if (import.meta.env.MODE !== 'test') {
  validateEnvironment();
}

// Export validation function for manual use
export { validateEnvironment };

// Default export
export default env;
