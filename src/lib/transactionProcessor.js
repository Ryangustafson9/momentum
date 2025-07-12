/**
 * Transaction Processor
 * Handles revenue transactions with automatic GL account mapping and posting
 */

import { supabase } from './supabaseClient';
import { RevenueMappingService } from './revenueMapping';

export class TransactionProcessor {
  
  /**
   * Process a membership sale transaction
   */
  static async processMembershipSale(membershipSale) {
    try {
      // Get revenue mapping for this membership type
      const mapping = await RevenueMappingService.getRevenueMapping('membership', membershipSale.membership_type_id);
      
      if (!mapping.success || !mapping.data) {
        throw new Error(`No GL account mapping found for membership type ${membershipSale.membership_type_id}`);
      }

      const glAccount = mapping.data.gl_account;
      
      // Determine if this should be deferred revenue
      const isDeferred = this.shouldDeferRevenue('membership', membershipSale);
      
      // Create the revenue transaction
      const transaction = {
        transaction_date: membershipSale.sale_date || new Date().toISOString(),
        source_type: 'membership',
        source_id: membershipSale.membership_type_id,
        source_name: membershipSale.membership_name,
        member_id: membershipSale.member_id,
        amount: membershipSale.amount,
        gl_account_id: glAccount.id,
        payment_method: membershipSale.payment_method,
        payment_reference: membershipSale.payment_reference,
        invoice_number: membershipSale.invoice_number,
        description: `Membership Sale - ${membershipSale.membership_name}`,
        created_by: membershipSale.created_by
      };

      // Handle deferred revenue if applicable
      if (isDeferred) {
        transaction.deferred_revenue_account_id = await this.getDeferredRevenueAccountId();
        
        // Create deferred revenue tracking
        await this.createDeferredRevenueTracking({
          member_id: membershipSale.member_id,
          source_type: 'membership',
          source_id: membershipSale.membership_type_id,
          total_amount: membershipSale.amount,
          recognition_start_date: membershipSale.start_date,
          recognition_end_date: membershipSale.end_date,
          recognition_method: 'straight_line'
        });
      }

      // Handle accounts receivable if not paid immediately
      if (membershipSale.payment_status === 'pending') {
        transaction.ar_account_id = await this.getAccountsReceivableAccountId();
        
        // Create AR tracking
        await this.createAccountsReceivableTracking({
          member_id: membershipSale.member_id,
          invoice_number: membershipSale.invoice_number,
          invoice_date: membershipSale.sale_date,
          due_date: membershipSale.due_date,
          original_amount: membershipSale.amount,
          outstanding_amount: membershipSale.amount
        });
      }

      // Insert the transaction
      const { data: transactionData, error } = await supabase
        .from('revenue_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;

      // Post to GL if configured for immediate posting
      if (membershipSale.post_immediately !== false) {
        await this.postToGeneralLedger(transactionData);
      }

      return { success: true, data: transactionData };
    } catch (error) {
      console.error('Error processing membership sale:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a service sale transaction
   */
  static async processServiceSale(serviceSale) {
    try {
      // Get revenue mapping for this service
      const mapping = await RevenueMappingService.getRevenueMapping('service', serviceSale.service_id);
      
      if (!mapping.success || !mapping.data) {
        throw new Error(`No GL account mapping found for service ${serviceSale.service_id}`);
      }

      const glAccount = mapping.data.gl_account;
      
      // Services are typically recognized immediately unless prepaid
      const isDeferred = serviceSale.is_prepaid || false;
      
      const transaction = {
        transaction_date: serviceSale.sale_date || new Date().toISOString(),
        source_type: 'service',
        source_id: serviceSale.service_id,
        source_name: serviceSale.service_name,
        member_id: serviceSale.member_id,
        amount: serviceSale.amount,
        gl_account_id: glAccount.id,
        payment_method: serviceSale.payment_method,
        payment_reference: serviceSale.payment_reference,
        invoice_number: serviceSale.invoice_number,
        description: `Service Sale - ${serviceSale.service_name}`,
        created_by: serviceSale.created_by
      };

      // Handle deferred revenue for prepaid services
      if (isDeferred) {
        transaction.deferred_revenue_account_id = await this.getDeferredRevenueAccountId();
        
        await this.createDeferredRevenueTracking({
          member_id: serviceSale.member_id,
          source_type: 'service',
          source_id: serviceSale.service_id,
          total_amount: serviceSale.amount,
          recognition_method: 'usage_based'
        });
      }

      // Insert the transaction
      const { data: transactionData, error } = await supabase
        .from('revenue_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;

      // Post to GL
      if (serviceSale.post_immediately !== false) {
        await this.postToGeneralLedger(transactionData);
      }

      return { success: true, data: transactionData };
    } catch (error) {
      console.error('Error processing service sale:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a POS item sale transaction
   */
  static async processPOSSale(posSale) {
    try {
      // Get revenue mapping for this POS item
      const mapping = await RevenueMappingService.getRevenueMapping('pos_item', posSale.item_id);
      
      if (!mapping.success || !mapping.data) {
        throw new Error(`No GL account mapping found for POS item ${posSale.item_id}`);
      }

      const glAccount = mapping.data.gl_account;
      
      const transaction = {
        transaction_date: posSale.sale_date || new Date().toISOString(),
        source_type: 'pos_item',
        source_id: posSale.item_id,
        source_name: posSale.item_name,
        member_id: posSale.member_id,
        amount: posSale.amount,
        gl_account_id: glAccount.id,
        payment_method: posSale.payment_method,
        payment_reference: posSale.payment_reference,
        invoice_number: posSale.invoice_number,
        description: `POS Sale - ${posSale.item_name} (Qty: ${posSale.quantity})`,
        created_by: posSale.created_by
      };

      // POS items are typically recognized immediately
      const { data: transactionData, error } = await supabase
        .from('revenue_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;

      // Post to GL
      if (posSale.post_immediately !== false) {
        await this.postToGeneralLedger(transactionData);
      }

      return { success: true, data: transactionData };
    } catch (error) {
      console.error('Error processing POS sale:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a refund transaction
   */
  static async processRefund(refundData) {
    try {
      // Get the original transaction
      const { data: originalTransaction, error: fetchError } = await supabase
        .from('revenue_transactions')
        .select('*')
        .eq('id', refundData.original_transaction_id)
        .single();

      if (fetchError) throw fetchError;

      // Create refund transaction
      const refundTransaction = {
        transaction_date: refundData.refund_date || new Date().toISOString(),
        source_type: originalTransaction.source_type,
        source_id: originalTransaction.source_id,
        source_name: originalTransaction.source_name,
        member_id: originalTransaction.member_id,
        amount: -Math.abs(refundData.amount), // Negative amount for refund
        gl_account_id: originalTransaction.gl_account_id,
        payment_method: refundData.payment_method,
        payment_reference: refundData.payment_reference,
        description: `Refund - ${originalTransaction.description}`,
        is_refund: true,
        refund_reference: originalTransaction.id,
        created_by: refundData.created_by
      };

      const { data: transactionData, error } = await supabase
        .from('revenue_transactions')
        .insert(refundTransaction)
        .select()
        .single();

      if (error) throw error;

      // Post to GL
      await this.postToGeneralLedger(transactionData);

      return { success: true, data: transactionData };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Determine if revenue should be deferred
   */
  static shouldDeferRevenue(sourceType, saleData) {
    switch (sourceType) {
      case 'membership':
        // Defer if membership duration is more than 1 month
        return saleData.duration_months > 1;
      case 'service':
        // Defer if service is prepaid or has multiple sessions
        return saleData.is_prepaid || saleData.session_count > 1;
      default:
        return false;
    }
  }

  /**
   * Get the deferred revenue account ID
   */
  static async getDeferredRevenueAccountId() {
    const { data, error } = await supabase
      .from('accounting_accounts')
      .select('id')
      .eq('account_number', '2100')
      .eq('account_name', 'Deferred Revenue')
      .single();

    if (error) throw new Error('Deferred Revenue account not found');
    return data.id;
  }

  /**
   * Get the accounts receivable account ID
   */
  static async getAccountsReceivableAccountId() {
    const { data, error } = await supabase
      .from('accounting_accounts')
      .select('id')
      .eq('account_number', '1200')
      .eq('account_name', 'Accounts Receivable')
      .single();

    if (error) throw new Error('Accounts Receivable account not found');
    return data.id;
  }

  /**
   * Create deferred revenue tracking record
   */
  static async createDeferredRevenueTracking(trackingData) {
    const { data, error } = await supabase
      .from('deferred_revenue_tracking')
      .insert({
        member_id: trackingData.member_id,
        source_type: trackingData.source_type,
        source_id: trackingData.source_id,
        total_amount: trackingData.total_amount,
        remaining_amount: trackingData.total_amount,
        recognition_start_date: trackingData.recognition_start_date,
        recognition_end_date: trackingData.recognition_end_date,
        recognition_method: trackingData.recognition_method
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create accounts receivable tracking record
   */
  static async createAccountsReceivableTracking(arData) {
    const { data, error } = await supabase
      .from('accounts_receivable_tracking')
      .insert({
        member_id: arData.member_id,
        invoice_number: arData.invoice_number,
        invoice_date: arData.invoice_date,
        due_date: arData.due_date,
        original_amount: arData.original_amount,
        outstanding_amount: arData.outstanding_amount,
        ar_account_id: await this.getAccountsReceivableAccountId()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Post transaction to General Ledger
   */
  static async postToGeneralLedger(transaction) {
    try {
      // Update transaction as posted
      await supabase
        .from('revenue_transactions')
        .update({
          posted_to_gl: true,
          posted_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      // Here you would integrate with your GL posting system
      // For now, we'll just log the posting
      console.log('Posted to GL:', {
        account: transaction.gl_account_id,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.transaction_date
      });

      return { success: true };
    } catch (error) {
      console.error('Error posting to GL:', error);
      return { success: false, error: error.message };
    }
  }
}

export default TransactionProcessor;
