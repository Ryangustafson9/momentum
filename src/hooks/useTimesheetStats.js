import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  differenceInMinutes, 
  parseISO 
} from 'date-fns';

export const useTimesheetStats = () => {
  const [stats, setStats] = useState({
    todayHours: '0:00',
    todayBreakTime: '0:00',
    todayStatus: 'Clocked Out',
    weeklyHours: '0:00',
    weeklyDays: 0,
    weeklyOvertime: '0:00',
    currentShift: null,
    isLoading: true
  });

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      loadStats();
      
      // Refresh stats every minute
      const interval = setInterval(loadStats, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const loadStats = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      // Load today's entries
      const { data: todayEntries, error: todayError } = await supabase
        .from('timeclock_entries')
        .select('*')
        .eq('staff_id', user.id)
        .gte('clock_in_time', startOfDay(today).toISOString())
        .lte('clock_in_time', endOfDay(today).toISOString())
        .order('clock_in_time', { ascending: false });

      if (todayError) throw todayError;

      // Load this week's entries
      const { data: weeklyEntries, error: weeklyError } = await supabase
        .from('timeclock_entries')
        .select('*')
        .eq('staff_id', user.id)
        .gte('clock_in_time', weekStart.toISOString())
        .lte('clock_in_time', weekEnd.toISOString());

      if (weeklyError) throw weeklyError;

      // Calculate today's stats
      const todayStats = calculateDayStats(todayEntries || []);
      
      // Calculate weekly stats
      const weeklyStats = calculateWeeklyStats(weeklyEntries || []);

      // Find current active shift
      const currentShift = (todayEntries || []).find(entry => !entry.clock_out_time);

      setStats({
        ...todayStats,
        ...weeklyStats,
        currentShift,
        isLoading: false
      });

    } catch (error) {
      console.error('Error loading timesheet stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const calculateDayStats = (entries) => {
    let totalMinutes = 0;
    let totalBreakMinutes = 0;
    let status = 'Clocked Out';

    entries.forEach(entry => {
      const clockIn = parseISO(entry.clock_in_time);
      const clockOut = entry.clock_out_time ? parseISO(entry.clock_out_time) : new Date();
      
      // Calculate work time
      let workMinutes = differenceInMinutes(clockOut, clockIn);
      
      // Subtract break time
      if (entry.break_start_time && entry.break_end_time) {
        const breakMinutes = differenceInMinutes(
          parseISO(entry.break_end_time), 
          parseISO(entry.break_start_time)
        );
        workMinutes -= breakMinutes;
        totalBreakMinutes += breakMinutes;
      }
      
      totalMinutes += workMinutes;

      // Determine current status
      if (!entry.clock_out_time) {
        if (entry.break_start_time && !entry.break_end_time) {
          status = 'On Break';
        } else {
          status = 'Clocked In';
        }
      }
    });

    return {
      todayHours: formatMinutes(totalMinutes),
      todayBreakTime: formatMinutes(totalBreakMinutes),
      todayStatus: status
    };
  };

  const calculateWeeklyStats = (entries) => {
    let totalMinutes = 0;
    const workDays = new Set();

    entries.forEach(entry => {
      const clockIn = parseISO(entry.clock_in_time);
      const clockOut = entry.clock_out_time ? parseISO(entry.clock_out_time) : new Date();
      
      // Track unique work days
      workDays.add(clockIn.toDateString());
      
      // Calculate work time
      let workMinutes = differenceInMinutes(clockOut, clockIn);
      
      // Subtract break time
      if (entry.break_start_time && entry.break_end_time) {
        const breakMinutes = differenceInMinutes(
          parseISO(entry.break_end_time), 
          parseISO(entry.break_start_time)
        );
        workMinutes -= breakMinutes;
      }
      
      totalMinutes += workMinutes;
    });

    const totalHours = totalMinutes / 60;
    const overtimeHours = Math.max(0, totalHours - 40); // Assuming 40-hour work week

    return {
      weeklyHours: formatMinutes(totalMinutes),
      weeklyDays: workDays.size,
      weeklyOvertime: formatMinutes(overtimeHours * 60)
    };
  };

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getCurrentShiftDuration = () => {
    if (!stats.currentShift?.clock_in_time) return '0:00';
    
    const start = parseISO(stats.currentShift.clock_in_time);
    const now = new Date();
    const minutes = differenceInMinutes(now, start);
    
    return formatMinutes(minutes);
  };

  return {
    ...stats,
    getCurrentShiftDuration,
    refreshStats: loadStats
  };
};
