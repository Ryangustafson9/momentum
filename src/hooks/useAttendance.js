// 🚀 ATTENDANCE DATA HOOKS - React Query integration for attendance management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, cacheUtils } from '@/lib/queryClient';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Attendance service functions
const attendanceService = {
  // Get today's check-ins
  async getTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        member:profiles!member_id(first_name, last_name, email)
      `)
      .gte('check_in_time', today)
      .order('check_in_time', { ascending: false })
      .limit(50);

    if (error) throw new Error(`Failed to fetch today's attendance: ${error.message}`);
    return data || [];
  },

  // Get member's attendance history
  async getMemberAttendance(memberId, limit = 50) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', memberId)
      .order('check_in_time', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch member attendance: ${error.message}`);
    return data || [];
  },

  // Get attendance stats
  async getAttendanceStats() {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const [todayResult, weekResult] = await Promise.allSettled([
      supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .gte('check_in_time', today),
      supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .gte('check_in_time', thisWeek.toISOString())
    ]);

    return {
      today: todayResult.status === 'fulfilled' ? todayResult.value.count || 0 : 0,
      thisWeek: weekResult.status === 'fulfilled' ? weekResult.value.count || 0 : 0,
    };
  },
};

// Get today's attendance
export const useTodayAttendance = () => {
  return useQuery({
    queryKey: queryKeys.todayAttendance,
    queryFn: attendanceService.getTodayAttendance,
    staleTime: 30 * 1000, // 30 seconds for real-time feel
    cacheTime: 2 * 60 * 1000, // 2 minutes cache
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// Get member's attendance history
export const useMemberAttendance = (memberId, limit = 50) => {
  return useQuery({
    queryKey: queryKeys.memberAttendance(memberId),
    queryFn: () => attendanceService.getMemberAttendance(memberId, limit),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get attendance statistics
export const useAttendanceStats = () => {
  return useQuery({
    queryKey: [...queryKeys.attendance, 'stats'],
    queryFn: attendanceService.getAttendanceStats,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

export default {
  useTodayAttendance,
  useMemberAttendance,
  useAttendanceStats,
};
