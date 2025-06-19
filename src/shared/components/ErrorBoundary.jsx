import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Error fallback component for different error types
 */
const ErrorFallback = ({ error, resetErrorBoundary, resetKeys }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Determine error type and customize message
  const getErrorInfo = (error) => {
    if (error?.message?.includes('ChunkLoadError') || error?.message?.includes('Loading chunk')) {
      return {
        type: 'chunk',
        title: 'App Update Available',
        description: 'A new version of the app is available. Please refresh to get the latest updates.',
        action: 'Refresh Page',
        icon: RefreshCw,
      };
    }
    
    if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
      return {
        type: 'network',
        title: 'Connection Problem',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        action: 'Retry',
        icon: AlertTriangle,
      };
    }
    
    if (error?.status === 403 || error?.message?.includes('permission')) {
      return {
        type: 'permission',
        title: 'Access Denied',
        description: 'You don\'t have permission to access this resource. Please contact your administrator.',
        action: 'Go Home',
        icon: AlertTriangle,
      };
    }
    
    return {
      type: 'generic',
      title: 'Something went wrong',
      description: 'An unexpected error occurred. Our team has been notified and is working on a fix.',
      action: 'Try Again',
      icon: Bug,
    };
  };

  const errorInfo = getErrorInfo(error);
  const Icon = errorInfo.icon;

  const handleAction = () => {
    if (errorInfo.type === 'chunk') {
      window.location.reload();
    } else if (errorInfo.type === 'permission') {
      window.location.href = '/';
    } else {
      resetErrorBoundary();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Icon className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {errorInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            {errorInfo.description}
          </p>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleAction} className="w-full">
              {errorInfo.action}
            </Button>
            
            {errorInfo.type !== 'permission' && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>

          {isDevelopment && (
            <Alert className="mt-4">
              <Bug className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">
                    {error?.stack || error?.message || 'Unknown error'}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Feature-specific error boundary
 */
export const FeatureErrorBoundary = ({ 
  children, 
  fallback, 
  onError,
  resetKeys = [],
  featureName = 'Feature'
}) => {
  const handleError = (error, errorInfo) => {
    console.error(`${featureName} Error:`, error, errorInfo);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with Sentry or other error reporting service
      // Sentry.captureException(error, { extra: errorInfo });
    }
    
    onError?.(error, errorInfo);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={handleError}
      resetKeys={resetKeys}
    >
      {children}
    </ReactErrorBoundary>
  );
};

/**
 * Page-level error boundary
 */
export const PageErrorBoundary = ({ children, resetKeys = [] }) => {
  return (
    <FeatureErrorBoundary
      featureName="Page"
      resetKeys={resetKeys}
    >
      {children}
    </FeatureErrorBoundary>
  );
};

/**
 * Component-level error boundary with inline fallback
 */
export const ComponentErrorBoundary = ({ 
  children, 
  fallback,
  resetKeys = [],
  componentName = 'Component'
}) => {
  const InlineFallback = ({ error, resetErrorBoundary }) => {
    if (fallback) {
      return fallback({ error, resetErrorBoundary });
    }

    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span>Failed to load {componentName}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetErrorBoundary}
              className="ml-2"
            >
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <FeatureErrorBoundary
      fallback={InlineFallback}
      featureName={componentName}
      resetKeys={resetKeys}
    >
      {children}
    </FeatureErrorBoundary>
  );
};

/**
 * Query error boundary specifically for React Query errors
 */
export const QueryErrorBoundary = ({ children, resetKeys = [] }) => {
  const QueryFallback = ({ error, resetErrorBoundary }) => {
    const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isNetworkError ? 'Connection Error' : 'Data Loading Error'}
        </h3>
        <p className="text-gray-600 mb-4">
          {isNetworkError 
            ? 'Unable to fetch data. Please check your connection.'
            : 'Failed to load data. Please try again.'
          }
        </p>
        <Button onClick={resetErrorBoundary}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  };

  return (
    <FeatureErrorBoundary
      fallback={QueryFallback}
      featureName="Query"
      resetKeys={resetKeys}
    >
      {children}
    </FeatureErrorBoundary>
  );
};

// Default export
export default FeatureErrorBoundary;

// Named export for main ErrorBoundary (alias for FeatureErrorBoundary)
export const ErrorBoundary = FeatureErrorBoundary;
