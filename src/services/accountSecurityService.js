/**
 * Account Lockout Protection Service
 * Prevents brute force attacks through account and IP-based lockouts
 */

import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { auditLogger, AUDIT_EVENTS, RISK_LEVELS } from './auditLogService';

// Security policies for account lockout
export const SECURITY_POLICIES = {
  // Account lockout after failed attempts
  maxLoginAttempts: 5,
  accountLockoutDuration: 15, // minutes
  
  // Progressive lockout (increases with repeated failures)
  progressiveLockout: true,
  lockoutMultiplier: 2, // Each lockout doubles duration
  maxLockoutDuration: 24 * 60, // 24 hours max
  
  // IP-based lockout
  maxIPAttempts: 20, // Higher threshold for IP blocks
  ipLockoutDuration: 60, // minutes
  
  // Password policies
  passwordHistoryCount: 5,
  passwordExpiration: 90, // days
  forcePasswordChangeOnFirstLogin: true,
  
  // Session security
  sessionTimeout: 24 * 60, // 24 hours
  maxConcurrentSessions: 3
};

class AccountSecurityService {
  constructor() {
    this.lockoutCache = new Map(); // In-memory cache for quick lookups
  }

  /**
   * Check if account is locked before allowing login attempt
   * @param {string} email - User email
   * @param {string} ipAddress - Client IP address
   * @returns {Object} Lock status and details
   */
  async checkAccountLockout(email, ipAddress) {
    try {
      // Check both account and IP lockout status
      const [accountLock, ipLock] = await Promise.all([
        this.getAccountLockStatus(email),
        this.getIPLockStatus(ipAddress)
      ]);

      const isLocked = accountLock.isLocked || ipLock.isLocked;
      const lockReason = accountLock.isLocked ? 'account' : 'ip';
      const unlockTime = accountLock.isLocked ? accountLock.unlockTime : ipLock.unlockTime;

      return {
        isLocked,
        lockReason,
        unlockTime,
        remainingTime: unlockTime ? Math.max(0, unlockTime - Date.now()) : 0,
        accountAttempts: accountLock.attempts,
        ipAttempts: ipLock.attempts
      };
    } catch (error) {
      logger.error('Error checking account lockout:', error);
      // Fail safe - if we can't check, allow but log the issue
      return { isLocked: false, error: error.message };
    }
  }

  /**
   * Record failed login attempt and handle lockout logic
   * @param {string} email - User email
   * @param {string} ipAddress - Client IP address
   * @param {string} userId - User ID if known
   */
  async recordFailedAttempt(email, ipAddress, userId = null) {
    try {
      const timestamp = new Date().toISOString();

      // Record the failed attempt
      await this.recordAttempt(email, ipAddress, false, timestamp);

      // Check if lockout is needed
      const attempts = await this.getFailedAttempts(email, ipAddress);
      
      // Handle account lockout
      if (attempts.accountAttempts >= SECURITY_POLICIES.maxLoginAttempts) {
        await this.lockAccount(email, attempts.accountAttempts);
      }

      // Handle IP lockout
      if (attempts.ipAttempts >= SECURITY_POLICIES.maxIPAttempts) {
        await this.lockIP(ipAddress, attempts.ipAttempts);
      }      // Log the security event
      await auditLogger.logEvent({
        event: AUDIT_EVENTS.LOGIN_FAILURE,
        userId,
        ipAddress,
        riskLevel: attempts.accountAttempts > 3 ? RISK_LEVELS.HIGH : RISK_LEVELS.MEDIUM,
        additionalData: {
          email,
          account_attempts: attempts.accountAttempts,
          ip_attempts: attempts.ipAttempts,
          will_lock_account: attempts.accountAttempts >= SECURITY_POLICIES.maxLoginAttempts,
          will_lock_ip: attempts.ipAttempts >= SECURITY_POLICIES.maxIPAttempts
        }
      });

    } catch (error) {
      logger.error('Error recording failed attempt:', error);
    }
  }

  /**
   * Record successful login and reset attempt counters
   * @param {string} email - User email
   * @param {string} ipAddress - Client IP address
   * @param {string} userId - User ID
   */
  async recordSuccessfulLogin(email, ipAddress, userId) {
    try {
      const timestamp = new Date().toISOString();

      // Record successful attempt
      await this.recordAttempt(email, ipAddress, true, timestamp);

      // Clear failed attempt counters
      await this.clearFailedAttempts(email, ipAddress);

      // Remove from lockout cache
      this.lockoutCache.delete(`account_${email}`);
      this.lockoutCache.delete(`ip_${ipAddress}`);      // Log successful login
      await auditLogger.logLogin(userId, true, {
        email,
        ipAddress,
        cleared_failed_attempts: true
      });

    } catch (error) {
      logger.error('Error recording successful login:', error);
    }
  }

