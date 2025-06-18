import { supabase } from '@/lib/supabaseClient';
import { executeNormal, executeFast, getUserFriendlyErrorMessage } from '@/utils/requestUtils';

/**
 * Centralized API service for all database operations
 */
class ApiService {
  
  // ===== MEMBER OPERATIONS =====
  
  /**
   * Get members with optional filtering
   * @param {Object} filters - Optional filters
   * @param {string} filters.role - Filter by role (e.g., 'member', 'staff', 'admin')
   * @param {string} filters.status - Filter by status (e.g., 'active', 'inactive')
   * @param {string} filters.search - Search by name or email
   * @param {number} filters.limit - Limit results
   * @returns {Promise<Array>} Array of member profiles
   */
  async getMembers(filters = {}) {
    try {
      console.log('🔍 ApiService: Getting members with filters:', filters);
      
      let query = supabase
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
          avatar_url,
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
        query = query.or(`
          first_name.ilike.%${filters.search}%,
          last_name.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%
        `);
      }
      
      // Default ordering
      query = query.order('created_at', { ascending: false });
      
      // Apply limit if specified
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ ApiService: Error getting members:', error);
        throw error;
      }
      
      console.log(`✅ ApiService: Retrieved ${data?.length || 0} members`);
      return data || [];
      
    } catch (error) {
      console.error('❌ ApiService: getMembers failed:', error);
      throw error;
    }
  }

  /**
   * Get member statistics
   * @returns {Promise<Object>} Member statistics
   */
  async getMemberStats() {
    try {
      console.log('📊 ApiService: Getting member statistics...');
      
      // Get total members count
      const { count: totalMembers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member');
      
      if (totalError) throw totalError;
      
      // Get active members count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeMembers, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .eq('status', 'active')
        .gte('last_check_in', thirtyDaysAgo.toISOString());
      
      if (activeError) throw activeError;
      
      // Get new members this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: newMembersThisMonth, error: newError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .gte('created_at', startOfMonth.toISOString());
      
      if (newError) throw newError;
      
      const stats = {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        newMembersThisMonth: newMembersThisMonth || 0,
        membershipRenewalRate: '92%', // TODO: Calculate from actual data
        lastUpdated: new Date().toISOString()
      };
      
      console.log('✅ ApiService: Member stats retrieved:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ ApiService: getMemberStats failed:', error);
      // Return default stats on error
      return {
        totalMembers: 0,
        activeMembers: 0,
        newMembersThisMonth: 0,
        membershipRenewalRate: '0%',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get a single member by ID
   * @param {string} memberId - Member ID
   * @returns {Promise<Object>} Member profile
   */
  async getMember(memberId) {
    try {
      console.log('🔍 ApiService: Getting member:', memberId);

      // ⚡ TIMEOUT FIX: Use fast execution for single record lookup
      const result = await executeFast(
        () => supabase
          .from('profiles')
          .select('*')
          .eq('id', memberId)
          .single(),
        'Get member by ID'
      );

      console.log('✅ ApiService: Member retrieved:', result.data?.email);
      return result.data;

    } catch (error) {
      console.error('❌ ApiService: getMember failed:', getUserFriendlyErrorMessage(error));
      throw error;
    }
  }

  /**
   * Update member information
   * @param {string} memberId - Member ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated member profile
   */
  async updateMember(memberId, updates) {
    try {
      console.log('✏️ ApiService: Updating member:', memberId, updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ ApiService: Member updated:', data?.email);
      return data;
      
    } catch (error) {
      console.error('❌ ApiService: updateMember failed:', error);
      throw error;
    }
  }

  /**
   * Delete/deactivate a member
   * @param {string} memberId - Member ID
   * @param {boolean} softDelete - If true, just mark as inactive
   * @returns {Promise<boolean>} Success status
   */
  async deleteMember(memberId, softDelete = true) {
    try {
      console.log('🗑️ ApiService: Deleting member:', memberId, { softDelete });
      
      if (softDelete) {
        // Soft delete - just mark as inactive
        await this.updateMember(memberId, { 
          status: 'inactive',
          membership_status: 'cancelled'
        });
      } else {
        // Hard delete
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', memberId);
        
        if (error) throw error;
      }
      
      console.log('✅ ApiService: Member deleted');
      return true;
      
    } catch (error) {
      console.error('❌ ApiService: deleteMember failed:', error);
      throw error;
    }
  }

  // ===== MEMBERSHIP TYPES =====

  /**
   * Get all membership types
   * @returns {Promise<Array>} Array of membership types
   */
  async getMembershipTypes() {
    try {
      console.log('🔍 ApiService: Getting membership types...');

      const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      console.log('✅ ApiService: Membership types retrieved:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ ApiService: getMembershipTypes failed:', error);
      return [];
    }
  }

  /**
   * Get membership type by ID
   * @param {string} id - Membership type ID
   * @returns {Promise<Object|null>} Membership type or null
   */
  async getMembershipTypeById(id) {
    try {
      const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ ApiService: getMembershipTypeById failed:', error);
      return null;
    }
  }

  // ===== CLASSES =====

  /**
   * Get all classes
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of classes
   */
  async getClasses(filters = {}) {
    try {
      console.log('🔍 ApiService: Getting classes with filters:', filters);

      let query = supabase
        .from('classes')
        .select('*')
        .order('start_time', { ascending: true });

      // Apply filters if provided
      if (filters.instructor_id) {
        query = query.eq('instructor_id', filters.instructor_id);
      }

      if (filters.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('✅ ApiService: Classes retrieved:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ ApiService: getClasses failed:', error);
      return [];
    }
  }

  // ===== STAFF ROLES =====

  /**
   * Get all staff roles
   * @returns {Promise<Array>} Array of staff roles
   */
  async getStaffRoles() {
    try {
      console.log('🔍 ApiService: Getting staff roles...');

      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      console.log('✅ ApiService: Staff roles retrieved:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ ApiService: getStaffRoles failed:', error);
      return [];
    }
  }

  /**
   * Get all permissions (mock data for now)
   * @returns {Array} Array of permissions
   */
  getAllPermissions() {
    // TODO: Replace with actual permissions from database
    return [
      'manage_members',
      'manage_classes',
      'manage_billing',
      'view_reports',
      'manage_settings',
      'manage_staff'
    ];
  }

  // ===== INSTRUCTORS =====

  /**
   * Get all instructors
   * @returns {Promise<Array>} Array of instructors
   */
  async getInstructors() {
    try {
      console.log('🔍 ApiService: Getting instructors...');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('role', ['staff', 'admin', 'instructor'])
        .order('first_name', { ascending: true });

      if (error) throw error;

      console.log('✅ ApiService: Instructors retrieved:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ ApiService: getInstructors failed:', error);
      return [];
    }
  }

  // ===== SETTINGS =====

  /**
   * Get general settings
   * @returns {Promise<Object>} Settings object
   */
  async getSettings() {
    try {
      const { data, error } = await supabase
        .from('general_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data || {};
    } catch (error) {
      console.error('❌ ApiService: getSettings failed:', error);
      return {};
    }
  }

  // ===== DASHBOARD QUICK METHODS =====

  /**
   * Get quick member count for dashboard
   * @returns {Promise<number>} Total member count
   */
  async getMemberCount() {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ ApiService: getMemberCount failed:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// ⚠️ TEMPORARY: Compatibility layer for legacy dataService calls
// TODO: Remove after migrating all components to React Query
export const dataService = {
  // Member methods
  getMembers: () => apiService.getMembers(),
  getMemberById: (id) => apiService.getMemberById(id),

  // Membership type methods
  getMembershipTypes: () => apiService.getMembershipTypes(),
  getMembershipTypeById: (id) => apiService.getMembershipTypeById(id),

  // Class methods
  getClasses: () => apiService.getClasses(),

  // Staff role methods
  getStaffRoles: () => apiService.getStaffRoles(),
  getAllPermissions: () => apiService.getAllPermissions(),

  // Instructor methods
  getInstructors: () => apiService.getInstructors(),

  // Settings methods
  getSettings: () => apiService.getSettings(),
};

export default apiService;