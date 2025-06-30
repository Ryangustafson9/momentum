/**
 * Password Security React Hook
 * Provides password validation, strength checking, and security policies
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { validatePassword, checkPasswordCompromised, estimateCrackTime } from '@/utils/passwordValidation';

// Security policies configuration
export const SECURITY_POLICIES = {
  maxLoginAttempts: 5,
  lockoutDuration: 15, // minutes
  passwordHistoryCount: 5, // prevent reusing last 5 passwords
  passwordExpiration: 90, // days
  forcePasswordChangeOnFirstLogin: true,
  sessionTimeout: 30, // minutes
  requirePasswordChangeAfterReset: true
};

/**
 * Hook for password security features
 * @param {Object} options - Configuration options
 * @returns {Object} Password security utilities
 */
export const usePasswordSecurity = (options = {}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validation, setValidation] = useState(null);
  const [isCompromised, setIsCompromised] = useState(false);
  const [crackTime, setCrackTime] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // User information for validation (prevent personal info in passwords)
  const userInfo = options.userInfo || {};

  // Validate password whenever it changes
  useEffect(() => {
    if (password) {
      const result = validatePassword(password, userInfo);
      setValidation(result);
      
      // Estimate crack time
      const crackEstimate = estimateCrackTime(password);
      setCrackTime(crackEstimate);
    } else {
      setValidation(null);
      setCrackTime(null);
    }
  }, [password, userInfo]);

  // Check if password is compromised (debounced)
  useEffect(() => {
    if (!password || password.length < 6) {
      setIsCompromised(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsChecking(true);
      try {
        const compromised = await checkPasswordCompromised(password);
        setIsCompromised(compromised);
      } catch (error) {
        console.warn('Could not check password compromise status:', error);
        setIsCompromised(false);
      } finally {
        setIsChecking(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [password]);

  // Password strength color and label
  const strengthInfo = useMemo(() => {
    if (!validation) return { color: 'gray', label: '', percentage: 0 };

    const strengthMap = {
      'very-weak': { color: 'red', label: 'Very Weak', percentage: 20 },
      'weak': { color: 'orange', label: 'Weak', percentage: 40 },
      'medium': { color: 'yellow', label: 'Medium', percentage: 60 },
      'strong': { color: 'green', label: 'Strong', percentage: 80 },
      'very-strong': { color: 'emerald', label: 'Very Strong', percentage: 100 }
    };

    return strengthMap[validation.strength] || strengthMap['very-weak'];
  }, [validation]);

  // Check if passwords match
  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  // Overall password validity
  const isPasswordValid = useMemo(() => {
    return validation?.isValid && 
           passwordsMatch === true && 
           !isCompromised;
  }, [validation, passwordsMatch, isCompromised]);

  // Password requirements checklist
  const requirementsList = useMemo(() => {
    if (!validation) return [];

    return [
      {
        key: 'minLength',
        label: 'At least 8 characters',
        met: validation.requirements.minLength,
        required: true
      },
      {
        key: 'hasUppercase',
        label: 'One uppercase letter (A-Z)',
        met: validation.requirements.hasUppercase,
        required: true
      },
      {
        key: 'hasLowercase',
        label: 'One lowercase letter (a-z)',
        met: validation.requirements.hasLowercase,
        required: true
      },
      {
        key: 'hasNumbers',
        label: 'One number (0-9)',
        met: validation.requirements.hasNumbers,
        required: true
      },
      {
        key: 'hasSpecialChars',
        label: 'One special character (!@#$%^&*)',
        met: validation.requirements.hasSpecialChars,
        required: true
      },
      {
        key: 'notCommonPassword',
        label: 'Not a common password',
        met: validation.requirements.notCommonPassword,
        required: true
      },
      {
        key: 'noUserInfo',
        label: 'No personal information',
        met: validation.requirements.noUserInfo,
        required: true
      },
      {
        key: 'noSequentialChars',
        label: 'No sequential characters (abc, 123)',
        met: validation.requirements.noSequentialChars,
        required: false
      },
      {
        key: 'noRepeatingChars',
        label: 'No repeating characters (aaa, 111)',
        met: validation.requirements.noRepeatingChars,
        required: false
      }
    ];
  }, [validation]);

  // Generate suggestions for improvement
  const suggestions = useMemo(() => {
    if (!validation) return [];
    return validation.suggestions || [];
  }, [validation]);

  // Reset all password state
  const resetPassword = useCallback(() => {
    setPassword('');
    setConfirmPassword('');
    setValidation(null);
    setIsCompromised(false);
    setCrackTime(null);
    setShowPassword(false);
  }, []);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Check account lockout status
  const checkAccountLockout = useCallback(async (email) => {
    // This would typically check against a backend service
    // For now, return mock data
    try {
      // In real implementation:
      // const response = await fetch(`/api/auth/lockout-status/${email}`);
      // return response.json();
      
      return {
        isLocked: false,
        remainingAttempts: SECURITY_POLICIES.maxLoginAttempts,
        lockoutExpires: null
      };
    } catch (error) {
      console.error('Error checking account lockout:', error);
      return {
        isLocked: false,
        remainingAttempts: SECURITY_POLICIES.maxLoginAttempts,
        lockoutExpires: null
      };
    }
  }, []);

  // Record login attempt
  const recordLoginAttempt = useCallback(async (email, success) => {
    // This would typically record in backend
    try {
      // In real implementation:
      // await fetch('/api/auth/login-attempt', {
      //   method: 'POST',
      //   body: JSON.stringify({ email, success, timestamp: new Date() })
      // });
      
      console.log(`Login attempt recorded: ${email} - ${success ? 'success' : 'failed'}`);
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  }, []);

  return {
    // State
    password,
    confirmPassword,
    validation,
    isCompromised,
    crackTime,
    showPassword,
    isChecking,
    
    // Computed values
    strengthInfo,
    passwordsMatch,
    isPasswordValid,
    requirementsList,
    suggestions,
    
    // Actions
    setPassword,
    setConfirmPassword,
    resetPassword,
    togglePasswordVisibility,
    checkAccountLockout,
    recordLoginAttempt,
    
    // Security policies
    policies: SECURITY_POLICIES
  };
};

/**
 * Hook for session management and timeout
 * @param {Object} options - Configuration options
 * @returns {Object} Session management utilities
 */
export const useSessionSecurity = (options = {}) => {
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [isSessionWarningShown, setIsSessionWarningShown] = useState(false);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState(null);

  const sessionTimeout = options.sessionTimeout || SECURITY_POLICIES.sessionTimeout;
  const warningMinutes = options.warningMinutes || 5;

  // Initialize session expiry
  useEffect(() => {
    if (options.startSession) {
      const expiryTime = new Date(Date.now() + sessionTimeout * 60 * 1000);
      setSessionExpiry(expiryTime);
      setIsSessionWarningShown(false);
    }
  }, [options.startSession, sessionTimeout]);

  // Update time until expiry
  useEffect(() => {
    if (!sessionExpiry) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeLeft = sessionExpiry.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setTimeUntilExpiry(0);
        if (options.onSessionExpired) {
          options.onSessionExpired();
        }
        return;
      }

      const minutesLeft = Math.floor(timeLeft / (1000 * 60));
      setTimeUntilExpiry(minutesLeft);

      // Show warning when close to expiry
      if (minutesLeft <= warningMinutes && !isSessionWarningShown) {
        setIsSessionWarningShown(true);
        if (options.onSessionWarning) {
          options.onSessionWarning(minutesLeft);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiry, warningMinutes, isSessionWarningShown, options]);

  // Extend session
  const extendSession = useCallback(() => {
    if (sessionExpiry) {
      const newExpiryTime = new Date(Date.now() + sessionTimeout * 60 * 1000);
      setSessionExpiry(newExpiryTime);
      setIsSessionWarningShown(false);
    }
  }, [sessionExpiry, sessionTimeout]);

  // End session
  const endSession = useCallback(() => {
    setSessionExpiry(null);
    setTimeUntilExpiry(null);
    setIsSessionWarningShown(false);
  }, []);

  return {
    sessionExpiry,
    timeUntilExpiry,
    isSessionWarningShown,
    extendSession,
    endSession
  };
};

export default {
  usePasswordSecurity,
  useSessionSecurity,
  SECURITY_POLICIES
};
