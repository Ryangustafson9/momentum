/**
 * Network Resilient Form Handler
 * 
 * Provides retry logic, offline detection, and local storage backup
 * for form submissions to handle network failures gracefully.
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Network detection utility
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect connection type if available
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        const handleConnectionChange = () => {
          setConnectionType(connection.effectiveType || 'unknown');
        };
        connection.addEventListener('change', handleConnectionChange);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          connection.removeEventListener('change', handleConnectionChange);
        };
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
};

/**
 * Local storage backup for form data
 */
export const useFormBackup = (storageKey, defaultData = {}) => {
  const [backupData, setBackupData] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultData;
    } catch (error) {
      console.warn('Failed to load form backup:', error);
      return defaultData;
    }
  });

  const saveBackup = useCallback((data) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
      setBackupData(data);
    } catch (error) {
      console.warn('Failed to save form backup:', error);
    }
  }, [storageKey]);

  const clearBackup = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setBackupData(defaultData);
    } catch (error) {
      console.warn('Failed to clear form backup:', error);
    }
  }, [storageKey, defaultData]);

  const hasBackup = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return false;
      
      const data = JSON.parse(stored);
      // Consider backup valid if it's less than 24 hours old
      const isRecent = Date.now() - (data.timestamp || 0) < 24 * 60 * 60 * 1000;
      return isRecent;
    } catch (error) {
      return false;
    }
  }, [storageKey]);

  return { backupData, saveBackup, clearBackup, hasBackup: hasBackup() };
};

/**
 * Retry configuration and logic
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableErrors: [
    'NetworkError',
    'TypeError', // Often network-related in fetch
    'AbortError',
    'TimeoutError'
  ]
};

/**
 * Determines if an error is retryable
 */
const isRetryableError = (error) => {
  if (!error) return false;
  
  // Check error message patterns
  const message = error.message?.toLowerCase() || '';
  const retryablePatterns = [
    'network',
    'fetch',
    'timeout',
    'connection',
    'abort',
    'failed to fetch',
    'load failed'
  ];
  
  const hasRetryableMessage = retryablePatterns.some(pattern => 
    message.includes(pattern)
  );
  
  // Check error types
  const hasRetryableType = RETRY_CONFIG.retryableErrors.some(type =>
    error.name === type || error.constructor.name === type
  );
  
  // Check HTTP status codes (if available)
  const hasRetryableStatus = error.status && [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504  // Gateway Timeout
  ].includes(error.status);
  
  return hasRetryableMessage || hasRetryableType || hasRetryableStatus;
};

/**
 * Calculate exponential backoff delay
 */
const calculateDelay = (attempt) => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelay);
};

/**
 * Sleep utility for delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Network resilient form submission hook
 */
export const useResilientFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [lastError, setLastError] = useState(null);
  const { isOnline } = useNetworkStatus();

  const submitWithRetry = useCallback(async (submitFunction, options = {}) => {
    const {
      maxRetries = RETRY_CONFIG.maxRetries,
      onProgress = () => {},
      onRetry = () => {},
      validateBeforeSubmit = () => true,
      backupData = null,
      storageKey = null
    } = options;

    // Validate before starting
    if (!validateBeforeSubmit()) {
      throw new Error('Validation failed before submission');
    }

    // Check if offline
    if (!isOnline) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    setIsSubmitting(true);
    setLastError(null);
    setAttempt(0);

    // Save backup if provided
    if (backupData && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          ...backupData,
          timestamp: Date.now(),
          submissionAttempted: true
        }));
      } catch (error) {
        console.warn('Failed to save submission backup:', error);
      }
    }

    let currentAttempt = 0;

    while (currentAttempt <= maxRetries) {
      try {
        setAttempt(currentAttempt + 1);
        onProgress({ attempt: currentAttempt + 1, maxRetries: maxRetries + 1 });

        // Execute the submission function
        const result = await submitFunction();

        // Success! Clear backup if it exists
        if (storageKey) {
          try {
            localStorage.removeItem(storageKey);
          } catch (error) {
            console.warn('Failed to clear submission backup:', error);
          }
        }

        setIsSubmitting(false);
        return result;

      } catch (error) {
        console.error(`Submission attempt ${currentAttempt + 1} failed:`, error);
        setLastError(error);

        // If this is the last attempt, throw the error
        if (currentAttempt >= maxRetries) {
          setIsSubmitting(false);
          throw error;
        }

        // Check if error is retryable
        if (!isRetryableError(error)) {
          setIsSubmitting(false);
          throw error;
        }

        // Check if still online before retrying
        if (!navigator.onLine) {
          setIsSubmitting(false);
          throw new Error('Lost internet connection during submission');
        }

        // Wait before retrying
        const delay = calculateDelay(currentAttempt);
        onRetry({ 
          attempt: currentAttempt + 1, 
          error, 
          retryIn: delay,
          maxRetries: maxRetries + 1 
        });
        
        await sleep(delay);
        currentAttempt++;
      }
    }
  }, [isOnline]);

  return {
    submitWithRetry,
    isSubmitting,
    attempt,
    lastError,
    isOnline
  };
};

/**
 * Complete form handler with all resilience features
 */
export const useResilientForm = (options = {}) => {
  const {
    storageKey = 'form_backup',
    defaultData = {},
    autoSave = true,
    autoSaveDelay = 2000
  } = options;

  const [formData, setFormData] = useState(defaultData);
  const { backupData, saveBackup, clearBackup, hasBackup } = useFormBackup(storageKey, defaultData);
  const resilientSubmission = useResilientFormSubmission();
  const { isOnline } = useNetworkStatus();

  // Auto-save form data
  useEffect(() => {
    if (!autoSave) return;

    const timeoutId = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        saveBackup(formData);
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [formData, autoSave, autoSaveDelay, saveBackup]);

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const restoreFromBackup = useCallback(() => {
    if (hasBackup && backupData) {
      setFormData(backupData);
      return true;
    }
    return false;
  }, [hasBackup, backupData]);

  const submitForm = useCallback(async (submitFunction, submissionOptions = {}) => {
    return resilientSubmission.submitWithRetry(submitFunction, {
      ...submissionOptions,
      backupData: formData,
      storageKey
    });
  }, [resilientSubmission, formData, storageKey]);

  const clearForm = useCallback(() => {
    setFormData(defaultData);
    clearBackup();
  }, [defaultData, clearBackup]);

  return {
    formData,
    updateFormData,
    submitForm,
    clearForm,
    restoreFromBackup,
    hasBackup,
    isOnline,
    ...resilientSubmission
  };
};

export default useResilientForm;