  /**
   * Get account lock status
   * @param {string} email - User email
   * @returns {Object} Lock status
   */
  async getAccountLockStatus(email) {
    try {
      // Check cache first
      const cacheKey = `account_${email}`;
      const cached = this.lockoutCache.get(cacheKey);
      if (cached && cached.unlockTime > Date.now()) {
        return cached;
      }

      // Check database
      const { data, error } = await supabase
        .from('account_lockouts')
        .select('*')
        .eq('email', email)
        .eq('lockout_type', 'account')
        .gte('unlock_time', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lockout = data[0];
        const lockStatus = {
          isLocked: true,
          unlockTime: new Date(lockout.unlock_time).getTime(),
          attempts: lockout.attempt_count,
          lockoutReason: lockout.reason
        };

        // Cache the result
        this.lockoutCache.set(cacheKey, lockStatus);
        return lockStatus;
      }

      return { isLocked: false, attempts: 0 };
    } catch (error) {
      logger.error('Error getting account lock status:', error);
      return { isLocked: false, error: error.message };
    }
  }

  /**
   * Get IP lock status
   * @param {string} ipAddress - IP address
   * @returns {Object} Lock status
   */
  async getIPLockStatus(ipAddress) {
    try {
      // Check cache first
      const cacheKey = `ip_${ipAddress}`;
      const cached = this.lockoutCache.get(cacheKey);
      if (cached && cached.unlockTime > Date.now()) {
        return cached;
      }

      // Check database
      const { data, error } = await supabase
        .from('account_lockouts')
        .select('*')
        .eq('ip_address', ipAddress)
        .eq('lockout_type', 'ip')
        .gte('unlock_time', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lockout = data[0];
        const lockStatus = {
          isLocked: true,
          unlockTime: new Date(lockout.unlock_time).getTime(),
          attempts: lockout.attempt_count
        };

        // Cache the result
        this.lockoutCache.set(cacheKey, lockStatus);
        return lockStatus;
      }

      return { isLocked: false, attempts: 0 };
    } catch (error) {
      logger.error('Error getting IP lock status:', error);
      return { isLocked: false, error: error.message };
    }
  }

