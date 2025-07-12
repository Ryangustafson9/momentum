/**
 * Revenue Validation Service
 * Ensures all revenue sources have proper GL account mappings and validates transactions
 */

import { supabase } from './supabaseClient';
import { RevenueMappingService } from './revenueMapping';

export class RevenueValidationService {
  
  /**
   * Validate that a revenue source has a GL account mapping
   */
  static async validateRevenueSourceMapping(sourceType, sourceId) {
    try {
      const mapping = await RevenueMappingService.getRevenueMapping(sourceType, sourceId);
      
      if (!mapping.success || !mapping.data) {
        return {
          isValid: false,
          error: `No GL account mapping found for ${sourceType} with ID ${sourceId}`,
          code: 'MISSING_MAPPING'
        };
      }

      // Validate that the GL account exists and is active
      const { data: glAccount, error } = await supabase
        .from('accounting_accounts')
        .select('id, account_name, is_active')
        .eq('id', mapping.data.gl_account_id)
        .single();

      if (error || !glAccount) {
        return {
          isValid: false,
          error: `GL account not found for mapping`,
          code: 'INVALID_GL_ACCOUNT'
        };
      }

      if (!glAccount.is_active) {
        return {
          isValid: false,
          error: `GL account "${glAccount.account_name}" is inactive`,
          code: 'INACTIVE_GL_ACCOUNT'
        };
      }

      return {
        isValid: true,
        mapping: mapping.data,
        glAccount: glAccount
      };
    } catch (error) {
      console.error('Error validating revenue source mapping:', error);
      return {
        isValid: false,
        error: error.message,
        code: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Validate a transaction before processing
   */
  static async validateTransaction(transaction) {
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate required fields
    const requiredFields = ['source_type', 'source_id', 'amount', 'member_id'];
    for (const field of requiredFields) {
      if (!transaction[field]) {
        validationResults.errors.push(`Missing required field: ${field}`);
        validationResults.isValid = false;
      }
    }

    // Validate amount
    if (transaction.amount && (isNaN(transaction.amount) || transaction.amount <= 0)) {
      validationResults.errors.push('Transaction amount must be a positive number');
      validationResults.isValid = false;
    }

    // Validate revenue source mapping
    if (transaction.source_type && transaction.source_id) {
      const mappingValidation = await this.validateRevenueSourceMapping(
        transaction.source_type, 
        transaction.source_id
      );
      
      if (!mappingValidation.isValid) {
        validationResults.errors.push(mappingValidation.error);
        validationResults.isValid = false;
      }
    }

    // Validate member exists
    if (transaction.member_id) {
      const { data: member, error } = await supabase
        .from('members')
        .select('id, status')
        .eq('id', transaction.member_id)
        .single();

      if (error || !member) {
        validationResults.errors.push('Member not found');
        validationResults.isValid = false;
      } else if (member.status === 'cancelled') {
        validationResults.warnings.push('Member account is cancelled');
      }
    }

    // Validate payment method if provided
    if (transaction.payment_method) {
      const validPaymentMethods = ['cash', 'credit_card', 'debit_card', 'check', 'ach', 'bank_transfer'];
      if (!validPaymentMethods.includes(transaction.payment_method)) {
        validationResults.warnings.push(`Unusual payment method: ${transaction.payment_method}`);
      }
    }

    return validationResults;
  }

  /**
   * Validate all revenue sources have mappings
   */
  static async validateAllRevenueSources() {
    try {
      const validationReport = {
        summary: {
          total_sources: 0,
          mapped_sources: 0,
          unmapped_sources: 0,
          completion_percentage: 0
        },
        unmapped_sources: [],
        inactive_mappings: [],
        invalid_mappings: []
      };

      // Check membership types
      const { data: membershipTypes } = await supabase
        .from('membership_types')
        .select('id, name, available_for_sale')
        .eq('available_for_sale', true);

      for (const membership of membershipTypes || []) {
        validationReport.summary.total_sources++;
        
        const validation = await this.validateRevenueSourceMapping('membership', membership.id);
        if (validation.isValid) {
          validationReport.summary.mapped_sources++;
        } else {
          validationReport.summary.unmapped_sources++;
          validationReport.unmapped_sources.push({
            type: 'membership',
            id: membership.id,
            name: membership.name,
            error: validation.error,
            code: validation.code
          });
        }
      }

      // Check services
      const { data: services } = await supabase
        .from('services')
        .select('id, name, is_active')
        .eq('is_active', true);

      for (const service of services || []) {
        validationReport.summary.total_sources++;
        
        const validation = await this.validateRevenueSourceMapping('service', service.id);
        if (validation.isValid) {
          validationReport.summary.mapped_sources++;
        } else {
          validationReport.summary.unmapped_sources++;
          validationReport.unmapped_sources.push({
            type: 'service',
            id: service.id,
            name: service.name,
            error: validation.error,
            code: validation.code
          });
        }
      }

      // Check POS items (if they exist)
      const { data: posItems } = await supabase
        .from('pos_items')
        .select('id, name, is_active')
        .eq('is_active', true);

      for (const item of posItems || []) {
        validationReport.summary.total_sources++;
        
        const validation = await this.validateRevenueSourceMapping('pos_item', item.id);
        if (validation.isValid) {
          validationReport.summary.mapped_sources++;
        } else {
          validationReport.summary.unmapped_sources++;
          validationReport.unmapped_sources.push({
            type: 'pos_item',
            id: item.id,
            name: item.name,
            error: validation.error,
            code: validation.code
          });
        }
      }

      // Calculate completion percentage
      if (validationReport.summary.total_sources > 0) {
        validationReport.summary.completion_percentage = Math.round(
          (validationReport.summary.mapped_sources / validationReport.summary.total_sources) * 100
        );
      }

      return { success: true, data: validationReport };
    } catch (error) {
      console.error('Error validating all revenue sources:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for orphaned transactions (transactions without valid mappings)
   */
  static async findOrphanedTransactions() {
    try {
      const { data: transactions, error } = await supabase
        .from('revenue_transactions')
        .select('id, source_type, source_id, source_name, amount, transaction_date')
        .eq('posted_to_gl', false);

      if (error) throw error;

      const orphanedTransactions = [];

      for (const transaction of transactions || []) {
        const validation = await this.validateRevenueSourceMapping(
          transaction.source_type, 
          transaction.source_id
        );
        
        if (!validation.isValid) {
          orphanedTransactions.push({
            ...transaction,
            validation_error: validation.error,
            error_code: validation.code
          });
        }
      }

      return { success: true, data: orphanedTransactions };
    } catch (error) {
      console.error('Error finding orphaned transactions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate financial account setup
   */
  static async validateFinancialAccountSetup() {
    try {
      const requiredAccounts = [
        { number: '1200', name: 'Accounts Receivable', type: 'Asset' },
        { number: '2100', name: 'Deferred Revenue', type: 'Liability' },
        { number: '1100', name: 'Cash - Checking Account', type: 'Asset' },
        { number: '1150', name: 'Credit Card Clearing', type: 'Asset' }
      ];

      const validationResults = {
        isValid: true,
        missing_accounts: [],
        inactive_accounts: []
      };

      for (const requiredAccount of requiredAccounts) {
        const { data: account, error } = await supabase
          .from('accounting_accounts')
          .select('id, account_number, account_name, account_type, is_active')
          .eq('account_number', requiredAccount.number)
          .single();

        if (error || !account) {
          validationResults.missing_accounts.push(requiredAccount);
          validationResults.isValid = false;
        } else if (!account.is_active) {
          validationResults.inactive_accounts.push(account);
          validationResults.isValid = false;
        }
      }

      return { success: true, data: validationResults };
    } catch (error) {
      console.error('Error validating financial account setup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate revenue mapping compliance report
   */
  static async generateComplianceReport() {
    try {
      const [
        allSourcesValidation,
        orphanedTransactions,
        financialAccountValidation
      ] = await Promise.all([
        this.validateAllRevenueSources(),
        this.findOrphanedTransactions(),
        this.validateFinancialAccountSetup()
      ]);

      const complianceReport = {
        generated_at: new Date().toISOString(),
        overall_compliance: true,
        revenue_sources: allSourcesValidation.data,
        orphaned_transactions: orphanedTransactions.data,
        financial_accounts: financialAccountValidation.data,
        recommendations: []
      };

      // Determine overall compliance
      if (allSourcesValidation.data.summary.completion_percentage < 100) {
        complianceReport.overall_compliance = false;
        complianceReport.recommendations.push(
          'Complete revenue source mappings to ensure all transactions can be properly categorized'
        );
      }

      if (orphanedTransactions.data.length > 0) {
        complianceReport.overall_compliance = false;
        complianceReport.recommendations.push(
          'Resolve orphaned transactions by creating proper revenue mappings'
        );
      }

      if (!financialAccountValidation.data.isValid) {
        complianceReport.overall_compliance = false;
        complianceReport.recommendations.push(
          'Set up required financial accounts (AR, Deferred Revenue, Cash accounts)'
        );
      }

      return { success: true, data: complianceReport };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return { success: false, error: error.message };
    }
  }
}

export default RevenueValidationService;
