import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from '@/App';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/hooks/useTheme.jsx';
import { FeatureErrorBoundary } from '@/shared/components/ErrorBoundary.jsx';
import { AuthProvider } from '@/providers/AuthProvider.jsx';
import { queryClient } from '@/lib/queryClient';
import { env } from '@/lib/env';
import {
  initializeProductionOptimizations,
  cleanupDevelopmentArtifacts,
  performHealthCheck
} from '@/config/production';
import { createLogger } from '@/lib/logger';

// Create logger for main application
const logger = createLogger('Main');

// Initialize production optimizations
if (env.PROD) {
  logger.info('🚀 Initializing production environment');
  initializeProductionOptimizations();
  cleanupDevelopmentArtifacts();

  // Perform health check
  performHealthCheck().then(health => {
    if (health.status === 'healthy') {
      logger.info('✅ Application health check passed');
    } else {
      logger.warn('⚠️ Application health check issues:', health.errors);
    }
  }).catch(error => {
    logger.error('❌ Health check failed:', error);
  });
} else {
  logger.info('🔧 Running in development mode');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // Temporarily disable StrictMode to fix auth initialization issues
  // <React.StrictMode>
    <FeatureErrorBoundary featureName="App">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <AuthProvider>
              <App />
              <Toaster />
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </FeatureErrorBoundary>
  // </React.StrictMode>
);
