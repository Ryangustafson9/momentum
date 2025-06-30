/**
 * Security Audit Logging Service
 * Comprehensive tracking of all security-related events
 */

import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

// Security event types for audit logging
export const AUDIT_EVENTS = {
  // Authentication Events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  SESSION_EXPIRED: 'session_expired',
  
  // Password Events
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  
  // Account Events
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  ROLE_CHANGE: 'role_change',
  PERMISSION_DENIED: 'permission_denied',
  
  // Data Access Events
  MEMBER_DATA_ACCESS: 'member_data_access',
  MEMBER_DATA_MODIFICATION: 'member_data_modification',
  BILLING_DATA_ACCESS: 'billing_data_access',
  BILLING_DATA_MODIFICATION: 'billing_data_modification',
  
  // System Events
  SYSTEM_CONFIG_CHANGE: 'system_config_change',
  ADMIN_ACTION: 'admin_action',
  BULK_OPERATION: 'bulk_operation',
  
  // Security Events
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  MULTIPLE_LOGIN_ATTEMPTS: 'multiple_login_attempts',
  IP_BLOCKED: 'ip_blocked'
};

// Risk levels for events
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class AuditLogService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Log a security audit event
   * @param {Object} eventData - Event details
   */
  async logEvent(eventData) {
    try {
      const auditEntry = this.createAuditEntry(eventData);
      
      // Log to database
      await this.logToDatabase(auditEntry);
      
      // Log to application logger for immediate visibility
      this.logToConsole(auditEntry);
      
      // Check for suspicious patterns
      await this.analyzeForSuspiciousActivity(auditEntry);
      
    } catch (error) {
      logger.error('Failed to log audit event:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  /**
   * Create standardized audit entry
   * @param {Object} eventData - Raw event data
   * @returns {Object} Formatted audit entry
   */
  createAuditEntry(eventData) {
    const timestamp = new Date().toISOString();
    const sessionId = this.getSessionId();
    const requestId = this.generateRequestId();

    return {
      id: crypto.randomUUID(),
      event_type: eventData.event,
      user_id: eventData.userId || null,
      session_id: sessionId,
      request_id: requestId,
      timestamp,
      ip_address: eventData.ipAddress || this.getClientIP(),
      user_agent: eventData.userAgent || navigator?.userAgent || null,
      resource_type: eventData.resourceType || null,
      resource_id: eventData.resourceId || null,
      old_values: eventData.oldValues || null,
      new_values: eventData.newValues || null,
      risk_level: eventData.riskLevel || this.calculateRiskLevel(eventData.event),
      success: eventData.success !== false, // Default to true unless explicitly false
      error_message: eventData.error || null,
      additional_data: {
        ...eventData.additionalData,
        url: window?.location?.href,
        referrer: document?.referrer || null
      }
    };
  }

  /**
   * Log to database with retry logic
   */
  async logToDatabase(auditEntry, retryCount = 0) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.logToDatabase(auditEntry, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Log to console for immediate visibility
   */
  logToConsole(auditEntry) {
    const logLevel = this.getLogLevel(auditEntry.event_type, auditEntry.risk_level);
    const message = `AUDIT: ${auditEntry.event_type} - User: ${auditEntry.user_id || 'Anonymous'} - IP: ${auditEntry.ip_address}`;
    
    switch (logLevel) {
      case 'error':
        logger.error(message, auditEntry);
        break;
      case 'warn':
        logger.warn(message, auditEntry);
        break;
      case 'info':
        logger.info(message, auditEntry);
        break;
      default:
        logger.debug(message, auditEntry);
    }
  }

  /**
   * Analyze for suspicious activity patterns
   */
  async analyzeForSuspiciousActivity(auditEntry) {
    try {
      // Check for multiple failed login attempts
      if (auditEntry.event_type === AUDIT_EVENTS.LOGIN_FAILURE) {
        await this.checkFailedLoginPattern(auditEntry);
      }

      // Check for unusual access patterns
      if (auditEntry.event_type.includes('_access')) {
        await this.checkAccessPattern(auditEntry);
      }

      // Check for admin actions from suspicious IPs
      if (auditEntry.event_type === AUDIT_EVENTS.ADMIN_ACTION) {
        await this.checkAdminActionPattern(auditEntry);
      }
    } catch (error) {
      logger.error('Error analyzing suspicious activity:', error);
    }
  }

  /**
   * Check for failed login patterns
   */
  async checkFailedLoginPattern(auditEntry) {
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;
    const since = new Date(Date.now() - timeWindow).toISOString();

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('event_type', AUDIT_EVENTS.LOGIN_FAILURE)
        .eq('ip_address', auditEntry.ip_address)
        .gte('timestamp', since);

      if (error) throw error;

      if (data && data.length >= maxAttempts) {
        // Log suspicious activity
        await this.logEvent({
          event: AUDIT_EVENTS.MULTIPLE_LOGIN_ATTEMPTS,
          userId: auditEntry.user_id,
          ipAddress: auditEntry.ip_address,
          riskLevel: RISK_LEVELS.HIGH,
          additionalData: {
            failed_attempts: data.length,
            time_window: timeWindow / 1000 / 60 + ' minutes'
          }
        });

        // Consider blocking IP
        await this.considerIPBlock(auditEntry.ip_address, data.length);
      }
    } catch (error) {
      logger.error('Error checking failed login pattern:', error);
    }
  }

  /**
   * Consider blocking IP after suspicious activity
   */
  async considerIPBlock(ipAddress, attemptCount) {
    const blockThreshold = 10;
    
    if (attemptCount >= blockThreshold) {
      // Log IP block event
      await this.logEvent({
        event: AUDIT_EVENTS.IP_BLOCKED,
        ipAddress,
        riskLevel: RISK_LEVELS.CRITICAL,
        additionalData: {
          reason: 'Multiple failed login attempts',
          attempt_count: attemptCount,
          auto_blocked: true
        }
      });

      // Here you would implement actual IP blocking
      // This could be through a firewall, CDN, or application-level blocking
      logger.warn(`IP ${ipAddress} should be blocked due to ${attemptCount} failed attempts`);
    }
  }

  /**
   * Utility functions
   */
  calculateRiskLevel(eventType) {
    const highRiskEvents = [
      AUDIT_EVENTS.LOGIN_FAILURE,
      AUDIT_EVENTS.PERMISSION_DENIED,
      AUDIT_EVENTS.ROLE_CHANGE,
      AUDIT_EVENTS.SYSTEM_CONFIG_CHANGE
    ];

    const mediumRiskEvents = [
      AUDIT_EVENTS.PASSWORD_CHANGE,
      AUDIT_EVENTS.ADMIN_ACTION,
      AUDIT_EVENTS.BILLING_DATA_MODIFICATION
    ];

    if (highRiskEvents.includes(eventType)) return RISK_LEVELS.HIGH;
    if (mediumRiskEvents.includes(eventType)) return RISK_LEVELS.MEDIUM;
    return RISK_LEVELS.LOW;
  }

  getLogLevel(eventType, riskLevel) {
    if (riskLevel === RISK_LEVELS.CRITICAL) return 'error';
    if (riskLevel === RISK_LEVELS.HIGH) return 'warn';
    if (riskLevel === RISK_LEVELS.MEDIUM) return 'info';
    return 'debug';
  }

  getSessionId() {
    // Get session ID from auth store or generate one
    return sessionStorage.getItem('session_id') || 'anonymous';
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getClientIP() {
    // In a real application, this would be passed from the server
    // For now, return a placeholder
    return 'client_ip';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Convenience methods for common audit events
   */
  async logLogin(userId, success, additionalData = {}) {
    await this.logEvent({
      event: success ? AUDIT_EVENTS.LOGIN_SUCCESS : AUDIT_EVENTS.LOGIN_FAILURE,
      userId: success ? userId : null,
      success,
      additionalData
    });
  }

  async logLogout(userId) {
    await this.logEvent({
      event: AUDIT_EVENTS.LOGOUT,
      userId,
      additionalData: { logout_type: 'user_initiated' }
    });
  }

  async logPasswordChange(userId, success = true) {
    await this.logEvent({
      event: AUDIT_EVENTS.PASSWORD_CHANGE,
      userId,
      success,
      riskLevel: RISK_LEVELS.MEDIUM
    });
  }

  async logDataAccess(userId, resourceType, resourceId) {
    await this.logEvent({
      event: AUDIT_EVENTS.MEMBER_DATA_ACCESS,
      userId,
      resourceType,
      resourceId,
      riskLevel: RISK_LEVELS.LOW
    });
  }

  async logDataModification(userId, resourceType, resourceId, oldValues, newValues) {
    await this.logEvent({
      event: AUDIT_EVENTS.MEMBER_DATA_MODIFICATION,
      userId,
      resourceType,
      resourceId,
      oldValues,
      newValues,
      riskLevel: RISK_LEVELS.MEDIUM
    });
  }
  async logPermissionDenied(userId, resource, action) {
    await this.logEvent({
      event: AUDIT_EVENTS.PERMISSION_DENIED,
      userId,
      success: false,
      riskLevel: RISK_LEVELS.HIGH,
      additionalData: { resource, action }
    });
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(email, ipAddress, reason) {
    await this.logEvent({
      event: AUDIT_EVENTS.LOGIN_FAILURE,
      userId: null,
      ipAddress,
      success: false,
      error: reason,
      riskLevel: RISK_LEVELS.HIGH,
      additionalData: { email, reason }
    });
  }

  /**
   * Log successful login
   */
  async logSuccessfulLogin(userId, email, ipAddress) {
    await this.logEvent({
      event: AUDIT_EVENTS.LOGIN_SUCCESS,
      userId,
      ipAddress,
      success: true,
      riskLevel: RISK_LEVELS.LOW,
      additionalData: { email }
    });
  }

  /**
   * Log user registration
   */
  async logUserRegistration(userId, email, ipAddress, userData) {
    await this.logEvent({
      event: AUDIT_EVENTS.USER_REGISTRATION,
      userId,
      ipAddress,
      success: true,
      riskLevel: RISK_LEVELS.LOW,
      additionalData: { email, ...userData }
    });
  }

  /**
   * Log user logout
   */
  async logUserLogout(userId, email, ipAddress) {
    await this.logEvent({
      event: AUDIT_EVENTS.LOGOUT,
      userId,
      ipAddress,
      success: true,
      riskLevel: RISK_LEVELS.LOW,
      additionalData: { email }
    });
  }

  /**
   * Log general security event
   */
  async logSecurityEvent(eventType, eventData) {
    await this.logEvent({
      event: eventType,
      userId: eventData.userId || null,
      ipAddress: eventData.client_ip || eventData.ipAddress,
      success: eventData.success !== false,
      error: eventData.error,
      riskLevel: eventData.risk_level || RISK_LEVELS.MEDIUM,
      additionalData: eventData
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLogService();

// Export convenience functions
export const {
  logLogin,
  logLogout,
  logPasswordChange,
  logDataAccess,
  logDataModification,
  logPermissionDenied,
  logFailedLogin,
  logSuccessfulLogin,
  logUserRegistration,
  logUserLogout,
  logSecurityEvent
} = auditLogger;
