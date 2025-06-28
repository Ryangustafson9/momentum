/**
 * Application Configuration
 * Centralizes hardcoded values found throughout the application
 */

// ==================== PAGINATION DEFAULTS ====================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MEMBER_LIST_PAGE_SIZE: 25,
  CHECK_IN_HISTORY_LIMIT: 10,
  RECENT_ACTIVITY_LIMIT: 5,
  SEARCH_RESULTS_LIMIT: 10
};

// ==================== TIME & DATE SETTINGS ====================
export const TIME_SETTINGS = {
  SESSION_TIMEOUT_MINUTES: 30,
  AUTO_REFRESH_INTERVAL_MS: 30000, // 30 seconds
  CACHE_TTL_MS: 300000, // 5 minutes
  QUERY_TIMEOUT_MS: 10000, // 10 seconds
  DEBOUNCE_DELAY_MS: 300,
  TOAST_DURATION_MS: 5000
};

// ==================== UI CONFIGURATION ====================
export const UI_CONFIG = {
  AVATAR_SIZE: {
    SMALL: 32,
    MEDIUM: 48,
    LARGE: 96,
    EXTRA_LARGE: 128
  },
  
  IMAGE_COMPRESSION: {
    MAX_WIDTH: 400,
    MAX_HEIGHT: 400,
    QUALITY: 0.8,
    FORMAT: 'image/jpeg'
  },
  
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536
  }
};

// ==================== VALIDATION RULES ====================
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false
  },
  
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    FORMATS: ['US', 'INTERNATIONAL']
  },
  
  EMAIL: {
    MAX_LENGTH: 254,
    DOMAINS_BLACKLIST: ['tempmail.com', '10minutemail.com']
  },
  
  MEMBER_ID: {
    MIN_VALUE: 1,
    MAX_VALUE: 999999,
    AUTO_INCREMENT: true
  }
};

// ==================== SCANNER CONFIGURATION ====================
export const SCANNER_CONFIG = {
  MIN_LENGTH: parseInt(import.meta.env.VITE_SCANNER_MIN_LENGTH) || 6,
  MAX_LENGTH: parseInt(import.meta.env.VITE_SCANNER_MAX_LENGTH) || 12,
  TIMEOUT: parseInt(import.meta.env.VITE_SCANNER_TIMEOUT) || 100,
  END_CHARACTERS: [13, 9], // Enter (13) and Tab (9) key codes
  PREVENT_DEFAULT: true,
  IGNORE_INPUTS: true,
  DEBUG_MODE: import.meta.env.VITE_SCANNER_DEBUG === 'true' || false
};

// ==================== DATABASE CONFIGURATION ====================
export const DATABASE_CONFIG = {
  PAGINATION: {
    DEFAULT_LIMIT: parseInt(import.meta.env.VITE_DB_DEFAULT_LIMIT) || 20,
    MAX_LIMIT: parseInt(import.meta.env.VITE_DB_MAX_LIMIT) || 100,
    MIN_LIMIT: parseInt(import.meta.env.VITE_DB_MIN_LIMIT) || 5
  },
  CACHE: {
    TTL: parseInt(import.meta.env.VITE_CACHE_TTL) || 300000, // 5 minutes
    MAX_SIZE: parseInt(import.meta.env.VITE_CACHE_MAX_SIZE) || 100
  },
  QUERY_TIMEOUT: parseInt(import.meta.env.VITE_DB_QUERY_TIMEOUT) || 30000 // 30 seconds
};

// ==================== LOGGING CONFIGURATION ====================
export const LOGGING_CONFIG = {
  LEVEL: import.meta.env.VITE_LOG_LEVEL || (import.meta.env.DEV ? 'debug' : 'error'),
  ENABLE_CONSOLE: import.meta.env.VITE_ENABLE_CONSOLE_LOGS !== 'false',
  ENABLE_EXTERNAL: import.meta.env.VITE_ENABLE_EXTERNAL_LOGGING === 'true',
  MAX_LOG_ENTRIES: parseInt(import.meta.env.VITE_MAX_LOG_ENTRIES) || 1000,
  CONTEXTS: {
    DATABASE: import.meta.env.VITE_LOG_DATABASE !== 'false',
    AUTH: import.meta.env.VITE_LOG_AUTH !== 'false',
    API: import.meta.env.VITE_LOG_API !== 'false',
    UI: import.meta.env.VITE_LOG_UI === 'true' || false
  }
};

// ==================== BUSINESS RULES ====================
export const BUSINESS_RULES = {
  CHECK_IN: {
    ALLOW_DUPLICATE_SAME_DAY: false,
    REQUIRE_ACTIVE_MEMBERSHIP: false,
    ALLOW_GUEST_CHECK_IN: true,
    STAFF_OVERRIDE_ENABLED: true,
    OPERATING_HOURS: {
      MONDAY: { start: '05:00', end: '22:00' },
      TUESDAY: { start: '05:00', end: '22:00' },
      WEDNESDAY: { start: '05:00', end: '22:00' },
      THURSDAY: { start: '05:00', end: '22:00' },
      FRIDAY: { start: '05:00', end: '22:00' },
      SATURDAY: { start: '06:00', end: '20:00' },
      SUNDAY: { start: '07:00', end: '19:00' }
    }
  },
  
  MEMBERSHIP: {
    GRACE_PERIOD_DAYS: 7,
    AUTO_RENEWAL_ENABLED: true,
    FAMILY_MEMBER_LIMIT: 6,
    ADDON_LIMIT: 5
  },
  
  BILLING: {
    PAYMENT_RETRY_ATTEMPTS: 3,
    LATE_FEE_GRACE_DAYS: 5,
    SUSPENSION_AFTER_DAYS: 30
  }
};

