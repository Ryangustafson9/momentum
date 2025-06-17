import { supabase } from '@/lib/supabaseClient';

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
      
      // Get active members count (just count active status for now)
      const { count: activeMembers, error: activeError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .eq('status', 'active');

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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .single();
      
      if (error) throw error;
      
      console.log('✅ ApiService: Member retrieved:', data?.email);
      return data;
      
    } catch (error) {
      console.error('❌ ApiService: getMember failed:', error);
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
          status: 'inactive'
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
export default apiService;