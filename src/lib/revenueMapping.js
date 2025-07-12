/**
 * Revenue Mapping System
 * Connects all revenue-generating activities to Chart of Accounts GL accounts
 */

import { supabase } from './supabaseClient';

// Revenue Source Types
export const REVENUE_SOURCE_TYPES = {
  MEMBERSHIP: 'membership',
  POS_ITEM: 'pos_item',
  SERVICE: 'service',
  ADDON: 'addon',
  GUEST_FEE: 'guest_fee',
  LATE_FEE: 'late_fee',
  ADJUSTMENT: 'adjustment',
  OTHER: 'other'
};

// Standard GL Account Categories for Revenue Mapping
export const GL_ACCOUNT_CATEGORIES = {
  MEMBERSHIP_REVENUE: {
    code: '4100',
    name: 'Membership Revenue',
    subcategories: {
      MONTHLY: '4110',
      ANNUAL: '4120',
      FAMILY: '4130',
      STUDENT: '4140',
      CORPORATE: '4150'
    }
  },
  SERVICE_REVENUE: {
    code: '4200',
    name: 'Service Revenue',
    subcategories: {
      PERSONAL_TRAINING: '4210',
      GROUP_CLASSES: '4220',
      MASSAGE: '4230',
      NUTRITION: '4240',
      CHILDCARE: '4250'
    }
  },
  RETAIL_REVENUE: {
    code: '4300',
    name: 'Retail Revenue',
    subcategories: {
      SUPPLEMENTS: '4310',
      APPAREL: '4320',
      EQUIPMENT: '4330',
      FOOD_BEVERAGE: '4340'
    }
  },
  FEE_REVENUE: {
    code: '4400',
    name: 'Fee Revenue',
    subcategories: {
      GUEST_FEES: '4410',
      LATE_FEES: '4420',
      PROCESSING_FEES: '4430',
      CANCELLATION_FEES: '4440'
    }
  },
  OTHER_REVENUE: {
    code: '4500',
    name: 'Other Revenue',
    subcategories: {
      EVENTS: '4510',
      RENTALS: '4520',
      PARTNERSHIPS: '4530',
      MISCELLANEOUS: '4540'
    }
  }
};

// Financial Account Types
export const FINANCIAL_ACCOUNT_TYPES = {
  ACCOUNTS_RECEIVABLE: {
    code: '1200',
    name: 'Accounts Receivable',
    type: 'Asset',
    normal_balance: 'debit'
  },
  DEFERRED_REVENUE: {
    code: '2100',
    name: 'Deferred Revenue',
    type: 'Liability',
    normal_balance: 'credit'
  },
  CASH_CHECKING: {
    code: '1100',
    name: 'Cash - Checking Account',
    type: 'Asset',
    normal_balance: 'debit'
  },
  CREDIT_CARD_CLEARING: {
    code: '1150',
    name: 'Credit Card Clearing',
    type: 'Asset',
    normal_balance: 'debit'
  }
};

/**
 * Revenue Mapping Service Class
 */
export class RevenueMappingService {
  
