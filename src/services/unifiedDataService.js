// 🚀 UNIFIED DATA SERVICE - Centralized data operations for React Query
import { supabase } from '@/lib/supabaseClient';
import { validateUserRole, normalizeRole } from '@/utils/accessControl';

// ⭐ ERROR HANDLING UTILITY
const handleSupabaseError = (error, operation) => {
  
  throw new Error(error.message || `Failed to ${operation.toLowerCase()}`);
};

// ⭐ DATA TRANSFORMATION UTILITIES
const transformMemberData = (member) => ({
  ...member,
  name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email?.split('@')[0] || 'Member',
  role: normalizeRole(member.role),
  status: member.status || 'active',
});

const transformClassData = (classData) => ({
  ...classData,
  instructor_name: classData.instructor 
    ? `${classData.instructor.first_name || ''} ${classData.instructor.last_name || ''}`.trim()
    : 'TBD',
  available_spots: Math.max(0, (classData.capacity || 0) - (classData.enrolled_count || 0)),
  is_full: (classData.enrolled_count || 0) >= (classData.capacity || 0),
});

// ⭐ MEMBER SERVICE
export const memberService = {
  // Get all members with optional filtering
  async getMembers(filters = {}) {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          memberships (
            id,
            status,
            start_date,
            end_date,
            membership_type:membership_types!current_membership_type_id (
              id,
              name,
              price,
              category
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) handleSupabaseError(error, 'Get members');
      
      return (data || []).map(transformMemberData);
    } catch (error) {
      handleSupabaseError(error, 'Get members');
    }
  },

  // Get member count
  async getMemberCount() {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'nonmember');
      
      if (error) handleSupabaseError(error, 'Get member count');
      return count || 0;
    } catch (error) {
      handleSupabaseError(error, 'Get member count');
    }
  },

  // Get member profile
  async getMemberProfile(memberId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          memberships (
            *,
            membership_type:membership_types!current_membership_type_id (*)
          ),
          addon_memberships (
            *,
            addon_type:membership_types!addon_type_id (*)
          )
        `)
        .eq('id', memberId)
        .single();

      if (error) handleSupabaseError(error, 'Get member profile');
      return transformMemberData(data);
    } catch (error) {
      handleSupabaseError(error, 'Get member profile');
    }
  },

  // Update member
  async updateMember(memberId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Update member');
      return transformMemberData(data);
    } catch (error) {
      handleSupabaseError(error, 'Update member');
    }
  },

  // Get member stats
  async getMemberStats() {
    try {
      const [totalResult, activeResult, newResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        new_this_month: newResult.count || 0,
        growth_rate: totalResult.count > 0 ? ((newResult.count || 0) / totalResult.count * 100).toFixed(1) : 0
      };
    } catch (error) {
      handleSupabaseError(error, 'Get member stats');
    }
  },

  // Check in member
  async checkInMember(memberId) {
    try {
      const { data, error } = await supabase
        .from('checkin_history')
        .insert({
          member_id: memberId,
          check_in_time: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Check in member');
      return data;
    } catch (error) {
      handleSupabaseError(error, 'Check in member');
    }
  },
};

// ⭐ CLASS SERVICE
export const classService = {
  // Get all classes
  async getClasses(filters = {}) {
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
          instructor:instructor_id (
            id,
            first_name,
            last_name,
            email
          ),
          bookings:class_bookings (
            id,
            member_id
          )
        `)
        .order('start_time', { ascending: true });

      // Apply filters
      if (filters.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());
      }

      if (filters.instructor_id) {
        query = query.eq('instructor_id', filters.instructor_id);
      }

      const { data, error } = await query;
      if (error) handleSupabaseError(error, 'Get classes');
      
      return (data || []).map(classData => ({
        ...transformClassData(classData),
        enrolled_count: classData.bookings?.length || 0
      }));
    } catch (error) {
      handleSupabaseError(error, 'Get classes');
    }
  },

  // Get class schedule for date range
  async getClassSchedule(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          instructor:instructor_id (first_name, last_name),
          bookings:class_bookings (id)
        `)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true });

      if (error) handleSupabaseError(error, 'Get class schedule');
      
      return (data || []).map(classData => ({
        ...transformClassData(classData),
        enrolled_count: classData.bookings?.length || 0
      }));
    } catch (error) {
      handleSupabaseError(error, 'Get class schedule');
    }
  },

  // Book a class
  async bookClass(classId, memberId) {
    try {
      const { data, error } = await supabase
        .from('class_bookings')
        .insert({
          class_id: classId,
          member_id: memberId,
          booking_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Book class');
      return data;
    } catch (error) {
      handleSupabaseError(error, 'Book class');
    }
  },

  // Cancel class booking
  async cancelBooking(classId, memberId) {
    try {
      const { error } = await supabase
        .from('class_bookings')
        .delete()
        .eq('class_id', classId)
        .eq('member_id', memberId);

      if (error) handleSupabaseError(error, 'Cancel booking');
      return true;
    } catch (error) {
      handleSupabaseError(error, 'Cancel booking');
    }
  },

  // Get instructors
  async getInstructors() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['instructor', 'staff', 'admin'])
        .order('first_name', { ascending: true });

      if (error) handleSupabaseError(error, 'Get instructors');
      return (data || []).map(transformMemberData);
    } catch (error) {
      handleSupabaseError(error, 'Get instructors');
    }
  },
};

// ⭐ MEMBERSHIP SERVICE
export const membershipService = {
  // Get membership types
  async getMembershipTypes(filters = {}) {
    try {
      let query = supabase
        .from('membership_types')
        .select('*')
        .order('category', { ascending: true })
        .order('price', { ascending: true });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.available_online !== undefined) {
        query = query.eq('available_online', filters.available_online);
      }

      const { data, error } = await query;
      if (error) handleSupabaseError(error, 'Get membership types');
      
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'Get membership types');
    }
  },

  // Get online available memberships
  async getOnlineAvailableMemberships() {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .eq('available_online', true)
        .eq('available_for_sale', true)
        .order('price', { ascending: true });

      if (error) handleSupabaseError(error, 'Get online available memberships');
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'Get online available memberships');
    }
  },
};

// ⭐ DASHBOARD SERVICE
export const dashboardService = {
  // Get dashboard stats
  async getDashboardStats() {
    try {
      const [memberStats, classStats, todayCheckIns] = await Promise.all([
        memberService.getMemberStats(),
        this.getClassStats(),
        this.getTodayCheckIns()
      ]);

      return {
        members: memberStats,
        classes: classStats,
        checkIns: todayCheckIns,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      handleSupabaseError(error, 'Get dashboard stats');
    }
  },

  // Get class stats
  async getClassStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [totalResult, todayResult] = await Promise.all([
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }).gte('start_time', today)
      ]);

      return {
        total: totalResult.count || 0,
        today: todayResult.count || 0
      };
    } catch (error) {
      handleSupabaseError(error, 'Get class stats');
    }
  },

  // Get today's check-ins
  async getTodayCheckIns() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          member:profiles!member_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('date', today)
        .order('check_in_time', { ascending: false });

      if (error) handleSupabaseError(error, 'Get today check-ins');
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'Get today check-ins');
    }
  },

  // Get recent activity
  async getRecentActivity(limit = 10) {
    try {
      const [recentMembers, recentCheckIns, recentBookings] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('attendance').select('*, member:profiles!member_id(first_name, last_name)').order('check_in_time', { ascending: false }).limit(5),
        supabase.from('class_bookings').select('*, class:classes!class_id(name), member:profiles!member_id(first_name, last_name)').order('booking_time', { ascending: false }).limit(3)
      ]);

      const activities = [];

      // Add recent members
      recentMembers.data?.forEach(member => {
        activities.push({
          type: 'member_joined',
          title: 'New Member',
          description: `${member.first_name} ${member.last_name} joined`,
          timestamp: member.created_at,
          icon: 'user-plus'
        });
      });

      // Add recent check-ins
      recentCheckIns.data?.forEach(checkIn => {
        activities.push({
          type: 'check_in',
          title: 'Member Check-in',
          description: `${checkIn.member?.first_name} ${checkIn.member?.last_name} checked in`,
          timestamp: checkIn.check_in_time,
          icon: 'log-in'
        });
      });

      // Add recent bookings
      recentBookings.data?.forEach(booking => {
        activities.push({
          type: 'class_booking',
          title: 'Class Booking',
          description: `${booking.member?.first_name} ${booking.member?.last_name} booked ${booking.class?.name}`,
          timestamp: booking.booking_time,
          icon: 'calendar'
        });
      });

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      handleSupabaseError(error, 'Get recent activity');
    }
  },
};

// ⭐ SETTINGS SERVICE
export const settingsService = {
  // Get general settings
  async getGeneralSettings() {
    try {
      const { data, error } = await supabase
        .from('general_settings')
        .select('*')
        .single();

      if (error) handleSupabaseError(error, 'Get general settings');
      return data || {};
    } catch (error) {
      handleSupabaseError(error, 'Get general settings');
    }
  },

  // Update general settings
  async updateGeneralSettings(updates) {
    try {
      const { data, error } = await supabase
        .from('general_settings')
        .update(updates)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Update general settings');
      return data;
    } catch (error) {
      handleSupabaseError(error, 'Update general settings');
    }
  },
};

// ⭐ UNIFIED DATA SERVICE EXPORT
export const unifiedDataService = {
  members: memberService,
  classes: classService,
  memberships: membershipService,
  dashboard: dashboardService,
  settings: settingsService,
};

export default unifiedDataService;

