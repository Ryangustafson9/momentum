import { supabase } from '@/lib/supabaseClient';

/**
 * Service for managing member profiles and temporary profile creation
 */
export class MemberProfileService {
  
  /**
   * Create a temporary/draft member profile
   */
  static async createTemporaryProfile(profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          first_name: profileData.firstName || '',
          last_name: profileData.lastName || '',
          email: profileData.email || null,
          phone: profileData.phone || null,
          role: 'member',
          status: 'draft', // Mark as draft/incomplete
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) throw error;
      
      
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Get member profile by system_member_id
   */
  static async getProfileBySystemId(systemMemberId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          memberships(
            id,
            status,
            start_date,
            end_date,
            membership_types(
              id,
              name,
              category,
              price,
              billing_cycle
            )
          )
        `)
        .eq('system_member_id', systemMemberId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Update member profile
   */
  static async updateProfile(profileId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .select('*')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Activate/complete a draft profile
   */
  static async activateProfile(profileId, requiredFields = {}) {
    try {
      // Validate required fields
      const missingFields = [];
      if (!requiredFields.email) missingFields.push('email');
      if (!requiredFields.first_name) missingFields.push('first_name');
      if (!requiredFields.last_name) missingFields.push('last_name');

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...requiredFields,
          status: 'active',
          role: 'member',
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .select('*')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Check if profile is complete (has all required fields)
   */
  static isProfileComplete(profile) {
    if (!profile) return false;
    
    const requiredFields = ['first_name', 'last_name', 'email'];
    return requiredFields.every(field => profile[field] && profile[field].trim() !== '');
  }

  /**
   * Get profile completion status
   */
  static getProfileCompletionStatus(profile) {
    if (!profile) return { isComplete: false, missingFields: [], completionPercentage: 0 };

    const allFields = [
      'first_name',
      'last_name', 
      'email',
      'phone',
      'address',
      'date_of_birth',
      'emergency_contact_name',
      'emergency_contact_phone'
    ];

    const requiredFields = ['first_name', 'last_name', 'email'];
    const filledFields = allFields.filter(field => profile[field] && profile[field].toString().trim() !== '');
    const missingRequiredFields = requiredFields.filter(field => !profile[field] || profile[field].toString().trim() === '');

    return {
      isComplete: missingRequiredFields.length === 0,
      missingFields: missingRequiredFields,
      completionPercentage: Math.round((filledFields.length / allFields.length) * 100),
      filledFieldsCount: filledFields.length,
      totalFieldsCount: allFields.length
    };
  }

  /**
   * Parse name from search query
   */
  static parseNameFromQuery(searchQuery) {
    if (!searchQuery || typeof searchQuery !== 'string') {
      return { firstName: '', lastName: '' };
    }

    const nameParts = searchQuery.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return { firstName, lastName };
  }

  /**
   * Create temporary profile from search query
   */
  static async createFromSearchQuery(searchQuery) {
    const { firstName, lastName } = this.parseNameFromQuery(searchQuery);
    
    return await this.createTemporaryProfile({
      firstName,
      lastName
    });
  }

  /**
   * Auto-save profile changes (debounced)
   */
  static async autoSaveProfile(profileId, changes) {
    try {
      // Simple auto-save without validation for draft profiles
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...changes,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .select('*')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      
      return { data: null, error };
    }
  }

  /**
   * Delete draft profile (if needed)
   */
  static async deleteDraftProfile(profileId) {
    try {
      // Only allow deletion of draft profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', profileId)
        .single();

      if (profile?.status !== 'draft') {
        throw new Error('Can only delete draft profiles');
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      
      return { error };
    }
  }
}

export default MemberProfileService;