  /**
   * Create a revenue mapping between a source and GL account
   */
  static async createRevenueMapping(mapping) {
    try {
      const { data, error } = await supabase
        .from('revenue_mappings')
        .insert({
          source_type: mapping.source_type,
          source_id: mapping.source_id,
          gl_account_id: mapping.gl_account_id,
          percentage: mapping.percentage || 100,
          is_active: mapping.is_active !== false,
          effective_date: mapping.effective_date || new Date().toISOString(),
          created_by: mapping.created_by
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating revenue mapping:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get revenue mapping for a specific source
   */
  static async getRevenueMapping(sourceType, sourceId) {
    try {
      const { data, error } = await supabase
        .from('revenue_mappings')
        .select(`
          *,
          gl_account:accounting_accounts(*)
        `)
        .eq('source_type', sourceType)
        .eq('source_id', sourceId)
        .eq('is_active', true)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting revenue mapping:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all revenue mappings for a source type
   */
  static async getRevenueMappingsByType(sourceType) {
    try {
      const { data, error } = await supabase
        .from('revenue_mappings')
        .select(`
          *,
          gl_account:accounting_accounts(*),
          source_name
        `)
        .eq('source_type', sourceType)
        .eq('is_active', true)
        .order('source_name');

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting revenue mappings by type:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update revenue mapping
   */
  static async updateRevenueMapping(mappingId, updates) {
    try {
      const { data, error } = await supabase
        .from('revenue_mappings')
        .update(updates)
        .eq('id', mappingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating revenue mapping:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate that all revenue sources have GL account mappings
   */
  static async validateRevenueMappings() {
    try {
      const validationResults = {
        membership_types: [],
        services: [],
        pos_items: [],
        unmapped_sources: []
      };

      // Check membership types
      const { data: membershipTypes } = await supabase
        .from('membership_types')
        .select('id, name')
        .eq('available_for_sale', true);

      for (const membershipType of membershipTypes || []) {
        const mapping = await this.getRevenueMapping('membership', membershipType.id);
        if (!mapping.data) {
          validationResults.unmapped_sources.push({
            type: 'membership',
            id: membershipType.id,
            name: membershipType.name
          });
        }
        validationResults.membership_types.push({
          ...membershipType,
          has_mapping: !!mapping.data
        });
      }

      // Check services
      const { data: services } = await supabase
        .from('services')
        .select('id, name')
        .eq('is_active', true);

      for (const service of services || []) {
        const mapping = await this.getRevenueMapping('service', service.id);
        if (!mapping.data) {
          validationResults.unmapped_sources.push({
            type: 'service',
            id: service.id,
            name: service.name
          });
        }
        validationResults.services.push({
          ...service,
          has_mapping: !!mapping.data
        });
      }

      return { success: true, data: validationResults };
    } catch (error) {
      console.error('Error validating revenue mappings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-assign GL accounts based on source type and name
   */
  static async autoAssignGLAccounts() {
    try {
      const assignments = [];
      
      // Auto-assign membership types
      const { data: membershipTypes } = await supabase
        .from('membership_types')
        .select('id, name, category')
        .eq('available_for_sale', true);

      for (const membershipType of membershipTypes || []) {
        const existingMapping = await this.getRevenueMapping('membership', membershipType.id);
        if (!existingMapping.data) {
          const suggestedAccount = this.suggestGLAccount('membership', membershipType);
          if (suggestedAccount) {
            assignments.push({
              source_type: 'membership',
              source_id: membershipType.id,
              source_name: membershipType.name,
              suggested_account: suggestedAccount
            });
          }
        }
      }

      return { success: true, data: assignments };
    } catch (error) {
      console.error('Error auto-assigning GL accounts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Suggest GL account based on source type and characteristics
   */
  static suggestGLAccount(sourceType, source) {
    const name = source.name?.toLowerCase() || '';
    
    switch (sourceType) {
      case 'membership':
        if (name.includes('annual') || name.includes('yearly')) {
          return GL_ACCOUNT_CATEGORIES.MEMBERSHIP_REVENUE.subcategories.ANNUAL;
        } else if (name.includes('family')) {
          return GL_ACCOUNT_CATEGORIES.MEMBERSHIP_REVENUE.subcategories.FAMILY;
        } else if (name.includes('student')) {
          return GL_ACCOUNT_CATEGORIES.MEMBERSHIP_REVENUE.subcategories.STUDENT;
        } else if (name.includes('corporate')) {
          return GL_ACCOUNT_CATEGORIES.MEMBERSHIP_REVENUE.subcategories.CORPORATE;
        } else {
          return GL_ACCOUNT_CATEGORIES.MEMBERSHIP_REVENUE.subcategories.MONTHLY;
        }
        
      case 'service':
        if (name.includes('personal') || name.includes('training')) {
          return GL_ACCOUNT_CATEGORIES.SERVICE_REVENUE.subcategories.PERSONAL_TRAINING;
        } else if (name.includes('class') || name.includes('group')) {
          return GL_ACCOUNT_CATEGORIES.SERVICE_REVENUE.subcategories.GROUP_CLASSES;
        } else if (name.includes('massage')) {
          return GL_ACCOUNT_CATEGORIES.SERVICE_REVENUE.subcategories.MASSAGE;
        } else if (name.includes('nutrition')) {
          return GL_ACCOUNT_CATEGORIES.SERVICE_REVENUE.subcategories.NUTRITION;
        } else if (name.includes('childcare') || name.includes('kids')) {
          return GL_ACCOUNT_CATEGORIES.SERVICE_REVENUE.subcategories.CHILDCARE;
        }
        break;
        
      case 'pos_item':
        if (name.includes('supplement') || name.includes('protein')) {
          return GL_ACCOUNT_CATEGORIES.RETAIL_REVENUE.subcategories.SUPPLEMENTS;
        } else if (name.includes('apparel') || name.includes('shirt') || name.includes('clothing')) {
          return GL_ACCOUNT_CATEGORIES.RETAIL_REVENUE.subcategories.APPAREL;
        } else if (name.includes('equipment') || name.includes('gear')) {
          return GL_ACCOUNT_CATEGORIES.RETAIL_REVENUE.subcategories.EQUIPMENT;
        } else if (name.includes('food') || name.includes('drink') || name.includes('beverage')) {
          return GL_ACCOUNT_CATEGORIES.RETAIL_REVENUE.subcategories.FOOD_BEVERAGE;
        }
        break;
    }
    
    return null;
  }
}

export default RevenueMappingService;
