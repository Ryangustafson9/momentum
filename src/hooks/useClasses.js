// ⭐ React Query hooks for class operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';
import { showToast } from '@/utils/toastUtils';

// Query keys for consistent caching
export const classKeys = {
  all: ['classes'],
  lists: () => [...classKeys.all, 'list'],
  list: (filters) => [...classKeys.lists(), { filters }],
  details: () => [...classKeys.all, 'detail'],
  detail: (id) => [...classKeys.details(), id],
};

/**
 * Hook to fetch all classes with optional filtering
 */
export function useClasses(filters = {}) {
  return useQuery({
    queryKey: classKeys.list(filters),
    queryFn: () => apiService.getClasses(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      console.error('Error fetching classes:', error);
      showToast.error('Failed to load classes', error.message);
    },
  });
}

/**
 * Hook to fetch a single class by ID
 */
export function useClass(id) {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: () => apiService.getClassById(id),
    enabled: !!id, // Only run if ID is provided
    staleTime: 3 * 60 * 1000,
    onError: (error) => {
      console.error('Error fetching class:', error);
      showToast.error('Failed to load class', error.message);
    },
  });
}

/**
 * Hook to create a new class
 */
export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classData) => apiService.createClass(classData),
    onSuccess: (newClass) => {
      // Invalidate and refetch classes list
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      showToast.success('Class created successfully');
    },
    onError: (error) => {
      console.error('Error creating class:', error);
      showToast.error('Failed to create class', error.message);
    },
  });
}

/**
 * Hook to update a class
 */
export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => apiService.updateClass(id, data),
    onSuccess: (updatedClass, { id }) => {
      // Update the specific class in cache
      queryClient.setQueryData(classKeys.detail(id), updatedClass);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      showToast.success('Class updated successfully');
    },
    onError: (error) => {
      console.error('Error updating class:', error);
      showToast.error('Failed to update class', error.message);
    },
  });
}

/**
 * Hook to delete a class
 */
export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => apiService.deleteClass(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: classKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      showToast.success('Class deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting class:', error);
      showToast.error('Failed to delete class', error.message);
    },
  });
}
