// 🚀 REACT QUERY CONFIGURATION
// Centralized data management with caching, error handling, and background refetching
import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      // Refetch when coming back online
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Show error notifications by default
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

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
