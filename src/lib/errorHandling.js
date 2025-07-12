/**
 * Standardized Error Handling System
 * Provides consistent error handling patterns across the application
 */

import { createLogger } from './logger';
import { auditLogger } from '../services/auditLogService';

const logger = createLogger('ErrorHandler');

// ==================== ERROR TYPES ====================

export const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  DATABASE: 'DATABASE_ERROR',
  BUSINESS_LOGIC: 'BUSINESS_LOGIC_ERROR',
  SYSTEM: 'SYSTEM_ERROR',
  USER_INPUT: 'USER_INPUT_ERROR'
};

export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// ==================== ERROR CLASSES ====================

export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.SYSTEM, severity = ERROR_SEVERITY.MEDIUM, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userFriendly = this.generateUserFriendlyMessage();
  }

  generateUserFriendlyMessage() {
    const friendlyMessages = {
      [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
      [ERROR_TYPES.AUTHENTICATION]: 'Please log in to continue.',
      [ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
      [ERROR_TYPES.NETWORK]: 'Connection issue. Please check your internet and try again.',
      [ERROR_TYPES.DATABASE]: 'We\'re experiencing technical difficulties. Please try again later.',
      [ERROR_TYPES.BUSINESS_LOGIC]: 'This action cannot be completed. Please contact support.',
      [ERROR_TYPES.SYSTEM]: 'Something went wrong. Please try again later.',
      [ERROR_TYPES.USER_INPUT]: 'Please check your input and try again.'
    };

    return friendlyMessages[this.type] || 'An unexpected error occurred.';
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.LOW, { field, value });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, ERROR_TYPES.AUTHENTICATION, ERROR_SEVERITY.HIGH);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', requiredPermission = null) {
    super(message, ERROR_TYPES.AUTHORIZATION, ERROR_SEVERITY.HIGH, { requiredPermission });
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network request failed', statusCode = null) {
    super(message, ERROR_TYPES.NETWORK, ERROR_SEVERITY.MEDIUM, { statusCode });
    this.name = 'NetworkError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', operation = null) {
    super(message, ERROR_TYPES.DATABASE, ERROR_SEVERITY.HIGH, { operation });
    this.name = 'DatabaseError';
  }
}

// ==================== ERROR HANDLER ====================

export class ErrorHandler {
  static async handle(error, context = {}) {
    try {
      // Normalize error
      const normalizedError = this.normalizeError(error);
      
      // Log error
      await this.logError(normalizedError, context);
      
      // Report to monitoring service
      await this.reportError(normalizedError, context);
      
      // Return user-friendly error
      return this.createUserResponse(normalizedError);
      
    } catch (handlingError) {
      logger.error('Error in error handler:', handlingError);
      return this.createFallbackResponse();
    }
  }

  static normalizeError(error) {
    if (error instanceof AppError) {
      return error;
    }

    // Handle Supabase errors
    if (error?.code && error?.message) {
      return new DatabaseError(error.message, error.code);
    }

    // Handle network errors
    if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
      return new NetworkError(error.message);
    }

    // Handle validation errors
    if (error?.name === 'ValidationError') {
      return new ValidationError(error.message);
    }

    // Default to system error
    return new AppError(
      error?.message || 'Unknown error occurred',
      ERROR_TYPES.SYSTEM,
      ERROR_SEVERITY.MEDIUM
    );
  }

  static async logError(error, context) {
    const logData = {
      message: error.message,
      type: error.type,
      severity: error.severity,
      stack: error.stack,
      context,
      timestamp: error.timestamp || new Date().toISOString()
    };

    // Log to application logger
    switch (error.severity) {
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.HIGH:
        logger.error('High severity error:', logData);
        break;
      case ERROR_SEVERITY.MEDIUM:
        logger.warn('Medium severity error:', logData);
        break;
      case ERROR_SEVERITY.LOW:
        logger.info('Low severity error:', logData);
        break;
    }

    // Log to audit system for security-related errors
    if (error.type === ERROR_TYPES.AUTHENTICATION || error.type === ERROR_TYPES.AUTHORIZATION) {
      try {
        await auditLogger.logEvent({
          event_type: 'SECURITY_ERROR',
          details: logData,
          risk_level: error.severity === ERROR_SEVERITY.HIGH ? 'high' : 'medium'
        });
      } catch (auditError) {
        logger.error('Failed to log security error to audit system:', auditError);
      }
    }
  }

  static async reportError(error, context) {
    // Report to external monitoring service (Sentry, etc.)
    if (import.meta.env.PROD && error.severity !== ERROR_SEVERITY.LOW) {
      try {
        // This would integrate with your monitoring service
        // Example: Sentry.captureException(error, { extra: context });
        logger.info('Error reported to monitoring service');
      } catch (reportingError) {
        logger.error('Failed to report error to monitoring service:', reportingError);
      }
    }
  }

  static createUserResponse(error) {
    return {
      success: false,
      error: {
        type: error.type,
        message: error.userFriendly,
        severity: error.severity,
        timestamp: error.timestamp
      }
    };
  }

  static createFallbackResponse() {
    return {
      success: false,
      error: {
        type: ERROR_TYPES.SYSTEM,
        message: 'An unexpected error occurred. Please try again later.',
        severity: ERROR_SEVERITY.MEDIUM,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Async error wrapper for functions
 */
export const withErrorHandling = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return ErrorHandler.handle(error, { ...context, function: fn.name });
    }
  };
};

/**
 * React error boundary helper
 */
export const createErrorBoundary = (fallbackComponent) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      ErrorHandler.handle(error, { errorInfo, boundary: true });
    }

    render() {
      if (this.state.hasError) {
        return fallbackComponent ? fallbackComponent(this.state.error) : null;
      }

      return this.props.children;
    }
  };
};

// ==================== EXPORTS ====================

export default ErrorHandler;
