// 🚀 MEMBER SERVICE - Centralized data fetching for React Query
import { supabase } from '@/lib/supabaseClient';
import { sanitizeError } from '@/utils/requestUtils';

export const memberService = {
  // Get all members with optional filtering
  async getMembers(filters = {}) {


    let query = supabase
      .from('profiles')
      .select(`
        *,
        memberships:memberships!user_id(
          *,
          membership_type:membership_types!membership_type_id(*)
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

    const { data, error } = await query;    if (error) {
      throw sanitizeError(error, 'Get members');
    }

    
    return data || [];
  },

  // Get member count for dashboard stats
  async getMemberCount() {
    
    
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member');    if (error) {
      throw sanitizeError(error, 'Get member count');
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
      .single();    if (error) {
      throw sanitizeError(error, 'Get member profile');
    }

    
    return data;
  },

  // Get member's membership details (primary membership only)
  async getMemberMembership(memberId) {


    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_type:membership_types!membership_type_id(*)
      `)
      .eq('user_id', memberId)
      .eq('plan_type', 'Membership')
      .maybeSingle();

    if (error) {
      throw sanitizeError(error, 'Get member membership');
    }


    return data;
  },

  // Get member's add-ons (now from unified memberships table)
  async getMemberAddons(memberId) {


    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_type:membership_types!membership_type_id(*)
      `)
      .eq('user_id', memberId)
      .eq('plan_type', 'Add-On');

    if (error) {
      throw sanitizeError(error, 'Get member add-ons');
    }


    return data || [];
  },

  // Get all memberships for a member (primary + add-ons + staff + guest)
  async getAllMemberMemberships(memberId) {


    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_type:membership_types!membership_type_id(*)
      `)
      .eq('user_id', memberId)
      .order('plan_type', { ascending: true }); // Membership first, then Add-On, Staff, Guest

    if (error) {
      throw sanitizeError(error, 'Get all member memberships');
    }

    // Group by plan type for easier consumption
    const grouped = {
      primary: data?.filter(m => m.plan_type === 'Membership') || [],
      addons: data?.filter(m => m.plan_type === 'Add-On') || [],
      staff: data?.filter(m => m.plan_type === 'Staff') || [],
      guest: data?.filter(m => m.plan_type === 'Guest') || []
    };


    return { raw: data || [], grouped };
  },

  // Add a new membership (any plan type)
  async addMembership(membershipData) {


    const { data, error } = await supabase
      .from('memberships')
      .insert([{
        user_id: membershipData.user_id || membershipData.member_id,
        organization_id: membershipData.organization_id,
        location_id: membershipData.location_id,
        membership_type_id: membershipData.membership_type_id || membershipData.membership_plan_id,
        plan_type: membershipData.plan_type || 'Membership',
        status: membershipData.status || 'active',
        start_date: membershipData.start_date || new Date().toISOString().split('T')[0],
        expiration_date: membershipData.end_date,
        next_payment_date: membershipData.next_billing_date,
        monthly_rate: membershipData.monthly_rate || 0,
        setup_fee: membershipData.setup_fee || 0,
        billing_frequency: membershipData.billing_frequency || 'monthly',
        auto_renew: membershipData.auto_renew !== undefined ? membershipData.auto_renew : true,
        notes: membershipData.notes,
        created_by: membershipData.created_by
      }])
      .select(`
        *,
        membership_type:membership_types!membership_type_id(*)
      `)
      .single();

    if (error) {
      throw sanitizeError(error, 'Add membership');
    }


    return data;
  },

  // Update membership
  async updateMembership(membershipId, updates) {


    const { data, error } = await supabase
      .from('memberships')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', membershipId)
      .select(`
        *,
        membership_type:membership_types!membership_type_id(*)
      `)
      .single();

    if (error) {
      throw sanitizeError(error, 'Update membership');
    }


    return data;
  },

  // Get billing summary for a member
  async getMemberBillingSummary(memberId) {


    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_type:membership_types!membership_type_id(name, price, billing_type)
      `)
      .eq('user_id', memberId)
      .in('status', ['active', 'pending']);

    if (error) {
      throw sanitizeError(error, 'Get member billing summary');
    }

    // Calculate totals
    const summary = {
      totalMonthlyAmount: 0,
      primaryMembership: null,
      addons: [],
      nextBillingDate: null,
      totalItems: data?.length || 0
    };

    data?.forEach(membership => {
      const amount = membership.monthly_rate || membership.membership_type?.price || 0;
      summary.totalMonthlyAmount += amount;

      if (membership.plan_type === 'Membership') {
        summary.primaryMembership = membership;
        summary.nextBillingDate = membership.next_payment_date;
      } else if (membership.plan_type === 'Add-On') {
        summary.addons.push(membership);
      }
    });


    return summary;
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
      .single();    if (error) {
      throw sanitizeError(error, 'Update member');
    }

    
    return data;
  },

  // Check in member
  async checkInMember(memberId, memberName) {
    
    
    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingCheckIn } = await supabase
      .from('checkin_history')
      .select('*')
      .eq('member_id', memberId)
      .gte('check_in_time', today)
      .lt('check_in_time', today + 'T23:59:59')
      .maybeSingle();    if (existingCheckIn) {
      throw new Error('Member is already checked in today');
    }

    const { data, error } = await supabase
      .from('checkin_history')
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
      throw sanitizeError(error, 'Check in member');
    }

    
    return data;
  },

  // Check out member
  async checkOutMember(attendanceId) {
    
    
    const { data, error } = await supabase
      .from('checkin_history')
      .update({
        check_out_time: new Date().toISOString(),
        status: 'Left'
      })
      .eq('id', attendanceId)
      .select()
      .single();    if (error) {
      throw sanitizeError(error, 'Check out member');
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
      .eq('primary_member_id', primaryMemberId);    if (error) {
      throw sanitizeError(error, 'Get family members');
    }

    
    return data || [];
  },
};

export default memberService;

