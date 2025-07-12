import { supabase } from '@/lib/supabaseClient';
import { validateForm } from '@/utils/profileFormValidation';

/**
 * Comprehensive profile service for all profile-related operations
 * Provides consistent data handling and error management
 */
export class ProfileService {
  
  /**
   * Get a profile by ID with optional related data
   */
  static async getProfile(profileId, options = {}) {
    try {
      const { 
        includeMemberships = false, 
        includeCheckIns = false, 
        includeNotes = false 
      } = options;

      let query = supabase
        .from('profiles')
        .select('*');

      // Add related data based on options
      if (includeMemberships) {
        query = query.select(`
          *,
          memberships(
            id,
            status,
            current_membership_type_id,
            join_date,
            membership_types(name, category, billing_type)
          )
        `);
      }

      const { data, error } = await query
        .eq('id', profileId)
        .single();

      if (error) throw error;

      // Fetch additional data if requested
      if (includeCheckIns && data) {
        const { data: checkIns } = await supabase
          .from('checkin_history')
          .select('*')
          .eq('profile_id', profileId)
          .order('check_in_time', { ascending: false })
          .limit(10);
        
        data.recent_checkins = checkIns || [];
      }

      if (includeNotes && data) {
        const { data: notes } = await supabase
          .from('staff_notes')
          .select('*')
          .eq('member_id', profileId)
          .order('created_at', { ascending: false });
        
        data.staff_notes = notes || [];
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new profile with validation
   */
  static async createProfile(profileData, options = {}) {
    try {
      const { validateData = true, role = 'member' } = options;

      // Validate data if requested
      if (validateData) {
        const validation = validateForm(profileData);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
        }
      }

      // Prepare profile data
      const profileToCreate = {
        ...profileData,
        role: role,
        status: profileData.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Remove display_name if present since it's auto-generated
      delete profileToCreate.display_name;

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileToCreate])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an existing profile
   */
  static async updateProfile(profileId, updates, options = {}) {
    try {
      const { validateData = true, returnUpdated = true } = options;

      // Validate updates if requested
      if (validateData) {
        const validation = validateForm(updates);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`);
        }
      }

      // Prepare update data
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update display name if name fields changed
      if ((updates.first_name || updates.last_name)) {
        const currentProfile = await this.getProfile(profileId);
        if (currentProfile.data) {
          const firstName = updates.first_name || currentProfile.data.first_name;
          const lastName = updates.last_name || currentProfile.data.last_name;
          updateData.display_name = `${firstName} ${lastName}`.trim();
        }
      }

      let query = supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId);

      if (returnUpdated) {
        query = query.select().single();
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a profile (soft delete by setting status to 'deleted')
   */
  static async deleteProfile(profileId, options = {}) {
    try {
      const { hardDelete = false } = options;

      if (hardDelete) {
        // Hard delete - actually remove from database
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profileId);

        if (error) throw error;
      } else {
        // Soft delete - mark as deleted
        const { error } = await supabase
          .from('profiles')
          .update({
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId);

        if (error) throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting profile:', error);
      return { error };
    }
  }

  /**
   * Search profiles with advanced filtering
   */
  static async searchProfiles(searchQuery, options = {}) {
    try {
      const { 
        role = null, 
        status = null, 
        limit = 20, 
        offset = 0,
        includeDeleted = false 
      } = options;

      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          profile_picture_url,
          role,
          status,
          created_at,
          system_member_id
        `);

      // Apply search filters
      if (searchQuery && searchQuery.trim()) {
        query = query.or(`
          first_name.ilike.%${searchQuery}%,
          last_name.ilike.%${searchQuery}%,
          email.ilike.%${searchQuery}%,
          phone.ilike.%${searchQuery}%
        `);
      }

      // Apply role filter
      if (role) {
        query = query.eq('role', role);
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status);
      } else if (!includeDeleted) {
        query = query.neq('status', 'deleted');
      }

      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error searching profiles:', error);
      return { data: [], error };
    }
  }

  /**
   * Get profile statistics
   */
  static async getProfileStats(profileId) {
    try {
      const [checkInsResult, membershipLogResult, notesResult] = await Promise.all([
        // Get check-in count
        supabase
          .from('checkin_history')
          .select('id', { count: 'exact' })
          .eq('profile_id', profileId),
        
        // Get membership changes count
        supabase
          .from('membership_log')
          .select('id', { count: 'exact' })
          .eq('member_id', profileId),
        
        // Get notes count
        supabase
          .from('staff_notes')
          .select('id', { count: 'exact' })
          .eq('member_id', profileId)
      ]);

      const stats = {
        total_checkins: checkInsResult.count || 0,
        membership_changes: membershipLogResult.count || 0,
        staff_notes: notesResult.count || 0
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      return { data: null, error };
    }
  }

  /**
   * Activate a draft profile
   */
  static async activateProfile(profileId, additionalData = {}) {
    try {
      const updateData = {
        ...additionalData,
        status: 'active',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error activating profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Bulk update multiple profiles
   */
  static async bulkUpdateProfiles(updates) {
    try {
      const results = [];
      
      for (const update of updates) {
        const result = await this.updateProfile(update.id, update.data, { returnUpdated: false });
        results.push({ id: update.id, success: !result.error, error: result.error });
      }

      return { data: results, error: null };
    } catch (error) {
      console.error('Error in bulk update:', error);
      return { data: null, error };
    }
  }
}

export default ProfileService;
