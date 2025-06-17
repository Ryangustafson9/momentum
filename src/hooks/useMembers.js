// 🚀 MEMBER DATA HOOKS - React Query integration for member management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheUtils } from '@/lib/queryClient';
import { memberService } from '@/services/memberService';
import { useToast } from '@/hooks/use-toast';

// Get all members with filtering
export const useMembers = (filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.members, filters],
    queryFn: () => memberService.getMembers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for member lists
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

// Get member count for dashboard
export const useMemberCount = () => {
  return useQuery({
    queryKey: queryKeys.memberCount,
    queryFn: memberService.getMemberCount,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

// Get single member profile
export const useMemberProfile = (memberId) => {
  return useQuery({
    queryKey: queryKeys.memberProfile(memberId),
    queryFn: () => memberService.getMemberProfile(memberId),
    enabled: !!memberId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Get member's membership details
export const useMemberMembership = (memberId) => {
  return useQuery({
    queryKey: queryKeys.memberMembership(memberId),
    queryFn: () => memberService.getMemberMembership(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get member's add-ons
export const useMemberAddons = (memberId) => {
  return useQuery({
    queryKey: queryKeys.memberAddons(memberId),
    queryFn: () => memberService.getMemberAddons(memberId),
    enabled: !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get family members
export const useFamilyMembers = (primaryMemberId) => {
  return useQuery({
    queryKey: queryKeys.familyMembers(primaryMemberId),
    queryFn: () => memberService.getFamilyMembers(primaryMemberId),
    enabled: !!primaryMemberId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Mutation hooks for member operations
export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ memberId, updates }) => memberService.updateMember(memberId, updates),
    onSuccess: (data, { memberId }) => {
      // Update the specific member in cache
      queryClient.setQueryData(queryKeys.memberProfile(memberId), data);
      
      // Invalidate member lists to refresh
      cacheUtils.invalidateMembers();
      
      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    },
    onError: (error) => {
      console.error('Update member error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update member",
        variant: "destructive",
      });
    },
  });
};

// Check in member mutation
export const useCheckInMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ memberId, memberName }) => memberService.checkInMember(memberId, memberName),
    onSuccess: (data, { memberName }) => {
      // Invalidate attendance queries
      cacheUtils.invalidateAttendance();
      
      // Invalidate staff stats
      cacheUtils.invalidateStaffData();
      
      toast({
        title: "Check-in Successful",
        description: `${memberName} has been checked in`,
      });
    },
    onError: (error) => {
      console.error('Check-in error:', error);
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in member",
        variant: "destructive",
      });
    },
  });
};

// Check out member mutation
export const useCheckOutMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (attendanceId) => memberService.checkOutMember(attendanceId),
    onSuccess: () => {
      // Invalidate attendance queries
      cacheUtils.invalidateAttendance();
      
      toast({
        title: "Check-out Successful",
        description: "Member has been checked out",
      });
    },
    onError: (error) => {
      console.error('Check-out error:', error);
      toast({
        title: "Check-out Failed",
        description: error.message || "Failed to check out member",
        variant: "destructive",
      });
    },
  });
};

// Optimistic update for member status changes
export const useUpdateMemberStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ memberId, status }) => {
      // This would update membership status in the memberships table
      // For now, we'll simulate the API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ memberId, status }), 500);
      });
    },
    onMutate: async ({ memberId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.memberProfile(memberId) });

      // Snapshot previous value
      const previousMember = queryClient.getQueryData(queryKeys.memberProfile(memberId));

      // Optimistically update
      queryClient.setQueryData(queryKeys.memberProfile(memberId), (old) => ({
        ...old,
        memberships: old?.memberships?.map(m => ({ ...m, status })) || []
      }));

      return { previousMember };
    },
    onError: (error, { memberId }, context) => {
      // Rollback on error
      if (context?.previousMember) {
        queryClient.setQueryData(queryKeys.memberProfile(memberId), context.previousMember);
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to update member status",
        variant: "destructive",
      });
    },
    onSuccess: (data, { status }) => {
      toast({
        title: "Status Updated",
        description: `Membership status updated to ${status}`,
      });
    },
    onSettled: (data, error, { memberId }) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.memberProfile(memberId) });
    },
  });
};

// Prefetch member data for better UX
export const usePrefetchMember = () => {
  const queryClient = useQueryClient();

  return (memberId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.memberProfile(memberId),
      queryFn: () => memberService.getMemberProfile(memberId),
      staleTime: 3 * 60 * 1000,
    });
  };
};

export default {
  useMembers,
  useMemberCount,
  useMemberProfile,
  useMemberMembership,
  useMemberAddons,
  useFamilyMembers,
  useUpdateMember,
  useCheckInMember,
  useCheckOutMember,
  useUpdateMemberStatus,
  usePrefetchMember,
};
