import React from 'react';
import { Loader2, Users, Calendar, BarChart3, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Generic loading spinner
 */
export const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

/**
 * Full page loading screen
 */
export const PageLoading = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="xl" className="text-primary mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {message}
        </h2>
        <p className="text-gray-600">
          Please wait while we load your content
        </p>
      </div>
    </div>
  );
};

/**
 * Inline loading component
 */
export const InlineLoading = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <LoadingSpinner className="mr-2" />
      <span className="text-gray-600">{message}</span>
    </div>
  );
};

/**
 * Button loading state
 */
export const ButtonLoading = ({ children, loading = false, ...props }) => {
  return (
    <button disabled={loading} {...props}>
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};

/**
 * Table loading skeleton
 */
export const TableLoading = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Card loading skeleton
 */
export const CardLoading = ({ showHeader = true, lines = 3 }) => {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
};

/**
 * Dashboard stats loading
 */
export const StatsLoading = () => {
  const stats = [
    { icon: Users, label: 'Members' },
    { icon: Calendar, label: 'Classes' },
    { icon: BarChart3, label: 'Attendance' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </div>
              <stat.icon className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * List loading skeleton
 */
export const ListLoading = ({ items = 5, showAvatar = false }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
};

/**
 * Form loading skeleton
 */
export const FormLoading = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

/**
 * Chart loading skeleton
 */
export const ChartLoading = ({ height = 300 }) => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between space-x-2" style={{ height }}>
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton 
              key={index} 
              className="w-full" 
              style={{ height: `${Math.random() * 80 + 20}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Suspense fallback component
 */
export const SuspenseFallback = ({ message = 'Loading component...' }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-primary mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

/**
 * Progressive loading component that shows different states
 */
export const ProgressiveLoading = ({ 
  stage = 'initial', 
  stages = {
    initial: 'Initializing...',
    loading: 'Loading data...',
    processing: 'Processing...',
    finalizing: 'Almost done...'
  }
}) => {
  const stageKeys = Object.keys(stages);
  const currentIndex = stageKeys.indexOf(stage);
  const progress = ((currentIndex + 1) / stageKeys.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <LoadingSpinner size="lg" className="text-primary mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {stages[stage]}
      </h3>
      <div className="w-64 bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">
        Step {currentIndex + 1} of {stageKeys.length}
      </p>
    </div>
  );
};

// Also export ProgressLoading as an alias for ProgressiveLoading
export const ProgressLoading = ProgressiveLoading;

export default LoadingSpinner;
