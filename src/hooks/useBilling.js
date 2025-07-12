// 🚀 BILLING HOOKS - React Query integration for automated billing
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { stripeService } from '@/services/stripeService';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// Billing service functions
const billingService = {
  // Get member's billing information
  async getMemberBilling(memberId) {
    
    
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_type:membership_types!current_membership_type_id(*),
        profile:profiles!user_id(first_name, last_name, email)
      `)
      .eq('user_id', memberId)
      .maybeSingle();

    if (error) {
      
      throw new Error(`Failed to fetch billing information: ${error.message}`);
    }

    // Get Stripe invoices if customer exists
    let invoices = [];
    if (data?.stripe_customer_id) {
      try {
        const stripeInvoices = await stripeService.getCustomerInvoices(data.stripe_customer_id);
        invoices = stripeInvoices.data || [];
      } catch (error) {
        
      }
    }

    const billingInfo = {
      ...data,
      invoices: invoices,
      nextPaymentDate: data?.next_payment_date || null,
      lastPaymentDate: data?.last_payment_date || null,
      paymentMethod: data?.payment_method || 'Unknown',
      autoRenew: data?.auto_renew || false
    };

    
    return billingInfo;
  },

  // Get all member billing overview for staff
  async getAllMembersBilling() {


    // Get all memberships with their associated profiles and membership types
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        membership_type:membership_types!membership_plan_id(*),
        profile:profiles!member_id(first_name, last_name, email)
      `)
      .order('member_id', { ascending: true })
      .order('plan_type', { ascending: true }); // Group by member, then by plan type

    if (error) {

      throw new Error(`Failed to fetch billing overview: ${error.message}`);
    }

    // Group memberships by member and calculate totals
    const memberBillingMap = new Map();

    (data || []).forEach(membership => {
      const memberId = membership.member_id;

      if (!memberBillingMap.has(memberId)) {
        memberBillingMap.set(memberId, {
          member_id: memberId,
          profile: membership.profile,
          primary_membership: null,
          addons: [],
          staff_memberships: [],
          guest_memberships: [],
          totalMonthlyCost: 0,
          nextPaymentDate: null,
          status: 'active'
        });
      }

      const memberBilling = memberBillingMap.get(memberId);
      const membershipCost = membership.membership_type?.price || membership.monthly_rate || 0;

      // Categorize membership by plan_type
      switch (membership.plan_type) {
        case 'Membership':
          memberBilling.primary_membership = membership;
          memberBilling.status = membership.status;
          memberBilling.nextPaymentDate = membership.next_billing_date;
          break;
        case 'Add-On':
          memberBilling.addons.push(membership);
          break;
        case 'Staff':
          memberBilling.staff_memberships.push(membership);
          break;
        case 'Guest':
          memberBilling.guest_memberships.push(membership);
          break;
      }

      memberBilling.totalMonthlyCost += membershipCost;
    });

    // Convert map to array and process payment status
    const processedData = Array.from(memberBillingMap.values()).map(memberBilling => {
      const nextPaymentDate = memberBilling.nextPaymentDate
        ? new Date(memberBilling.nextPaymentDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Determine payment status
      const today = new Date();
      const isOverdue = nextPaymentDate < today && memberBilling.status === 'active';
      const isPending = nextPaymentDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      return {
        ...memberBilling,
        nextPaymentDate,
        paymentStatus: isOverdue ? 'overdue' : isPending ? 'pending' : 'current',
        daysUntilPayment: Math.ceil((nextPaymentDate - today) / (24 * 60 * 60 * 1000))
      };
    });


    return processedData;
  },

  // Process membership payment
  async processMembershipPayment(memberData, paymentData) {
    
    
    return await stripeService.processMembershipSignup(memberData, paymentData);
  },

  // Update payment method
  async updatePaymentMethod(memberId, paymentMethodData) {
    
    
    // Get member's Stripe customer ID
    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_customer_id')
      .eq('auth_user_id', memberId)
      .single();

    if (!membership?.stripe_customer_id) {
      throw new Error('No Stripe customer found for this member');
    }

    // Update payment method in Stripe
    const result = await stripeService.updatePaymentMethod(
      membership.stripe_customer_id,
      paymentMethodData.paymentMethodId
    );

    // Update local database
    const { error } = await supabase
      .from('memberships')
      .update({
        payment_method: 'stripe',
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', memberId);

    if (error) {
      
      throw new Error(`Failed to update payment method: ${error.message}`);
    }

    
    return result;
  },

  // Cancel membership
  async cancelMembership(memberId, cancelAtPeriodEnd = true) {
    
    
    // Get member's subscription
    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_subscription_id')
      .eq('auth_user_id', memberId)
      .single();

    if (!membership?.stripe_subscription_id) {
      throw new Error('No active subscription found for this member');
    }

    // Cancel subscription in Stripe
    const result = await stripeService.cancelSubscription(
      membership.stripe_subscription_id,
      cancelAtPeriodEnd
    );

    // Update local database
    const { error } = await supabase
      .from('memberships')
      .update({
        status: cancelAtPeriodEnd ? 'Cancelling' : 'Cancelled',
        auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', memberId);

    if (error) {
      
      throw new Error(`Failed to cancel membership: ${error.message}`);
    }

    
    return result;
  },

  // Retry failed payment
  async retryFailedPayment(memberId) {
    
    
    // Get member's latest invoice
    const { data: membership } = await supabase
      .from('memberships')
      .select('stripe_customer_id')
      .eq('auth_user_id', memberId)
      .single();

    if (!membership?.stripe_customer_id) {
      throw new Error('No Stripe customer found for this member');
    }

    // Get latest invoice and retry payment
    const invoices = await stripeService.getCustomerInvoices(membership.stripe_customer_id, 1);
    const latestInvoice = invoices.data[0];

    if (!latestInvoice || latestInvoice.status === 'paid') {
      throw new Error('No failed payment found to retry');
    }

    const result = await stripeService.retryPayment(latestInvoice.id);

    // Update membership status if payment succeeded
    if (result.success) {
      const { error } = await supabase
        .from('memberships')
        .update({
          status: 'Active',
          payment_retry_count: 0,
          last_payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', memberId);

      if (error) {
        
      }
    }

    
    return result;
  }
};

// React Query Hooks

// Get member's billing information
export const useMemberBilling = (memberId) => {
  return useQuery({
    queryKey: queryKeys.memberBilling(memberId),
    queryFn: () => billingService.getMemberBilling(memberId),
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

// Get all members billing overview (for staff)
export const useAllMembersBilling = () => {
  return useQuery({
    queryKey: [...queryKeys.billing, 'overview'],
    queryFn: billingService.getAllMembersBilling,
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

// Mutation hooks

// Process membership payment
export const useProcessMembershipPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ memberData, paymentData }) => 
      billingService.processMembershipPayment(memberData, paymentData),
    onSuccess: (data, { memberData }) => {
      // Invalidate billing queries
      queryClient.invalidateQueries({ queryKey: queryKeys.billing });
      queryClient.invalidateQueries({ queryKey: queryKeys.memberBilling(memberData.id) });
      
      // Invalidate member queries to update role
      queryClient.invalidateQueries({ queryKey: queryKeys.members });
      
      toast({
        title: "Payment Successful",
        description: "Membership has been activated successfully!",
      });
    },
    onError: (error) => {
      
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });
};

// Update payment method
export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ memberId, paymentMethodData }) => 
      billingService.updatePaymentMethod(memberId, paymentMethodData),
    onSuccess: (data, { memberId }) => {
      // Invalidate billing queries
      queryClient.invalidateQueries({ queryKey: queryKeys.memberBilling(memberId) });
      
      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been successfully updated",
      });
    },
    onError: (error) => {
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment method",
        variant: "destructive",
      });
    },
  });
};

