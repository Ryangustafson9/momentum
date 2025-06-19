// ⚡ ADVANCED REACT QUERY CONFIGURATION
// High-performance data management with intelligent caching and optimization
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

// ⭐ PERFORMANCE: Advanced cache configuration
const CACHE_CONFIG = {
  // Static data (rarely changes)
  STATIC: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  // Dynamic data (changes frequently)
  DYNAMIC: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  },
  // Real-time data (changes constantly)
  REALTIME: {
    staleTime: 0, // Always stale
    gcTime: 2 * 60 * 1000, // 2 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30 * 1000, // 30 seconds
  },
  // User-specific data
  USER: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
};

// ⭐ PERFORMANCE: Intelligent retry logic
const getRetryConfig = (error) => {
  // Don't retry on client errors (4xx)
  if (error?.status >= 400 && error?.status < 500) {
    return false;
  }
  // Don't retry on authentication errors
  if (error?.message?.includes('auth') || error?.status === 401) {
    return false;
  }
  // Retry on network errors and server errors
  return true;
};

// Create a query client with advanced performance optimizations
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ⭐ PERFORMANCE: Moderate caching by default
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // ⭐ PERFORMANCE: Intelligent retry strategy
      retry: (failureCount, error) => {
        if (!getRetryConfig(error)) return false;
        return failureCount < 3;
      },

      // ⭐ PERFORMANCE: Exponential backoff with jitter
      retryDelay: (attemptIndex) => {
        const baseDelay = Math.min(1000 * 2 ** attemptIndex, 30000);
        const jitter = Math.random() * 0.1 * baseDelay;
        return baseDelay + jitter;
      },

      // ⭐ PERFORMANCE: Smart refetch behavior
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: 'always',

      // ⭐ PERFORMANCE: Network mode optimization
      networkMode: 'online',

      // ⭐ PERFORMANCE: Error handling
      onError: (error) => {
        logger.error('Query error:', error);

        // Track performance metrics
        if (typeof window !== 'undefined' && window.performance) {
          performance.mark('query-error');
        }
      },

      // ⭐ PERFORMANCE: Success tracking
      onSuccess: (data) => {
        if (typeof window !== 'undefined' && window.performance) {
          performance.mark('query-success');
        }
      },
    },
    mutations: {
      // ⭐ PERFORMANCE: Conservative mutation retry
      retry: (failureCount, error) => {
        if (!getRetryConfig(error)) return false;
        return failureCount < 2;
      },

      // ⭐ PERFORMANCE: Mutation error handling
      onError: (error) => {
        logger.error('Mutation error:', error);

        // Track mutation failures
        if (typeof window !== 'undefined' && window.performance) {
          performance.mark('mutation-error');
        }
      },

      // ⭐ PERFORMANCE: Mutation success tracking
      onSuccess: (data) => {
        if (typeof window !== 'undefined' && window.performance) {
          performance.mark('mutation-success');
        }
      },
    },
  },

  // ⭐ PERFORMANCE: Advanced query cache configuration
  queryCache: new QueryCache({
    onError: (error, query) => {
      logger.error(`Query cache error for ${query.queryKey}:`, error);
    },
    onSuccess: (data, query) => {
      // Log successful cache hits for monitoring
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`Cache hit for ${query.queryKey}`);
      }
    },
  }),

  // ⭐ PERFORMANCE: Mutation cache configuration
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      logger.error(`Mutation cache error:`, error);
    },
  }),
});

// ⭐ PERFORMANCE: Export cache configurations for specific use cases
export { CACHE_CONFIG };

// Query keys for consistent cache management
export const queryKeys = {
  // Authentication
  auth: ['auth'],
  user: (userId) => ['user', userId],
  
  // Members
  members: ['members'],
  member: (id) => ['member', id],
  memberProfile: (id) => ['memberProfile', id],
  memberMembership: (id) => ['memberMembership', id],
  
  // Memberships
  memberships: ['memberships'],
  membershipTypes: ['membershipTypes'],
  membershipPlans: ['membershipPlans'],
  
  // Family Management
  familyMembers: (primaryId) => ['familyMembers', primaryId],
  
  // Attendance
  attendance: ['attendance'],
  memberAttendance: (memberId) => ['attendance', memberId],
  todayAttendance: ['attendance', 'today'],
  
  // Classes
  classes: ['classes'],
  class: (id) => ['class', id],
  upcomingClasses: ['classes', 'upcoming'],
  memberClasses: (memberId) => ['classes', 'member', memberId],
  classBookings: ['classBookings'],
  memberBookings: (memberId) => ['classBookings', 'member', memberId],

  // Scheduling & Resources
  trainers: ['trainers'],
  trainer: (id) => ['trainer', id],
  trainerAvailability: (id) => ['trainer', id, 'availability'],
  rooms: ['rooms'],
  room: (id) => ['room', id],
  roomBookings: ['roomBookings'],
  equipment: ['equipment'],
  scheduleConflicts: ['scheduleConflicts'],
  substitutions: ['substitutions'],
  classSchedule: ['classSchedule'],
  
  // Billing
  billing: ['billing'],
  memberBilling: (memberId) => ['billing', memberId],
  
  // Staff Dashboard
  staffStats: ['staffStats'],
  memberCount: ['memberCount'],
  
  // Add-ons
  addons: ['addons'],
  memberAddons: (memberId) => ['addons', memberId],
};

// Utility functions for cache management
export const cacheUtils = {
  // Invalidate all member-related queries
  invalidateMembers: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.members });
    queryClient.invalidateQueries({ queryKey: ['member'] });
    queryClient.invalidateQueries({ queryKey: ['memberProfile'] });
  },
  
  // Invalidate attendance queries
  invalidateAttendance: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.attendance });
  },
  
  // Invalidate membership queries
  invalidateMemberships: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.memberships });
    queryClient.invalidateQueries({ queryKey: queryKeys.membershipTypes });
  },
  
  // Invalidate all staff dashboard data
  invalidateStaffData: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.staffStats });
    queryClient.invalidateQueries({ queryKey: queryKeys.memberCount });
    queryClient.invalidateQueries({ queryKey: queryKeys.todayAttendance });
  },
  
  // Clear all cache (use sparingly)
  clearAll: () => {
    queryClient.clear();
  },
  
  // Prefetch common data
  prefetchCommonData: async () => {
    // Prefetch membership types (rarely change)
    await queryClient.prefetchQuery({
      queryKey: queryKeys.membershipTypes,
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  },
};

export default queryClient;
