import React, { useState, useCallback } from 'react';

/**
 * Centralized loading state management hook
 */

export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [loadingStates, setLoadingStates] = useState({});

  const setGlobalLoading = useCallback((isLoading) => {
    setLoading(isLoading);
  }, []);

  const setSpecificLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const withLoading = useCallback(async (operation, key = null) => {
    try {
      if (key) {
        setSpecificLoading(key, true);
      } else {
        setGlobalLoading(true);
      }

      const result = await operation();
      return result;
    } finally {
      if (key) {
        setSpecificLoading(key, false);
      } else {
        setGlobalLoading(false);
      }
    }
  }, [setGlobalLoading, setSpecificLoading]);

  const isLoading = useCallback((key = null) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return loading;
  }, [loading, loadingStates]);

  return {
    loading,
    loadingStates,
    setLoading: setGlobalLoading,
    setSpecificLoading,
    withLoading,
    isLoading
  };
};

export default useLoading;
