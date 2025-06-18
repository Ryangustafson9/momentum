// ⭐ SIMPLE: Basic React Query wrapper to replace manual caching
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';
import { showToast } from '@/utils/toastUtils';

/**
 * Simple wrapper for common API queries
 * Replaces the complex manual caching system
 */
export function useApiQuery(key, apiCall, options = {}) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: apiCall,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    onError: (error) => {
      console.error(`Error fetching ${key}:`, error);
      if (options.showErrorToast !== false) {
        showToast.error('Data fetch failed', error.message);
      }
    },
    ...options,
  });
}

// Common query hooks
export const useMembers = (filters = {}) => 
  useApiQuery(['members', filters], () => apiService.getMembers(filters));

export const useClasses = (filters = {}) => 
  useApiQuery(['classes', filters], () => apiService.getClasses(filters));

export const useMembershipTypes = () => 
  useApiQuery(['membershipTypes'], () => apiService.getMembershipTypes());

export const useSettings = () => 
  useApiQuery(['settings'], () => apiService.getSettings());
