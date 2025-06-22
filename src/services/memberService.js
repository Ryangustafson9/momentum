// 🚀 MEMBER SERVICE - Centralized data fetching for React Query
import { supabase } from '@/lib/supabaseClient';

export const memberService = {
  // Get all members with optional filtering
  async getMembers(filters = {}) {
    
    
    let query = supabase
      .from('profiles')
      .select(`
        *,
        memberships:memberships!auth_user_id(
          *,
          membership_type:membership_types!current_membership_type_id(*)
        ),
        addon_memberships:addon_memberships!member_id(
          *,
          addon_type:membership_types!addon_type_id(*)
        )
      `)
      .eq('role', 'member')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters.status) {
      // This would need to be implemented based on membership status
      // For now, we'll filter in the application layer
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    
    return data || [];
  },

  // Get member count for dashboard stats
  async getMemberCount() {
    
    
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member');

    if (error) {
      
      throw new Error(`Failed to fetch member count: ${error.message}`);
    }

    
    return count || 0;
  },

  // Get single member profile
  async getMemberProfile(memberId) {
    
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        memberships:memberships!auth_user_id(
          *,
          membership_type:membership_types!current_membership_type_id(*)
        ),
        addon_memberships:addon_memberships!member_id(
          *,
          addon_type:membership_types!addon_type_id(*)
        )
      `)
      .eq('id', memberId)
      .single();

    if (error) {
      
      throw new Error(`Failed to fetch member profile: ${error.message}`);
    }

    
    return data;
  },

  // Get member's membership details
  async getMemberMembership(memberId) {
    
    
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_type:membership_types!current_membership_type_id(*)
      `)
      .eq('auth_user_id', memberId)
      .maybeSingle();

    if (error) {
      
      throw new Error(`Failed to fetch membership: ${error.message}`);
    }

    
    return data;
  },

  // Get member's add-ons
  async getMemberAddons(memberId) {
    
    
    const { data, error } = await supabase
      .from('addon_memberships')
      .select(`
        *,
        addon_type:membership_types!addon_type_id(*)
      `)
      .eq('member_id', memberId);

    if (error) {
      
      throw new Error(`Failed to fetch add-ons: ${error.message}`);
    }

    
    return data || [];
  },

  // Update member profile
  async updateMember(memberId, updates) {
    
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      
      throw new Error(`Failed to update member: ${error.message}`);
    }

    
    return data;
  },

  // Check in member
  async checkInMember(memberId, memberName) {
    
    
    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingCheckIn } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', memberId)
      .gte('check_in_time', today)
      .lt('check_in_time', today + 'T23:59:59')
      .maybeSingle();

    if (existingCheckIn) {
      throw new Error('Member is already checked in today');
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        member_id: memberId,
        member_name: memberName,
        check_in_time: new Date().toISOString(),
        status: 'Present',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      
      throw new Error(`Failed to check in member: ${error.message}`);
    }

    
    return data;
  },

  // Check out member
  async checkOutMember(attendanceId) {
    
    
    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out_time: new Date().toISOString(),
        status: 'Left'
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) {
      
      throw new Error(`Failed to check out member: ${error.message}`);
    }

    
    return data;
  },

  // Get family members
  async getFamilyMembers(primaryMemberId) {
    
    
    const { data, error } = await supabase
      .from('family_members')
      .select(`
        *,
        family_member:profiles!family_member_id(*)
      `)
      .eq('primary_member_id', primaryMemberId);

    if (error) {
      
      throw new Error(`Failed to fetch family members: ${error.message}`);
    }

    
    return data || [];
  },
};

export default memberService;