// Cancel membership
export const useCancelMembership = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ memberId, cancelAtPeriodEnd }) => 
      billingService.cancelMembership(memberId, cancelAtPeriodEnd),
    onSuccess: (data, { memberId, cancelAtPeriodEnd }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.memberBilling(memberId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing });
      
      const message = cancelAtPeriodEnd 
        ? "Membership will be cancelled at the end of the current period"
        : "Membership has been cancelled immediately";
      
      toast({
        title: "Membership Cancelled",
        description: message,
      });
    },
    onError: (error) => {
      
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel membership",
        variant: "destructive",
      });
    },
  });
};

// Retry failed payment
export const useRetryFailedPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (memberId) => billingService.retryFailedPayment(memberId),
    onSuccess: (data, memberId) => {
      // Invalidate billing queries
      queryClient.invalidateQueries({ queryKey: queryKeys.memberBilling(memberId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing });
      
      if (data.success) {
        toast({
          title: "Payment Successful",
          description: "Payment has been processed successfully",
        });
      } else {
        toast({
          title: "Payment Failed",
          description: "Payment retry failed. Please update your payment method.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      
      toast({
        title: "Retry Failed",
        description: error.message || "Failed to retry payment",
        variant: "destructive",
      });
    },
  });
};

export default {
  useMemberBilling,
  useAllMembersBilling,
  useProcessMembershipPayment,
  useUpdatePaymentMethod,
  useCancelMembership,
  useRetryFailedPayment,
};

