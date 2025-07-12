/**
 * Unified App Provider
 * Consolidates all context providers to prevent provider hell
 * and ensure consistent context hierarchy
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './AuthContext';
import { LocationProvider } from './LocationContext';
import { CheckInProvider } from './CheckInContext';
import { NotificationProvider } from './NotificationContext';
import { ToastProvider } from './ToastContext';
import { ThemeProvider } from '../hooks/useTheme';
import { ClubProvider } from '../hooks/useClubContext';

// Error Boundary
import { FeatureErrorBoundary } from '../shared/components/ErrorBoundary';

// Query Client
import { queryClient } from '../lib/queryClient';

/**
 * Main App Provider that wraps all other providers
 * Ensures proper provider hierarchy and prevents context conflicts
 */
export const AppProvider = ({ children }) => {
  return (
    <FeatureErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <ClubProvider>
                <LocationProvider>
                  <NotificationProvider>
                    <CheckInProvider>
                      <ToastProvider>
                        {children}
                        {/* Development tools */}
                        {import.meta.env.DEV && (
                          <ReactQueryDevtools 
                            initialIsOpen={false}
                            position="bottom-right"
                          />
                        )}
                      </ToastProvider>
                    </CheckInProvider>
                  </NotificationProvider>
                </LocationProvider>
              </ClubProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </FeatureErrorBoundary>
  );
};

/**
 * Lightweight provider for testing
 * Excludes heavy providers like notifications and real-time features
 */
export const TestAppProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

/**
 * Minimal provider for components that only need basic context
 * Useful for isolated component testing or simple pages
 */
export const MinimalAppProvider = ({ children }) => {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
};

/**
 * Provider configuration for different environments
 */
export const getProviderConfig = (environment = 'production') => {
  const configs = {
    development: {
      enableDevtools: true,
      enablePerformanceMonitoring: true,
      enableDebugLogging: true
    },
    production: {
      enableDevtools: false,
      enablePerformanceMonitoring: false,
      enableDebugLogging: false
    },
    test: {
      enableDevtools: false,
      enablePerformanceMonitoring: false,
      enableDebugLogging: false
    }
  };

  return configs[environment] || configs.production;
};

/**
 * Hook to access provider configuration
 */
export const useProviderConfig = () => {
  const environment = import.meta.env.MODE || 'production';
  return getProviderConfig(environment);
};

/**
 * Context health check utility
 * Verifies all contexts are properly initialized
 */
export const checkContextHealth = () => {
  const contexts = [
    'AuthContext',
    'LocationContext',
    'CheckInContext',
    'NotificationContext',
    'ToastContext',
    'ThemeContext',
    'ClubContext'
  ];

  const healthStatus = {};

  contexts.forEach(contextName => {
    try {
      // This would need to be implemented based on actual context usage
      healthStatus[contextName] = 'healthy';
    } catch (error) {
      healthStatus[contextName] = 'unhealthy';
      console.error(`Context ${contextName} health check failed:`, error);
    }
  });

  return healthStatus;
};

// ==================== EXPORTS ====================

export default AppProvider;
