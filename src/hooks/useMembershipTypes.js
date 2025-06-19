// ⭐ React Query hooks for membership type operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Query keys for consistent caching
export const membershipTypeKeys = {
  all: ['membershipTypes'],
  lists: () => [...membershipTypeKeys.all, 'list'],
  list: (filters) => [...membershipTypeKeys.lists(), { filters }],
  details: () => [...membershipTypeKeys.all, 'detail'],
  detail: (id) => [...membershipTypeKeys.details(), id],
};

/**
 * Hook to fetch all membership types
 */
export function useMembershipTypes(filters = {}) {
  const { toast } = useToast();

  return useQuery({
    queryKey: membershipTypeKeys.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('membership_types')
        .select('*')
        .order('name');

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.available_online !== undefined) {
        query = query.eq('available_online', filters.available_online);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (membership types change rarely)
    cacheTime: 30 * 60 * 1000, // 30 minutes
    onError: (error) => {
      console.error('Error fetching membership types:', error);
      toast({
        title: "Error",
        description: `Failed to load membership types: ${error.message}`,
        variant: "destructive"
      });
    },
  });
}

/**
 * Hook to fetch a single membership type by ID
 */
export function useMembershipType(id) {
  return useQuery({
    queryKey: membershipTypeKeys.detail(id),
    queryFn: () => apiService.getMembershipTypeById(id),
    enabled: !!id, // Only run if ID is provided
    staleTime: 10 * 60 * 1000,
    onError: (error) => {
      console.error('Error fetching membership type:', error);
      showToast.error('Failed to load membership type', error.message);
    },
  });
}

/**
 * Hook to create a new membership type
 */
export function useCreateMembershipType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (typeData) => apiService.createMembershipType(typeData),
    onSuccess: (newType) => {
      // Invalidate and refetch membership types list
      queryClient.invalidateQueries({ queryKey: membershipTypeKeys.lists() });
      showToast.success('Membership type created successfully');
    },
    onError: (error) => {
      console.error('Error creating membership type:', error);
      showToast.error('Failed to create membership type', error.message);
    },
  });
}

/**
 * Hook to update a membership type
 */
export function useUpdateMembershipType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => apiService.updateMembershipType(id, data),
    onSuccess: (updatedType, { id }) => {
      // Update the specific membership type in cache
      queryClient.setQueryData(membershipTypeKeys.detail(id), updatedType);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: membershipTypeKeys.lists() });
      showToast.success('Membership type updated successfully');
    },
    onError: (error) => {
      console.error('Error updating membership type:', error);
      showToast.error('Failed to update membership type', error.message);
    },
  });
}

/**
 * Hook to delete a membership type
 */
export function useDeleteMembershipType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => apiService.deleteMembershipType(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: membershipTypeKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: membershipTypeKeys.lists() });
      showToast.success('Membership type deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting membership type:', error);
      showToast.error('Failed to delete membership type', error.message);
    },
  });
}
