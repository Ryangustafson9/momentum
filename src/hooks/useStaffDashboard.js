// 🚀 STAFF DASHBOARD HOOKS - React Query integration for staff tools
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { supabase } from '@/lib/supabaseClient';

// Staff dashboard service functions
const staffService = {
  // Get comprehensive staff dashboard stats
  async getStaffStats() {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    try {
      const [
        membersResult,
        checkInsResult,
        membershipRevenueResult,
        classesResult,
        expiringResult
      ] = await Promise.allSettled([
        // Total active members
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'member'),

        // Check-ins today
        supabase
          .from('attendance')
          .select('id', { count: 'exact' })
          .gte('check_in_time', today)
          .lt('check_in_time', today + 'T23:59:59'),

        // Monthly revenue from memberships
        supabase
          .from('memberships')
          .select('monthly_fee')
          .eq('status', 'Active'),

        // Upcoming classes today
        supabase
          .from('classes')
          .select('id', { count: 'exact' })
          .gte('start_time', new Date().toISOString())
          .lt('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),

        // Memberships expiring in next 30 days
        supabase
          .from('memberships')
          .select('id', { count: 'exact' })
          .eq('status', 'Active')
          .gte('end_date', new Date().toISOString().split('T')[0])
          .lt('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      ]);

      // Calculate monthly revenue
      let monthlyRevenue = 0;
      if (membershipRevenueResult.status === 'fulfilled' && membershipRevenueResult.value.data) {
        monthlyRevenue = membershipRevenueResult.value.data.reduce((sum, membership) => {
          return sum + (parseFloat(membership.monthly_fee) || 0);
        }, 0);
      }

      return {
        totalMembers: membersResult.status === 'fulfilled' ? membersResult.value.count || 0 : 0,
        checkInsToday: checkInsResult.status === 'fulfilled' ? checkInsResult.value.count || 0 : 0,
        monthlyRevenue: monthlyRevenue,
        upcomingClasses: classesResult.status === 'fulfilled' ? classesResult.value.count || 0 : 0,
        expiringMemberships: expiringResult.status === 'fulfilled' ? expiringResult.value.count || 0 : 0,
        pendingPayments: 0, // This would need a payments table
      };
    } catch (error) {
      
      throw new Error(`Failed to fetch staff dashboard stats: ${error.message}`);
    }
  },

  // Get billing overview for staff
  async getBillingOverview() {
    try {
      const { data: memberData, error } = await supabase
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

      if (error) throw error;

      // Process billing data
      let totalRevenue = 0;
      let pendingPayments = 0;
      let overduePayments = 0;

      const processedMembers = (memberData || []).map(member => {
        const membership = member.memberships?.[0];
        const addons = member.addon_memberships || [];
        
        // Calculate total monthly cost
        const membershipCost = membership?.membership_type?.price || 0;
        const addonsCost = addons.reduce((sum, addon) => sum + (addon.addon_type?.price || 0), 0);
        const totalMonthlyCost = membershipCost + addonsCost;
        
        // Calculate next payment date (simplified - assumes monthly billing)
        const joinDate = new Date(membership?.start_date || member.created_at);
        const nextPaymentDate = new Date(joinDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        
        // Determine payment status (simplified logic)
        const today = new Date();
        const isOverdue = nextPaymentDate < today;
        const isPending = nextPaymentDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Due within 7 days
        
        if (membership?.status === 'Active') {
          totalRevenue += totalMonthlyCost;
          if (isOverdue) overduePayments++;
          else if (isPending) pendingPayments++;
        }

        return {
          ...member,
          totalMonthlyCost,
          nextPaymentDate,
          paymentStatus: isOverdue ? 'overdue' : isPending ? 'pending' : 'current',
          membershipStatus: membership?.status || 'Unknown'
        };
      });

      return {
        members: processedMembers,
        stats: {
          totalRevenue,
          pendingPayments,
          overduePayments,
          successfulPayments: processedMembers.filter(m => m.paymentStatus === 'current').length
        }
      };
    } catch (error) {
      
      throw new Error(`Failed to fetch billing overview: ${error.message}`);
    }
  },
};

// Get staff dashboard statistics
export const useStaffStats = () => {
  return useQuery({
    queryKey: queryKeys.staffStats,
    queryFn: staffService.getStaffStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Get billing overview for staff
export const useBillingOverview = () => {
  return useQuery({
    queryKey: [...queryKeys.billing, 'overview'],
    queryFn: staffService.getBillingOverview,
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

export default {
  useStaffStats,
  useBillingOverview,
};

