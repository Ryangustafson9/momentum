import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/shared/services/queryClient';
import { apiService } from '@/shared/services/api';
import { toast } from '@/hooks/use-toast';

// ===== QUERIES =====

/**
 * Hook to fetch all members with optional filtering
 */
export const useMembers = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.members.list(filters),
    queryFn: () => apiService.getMembers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data || [], // Ensure we always return an array
  });
};

/**
 * Hook to fetch a single member by ID
 */
export const useMember = (memberId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.members.detail(memberId),
    queryFn: () => apiService.getMember(memberId),
    enabled: !!memberId, // Only run if memberId is provided
    ...options,
  });
};

/**
 * Hook to fetch member statistics
 */
export const useMemberStats = () => {
  return useQuery({
    queryKey: queryKeys.members.stats(),
    queryFn: () => apiService.getMemberStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
  });
};

// ===== MUTATIONS =====

/**
 * Hook to create a new member
 */
export const useCreateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberData) => apiService.createMember(memberData),
    onSuccess: (newMember) => {
      // Invalidate and refetch members list
      invalidateQueries.members();
      
      // Optimistically add to cache
      queryClient.setQueryData(queryKeys.members.detail(newMember.id), newMember);
      
      toast({
        title: "Success",
        description: "Member created successfully",
      });
    },
    onError: (error) => {
      console.error('Create member error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create member",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to update a member
 */
export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, updates }) => apiService.updateMember(memberId, updates),
    onMutate: async ({ memberId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.members.detail(memberId) });

      // Snapshot the previous value
      const previousMember = queryClient.getQueryData(queryKeys.members.detail(memberId));

      // Optimistically update to the new value
      if (previousMember) {
        queryClient.setQueryData(queryKeys.members.detail(memberId), {
          ...previousMember,
          ...updates,
        });
      }

      // Return a context object with the snapshotted value
      return { previousMember, memberId };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMember) {
        queryClient.setQueryData(
          queryKeys.members.detail(context.memberId),
          context.previousMember
        );
      }
      
      console.error('Update member error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update member",
        variant: "destructive",
      });
    },
    onSuccess: (updatedMember, { memberId }) => {
      // Update the cache with the server response
      queryClient.setQueryData(queryKeys.members.detail(memberId), updatedMember);
      
      // Invalidate members list to ensure consistency
      invalidateQueries.members();
      
      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    },
  });
};

/**
 * Hook to delete a member
 */
export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId) => apiService.deleteMember(memberId),
    onMutate: async (memberId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.members.detail(memberId) });

      // Snapshot the previous value
      const previousMember = queryClient.getQueryData(queryKeys.members.detail(memberId));

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.members.detail(memberId) });

      return { previousMember, memberId };
    },
    onError: (error, memberId, context) => {
      // If the mutation fails, restore the previous value
      if (context?.previousMember) {
        queryClient.setQueryData(
          queryKeys.members.detail(context.memberId),
          context.previousMember
        );
      }
      
      console.error('Delete member error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete member",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Invalidate members list
      invalidateQueries.members();
      
      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    },
  });
};

// ===== UTILITY HOOKS =====

/**
 * Hook to prefetch a member's data
 */
export const usePrefetchMember = () => {
  const queryClient = useQueryClient();

  return (memberId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.members.detail(memberId),
      queryFn: () => apiService.getMember(memberId),
      staleTime: 5 * 60 * 1000,
    });
  };
};

/**
 * Hook to get cached member data without triggering a fetch
 */
export const useCachedMember = (memberId) => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(queryKeys.members.detail(memberId));
};

/**
 * Hook for infinite loading of members (for large lists)
 */
export const useInfiniteMembers = (filters = {}, pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: queryKeys.members.list({ ...filters, infinite: true }),
    queryFn: ({ pageParam = 0 }) => 
      apiService.getMembers({ 
        ...filters, 
        limit: pageSize, 
        offset: pageParam * pageSize 
      }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < pageSize) return undefined;
      return pages.length;
    },
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      members: data.pages.flat(),
    }),
  });
};
