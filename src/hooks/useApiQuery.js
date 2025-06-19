// ⭐ SIMPLE: Basic React Query wrapper to replace manual caching
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

/**
 * Simple wrapper for common API queries
 * Replaces the complex manual caching system
 */
export function useApiQuery(key, apiCall, options = {}) {
  const { toast } = useToast();

  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: apiCall,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    onError: (error) => {
      console.error(`Error fetching ${key}:`, error);
      if (options.showErrorToast !== false) {
        toast({
          title: "Error",
          description: `Data fetch failed: ${error.message}`,
          variant: "destructive"
        });
      }
    },
    ...options,
  });
}

// Common query hooks with direct Supabase calls
export const useMembers = (filters = {}) =>
  useApiQuery(['members', filters], async () => {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });

export const useClasses = (filters = {}) =>
  useApiQuery(['classes', filters], async () => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        instructor:profiles!classes_instructor_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  });

export const useMembershipTypes = () =>
  useApiQuery(['membershipTypes'], async () => {
    const { data, error } = await supabase
      .from('membership_types')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  });

export const useSettings = () =>
  useApiQuery(['settings'], async () => {
    const { data, error } = await supabase
      .from('general_settings')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  });
