import { supabase } from '@/lib/supabaseClient';

/**
 * Enhanced API service with consistent error handling and response formatting
 */
class ApiService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Generic error handler
   */
  handleError(error, context = '') {
    console.error(`API Error in ${context}:`, error);
    
    // Enhance error with additional context
    const enhancedError = {
      ...error,
      context,
      timestamp: new Date().toISOString(),
    };

    throw enhancedError;
  }

  /**
   * Generic query wrapper with error handling
   */
  async executeQuery(queryFn, context = 'unknown') {
    try {
      const result = await queryFn();
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    } catch (error) {
      this.handleError(error, context);
    }
  }

  // ===== MEMBER SERVICES =====
  
  async getMembers(filters = {}) {
    return this.executeQuery(async () => {
      let query = this.supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          role,
          status,
          created_at,
          updated_at,
          profile_picture_url,
          membership_status,
          membership_type,
          last_check_in
        `);

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      query = query.order('created_at', { ascending: false });

      return await query;
    }, 'getMembers');
  }

  async getMember(memberId) {
    return this.executeQuery(async () => {
      return await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .single();
    }, 'getMember');
  }

  async createMember(memberData) {
    return this.executeQuery(async () => {
      return await this.supabase
        .from('profiles')
        .insert([memberData])
        .select()
        .single();
    }, 'createMember');
  }

  async updateMember(memberId, updates) {
    return this.executeQuery(async () => {
      return await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();
    }, 'updateMember');
  }

  async deleteMember(memberId) {
    return this.executeQuery(async () => {
      return await this.supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);
    }, 'deleteMember');
  }

  async getMemberStats() {
    return this.executeQuery(async () => {
      // Get total members
      const { count: totalMembers } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member');

      // Get active members
      const { count: activeMembers } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .eq('status', 'active');

      // Get new members this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newMembersThisMonth } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .gte('created_at', startOfMonth.toISOString());

      return {
        data: {
          totalMembers: totalMembers || 0,
          activeMembers: activeMembers || 0,
          newMembersThisMonth: newMembersThisMonth || 0,
          membershipRenewalRate: '92%', // TODO: Calculate from actual data
          lastUpdated: new Date().toISOString()
        }
      };
    }, 'getMemberStats');
  }

  // ===== CLASS SERVICES =====
  
  async getClasses(filters = {}) {
    return this.executeQuery(async () => {
      let query = this.supabase
        .from('classes')
        .select(`
          *,
          instructor:profiles!classes_instructor_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `);

      if (filters.instructorId) {
        query = query.eq('instructor_id', filters.instructorId);
      }

      if (filters.date) {
        query = query.gte('start_time', filters.date)
                    .lt('start_time', new Date(new Date(filters.date).getTime() + 24 * 60 * 60 * 1000).toISOString());
      }

      return await query.order('start_time', { ascending: true });
    }, 'getClasses');
  }

  async getClass(classId) {
    return this.executeQuery(async () => {
      return await this.supabase
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
        .eq('id', classId)
        .single();
    }, 'getClass');
  }

  // ===== ATTENDANCE SERVICES =====
  
  async getAttendanceRecords(filters = {}) {
    return this.executeQuery(async () => {
      let query = this.supabase
        .from('attendance')
        .select(`
          *,
          member:profiles!attendance_member_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          class:classes!attendance_class_id_fkey(
            id,
            name,
            start_time
          )
        `);

      if (filters.memberId) {
        query = query.eq('member_id', filters.memberId);
      }

      if (filters.classId) {
        query = query.eq('class_id', filters.classId);
      }

      if (filters.date) {
        query = query.gte('check_in_time', filters.date)
                    .lt('check_in_time', new Date(new Date(filters.date).getTime() + 24 * 60 * 60 * 1000).toISOString());
      }

      return await query.order('check_in_time', { ascending: false });
    }, 'getAttendanceRecords');
  }

  async getTodayCheckInsCount() {
    return this.executeQuery(async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count } = await this.supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', today.toISOString())
        .lt('check_in_time', tomorrow.toISOString());

      return { data: count || 0 };
    }, 'getTodayCheckInsCount');
  }

  // ===== DASHBOARD SERVICES =====
  
  async getDashboardStats() {
    return this.executeQuery(async () => {
      const [memberStats, todayCheckIns] = await Promise.all([
        this.getMemberStats(),
        this.getTodayCheckInsCount(),
      ]);

      return {
        data: {
          ...memberStats,
          todayCheckIns: todayCheckIns,
          lastUpdated: new Date().toISOString()
        }
      };
    }, 'getDashboardStats');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export individual methods for easier importing
export const {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getMemberStats,
  getClasses,
  getClass,
  getAttendanceRecords,
  getTodayCheckInsCount,
  getDashboardStats,
} = apiService;

export default apiService;
