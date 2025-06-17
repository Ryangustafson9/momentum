// 🚀 MEMBER SERVICE - Centralized data fetching for React Query
import { supabase } from '@/lib/supabaseClient';

export const memberService = {
  // Get all members with optional filtering
  async getMembers(filters = {}) {
    console.log('🔍 MemberService: Fetching members with filters:', filters);
    
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
      console.error('❌ MemberService: Error fetching members:', error);
      throw new Error(`Failed to fetch members: ${error.message}`);
    }

    console.log('✅ MemberService: Fetched', data?.length || 0, 'members');
    return data || [];
  },

  // Get member count for dashboard stats
  async getMemberCount() {
    console.log('🔍 MemberService: Fetching member count');
    
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member');

    if (error) {
      console.error('❌ MemberService: Error fetching member count:', error);
      throw new Error(`Failed to fetch member count: ${error.message}`);
    }

    console.log('✅ MemberService: Member count:', count);
    return count || 0;
  },

  // Get single member profile
  async getMemberProfile(memberId) {
    console.log('🔍 MemberService: Fetching profile for member:', memberId);
    
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
      console.error('❌ MemberService: Error fetching member profile:', error);
      throw new Error(`Failed to fetch member profile: ${error.message}`);
    }

    console.log('✅ MemberService: Fetched profile for:', data?.email);
    return data;
  },

  // Get member's membership details
  async getMemberMembership(memberId) {
    console.log('🔍 MemberService: Fetching membership for member:', memberId);
    
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_type:membership_types!current_membership_type_id(*)
      `)
      .eq('auth_user_id', memberId)
      .maybeSingle();

    if (error) {
      console.error('❌ MemberService: Error fetching membership:', error);
      throw new Error(`Failed to fetch membership: ${error.message}`);
    }

    console.log('✅ MemberService: Fetched membership:', data?.id || 'none');
    return data;
  },

  // Get member's add-ons
  async getMemberAddons(memberId) {
    console.log('🔍 MemberService: Fetching add-ons for member:', memberId);
    
    const { data, error } = await supabase
      .from('addon_memberships')
      .select(`
        *,
        addon_type:membership_types!addon_type_id(*)
      `)
      .eq('member_id', memberId);

    if (error) {
      console.error('❌ MemberService: Error fetching add-ons:', error);
      throw new Error(`Failed to fetch add-ons: ${error.message}`);
    }

    console.log('✅ MemberService: Fetched', data?.length || 0, 'add-ons');
    return data || [];
  },

  // Update member profile
  async updateMember(memberId, updates) {
    console.log('🔄 MemberService: Updating member:', memberId, updates);
    
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
      console.error('❌ MemberService: Error updating member:', error);
      throw new Error(`Failed to update member: ${error.message}`);
    }

    console.log('✅ MemberService: Updated member:', data?.email);
    return data;
  },

  // Check in member
  async checkInMember(memberId, memberName) {
    console.log('🔄 MemberService: Checking in member:', memberName);
    
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
      console.error('❌ MemberService: Error checking in member:', error);
      throw new Error(`Failed to check in member: ${error.message}`);
    }

    console.log('✅ MemberService: Checked in member:', memberName);
    return data;
  },

  // Check out member
  async checkOutMember(attendanceId) {
    console.log('🔄 MemberService: Checking out member:', attendanceId);
    
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
      console.error('❌ MemberService: Error checking out member:', error);
      throw new Error(`Failed to check out member: ${error.message}`);
    }

    console.log('✅ MemberService: Checked out member');
    return data;
  },

  // Get family members
  async getFamilyMembers(primaryMemberId) {
    console.log('🔍 MemberService: Fetching family members for:', primaryMemberId);
    
    const { data, error } = await supabase
      .from('family_members')
      .select(`
        *,
        family_member:profiles!family_member_id(*)
      `)
      .eq('primary_member_id', primaryMemberId);

    if (error) {
      console.error('❌ MemberService: Error fetching family members:', error);
      throw new Error(`Failed to fetch family members: ${error.message}`);
    }

    console.log('✅ MemberService: Fetched', data?.length || 0, 'family members');
    return data || [];
  },
};

export default memberService;
