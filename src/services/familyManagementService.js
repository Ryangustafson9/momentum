import { supabase } from '@/lib/supabaseClient';

/**
 * Enhanced Family Management Service
 * Supports both shared memberships and sponsored memberships
 */
export class FamilyManagementService {
  
  /**
   * Get all family members for a primary member
   */
  static async getFamilyMembers(primaryMemberId) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          family_member:profiles!family_member_id(*),
          shared_membership:memberships!shared_membership_id(
            *,
            membership_type:membership_types!current_membership_type_id(*)
          ),
          sponsored_membership:memberships!sponsored_membership_id(
            *,
            membership_type:membership_types!current_membership_type_id(*)
          )
        `)
        .eq('primary_member_id', primaryMemberId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching family members:', error);
      return { data: null, error };
    }
  }

  /**
   * Add a new family member with relationship type
   */
  static async addFamilyMember(primaryMemberId, familyMemberData) {
    try {
      // First, find or create the family member profile
      let familyMemberProfile;
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', familyMemberData.email)
        .single();

      if (existingProfile) {
        familyMemberProfile = existingProfile;
        
        // Update existing profile with new information if provided
        if (familyMemberData.firstName || familyMemberData.lastName || familyMemberData.phone) {
          const updateData = {};
          if (familyMemberData.firstName) updateData.first_name = familyMemberData.firstName;
          if (familyMemberData.lastName) updateData.last_name = familyMemberData.lastName;
          if (familyMemberData.phone) updateData.phone = familyMemberData.phone;
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', existingProfile.id);
            
          if (updateError) throw updateError;
        }
      } else {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: familyMemberData.firstName,
            last_name: familyMemberData.lastName,
            email: familyMemberData.email,
            phone: familyMemberData.phone,
            role: 'member',
            status: 'active'
          })
          .select()
          .single();

        if (profileError) throw profileError;
        familyMemberProfile = newProfile;
      }

      // Check if family relationship already exists
      const { data: existingRelation } = await supabase
        .from('family_members')
        .select('*')
        .eq('primary_member_id', primaryMemberId)
        .eq('family_member_id', familyMemberProfile.id)
        .single();

      if (existingRelation) {
        throw new Error('This person is already a family member');
      }

      // Create family member relationship
      const relationshipData = {
        primary_member_id: primaryMemberId,
        family_member_id: familyMemberProfile.id,
        relationship: familyMemberData.relationship,
        relationship_type: familyMemberData.relationshipType || 'shared',
        can_check_in_others: familyMemberData.canCheckInOthers || false,
        can_view_billing: familyMemberData.canViewBilling || false,
        can_manage_family: familyMemberData.canManageFamily || false,
        emergency_contact_priority: familyMemberData.emergencyContactPriority || 0,
        notes: familyMemberData.notes || null,
        status: 'active'
      };

      const { data: newRelation, error: relationError } = await supabase
        .from('family_members')
        .insert(relationshipData)
        .select()
        .single();

      if (relationError) throw relationError;

      return { data: newRelation, error: null };
    } catch (error) {
      console.error('Error adding family member:', error);
      return { data: null, error };
    }
  }

  /**
   * Update family member relationship
   */
  static async updateFamilyMember(familyMemberId, updateData) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update({
          relationship: updateData.relationship,
          relationship_type: updateData.relationshipType,
          can_check_in_others: updateData.canCheckInOthers,
          can_view_billing: updateData.canViewBilling,
          can_manage_family: updateData.canManageFamily,
          emergency_contact_priority: updateData.emergencyContactPriority,
          notes: updateData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyMemberId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating family member:', error);
      return { data: null, error };
    }
  }

  /**
   * Remove family member (soft delete)
   */
  static async removeFamilyMember(familyMemberId) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', familyMemberId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error removing family member:', error);
      return { data: null, error };
    }
  }

  /**
   * Link family member to shared membership
   */
  static async linkToSharedMembership(familyMemberId, membershipId) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update({
          relationship_type: 'shared',
          shared_membership_id: membershipId,
          sponsored_membership_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyMemberId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error linking to shared membership:', error);
      return { data: null, error };
    }
  }

  /**
   * Link family member to sponsored membership
   */
  static async linkToSponsoredMembership(familyMemberId, membershipId) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update({
          relationship_type: 'sponsored',
          sponsored_membership_id: membershipId,
          shared_membership_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyMemberId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error linking to sponsored membership:', error);
      return { data: null, error };
    }
  }

  /**
   * Get family member statistics
   */
  static async getFamilyStats(primaryMemberId) {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('relationship_type, status')
        .eq('primary_member_id', primaryMemberId);

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(m => m.status === 'active').length,
        shared: data.filter(m => m.relationship_type === 'shared' && m.status === 'active').length,
        sponsored: data.filter(m => m.relationship_type === 'sponsored' && m.status === 'active').length,
        inactive: data.filter(m => m.status === 'inactive').length
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting family stats:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user can manage family for a specific member
   */
  static async canManageFamily(userId, primaryMemberId) {
    try {
      // Check if user is the primary member
      if (userId === primaryMemberId) {
        return { canManage: true, reason: 'primary_member' };
      }

      // Check if user is a family member with management permissions
      const { data, error } = await supabase
        .from('family_members')
        .select('can_manage_family')
        .eq('primary_member_id', primaryMemberId)
        .eq('family_member_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.can_manage_family) {
        return { canManage: true, reason: 'family_manager' };
      }

      // Check if user is staff
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (userProfile?.role === 'staff' || userProfile?.role === 'admin') {
        return { canManage: true, reason: 'staff' };
      }

      return { canManage: false, reason: 'no_permission' };
    } catch (error) {
      console.error('Error checking family management permissions:', error);
      return { canManage: false, reason: 'error' };
    }
  }
}

export default FamilyManagementService;
