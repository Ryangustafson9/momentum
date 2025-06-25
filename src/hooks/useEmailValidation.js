/**
 * Real-time Email Validation Hook
 * 
 * Provides debounced email validation with duplicate checking
 * to improve user experience during signup process.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { validators } from '@/utils/validation';

/**
 * Email validation states
 */
export const EMAIL_VALIDATION_STATES = {
  IDLE: 'idle',           // No validation yet
  TYPING: 'typing',       // User is currently typing
  VALIDATING: 'validating', // Checking email format/availability
  VALID: 'valid',         // Email is valid and available
  INVALID_FORMAT: 'invalid_format', // Email format is invalid
  DUPLICATE: 'duplicate', // Email already exists
  ERROR: 'error'          // Validation error occurred
};

/**
 * Hook for real-time email validation with debouncing
 * @param {Object} options - Configuration options
 * @param {number} options.debounceMs - Debounce delay in milliseconds
 * @param {boolean} options.checkDuplicates - Whether to check for duplicate emails
 * @returns {Object} Validation state and functions
 */
export const useEmailValidation = (options = {}) => {
  const {
    debounceMs = 500,
    checkDuplicates = true
  } = options;

  const [email, setEmail] = useState('');
  const [validationState, setValidationState] = useState(EMAIL_VALIDATION_STATES.IDLE);
  const [errorMessage, setErrorMessage] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Refs for managing debouncing and cleanup
  const debounceTimeoutRef = useRef(null);
  const validationAbortControllerRef = useRef(null);

  /**
   * Check if email already exists in the database
   * @param {string} emailToCheck - Email to check
   * @returns {Promise<boolean>} True if email exists
   */
  const checkEmailExists = useCallback(async (emailToCheck) => {
    try {
      // Abort any previous request
      if (validationAbortControllerRef.current) {
        validationAbortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      validationAbortControllerRef.current = new AbortController();

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', emailToCheck.toLowerCase())
        .maybeSingle()
        .abortSignal(validationAbortControllerRef.current.signal);

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Error checking email existence:', profileError);
        // If we can't check, assume email doesn't exist to allow signup attempt
        return false;
      }

      return !!profileData;

    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return false;
      }
      
      console.warn('Exception checking email existence:', error);
      // If we can't check, assume email doesn't exist to allow signup attempt
      return false;
    }
  }, []);

  /**
   * Validate email format and availability
   * @param {string} emailToValidate - Email to validate
   */
  const validateEmail = useCallback(async (emailToValidate) => {
    if (!emailToValidate || emailToValidate.trim() === '') {
      setValidationState(EMAIL_VALIDATION_STATES.IDLE);
      setErrorMessage('');
      setIsValid(false);
      return;
    }

    // First check format
    if (!validators.email(emailToValidate)) {
      setValidationState(EMAIL_VALIDATION_STATES.INVALID_FORMAT);
      setErrorMessage('Please enter a valid email address');
      setIsValid(false);
      return;
    }

    // If format is valid and we should check duplicates
    if (checkDuplicates) {
      setValidationState(EMAIL_VALIDATION_STATES.VALIDATING);
      setErrorMessage('');

      try {
        const emailExists = await checkEmailExists(emailToValidate);
        
        if (emailExists) {
          setValidationState(EMAIL_VALIDATION_STATES.DUPLICATE);
          setErrorMessage('An account with this email already exists');
          setIsValid(false);
        } else {
          setValidationState(EMAIL_VALIDATION_STATES.VALID);
          setErrorMessage('');
          setIsValid(true);
        }
      } catch (error) {
        setValidationState(EMAIL_VALIDATION_STATES.ERROR);
        setErrorMessage('Unable to verify email availability');
        setIsValid(false);
      }
    } else {
      // If not checking duplicates, just validate format
      setValidationState(EMAIL_VALIDATION_STATES.VALID);
      setErrorMessage('');
      setIsValid(true);
    }
  }, [checkDuplicates, checkEmailExists]);

  /**
   * Handle email input change with debouncing
   * @param {string} newEmail - New email value
   */
  const handleEmailChange = useCallback((newEmail) => {
    setEmail(newEmail);

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If email is empty, reset state immediately
    if (!newEmail || newEmail.trim() === '') {
      setValidationState(EMAIL_VALIDATION_STATES.IDLE);
      setErrorMessage('');
      setIsValid(false);
      return;
    }

    // Set typing state immediately
    setValidationState(EMAIL_VALIDATION_STATES.TYPING);
    setErrorMessage('');
    setIsValid(false);

    // Debounce the validation
    debounceTimeoutRef.current = setTimeout(() => {
      validateEmail(newEmail.trim());
    }, debounceMs);
  }, [debounceMs, validateEmail]);

  /**
   * Force immediate validation without debouncing
   */
  const validateNow = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    validateEmail(email.trim());
  }, [email, validateEmail]);

  /**
   * Reset validation state
   */
  const reset = useCallback(() => {
    setEmail('');
    setValidationState(EMAIL_VALIDATION_STATES.IDLE);
    setErrorMessage('');
    setIsValid(false);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (validationAbortControllerRef.current) {
      validationAbortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (validationAbortControllerRef.current) {
        validationAbortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Get validation status icon and color
   */
  const getValidationStatus = useCallback(() => {
    switch (validationState) {
      case EMAIL_VALIDATION_STATES.VALID:
        return { icon: 'check', color: 'text-green-500', bgColor: 'bg-green-50' };
      case EMAIL_VALIDATION_STATES.INVALID_FORMAT:
      case EMAIL_VALIDATION_STATES.DUPLICATE:
      case EMAIL_VALIDATION_STATES.ERROR:
        return { icon: 'x', color: 'text-red-500', bgColor: 'bg-red-50' };
      case EMAIL_VALIDATION_STATES.VALIDATING:
        return { icon: 'spinner', color: 'text-blue-500', bgColor: 'bg-blue-50' };
      case EMAIL_VALIDATION_STATES.TYPING:
        return { icon: 'dots', color: 'text-gray-400', bgColor: 'bg-gray-50' };
      default:
        return { icon: null, color: '', bgColor: '' };
    }
  }, [validationState]);

  return {
    // State
    email,
    validationState,
    errorMessage,
    isValid,
    isValidating: validationState === EMAIL_VALIDATION_STATES.VALIDATING,
    isTyping: validationState === EMAIL_VALIDATION_STATES.TYPING,
    
    // Functions
    handleEmailChange,
    validateNow,
    reset,
    getValidationStatus,
    
    // Constants
    EMAIL_VALIDATION_STATES
  };
};

export default useEmailValidation;