// ==================== FILE UPLOAD SETTINGS ====================
export const FILE_UPLOAD = {
  PROFILE_PHOTOS: {
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    DIMENSIONS: {
      MIN_WIDTH: 100,
      MIN_HEIGHT: 100,
      MAX_WIDTH: 2000,
      MAX_HEIGHT: 2000
    }
  },
  
  DOCUMENTS: {
    MAX_SIZE_MB: 10,
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
    MAX_FILES_PER_MEMBER: 20
  }
};

// ==================== NOTIFICATION SETTINGS ====================
export const NOTIFICATIONS = {
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  },
  
  CHANNELS: {
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
    IN_APP: 'in_app'
  },
  
  PREFERENCES: {
    MARKETING_EMAILS: true,
    BILLING_REMINDERS: true,
    CLASS_REMINDERS: true,
    SYSTEM_UPDATES: false
  }
};

// ==================== SEARCH CONFIGURATION ====================
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  HIGHLIGHT_MATCHES: true,
  FUZZY_SEARCH_THRESHOLD: 0.6,
  
  MEMBER_SEARCH_FIELDS: [
    'first_name',
    'last_name', 
    'email',
    'phone',
    'system_member_id'
  ],
  
  SEARCH_WEIGHTS: {
    EXACT_MATCH: 100,
    STARTS_WITH: 80,
    CONTAINS: 60,
    FUZZY_MATCH: 40
  }
};

// ==================== SECURITY SETTINGS ====================
export const SECURITY = {
  SESSION: {
    TIMEOUT_MINUTES: 30,
    EXTEND_ON_ACTIVITY: true,
    SECURE_COOKIES: true,
    SAME_SITE: 'strict'
  },
  
  API: {
    RATE_LIMIT_REQUESTS_PER_MINUTE: 100,
    ENABLE_CORS: true,
    REQUIRE_HTTPS: true
  },
  
  PASSWORDS: {
    HASH_ROUNDS: 12,
    REQUIRE_2FA: false,
    PASSWORD_HISTORY_COUNT: 5
  }
};

// ==================== FEATURE FLAGS ====================
export const FEATURES = {
  MULTI_LOCATION: false,
  ADVANCED_REPORTING: true,
  MEMBER_SELF_SERVICE: true,
  QR_CODE_CHECK_IN: true,
  FAMILY_MEMBERSHIPS: true,
  CORPORATE_PARTNERSHIPS: false,
  MEMBER_TAGGING: true,
  BULK_OPERATIONS: true,
  REAL_TIME_NOTIFICATIONS: true,
  PWA_INSTALL_PROMPT: true
};

// ==================== ENVIRONMENT-SPECIFIC OVERRIDES ====================
const getEnvironmentConfig = () => {
  const env = import.meta.env.MODE || 'development';
  
  const envConfigs = {
    development: {
      TIME_SETTINGS: {
        ...TIME_SETTINGS,
        AUTO_REFRESH_INTERVAL_MS: 60000, // Slower refresh in dev
        CACHE_TTL_MS: 60000 // Shorter cache in dev
      },
      SECURITY: {
        ...SECURITY,
        API: {
          ...SECURITY.API,
          REQUIRE_HTTPS: false // Allow HTTP in dev
        }
      }
    },
    
    production: {
      TIME_SETTINGS: {
        ...TIME_SETTINGS,
        AUTO_REFRESH_INTERVAL_MS: 30000,
        CACHE_TTL_MS: 300000
      },
      SECURITY: {
        ...SECURITY,
        API: {
          ...SECURITY.API,
          REQUIRE_HTTPS: true
        }
      }
    },
    
    test: {
      TIME_SETTINGS: {
        ...TIME_SETTINGS,
        AUTO_REFRESH_INTERVAL_MS: 1000, // Fast refresh for tests
        CACHE_TTL_MS: 1000
      }
    }
  };
  
  return envConfigs[env] || {};
};

// ==================== EXPORT FINAL CONFIG ====================
const environmentOverrides = getEnvironmentConfig();

export const CONFIG = {
  PAGINATION,
  TIME_SETTINGS: { ...TIME_SETTINGS, ...environmentOverrides.TIME_SETTINGS },
  UI_CONFIG,
  VALIDATION,
  BUSINESS_RULES,
  FILE_UPLOAD,
  NOTIFICATIONS,
  SEARCH_CONFIG,
  SECURITY: { ...SECURITY, ...environmentOverrides.SECURITY },
  FEATURES
};

export default CONFIG;
