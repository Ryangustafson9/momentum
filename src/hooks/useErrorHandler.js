import React, { useCallback } from 'react';
import { showToast } from '@/utils/toastUtils';

/**
 * Centralized error handling hook
 */

export const useErrorHandler = () => {
  const handleError = useCallback((error, context = '') => {
    console.error(`Error in ${context}:`, error);

    // Handle different error types
    if (error?.message?.includes('network')) {
      showToast.networkError();
    } else if (error?.code === 'PGRST116' || error?.status === 403) {
      showToast.unauthorizedError();
    } else if (error?.message?.includes('validation')) {
      showToast.validationError(error.message);
    } else {
      showToast.error(
        'Something went wrong',
        error?.message || 'An unexpected error occurred'
      );
    }

    // Log to external service (if needed)
    // logErrorToService(error, context);

    return error;
  }, []);

  const handleAsyncOperation = useCallback(async (operation, context = '') => {
    try {
      return await operation();
    } catch (error) {
      handleError(error, context);
      throw error;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncOperation
  };
};

export default useErrorHandler;
