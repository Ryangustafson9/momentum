// 🚀 UNIFIED REACT QUERY HOOKS - Centralized data fetching with intelligent caching
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/queryKeys';
import { unifiedDataService } from '@/services/unifiedDataService';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

// ⭐ MEMBER HOOKS
export const useMembers = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.members.list(filters),
    queryFn: () => unifiedDataService.members.getMembers(filters),
    ...cacheConfig.MODERATE,
    select: (data) => data || [],
    placeholderData: [],
  });
};

export const useMemberCount = () => {
  return useQuery({
    queryKey: queryKeys.members.count(),
    queryFn: unifiedDataService.members.getMemberCount,
    ...cacheConfig.MODERATE,
    select: (data) => data || 0,
  });
};

export const useMemberProfile = (memberId) => {
  return useQuery({
    queryKey: queryKeys.members.profile(memberId),
    queryFn: () => unifiedDataService.members.getMemberProfile(memberId),
    enabled: !!memberId,
    ...cacheConfig.MODERATE,
  });
};

export const useMemberStats = () => {
  return useQuery({
    queryKey: queryKeys.members.stats(),
    queryFn: unifiedDataService.members.getMemberStats,
    ...cacheConfig.MODERATE,
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ memberId, updates }) => unifiedDataService.members.updateMember(memberId, updates),
    onSuccess: (updatedMember) => {
      // Update the member profile cache
      queryClient.setQueryData(
        queryKeys.members.profile(updatedMember.id),
        updatedMember
      );
      
      // Invalidate member lists to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.members.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.stats() });
      
      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update member",
        variant: "destructive",
      });
    },
  });
};

export const useCheckInMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (memberId) => unifiedDataService.members.checkInMember(memberId),
    onSuccess: () => {
      // Invalidate check-in related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.members.checkIns() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      
      toast({
        title: "Success",
        description: "Member checked in successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check in member",
        variant: "destructive",
      });
    },
  });
};

// ⭐ CLASS HOOKS
export const useClasses = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.classes.list(filters),
    queryFn: () => unifiedDataService.classes.getClasses(filters),
    ...cacheConfig.DYNAMIC,
    select: (data) => data || [],
    placeholderData: [],
  });
};

export const useClassSchedule = (startDate, endDate) => {
  return useQuery({
    queryKey: queryKeys.classes.scheduleByDate(`${startDate}-${endDate}`),
    queryFn: () => unifiedDataService.classes.getClassSchedule(startDate, endDate),
    enabled: !!(startDate && endDate),
    ...cacheConfig.DYNAMIC,
    select: (data) => data || [],
  });
};

export const useInstructors = () => {
  return useQuery({
    queryKey: queryKeys.classes.instructors(),
    queryFn: unifiedDataService.classes.getInstructors,
    ...cacheConfig.STABLE,
    select: (data) => data || [],
  });
};

export const useBookClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ classId, memberId }) => unifiedDataService.classes.bookClass(classId, memberId),
    onMutate: async ({ classId, memberId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.classes.all });
      
      const previousClasses = queryClient.getQueryData(queryKeys.classes.list({}));
      
      if (previousClasses) {
        queryClient.setQueryData(queryKeys.classes.list({}), (old) =>
          old.map(cls => 
            cls.id === classId 
              ? { ...cls, enrolled_count: (cls.enrolled_count || 0) + 1 }
              : cls
          )
        );
      }
      
      return { previousClasses };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update
      if (context?.previousClasses) {
        queryClient.setQueryData(queryKeys.classes.list({}), context.previousClasses);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to book class",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Invalidate all class-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      
      toast({
        title: "Success",
        description: "Class booked successfully",
      });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ classId, memberId }) => unifiedDataService.classes.cancelBooking(classId, memberId),
    onMutate: async ({ classId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.classes.all });
      
      const previousClasses = queryClient.getQueryData(queryKeys.classes.list({}));
      
      if (previousClasses) {
        queryClient.setQueryData(queryKeys.classes.list({}), (old) =>
          old.map(cls => 
            cls.id === classId 
              ? { ...cls, enrolled_count: Math.max(0, (cls.enrolled_count || 0) - 1) }
              : cls
          )
        );
      }
      
      return { previousClasses };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update
      if (context?.previousClasses) {
        queryClient.setQueryData(queryKeys.classes.list({}), context.previousClasses);
      }
      
      toast({
        title: "Error",
        description: err.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
    },
  });
};

