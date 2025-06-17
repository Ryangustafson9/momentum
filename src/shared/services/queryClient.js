import { QueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

// Default query options
const defaultQueryOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors except 408, 429
      if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error?.status)) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false,
    onError: (error) => {
      console.error('Mutation error:', error);
      
      // Handle different error types
      if (error?.message?.includes('network')) {
        toast({
          title: "Network Error",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      } else if (error?.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to perform this action.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error?.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    },
  },
};

// Create query client instance
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    user: () => ['auth', 'user'],
    profile: (userId) => ['auth', 'profile', userId],
  },
  
  // Members
  members: {
    all: () => ['members'],
    list: (filters) => ['members', 'list', filters],
    detail: (id) => ['members', 'detail', id],
    stats: () => ['members', 'stats'],
  },
  
  // Classes
  classes: {
    all: () => ['classes'],
    list: (filters) => ['classes', 'list', filters],
    detail: (id) => ['classes', 'detail', id],
    upcoming: (instructorId) => ['classes', 'upcoming', instructorId],
  },
  
  // Attendance
  attendance: {
    all: () => ['attendance'],
    records: (filters) => ['attendance', 'records', filters],
    todayCount: () => ['attendance', 'today-count'],
    recent: (limit) => ['attendance', 'recent', limit],
  },
  
  // Bookings
  bookings: {
    all: () => ['bookings'],
    list: (filters) => ['bookings', 'list', filters],
    detail: (id) => ['bookings', 'detail', id],
    member: (memberId) => ['bookings', 'member', memberId],
  },
  
  // Dashboard
  dashboard: {
    stats: () => ['dashboard', 'stats'],
    recentActivity: () => ['dashboard', 'recent-activity'],
  },
  
  // Settings
  settings: {
    all: () => ['settings'],
    general: () => ['settings', 'general'],
    notifications: () => ['settings', 'notifications'],
  },
};

// Utility functions for cache management
export const invalidateQueries = {
  members: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all() }),
  classes: () => queryClient.invalidateQueries({ queryKey: queryKeys.classes.all() }),
  attendance: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all() }),
  bookings: () => queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() }),
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() }),
  all: () => queryClient.invalidateQueries(),
};

// Prefetch utilities
export const prefetchQueries = {
  memberStats: () => queryClient.prefetchQuery({
    queryKey: queryKeys.members.stats(),
    queryFn: () => import('@/shared/services/api').then(api => api.getMemberStats()),
  }),
  
  dashboardStats: () => queryClient.prefetchQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => import('@/shared/services/api').then(api => api.getDashboardStats()),
  }),
};

export default queryClient;
