// 🚀 AUTOMATED BILLING ENGINE - Multi-tenant billing automation
import { supabase } from '@/lib/supabaseClient';
import { stripeService } from './stripeService';
import { billingConfigService } from './billingConfigService';

export const automatedBillingEngine = {
  // Process all billing for an organization
  async processBillingCycle(organizationId, billingType = 'membership') {
    console.log('🔄 BillingEngine: Starting billing cycle for org:', organizationId, 'type:', billingType);
    
    try {
      // Create billing job record
      const billingJob = await this.createBillingJob(organizationId, billingType);
      
      // Get billing configuration
      const config = await billingConfigService.getBillingConfig(organizationId);
      
      // Get members to bill
      const membersToBill = await this.getMembersToBill(organizationId, billingType, config);
      
      console.log('📊 BillingEngine: Found', membersToBill.length, 'members to bill');
      
      // Update job with total count
      await this.updateBillingJob(billingJob.id, {
        total_members: membersToBill.length,
        status: 'running',
        started_at: new Date().toISOString()
      });
      
      let successfulBillings = 0;
      let failedBillings = 0;
      const processingLog = [];
      
      // Process each member
      for (const member of membersToBill) {
        try {
          const result = await this.processMemberBilling(member, config, billingType);
          if (result.success) {
            successfulBillings++;
          } else {
            failedBillings++;
          }
          processingLog.push({
            memberId: member.id,
            memberName: `${member.first_name} ${member.last_name}`,
            success: result.success,
            amount: result.amount,
            error: result.error
          });
        } catch (error) {
          failedBillings++;
          processingLog.push({
            memberId: member.id,
            memberName: `${member.first_name} ${member.last_name}`,
            success: false,
            error: error.message
          });
          console.error('❌ BillingEngine: Error processing member:', member.id, error);
        }
        
        // Update progress
        await this.updateBillingJob(billingJob.id, {
          processed_members: successfulBillings + failedBillings
        });
      }
      
      // Complete billing job
      await this.updateBillingJob(billingJob.id, {
        status: 'completed',
        successful_billings: successfulBillings,
        failed_billings: failedBillings,
        processing_log: processingLog,
        completed_at: new Date().toISOString()
      });
      
      console.log('✅ BillingEngine: Billing cycle completed', {
        successful: successfulBillings,
        failed: failedBillings
      });
      
      return {
        success: true,
        jobId: billingJob.id,
        totalMembers: membersToBill.length,
        successfulBillings,
        failedBillings,
        processingLog
      };
      
    } catch (error) {
      console.error('❌ BillingEngine: Billing cycle failed:', error);
      throw new Error(`Billing cycle failed: ${error.message}`);
    }
  },

  // Create billing job record
  async createBillingJob(organizationId, jobType) {
    const { data, error } = await supabase
      .from('billing_jobs')
      .insert({
        organization_id: organizationId,
        job_type: `${jobType}_billing`,
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create billing job: ${error.message}`);
    }

    return data;
  },

  // Update billing job
  async updateBillingJob(jobId, updates) {
    const { error } = await supabase
      .from('billing_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      console.error('❌ Error updating billing job:', error);
    }
  },

  // Get members that need to be billed
  async getMembersToBill(organizationId, billingType, config) {
    const today = new Date().toISOString().split('T')[0];
    
    if (billingType === 'membership') {
      return await this.getMembersForMembershipBilling(organizationId, config, today);
    } else if (billingType === 'house_charges') {
      return await this.getMembersForHouseChargesBilling(organizationId, config, today);
    }
    
    return [];
  },

  // Get members for membership billing
  async getMembersForMembershipBilling(organizationId, config, today) {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        memberships:memberships!auth_user_id(
          *,
          membership_type:membership_types!current_membership_type_id(*)
        )
      `)
      .eq('role', 'member');

    // Filter based on billing type
    if (config.membership_billing_type === 'unified') {
      // For unified billing, get all active members
      query = query.eq('memberships.status', 'Active');
    } else {
      // For anniversary billing, get members whose anniversary is today
      // This would need more complex logic in production
      query = query.eq('memberships.status', 'Active');
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get members for billing: ${error.message}`);
    }

    // Filter members who actually need billing today
    return (data || []).filter(member => {
      const membership = member.memberships?.[0];
      if (!membership) return false;

      if (config.membership_billing_type === 'anniversary') {
        // Check if today is the member's billing anniversary
        const startDate = new Date(membership.start_date);
        const today = new Date();
        return startDate.getDate() === today.getDate();
      } else {
        // For unified billing, check if today is the billing day
        const today = new Date();
        return today.getDate() === config.unified_billing_day;
      }
    });
  },

  // Get members for house charges billing
  async getMembersForHouseChargesBilling(organizationId, config, today) {
    if (!config.house_charges_enabled) return [];

    const { data, error } = await supabase
      .from('member_house_charges')
      .select(`
        *,
        member:profiles!member_id(*),
        house_charge:house_charges!house_charge_id(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get members for house charges billing: ${error.message}`);
    }

    // Group by member and filter those due for billing
    const memberCharges = {};
    (data || []).forEach(memberCharge => {
      const memberId = memberCharge.member_id;
      if (!memberCharges[memberId]) {
        memberCharges[memberId] = {
          member: memberCharge.member,
          charges: []
        };
      }
      memberCharges[memberId].charges.push(memberCharge);
    });

    // Filter members who have charges due today
    return Object.values(memberCharges).filter(memberData => {
      return this.isHouseChargesDueToday(memberData.charges, config, today);
    });
  },

  // Check if house charges are due today
  isHouseChargesDueToday(charges, config, today) {
    const todayDate = new Date(today);
    
    return charges.some(charge => {
      const startDate = new Date(charge.start_date);
      const daysSinceStart = Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24));
      
      const frequency = charge.custom_frequency || charge.house_charge.billing_frequency;
      
      switch (frequency) {
        case 'weekly':
          return daysSinceStart % 7 === 0;
        case 'biweekly':
          return daysSinceStart % 14 === 0;
        case 'monthly':
          return todayDate.getDate() === (config.house_charges_billing_day || 1);
        case 'custom':
          const interval = config.house_charges_custom_interval || 30;
          return daysSinceStart % interval === 0;
        default:
          return false;
      }
    });
  },

  // Process billing for a single member
  async processMemberBilling(member, config, billingType) {
    console.log('💳 BillingEngine: Processing billing for member:', member.email);
    
    try {
      if (billingType === 'membership') {
        return await this.processMembershipBilling(member, config);
      } else if (billingType === 'house_charges') {
        return await this.processHouseChargesBilling(member, config);
      }
      
      return { success: false, error: 'Unknown billing type' };
    } catch (error) {
      console.error('❌ BillingEngine: Error processing member billing:', error);
      return { success: false, error: error.message };
    }
  },

  // Process membership billing for a member
  async processMembershipBilling(member, config) {
    const membership = member.memberships?.[0];
    if (!membership) {
      return { success: false, error: 'No active membership found' };
    }

    // Calculate billing amount
    let billingAmount = membership.membership_type?.price || 0;
    
    // Apply proration if needed
    if (config.membership_billing_type === 'unified' && config.proration_enabled) {
      // Calculate proration for new members
      const membershipStart = new Date(membership.start_date);
      const billingDate = new Date();
      billingDate.setDate(config.unified_billing_day);
      
      if (membershipStart > billingDate) {
        // Member joined after this month's billing date, prorate
        const nextBillingDate = new Date(billingDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        
        billingAmount = billingConfigService.calculateProration(
          membershipStart.toISOString().split('T')[0],
          nextBillingDate.toISOString().split('T')[0],
          billingAmount
        );
      }
    }

    // Create invoice
    const invoice = await this.createInvoice(member, config, [
      {
        description: `${membership.membership_type?.name} Membership`,
        quantity: 1,
        unit_price: billingAmount,
        total_price: billingAmount,
        item_type: 'membership',
        membership_id: membership.id,
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]);

    // Process payment
    const paymentResult = await this.processPayment(member, invoice, config);
    
    return {
      success: paymentResult.success,
      amount: billingAmount,
      invoiceId: invoice.id,
      error: paymentResult.error
    };
  },

  // Process house charges billing for a member
  async processHouseChargesBilling(memberData, config) {
    const { member, charges } = memberData;
    
    // Calculate total amount for all house charges
    let totalAmount = 0;
    const lineItems = [];
    
    charges.forEach(charge => {
      const amount = charge.custom_amount || charge.house_charge.amount;
      totalAmount += amount;
      
      lineItems.push({
        description: charge.house_charge.name,
        quantity: 1,
        unit_price: amount,
        total_price: amount,
        item_type: 'house_charge',
        house_charge_id: charge.house_charge_id,
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    });

    // Create invoice
    const invoice = await this.createInvoice(member, config, lineItems);

    // Process payment
    const paymentResult = await this.processPayment(member, invoice, config);
    
    return {
      success: paymentResult.success,
      amount: totalAmount,
      invoiceId: invoice.id,
      error: paymentResult.error
    };
  },

  // Create invoice
  async createInvoice(member, config, lineItems) {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(config.organization_id);
    
    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = lineItems.reduce((sum, item) => {
      // Apply tax if item is taxable (would need to check house charge settings)
      return sum + 0; // Simplified for demo
    }, 0);
    const totalAmount = subtotal + taxAmount;

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        organization_id: config.organization_id,
        member_id: member.id,
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + config.invoice_due_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft',
        billing_period_start: lineItems[0]?.period_start,
        billing_period_end: lineItems[0]?.period_end,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    // Create line items
    const lineItemsWithInvoiceId = lineItems.map(item => ({
      ...item,
      invoice_id: invoice.id,
      created_at: new Date().toISOString()
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsWithInvoiceId);

    if (lineItemsError) {
      throw new Error(`Failed to create invoice line items: ${lineItemsError.message}`);
    }

    return invoice;
  },

  // Generate invoice number
  async generateInvoiceNumber(organizationId) {
    // This would call the database function in production
    // For demo, we'll generate a simple number
    const timestamp = Date.now();
    return `INV${timestamp.toString().slice(-6)}`;
  },

  // Process payment for invoice
  async processPayment(member, invoice, config) {
    try {
      // Get member's Stripe customer ID
      const { data: membership } = await supabase
        .from('memberships')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('auth_user_id', member.id)
        .single();

      if (!membership?.stripe_customer_id) {
        return { success: false, error: 'No payment method on file' };
      }

      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        invoice.total_amount,
        'usd',
        {
          invoice_id: invoice.id,
          member_id: member.id,
          organization_id: config.organization_id
        }
      );

      // Update invoice with payment intent
      await supabase
        .from('invoices')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          status: 'sent'
        })
        .eq('id', invoice.id);

      // In production, this would trigger actual payment processing
      // For demo, we'll simulate success
      const paymentSuccess = Math.random() > 0.2; // 80% success rate

      if (paymentSuccess) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_amount: invoice.total_amount,
            paid_at: new Date().toISOString()
          })
          .eq('id', invoice.id);

        return { success: true };
      } else {
        // Handle failed payment
        await this.handleFailedPayment(member, invoice, config);
        return { success: false, error: 'Payment failed' };
      }

    } catch (error) {
      console.error('❌ Payment processing error:', error);
      return { success: false, error: error.message };
    }
  },

  // Handle failed payment
  async handleFailedPayment(member, invoice, config) {
    console.log('❌ BillingEngine: Handling failed payment for member:', member.email);
    
    // Update invoice status
    await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('id', invoice.id);

    // Create retry attempt record
    if (config.failed_payment_retry_enabled) {
      const nextRetryDate = new Date();
      nextRetryDate.setDate(nextRetryDate.getDate() + config.retry_intervals[0]);

      await supabase
        .from('payment_retry_attempts')
        .insert({
          organization_id: config.organization_id,
          member_id: member.id,
          invoice_id: invoice.id,
          attempt_number: 1,
          retry_date: new Date().toISOString().split('T')[0],
          amount: invoice.total_amount,
          status: 'failed',
          failure_reason: 'Payment declined',
          next_retry_date: nextRetryDate.toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
    }

    // Send notification if enabled
    if (config.send_failed_payment_notifications) {
      // In production, this would send an email notification
      console.log('📧 Would send failed payment notification to:', member.email);
    }
  }
};

export default automatedBillingEngine;