// ⭐ MEMBERSHIP HOOKS
export const useMembershipTypes = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.memberships.types(),
    queryFn: () => unifiedDataService.memberships.getMembershipTypes(filters),
    ...cacheConfig.STABLE,
    select: (data) => data || [],
  });
};

export const useOnlineAvailableMemberships = () => {
  return useQuery({
    queryKey: queryKeys.memberships.onlineAvailable(),
    queryFn: unifiedDataService.memberships.getOnlineAvailableMemberships,
    ...cacheConfig.STABLE,
    select: (data) => data || [],
  });
};

// ⭐ DASHBOARD HOOKS
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: unifiedDataService.dashboard.getDashboardStats,
    ...cacheConfig.DYNAMIC,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useTodayCheckIns = () => {
  return useQuery({
    queryKey: queryKeys.members.todayCheckIns(),
    queryFn: unifiedDataService.dashboard.getTodayCheckIns,
    ...cacheConfig.REALTIME,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    select: (data) => data || [],
  });
};

export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity(),
    queryFn: () => unifiedDataService.dashboard.getRecentActivity(limit),
    ...cacheConfig.DYNAMIC,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    select: (data) => data || [],
  });
};

// ⭐ SETTINGS HOOKS
export const useGeneralSettings = () => {
  return useQuery({
    queryKey: queryKeys.settings.general(),
    queryFn: unifiedDataService.settings.getGeneralSettings,
    ...cacheConfig.STABLE,
  });
};

export const useUpdateGeneralSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (updates) => unifiedDataService.settings.updateGeneralSettings(updates),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(queryKeys.settings.general(), updatedSettings);
      
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });
};

// ⭐ UTILITY HOOKS
export const usePrefetchQueries = () => {
  const queryClient = useQueryClient();

  const prefetchMembers = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.members.list({}),
      queryFn: () => unifiedDataService.members.getMembers(),
      ...cacheConfig.MODERATE,
    });
  }, [queryClient]);

  const prefetchClasses = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.classes.list({}),
      queryFn: () => unifiedDataService.classes.getClasses(),
      ...cacheConfig.DYNAMIC,
    });
  }, [queryClient]);

  const prefetchDashboard = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      queryFn: unifiedDataService.dashboard.getDashboardStats,
      ...cacheConfig.DYNAMIC,
    });
  }, [queryClient]);

  return {
    prefetchMembers,
    prefetchClasses,
    prefetchDashboard,
  };
};

// ⭐ CACHE MANAGEMENT HOOKS
export const useCacheUtils = () => {
  const queryClient = useQueryClient();

  const invalidateMembers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
  }, [queryClient]);

  const invalidateClasses = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
  }, [queryClient]);

  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  }, [queryClient]);

  const clearAllCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  return {
    invalidateMembers,
    invalidateClasses,
    invalidateDashboard,
    clearAllCache,
  };
};

// ⭐ EXPORT ALL HOOKS
export default {
  // Member hooks
  useMembers,
  useMemberCount,
  useMemberProfile,
  useMemberStats,
  useUpdateMember,
  useCheckInMember,
  
  // Class hooks
  useClasses,
  useClassSchedule,
  useInstructors,
  useBookClass,
  useCancelBooking,
  
  // Membership hooks
  useMembershipTypes,
  useOnlineAvailableMemberships,
  
  // Dashboard hooks
  useDashboardStats,
  useTodayCheckIns,
  useRecentActivity,
  
  // Settings hooks
  useGeneralSettings,
  useUpdateGeneralSettings,
  
  // Utility hooks
  usePrefetchQueries,
  useCacheUtils,
};