  /**
   * Lock account after too many failed attempts
   * @param {string} email - User email
   * @param {number} attemptCount - Number of failed attempts
   */
  async lockAccount(email, attemptCount) {
    try {
      // Calculate lockout duration (progressive lockout)
      let duration = SECURITY_POLICIES.accountLockoutDuration;
      
      if (SECURITY_POLICIES.progressiveLockout) {
        const previousLockouts = await this.getPreviousLockoutCount(email);
        duration = Math.min(
          duration * Math.pow(SECURITY_POLICIES.lockoutMultiplier, previousLockouts),
          SECURITY_POLICIES.maxLockoutDuration
        );
      }

      const unlockTime = new Date(Date.now() + duration * 60 * 1000).toISOString();

      // Insert lockout record
      const { error } = await supabase
        .from('account_lockouts')
        .insert({
          email,
          lockout_type: 'account',
          attempt_count: attemptCount,
          unlock_time: unlockTime,
          reason: `Too many failed login attempts (${attemptCount})`,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Cache the lockout
      this.lockoutCache.set(`account_${email}`, {
        isLocked: true,
        unlockTime: new Date(unlockTime).getTime(),
        attempts: attemptCount
      });      // Log the lockout event
      await auditLogger.logEvent({
        event: AUDIT_EVENTS.ACCOUNT_LOCKED,
        ipAddress: null, // Will be set by the audit service
        riskLevel: RISK_LEVELS.HIGH,
        additionalData: {
          email,
          attempt_count: attemptCount,
          lockout_duration_minutes: duration,
          unlock_time: unlockTime,
          progressive_lockout: SECURITY_POLICIES.progressiveLockout
        }
      });

      logger.warn(`Account locked: ${email} for ${duration} minutes after ${attemptCount} failed attempts`);

    } catch (error) {
      logger.error('Error locking account:', error);
    }
  }

  /**
   * Lock IP address after too many failed attempts
   * @param {string} ipAddress - IP address
   * @param {number} attemptCount - Number of failed attempts
   */
  async lockIP(ipAddress, attemptCount) {
    try {
      const duration = SECURITY_POLICIES.ipLockoutDuration;
      const unlockTime = new Date(Date.now() + duration * 60 * 1000).toISOString();

      // Insert lockout record
      const { error } = await supabase
        .from('account_lockouts')
        .insert({
          ip_address: ipAddress,
          lockout_type: 'ip',
          attempt_count: attemptCount,
          unlock_time: unlockTime,
          reason: `Too many failed attempts from IP (${attemptCount})`,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Cache the lockout
      this.lockoutCache.set(`ip_${ipAddress}`, {
        isLocked: true,
        unlockTime: new Date(unlockTime).getTime(),
        attempts: attemptCount
      });      // Log the IP block event
      await auditLogger.logEvent({
        event: AUDIT_EVENTS.IP_BLOCKED,
        ipAddress,
        riskLevel: RISK_LEVELS.CRITICAL,
        additionalData: {
          attempt_count: attemptCount,
          lockout_duration_minutes: duration,
          unlock_time: unlockTime
        }
      });

      logger.warn(`IP blocked: ${ipAddress} for ${duration} minutes after ${attemptCount} failed attempts`);

    } catch (error) {
      logger.error('Error locking IP:', error);
    }
  }

  /**
   * Manually unlock account (admin action)
   * @param {string} email - User email
   * @param {string} adminUserId - Admin who unlocked the account
   */
  async unlockAccount(email, adminUserId) {
    try {
      // Remove active lockouts
      const { error } = await supabase
        .from('account_lockouts')
        .update({ unlock_time: new Date().toISOString() })
        .eq('email', email)
        .eq('lockout_type', 'account')
        .gte('unlock_time', new Date().toISOString());

      if (error) throw error;

      // Clear cache
      this.lockoutCache.delete(`account_${email}`);

      // Clear failed attempts
      await this.clearFailedAttempts(email);      // Log the unlock event
      await auditLogger.logEvent({
        event: AUDIT_EVENTS.ACCOUNT_UNLOCKED,
        userId: adminUserId,
        riskLevel: RISK_LEVELS.MEDIUM,
        additionalData: {
          unlocked_email: email,
          admin_action: true
        }
      });

      logger.info(`Account manually unlocked: ${email} by admin ${adminUserId}`);

    } catch (error) {
      logger.error('Error unlocking account:', error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  async recordAttempt(email, ipAddress, success, timestamp) {
    const { error } = await supabase
      .from('login_attempts')
      .insert({
        email,
        ip_address: ipAddress,
        success,
        attempt_time: timestamp,
        user_agent: navigator?.userAgent || null
      });

    if (error) throw error;
  }

  async getFailedAttempts(email, ipAddress) {
    const timeWindow = 60 * 60 * 1000; // 1 hour window
    const since = new Date(Date.now() - timeWindow).toISOString();

    const [accountResult, ipResult] = await Promise.all([
      supabase
        .from('login_attempts')
        .select('id')
        .eq('email', email)
        .eq('success', false)
        .gte('attempt_time', since),
      
      supabase
        .from('login_attempts')
        .select('id')
        .eq('ip_address', ipAddress)
        .eq('success', false)
        .gte('attempt_time', since)
    ]);

    return {
      accountAttempts: accountResult.data?.length || 0,
      ipAttempts: ipResult.data?.length || 0
    };
  }

  async clearFailedAttempts(email, ipAddress = null) {
    const promises = [
      supabase
        .from('login_attempts')
        .delete()
        .eq('email', email)
        .eq('success', false)
    ];

    if (ipAddress) {
      promises.push(
        supabase
          .from('login_attempts')
          .delete()
          .eq('ip_address', ipAddress)
          .eq('success', false)
      );
    }

    await Promise.all(promises);
  }

  async getPreviousLockoutCount(email) {
    const { data, error } = await supabase
      .from('account_lockouts')
      .select('id')
      .eq('email', email)
      .eq('lockout_type', 'account');

    if (error) {
      logger.error('Error getting previous lockout count:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Cleanup expired lockouts (should be run periodically)
   */
  async cleanupExpiredLockouts() {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('account_lockouts')
        .delete()
        .lt('unlock_time', now);

      if (error) throw error;

      // Clear expired entries from cache
      for (const [key, value] of this.lockoutCache.entries()) {
        if (value.unlockTime <= Date.now()) {
          this.lockoutCache.delete(key);
        }
      }

      logger.debug('Cleaned up expired lockouts');
    } catch (error) {
      logger.error('Error cleaning up expired lockouts:', error);
    }
  }
}

// Export singleton instance
export const accountSecurityService = new AccountSecurityService();

// Start cleanup interval (every 15 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    accountSecurityService.cleanupExpiredLockouts();
  }, 15 * 60 * 1000);
}
