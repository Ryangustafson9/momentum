// src/hooks/useHealthStatus.js
import React, { useState, useEffect } from 'react';
import { checkDatabaseHealth, getCachedHealthStatus } from '@/lib/healthUtils';

export function useHealthStatus(autoRefresh = false, interval = 60000) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshHealth = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try cached first, then fresh if needed
      let healthStatus = !force ? getCachedHealthStatus() : null;
      
      if (!healthStatus) {
        healthStatus = await checkDatabaseHealth(force);
      }
      
      setHealth(healthStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    refreshHealth();
    
    // Auto-refresh if enabled
    if (autoRefresh) {
      const timer = setInterval(() => {
        refreshHealth();
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [autoRefresh, interval]);

  return {
    health,
    loading,
    error,
    refresh: refreshHealth,
    isHealthy: health?.overall || false,
    isCached: health?.cached || false
  };
}
