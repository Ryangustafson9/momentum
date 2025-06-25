import { supabase } from '@/lib/supabaseClient';
import { executeNormal, executeFast, getUserFriendlyErrorMessage, sanitizeError } from '@/utils/requestUtils';

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
          profile_picture_url
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
        throw sanitizeError(error, 'Get members');
      }
      
      
      return data || [];
      
    } catch (error) {
      throw sanitizeError(error, 'Get members');
    }
  }

  /**
   * Get member statistics
   * @returns {Promise<Object>} Member statistics
   */
  async getMemberStats() {
    try {
      
      
      // Get total members count
      const { count: totalMembers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member');
        if (totalError) throw sanitizeError(totalError, 'Get total members count');
      
      // Get active members count (just count active status for now)
      const { count: activeMembers, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .eq('status', 'active');

      if (activeError) throw sanitizeError(activeError, 'Get active members count');
      
      // Get new members this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: newMembersThisMonth, error: newError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .gte('created_at', startOfMonth.toISOString());
      
      if (newError) throw sanitizeError(newError, 'Get new members this month');
      
      const stats = {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        newMembersThisMonth: newMembersThisMonth || 0,
        membershipRenewalRate: '92%', // TODO: Calculate from actual data
        lastUpdated: new Date().toISOString()
      };
      
      
      return stats;
      
    } catch (error) {
      
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
      

      // ⚡ TIMEOUT FIX: Use fast execution for single record lookup
      const result = await executeFast(
        () => supabase
          .from('profiles')
          .select('*')
          .eq('id', memberId)
          .single(),
        'Get member by ID'
      );

        return result.data;

    } catch (error) {
      throw sanitizeError(error, 'Get member by ID');
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
      
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single();
        if (error) throw sanitizeError(error, 'Update member');
      
      
      return data;
      
    } catch (error) {
      throw sanitizeError(error, 'Update member');
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
      
      
      if (softDelete) {
        // Soft delete - just mark as inactive
        await this.updateMember(memberId, {
          status: 'inactive'
        });
      } else {
        // Hard delete
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', memberId);
          if (error) throw sanitizeError(error, 'Delete member (hard delete)');
      }
      
      
      return true;
      
    } catch (error) {
      throw sanitizeError(error, 'Delete member');
    }
  }

  // ===== MEMBERSHIP TYPES =====

  /**
   * Get all membership types
   * @returns {Promise<Array>} Array of membership types
   */
  async getMembershipTypes() {
    try {
          const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw sanitizeError(error, 'Get membership types');

      
      return data || [];
    } catch (error) {
      console.error('Get membership types error:', error);
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
        .single();      if (error) throw sanitizeError(error, 'Get membership type by ID');
      return data;
    } catch (error) {
      console.error('Get membership type by ID error:', error);
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
      }      const { data, error } = await query;

      if (error) throw sanitizeError(error, 'Get classes');

      
      return data || [];
    } catch (error) {
      console.error('Get classes error:', error);
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
          const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw sanitizeError(error, 'Get staff roles');

      
      return data || [];
    } catch (error) {
      console.error('Get staff roles error:', error);
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
          const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone')
        .in('role', ['staff', 'admin', 'instructor'])
        .order('first_name', { ascending: true });

      if (error) throw sanitizeError(error, 'Get instructors');

      
      return data || [];
    } catch (error) {
      console.error('Get instructors error:', error);
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
        .single();      if (error) throw sanitizeError(error, 'Get settings');
      return data || {};
    } catch (error) {
      console.error('Get settings error:', error);
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
        .eq('status', 'active');      if (error) throw sanitizeError(error, 'Get member count');
      return count || 0;
    } catch (error) {
      console.error('Get member count error:', error);
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

