/**
 * 📝 CENTRALIZED LOGGING SYSTEM
 * Production-safe logging with environment-based controls
 */

// ==================== LOG LEVELS ====================

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
  4: 'TRACE'
};

// ==================== CONFIGURATION ====================

const config = {
  // Environment-based log level
  level: import.meta.env.MODE === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG,
  
  // Enable/disable console output
  enableConsole: import.meta.env.MODE !== 'production',
  
  // Enable/disable external logging (Sentry, etc.)
  enableExternal: import.meta.env.MODE === 'production',
  
  // Prefix for all log messages
  prefix: '[Momentum]',
  
  // Colors for different log levels (console only)
  colors: {
    ERROR: '#ef4444',   // red-500
    WARN: '#f59e0b',    // amber-500
    INFO: '#3b82f6',    // blue-500
    DEBUG: '#8b5cf6',   // violet-500
    TRACE: '#6b7280'    // gray-500
  }
};

// ==================== LOGGER CLASS ====================

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  /**
   * Create a logger for a specific context
   */
  static create(context) {
    return new Logger(context);
  }

  /**
   * Internal logging method
   */
  _log(level, message, ...args) {
    // Check if this log level should be output
    if (level > config.level) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];
    const prefix = `${config.prefix} [${this.context}] ${levelName}`;

    // Console logging (development)
    if (config.enableConsole) {
      const color = config.colors[levelName];
      const consoleMethod = this._getConsoleMethod(level);
      
      if (typeof message === 'string') {
        consoleMethod(
          `%c${prefix}%c ${message}`,
          `color: ${color}; font-weight: bold;`,
          'color: inherit;',
          ...args
        );
      } else {
        consoleMethod(`%c${prefix}`, `color: ${color}; font-weight: bold;`, message, ...args);
      }
    }

    // External logging (production)
    if (config.enableExternal && level <= LOG_LEVELS.WARN) {
      this._logToExternal(level, message, args, timestamp);
    }
  }

  /**
   * Get appropriate console method for log level
   */
  _getConsoleMethod(level) {
    switch (level) {
      case LOG_LEVELS.ERROR:
        return console.error;
      case LOG_LEVELS.WARN:
        return console.warn;
      case LOG_LEVELS.INFO:
        return console.info;
      case LOG_LEVELS.DEBUG:
      case LOG_LEVELS.TRACE:
      default:
        return console.log;
    }
  }

  /**
   * Send logs to external service (Sentry, etc.)
   */
  _logToExternal(level, message, args, timestamp) {
    try {
      // TODO: Integrate with Sentry or other logging service
      // Example:
      // if (window.Sentry && level <= LOG_LEVELS.ERROR) {
      //   window.Sentry.captureMessage(message, {
      //     level: LOG_LEVEL_NAMES[level].toLowerCase(),
      //     extra: { args, context: this.context, timestamp }
      //   });
      // }
    } catch (error) {
      // Fail silently to avoid logging loops
    }
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Log error messages
   */
  error(message, ...args) {
    this._log(LOG_LEVELS.ERROR, message, ...args);
  }

  /**
   * Log warning messages
   */
  warn(message, ...args) {
    this._log(LOG_LEVELS.WARN, message, ...args);
  }

  /**
   * Log info messages
   */
  info(message, ...args) {
    this._log(LOG_LEVELS.INFO, message, ...args);
  }

  /**
   * Log debug messages
   */
  debug(message, ...args) {
    this._log(LOG_LEVELS.DEBUG, message, ...args);
  }

  /**
   * Log trace messages
   */
  trace(message, ...args) {
    this._log(LOG_LEVELS.TRACE, message, ...args);
  }

  /**
   * Log API calls
   */
  api(method, url, data = null) {
    this.debug(`API ${method.toUpperCase()} ${url}`, data);
  }

  /**
   * Log user actions
   */
  action(action, data = null) {
    this.info(`User action: ${action}`, data);
  }

  /**
   * Log performance metrics
   */
  performance(metric, value, unit = 'ms') {
    this.debug(`Performance: ${metric} = ${value}${unit}`);
  }

  /**
   * Log authentication events
   */
  auth(event, user = null) {
    this.info(`Auth: ${event}`, user ? { userId: user.id, email: user.email } : null);
  }
}

// ==================== DEFAULT LOGGER ====================

const defaultLogger = new Logger('App');

// ==================== UTILITY FUNCTIONS ====================

/**
 * Set global log level
 */
export const setLogLevel = (level) => {
  if (typeof level === 'string') {
    config.level = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
  } else {
    config.level = level;
  }
};

/**
 * Enable/disable console logging
 */
export const setConsoleLogging = (enabled) => {
  config.enableConsole = enabled;
};

/**
 * Enable/disable external logging
 */
export const setExternalLogging = (enabled) => {
  config.enableExternal = enabled;
};

/**
 * Create a performance timer
 */
export const createTimer = (label, logger = defaultLogger) => {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      logger.performance(label, Math.round(duration));
      return duration;
    }
  };
};

/**
 * Log function execution time
 */
export const withTiming = (fn, label, logger = defaultLogger) => {
  return async (...args) => {
    const timer = createTimer(label, logger);
    try {
      const result = await fn(...args);
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  };
};

// ==================== EXPORTS ====================

export { Logger, LOG_LEVELS };
export default defaultLogger;

// Named exports for convenience
export const logger = defaultLogger;
export const createLogger = Logger.create;
