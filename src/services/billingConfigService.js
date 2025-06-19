// 🚀 BILLING CONFIGURATION SERVICE - Multi-tenant billing management
import { supabase } from '@/lib/supabaseClient';

export const billingConfigService = {
  // Get billing configuration for organization
  async getBillingConfig(organizationId) {
    console.log('🔍 BillingConfigService: Fetching config for org:', organizationId);
    
    const { data, error } = await supabase
      .from('billing_configurations')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      console.error('❌ BillingConfigService: Error fetching config:', error);
      throw new Error(`Failed to fetch billing configuration: ${error.message}`);
    }

    // Return default config if none exists
    if (!data) {
      console.log('ℹ️ No billing config found, returning defaults');
      return this.getDefaultBillingConfig(organizationId);
    }

    console.log('✅ BillingConfigService: Fetched billing config');
    return data;
  },

  // Get default billing configuration
  getDefaultBillingConfig(organizationId) {
    return {
      organization_id: organizationId,
      membership_billing_type: 'anniversary',
      unified_billing_day: 1,
      proration_enabled: true,
      house_charges_enabled: true,
      house_charges_frequency: 'monthly',
      house_charges_billing_day: 1,
      house_charges_custom_interval: null,
      failed_payment_retry_enabled: true,
      retry_intervals: [3, 7, 14],
      auto_suspend_after_retries: 3,
      auto_cancel_after_days: 30,
      invoice_prefix: 'INV',
      invoice_numbering_start: 1000,
      invoice_due_days: 30,
      send_invoice_emails: true,
      send_payment_reminders: true,
      send_failed_payment_notifications: true
    };
  },

  // Update billing configuration
  async updateBillingConfig(organizationId, configData) {
    console.log('🔄 BillingConfigService: Updating config for org:', organizationId);
    
    const { data, error } = await supabase
      .from('billing_configurations')
      .upsert({
        organization_id: organizationId,
        ...configData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ BillingConfigService: Error updating config:', error);
      throw new Error(`Failed to update billing configuration: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Updated billing config');
    return data;
  },

  // Get house charges for organization
  async getHouseCharges(organizationId) {
    console.log('🔍 BillingConfigService: Fetching house charges for org:', organizationId);
    
    const { data, error } = await supabase
      .from('house_charges')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ BillingConfigService: Error fetching house charges:', error);
      throw new Error(`Failed to fetch house charges: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Fetched', data?.length || 0, 'house charges');
    return data || [];
  },

  // Create house charge
  async createHouseCharge(organizationId, chargeData) {
    console.log('🔄 BillingConfigService: Creating house charge:', chargeData.name);
    
    const { data, error } = await supabase
      .from('house_charges')
      .insert({
        organization_id: organizationId,
        ...chargeData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ BillingConfigService: Error creating house charge:', error);
      throw new Error(`Failed to create house charge: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Created house charge:', data.name);
    return data;
  },

  // Update house charge
  async updateHouseCharge(chargeId, updates) {
    console.log('🔄 BillingConfigService: Updating house charge:', chargeId);
    
    const { data, error } = await supabase
      .from('house_charges')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', chargeId)
      .select()
      .single();

    if (error) {
      console.error('❌ BillingConfigService: Error updating house charge:', error);
      throw new Error(`Failed to update house charge: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Updated house charge');
    return data;
  },

  // Delete house charge
  async deleteHouseCharge(chargeId) {
    console.log('🔄 BillingConfigService: Deleting house charge:', chargeId);
    
    const { error } = await supabase
      .from('house_charges')
      .update({ is_active: false })
      .eq('id', chargeId);

    if (error) {
      console.error('❌ BillingConfigService: Error deleting house charge:', error);
      throw new Error(`Failed to delete house charge: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Deleted house charge');
    return true;
  },

  // Get member house charges
  async getMemberHouseCharges(memberId) {
    console.log('🔍 BillingConfigService: Fetching house charges for member:', memberId);
    
    const { data, error } = await supabase
      .from('member_house_charges')
      .select(`
        *,
        house_charge:house_charges(*)
      `)
      .eq('member_id', memberId)
      .eq('is_active', true);

    if (error) {
      console.error('❌ BillingConfigService: Error fetching member house charges:', error);
      throw new Error(`Failed to fetch member house charges: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Fetched', data?.length || 0, 'member house charges');
    return data || [];
  },

  // Assign house charge to member
  async assignHouseChargeToMember(memberId, houseChargeId, organizationId, options = {}) {
    console.log('🔄 BillingConfigService: Assigning house charge to member:', memberId);
    
    const { data, error } = await supabase
      .from('member_house_charges')
      .insert({
        member_id: memberId,
        house_charge_id: houseChargeId,
        organization_id: organizationId,
        assigned_date: new Date().toISOString().split('T')[0],
        start_date: options.startDate || new Date().toISOString().split('T')[0],
        end_date: options.endDate || null,
        custom_amount: options.customAmount || null,
        custom_frequency: options.customFrequency || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ BillingConfigService: Error assigning house charge:', error);
      throw new Error(`Failed to assign house charge: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Assigned house charge to member');
    return data;
  },

  // Remove house charge from member
  async removeHouseChargeFromMember(memberHouseChargeId) {
    console.log('🔄 BillingConfigService: Removing house charge from member:', memberHouseChargeId);
    
    const { error } = await supabase
      .from('member_house_charges')
      .update({ 
        is_active: false,
        end_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', memberHouseChargeId);

    if (error) {
      console.error('❌ BillingConfigService: Error removing house charge:', error);
      throw new Error(`Failed to remove house charge: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Removed house charge from member');
    return true;
  },

  // Get billing schedules for organization
  async getBillingSchedules(organizationId, filters = {}) {
    console.log('🔍 BillingConfigService: Fetching billing schedules for org:', organizationId);
    
    let query = supabase
      .from('billing_schedules')
      .select(`
        *,
        member:profiles!member_id(first_name, last_name, email),
        membership:memberships!membership_id(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('next_billing_date');

    // Apply filters
    if (filters.billingType) {
      query = query.eq('billing_type', filters.billingType);
    }

    if (filters.upcomingDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.upcomingDays);
      query = query.lte('next_billing_date', futureDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ BillingConfigService: Error fetching billing schedules:', error);
      throw new Error(`Failed to fetch billing schedules: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Fetched', data?.length || 0, 'billing schedules');
    return data || [];
  },

  // Create or update billing schedule
  async upsertBillingSchedule(scheduleData) {
    console.log('🔄 BillingConfigService: Upserting billing schedule');
    
    const { data, error } = await supabase
      .from('billing_schedules')
      .upsert({
        ...scheduleData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ BillingConfigService: Error upserting billing schedule:', error);
      throw new Error(`Failed to upsert billing schedule: ${error.message}`);
    }

    console.log('✅ BillingConfigService: Upserted billing schedule');
    return data;
  },

  // Calculate proration amount
  calculateProration(startDate, endDate, monthlyAmount) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get days in the billing month
    const year = start.getFullYear();
    const month = start.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Calculate days used
    const daysUsed = Math.min(
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
      daysInMonth
    );
    
    // Calculate prorated amount
    const proratedAmount = (monthlyAmount * daysUsed) / daysInMonth;
    
    console.log('💰 Proration calculation:', {
      startDate,
      endDate,
      monthlyAmount,
      daysInMonth,
      daysUsed,
      proratedAmount: Math.round(proratedAmount * 100) / 100
    });
    
    return Math.round(proratedAmount * 100) / 100;
  },

  // Get next billing date based on configuration
  getNextBillingDate(billingType, membershipStartDate, billingDay = 1) {
    const today = new Date();
    let nextBillingDate;

    if (billingType === 'anniversary') {
      // Anniversary billing - bill on the same day each month as signup
      const startDate = new Date(membershipStartDate);
      const anniversaryDay = startDate.getDate();
      
      nextBillingDate = new Date(today.getFullYear(), today.getMonth(), anniversaryDay);
      
      // If the anniversary day has passed this month, move to next month
      if (nextBillingDate <= today) {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
      
      // Handle months with fewer days (e.g., Feb 30 -> Feb 28)
      if (nextBillingDate.getDate() !== anniversaryDay) {
        nextBillingDate = new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth() + 1, 0);
      }
    } else {
      // Unified billing - bill all members on the same day
      nextBillingDate = new Date(today.getFullYear(), today.getMonth(), billingDay);
      
      // If the billing day has passed this month, move to next month
      if (nextBillingDate <= today) {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
    }

    return nextBillingDate.toISOString().split('T')[0];
  },

  // Validate billing configuration
  validateBillingConfig(config) {
    const errors = [];

    // Validate membership billing type
    if (!['anniversary', 'unified'].includes(config.membership_billing_type)) {
      errors.push('Invalid membership billing type');
    }

    // Validate unified billing day
    if (config.membership_billing_type === 'unified') {
      if (!config.unified_billing_day || config.unified_billing_day < 1 || config.unified_billing_day > 28) {
        errors.push('Unified billing day must be between 1 and 28');
      }
    }

    // Validate house charges frequency
    if (config.house_charges_enabled) {
      if (!['weekly', 'biweekly', 'monthly', 'custom'].includes(config.house_charges_frequency)) {
        errors.push('Invalid house charges frequency');
      }

      if (config.house_charges_frequency === 'custom' && !config.house_charges_custom_interval) {
        errors.push('Custom interval required for custom house charges frequency');
      }
    }

    // Validate retry intervals
    if (config.failed_payment_retry_enabled) {
      if (!Array.isArray(config.retry_intervals) || config.retry_intervals.length === 0) {
        errors.push('Retry intervals must be a non-empty array');
      }
    }

    // Validate invoice settings
    if (!config.invoice_prefix || config.invoice_prefix.length > 10) {
      errors.push('Invoice prefix must be 1-10 characters');
    }

    if (!config.invoice_numbering_start || config.invoice_numbering_start < 1) {
      errors.push('Invoice numbering start must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default billingConfigService;
