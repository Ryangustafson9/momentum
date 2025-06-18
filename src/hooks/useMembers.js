// ⭐ NEW: React Query hook for members data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';
import { showToast } from '@/utils/toastUtils';

// Query keys for consistent caching
export const memberKeys = {
  all: ['members'],
  lists: () => [...memberKeys.all, 'list'],
  list: (filters) => [...memberKeys.lists(), { filters }],
  details: () => [...memberKeys.all, 'detail'],
  detail: (id) => [...memberKeys.details(), id],
  stats: () => [...memberKeys.all, 'stats'],
};

/**
 * Hook to fetch all members with optional filtering
 */
export function useMembers(filters = {}) {
  return useQuery({
    queryKey: memberKeys.list(filters),
    queryFn: () => apiService.getMembers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      console.error('Error fetching members:', error);
      showToast.error('Failed to load members', error.message);
    },
  });
}

/**
 * Hook to fetch a single member by ID
 */
export function useMember(id) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => apiService.getMemberById(id),
    enabled: !!id, // Only run if ID is provided
    staleTime: 5 * 60 * 1000,
    onError: (error) => {
      console.error('Error fetching member:', error);
      showToast.error('Failed to load member', error.message);
    },
  });
}

/**
 * Hook to fetch member statistics
 */
export function useMemberStats() {
  return useQuery({
    queryKey: memberKeys.stats(),
    queryFn: () => apiService.getMemberStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes for stats
    cacheTime: 5 * 60 * 1000,
    onError: (error) => {
      console.error('Error fetching member stats:', error);
      showToast.error('Failed to load member statistics', error.message);
    },
  });
}

/**
 * Hook to create a new member
 */
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberData) => apiService.createMember(memberData),
    onSuccess: (newMember) => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      showToast.success('Member created successfully');
    },
    onError: (error) => {
      console.error('Error creating member:', error);
      showToast.error('Failed to create member', error.message);
    },
  });
}

/**
 * Hook to update a member
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => apiService.updateMember(id, data),
    onSuccess: (updatedMember, { id }) => {
      // Update the specific member in cache
      queryClient.setQueryData(memberKeys.detail(id), updatedMember);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      showToast.success('Member updated successfully');
    },
    onError: (error) => {
      console.error('Error updating member:', error);
      showToast.error('Failed to update member', error.message);
    },
  });
}

/**
 * Hook to delete/archive a member
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => apiService.deleteMember(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: memberKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      showToast.success('Member archived successfully');
    },
    onError: (error) => {
      console.error('Error archiving member:', error);
      showToast.error('Failed to archive member', error.message);
    },
  });
}
